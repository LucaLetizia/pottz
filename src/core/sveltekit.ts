import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { log, panic } from '../utils/log';
import {
  detectPackageManager,
  execCommand,
  getPackageManager,
} from '../utils/platform';

const CSRF_INSTRUCTIONS = `
⚠  Add this to your svelte.config.js/ts kit config:

   csrf: {
     trustedOrigins: process.env.POTTZ_ORIGIN ? [process.env.POTTZ_ORIGIN] : []
   }

   Without this, some SvelteKit features will not work in the desktop app
`;

export const buildSvelteKit = async () => {
  log.step('Building SvelteKit...');
  const pm = getPackageManager();
  const { cmd, args } = pm.run('build');
  const code = await execCommand({
    cmd,
    args,
  });

  if (code !== 0) panic('SvelteKit build failed');
  log.success('SvelteKit build complete');
};

// ============================================
// VALIDATORS
// ============================================

export const validateSvelteKitProject = async () => {
  log.step('Validating SvelteKit project...');

  const hasSvelteConfig =
    existsSync('svelte.config.js') || existsSync('svelte.config.ts');

  if (!hasSvelteConfig) {
    panic(
      'No svelte.config.js found. Run pottz init from the root of a SvelteKit project',
    );
  }

  if (!existsSync('package.json')) {
    panic(
      'No package.json found. Run pottz init from the root of a SvelteKit project',
    );
  }

  log.success('SvelteKit project detected');
};

export const checkAdapterNode = async () => {
  log.step('Checking for adapter-node...');

  const pkg = JSON.parse(await readFile('package.json', 'utf-8'));
  const deps = {
    ...pkg.dependencies,
    ...pkg.devDependencies,
  };

  if (!deps['@sveltejs/adapter-node']) {
    const pm = detectPackageManager();
    const addCmd = pm === 'npm' ? 'npm install -D' : `${pm} add -D`;
    log.blank();
    log.warn('@sveltejs/adapter-node is not installed');
    log.info('Pottz requires adapter-node. Install it with:');
    log.info(` ${addCmd} @sveltejs/adapter-node`);
    log.info('Then update your svelte.config.js to use it');
    log.blank();
    panic('Please install adapter-node and re-run pottz init');
  }

  log.success('adapter-node detected');
};

export const detectAdapter = async (outDir: string): Promise<void> => {
  // After SvelteKit build, check what adapter was used
  if (!existsSync(`./${outDir}/server/index.js`)) {
    if (
      existsSync(`./${outDir}/index.html`) ||
      existsSync(`./${outDir}/client/index.html`)
    ) {
      const pm = detectPackageManager();
      const addCmd = pm === 'npm' ? 'npm install -D' : `${pm} add -D`;

      panic(
        'adapter-static detected. Pottz currently requires adapter-node\n' +
          `  Install it: ${addCmd} @sveltejs/adapter-node\n`,
      );
    }
    panic(
      `Build output not found at ./${outDir}/server/index.js\n` +
        '  Make sure you are using adapter-node in your svelte.config.js\n' +
        '  and that your build completed successfully',
    );
  }
};

// ============================================
// SVELTE CONFIG PATCHING
// ============================================

export const patchSvelteConfig = async () => {
  log.step('Patching svelte.config...');

  const configPath = existsSync('svelte.config.ts')
    ? 'svelte.config.ts'
    : 'svelte.config.js';

  const content = await readFile(configPath, 'utf-8');

  // Already has trustedOrigins - nothing to do
  if (content.includes('trustedOrigins')) {
    log.success('csrf.trustedOrigins already configured');
    return;
  }

  // Already has checkOrigin: false - old style, warn
  if (content.includes('checkOrigin')) {
    log.blank();
    log.warn('Found deprecated checkOrigin in svelte.config');
    log.info('Please update it to:');
    log.info(
      '  csrf: { trustedOrigins: process.env.POTTZ_ORIGIN ? [process.env.POTTZ_ORIGIN] : [] }',
    );
    log.blank();
    return;
  }

  // Try to patch automatically
  const patched = tryPatchCsrf(content);

  if (patched) {
    await writeFile(configPath, patched, 'utf-8');
    log.success('Added csrf.trustedOrigins to svelte.config');
  } else {
    // Can't patch safely - print instructions
    log.warn(CSRF_INSTRUCTIONS);
  }
};

export function tryPatchCsrf(content: string): string | null {
  // Look for kit: { and inject csrf after it
  // Handles both: kit: { and kit: {adapter: ...
  const kitMatch = content.match(/kit:\s*\{/);
  if (!kitMatch || kitMatch.index === undefined) return null;

  const insertAt = kitMatch.index + kitMatch[0].length;
  const before = content.slice(0, insertAt);
  const after = content.slice(insertAt);

  // Detect indentation - look at what comes after kit: {
  const indentMatch = after.match(/\n(\s+)/);
  const indent = indentMatch ? indentMatch[1] : '\t\t';

  const csrfBlock = `\n${indent}csrf: { trustedOrigins: process.env.POTTZ_ORIGIN ? [process.env.POTTZ_ORIGIN] : [] },`;
  return before + csrfBlock + after;
}
