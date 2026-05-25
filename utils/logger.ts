const SENSITIVE_KEY_PATTERN = /token|password|secret|authorization|apikey|api_key|code|email/i;
const REDACTED_VALUE = '[REDACTED]';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const sanitizeString = (value: string) =>
  value
    .replace(/(Bearer\s+)[^\s]+/gi, `$1${REDACTED_VALUE}`)
    .replace(/([?&](?:code|token|access_token|refresh_token|apikey|api_key|password|secret)=)[^&\s]+/gi, `$1${REDACTED_VALUE}`);

export const sanitizeForLogs = (value: unknown): unknown => {
  if (typeof value === 'string') {
    return sanitizeString(value);
  }

  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeForLogs(entry));
  }

  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entryValue]) => [
        key,
        SENSITIVE_KEY_PATTERN.test(key) ? REDACTED_VALUE : sanitizeForLogs(entryValue),
      ]),
    );
  }

  return value;
};

const formatArgs = (args: unknown[]) => args.map((arg) => sanitizeForLogs(arg));

export const logger = {
  debug: (...args: unknown[]) => {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.log(...formatArgs(args));
    }
  },
  info: (...args: unknown[]) => {
    console.info(...formatArgs(args));
  },
  warn: (...args: unknown[]) => {
    console.warn(...formatArgs(args));
  },
  error: (...args: unknown[]) => {
    console.error(...formatArgs(args));
  },
};
