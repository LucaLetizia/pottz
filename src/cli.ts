#!/usr/bin/env bun
import { log, PanicError } from './utils/log';
import { fileURLToPath } from 'url';
import path from 'path';

if (typeof Bun === 'undefined') {
  log.error('Pottz requires Bun. Get it at https://bun.sh');
  process.exit(1);
}

// Suppress EPIPE errors on stdout/stderr
// occur when Vite's asymc logging writes after the pipe closes
// cosmetic issue with no functional impact
process.stdout.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EPIPE') return;
  throw err;
});

process.stderr.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EPIPE') return;
  throw err;
});

// Handle webview worker mode spawned by dev and build commands
if (process.argv.includes('--webview-worker')) {
  const cliDir = path.dirname(fileURLToPath(import.meta.url));
  if (process.cwd() !== cliDir) {
    log.warn(
      `cwd mismatch detected. Forcing cwd to CLI directory.\n` +
        `cwd: ${process.cwd()}\ncli: ${cliDir}`,
    );
    process.chdir(cliDir);
  }

  const { Webview } = await import('webview-bun');
  const url = process.argv[process.argv.indexOf('--url') + 1];
  if (!url) {
    log.error('--webview-worker requires --url');
    process.exit(1);
  }

  const title = process.env.POTTZ_WINDOW_TITLE ?? 'App';
  const width = parseInt(process.env.POTTZ_WINDOW_WIDTH ?? '1200');
  const height = parseInt(process.env.POTTZ_WINDOW_HEIGHT ?? '800');

  const webview = new Webview(false, { width, height, hint: 0 });
  webview.title = title;
  webview.navigate(url);
  webview.run();
  process.exit(0);
}

try {
  const command = process.argv[2];

  switch (command) {
    case 'init':
      await import('./commands/init').then((m) => m.run());
      break;
    case 'build':
      await import('./commands/build').then((m) => m.run());
      break;
    case 'dev':
      await import('./commands/dev').then((m) => m.run());
      break;
    case '--version':
    case '-v': {
      const pkg = await import('../package.json');
      console.log(pkg.version);
      break;
    }
    default:
      console.log(
        `
Pottz - pack your SvelteKit app as a native desktop binary

Usage:
  pottz init       Configure an existing SvelteKit project
  pottz build      Build desktop binaries
  pottz dev        Open app in desktop window with hot reload
  pottz --version  Show version
    `.trim(),
      );
      break;
  }
} catch (e) {
  if (!(e instanceof PanicError)) {
    log.error(`Unexpected error: ${e}`);
  }
  process.exit(1);
}
