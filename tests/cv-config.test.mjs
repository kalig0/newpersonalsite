import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { ensureSnapshot, hash, installCareerInstructions, loadConfig, normalizeCv, setup } from '../scripts/cv/config.mjs';

const legacyCv = '# Candidate\n\n## Experience\n\n### Engineer — Acme, Remote\n*Jan 2025 – Present*\n\n- Built the supplied tool.\n';
const canonicalCv = '# Candidate\n\n## Experience\n\n### Acme — Remote\n**Engineer**\nJan 2025 – Present\n\n- Built the supplied tool.\n';

function fixture(t) {
  const portfolioRoot = mkdtempSync(join(tmpdir(), 'portfolio-cv-config-'));
  const careerOpsRoot = join(portfolioRoot, 'career-ops');
  const stateDir = join(portfolioRoot, 'output/cv-sync');
  mkdirSync(careerOpsRoot, { recursive: true });
  t.after(() => rmSync(portfolioRoot, { recursive: true, force: true }));
  return { portfolioRoot, careerOpsRoot, careerDataRoot: careerOpsRoot, stateDir };
}

test('legacy headings are normalized only inside Experience and normalization is idempotent', () => {
  const project = '\n## Projects\n\n### Project — Team, Remote\n*Jan 2024 – Present*\n';
  assert.equal(normalizeCv(legacyCv + project), canonicalCv + project);
  assert.equal(normalizeCv(canonicalCv), canonicalCv);
});

test('initial migration accepts the equivalent legacy snapshot and records its hash', t => {
  const config = fixture(t);
  writeFileSync(join(config.careerOpsRoot, 'cv.md'), legacyCv);
  const result = ensureSnapshot(config, canonicalCv);
  assert.equal(readFileSync(result.snapshotPath, 'utf8'), canonicalCv);
  assert.equal(result.sourceHash, hash(canonicalCv));
  assert.equal(JSON.parse(readFileSync(join(config.stateDir, 'snapshot.json'), 'utf8')).snapshotHash, result.sourceHash);
});

test('initial setup refuses an unrelated existing CV and preserves it', t => {
  const config = fixture(t);
  const snapshotPath = join(config.careerOpsRoot, 'cv.md');
  const existing = legacyCv.replace('Built the supplied tool.', 'An independent fact.');
  writeFileSync(snapshotPath, existing);
  assert.throws(() => ensureSnapshot(config, canonicalCv), /edited independently|conflict|reconcile/i);
  assert.equal(readFileSync(snapshotPath, 'utf8'), existing);
  assert.equal(existsSync(join(config.stateDir, 'snapshot.json')), false);
});

test('a known generated snapshot advances to a new master version', t => {
  const config = fixture(t);
  ensureSnapshot(config, canonicalCv);
  const updated = canonicalCv.replace('supplied tool', 'updated supplied tool');
  const result = ensureSnapshot(config, updated);
  assert.equal(readFileSync(result.snapshotPath, 'utf8'), updated);
  assert.equal(result.sourceHash, hash(updated));
});

test('unexpected snapshot edits are preserved rather than overwritten', t => {
  const config = fixture(t);
  const { snapshotPath } = ensureSnapshot(config, canonicalCv);
  const edited = canonicalCv + '\nAn independent edit.\n';
  writeFileSync(snapshotPath, edited);
  assert.throws(() => ensureSnapshot(config, canonicalCv + '\nA master update.\n'), /edited independently|conflict|reconcile/i);
  assert.equal(readFileSync(snapshotPath, 'utf8'), edited);
});

test('missing snapshot state can be recreated only from an identical source', t => {
  const config = fixture(t);
  writeFileSync(join(config.careerOpsRoot, 'cv.md'), canonicalCv);
  ensureSnapshot(config, canonicalCv);
  assert.equal(existsSync(join(config.stateDir, 'snapshot.json')), true);
});

test('selecting a new career checkout does not reuse the previous data root', t => {
  const config = fixture(t);
  const newCheckout = join(config.portfolioRoot, 'other-career-ops');
  const newDataRoot = join(newCheckout, 'user-data');
  mkdirSync(newDataRoot, { recursive: true });
  writeFileSync(join(newCheckout, '.career-ops-data'), 'user-data\n');
  writeFileSync(join(config.portfolioRoot, '.cv-sync.local.json'), JSON.stringify({
    careerOpsRoot: config.careerOpsRoot,
    careerDataRoot: join(config.careerOpsRoot, 'old-data'),
  }));
  const loaded = loadConfig({ portfolioRoot: config.portfolioRoot, careerOpsRoot: newCheckout });
  assert.equal(loaded.careerOpsRoot, newCheckout);
  assert.equal(loaded.careerDataRoot, newDataRoot);
});

test('career instructions preserve user rules and replace their own block idempotently', t => {
  const config = fixture(t);
  const customPath = join(config.careerDataRoot, 'modes/_custom.md');
  mkdirSync(join(config.careerDataRoot, 'modes'), { recursive: true });
  writeFileSync(customPath, '# Personal rules\n\nKeep my existing convention.\n');
  installCareerInstructions(config);
  const first = readFileSync(customPath, 'utf8');
  installCareerInstructions(config);
  assert.equal(readFileSync(customPath, 'utf8'), first);
  assert.match(first, /Keep my existing convention\./);
  assert.equal(first.split('<!-- portfolio-cv-sync:start -->').length - 1, 1);
  assert.match(first, /cv:sync -- --snapshot-only/);
  assert.match(first, /CAREER_OPS_CV/);
});

test('malformed managed instructions stop before changing user content', t => {
  const config = fixture(t);
  const customPath = join(config.careerDataRoot, 'modes/_custom.md');
  mkdirSync(join(config.careerDataRoot, 'modes'), { recursive: true });
  const malformed = '# Personal rules\n<!-- portfolio-cv-sync:start -->\nunfinished';
  writeFileSync(customPath, malformed);
  assert.throws(() => installCareerInstructions(config), /malformed/i);
  assert.equal(readFileSync(customPath, 'utf8'), malformed);
});

function setupFixture(t) {
  const config = fixture(t);
  for (const name of ['build-cv-html.mjs', 'generate-pdf.mjs', 'verify-cv-facts.mjs', 'cv-title-check.mjs', 'verify-cv-structure.mjs']) {
    writeFileSync(join(config.careerOpsRoot, name), '');
  }
  writeFileSync(join(config.careerOpsRoot, 'cv.md'), legacyCv);
  return config;
}

test('setup reads authentication from stderr and keeps existing custom rules', t => {
  const config = setupFixture(t);
  const customPath = join(config.careerDataRoot, 'modes/_custom.md');
  mkdirSync(join(config.careerDataRoot, 'modes'), { recursive: true });
  writeFileSync(customPath, '# Personal rules\n\nKeep this workflow preference.\n');
  const calls = [];
  const run = (command, args, options) => {
    calls.push({ command, args, options });
    if (args[0] === 'login') {
      assert.equal(options.includeStderr, true);
      return 'Logged in using ChatGPT';
    }
    if (args[0] === 'remote') return 'git@github.com:example/portfolio.git';
    return '';
  };
  const saved = setup(config, { run });
  assert.equal(saved.publishEnabled, false);
  assert.equal(saved.expectedRemote, 'git@github.com:example/portfolio.git');
  assert.match(readFileSync(customPath, 'utf8'), /Keep this workflow preference\./);
  assert.equal(readFileSync(join(config.portfolioRoot, 'assets/cv.md'), 'utf8'), canonicalCv);
  assert.equal(calls.some(call => call.args[0] === 'ls-remote'), true);
});

test('a status-0 unauthenticated response still blocks setup', t => {
  const config = setupFixture(t);
  const calls = [];
  const run = (_command, args, options) => {
    calls.push(args);
    assert.equal(options.includeStderr, true);
    return 'Not logged in';
  };
  assert.throws(() => setup(config, { run }), /codex login/);
  assert.equal(calls.length, 1);
  assert.equal(existsSync(join(config.portfolioRoot, '.cv-sync.local.json')), false);
  assert.equal(readFileSync(join(config.careerOpsRoot, 'cv.md'), 'utf8'), legacyCv);
});

test('setup refuses a changed origin before syncing career data or instructions', t => {
  const config = setupFixture(t);
  writeFileSync(join(config.portfolioRoot, '.cv-sync.local.json'), JSON.stringify({
    careerOpsRoot: config.careerOpsRoot,
    expectedRemote: 'git@github.com:example/expected.git',
  }));
  const run = (_command, args) => args[0] === 'login' ? 'Logged in using ChatGPT' : args[0] === 'remote' ? 'git@github.com:example/changed.git' : '';
  assert.throws(() => setup(config, { run }), /Git origin changed/);
  assert.equal(readFileSync(join(config.careerOpsRoot, 'cv.md'), 'utf8'), legacyCv);
  assert.equal(existsSync(join(config.careerDataRoot, 'modes/_custom.md')), false);
});
