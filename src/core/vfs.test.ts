import { describe, it, expect } from 'bun:test';

describe('path normalisation', () => {
  it('normalises Windows backslashes in VFS keys', () => {
    const windowsPath = '_app\\immutable\\assets\\0.D4KJz-T3.css';
    const normalised = windowsPath.replace(/\\/g, '/');
    expect(normalised).toBe('_app/immutable/assets/0.D4KJz-T3.css');
    expect(normalised).not.toContain('\\');
  });
});
