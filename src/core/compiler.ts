import { join } from 'node:path';
import { mkdir } from 'node:fs/promises';
import { log, panic } from '../utils/log';
import { patchWindowsSubsystem } from './patcher';
import { GENERATED_ENTRY } from './entry';
import type { PottzConfig, Target } from './config';

export const compile = async (target: Target, config: PottzConfig) => {
  log.step(`Compiling for ${target}...`);

  const outDir = config.build.outDir;
  const appName = config.build.appName;

  const isWindows = target.startsWith('windows');
  const outfile = isWindows
    ? `./${outDir}/${target}/${appName}.exe`
    : `./${outDir}/${target}/${appName}`;

  await mkdir(join(outDir, target), { recursive: true });

  const windowsConfig =
    isWindows && config.build.windows
      ? {
          hideConsole: true,
          ...(config.build.windows?.icon
            ? { icon: config.build.windows.icon }
            : {}),
          title: config.build.windows?.title ?? config.window.title,
          ...(config.build.windows?.publisher
            ? { publisher: config.build.windows.publisher }
            : {}),
          ...(config.build.windows?.version
            ? { version: config.build.windows.version }
            : {}),
          ...(config.build.windows?.description
            ? { description: config.build.windows.description }
            : {}),
          ...(config.build.windows?.copyright
            ? { copyright: config.build.windows.copyright }
            : {}),
        }
      : undefined;

  const result = await Bun.build({
    entrypoints: [GENERATED_ENTRY],
    compile: {
      target: `bun-${target}`,
      outfile,
      ...(windowsConfig ? { windows: windowsConfig } : {}),
    },
    minify: true,
  });

  if (!result.success) {
    for (const logR of result.logs) console.error(logR);
    panic(`Compilation failed for ${target}`);
  }

  // Patch Windows PE header to suppress console window
  if (isWindows) {
    await patchWindowsSubsystem(outfile);
  }

  log.success(`Binary produced → ${outfile}`);
};
