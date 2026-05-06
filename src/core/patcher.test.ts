import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtemp, rm, writeFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { patchGitignore } from './patcher';

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
