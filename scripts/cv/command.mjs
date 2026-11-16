import { existsSync } from 'node:fs';
import path from 'node:path';

/** Resolve npm's Windows Codex shim without invoking cmd.exe or a shell. */
export function resolveCommand(command, {
  platform = process.platform,
  env = process.env,
  execPath = process.execPath,
  cwd = process.cwd(),
  exists = existsSync,
} = {}) {
  if (typeof command !== 'string' || !command.trim()) throw new Error('Codex command must be a nonempty executable path or name.');
  if (platform !== 'win32') return { file: command, args: [] };
  const paths = path.win32;
  const extension = paths.extname(command).toLowerCase();
  const hasDirectory = paths.dirname(command) !== '.' || paths.isAbsolute(command);
  const searchPath = Object.entries(env).find(([key]) => key.toUpperCase() === 'PATH')?.[1] || '';
  const directories = searchPath.split(';').filter(Boolean).map(directory => directory.replace(/^"(.*)"$/, '$1'));
  let executable = command;
  if (hasDirectory) executable = paths.resolve(cwd, command);
  else {
    const names = extension ? [command] : [`${command}.exe`, `${command}.com`, `${command}.cmd`, `${command}.bat`];
    const found = directories.flatMap(directory => names.map(name => paths.join(directory, name))).find(exists);
    if (found) executable = found;
  }
  const resolvedExtension = paths.extname(executable).toLowerCase();
  if (['.js', '.mjs', '.cjs'].includes(resolvedExtension)) return { file: execPath, args: [executable] };
  if (!['.cmd', '.bat', '.ps1'].includes(resolvedExtension)) return { file: executable, args: [] };

  const directory = paths.dirname(executable);
  const native = executable.replace(/\.(cmd|bat|ps1)$/i, '.exe');
  if (exists(native)) return { file: native, args: [] };
  if (/^codex\.(cmd|bat|ps1)$/i.test(paths.basename(executable))) {
    // Global npm shims and local node_modules/.bin shims have different roots.
    // Only inspect known entrypoint paths; never interpret batch/PowerShell text.
    const packageRoots = [
      paths.join(directory, 'node_modules', '@openai', 'codex'),
      paths.resolve(directory, '..', '@openai', 'codex'),
    ];
    for (const root of packageRoots) {
      const entrypoint = paths.join(root, 'bin', 'codex.js');
      if (exists(entrypoint)) return { file: execPath, args: [entrypoint] };
    }
  }
  throw new Error('Codex resolves to a Windows shell shim without a known native executable or @openai/codex entrypoint. Install @openai/codex or configure --codex with its native .exe path.');
}
