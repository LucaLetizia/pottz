import { compile } from '../core/compiler';
import { loadConfig } from '../core/config';
import { generateDesktopEntry } from '../core/entry';
import { buildSvelteKit, detectAdapter } from '../core/sveltekit';
import { generateVfs } from '../core/vfs';
import { log } from '../utils/log';
import { checkWebviewBun } from '../utils/platform';
import { rm } from 'node:fs/promises';

const cleanupGeneratedFiles = async () => {
  await rm('./pottz', { recursive: true, force: true });
};

export const run = async () => {
  checkWebviewBun();

  log.blank();
  log.info('Pottz build starting...');
  log.blank();

  const config = await loadConfig();
  const outDir = config.adapter?.out ?? 'build';

  try {
    await buildSvelteKit();
    await detectAdapter(outDir);
    await generateVfs(outDir);
    await generateDesktopEntry(config);

    const targets = config.build.targets;
    for (const target of targets) {
      await compile(target, config);
    }

    log.blank();
    log.success('Build complete');
  } finally {
    await cleanupGeneratedFiles();
  }
};
