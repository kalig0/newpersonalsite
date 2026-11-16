import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export function isMainModule(moduleUrl, argumentPath = process.argv[1]) {
  if (!argumentPath) return false;
  try {
    return realpathSync(fileURLToPath(moduleUrl)) === realpathSync(argumentPath);
  } catch {
    return false;
  }
}
