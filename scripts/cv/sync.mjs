import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash, randomUUID } from 'node:crypto';
import { hostname } from 'node:os';
import { existsSync } from 'node:fs';
import { lstat, mkdir, readFile, realpath, rename, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { PUBLICATION_PATHS, PublicationError, publicationPreflight, publishValidated } from './git.mjs';

const execute = promisify(execFile);
const SOURCE_PATH = PUBLICATION_PATHS[0];
const OUTPUT_PATHS = PUBLICATION_PATHS.slice(1);
const digest = contents => createHash('sha256').update(contents).digest('hex');

export class SourceChangedError extends Error {
  constructor() { super('CV changed during generation. The candidate was discarded; the next run will use the new source.'); this.name = 'SourceChangedError'; }
}

export class SyncBusyError extends Error {
  constructor() { super('Another CV sync is running.'); this.name = 'SyncBusyError'; }
}

async function readOptional(file) {
  try { return await readFile(file); } catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}

async function writeAtomic(file, contents) {
  await mkdir(path.dirname(file), { recursive: true });
  const temporary = `${file}.tmp-${process.pid}-${randomUUID()}`;
  try {
    await writeFile(temporary, contents);
    await rename(temporary, file);
  } finally { await rm(temporary, { force: true }); }
}

async function readState(config) {
  const contents = await readOptional(path.join(config.stateDir, 'state.json'));
  if (!contents) return { version: 1, local: null, published: null, pending: null, promotion: null };
  let state;
  try { state = JSON.parse(contents); } catch { throw new Error('CV sync state is unreadable. Preserve it for recovery before resetting it.'); }
  if (!state || typeof state !== 'object' || state.version !== 1) throw new Error('Unsupported CV sync state version.');
  return state;
}

async function saveState(config, state) {
  await writeAtomic(path.join(config.stateDir, 'state.json'), `${JSON.stringify(state, null, 2)}\n`);
}

function alive(pid) {
  if (!Number.isInteger(pid) || pid < 1) return false;
  try { process.kill(pid, 0); return true; } catch (error) { return error.code === 'EPERM'; }
}

async function acquireLock(config) {
  await mkdir(config.stateDir, { recursive: true });
  const directory = path.join(config.stateDir, 'sync.lock');
  const token = randomUUID();
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await mkdir(directory);
      await writeFile(path.join(directory, 'owner.json'), JSON.stringify({ pid: process.pid, hostname: hostname(), token }));
      return async () => {
        const owner = JSON.parse(await readFile(path.join(directory, 'owner.json'), 'utf8').catch(() => '{}'));
        if (owner.token === token) await rm(directory, { recursive: true, force: true });
      };
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      let owner;
      try { owner = JSON.parse(await readFile(path.join(directory, 'owner.json'), 'utf8')); } catch { owner = null; }
      if (owner && (owner.hostname !== hostname() || alive(owner.pid))) throw new SyncBusyError();
      if (!owner && Date.now() - (await stat(directory)).mtimeMs < 30_000) throw new SyncBusyError();
      const quarantine = `${directory}.stale-${token}`;
      try {
        await rename(directory, quarantine);
        const moved = JSON.parse(await readFile(path.join(quarantine, 'owner.json'), 'utf8').catch(() => '{}'));
        if (moved.token && moved.token !== owner?.token && (moved.hostname !== hostname() || alive(moved.pid))) {
          // Another claimant may have replaced the stale directory just before
          // rename. Never delete that new owner's lock.
          await rename(quarantine, directory).catch(() => {});
          throw new SyncBusyError();
        }
        await rm(quarantine, { recursive: true, force: true });
      }
      catch (race) { if (!['ENOENT', 'EEXIST', 'ENOTEMPTY'].includes(race.code)) throw race; }
    }
  }
  throw new SyncBusyError();
}

async function source(config) {
  const file = path.join(config.portfolioRoot, SOURCE_PATH);
  if (!(await lstat(file)).isFile()) throw new Error('assets/cv.md must be the physical canonical Markdown file.');
  const contents = await readFile(file);
  const cvText = contents.toString('utf8');
  if (!cvText.trim()) throw new Error('The canonical CV is empty.');
  if (!Buffer.from(cvText).equals(contents)) throw new Error('The canonical CV must contain valid UTF-8 text.');
  return { cvText, sourceHash: digest(contents) };
}

async function sourceStillMatches(config, sourceHash) {
  if ((await source(config)).sourceHash !== sourceHash) throw new SourceChangedError();
}

async function safeOutput(config, relative) {
  if (!OUTPUT_PATHS.includes(relative)) throw new Error('Attempted to change a non-allowlisted output.');
  const root = await realpath(config.portfolioRoot);
  const file = path.join(root, relative);
  let ancestor = file;
  while (true) {
    try {
      const info = await lstat(ancestor);
      if (info.isSymbolicLink()) throw new Error(`Refusing a symlink in output path ${relative}.`);
      const actual = await realpath(ancestor);
      const within = path.relative(root, actual);
      if (within === '..' || within.startsWith(`..${path.sep}`) || path.isAbsolute(within)) throw new Error(`Output escapes Portfolio: ${relative}.`);
      break;
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      ancestor = path.dirname(ancestor);
    }
  }
  return file;
}

async function currentHashes(config) {
  const hashes = {};
  for (const relative of PUBLICATION_PATHS) {
    const contents = await readOptional(path.join(config.portfolioRoot, relative));
    hashes[relative] = contents === null ? null : digest(contents);
  }
  return hashes;
}

async function protectExistingOutputs(config, state) {
  for (const relative of OUTPUT_PATHS) await safeOutput(config, relative);
  if (state.local) {
    const current = await currentHashes(config);
    const changed = OUTPUT_PATHS.filter(relative => current[relative] !== state.local.hashes[relative]);
    if (changed.length) throw new Error(`Generated files were edited outside CV sync. Preserve or reconcile them before regenerating: ${changed.join(', ')}`);
    return;
  }
  const { stdout } = await execute('git', ['status', '--porcelain=v1', '--untracked-files=all', '--', ...OUTPUT_PATHS], {
    cwd: config.portfolioRoot, encoding: 'utf8', timeout: 10_000,
  });
  if (stdout.trim()) throw new Error('Existing resume or portfolio output has uncommitted edits. Preserve or commit those edits before the first CV sync.');
}

async function stagedFile(runDir, file, label) {
  if (typeof file !== 'string') throw new Error(`Renderer did not return a ${label} path.`);
  const root = await realpath(runDir);
  const actual = await realpath(file);
  const relative = path.relative(root, actual);
  if (!relative || relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)
    || !(await lstat(actual)).isFile()) throw new Error(`${label} must be staged inside the active run directory.`);
  return readFile(actual);
}

async function rollback(config, state) {
  const transaction = state.promotion;
  if (!transaction) return;
  const conflicts = [];
  for (const item of transaction.files) {
    const target = await safeOutput(config, item.path);
    const existing = await readOptional(target);
    const hash = existing === null ? null : digest(existing);
    if (hash === item.originalHash) continue;
    if (hash !== item.promotedHash) { conflicts.push(item.path); continue; }
    if (item.backup) {
      const backup = await realpath(item.backup);
      const within = path.relative(await realpath(config.stateDir), backup);
      if (within === '..' || within.startsWith(`..${path.sep}`) || path.isAbsolute(within)) throw new Error('Recovery backup escapes the CV sync state directory.');
      await writeAtomic(target, await readFile(backup));
    }
    else await rm(target, { force: true });
  }
  state.local = transaction.previousLocal;
  if (conflicts.length) {
    await saveState(config, state);
    throw new Error(`Recovery preserved concurrent user edits in ${conflicts.join(', ')}. Resolve the saved promotion journal before retrying.`);
  }
  state.promotion = null;
  await saveState(config, state);
}

async function promote(config, state, runDir, files) {
  const backups = path.join(runDir, 'backups');
  await mkdir(backups, { recursive: true });
  const entries = [];
  for (const [relative, contents] of Object.entries(files)) {
    const target = await safeOutput(config, relative);
    const original = await readOptional(target);
    const backup = original === null ? null : path.join(backups, relative.replaceAll('/', '__'));
    if (backup) await writeFile(backup, original);
    entries.push({ path: relative, backup, originalHash: original === null ? null : digest(original), promotedHash: digest(contents) });
  }
  state.promotion = { files: entries, previousLocal: state.local };
  await saveState(config, state);
  for (const [relative, contents] of Object.entries(files)) await writeAtomic(await safeOutput(config, relative), contents);
}

export function resolveNpmCommand({
  platform = process.platform, nodePath = process.execPath,
  npmExecPath = process.env.npm_execpath, fileExists = existsSync,
} = {}) {
  const paths = platform === 'win32' ? path.win32 : path.posix;
  const candidates = [
    npmExecPath,
    paths.join(paths.dirname(nodePath), 'node_modules/npm/bin/npm-cli.js'),
    paths.join(paths.dirname(nodePath), '../lib/node_modules/npm/bin/npm-cli.js'),
  ];
  const cli = candidates.find(candidate => candidate && paths.isAbsolute(candidate)
    && /(?:^|[\\/])npm-cli\.js$/.test(candidate) && fileExists(candidate));
  if (cli) return [nodePath, cli];
  if (platform === 'win32') throw new Error('Cannot locate npm-cli.js for this Node installation. Install Node 26 with npm, or run CV sync through npm run cv:sync.');
  return ['npm'];
}

async function validateSite(config, { runDir }) {
  const npm = config.siteCommands ? null : resolveNpmCommand();
  const commands = config.siteCommands ?? [
    [...npm, 'run', 'typecheck'],
    [...npm, 'run', 'build', '--', '--outDir', path.join(runDir, 'site-dist'), '--emptyOutDir'],
  ];
  for (const [command, ...args] of commands) {
    try {
      await execute(command, args, { cwd: config.portfolioRoot, encoding: 'utf8', timeout: 120_000, maxBuffer: 4 * 1024 * 1024 });
    } catch (error) { throw new Error(`Site validation failed: ${String(error.stderr || error.stdout || error.message).trim()}`); }
  }
}

async function dependenciesFor(injected, snapshotOnly) {
  const dependencies = { ...injected };
  dependencies.ensureSnapshot ??= (await import('./config.mjs')).ensureSnapshot;
  if (!snapshotOnly) {
    if (!dependencies.generateCandidate || !dependencies.reviewCandidate) {
      const worker = await import('./worker.mjs');
      dependencies.generateCandidate ??= worker.generateCandidate;
      dependencies.reviewCandidate ??= worker.reviewCandidate;
    }
    dependencies.renderAndValidate ??= (await import('./career.mjs')).renderAndValidate;
    dependencies.validateSite ??= validateSite;
  }
  return dependencies;
}

/** Local generation, independent review, validation, and optional publication. */
export async function sync(config, { publish = false, force = false, snapshotOnly = false } = {}, injected = {}) {
  const release = await acquireLock(config);
  let state;
  try {
    state = await readState(config);
    const dependencies = await dependenciesFor(injected, snapshotOnly);
    if (state.promotion) await rollback(config, state);
    let input = await source(config);
    await dependencies.ensureSnapshot(config, input.cvText);
    await sourceStillMatches(config, input.sourceHash);
    if (snapshotOnly) return { status: 'snapshot', sourceHash: input.sourceHash };

    if (state.pending) {
      if (!publish) return { status: 'pending-publication', sourceHash: state.pending.sourceHash, commit: state.pending.commit };
      // Recover the exact already-validated commit first. A newer local CV edit
      // remains uncommitted and is processed immediately afterwards.
      await publishValidated(config, {
        pending: state.pending,
        onPublished: async result => {
          state.published = { sourceHash: result.sourceHash, commit: result.commit };
          state.pending = null;
          await saveState(config, state);
        },
      }, dependencies.git);
      input = await source(config);
      await dependencies.ensureSnapshot(config, input.cvText);
      await sourceStillMatches(config, input.sourceHash);
    }

    await protectExistingOutputs(config, state);
    if (publish) await publicationPreflight(config, {}, dependencies.git);
    let generated = false;
    let lastError;
    if (force || state.local?.sourceHash !== input.sourceHash) {
      const run = path.join(config.stateDir, 'runs', `${Date.now()}-${randomUUID()}`);
      await mkdir(run, { recursive: true });
      let feedback;
      for (let attempt = 1; attempt <= 2; attempt += 1) {
        const runDir = path.join(run, `attempt-${attempt}`);
        await mkdir(runDir, { recursive: true });
        try {
          const bundle = await dependencies.generateCandidate(config, { ...input, runDir, feedback });
          const review = await dependencies.reviewCandidate(config, { bundle, cvText: input.cvText, runDir });
          if (review?.approved !== true || !Array.isArray(review.issues) || review.issues.length) {
            throw new Error(`Independent content review rejected the candidate: ${JSON.stringify(review?.issues ?? ['No valid approval returned'])}`);
          }
          const rendered = await dependencies.renderAndValidate(config, { bundle, cvText: input.cvText, runDir });
          const pdf = await stagedFile(runDir, rendered.pdfPath, 'PDF');
          const portfolio = await stagedFile(runDir, rendered.portfolioPath, 'portfolio JSON');
          if (!pdf.subarray(0, 5).equals(Buffer.from('%PDF-'))) throw new Error('Renderer output is not a PDF.');
          JSON.parse(portfolio.toString('utf8'));
          await sourceStillMatches(config, input.sourceHash);
          const generatedAt = new Date().toISOString();
          const meta = Buffer.from(`${JSON.stringify({ schemaVersion: 1, sourceHash: input.sourceHash, generatedAt, resumeSha256: digest(pdf), portfolioSha256: digest(portfolio) }, null, 2)}\n`);
          await promote(config, state, runDir, {
            'src/content/portfolio.json': portfolio,
            'public/static/resume.pdf': pdf,
            'public/static/resume.meta.json': meta,
          });
          await dependencies.validateSite(config, { runDir });
          await sourceStillMatches(config, input.sourceHash);
          const promotedHashes = await currentHashes(config);
          if (state.promotion.files.some(file => promotedHashes[file.path] !== file.promotedHash)) {
            throw new Error('A generated output was edited while site validation was running.');
          }
          state.local = { sourceHash: input.sourceHash, hashes: promotedHashes, completedAt: generatedAt, validation: rendered.validation };
          await saveState(config, state);
          generated = true;
          lastError = null;
          break;
        } catch (error) {
          if (state.promotion) await rollback(config, state);
          if (error instanceof SourceChangedError || error instanceof PublicationError) throw error;
          lastError = error;
          feedback = error.message;
        }
      }
      if (lastError) throw new Error(`CV sync failed after one correction retry: ${lastError.message}`);
    }

    if (publish) {
      const expectedHashes = state.local.hashes;
      const published = await publishValidated(config, {
        sourceHash: input.sourceHash, expectedHashes,
        verify: async () => {
          await sourceStillMatches(config, input.sourceHash);
          const current = await currentHashes(config);
          if (PUBLICATION_PATHS.some(relative => current[relative] !== expectedHashes[relative])) throw new Error('Validated output changed before publication.');
        },
        onPending: async pending => {
          state.pending = pending;
          state.promotion = null;
          await saveState(config, state);
        },
        onPublished: async result => {
          state.published = { sourceHash: result.sourceHash, commit: result.commit };
          state.pending = null;
          state.promotion = null;
          await saveState(config, state);
        },
      }, dependencies.git);
      state.lastFailure = null;
      await saveState(config, state);
      return { ...published, generated, sourceHash: input.sourceHash };
    }
    state.promotion = null;
    state.lastFailure = null;
    await saveState(config, state);
    return { status: generated ? 'generated' : 'unchanged', sourceHash: input.sourceHash };
  } catch (error) {
    if (state?.promotion && !state.pending) await rollback(config, state);
    if (state) {
      state.lastFailure = { at: new Date().toISOString(), message: error.message };
      await saveState(config, state);
    }
    throw error;
  } finally { await release(); }
}
