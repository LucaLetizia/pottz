import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  detectConfigFile,
  hasPottzOrigin,
  hasActiveTrustedOrigins,
} from './sveltekit';
import { tryPatchCsrf } from './sveltekit';

describe('detectConfigFile', () => {
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

  it('returns vite.config.ts if it contains @sveltejs/kit/vite with config', async () => {
    await writeFile(
      'vite.config.ts',
      `import { sveltekit } from '@sveltejs/kit/vite'\nsveltekit({ adapter: adapter() })`,
    );
    expect(await detectConfigFile()).toBe('vite.config.ts');
  });

  it('returns vite.config.js if it contains @sveltejs/kit/vite with config', async () => {
    await writeFile(
      'vite.config.js',
      `import { sveltekit } from '@sveltejs/kit/vite'\nsveltekit({ adapter: adapter() })`,
    );
    expect(await detectConfigFile()).toBe('vite.config.js');
  });

  it('prefers vite.config.ts over vite.config.js', async () => {
    await writeFile(
      'vite.config.ts',
      `import { sveltekit } from '@sveltejs/kit/vite'\nsveltekit({ adapter: adapter() })`,
    );
    await writeFile(
      'vite.config.js',
      `import { sveltekit } from '@sveltejs/kit/vite'\nsveltekit({ adapter: adapter() })`,
    );
    expect(await detectConfigFile()).toBe('vite.config.ts');
  });

  it('skips vite config that does not contain @sveltejs/kit/vite', async () => {
    await writeFile('vite.config.ts', `import { defineConfig } from 'vite'`);
    await writeFile('svelte.config.js', `export default {}`);
    expect(await detectConfigFile()).toBe('svelte.config.js');
  });

  it('falls back to svelte.config.ts if no valid vite config found', async () => {
    await writeFile('svelte.config.ts', `export default {}`);
    expect(await detectConfigFile()).toBe('svelte.config.ts');
  });

  it('prefers svelte.config.ts over svelte.config.js', async () => {
    await writeFile('svelte.config.ts', `export default {}`);
    await writeFile('svelte.config.js', `export default {}`);
    expect(await detectConfigFile()).toBe('svelte.config.ts');
  });

  it('falls back to svelte.config.js if no svelte.config.ts found', async () => {
    await writeFile('svelte.config.js', `export default {}`);
    expect(await detectConfigFile()).toBe('svelte.config.js');
  });

  it('returns null if no config file found', async () => {
    expect(await detectConfigFile()).toBeNull();
  });

  it('returns null if vite config exists but is not a SvelteKit project', async () => {
    await writeFile('vite.config.ts', `import { defineConfig } from 'vite'`);
    expect(await detectConfigFile()).toBeNull();
  });
});

describe('hasPottzOrigin', () => {
  it('returns true if POTTZ_ORIGIN is in trustedOrigins', () => {
    const content = `csrf: { trustedOrigins: process.env.POTTZ_ORIGIN ? [process.env.POTTZ_ORIGIN] : [] }`;
    expect(hasPottzOrigin(content)).toBe(true);
  });

  it('returns false if trustedOrigins exists but without POTTZ_ORIGIN', () => {
    const content = `csrf: { trustedOrigins: ['https://example.com'] }`;
    expect(hasPottzOrigin(content)).toBe(false);
  });

  it('returns false if POTTZ_ORIGIN is commented out with //', () => {
    const content = `// trustedOrigins: process.env.POTTZ_ORIGIN ? [process.env.POTTZ_ORIGIN] : []`;
    expect(hasPottzOrigin(content)).toBe(false);
  });

  it('returns false if content is empty', () => {
    expect(hasPottzOrigin('')).toBe(false);
  });

  it('returns false if POTTZ_ORIGIN appears but not in trustedOrigins', () => {
    const content = `const origin = process.env.POTTZ_ORIGIN`;
    expect(hasPottzOrigin(content)).toBe(false);
  });
});

describe('hasActiveTrustedOrigins', () => {
  it('returns true if trustedOrigins is present and uncommented', () => {
    const content = `csrf: { trustedOrigins: ['https://example.com'] }`;
    expect(hasActiveTrustedOrigins(content)).toBe(true);
  });

  it('returns false if trustedOrigins is commented out with //', () => {
    const content = `// trustedOrigins: ['https://example.com']`;
    expect(hasActiveTrustedOrigins(content)).toBe(false);
  });

  it('returns false if trustedOrigins is not present', () => {
    const content = `csrf: { checkOrigin: false }`;
    expect(hasActiveTrustedOrigins(content)).toBe(false);
  });

  it('returns false if content is empty', () => {
    expect(hasActiveTrustedOrigins('')).toBe(false);
  });

  it('returns true if trustedOrigins appears after other content on the same line', () => {
    const content = `  csrf: { trustedOrigins: [] }`;
    expect(hasActiveTrustedOrigins(content)).toBe(true);
  });

  it('handles multiline config correctly', () => {
    const content = `
const config = {
  kit: {
    csrf: {
      trustedOrigins: ['https://example.com']
    }
  }
}`;
    expect(hasActiveTrustedOrigins(content)).toBe(true);
  });
});
describe('tryPatchCsrf', () => {
  describe('basic patching', () => {
    it('injects csrf block after kit: {', () => {
      const input = `
const config = {
  kit: {
    adapter: adapter()
  }
};`;
      const result = tryPatchCsrf(input);
      expect(result).not.toBeNull();
      expect(result).toContain(
        'csrf: { trustedOrigins: process.env.POTTZ_ORIGIN',
      );
    });

    it('returns null if no kit: { found', () => {
      const input = `
const config = {
  compilerOptions: {}
};`;
      expect(tryPatchCsrf(input)).toBeNull();
    });

    it('preserves all existing content', () => {
      const input = `
import adapter from '@sveltejs/adapter-node';

const config = {
  kit: {
    adapter: adapter()
  }
};

export default config;`;
      const result = tryPatchCsrf(input);
      expect(result).toContain("import adapter from '@sveltejs/adapter-node'");
      expect(result).toContain('adapter: adapter()');
      expect(result).toContain('export default config');
    });
  });

  describe('indentation detection', () => {
    it('uses tab indentation when config uses tabs', () => {
      const input = `const config = {\n\tkit: {\n\t\tadapter: adapter()\n\t}\n};`;
      const result = tryPatchCsrf(input);
      expect(result).not.toBeNull();
      expect(result).toContain('\t\tcsrf:');
    });

    it('uses space indentation when config uses spaces', () => {
      const input = `const config = {\n  kit: {\n    adapter: adapter()\n  }\n};`;
      const result = tryPatchCsrf(input);
      expect(result).not.toBeNull();
      expect(result).toContain('    csrf:');
    });

    it('falls back to double tab when indentation cannot be detected', () => {
      const input = `const config = { kit: { adapter: adapter() } };`;
      const result = tryPatchCsrf(input);
      expect(result).not.toBeNull();
      expect(result).toContain('\t\tcsrf:');
    });
  });

  describe('edge cases', () => {
    it('handles kit: { with no space before brace', () => {
      const input = `const config = {\n  kit:{\n    adapter: adapter()\n  }\n};`;
      const result = tryPatchCsrf(input);
      expect(result).not.toBeNull();
      expect(result).toContain(
        'csrf: { trustedOrigins: process.env.POTTZ_ORIGIN',
      );
    });

    it('handles kit: { with extra whitespace', () => {
      const input = `const config = {\n  kit:   {\n    adapter: adapter()\n  }\n};`;
      const result = tryPatchCsrf(input);
      expect(result).not.toBeNull();
      expect(result).toContain(
        'csrf: { trustedOrigins: process.env.POTTZ_ORIGIN',
      );
    });

    it('csrf block is placed immediately after kit: {', () => {
      const input = `const config = {\n\tkit: {\n\t\tadapter: adapter()\n\t}\n};`;
      const result = tryPatchCsrf(input)!;
      const kitIndex = result.indexOf('kit: {');
      const csrfIndex = result.indexOf('csrf:');
      // csrf should appear shortly after kit: {
      expect(csrfIndex).toBeGreaterThan(kitIndex);
      expect(csrfIndex - kitIndex).toBeLessThan(20);
    });

    it('does not add csrf if kit block is empty', () => {
      const input = `const config = {\n\tkit: {}\n};`;
      const result = tryPatchCsrf(input);
      // Should still attempt to patch — empty kit block is valid
      expect(result).not.toBeNull();
      expect(result).toContain(
        'csrf: { trustedOrigins: process.env.POTTZ_ORIGIN',
      );
    });

    it('only patches the first kit: { occurrence', () => {
      const input = `
// kit: { this is a comment
const config = {
  kit: {
    adapter: adapter()
  }
};`;
      const result = tryPatchCsrf(input)!;
      const csrfCount = (result.match(/csrf:/g) ?? []).length;
      expect(csrfCount).toBe(1);
    });
  });

  describe('output validity', () => {
    it('produces a string with valid csrf trustedOrigins format', () => {
      const input = `const config = {\n\tkit: {\n\t\tadapter: adapter()\n\t}\n};`;
      const result = tryPatchCsrf(input)!;
      expect(result).toMatch(/csrf:\s*\{\s*trustedOrigins:/);
    });

    it('result is longer than input', () => {
      const input = `const config = {\n\tkit: {\n\t\tadapter: adapter()\n\t}\n};`;
      const result = tryPatchCsrf(input)!;
      expect(result.length).toBeGreaterThan(input.length);
    });
  });
});
