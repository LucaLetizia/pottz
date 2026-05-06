# Changelog

All notable changes to Pottz will be documented in this file.

## 0.1.3

### Changed

- Pottz is now package manager agnostic (npm, pnpm, yarn, bun supported)
- Removed automatic `package.json` script injection during `init`
- CLI now prints suggested scripts instead of modifying user projects
- Improved command execution abstraction across package managers
- Updated `init` output to distinguish between CLI runner usage and optional dependency usage
