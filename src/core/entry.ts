import { readdir } from 'node:fs/promises';
import { log } from '../utils/log';
import { type PottzConfig } from './config';

export const GENERATED_ENTRY = './pottz/desktop-entry.generated.ts';

export const buildDesktopEntry = (
  template: string,
  config: PottzConfig,
  jsChunks: string[],
): string => {
  const outDir = config.adapter?.out ?? 'build';
  const envPrefix = config.adapter?.envPrefix ?? '';
  const { width = 1200, height = 800, title = 'App' } = config.window;

  const chunkImports = jsChunks
    .map((f) => `  await import('../${outDir}/server/chunks/${f}');`)
    .join('\n');

  return template
    .replace('__POTTZ_WIDTH__', String(width))
    .replace('__POTTZ_HEIGHT__', String(height))
    .replace('__POTTZ_TITLE__', JSON.stringify(title))
    .replaceAll('__POTTZ_OUT_DIR__', `../${outDir}`)
    .replace('  __POTTZ_CHUNK_IMPORTS__', chunkImports)
    .replace('__POTTZ_PORT_KEY__', JSON.stringify(`${envPrefix}PORT`))
    .replace('__POTTZ_HOST_KEY__', JSON.stringify(`${envPrefix}HOST`))
    .replace(
      '__POTTZ_SOCKET_PATH_KEY__',
      JSON.stringify(`${envPrefix}SOCKET_PATH`),
    );
};

export const generateDesktopEntry = async (config: PottzConfig) => {
  log.step('Generating desktop entry...');

  const outDir = config.adapter?.out ?? 'build';

  const chunks = await readdir(`./${outDir}/server/chunks`);
  const jsChunks = chunks.filter(
    (f) => f.endsWith('.js') && !f.endsWith('.map'),
  );

  if (!jsChunks.length) {
    log.warn('No server chunks found in build/server/chunks/');
    log.warn('Your app may not render correctly');
    log.info('Make sure you are using adapter-node');
  }

  const template = await Bun.file(
    new URL('./templates/entry.template.ts', import.meta.url),
  ).text();

  const entry = buildDesktopEntry(template, config, jsChunks);

  await Bun.write(GENERATED_ENTRY, entry);
  log.success(`Desktop entry generated with ${jsChunks.length} chunk imports`);
};
