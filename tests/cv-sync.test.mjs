import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, writeFile, rm, chmod, rename } from 'node:fs/promises';
import { tmpdir, hostname } from 'node:os';
import path from 'node:path';
import { EventEmitter } from 'node:events';
import { sync, SourceChangedError, SyncBusyError, resolveNpmCommand } from '../scripts/cv/sync.mjs';
import { watch } from '../scripts/cv/watch.mjs';
import { PUBLICATION_PATHS, publishValidated } from '../scripts/cv/git.mjs';

const hash = contents => createHash('sha256').update(contents).digest('hex');
const initialPortfolio = '{"profile":{"name":"Original"}}\n';
const initialPdf = '%PDF-1.7\noriginal\n';
const git = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

test('npm resolution uses the current Node runtime and handles Windows without a shell', () => {
  const windowsCli = 'C:\\Program Files\\nodejs\\node_modules\\npm\\bin\\npm-cli.js';
  assert.deepEqual(resolveNpmCommand({ platform: 'win32', nodePath: 'C:\\Program Files\\nodejs\\node.exe', npmExecPath: undefined, fileExists: candidate => candidate === windowsCli }),
    ['C:\\Program Files\\nodejs\\node.exe', windowsCli]);
  const unixCli = '/opt/node/lib/node_modules/npm/bin/npm-cli.js';
  assert.deepEqual(resolveNpmCommand({ platform: 'linux', nodePath: '/opt/node/bin/node', npmExecPath: undefined, fileExists: candidate => candidate === unixCli }),
    ['/opt/node/bin/node', unixCli]);
  assert.deepEqual(resolveNpmCommand({ platform: 'linux', nodePath: '/node/bin/node', npmExecPath: '/custom/npm-cli.js', fileExists: candidate => candidate === '/custom/npm-cli.js' }),
    ['/node/bin/node', '/custom/npm-cli.js']);
  assert.throws(() => resolveNpmCommand({ platform: 'win32', nodePath: 'C:\\node\\node.exe', npmExecPath: undefined, fileExists: () => false }), /Cannot locate npm-cli/);
  assert.deepEqual(resolveNpmCommand({ platform: 'darwin', nodePath: '/node/bin/node', npmExecPath: undefined, fileExists: () => false }), ['npm']);
});

async function fixture(t) {
  const base = await mkdtemp(path.join(tmpdir(), 'portfolio-cv-sync-'));
  t.after(() => rm(base, { recursive: true, force: true }));
  const root = path.join(base, 'portfolio');
  const remote = path.join(base, 'remote.git');
  await mkdir(path.join(root, 'assets'), { recursive: true });
  await mkdir(path.join(root, 'src/content'), { recursive: true });
  await mkdir(path.join(root, 'public/static'), { recursive: true });
  await writeFile(path.join(root, '.gitignore'), 'output/\n');
  await writeFile(path.join(root, '.gitattributes'), 'assets/cv.md -text\nsrc/content/portfolio.json -text\npublic/static/resume.meta.json -text\n*.pdf binary\n');
  await writeFile(path.join(root, 'assets/cv.md'), '# Person\n\nOriginal source\n');
  await writeFile(path.join(root, 'src/content/portfolio.json'), initialPortfolio);
  await writeFile(path.join(root, 'public/static/resume.pdf'), initialPdf);
  git(root, 'init', '-b', 'main');
  git(root, 'config', 'user.name', 'CV Test');
  git(root, 'config', 'user.email', 'cv-test@example.test');
  git(root, 'add', '.');
  git(root, 'commit', '-m', 'Fixture baseline');
  git(base, 'init', '--bare', remote);
  git(root, 'remote', 'add', 'origin', remote);
  git(root, 'push', '-u', 'origin', 'main');
  const config = {
    portfolioRoot: root, careerOpsRoot: path.join(base, 'career'),
    stateDir: path.join(root, 'output/cv-sync'), debounceMs: 5,
    publishEnabled: true, expectedRemote: remote,
  };
  let calls = 0;
  const observed = [];
  const dependencies = {
    ensureSnapshot: async () => {},
    generateCandidate: async (_config, input) => {
      calls += 1; observed.push(input);
      return { portfolio: { profile: { name: input.cvText } }, resume: { summary: input.cvText } };
    },
    reviewCandidate: async () => ({ approved: true, issues: [] }),
    renderAndValidate: async (_config, { bundle, runDir }) => {
      const pdfPath = path.join(runDir, 'resume.pdf');
      const portfolioPath = path.join(runDir, 'portfolio.json');
      await writeFile(pdfPath, `%PDF-1.7\n${bundle.resume.summary}\n`);
      await writeFile(portfolioPath, `${JSON.stringify(bundle.portfolio)}\n`);
      return { pdfPath, portfolioPath, validation: { facts: 'pass' } };
    },
    validateSite: async () => {},
    git: { validateRemote: ({ fetchRemote, pushRemote, expectedRemote }) => fetchRemote === remote && pushRemote === remote && expectedRemote === remote },
  };
  return {
    root, remote, config, dependencies, observed,
    calls: () => calls,
    edit: text => writeFile(path.join(root, 'assets/cv.md'), text),
    state: async () => JSON.parse(await readFile(path.join(config.stateDir, 'state.json'), 'utf8')),
  };
}

async function assertOriginal(f) {
  assert.equal(await readFile(path.join(f.root, 'src/content/portfolio.json'), 'utf8'), initialPortfolio);
  assert.equal(await readFile(path.join(f.root, 'public/static/resume.pdf'), 'utf8'), initialPdf);
  await assert.rejects(readFile(path.join(f.root, 'public/static/resume.meta.json')), { code: 'ENOENT' });
}

test('local no-op remains publishable; one allowlisted commit reaches the remote', async t => {
  const f = await fixture(t);
  await f.edit('# Person\nUpdated source\n');
  assert.equal((await sync(f.config, {}, f.dependencies)).status, 'generated');
  assert.equal((await sync(f.config, {}, f.dependencies)).status, 'unchanged');
  assert.equal(f.calls(), 1);
  assert.equal((await f.state()).published, null);
  const before = git(f.root, 'rev-parse', 'HEAD');
  const result = await sync(f.config, { publish: true }, f.dependencies);
  assert.equal(result.status, 'published');
  assert.notEqual(result.commit, before);
  assert.equal(f.calls(), 1);
  assert.equal(git(f.root, 'rev-parse', 'HEAD'), git(f.root, 'ls-remote', 'origin', 'refs/heads/main').split(/\s/)[0]);
  assert.equal(git(f.root, 'status', '--porcelain'), '');
  assert.deepEqual(git(f.root, 'diff-tree', '--no-commit-id', '--name-only', '-r', result.commit).split('\n').sort(), [...PUBLICATION_PATHS].sort());
  const state = await f.state();
  const meta = JSON.parse(await readFile(path.join(f.root, 'public/static/resume.meta.json'), 'utf8'));
  assert.equal(state.local.sourceHash, meta.sourceHash);
  assert.equal(state.published.sourceHash, meta.sourceHash);
  assert.equal(meta.resumeSha256, hash(await readFile(path.join(f.root, 'public/static/resume.pdf'))));
});

test('one review correction includes feedback and does not render the rejected candidate', async t => {
  const f = await fixture(t);
  let reviews = 0;
  let renders = 0;
  const originalRender = f.dependencies.renderAndValidate;
  f.dependencies.reviewCandidate = async () => ++reviews === 1
    ? { approved: false, issues: ['Unbacked metric'] } : { approved: true, issues: [] };
  f.dependencies.renderAndValidate = async (...args) => { renders += 1; return originalRender(...args); };
  await sync(f.config, {}, f.dependencies);
  assert.equal(f.calls(), 2);
  assert.match(f.observed[1].feedback, /Unbacked metric/);
  assert.equal(renders, 1);
});

test('CRLF source provenance survives publication and checkout with autocrlf enabled', async t => {
  const f = await fixture(t);
  git(f.root, 'config', 'core.autocrlf', 'true');
  await f.edit('# Person\r\nWindows source edit\r\n');
  await sync(f.config, { publish: true }, f.dependencies);
  const meta = JSON.parse(await readFile(path.join(f.root, 'public/static/resume.meta.json'), 'utf8'));
  const committed = execFileSync('git', ['show', 'HEAD:assets/cv.md'], { cwd: f.root });
  assert.equal(meta.sourceHash, hash(committed));
  assert.equal(meta.sourceHash, hash(await readFile(path.join(f.root, 'assets/cv.md'))));
  git(f.root, 'checkout-index', '-f', '-a');
  assert.equal((await sync(f.config, {}, f.dependencies)).status, 'unchanged');
  assert.equal(f.calls(), 1);
});

test('two rejected reviews preserve the previous public artifacts', async t => {
  const f = await fixture(t);
  await f.edit('# Person\nUpdated source\n');
  f.dependencies.reviewCandidate = async () => ({ approved: false, issues: ['Unsupported title'] });
  await assert.rejects(sync(f.config, {}, f.dependencies), /one correction retry/);
  assert.equal(f.calls(), 2);
  await assertOriginal(f);
  assert.equal((await f.state()).local, null);
});

test('failed site checks roll back every promoted artifact after both attempts', async t => {
  const f = await fixture(t);
  f.dependencies.validateSite = async () => { throw new Error('Broken site type'); };
  await assert.rejects(sync(f.config, {}, f.dependencies), /Broken site type/);
  await assertOriginal(f);
  assert.equal((await f.state()).promotion, null);
  assert.equal((await f.state()).local, null);
});

test('a newer CV discards a stale candidate without consuming a correction attempt', async t => {
  const f = await fixture(t);
  const render = f.dependencies.renderAndValidate;
  f.dependencies.renderAndValidate = async (...args) => {
    const result = await render(...args);
    await f.edit('# Person\nNewer edit\n');
    return result;
  };
  await assert.rejects(sync(f.config, {}, f.dependencies), SourceChangedError);
  assert.equal(f.calls(), 1);
  await assertOriginal(f);
  f.dependencies.renderAndValidate = render;
  await sync(f.config, {}, f.dependencies);
  assert.match(await readFile(path.join(f.root, 'src/content/portfolio.json'), 'utf8'), /Newer edit/);
});

for (const staged of [false, true]) {
  test(`publication rejects unrelated ${staged ? 'staged' : 'dirty'} work before generation`, async t => {
    const f = await fixture(t);
    await f.edit('# Person\nCV edit\n');
    await writeFile(path.join(f.root, 'notes.txt'), 'User notes');
    if (staged) git(f.root, 'add', 'notes.txt');
    await assert.rejects(sync(f.config, { publish: true }, f.dependencies), /Unrelated work/);
    assert.equal(f.calls(), 0);
    assert.equal(await readFile(path.join(f.root, 'notes.txt'), 'utf8'), 'User notes');
    await assertOriginal(f);
  });
}

test('publication rejects an unrelated unpushed commit and a changed origin', async t => {
  const f = await fixture(t);
  await writeFile(path.join(f.root, 'notes.txt'), 'User notes');
  git(f.root, 'add', 'notes.txt'); git(f.root, 'commit', '-m', 'Unpublished user work');
  await f.edit('# Person\nCV edit\n');
  await assert.rejects(sync(f.config, { publish: true }, f.dependencies), /main and remote main differ/);
  assert.equal(f.calls(), 0);
  await assert.rejects(sync({ ...f.config, expectedRemote: 'changed' }, { publish: true }, f.dependencies), /original GitHub/);
});

test('an edited generated output is preserved rather than overwritten by force', async t => {
  const f = await fixture(t);
  await sync(f.config, {}, f.dependencies);
  await writeFile(path.join(f.root, 'src/content/portfolio.json'), '{"manual":"user work"}\n');
  await assert.rejects(sync(f.config, { force: true }, f.dependencies), /edited outside CV sync/);
  assert.equal(await readFile(path.join(f.root, 'src/content/portfolio.json'), 'utf8'), '{"manual":"user work"}\n');
});

test('a second push URL cannot publish to an additional repository', async t => {
  const f = await fixture(t);
  git(f.root, 'config', '--add', 'remote.origin.pushurl', f.remote);
  git(f.root, 'config', '--add', 'remote.origin.pushurl', path.join(f.root, 'unexpected.git'));
  await assert.rejects(sync(f.config, { publish: true }, f.dependencies), /exactly one fetch URL and one push URL/);
  assert.equal(f.calls(), 0);
});

test('concurrent output edits during validation are preserved and stop publication', async t => {
  const f = await fixture(t);
  f.dependencies.validateSite = async () => {
    await writeFile(path.join(f.root, 'src/content/portfolio.json'), '{"manual":"concurrent user edit"}\n');
  };
  await assert.rejects(sync(f.config, {}, f.dependencies), /preserved concurrent user edits/);
  assert.equal(f.calls(), 1);
  assert.match(await readFile(path.join(f.root, 'src/content/portfolio.json'), 'utf8'), /concurrent user edit/);
  assert.equal(await readFile(path.join(f.root, 'public/static/resume.pdf'), 'utf8'), initialPdf);
  assert.ok((await f.state()).promotion);
});

test('startup rolls back an interrupted promotion and recovers a dead-owner lock', async t => {
  const f = await fixture(t);
  const backup = path.join(f.config.stateDir, 'runs/interrupted/portfolio.backup');
  await mkdir(path.dirname(backup), { recursive: true });
  await writeFile(backup, initialPortfolio);
  const interrupted = '{"interrupted":true}\n';
  await writeFile(path.join(f.root, 'src/content/portfolio.json'), interrupted);
  await writeFile(path.join(f.config.stateDir, 'state.json'), JSON.stringify({ version: 1, local: null, published: null, pending: null, promotion: {
    previousLocal: null,
    files: [{ path: 'src/content/portfolio.json', backup, originalHash: hash(initialPortfolio), promotedHash: hash(interrupted) }],
  } }));
  const lock = path.join(f.config.stateDir, 'sync.lock');
  await mkdir(lock);
  await writeFile(path.join(lock, 'owner.json'), JSON.stringify({ pid: 2147483647, hostname: hostname(), token: 'dead-owner' }));
  await sync(f.config, { snapshotOnly: true }, { ensureSnapshot: async () => {} });
  await assertOriginal(f);
  assert.equal((await f.state()).promotion, null);
  assert.equal(f.calls(), 0);
});

test('failed push persists exactly one pending commit and retry publishes it without regeneration', async t => {
  const f = await fixture(t);
  const hook = path.join(f.remote, 'hooks/pre-receive');
  await writeFile(hook, '#!/bin/sh\nexit 1\n'); await chmod(hook, 0o755);
  await f.edit('# Person\nCV edit\n');
  const initialHead = git(f.root, 'rev-parse', 'HEAD');
  await assert.rejects(sync(f.config, { publish: true }, f.dependencies), /Git push failed/);
  const pending = (await f.state()).pending;
  assert.equal(pending.commit, git(f.root, 'rev-parse', 'HEAD'));
  assert.notEqual(pending.commit, initialHead);
  assert.equal((await sync(f.config, {}, f.dependencies)).status, 'pending-publication');
  await rm(hook);
  await sync(f.config, { publish: true }, f.dependencies);
  assert.equal(f.calls(), 1);
  assert.equal(git(f.root, 'rev-parse', 'HEAD'), pending.commit);
  assert.equal(git(f.root, 'ls-remote', 'origin', 'refs/heads/main').split(/\s/)[0], pending.commit);
  assert.equal((await f.state()).pending, null);
});

test('recovery recognizes a successful push even when saving the success failed', async t => {
  const f = await fixture(t);
  await f.edit('# Person\nCV edit\n');
  await sync(f.config, {}, f.dependencies);
  const state = await f.state();
  let pending;
  await assert.rejects(publishValidated(f.config, {
    sourceHash: state.local.sourceHash, expectedHashes: state.local.hashes,
    onPending: async value => { pending = value; },
    onPublished: async () => { throw new Error('Simulated process failure after accepted push'); },
  }, f.dependencies.git), /accepted push/);
  const head = git(f.root, 'rev-parse', 'HEAD');
  const result = await publishValidated(f.config, { pending }, f.dependencies.git);
  assert.equal(result.commit, head);
  assert.equal(git(f.root, 'rev-parse', 'HEAD'), head);
});

test('a branch switch during commit preparation cannot advance the other branch or publish', async t => {
  const f = await fixture(t);
  await f.edit('# Person\nCV edit\n');
  await sync(f.config, {}, f.dependencies);
  const state = await f.state();
  const before = git(f.root, 'rev-parse', 'HEAD');
  let checks = 0;
  await assert.rejects(publishValidated(f.config, {
    sourceHash: state.local.sourceHash, expectedHashes: state.local.hashes,
    verify: async () => { if (++checks === 2) git(f.root, 'switch', '-c', 'user-branch'); },
  }, f.dependencies.git), /checked-out branch changed/);
  assert.equal(git(f.root, 'branch', '--show-current'), 'user-branch');
  assert.equal(git(f.root, 'rev-parse', 'refs/heads/user-branch'), before);
  assert.equal(git(f.root, 'rev-parse', 'refs/heads/main'), before);
  assert.equal(git(f.root, 'ls-remote', 'origin', 'refs/heads/main').split(/\s/)[0], before);
  assert.match(git(f.root, 'show', ':assets/cv.md'), /Original source/);
});

test('snapshot-only fails if its snapshot was already superseded by a new master edit', async t => {
  const f = await fixture(t);
  await assert.rejects(sync(f.config, { snapshotOnly: true }, {
    ensureSnapshot: async () => { await f.edit('# Person\nEdit arriving during snapshot refresh\n'); },
  }), SourceChangedError);
  assert.equal(f.calls(), 0);
});

test('snapshot-only never invokes generation and a live lock excludes another sync', async t => {
  const f = await fixture(t);
  let snapshots = 0;
  f.dependencies.ensureSnapshot = async () => { snapshots += 1; };
  assert.equal((await sync(f.config, { snapshotOnly: true }, { ensureSnapshot: f.dependencies.ensureSnapshot })).status, 'snapshot');
  assert.equal(snapshots, 1); assert.equal(f.calls(), 0);
  let started;
  let finish;
  const waiting = new Promise(resolve => { started = resolve; });
  f.dependencies.generateCandidate = async () => {
    started(); await new Promise(resolve => { finish = resolve; });
    return { portfolio: {}, resume: { summary: 'CV' } };
  };
  const first = sync(f.config, {}, f.dependencies);
  await waiting;
  await assert.rejects(sync(f.config, { snapshotOnly: true }, f.dependencies), SyncBusyError);
  finish(); await first;
});

test('watcher catches startup, survives atomic saves, and serializes overlapping edits', async t => {
  const f = await fixture(t);
  let listener;
  const observer = new EventEmitter(); observer.close = () => {};
  let release;
  let active = 0; let maximum = 0;
  const seen = [];
  const controller = await watch(f.config, { pollMs: 0, onResult: () => {}, onError: error => { throw error; } }, {
    watchDirectory: (_directory, callback) => { listener = callback; return observer; },
    sync: async () => {
      active += 1; maximum = Math.max(active, maximum);
      seen.push(await readFile(path.join(f.root, 'assets/cv.md'), 'utf8'));
      if (seen.length === 1) await new Promise(resolve => { release = resolve; });
      active -= 1; return { status: 'generated' };
    },
  });
  t.after(() => controller.close());
  while (!release) await new Promise(resolve => setTimeout(resolve, 5));
  const temporary = path.join(f.root, 'assets/cv.md.new');
  await writeFile(temporary, '# Person\nAtomic replacement\n');
  await rename(temporary, path.join(f.root, 'assets/cv.md'));
  listener('rename', 'cv.md'); listener('change', 'cv.md');
  release();
  for (let count = 0; seen.length < 2 && count < 100; count += 1) await new Promise(resolve => setTimeout(resolve, 5));
  assert.equal(seen.length, 2); assert.match(seen[1], /Atomic replacement/); assert.equal(maximum, 1);
  await controller.runNow(); assert.equal(seen.length, 2);
  await controller.close();
});
