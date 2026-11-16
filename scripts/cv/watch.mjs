import { watch as watchDirectory } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { sync, SourceChangedError, SyncBusyError } from './sync.mjs';
import { PublicationError } from './git.mjs';

/** A foreground watcher. Watching the directory survives atomic editor saves. */
export async function watch(config, options = {}, dependencies = {}) {
  const runSync = dependencies.sync ?? sync;
  const createWatcher = dependencies.watchDirectory ?? watchDirectory;
  const debounceMs = config.debounceMs ?? 1500;
  const pollMs = options.pollMs ?? 30_000;
  const onResult = options.onResult ?? (result => {
    if (result.status !== 'unchanged' && !(result.status === 'published' && result.createdCommit === false)) {
      console.log(`[cv-sync] ${result.status}${result.commit ? ` ${result.commit.slice(0, 12)}` : ''}`);
    }
  });
  const onError = options.onError ?? (error => console.error(`[cv-sync] ${error.message}`));
  let timer;
  let poll;
  let running = false;
  let rerun = false;
  let nextRunAt = 0;
  let closed = false;
  let lastAttemptedHash;
  let lastError;
  let resolveDone;
  const done = new Promise(resolve => { resolveDone = resolve; });

  async function hasPendingCommit() {
    try { return Boolean(JSON.parse(await readFile(path.join(config.stateDir, 'state.json'), 'utf8')).pending); }
    catch (error) {
      if (error.code === 'ENOENT') return false;
      // Let sync diagnose a corrupt state rather than hiding it as a no-op.
      return true;
    }
  }

  async function drain() {
    if (closed) return;
    if (running) { rerun = true; return; }
    running = true;
    rerun = false;
    try {
      const cv = await readFile(path.join(config.portfolioRoot, 'assets/cv.md'));
      const hash = createHash('sha256').update(cv).digest('hex');
      if (hash === lastAttemptedHash && !await hasPendingCommit()) return;
      lastAttemptedHash = hash;
      const result = await runSync(config, { publish: options.publish ?? true }, dependencies.syncDependencies ?? {});
      lastError = null;
      await onResult(result);
    } catch (error) {
      if (error instanceof SourceChangedError || error instanceof SyncBusyError || error instanceof PublicationError) {
        lastAttemptedHash = undefined;
        if (error instanceof SourceChangedError) {
          rerun = true;
          nextRunAt = Math.max(nextRunAt, Date.now() + debounceMs);
        }
      }
      if (error.message !== lastError) { lastError = error.message; await onError(error); }
    } finally {
      running = false;
      if (closed) resolveDone();
      else if (rerun) {
        clearTimeout(timer);
        timer = setTimeout(() => { void drain(); }, Math.max(0, nextRunAt - Date.now()));
      }
    }
  }

  function schedule() {
    if (closed) return;
    nextRunAt = Date.now() + debounceMs;
    if (running) { rerun = true; return; }
    clearTimeout(timer);
    timer = setTimeout(() => { void drain(); }, debounceMs);
  }

  const observer = createWatcher(path.join(config.portfolioRoot, 'assets'), (_event, filename) => {
    if (!filename || filename.toString() === 'cv.md') schedule();
  });
  observer.on?.('error', error => { void onError(error); });

  function close() {
    if (closed) return done;
    closed = true;
    clearTimeout(timer);
    clearInterval(poll);
    observer.close();
    options.signal?.removeEventListener('abort', close);
    process.off('SIGINT', close);
    process.off('SIGTERM', close);
    if (!running) resolveDone();
    return done;
  }

  options.signal?.addEventListener('abort', close, { once: true });
  process.once('SIGINT', close);
  process.once('SIGTERM', close);
  if (pollMs > 0) poll = setInterval(schedule, pollMs);
  if (options.signal?.aborted) close();
  else void drain(); // Startup catches edits made while the watcher was stopped.
  return { close, done, runNow: drain };
}
