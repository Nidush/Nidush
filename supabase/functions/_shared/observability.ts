const safeStringify = (value: unknown) => {
  try {
    return JSON.stringify(value);
  } catch {
    return JSON.stringify({ message: 'Could not serialize payload' });
  }
};

const sanitize = (value: unknown): unknown => {
  if (typeof value === 'string') {
    return value
      .replace(/(Bearer\s+)[^\s]+/gi, '$1[REDACTED]')
      .replace(/([?&](?:code|token|access_token|refresh_token|apikey|api_key|password|secret)=)[^&\s]+/gi, '$1[REDACTED]');
  }

  if (Array.isArray(value)) {
    return value.map((entry) => sanitize(entry));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entryValue]) => [
        key,
        /token|password|secret|authorization|apikey|api_key|code|email/i.test(key)
          ? '[REDACTED]'
          : sanitize(entryValue),
      ]),
    );
  }

  return value;
};

export const createFunctionLogger = (functionName: string, req?: Request) => {
  const requestId = req?.headers.get('x-request-id') ??
    (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);

  const write = (level: 'INFO' | 'WARN' | 'ERROR', message: string, details?: Record<string, unknown>) => {
    console[level === 'ERROR' ? 'error' : level === 'WARN' ? 'warn' : 'log'](
      safeStringify({
        timestamp: new Date().toISOString(),
        functionName,
        requestId,
        level,
        message,
        details: sanitize(details ?? {}),
      }),
    );
  };

  return {
    requestId,
    info: (message: string, details?: Record<string, unknown>) => write('INFO', message, details),
    warn: (message: string, details?: Record<string, unknown>) => write('WARN', message, details),
    error: (message: string, details?: Record<string, unknown>) => write('ERROR', message, details),
  };
};

export const jsonResponse = (
  payload: Record<string, unknown>,
  status: number,
  headers: Record<string, string>,
) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
  });
