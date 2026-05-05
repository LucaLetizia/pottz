# Pottz Example App

A minimal SvelteKit app included with Pottz to demonstrate that core server-side features work correctly after being packaged into a native desktop binary

## Features Demonstrated

- `+page.server.ts` server-side load functions
- form actions
- `+server.ts` API routes
- remote functions
- server-only modules (`$lib/server/*`)
- private and public environment variables

Each feature is exposed through a simple UI panel so behavior can be tested and visually confirmed.

## Environment Variables

This repository includes a `.env.example` file.

Before running locally, rename it to:

```bash
.env
```

## Running the example

### Dev (standard SvelteKit)

```bash
bun install
bun run dev
```

### Dev (desktop window with hot reload)

```bash
bunx pottz dev
```

### Build desktop binary

```bash
bunx pottz build
```

Binaries are produced in `dist/`

## Note on exposed values

This app intentionally renders values from server-only modules and private environment variables in the UI to confirm they are being handled server-side. These are fake demo values. Do not do this in a real app.
