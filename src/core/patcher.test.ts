import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtemp, rm, writeFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { patchGitignore, patchPackageJson } from './patcher';

describe('patchGitignore', () => {
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

  describe('when .gitignore does not exist', () => {
    it('creates .gitignore with pottz entries', async () => {
      await patchGitignore();
      const content = await readFile(join(tmpDir, '.gitignore'), 'utf-8');
      expect(content).toContain('pottz/vfs.generated.ts');
      expect(content).toContain('pottz/desktop-entry.generated.ts');
    });

    it('adds the pottz section header', async () => {
      await patchGitignore();
      const content = await readFile(join(tmpDir, '.gitignore'), 'utf-8');
      expect(content).toContain('# Pottz generated files');
    });
  });

  describe('when .gitignore exists but is empty', () => {
    beforeEach(async () => {
      await writeFile(join(tmpDir, '.gitignore'), '', 'utf-8');
    });

    it('adds pottz entries to empty .gitignore', async () => {
      await patchGitignore();
      const content = await readFile(join(tmpDir, '.gitignore'), 'utf-8');
      expect(content).toContain('pottz/vfs.generated.ts');
      expect(content).toContain('pottz/desktop-entry.generated.ts');
    });
  });

  describe('when .gitignore already has all entries', () => {
    beforeEach(async () => {
      const existing = `node_modules\n# Pottz generated files\npottz/vfs.generated.ts\npottz/desktop-entry.generated.ts\ndist\n
      `;
      await writeFile(join(tmpDir, '.gitignore'), existing, 'utf-8');
    });

    it('does not modify .gitignore', async () => {
      const before = await readFile(join(tmpDir, '.gitignore'), 'utf-8');
      await patchGitignore();
      const after = await readFile(join(tmpDir, '.gitignore'), 'utf-8');
      expect(after).toBe(before);
    });

    it('does not duplicate entries', async () => {
      await patchGitignore();
      const content = await readFile(join(tmpDir, '.gitignore'), 'utf-8');
      const vfsCount = (content.match(/pottz\/vfs\.generated\.ts/g) ?? [])
        .length;
      const entryCount = (
        content.match(/pottz\/desktop-entry\.generated\.ts/g) ?? []
      ).length;
      expect(vfsCount).toBe(1);
      expect(entryCount).toBe(1);
    });
  });

  describe('when .gitignore has some entries already', () => {
    beforeEach(async () => {
      await writeFile(
        join(tmpDir, '.gitignore'),
        'node_modules\npottz/vfs.generated.ts\n',
        'utf-8',
      );
    });

    it('only adds missing entries', async () => {
      await patchGitignore();
      const content = await readFile(join(tmpDir, '.gitignore'), 'utf-8');
      expect(content).toContain('pottz/desktop-entry.generated.ts');
    });

    it('does not duplicate the already present entry', async () => {
      await patchGitignore();
      const content = await readFile(join(tmpDir, '.gitignore'), 'utf-8');
      const count = (content.match(/pottz\/vfs\.generated\.ts/g) ?? []).length;
      expect(count).toBe(1);
    });

    it('preserves existing content', async () => {
      await patchGitignore();
      const content = await readFile(join(tmpDir, '.gitignore'), 'utf-8');
      expect(content).toContain('node_modules');
    });
  });

  describe('when .gitignore has unrelated content', () => {
    beforeEach(async () => {
      await writeFile(
        join(tmpDir, '.gitignore'),
        'node_modules\ndist\n.env\n',
        'utf-8',
      );
    });

    it('appends pottz entries without removing existing ones', async () => {
      await patchGitignore();
      const content = await readFile(join(tmpDir, '.gitignore'), 'utf-8');
      expect(content).toContain('node_modules');
      expect(content).toContain('dist');
      expect(content).toContain('.env');
      expect(content).toContain('pottz/vfs.generated.ts');
      expect(content).toContain('pottz/desktop-entry.generated.ts');
    });
  });
});

describe('patchPackageJson', () => {
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

  const writePackageJson = async (content: object) => {
    await writeFile(
      join(tmpDir, 'package.json'),
      JSON.stringify(content, null, 2) + '\n',
      'utf-8',
    );
  };

  const readPackageJson = async () => {
    const content = await readFile(join(tmpDir, 'package.json'), 'utf-8');
    return JSON.parse(content);
  };

  describe('when no scripts exist', () => {
    beforeEach(async () => {
      await writePackageJson({ name: 'test-app', version: '1.0.0' });
    });

    it('adds build:desktop script', async () => {
      await patchPackageJson();
      const pkg = await readPackageJson();
      expect(pkg.scripts['build:desktop']).toBe('bunx pottz build');
    });

    it('adds dev:desktop script', async () => {
      await patchPackageJson();
      const pkg = await readPackageJson();
      expect(pkg.scripts['dev:desktop']).toBe('bunx pottz dev');
    });

    it('creates scripts object if it did not exist', async () => {
      await patchPackageJson();
      const pkg = await readPackageJson();
      expect(pkg.scripts).toBeDefined();
    });
  });

  describe('when scripts object exists but without pottz scripts', () => {
    beforeEach(async () => {
      await writePackageJson({
        name: 'test-app',
        version: '1.0.0',
        scripts: {
          dev: 'vite dev',
          build: 'vite build',
        },
      });
    });

    it('adds pottz scripts without removing existing ones', async () => {
      await patchPackageJson();
      const pkg = await readPackageJson();
      expect(pkg.scripts['dev']).toBe('vite dev');
      expect(pkg.scripts['build']).toBe('vite build');
      expect(pkg.scripts['build:desktop']).toBe('bunx pottz build');
      expect(pkg.scripts['dev:desktop']).toBe('bunx pottz dev');
    });

    it('preserves all other package.json fields', async () => {
      await patchPackageJson();
      const pkg = await readPackageJson();
      expect(pkg.name).toBe('test-app');
      expect(pkg.version).toBe('1.0.0');
    });
  });

  describe('when both scripts already exist', () => {
    beforeEach(async () => {
      await writePackageJson({
        name: 'test-app',
        scripts: {
          'build:desktop': 'bunx pottz build',
          'dev:desktop': 'bunx pottz dev',
        },
      });
    });

    it('does not modify the file', async () => {
      const before = await readFile(join(tmpDir, 'package.json'), 'utf-8');
      await patchPackageJson();
      const after = await readFile(join(tmpDir, 'package.json'), 'utf-8');
      expect(after).toBe(before);
    });

    it('does not overwrite existing script values', async () => {
      await patchPackageJson();
      const pkg = await readPackageJson();
      expect(pkg.scripts['build:desktop']).toBe('bunx pottz build');
      expect(pkg.scripts['dev:desktop']).toBe('bunx pottz dev');
    });
  });

  describe('when only one script already exists', () => {
    beforeEach(async () => {
      await writePackageJson({
        name: 'test-app',
        scripts: {
          'build:desktop': 'my-custom-build',
        },
      });
    });

    it('adds the missing script', async () => {
      await patchPackageJson();
      const pkg = await readPackageJson();
      expect(pkg.scripts['dev:desktop']).toBe('bunx pottz dev');
    });

    it('does not overwrite the existing custom script', async () => {
      await patchPackageJson();
      const pkg = await readPackageJson();
      expect(pkg.scripts['build:desktop']).toBe('my-custom-build');
    });
  });

  describe('output format', () => {
    beforeEach(async () => {
      await writePackageJson({ name: 'test-app', version: '1.0.0' });
    });

    it('writes valid JSON', async () => {
      await patchPackageJson();
      const content = await readFile(join(tmpDir, 'package.json'), 'utf-8');
      expect(() => JSON.parse(content)).not.toThrow();
    });

    it('ends with a newline', async () => {
      await patchPackageJson();
      const content = await readFile(join(tmpDir, 'package.json'), 'utf-8');
      expect(content.endsWith('\n')).toBe(true);
    });

    it('uses 2-space indentation', async () => {
      await patchPackageJson();
      const content = await readFile(join(tmpDir, 'package.json'), 'utf-8');
      expect(content).toContain('  "scripts"');
    });
  });
});
