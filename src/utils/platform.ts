import { existsSync } from 'node:fs';
import { panic } from './log';

type PackageManager = 'bun' | 'pnpm' | 'yarn' | 'npm';
type Command = {
  cmd: string;
  args: string[];
  options?: Omit<Parameters<typeof Bun.spawn>[1], 'argv'>;
};
type PackageManagerCommands = {
  installDev: (pkg: string) => Command;
  run: (script: string) => Command;
};
type PMMap = Record<PackageManager, PackageManagerCommands>;

export type StreamProcess = {
  process: ReturnType<typeof Bun.spawn>;
  stdout: ReadableStream<Uint8Array> | null;
  stderr: ReadableStream<Uint8Array> | null;
  kill: () => void;
  exited: Promise<number>;
};

export const PM: PMMap = {
  bun: {
    installDev: (pkg) => ({ cmd: 'bun', args: ['add', '-d', pkg] }),
    run: (script) => ({ cmd: 'bun', args: ['run', script] }),
  },
  pnpm: {
    installDev: (pkg) => ({ cmd: 'pnpm', args: ['add', '-D', pkg] }),
    run: (script) => ({ cmd: 'pnpm', args: [script] }),
  },
  yarn: {
    installDev: (pkg) => ({ cmd: 'yarn', args: ['add', '-D', pkg] }),
    run: (script) => ({ cmd: 'yarn', args: [script] }),
  },
  npm: {
    installDev: (pkg) => ({ cmd: 'npm', args: ['install', '-D', pkg] }),
    run: (script) => ({ cmd: 'npm', args: ['run', script] }),
  },
};

export const execCommand = async (command: Command) => {
  const proc = Bun.spawn([command.cmd, ...command.args], {
    stdout: 'inherit',
    stderr: 'inherit',
    ...command.options,
  });

  return await proc.exited;
};

export const execStream = (command: Command): StreamProcess => {
  const process = Bun.spawn([command.cmd, ...command.args], {
    stdout: 'pipe',
    stderr: 'pipe',
  });

  return {
    process,
    stdout: process.stdout,
    stderr: process.stderr,
    kill: () => process.kill(),
    exited: process.exited,
  };
};

export const detectPackageManager = (): PackageManager => {
  if (existsSync('bun.lock') || existsSync('bun.lockb')) return 'bun';
  if (existsSync('pnpm-lock.yaml')) return 'pnpm';
  if (existsSync('yarn.lock')) return 'yarn';
  return 'npm';
};

export const getPackageManager = () => {
  const name = detectPackageManager();
  return {
    name,
    ...PM[name],
  };
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
