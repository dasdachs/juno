type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  enabled: boolean;
  minLevel: LogLevel;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const config: LoggerConfig = {
  enabled: import.meta.env.DEV,
  minLevel: 'debug',
};

function shouldLog(level: LogLevel): boolean {
  return config.enabled && LOG_LEVELS[level] >= LOG_LEVELS[config.minLevel];
}

export const logger = {
  debug: (...args: unknown[]): void => {
    if (shouldLog('debug')) {
      console.log('[DEBUG]', ...args);
    }
  },

  info: (...args: unknown[]): void => {
    if (shouldLog('info')) {
      console.log('[INFO]', ...args);
    }
  },

  warn: (...args: unknown[]): void => {
    if (shouldLog('warn')) {
      console.warn('[WARN]', ...args);
    }
  },

  error: (...args: unknown[]): void => {
    if (shouldLog('error')) {
      console.error('[ERROR]', ...args);
    }
  },

  setEnabled: (enabled: boolean): void => {
    config.enabled = enabled;
  },

  setMinLevel: (level: LogLevel): void => {
    config.minLevel = level;
  },
};

export type { LogLevel };
