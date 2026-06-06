// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
export {};

const isWorkerMode = process.argv.includes('--webview-worker');

if (isWorkerMode) {
  const { Webview } = await import('webview-bun');
  const url = process.argv[process.argv.indexOf('--url') + 1];
  const webview = new Webview(false, {
    width: __POTTZ_WIDTH__,
    height: __POTTZ_HEIGHT__,
    hint: 0,
  });
  webview.title = __POTTZ_TITLE__;
  webview.navigate(url);
  webview.run();
  process.exit(0);
} else {
  const { vfs } = await import('./vfs.generated.ts');
  const { Server } = await import('__POTTZ_OUT_DIR__/server/index.js');
  const { manifest } = await import('__POTTZ_OUT_DIR__/server/manifest.js');
  const { default: config } = await import('../pottz.config.js');

  if (config?.onStartup) {
    try {
      await config.onStartup();
    } catch (err) {
      console.error('[pottz] onStartup hook failed:', err);
      process.exit(1);
    }
  }

  // Pre-import all server chunks so __memo lazy imports resolve instantly
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  __POTTZ_CHUNK_IMPORTS__;

  await Promise.all(
    manifest._.nodes.map((node: () => Promise<unknown>) => node()),
  );

  async function getFreePort(): Promise<number> {
    const listener = Bun.listen({
      hostname: '127.0.0.1',
      port: 0,
      socket: { open() {}, close() {}, data() {}, error() {} },
    });
    const port = listener.port;
    listener.stop(true);
    return port;
  }

  function serveFromVfs(pathname: string): Response | null {
    const direct = vfs[pathname];
    if (direct) return toResponse(direct);
    const withClient = vfs[`/client${pathname}`];
    if (withClient) return toResponse(withClient);
    return null;
  }

  function toResponse(entry: { data: string; mime: string }): Response {
    const bytes = Buffer.from(entry.data, 'base64');
    return new Response(bytes, {
      headers: { 'Content-Type': entry.mime },
    });
  }

  const port = await getFreePort();

  const serverEnv = {
    ...Bun.env,
    __POTTZ_PORT_KEY__: String(port),
    __POTTZ_HOST_KEY__: '127.0.0.1',
    POTTZ_ORIGIN: `http://127.0.0.1:${port}`,
  } as Record<string, string>;

  delete serverEnv['SOCKET_PATH'];
  delete serverEnv[__POTTZ_SOCKET_PATH_KEY__];

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
        },
      });
    },
  });

  async function cleanup() {
    if (config?.onExit) {
      try {
        await config.onExit();
      } catch (err) {
        console.error('[pottz] onExit hook failed:', err);
      }
    }
    await bunServer.stop();
    process.exit(0);
  }

  process.on('SIGINT', () => {
    cleanup().catch(console.error);
  });
  process.on('SIGTERM', () => {
    cleanup().catch(console.error);
  });

  const webviewProcess = Bun.spawn(
    [process.execPath, '--webview-worker', '--url', `http://127.0.0.1:${port}`],
    { stdout: null, stderr: null },
  );

  webviewProcess.exited.then(() => cleanup());
}
