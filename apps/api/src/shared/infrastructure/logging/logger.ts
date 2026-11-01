/**
 * Logs JSON pino expurgés. Jamais de corps de message, vote, position, jeton ou email.
 */
import pino, { type Logger } from 'pino';

export const REDACT_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.headers["idempotency-key"]',
  '*.idToken',
  '*.accessToken',
  '*.token',
  '*.password',
  '*.email',
  '*.birthDate',
  '*.body',
  '*.choice',
  '*.lat',
  '*.lng',
  '*.answer',
];

export function createLogger(level: string, base: Record<string, unknown> = {}): Logger {
  return pino({
    level,
    base: { service: 'blowy-api', ...base },
    redact: { paths: REDACT_PATHS, censor: '[expurgé]' },
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: { level: (label) => ({ level: label }) },
  });
}

export const LOGGER = Symbol('Logger');
export type { Logger };
