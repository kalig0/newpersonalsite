import { assertNode26, setup, loadConfig, saveConfig } from './config.mjs';
import { isMainModule } from './is-main.mjs';

export async function main(args = process.argv.slice(2)) {
  assertNode26();
  const command = args.shift();
  const options = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--career-ops-root' || arg === '--codex') {
      if (!args[i + 1] || args[i + 1].startsWith('--')) throw new Error(`${arg} needs a value.`);
      options[arg === '--codex' ? 'codexCommand' : 'careerOpsRoot'] = args[++i];
    } else if (['--publish', '--force', '--snapshot-only', '--verify'].includes(arg)) {
      options[{ '--snapshot-only': 'snapshotOnly' }[arg] || arg.slice(2)] = true;
    } else throw new Error(`Unknown option: ${arg}`);
  }
  if (command === 'setup') {
    const config = setup(options);
    if (options.verify) {
      const { sync } = await import('./sync.mjs');
      await sync(config, { force: true });
      config.publishEnabled = true;
      saveConfig(config);
      console.log('Full verification passed. Automatic publication is enabled on this computer.');
    } else console.log('Setup passed. Run npm run cv:setup -- --verify to generate and verify the first resume before enabling publication.');
    return;
  }
  const config = loadConfig(options);
  if (command === 'sync') {
    const { sync } = await import('./sync.mjs');
    const result = await sync(config, options);
    console.log(JSON.stringify(result, null, 2));
  } else if (command === 'watch') {
    if (config.publishEnabled !== true) throw new Error('Run npm run cv:setup -- --verify before starting the publishing watcher.');
    const { watch } = await import('./watch.mjs');
    const watcher = await watch(config, { publish: true });
    await watcher.done;
  } else throw new Error('Usage: node scripts/cv/cli.mjs setup|sync|watch [--career-ops-root path] [--publish] [--force] [--snapshot-only] [--verify]');
}

if (isMainModule(import.meta.url)) {
  main().catch(error => { console.error(`CV workflow: ${error.message}`); process.exitCode = 1; });
}
