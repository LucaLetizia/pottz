import { readdir } from 'node:fs/promises';
import { log } from '../utils/log';
import { type PottzConfig } from './config';

export const GENERATED_ENTRY = './pottz/desktop-entry.generated.ts';

export const generateDesktopEntry = async (config: PottzConfig) => {
  log.step('Generating desktop entry...');

  const outDir = config.adapter?.out ?? 'build';
  const envPrefix = config.adapter?.envPrefix ?? '';

  // Scan chunks
  const chunks = await readdir(`./${outDir}/server/chunks`);
  const jsChunks = chunks.filter(
    (f) => f.endsWith('.js') && !f.endsWith('.map'),
  );

  if (!jsChunks.length) {
    log.warn('No server chunks found in build/server/chunks/');
    log.warn('Your app may not render correctly');
    log.info('Make sure you are using adapter-node');
  }

  const chunkImports = jsChunks
    .map((f) => `  await import('../${outDir}/server/chunks/${f}');`)
    .join('\n');

  const { width = 1200, height = 800, title = 'App' } = config.window;

  const entry = `export {};
const isWorkerMode = process.argv.includes('--webview-worker');

if (isWorkerMode) {
  const { Webview } = await import('webview-bun');
  const url = process.argv[process.argv.indexOf('--url') + 1];
  const webview = new Webview(false, { width: ${width}, height: ${height}, hint: 0 });
  webview.title = ${JSON.stringify(title)};
  webview.navigate(url);
  webview.run();
  process.exit(0);
} else {
  const { vfs } = await import('./vfs.generated.ts');
  const { Server } = await import('../${outDir}/server/index.js');
  const { manifest } = await import('../${outDir}/server/manifest.js');
  const { default: config } = await import('../pottz.config.js');

  if(config?.onStartup){
    await config.onStartup();
  }

  // Pre-import all server chunks so __memo lazy imports resolve instantly
${chunkImports}

  await Promise.all(
    manifest._.nodes.map((node: () => Promise<unknown>) => node())
  );

  async function getFreePort(): Promise<number> {
    const listener = Bun.listen({
      hostname: '127.0.0.1',
      port: 0,
      socket: { open() {}, close() {}, data() {}, error() {} }
    });
    const port = listener.port;
    listener.stop(true);
    return port;
  }

  function serveFromVfs(pathname: string): Response | null {
    const direct = vfs[pathname];
    if (direct) return toResponse(direct);
    const withClient = vfs[\`/client\${pathname}\`];
    if (withClient) return toResponse(withClient);
    return null;
  }

  function toResponse(entry: { data: string; mime: string }): Response {
    const bytes = Buffer.from(entry.data, 'base64');
    return new Response(bytes, {
      headers: { 'Content-Type': entry.mime }
    });
  }

  const port = await getFreePort();

const serverEnv = {
    ...Bun.env,
    ${JSON.stringify(`${envPrefix}PORT`)}: String(port),
    ${JSON.stringify(`${envPrefix}HOST`)}: '127.0.0.1',
    POTTZ_ORIGIN: \`http://127.0.0.1:\${port}\`,
  } as Record<string, string>;

  // Strip SOCKET_PATH - if set it overrides PORT/HOST and breaks desktop mode
  delete serverEnv['SOCKET_PATH'];
  delete serverEnv[${JSON.stringify(`${envPrefix}SOCKET_PATH`)}];

  const skServer = new Server(manifest);
  await skServer.init({ env: serverEnv });

  const bunServer = Bun.serve({
    port,
    hostname: '127.0.0.1',
    async fetch(req: Request) {
      const url = new URL(req.url);
      const vfsResponse = serveFromVfs(url.pathname);
      if (vfsResponse) return vfsResponse;
      return await skServer.respond(req, {
        getClientAddress() {
          return bunServer.requestIP(req)?.address ?? '127.0.0.1';
        }
      });
    }
  });

  async function cleanup() {
    if(config?.onExit){
      await config.onExit();
    }
    await bunServer.stop();
    process.exit(0);
  }

  process.on('SIGINT', () => { cleanup().catch(console.error); });
  process.on('SIGTERM', () => { cleanup().catch(console.error); });

  const webviewProcess = Bun.spawn(
    [process.execPath, '--webview-worker', '--url', \`http://127.0.0.1:\${port}\`],
    { stdout: null, stderr: null }
  );

  webviewProcess.exited.then(() => cleanup());
}
`;

  await Bun.write(GENERATED_ENTRY, entry);
  log.success(`Desktop entry generated with ${jsChunks.length} chunk imports`);
};
