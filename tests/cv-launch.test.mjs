import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { launch } from '../scripts/cv/launch.mjs';
import { isMainModule } from '../scripts/cv/is-main.mjs';

function fixture(t, config) {
  const portfolioRoot = mkdtempSync(join(tmpdir(), 'portfolio-cv-launch-'));
  mkdirSync(join(portfolioRoot, 'scripts/cv'), { recursive: true });
  if (config !== undefined) writeFileSync(join(portfolioRoot, '.cv-sync.local.json'), JSON.stringify(config));
  t.after(() => rmSync(portfolioRoot, { recursive: true, force: true }));
  return portfolioRoot;
}

test('Node 26 invokes the CLI directly without configuration or another process', async () => {
  const args = ['sync', '--publish'];
  let received;
  const status = await launch(args, {
    nodeVersion: '26.13.1',
    runCli: values => { received = [...values]; values.shift(); },
    spawnSync: () => assert.fail('Node 26 should not spawn a replacement runtime'),
  });
  assert.equal(status, 0);
  assert.deepEqual(received, ['sync', '--publish']);
  assert.deepEqual(args, ['sync', '--publish']);
});

test('older Node requires initial setup with an actionable error', async t => {
  const portfolioRoot = fixture(t);
  await assert.rejects(launch(['sync'], { portfolioRoot, nodeVersion: '21.7.2' }), /activate Node 26.*cv:setup/);
});

test('a relative or missing saved executable is never executed', async t => {
  for (const nodeExecutable of [undefined, 'node', './node']) {
    const portfolioRoot = fixture(t, { nodeExecutable });
    await assert.rejects(launch(['sync'], {
      portfolioRoot, nodeVersion: '21.7.2', spawnSync: () => assert.fail('Invalid executable must not spawn'),
    }), /missing or invalid/);
  }
});

test('saved runtime is version-checked then executes the CLI without a shell', async t => {
  const executable = join(tmpdir(), 'Node 26', 'node');
  const portfolioRoot = fixture(t, { nodeExecutable: executable });
  const calls = [];
  const args = ['setup', '--career-ops-root', 'path with spaces and $(literal)'];
  const status = await launch(args, {
    portfolioRoot, nodeVersion: '21.7.2',
    spawnSync: (command, values, options) => {
      calls.push({ command, values, options });
      return calls.length === 1 ? { status: 0, stdout: 'v26.13.1\n' } : { status: 0 };
    },
  });
  assert.equal(status, 0);
  assert.equal(calls.length, 2);
  assert.deepEqual(calls[0].values, ['--version']);
  assert.deepEqual(calls[1].values, [join(portfolioRoot, 'scripts/cv/cli.mjs'), ...args]);
  assert.equal(calls[1].command, executable);
  assert.equal(calls[1].options.shell, undefined);
  assert.equal(calls[1].options.stdio, 'inherit');
  assert.doesNotMatch(calls[1].values[0], /launch\.mjs$/);
});

test('a stale path or wrong Node version fails before invoking the workflow', async t => {
  for (const check of [
    { error: new Error('ENOENT'), status: null },
    { status: 1, stdout: '' },
    { status: 0, stdout: 'v24.22.3\n' },
  ]) {
    const portfolioRoot = fixture(t, { nodeExecutable: process.execPath });
    let calls = 0;
    await assert.rejects(launch(['sync'], {
      portfolioRoot, nodeVersion: '21.7.2',
      spawnSync: () => { calls++; return check; },
    }), /unavailable or is not Node 26/);
    assert.equal(calls, 1);
  }
});

test('workflow exit codes and interrupt signals propagate', async t => {
  for (const [child, expected] of [[{ status: 7 }, 7], [{ status: null, signal: 'SIGINT' }, 130]]) {
    const portfolioRoot = fixture(t, { nodeExecutable: process.execPath });
    let calls = 0;
    const status = await launch(['watch'], {
      portfolioRoot, nodeVersion: '21.7.2',
      spawnSync: () => ++calls === 1 ? { status: 0, stdout: 'v26.13.1' } : child,
    });
    assert.equal(status, expected);
  }
});

test('bootstrap executes the recorded real Node 26 against the fixture CLI', async t => {
  const portfolioRoot = fixture(t, { nodeExecutable: process.execPath });
  writeFileSync(join(portfolioRoot, 'scripts/cv/cli.mjs'), `
    import { writeFileSync } from 'node:fs';
    writeFileSync(new URL('../../executed.json', import.meta.url), JSON.stringify({version:process.versions.node,args:process.argv.slice(2)}));
  `);
  const status = await launch(['sync', '--snapshot-only'], { portfolioRoot, nodeVersion: '21.7.2' });
  const executed = JSON.parse(readFileSync(join(portfolioRoot, 'executed.json'), 'utf8'));
  assert.equal(status, 0);
  assert.match(executed.version, /^26\./);
  assert.deepEqual(executed.args, ['sync', '--snapshot-only']);
});

test('entrypoint detection rejects missing or non-file paths without throwing', () => {
  assert.equal(isMainModule(import.meta.url, ''), false);
  assert.equal(isMainModule('data:text/javascript,', process.argv[1]), false);
  assert.equal(isMainModule(import.meta.url, join(tmpdir(), 'missing-cv-entrypoint')), false);
});

for (const entrypoint of ['cli.mjs', 'launch.mjs']) {
  test(`${entrypoint} runs when invoked through a symlink`, t => {
    const portfolioRoot = fixture(t);
    const alias = join(portfolioRoot, `linked-${entrypoint}`);
    const target = fileURLToPath(new URL(`../scripts/cv/${entrypoint}`, import.meta.url));
    try {
      symlinkSync(target, alias, 'file');
    } catch (error) {
      if (process.platform === 'win32' && ['EPERM', 'EACCES', 'ENOSYS'].includes(error.code)) {
        t.skip('Windows file symlink privilege is unavailable.');
        return;
      }
      throw error;
    }
    const result = spawnSync(process.execPath, [alias, 'sync', '--does-not-exist'], {
      encoding: 'utf8', timeout: 15000,
    });
    assert.equal(result.error, undefined);
    assert.equal(result.status, 1, 'The CLI must run and reject the invalid option instead of silently exiting.');
    assert.match(result.stderr, /CV workflow: Unknown option: --does-not-exist/);
  });
}
