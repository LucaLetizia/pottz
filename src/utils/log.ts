export class PanicError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PanicError';
  }
}

const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
};

const supportsColor =
  process.stdout.isTTY && process.env.NO_COLOR === undefined;
const color = (code: string, text: string) =>
  supportsColor ? `${code}${text}${c.reset}` : text;

export const log = {
  step: (msg: string) => console.log(`${color(c.blue, '→')} ${msg}`),
  success: (msg: string) =>
    console.log(`${color(c.green, '✓')} ${color(c.green, msg)}`),
  error: (msg: string) =>
    console.error(`${color(c.red, '✗')} ${color(c.bold, color(c.red, msg))}`),
  warn: (msg: string) =>
    console.warn(`${color(c.yellow, '⚠')} ${color(c.yellow, msg)}`),
  info: (msg: string) => console.log(`  ${color(c.gray, msg)}`),
  highlight: (msg: string) => console.log(`  ${color(c.cyan, msg)}`),
  dim: (msg: string) => console.log(color(c.dim, msg)),
  title: (msg: string) => console.log(color(c.bold, msg)),
  blank: () => console.log(''),
};

export function panic(message: string): never {
  log.blank();
  log.error(message);
  log.blank();
  throw new PanicError(message);
}
