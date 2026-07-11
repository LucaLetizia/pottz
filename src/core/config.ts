import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';
import { log, panic } from '../utils/log';
import { execCommand, getPackageManager } from '../utils/platform';

export type Target =
  | 'linux-x64'
  | 'linux-arm64'
  | 'windows-x64'
  | 'windows-arm64'
  | 'darwin-x64'
  | 'darwin-arm64';

export interface PottzConfig {
  onStartup?: () => Promise<void> | void;
  onExit?: () => Promise<void> | void;
  window: {
    title: string;
    width?: number;
    height?: number;
    minWidth?: number;
    minHeight?: number;
  };
  build: {
    targets: Target[];
    outDir: string;
    appName: string;
    windows?: {
      icon?: string; // path to .ico file
      title?: string; // exe file properties title
      publisher?: string;
      version?: string;
      description?: string;
      copyright?: string;
    };
  };
  adapter?: {
    out?: string; // must match adapter-node's out option, default 'build'
    envPrefix?: string;
  };
}

const VALID_TARGETS = [
  'linux-x64',
  'linux-arm64',
  'windows-x64',
  'windows-arm64',
  'darwin-x64',
  'darwin-arm64',
];

export const CONFIG_TEMPLATE = `/** @type {import('pottz').PottzConfig} */
export default {
  //onStartup: async () => {},
  //onExit: async () => {},
  window: {
    title: 'My App',
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
  },
  build: {
    targets: ['linux-x64', 'windows-x64', 'darwin-x64'],
    outDir: 'dist',
    appName: 'my-app',
    windows: {
      // Path to your .ico file - only applied when building on Windows
      //icon: './src/lib/assets/your-icon.ico',
      title: 'My App',
      publisher: 'Your Name',
      version: '1.0.0',
      description: 'My SvelteKit desktop app',
      copyright: 'Copyright 2026',
    }
  },
  adapter: {
    // Must match the 'out' option in your adapter-node config
    // Only change this if you've customised adapter-node's out option
    out: 'build',
    // Must match the 'envPrefix' option in your adapter-node config
    envPrefix: '',
  }
};
`;

export const validateConfig = (config: PottzConfig): void => {
  // Window validation
  if (!config.window?.title) {
    panic('pottz.config.js is missing window.title');
  }

  // Build validation
  if (!config.build?.targets?.length) {
    panic('pottz.config.js is missing build.targets');
  }
  if (!config.build?.appName) {
    panic('pottz.config.js is missing build.appName');
  }
  if (!config.build?.outDir) {
    panic('pottz.config.js is missing build.outDir');
  }

  // Target validation
  const invalidTargets = config.build.targets.filter(
    (t) => !VALID_TARGETS.includes(t),
  );

  if (invalidTargets.length) {
    panic(
      `Invalid targets: ${invalidTargets.map((t) => `"${t}"`).join(', ')}\nValid targets: ${VALID_TARGETS.join(', ')}`,
    );
  }
};

export const loadConfig = async (cwd = process.cwd()): Promise<PottzConfig> => {
  const configPath = join(cwd, 'pottz.config.js');
  if (!existsSync(configPath)) {
    panic('No pottz.config.js found. Run pottz init to create one');
  }
  const mod = await import(configPath);
  const config = mod.default as PottzConfig;

  validateConfig(config);
  return config;
};

// ============================================
// CONFIG SCAFFOLDING
// ============================================

export const scaffoldConfig = async () => {
  log.step('Creating pottz.config.js...');

  if (existsSync('pottz.config.js')) {
    log.warn('pottz.config.js already exists, skipping');
    return;
  }

  await writeFile('pottz.config.js', CONFIG_TEMPLATE, 'utf-8');
  log.success('Created pottz.config.js');
};

// ============================================
// DEPENDENCIES
// ============================================

export const installWebviewBun = async () => {
  log.step('Installing webview-bun...');

  const pkg = JSON.parse(await readFile('package.json', 'utf-8'));
  const deps = {
    ...pkg.dependencies,
    ...pkg.devDependencies,
  };

  if (deps['webview-bun']) {
    log.success('webview-bun already installed');
    return;
  }

  const pm = getPackageManager();
  const { cmd, args } = pm.installDev('webview-bun');
  const code = await execCommand({ cmd, args });

  if (code !== 0) {
    log.warn('Failed to install webview-bun automatically');
    log.info('Install it manually with: bun install webview-bun');
  } else {
    log.success('webview-bun installed');
  }
};
