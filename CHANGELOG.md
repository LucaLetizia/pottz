# Changelog

All notable changes to Pottz will be documented in this file.

## 0.1.6

### Added

- `onExit` hook in `pottz.config.js` - runs before the app process exits. Useful for any cleanup needed before shutting the app (i.e. saving state, graceful shutdown of sidecars)

### Changed

- Rewrote desktop entry generation to use a TypeScript template file with `__POTTZ_TOKEN__` placeholders instead of an inline template string, improving maintainability and editor support
- `pottz init` and `pottz dev` now detect `vite.config.ts/js` (with `@sveltejs/kit/vite`) as the primary project config, falling back to `svelte.config.ts/js` for older projects. This adds compatibility with SvelteKit 2.62+ where `svelte.config.js` is no longer required

## 0.1.5

### Added

- `onStartup` hook in `pottz.config.js` - runs before the SvelteKit server starts and the window opens. Useful for any setup that needs to complete before the app is ready (i.e. spawning sidecar processes)

## 0.1.4

### Fixed

- Fixed Windows-specific `ENOENT: npm` error when running `pottz build`

### Changed

- Removed unnecessary `NODE_ENV` override from internal spawn calls

### Notes

- No breaking changes
- Build outputs remain identical to previous version

## 0.1.3

### Changed

- Pottz is now package manager agnostic (npm, pnpm, yarn, bun supported)
- Removed automatic `package.json` script injection during `init`
- CLI now prints suggested scripts instead of modifying user projects
- Improved command execution abstraction across package managers
- Updated `init` output to distinguish between CLI runner usage and optional dependency usage
