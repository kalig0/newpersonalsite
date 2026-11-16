import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { constants } from 'node:os';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isMainModule } from './is-main.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const RUNTIME_HELP = 'Install or activate Node 26, then run npm run cv:setup to record its executable on this computer.';

// Bootstrap only the CV commands. Other project commands keep their selected
// runtime, and the saved executable stays in ignored machine configuration.
export async function launch(args = process.argv.slice(2), dependencies = {}) {
  const version = dependencies.nodeVersion || process.versions.node;
  if (Number(version.split('.')[0]) === 26) {
    const runCli = dependencies.runCli || (await import('./cli.mjs')).main;
    await runCli([...args]);
    return 0;
  }

  const portfolioRoot = dependencies.portfolioRoot || ROOT;
  let saved;
  try {
    saved = JSON.parse(readFileSync(join(portfolioRoot, '.cv-sync.local.json'), 'utf8'));
  } catch {
    throw new Error(`Node 26 is required; running Node ${version}. ${RUNTIME_HELP}`);
  }
  const executable = saved.nodeExecutable;
  if (typeof executable !== 'string' || !isAbsolute(executable)) {
    throw new Error(`The saved Node 26 executable is missing or invalid. ${RUNTIME_HELP}`);
  }

  const invoke = dependencies.spawnSync || spawnSync;
  const checked = invoke(executable, ['--version'], {
    encoding: 'utf8', timeout: 15000, windowsHide: true,
  });
  if (checked.error || checked.status !== 0 || !/^v26\.\d+\.\d+$/.test(String(checked.stdout || '').trim())) {
    throw new Error(`The saved executable is unavailable or is not Node 26. ${RUNTIME_HELP}`);
  }

  // Invoke the CLI directly so a stale or misconfigured runtime cannot recurse
  // through this launcher. Argument arrays preserve spaces and shell characters.
  const child = invoke(executable, [join(portfolioRoot, 'scripts/cv/cli.mjs'), ...args], {
    stdio: 'inherit', windowsHide: false,
  });
  if (child.error) throw new Error(`Could not start the saved Node 26 executable. ${RUNTIME_HELP}`);
  if (Number.isInteger(child.status)) return child.status;
  const signalNumber = constants.signals[child.signal];
  return signalNumber ? 128 + signalNumber : 1;
}

if (isMainModule(import.meta.url)) {
  launch().then(status => { process.exitCode = status; }).catch(error => {
    console.error(`CV workflow: ${error.message}`);
    process.exitCode = 1;
  });
}
