import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { PM, detectPackageManager, getPackageManager } from './platform';
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let testDir: string;

beforeEach(() => {
  testDir = mkdtempSync(join(tmpdir(), 'pottz-test-'));
});

afterEach(() => {
  rmSync(testDir, { recursive: true, force: true });
});

describe('detectPackageManager', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), 'pottz-test-'));
    process.chdir(testDir);
  });

  it('detects bun', () => {
    writeFileSync('bun.lockb', '');
    expect(detectPackageManager()).toBe('bun');
  });

  it('detects pnpm', () => {
    writeFileSync('pnpm-lock.yaml', '');
    expect(detectPackageManager()).toBe('pnpm');
  });

  it('detects yarn', () => {
    writeFileSync('yarn.lock', '');
    expect(detectPackageManager()).toBe('yarn');
  });

  it('defaults to npm', () => {
    expect(detectPackageManager()).toBe('npm');
  });
});

describe('PM installDev mapping', () => {
  it('bun installs webview-bun correctly', () => {
    const pm = PM.bun.installDev('webview-bun');

    expect(pm.cmd).toBe('bun');
    expect(pm.args).toEqual(['add', '-d', 'webview-bun']);
  });

  it('pnpm installs webview-bun correctly', () => {
    const pm = PM.pnpm.installDev('webview-bun');

    expect(pm.cmd).toBe('pnpm');
    expect(pm.args).toEqual(['add', '-D', 'webview-bun']);
  });

  it('yarn installs webview-bun correctly', () => {
    const pm = PM.yarn.installDev('webview-bun');

    expect(pm.cmd).toBe('yarn');
    expect(pm.args).toEqual(['add', '-D', 'webview-bun']);
  });

  it('npm installs webview-bun correctly', () => {
    const pm = PM.npm.installDev('webview-bun');

    expect(pm.cmd).toBe('npm');
    expect(pm.args).toEqual(['install', '-D', 'webview-bun']);
  });
});

describe('PM run dev mapping', () => {
  it('bun dev', () => {
    const pm = PM.bun.run('dev');

    expect(pm.cmd).toBe('bun');
    expect(pm.args).toEqual(['run', 'dev']);
  });

  it('pnpm dev', () => {
    const pm = PM.pnpm.run('dev');

    expect(pm.cmd).toBe('pnpm');
    expect(pm.args).toEqual(['dev']);
  });

  it('yarn dev', () => {
    const pm = PM.yarn.run('dev');

    expect(pm.cmd).toBe('yarn');
    expect(pm.args).toEqual(['dev']);
  });

  it('npm dev', () => {
    const pm = PM.npm.run('dev');

    expect(pm.cmd).toBe('npm');
    expect(pm.args).toEqual(['run', 'dev']);
  });
});

describe('PM run build mapping', () => {
  it('bun build', () => {
    const pm = PM.bun.run('build');

    expect(pm.cmd).toBe('bun');
    expect(pm.args).toEqual(['run', 'build']);
  });

  it('pnpm build', () => {
    const pm = PM.pnpm.run('build');

    expect(pm.cmd).toBe('pnpm');
    expect(pm.args).toEqual(['build']);
  });

  it('yarn build', () => {
    const pm = PM.yarn.run('build');

    expect(pm.cmd).toBe('yarn');
    expect(pm.args).toEqual(['build']);
  });

  it('npm build', () => {
    const pm = PM.npm.run('build');

    expect(pm.cmd).toBe('npm');
    expect(pm.args).toEqual(['run', 'build']);
  });
});

describe('getPackageManager wiring', () => {
  it('returns bun commands when bun lock exists', () => {
    writeFileSync('bun.lockb', '');

    const pm = getPackageManager();
    const cmd = pm.installDev('webview-bun');

    expect(cmd.cmd).toBe('bun');
  });
});
