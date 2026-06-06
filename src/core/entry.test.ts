import { describe, test, expect } from 'bun:test';
import { buildDesktopEntry } from '../core/entry';
import { type PottzConfig } from './config';

const baseConfig: PottzConfig = {
  window: { title: 'App' },
  build: {
    targets: [],
    outDir: 'dist',
    appName: 'TestApp',
  },
};

const TEMPLATE = await Bun.file(
  new URL('../templates/entry.template.ts', import.meta.url),
).text();

describe('buildDesktopEntry', () => {
  test('substitutes width and height', () => {
    const result = buildDesktopEntry(
      TEMPLATE,
      {
        ...baseConfig,
        window: { title: 'Test', width: 800, height: 600 },
      },
      [],
    );
    expect(result).toContain('width: 800');
    expect(result).toContain('height: 600');
    expect(result).not.toContain('__POTTZ_WIDTH__');
    expect(result).not.toContain('__POTTZ_HEIGHT__');
  });

  test('JSON-encodes title correctly', () => {
    const result = buildDesktopEntry(
      TEMPLATE,
      {
        ...baseConfig,
        window: { title: 'My "App"' },
      },
      [],
    );
    expect(result).toContain('"My \\"App\\""');
  });

  test('uses default outDir of build', () => {
    const result = buildDesktopEntry(TEMPLATE, baseConfig, []);
    expect(result).toContain('../build/server/index.js');
    expect(result).not.toContain('__POTTZ_OUT_DIR__');
  });

  test('injects chunk imports', () => {
    const result = buildDesktopEntry(TEMPLATE, baseConfig, [
      'chunk-a.js',
      'chunk-b.js',
    ]);
    expect(result).toContain(
      "await import('../build/server/chunks/chunk-a.js')",
    );
    expect(result).toContain(
      "await import('../build/server/chunks/chunk-b.js')",
    );
  });

  test('handles empty envPrefix', () => {
    const result = buildDesktopEntry(TEMPLATE, baseConfig, []);
    expect(result).toContain('"PORT"');
    expect(result).toContain('"HOST"');
  });

  test('handles custom envPrefix', () => {
    const result = buildDesktopEntry(
      TEMPLATE,
      {
        ...baseConfig,
        adapter: { envPrefix: 'MY_APP_' },
      },
      [],
    );
    expect(result).toContain('"MY_APP_PORT"');
    expect(result).toContain('"MY_APP_SOCKET_PATH"');
  });

  test('no unreplaced tokens remain', () => {
    const result = buildDesktopEntry(TEMPLATE, baseConfig, []);
    expect(result).not.toMatch(/__POTTZ_[A-Z_]+__/);
  });
});
