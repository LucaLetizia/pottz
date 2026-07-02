import { log, panic } from '../utils/log';
import { loadConfig } from '../core/config';
import {
  checkWebviewBun,
  execStream,
  getPackageManager,
} from '../utils/platform';
import { validateSvelteKitProject } from '../core/sveltekit';

export const run = async () => {
  checkWebviewBun();

  if (process.platform === 'darwin') {
    panic('pottz dev is not supported on macOS');
  }

  // Validate we're in a SvelteKit project
  await validateSvelteKitProject();

  const config = await loadConfig();

  log.blank();
  log.info('Pottz dev starting...');
  log.blank();

  // Start Vite dev server
  const pm = getPackageManager();
  const { cmd, args } = pm.run('dev');

  log.step('Starting Vite dev server...');

  const vite = execStream({ cmd, args });

  // Read Vite port from stdout
  const port = await readVitePort(vite.stdout!);
  if (!port) panic('Vite did not print a valid port, exiting...');

  log.success(`Vite ready on port ${port}`);

  // Open webview
  log.step('Opening desktop window...');

  const cliUrl = new URL('./cli.js', import.meta.url);
  const cliPath =
    process.platform === 'win32'
      ? cliUrl.pathname.slice(1) // remove leading /
      : cliUrl.pathname;
  const webview = Bun.spawn(
    [
      process.execPath,
      cliPath,
      '--webview-worker',
      '--url',
      `http://localhost:${port}`,
    ],
    {
      stdout: 'inherit',
      stderr: 'inherit',
      env: {
        ...process.env,
        POTTZ_WINDOW_TITLE: config.window.title,
        POTTZ_WINDOW_WIDTH: String(config.window.width ?? 1200),
        POTTZ_WINDOW_HEIGHT: String(config.window.height ?? 800),
      },
    },
  );

  log.success('Desktop window opened');
  log.info('Hot reload is active - save a file to see changes');
  log.blank();

  // Handle exits
  webview.exited.then(() => {
    log.blank();
    log.step('Window closed, stopping Vite...');
    vite.kill();
    process.exit(0);
  });

  vite.exited.then((code) => {
    if (code !== 0) {
      log.blank();
      log.error('Vite crashed');
      webview.kill();
      process.exit(1);
    }
  });

  // Keep process alive
  await Promise.race([webview.exited, vite.exited]);
};

const readVitePort = async (stdout: ReadableStream): Promise<string | null> => {
  const reader = stdout.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let port: string | null = null;

  // Keep reading stdout indefinitely to prevent EPIPE
  // but return the port as soon as we find it
  (async () => {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value);

      if (!port) {
        // eslint-disable-next-line no-control-regex, no-useless-escape
        const match = buffer.match(/localhost:[\u001b\[\d;]*m?(\d+)/);
        if (match?.[1]) {
          port = match[1];
        }
      }
    }
  })();

  // Wait until port is found
  while (!port) {
    await Bun.sleep(50);
  }

  return port;
};
