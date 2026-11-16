import test from 'node:test';
import assert from 'node:assert/strict';
import { chmod, mkdir, mkdtemp, readFile, readdir, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateCandidate, reviewCandidate, sanitizeWorkerEnv } from '../scripts/cv/worker.mjs';

const schemaPath = fileURLToPath(new URL('../scripts/cv/generation.schema.json', import.meta.url));
const schema = JSON.parse(await readFile(schemaPath, 'utf8'));

function example(node) {
  if (node.enum) return node.enum[0];
  if (Array.isArray(node.type) && node.type.includes('null')) return null;
  if (node.type === 'object') return Object.fromEntries(Object.entries(node.properties).map(([key, child]) => [key, example(child)]));
  if (node.type === 'array') return [example(node.items)];
  if (node.type === 'boolean') return true;
  return 'Supported CV text';
}

async function fixture(t, response, options = {}) {
  const root = await mkdtemp(join(tmpdir(), 'cv-worker-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const portfolioRoot = join(root, 'portfolio with spaces');
  const runDir = join(root, 'runs with spaces');
  await mkdir(join(portfolioRoot, 'src/content'), { recursive: true });
  await writeFile(join(portfolioRoot, 'src/content/portfolio.json'), JSON.stringify({ profile: { name: 'Previous editorial example' } }));
  const codexCommand = join(root, 'mock codex.mjs');
  const body = `#!${process.execPath}
import { readFile, writeFile } from 'node:fs/promises';
const args = process.argv.slice(2);
const input = await new Promise(resolve => { let text = ''; process.stdin.setEncoding('utf8'); process.stdin.on('data', chunk => text += chunk); process.stdin.on('end', () => resolve(text)); });
await writeFile('invocation.json', JSON.stringify({ args, input, env: process.env, cwd: process.cwd() }));
${options.noise ? "process.stdout.write('x'.repeat(9 * 1024 * 1024)); await new Promise(resolve => setTimeout(resolve, 3000));" : ''}
${options.noOutput ? '' : `await writeFile(args[args.indexOf('--output-last-message') + 1], ${JSON.stringify(options.raw ?? JSON.stringify(response))});`}
process.exit(${options.exitCode ?? 0});
`;
  await writeFile(codexCommand, body);
  await chmod(codexCommand, 0o700);
  return { config: { portfolioRoot, codexCommand, careerOpsRoot: join(root, 'career-ops'), stateDir: join(root, 'state'), debounceMs: 10 }, runDir };
}

const request = { cvText: '# Ada Example\n## Experience\nEngineer at Example', sourceHash: 'abc123' };

test('generates a schema-checked bundle using stdin and a read-only, ephemeral Codex child', async t => {
  const { config, runDir } = await fixture(t, example(schema));
  const result = await generateCandidate(config, { ...request, runDir, feedback: ['Keep exact job titles'] });
  assert.equal(result.resume.lang, 'en');
  assert.equal(result.resume.page_format, 'letter');
  assert.equal(result.portfolio.caseStudies[0].contribution, undefined);
  assert.equal(result.portfolio.caseStudies[0].system, undefined);
  assert.equal(result.portfolio.experience[0].resumeDetails, undefined);
  const [task] = await readdir(runDir);
  const invocation = JSON.parse(await readFile(join(runDir, task, 'invocation.json'), 'utf8'));
  assert.deepEqual(invocation.args.slice(0, 6), ['exec', '--ephemeral', '--sandbox', 'read-only', '--skip-git-repo-check', '--color']);
  assert.equal(invocation.args.at(-1), '-');
  assert.equal(invocation.args.includes('--model'), false);
  assert.equal(invocation.args.some(arg => arg.includes('bypass')), false);
  assert.equal(invocation.args.includes('approval_policy="never"'), true);
  assert.equal(invocation.args.includes('web_search="disabled"'), true);
  assert.equal(invocation.args.includes('notify=[]'), true);
  const disabledFeatures = invocation.args.filter((_, index) => invocation.args[index - 1] === '--disable');
  assert.deepEqual(disabledFeatures, ['shell_tool', 'apps', 'plugins', 'hooks', 'browser_use', 'browser_use_external', 'browser_use_full_cdp_access', 'computer_use', 'multi_agent']);
  assert.equal(invocation.args.some(arg => arg.includes('Ada Example')), false);
  assert.equal(invocation.cwd, await realpath(join(runDir, task)));
  assert.equal(await realpath(dirname(invocation.args[invocation.args.indexOf('--output-last-message') + 1])), invocation.cwd);
  assert.match(invocation.input, /canonical CV is the only authority/);
  assert.match(invocation.input, /Previous editorial example/);
  assert.match(invocation.input, /Keep exact job titles/);
  assert.match(invocation.input, /Ada Example/);
});

test('sanitizes credentials and process hooks while preserving local login locations', () => {
  assert.deepEqual(sanitizeWorkerEnv({ HOME: '/user', CODEX_HOME: '/user/codex', PATH: '/bin', OPENAI_API_KEY: 'secret', CODEX_API_KEY: 'secret', GITHUB_TOKEN: 'secret', NODE_OPTIONS: '--import malicious.mjs', GIT_DIR: '/other' }), { HOME: '/user', CODEX_HOME: '/user/codex', PATH: '/bin' });
});

test('preserves mixed-case Windows environment names needed by Codex and native children', () => {
  assert.deepEqual(sanitizeWorkerEnv({ Path: 'C:\\node;C:\\Windows', SystemRoot: 'C:\\Windows', UserProfile: 'C:\\Users\\Daniel', OPENAI_API_KEY: 'secret' }), {
    Path: 'C:\\node;C:\\Windows', SystemRoot: 'C:\\Windows', UserProfile: 'C:\\Users\\Daniel',
  });
});

test('does not forward API key environment variables into the actual child', async t => {
  const previous = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = 'must-not-be-forwarded';
  t.after(() => { if (previous === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = previous; });
  const { config, runDir } = await fixture(t, example(schema));
  await generateCandidate(config, { ...request, runDir });
  const [task] = await readdir(runDir);
  const { env } = JSON.parse(await readFile(join(runDir, task, 'invocation.json'), 'utf8'));
  assert.equal(env.OPENAI_API_KEY, undefined);
  assert.equal(env.HOME, process.env.HOME);
});

test('rejects malformed JSON, missing responses, and nonzero exits', async t => {
  for (const options of [{ raw: 'not JSON' }, { noOutput: true }, { exitCode: 3 }]) {
    const { config, runDir } = await fixture(t, example(schema), options);
    await assert.rejects(generateCandidate(config, { ...request, runDir }), /did not return a valid JSON|exited with 3/);
  }
});

test('rejects unexpected fields and wrong renderer vocabulary rather than dropping content', async t => {
  const extra = example(schema);
  extra.resume.educations = [];
  const badType = example(schema);
  badType.resume.education[0].title = { degree: 'MS' };
  const missing = example(schema);
  delete missing.resume.experience[0].dates;
  for (const response of [extra, badType, missing]) {
    const { config, runDir } = await fixture(t, response);
    await assert.rejects(generateCandidate(config, { ...request, runDir }), /Invalid worker output/);
  }
});

test('accepts sparse projects without fabricated case-study details', async t => {
  const response = example(schema);
  const study = response.portfolio.caseStudies[0];
  study.details = [];
  study.technologies = [];
  const { config, runDir } = await fixture(t, response);
  const result = await generateCandidate(config, { ...request, runDir });
  assert.deepEqual(result.portfolio.caseStudies[0].details, []);
  assert.equal('challenge' in result.portfolio.caseStudies[0], false);
});

test('runs a separate factual reviewer and returns actionable rejection', async t => {
  const { config, runDir } = await fixture(t, { approved: false, issues: ['resume.experience[0].role: use the official CV title'] });
  const result = await reviewCandidate(config, { cvText: request.cvText, bundle: { portfolio: {}, resume: {} }, runDir });
  assert.equal(result.approved, false);
  assert.match(result.issues[0], /official CV title/);
  const [task] = await readdir(runDir);
  assert.match(task, /^review-/);
  const { input } = JSON.parse(await readFile(join(runDir, task, 'invocation.json'), 'utf8'));
  assert.match(input, /Independently review/);
  assert.match(input, /metric value, unit, attribution, and scope/);
  assert.equal(input.includes('Previous editorial example'), false);
});

test('rejects contradictory reviewer decisions', async t => {
  for (const response of [{ approved: true, issues: ['Unresolved claim'] }, { approved: false, issues: [] }, { approved: false, issues: [' '] }]) {
    const { config, runDir } = await fixture(t, response);
    await assert.rejects(reviewCandidate(config, { cvText: request.cvText, bundle: { portfolio: {}, resume: {} }, runDir }), /Reviewer returned|Reviewer rejected/);
  }
});

test('accepts a clean independent approval', async t => {
  const { config, runDir } = await fixture(t, { approved: true, issues: [] });
  assert.deepEqual(await reviewCandidate(config, { cvText: request.cvText, bundle: { portfolio: {}, resume: {} }, runDir }), { approved: true, issues: [] });
});

test('terminates workers that exceed bounded log output', async t => {
  const { config, runDir } = await fixture(t, example(schema), { noise: true });
  await assert.rejects(generateCandidate(config, { ...request, runDir }), /worker log size limit/);
});
