# Pottz

Your full-stack SvelteKit app, compiled to a native desktop app

---

## What it is

Pottz takes a SvelteKit app built with `adapter-node` and compiles it into a standalone native desktop app. The binary includes the Bun runtime, your server, and all client assets.

All SvelteKit features that depend on a server work as expected.

## Good for

- Shipping an existing SvelteKit web app as a desktop binary
- Local-first tools that read and write files or call local services
- Internal business tools that don't need to go through an app store
- Devs who know SvelteKit and want a desktop app without learning a new stack

## What it isn't

A general-purpose desktop framework. Pottz doesn't expose native OS APIs beyond what Bun already provides. No system tray, no native menus, no native file dialogs. If your app needs those, this probably isn't the right tool for you.

---

## Requirements

**To build:**

- [Bun](https://bun.sh) v1.1.0+
- `@sveltejs/adapter-node` configured in your SvelteKit project

**To run the binary (Linux):**

```bash
sudo apt install libgtk-4-1 libwebkitgtk-6.0-4 libvulkan1
```

**To run the binary (Windows):**

- Windows 11 - nothing required, WebView2 ships with the OS
- Windows 10 - [WebView2 Runtime](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) required

**End users don't need Bun installed**

---

## Running the CLI

Pottz can be run with any of the following:

```bash
bunx pottz <command>
npx pottz <command>
pnpm dlx pottz <command>
yarn dlx pottz <command>
```

---

## Quick start

```bash
# In your existing SvelteKit project
bunx pottz init

# Edit pottz.config.js to set your app name, window size, and build targets

# Dev mode with hot reload
bunx pottz dev

# Build
bunx pottz build
```

---

## Installation

Pottz is a CLI tool that runs with Bun, but it is **package manager agnostic**. It does not require Bun as your package manager.

You can use it in npm, pnpm, yarn, or bun projects.

Recommended usage:

```bash
bunx pottz init
```

Or install it as a dev dependency if you prefer:

```bash
bun add -d pottz
```

---

## Package manager support

Pottz does not require your project to use Bun.

It automatically detects your project’s package manager and uses it when:

- installing dependencies (e.g. `webview-bun`)
- running scripts during development and build

Supported package managers:

- npm
- pnpm
- yarn
- bun

Detection is based on lockfiles (`bun.lock`, `pnpm-lock.yaml`, `yarn.lock`).

This means:

- You can run Pottz in an npm project without changes
- You do not need to migrate to Bun
- Bun is only required to execute the CLI itself

---

## Setup

### 1. Configure adapter-node

Make sure your SvelteKit config uses `adapter-node`. If you're using `svelte.config.js`:

```js
import adapter from '@sveltejs/adapter-node';

export default {
  kit: {
    adapter: adapter(),
  },
};
```

Or if you're using `vite.config.ts` (SvelteKit 2.62+):

```ts
import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit({ adapter: adapter() })],
});
```

### 2. Run init

```bash
bunx pottz init
```

This will:

- Patch your SvelteKit config (`vite.config.ts/js` or `svelte.config.ts/js`) with the required CSRF config
- Create `pottz.config.js`
- Install `webview-bun`
- Update `.gitignore`

### 3. Edit `pottz.config.js`

```ts
/** @type {import('pottz').PottzConfig} */
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
    targets: ['linux-x64', 'windows-x64'],
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
    },
  },
  adapter: {
    // Must match the 'out' option in your adapter-node config
    // Only change this if you've customised adapter-node's out option
    out: 'build',
    // Must match the 'envPrefix' option in your adapter-node config
    envPrefix: '',
  },
};
```

### 4. Build

```bash
bunx pottz build
```

Binaries are produced in `dist/`:

```
dist/
├── linux-x64/my-app
└── windows-x64/my-app.exe
```

---

## Hooks

Pottz provides two optional lifecycle hooks in `pottz.config.js` that let you run code at key points during the app's lifecycle. Both hooks support async functions and only run inside the compiled binary

### Startup hook

You can define an optional `onStartup` function in `pottz.config.js` that runs before the SvelteKit server starts and the window opens

```ts
export default {
  onStartup: async () => {
    // spawn PocketBase as a sidecar
    Bun.spawn(['./pocketbase/pocketbase', 'serve', '--http=127.0.0.1:8090']);
  },
  window: { ... },
  build: { ... },
}
```

The hook only runs inside the compiled Pottz binary, so you can safely use Bun APIs here without Node fallbacks

### Exit hook

You can define an optional `onExit` function in `pottz.config.js` that runs before the app closes

```ts
export default {
  onExit: async () => {
    // gracefully shut down PocketBase or flush state
  },
  window: { ... },
  build: { ... },
}
```

Child processes spawned in `onStartup` are automatically terminated when the app closes. Use `onExit` if you need to perform async cleanup before that happens

---

## Commands

### `pottz init`

Configures an existing SvelteKit project for desktop builds. Safe to re-run - skips anything already configured

### `pottz build`

Runs a full production build:

1. `vite build` with `NODE_ENV=production`
2. Generates a VFS from client assets
3. Generates the desktop entry point with correct server chunk imports
4. Compiles a binary for each configured target
5. Cleans up generated files

### `pottz dev`

Starts the Vite dev server and opens your app in a native desktop window. Hot reload works automatically - save a file and the window updates

---

## What works

Everything you'd use in a standard SvelteKit web app, including:

- [x] SSR and `+page.server.ts` load functions
- [x] `+server.ts` API routes
- [x] Form actions
- [x] Server-only modules (`$lib/server/`)
- [x] Remote functions
- [x] Environment variables via `$env/static/private` (and `public`)
- [x] Filesystem access via `node:fs`
- [x] Spawning child processes via `Bun.spawn()`
- [x] HTTP requests from the server

The server runs locally on a dynamic port bound to `127.0.0.1`. The webview loads from it. There's no network exposure.

---

## Binary size

Binaries are ~110MB uncompressed. The majority of this is the Bun runtime

---

## Gotchas

**macOS** - not supported. You can cross-compile for Linux and Windows from a Mac, but you can't run or test the app locally

**`adapter-static`** - not supported. Pottz requires `adapter-node`

**Windows icon** - the `icon` option in `pottz.config.js` only works when building on Windows natively. Cross-compiling from Linux to Windows will produce a working binary but the icon won't be applied

**Linux system libraries** - end users on Linux need `libgtk-4-1`, `libwebkitgtk-6.0-4`, and `libvulkan1` installed. These are standard packages available via `apt`

---

## Adapter-node options

If you've customised `adapter-node`, mirror those options in `pottz.config.js`:

```js
// svelte.config.js or vite.config.ts
adapter({ out: 'my-build', envPrefix: 'APP_' });
```

```ts
// pottz.config.js
adapter: {
  out: 'my-build',
  envPrefix: 'APP_',
}
```

---

## Example

See `examples/basic-sveltekit` for a working example demonstrating most of the features listed in [What works](#what-works)

---

## License

MIT
