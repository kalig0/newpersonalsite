import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { resolveCommand } from '../scripts/cv/command.mjs';

const win = path.win32;
function windows(files, overrides = {}) {
  const known = new Set(files.map(file => win.normalize(file).toLowerCase()));
  return {
    platform: 'win32', cwd: 'C:\\workspace', execPath: 'C:\\Program Files\\nodejs\\node.exe',
    env: { Path: 'C:\\Users\\Ada\\AppData\\Roaming\\npm;C:\\Program Files\\Codex' },
    exists: file => known.has(win.normalize(file).toLowerCase()),
    ...overrides,
  };
}

test('preserves native Unix executable paths and names without shell splitting', () => {
  assert.deepEqual(resolveCommand('/Applications/Codex app/codex', { platform: 'darwin' }), { file: '/Applications/Codex app/codex', args: [] });
  assert.deepEqual(resolveCommand('codex', { platform: 'linux' }), { file: 'codex', args: [] });
});

test('finds a Windows native Codex executable through case-insensitive Path env', () => {
  const executable = 'C:\\Program Files\\Codex\\codex.exe';
  assert.deepEqual(resolveCommand('codex', windows([executable])), { file: executable, args: [] });
});

test('resolves a global npm Windows shim to Node plus the known JavaScript entrypoint', () => {
  const shim = 'C:\\Users\\Ada\\AppData\\Roaming\\npm\\codex.cmd';
  const js = 'C:\\Users\\Ada\\AppData\\Roaming\\npm\\node_modules\\@openai\\codex\\bin\\codex.js';
  const settings = windows([shim, js]);
  assert.deepEqual(resolveCommand('codex', settings), { file: settings.execPath, args: [js] });
  assert.deepEqual(resolveCommand(shim, settings), { file: settings.execPath, args: [js] });
});

test('resolves a local npm .bin Windows shim without parsing shell contents', () => {
  const shim = 'C:\\workspace\\node_modules\\.bin\\codex.cmd';
  const js = 'C:\\workspace\\node_modules\\@openai\\codex\\bin\\codex.js';
  const settings = windows([shim, js]);
  assert.deepEqual(resolveCommand('.\\node_modules\\.bin\\codex.cmd', settings), { file: settings.execPath, args: [js] });
});

test('prefers a known native sibling over a shell shim', () => {
  const shim = 'C:\\tools\\codex.cmd';
  const executable = 'C:\\tools\\codex.exe';
  assert.deepEqual(resolveCommand(shim, windows([shim, executable])), { file: executable, args: [] });
});

test('handles explicit JS entrypoints as an argument, including paths with spaces', () => {
  const js = 'C:\\Program Files\\Codex\\bin\\codex.js';
  const settings = windows([js]);
  assert.deepEqual(resolveCommand(js, settings), { file: settings.execPath, args: [js] });
});

test('refuses an unknown Windows shell shim rather than starting a shell', () => {
  assert.throws(() => resolveCommand('C:\\tools\\custom.cmd', windows(['C:\\tools\\custom.cmd'])), /Windows shell shim/);
  assert.throws(() => resolveCommand('C:\\tools\\codex.cmd', windows(['C:\\tools\\codex.cmd'])), /known native executable/);
});
