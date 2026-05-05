import { join } from 'node:path';
import { Glob } from 'bun';
import { getMimeType } from '../utils/fs';
import { log, panic } from '../utils/log';

export const GENERATED_VFS = './pottz/vfs.generated.ts';
const SKIP_EXTENSIONS = new Set(['.gz', '.br', '.map']);

export const generateVfs = async (outDir: string) => {
  log.step('Generating VFS...');
  const glob = new Glob('**/*');
  const entries: string[] = [];

  for await (const file of glob.scan(`./${outDir}/client`)) {
    const ext = file.slice(file.lastIndexOf('.'));
    if (SKIP_EXTENSIONS.has(ext)) continue;

    const fullPath = join(`./${outDir}/client`, file);
    if (!(await Bun.file(fullPath).exists())) continue;

    const contents = await Bun.file(fullPath).arrayBuffer();
    const b64 = Buffer.from(contents).toString('base64');
    const mime = getMimeType(file);

    const normalizedFile = file.replace(/\\/g, '/');

    entries.push(
      `  ${JSON.stringify('/client/' + normalizedFile)}:  { data: ${JSON.stringify(b64)}, mime: ${JSON.stringify(mime)} }`,
    );
  }

  if (!entries.length) {
    panic(
      `No client assets found in ./${outDir}/client/\n` +
        'Make sure you are using adapter-node and your build completed successfully',
    );
  }

  const output = `// AUTO-GENERATED - do not edit\nexport const vfs: Record<string, { data: string, mime: string }> = {\n${entries.join(',\n')}\n};\n`;
  await Bun.write(GENERATED_VFS, output);
  log.success(`VFS generated with ${entries.length} files`);
};
