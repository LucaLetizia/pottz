import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtemp, rm, writeFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  loadConfig,
  scaffoldConfig,
  validateConfig,
  type PottzConfig,
  type Target,
} from './config';

// ============================================
// validateConfig
// ============================================
describe('validateConfig', () => {
  it('panics if window.title is missing', () => {
    expect(() =>
      validateConfig({
        window: {} as PottzConfig['window'],
        build: { targets: ['linux-x64'], outDir: 'dist', appName: 'app' },
      }),
    ).toThrow();
  });

  it('panics if targets is empty', () => {
    expect(() =>
      validateConfig({
        window: { title: 'App' },
        build: { targets: [], outDir: 'dist', appName: 'app' },
      }),
    ).toThrow();
  });

  it('panics on invalid target', () => {
    expect(() =>
      validateConfig({
        window: { title: 'App' },
        build: {
          targets: ['invalid-target' as Target],
          outDir: 'dist',
          appName: 'app',
        },
      }),
    ).toThrow();
  });

  it('passes for valid config', () => {
    expect(() =>
      validateConfig({
        window: { title: 'App' },
        build: { targets: ['linux-x64'], outDir: 'dist', appName: 'app' },
      }),
    ).not.toThrow();
  });
});

// ============================================
// loadConfig
// ============================================

describe('loadConfig', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'pottz-test-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('throws if no pottz.config.js found', async () => {
    expect(loadConfig(tmpDir)).rejects.toThrow();
  });

  it('loads a valid config file', async () => {
    const configContent = `
export default {
  window: { title: 'Test App', width: 1200, height: 800 },
  build: { targets: ['linux-x64'], outDir: 'dist', appName: 'test' },
};
`;
    await writeFile(join(tmpDir, 'pottz.config.js'), configContent, 'utf-8');
    const config = await loadConfig(tmpDir);
    expect(config.window.title).toBe('Test App');
    expect(config.build.appName).toBe('test');
    expect(config.build.targets).toEqual(['linux-x64']);
  });

  it('loads config with adapter options', async () => {
    const configContent = `
export default {
  window: { title: 'Test' },
  build: { targets: ['linux-x64'], outDir: 'dist', appName: 'test' },
  adapter: { out: 'custom', envPrefix: 'APP_' },
};
`;
    await writeFile(join(tmpDir, 'pottz.config.js'), configContent, 'utf-8');
    const config = await loadConfig(tmpDir);
    expect(config.adapter?.out).toBe('custom');
    expect(config.adapter?.envPrefix).toBe('APP_');
  });

  it('loads config with multiple targets', async () => {
    const configContent = `
export default {
  window: { title: 'Test' },
  build: { targets: ['linux-x64', 'windows-x64', 'linux-arm64'], outDir: 'dist', appName: 'test' },
};
`;
    await writeFile(join(tmpDir, 'pottz.config.js'), configContent, 'utf-8');
    const config = await loadConfig(tmpDir);
    expect(config.build.targets).toHaveLength(3);
    expect(config.build.targets).toContain('windows-x64');
  });
});

// ============================================
// scaffoldConfig
// ============================================

describe('scaffoldConfig', () => {
  let tmpDir: string;
  let originalCwd: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'pottz-test-'));
    originalCwd = process.cwd();
    process.chdir(tmpDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('creates pottz.config.js if it does not exist', async () => {
    await scaffoldConfig();
    const content = await readFile(join(tmpDir, 'pottz.config.js'), 'utf-8');
    expect(content).toContain('PottzConfig');
    expect(content).toContain('window');
    expect(content).toContain('build');
  });

  it('does not overwrite existing pottz.config.js', async () => {
    const existing = '// my custom config';
    await writeFile(join(tmpDir, 'pottz.config.js'), existing, 'utf-8');
    await scaffoldConfig();
    const content = await readFile(join(tmpDir, 'pottz.config.js'), 'utf-8');
    expect(content).toBe(existing);
  });

  it('generated config contains all expected sections', async () => {
    await scaffoldConfig();
    const content = await readFile(join(tmpDir, 'pottz.config.js'), 'utf-8');
    expect(content).toContain('title');
    expect(content).toContain('width');
    expect(content).toContain('height');
    expect(content).toContain('targets');
    expect(content).toContain('outDir');
    expect(content).toContain('appName');
  });
});
