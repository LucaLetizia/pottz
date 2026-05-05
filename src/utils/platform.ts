import { existsSync } from 'node:fs';
import { panic } from './log';

export const detectPackageManager = (): string => {
  if (existsSync('bun.lock') || existsSync('bun.lockb')) return 'bun';
  if (existsSync('pnpm-lock.yaml')) return 'pnpm';
  if (existsSync('yarn.lock')) return 'yarn';
  return 'npm';
};

export const checkWebviewBun = () => {
  if (!existsSync('./node_modules/webview-bun')) {
    const pm = detectPackageManager();
    const addCmd = pm === 'npm' ? 'npm install -D' : `${pm} add -d`;
    panic(
      'webview-bun is not installed.\n' +
        `Run: ${addCmd} webview-bun\n` +
        'Or run: pottz init to set up your project automatically.',
    );
  }
};
