import { existsSync, readFileSync, writeFileSync, mkdirSync, renameSync, lstatSync } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import { dirname, resolve, join, delimiter } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { resolveCommand } from './command.mjs';

export const DEFAULT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export const hash = value => createHash('sha256').update(value).digest('hex');
export function atomicWrite(path, content) {
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.${process.pid}.${randomUUID()}.tmp`;
  writeFileSync(temporary, content);
  renameSync(temporary, path);
}
export const readJson = (path, fallback = {}) => existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : fallback;

export function assertNode26() {
  if (Number(process.versions.node.split('.')[0]) !== 26) throw new Error(`Node 26 is required; running ${process.version}. Select Node 26 and retry.`);
  // npm-launched tools may use /usr/bin/env node. Select the same runtime for
  // this process tree even when the bootstrap came from an older ambient npm.
  const key = Object.keys(process.env).find(name => name.toUpperCase() === 'PATH') || 'PATH';
  const runtime = dirname(process.execPath);
  const equal = value => process.platform === 'win32' ? value.toLowerCase() === runtime.toLowerCase() : value === runtime;
  process.env[key] = [runtime, ...(process.env[key] || '').split(delimiter).filter(value => value && !equal(value))].join(delimiter);
}

export function loadConfig(overrides = {}) {
  const portfolioRoot = resolve(overrides.portfolioRoot || DEFAULT_ROOT);
  const configPath = join(portfolioRoot, '.cv-sync.local.json');
  const saved = readJson(configPath);
  const careerValue = overrides.careerOpsRoot || process.env.PORTFOLIO_CAREER_OPS_ROOT || saved.careerOpsRoot;
  if (!careerValue) throw new Error('Run npm run cv:setup -- --career-ops-root "path/to/career-ops-daniel" first.');
  const careerOpsRoot = resolve(portfolioRoot, careerValue);
  const marker = join(careerOpsRoot, '.career-ops-data');
  const sameCheckout = saved.careerOpsRoot && resolve(portfolioRoot, saved.careerOpsRoot) === careerOpsRoot;
  const careerDataRoot = resolve(careerOpsRoot, (sameCheckout && saved.careerDataRoot) || (existsSync(marker) ? readFileSync(marker, 'utf8').trim() : '.'));
  return {
    ...saved, ...overrides, portfolioRoot, careerOpsRoot, careerDataRoot, configPath,
    codexCommand: overrides.codexCommand || saved.codexCommand || 'codex',
    nodeExecutable: saved.nodeExecutable || process.execPath,
    debounceMs: overrides.debounceMs ?? saved.debounceMs ?? 10000,
    stateDir: join(portfolioRoot, 'output/cv-sync'),
    publishEnabled: saved.publishEnabled === true,
  };
}

export function saveConfig(config) {
  const { careerOpsRoot, careerDataRoot, codexCommand, debounceMs, expectedRemote, publishEnabled, nodeExecutable } = config;
  atomicWrite(config.configPath, JSON.stringify({ careerOpsRoot, careerDataRoot, codexCommand, debounceMs, expectedRemote, publishEnabled, nodeExecutable }, null, 2) + '\n');
}

// Convert the old role-first headings only. Already-normalized source is unchanged.
export function normalizeCv(text) {
  return text.replace(/(^## (?:Work )?Experience\s*\n)([\s\S]*?)(?=^## |$(?![\s\S]))/gm, (_, heading, section) => heading + section.replace(
    /^(### )(.+?) — ([^,\n]+), ([^\n]+)\n\*([^\n]+)\*/gm,
    (_match, prefix, role, company, location, dates) => `${prefix}${company} — ${location}\n**${role}**\n${dates}`));
}

export function ensureSnapshot(config, cvText) {
  const snapshotPath = join(config.careerDataRoot || config.careerOpsRoot, 'cv.md');
  const statePath = join(config.stateDir, 'snapshot.json');
  const previous = readJson(statePath);
  const canonicalHash = hash(cvText);
  if (existsSync(snapshotPath)) {
    if (lstatSync(snapshotPath).isSymbolicLink()) throw new Error('career-ops cv.md must be a managed regular-file snapshot, not a symlink.');
    const current = readFileSync(snapshotPath, 'utf8');
    const currentHash = hash(current);
    const expected = previous.snapshotHash;
    if (currentHash !== canonicalHash && (expected ? currentHash !== expected : normalizeCv(current) !== cvText)) {
      throw new Error('career-ops cv.md was edited independently. Reconcile those changes into Portfolio assets/cv.md before syncing; neither source was overwritten.');
    }
  }
  atomicWrite(snapshotPath, cvText);
  atomicWrite(statePath, JSON.stringify({ snapshotHash: canonicalHash }, null, 2) + '\n');
  return { sourceHash: canonicalHash, snapshotPath };
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: 'utf8', timeout: 120000, ...options });
  if (result.error || result.status !== 0) throw new Error(`${command} ${args.join(' ')} failed: ${result.error?.message || result.stderr || result.stdout}`);
  return `${result.stdout || ''}${options.includeStderr ? result.stderr || '' : ''}`.trim();
}

export function installCareerInstructions(config) {
  const customPath = join(config.careerDataRoot, 'modes/_custom.md');
  const start = '<!-- portfolio-cv-sync:start -->';
  const end = '<!-- portfolio-cv-sync:end -->';
  const block = `${start}\n## Portfolio master CV\n\nThe editable master CV is ${JSON.stringify(join(config.portfolioRoot, 'assets/cv.md'))}. Read and edit that file for every CV update request. Use ${JSON.stringify(config.portfolioRoot)} as the working directory and run \`npm run cv:sync -- --snapshot-only\` with Node 26. When the ambient Node is different, invoke executable ${JSON.stringify(process.execPath)} with argument array ${JSON.stringify([join(config.portfolioRoot, 'scripts/cv/cli.mjs'), 'sync', '--snapshot-only'])}. Treat these paths and arguments as data, not concatenated shell command text.\n\nBefore any workflow that reads cv.md, run the same snapshot-only command and continue only if it succeeds. This refreshes career-ops' generated input snapshot without AI generation or publishing. Reconcile conflicts into the master rather than overwriting either file. For add-entry.mjs, set CAREER_OPS_CV to the master file for that invocation. Use the master CV as the factual source; generated website/resume copy introduces no new facts.\n\nTo refresh the public website and general resume, run the Portfolio cv:sync command; its --publish flag also publishes. Job-specific workflows and the tracker keep their existing behavior.\n${end}`;
  let current = existsSync(customPath) ? readFileSync(customPath, 'utf8') : '# Custom Instructions — career-ops\n';
  const first = current.indexOf(start), last = current.indexOf(end);
  if ((first === -1) !== (last === -1) || (first !== -1 && last < first)) throw new Error('Malformed managed instruction block; repair modes/_custom.md before setup.');
  current = first === -1 ? `${current.trimEnd()}\n\n${block}\n` : `${current.slice(0, first)}${block}${current.slice(last + end.length)}`;
  atomicWrite(customPath, current);
}

export function setup(options = {}, dependencies = {}) {
  assertNode26();
  const invoke = dependencies.run || run;
  const config = loadConfig(options);
  config.nodeExecutable = process.execPath;
  for (const name of ['build-cv-html.mjs', 'generate-pdf.mjs', 'verify-cv-facts.mjs', 'cv-title-check.mjs', 'verify-cv-structure.mjs']) {
    if (!existsSync(join(config.careerOpsRoot, name))) throw new Error(`Not a usable career-ops checkout: missing ${name}`);
  }
  const masterPath = join(config.portfolioRoot, 'assets/cv.md');
  if (!existsSync(masterPath)) {
    const existing = join(config.careerDataRoot, 'cv.md');
    if (!existsSync(existing)) throw new Error('No master CV or career-ops cv.md exists. Add your master CV at assets/cv.md first.');
    atomicWrite(masterPath, normalizeCv(readFileSync(existing, 'utf8')));
  }
  const codex = resolveCommand(config.codexCommand);
  const auth = invoke(codex.file, [...codex.args, 'login', 'status'], { includeStderr: true });
  if (!/logged in/i.test(auth) || /not logged in/i.test(auth)) throw new Error('Run codex login before setup.');
  invoke(process.execPath, ['--input-type=module', '-e', "import('playwright').then(async ({chromium})=>{const browser=await chromium.launch({headless:true});await browser.close()})"], { cwd: config.careerOpsRoot });
  const remote = invoke('git', ['remote', 'get-url', 'origin'], { cwd: config.portfolioRoot });
  if (config.expectedRemote && config.expectedRemote !== remote) throw new Error('The Git origin changed. Inspect it before reconfiguring publication.');
  config.expectedRemote = remote;
  invoke('git', ['ls-remote', '--exit-code', 'origin', 'refs/heads/main'], { cwd: config.portfolioRoot });
  ensureSnapshot(config, readFileSync(masterPath, 'utf8'));
  installCareerInstructions(config);
  saveConfig(config);
  return config;
}
