import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { log } from '../utils/log';

const GUI_SUBSYSTEM = 0x2;
const CONSOLE_SUBSYSTEM = 0x3;
const GITIGNORE_ENTRIES = [
  'dist',
  'pottz/vfs.generated.ts',
  'pottz/desktop-entry.generated.ts',
];

// ===================================================================
// WINDOWS SUBSYSTEM PATCHING
// https://github.com/oven-sh/bun/issues/19916#issuecomment-3299059370
// ===================================================================
export const patchWindowsSubsystem = async (filePath: string) => {
  log.step('Patching Windows subsystem...');
  const data = await readFile(filePath);
  const buffer = Buffer.from(data);

  const peOffset = buffer.readUInt32LE(0x3c);
  const subsystemOffset = peOffset + 0x5c;
  const currentSubsystem = buffer.readUInt16LE(subsystemOffset);

  if (currentSubsystem !== CONSOLE_SUBSYSTEM) {
    log.info('Subsystem already patched or unexpected value, skipping');
    return;
  }

  buffer.writeUInt16LE(GUI_SUBSYSTEM, subsystemOffset);
  await writeFile(filePath, buffer);
  log.success('Windows subsystem patched (console → GUI)');
};

// ============================================
// GITIGNORE PATCHING
// ============================================

export const patchGitignore = async () => {
  log.step('Updating .gitignore...');

  const content = existsSync('.gitignore')
    ? await readFile('.gitignore', 'utf-8')
    : '';

  const missing = GITIGNORE_ENTRIES.filter((entry) => !content.includes(entry));

  if (missing.length === 0) {
    log.success('.gitignore already up to date');
    return;
  }

  const addition = '\n# Pottz generated files\n' + missing.join('\n') + '\n';
  await writeFile('.gitignore', content + addition, 'utf-8');
  log.success('Updated .gitignore');
};
