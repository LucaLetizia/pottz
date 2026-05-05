import { log } from '../utils/log';
import {
  checkAdapterNode,
  patchSvelteConfig,
  validateSvelteKitProject,
} from '../core/sveltekit';
import { installWebviewBun, scaffoldConfig } from '../core/config';
import { patchGitignore, patchPackageJson } from '../core/patcher';

export const run = async () => {
  log.blank();
  log.title('Pottz init');
  log.blank();

  // 1. Validate we're in a SvelteKit project
  await validateSvelteKitProject();

  // 2. Check adapter-node is installed
  await checkAdapterNode();

  // 3. Patch svelte.config
  await patchSvelteConfig();

  // 4. Scaffold pottz.config.js
  await scaffoldConfig();

  // 5. Install webview-bun
  await installWebviewBun();

  // 6. Patch package.json scripts
  await patchPackageJson();

  // 7. Patch .gitignore
  await patchGitignore();

  // 8. Print next steps
  log.blank();
  log.success('Pottz initialised successfully!');
  log.blank();
  log.info('Next steps:');
  log.info('1. Edit pottz.config.js to set your app name and window size');
  log.info('2. Run: bun run build:desktop');
  log.blank();
};
