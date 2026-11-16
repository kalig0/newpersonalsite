import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, realpath, rm } from 'node:fs/promises';
import path from 'node:path';

const execute = promisify(execFile);
export const PUBLICATION_PATHS = Object.freeze([
  'assets/cv.md',
  'src/content/portfolio.json',
  'public/static/resume.pdf',
  'public/static/resume.meta.json',
]);

export class PublicationError extends Error {
  constructor(message) { super(message); this.name = 'PublicationError'; }
}

async function git(config, args, options = {}) {
  try {
    const result = await execute('git', args, {
      cwd: config.portfolioRoot,
      env: { ...process.env, GIT_TERMINAL_PROMPT: '0', ...options.env },
      encoding: options.binary ? null : 'utf8',
      timeout: config.gitTimeoutMs ?? 30_000,
      maxBuffer: 20 * 1024 * 1024,
    });
    return options.binary ? result.stdout : result.stdout.trimEnd();
  } catch (error) {
    // Git's command can contain a remote URL. Report stderr rather than echoing
    // the complete command, and never place credentials in command arguments.
    throw new PublicationError(`Git ${args[0]} failed: ${String(error.stderr || error.message).trim()}`);
  }
}

function githubRepository(remote) {
  let match = /^git@github\.com:([\w.-]+\/[\w.-]+?)(?:\.git)?$/i.exec(remote);
  if (match) return match[1].toLowerCase();
  try {
    const url = new URL(remote);
    if (!['https:', 'ssh:'].includes(url.protocol) || url.hostname.toLowerCase() !== 'github.com'
      || url.password || url.search || url.hash || url.port
      || (url.protocol === 'https:' && url.username)
      || (url.protocol === 'ssh:' && url.username !== 'git')) return null;
    match = /^\/([\w.-]+\/[\w.-]+?)(?:\.git)?\/?$/.exec(url.pathname);
    return match ? match[1].toLowerCase() : null;
  } catch { return null; }
}

function changedPaths(porcelain) {
  const entries = porcelain.split('\0');
  const paths = [];
  for (let i = 0; i < entries.length; i += 1) {
    if (!entries[i]) continue;
    const status = entries[i].slice(0, 2);
    paths.push(entries[i].slice(3));
    if (/[RC]/.test(status)) paths.push(entries[++i]);
  }
  return paths;
}

export async function publicationPreflight(config, { pending = null } = {}, dependencies = {}) {
  if (config.publishEnabled !== true) throw new PublicationError('Automatic publication is disabled. Complete setup verification first.');
  const root = await realpath(config.portfolioRoot);
  if (await realpath(await git(config, ['rev-parse', '--show-toplevel'])) !== root) {
    throw new PublicationError('Portfolio must be the root of its own Git repository.');
  }
  const branch = await git(config, ['branch', '--show-current']);
  if (branch !== 'main') throw new PublicationError('Automatic publication requires the main branch.');
  const fetchRemotes = (await git(config, ['remote', 'get-url', '--all', 'origin'])).split('\n');
  const pushRemotes = (await git(config, ['remote', 'get-url', '--push', '--all', 'origin'])).split('\n');
  if (fetchRemotes.length !== 1 || pushRemotes.length !== 1) throw new PublicationError('Origin must have exactly one fetch URL and one push URL.');
  const [fetchRemote] = fetchRemotes;
  const [pushRemote] = pushRemotes;
  const expected = githubRepository(config.expectedRemote ?? '');
  const trusted = dependencies.validateRemote
    ? await dependencies.validateRemote({ fetchRemote, pushRemote, expectedRemote: config.expectedRemote })
    : expected && githubRepository(fetchRemote) === expected && githubRepository(pushRemote) === expected;
  if (!trusted) throw new PublicationError('Origin no longer matches the original GitHub repository configured during setup.');
  const status = await git(config, ['status', '--porcelain=v1', '-z', '--untracked-files=all']);
  const dirty = changedPaths(status);
  const unrelated = dirty.filter(file => !PUBLICATION_PATHS.includes(file));
  if (unrelated.length) throw new PublicationError(`Unrelated work must be committed or set aside before publication: ${[...new Set(unrelated)].join(', ')}`);
  const head = await git(config, ['rev-parse', 'HEAD']);
  const remoteLine = await git(config, ['ls-remote', '--exit-code', 'origin', 'refs/heads/main']);
  const remoteHead = remoteLine.split(/\s/)[0];
  if (!/^[a-f0-9]{40,64}$/.test(remoteHead)) throw new PublicationError('Could not establish the remote main commit.');
  if (pending) {
    if (![pending.baseHead, pending.commit].filter(Boolean).includes(head)
      || ![pending.baseHead, pending.commit].filter(Boolean).includes(remoteHead)) {
      throw new PublicationError('Git history changed while a CV commit awaited publication. Resolve it manually; the sync will not pull, rebase, or force-push.');
    }
    if (remoteHead === pending.commit && head !== pending.commit) {
      throw new PublicationError('The local branch moved after the pending CV commit was published.');
    }
  } else if (head !== remoteHead) {
    throw new PublicationError('Local main and remote main differ. Publish or reconcile existing work before automatic CV publication.');
  }
  return { head, remoteHead, pushRemote, changedPaths: dirty };
}

async function assertTree(config, tree, expectedHashes) {
  for (const file of PUBLICATION_PATHS) {
    if (!expectedHashes?.[file]) throw new PublicationError(`Missing validated hash for ${file}.`);
    const contents = await git(config, ['show', `${tree}:${file}`], { binary: true });
    const hash = createHash('sha256').update(contents).digest('hex');
    if (hash !== expectedHashes[file]) throw new PublicationError(`The staged ${file} changed after validation.`);
  }
}

/**
 * Persist the pending commit before advancing HEAD. A lost push response or
 * process crash can then be recovered without creating a duplicate commit.
 * The isolated index keeps unrelated staged content out of the commit.
 */
export async function publishValidated(config, {
  sourceHash, expectedHashes, pending = null,
  onPending = async () => {}, onPublished = async () => {},
  verify = async () => {},
} = {}, dependencies = {}) {
  let ready = await publicationPreflight(config, { pending }, dependencies);
  if (!pending) {
    await verify();
    await mkdir(config.stateDir, { recursive: true });
    const index = path.join(config.stateDir, `publish-index-${randomUUID()}`);
    const env = { GIT_INDEX_FILE: index };
    try {
      await git(config, ['read-tree', ready.head], { env });
      await git(config, ['add', '-A', '--', ...PUBLICATION_PATHS], { env });
      const tree = await git(config, ['write-tree'], { env });
      await assertTree(config, tree, expectedHashes);
      if (tree === await git(config, ['rev-parse', `${ready.head}^{tree}`])) {
        await onPublished({ sourceHash, commit: ready.head, expectedHashes });
        return { status: 'published', commit: ready.head, createdCommit: false };
      }
      const message = `Update portfolio and resume from CV\n\nCV-Sync-Source: ${sourceHash}`;
      const commit = await git(config, [
        '-c', `user.name=${config.commitName || 'CV Sync'}`,
        '-c', `user.email=${config.commitEmail || 'cv-sync@users.noreply.github.com'}`,
        'commit-tree', tree, '-p', ready.head, '-m', message,
      ]);
      pending = { sourceHash, commit, baseHead: ready.head, expectedHashes, createdAt: new Date().toISOString() };
      await onPending(pending);
    } finally {
      await rm(index, { force: true });
      await rm(`${index}.lock`, { force: true });
    }
  }

  await assertTree(config, pending.commit, pending.expectedHashes);
  ready = await publicationPreflight(config, { pending }, dependencies);
  if (ready.head === pending.baseHead) {
    await verify();
    if (await git(config, ['symbolic-ref', '--quiet', 'HEAD']) !== 'refs/heads/main') {
      throw new PublicationError('The checked-out branch changed during publication. No branch was advanced.');
    }
    // HEAD is symbolic: an editor can switch branches after preflight. Update
    // only the intended main ref, never whichever branch HEAD now points at.
    await git(config, ['update-ref', 'refs/heads/main', pending.commit, pending.baseHead]);
  }
  if (await git(config, ['symbolic-ref', '--quiet', 'HEAD']) !== 'refs/heads/main') {
    throw new PublicationError('The checked-out branch changed during publication. The pending main commit was preserved; the current index was not changed.');
  }
  // Only the four owned paths are reset in the real index. Their working-tree
  // contents stay intact, including a newer CV edit arriving during a push.
  await git(config, ['reset', '--quiet', pending.commit, '--', ...PUBLICATION_PATHS]);
  if (ready.remoteHead !== pending.commit) {
    await verify();
    const checked = await publicationPreflight(config, { pending }, dependencies);
    try {
      await git(config, ['push', '--no-follow-tags', '--recurse-submodules=no', checked.pushRemote, `${pending.commit}:refs/heads/main`]);
    } catch (error) {
      // A timeout can happen after GitHub accepted the update. Confirm its
      // exact tip before deciding the persisted pending commit needs a retry.
      const current = await publicationPreflight(config, { pending }, dependencies).catch(() => null);
      if (current?.remoteHead !== pending.commit) throw error;
    }
  }
  // A push to the already-validated URL cannot be redirected by a concurrent
  // origin edit. Refresh its usual tracking ref only if it still names the
  // pre-push commit; never overwrite a concurrent fetch's newer observation.
  try {
    const tracking = await git(config, ['rev-parse', '--verify', 'refs/remotes/origin/main']);
    if (tracking === pending.baseHead) await git(config, ['update-ref', 'refs/remotes/origin/main', pending.commit, tracking]);
  } catch { /* A missing or concurrently changed tracking ref is harmless. */ }
  await onPublished(pending);
  return { status: 'published', commit: pending.commit, createdCommit: true };
}
