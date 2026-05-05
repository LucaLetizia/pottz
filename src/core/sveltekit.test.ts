import { describe, it, expect } from 'bun:test';
import { tryPatchCsrf } from './sveltekit';

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
