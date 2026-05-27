import { sanitizeForLogs } from '../utils/logger';

describe('logger sanitization', () => {
  it('redacts sensitive keys in nested objects', () => {
    const sanitized = sanitizeForLogs({
      email: 'user@example.com',
      token: 'abc123',
      nested: {
        password: 'super-secret',
        label: 'safe',
      },
    });

    expect(sanitized).toEqual({
      email: '[REDACTED]',
      token: '[REDACTED]',
      nested: {
        password: '[REDACTED]',
        label: 'safe',
      },
    });
  });

  it('redacts bearer tokens and sensitive query params in strings', () => {
    expect(
      sanitizeForLogs('Bearer topsecret-token-value'),
    ).toBe('Bearer [REDACTED]');

    expect(
      sanitizeForLogs('https://example.com/callback?code=12345&state=ok'),
    ).toBe('https://example.com/callback?code=[REDACTED]&state=ok');
  });
});
