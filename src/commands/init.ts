import { log } from '../utils/log';
import {
  checkAdapterNode,
  patchKitConfig,
  validateSvelteKitProject,
} from '../core/sveltekit';
import { installWebviewBun, scaffoldConfig } from '../core/config';
import { patchGitignore } from '../core/patcher';

export const run = async () => {
  log.blank();
  log.title('Pottz init');
  log.blank();

  // 1. Validate we're in a SvelteKit project
  await validateSvelteKitProject();

  // 2. Check adapter-node is installed
  await checkAdapterNode();

  // 3. Patch svelte.config
  await patchKitConfig();

  // 4. Scaffold pottz.config.js
  await scaffoldConfig();

  // 5. Install webview-bun
  await installWebviewBun();

  // 7. Patch .gitignore
  await patchGitignore();

  // 8. Print next steps
  log.blank();
  log.success('Pottz initialised successfully!');
  log.blank();

  log.info('Next steps:');
  log.info('1. Edit pottz.config.js to set your app name and window size');
  log.blank();

  log.info('Running Pottz:');
  log.info('• Without installing:');
  log.info('  bunx pottz dev');
  log.info('  npx pottz dev');
  log.info('  pnpm dlx pottz dev');
  log.info('  yarn dlx pottz dev');
  log.blank();

  log.info('• If installed as a dependency (optional):');
  log.info('  You can add scripts to package.json:');
  log.info('    "dev:desktop": "pottz dev",');
  log.info('    "build:desktop": "pottz build"');
  log.blank();
};
