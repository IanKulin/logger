export type LogLevel = 'silent' | 'error' | 'warn' | 'info' | 'debug';

export interface LogLevels {
  [level: string]: number;
  silent: -1;
  error: 0;
  warn: 1;
  info: 2;
  debug: 3;
}

export interface Colours {
  [level: string]: string;
  error: string;
  warn: string;
  info: string;
  debug: string;
  reset: string;
}

export interface LogEntry {
  level: string;
  levelNumber: number;
  time: string;
  pid: number;
  hostname: string;
  msg: string;
  callerFile?: string;
  callerLine?: number;
  [key: string]: any;
}

export type Formatter = (logEntry: LogEntry) => string;

export interface LoggerOptions {
  level?: LogLevel;
  levels?: Partial<LogLevels>;
  format?: 'json' | 'simple';
  time?: 'long' | 'short';
  callerLevel?: LogLevel;
  colours?: Partial<Colours>;
}

export default class Logger {
  options: Required<LoggerOptions> & { levels: LogLevels; colours: Colours };
  isRedirected: boolean;
  formatters: { [key: string]: Formatter };
  callerErrorCount: number;
  maxCallerErrors: number;

  constructor(options?: LoggerOptions);

  validateOptions(options: LoggerOptions): void;
  jsonFormatter(logEntry: LogEntry): string;
  simpleFormatter(logEntry: LogEntry): string;
  getCallerInfo(): { callerFile: string; callerLine: number };
  log(level: LogLevel, message: any, ...args: any[]): void;

  error(message: any, ...args: any[]): void;
  warn(message: any, ...args: any[]): void;
  info(message: any, ...args: any[]): void;
  debug(message: any, ...args: any[]): void;

  level(): LogLevel;
  level(newLevel: LogLevel): LogLevel;
  setLevel(): LogLevel;
  setLevel(newLevel: LogLevel): LogLevel;
}
