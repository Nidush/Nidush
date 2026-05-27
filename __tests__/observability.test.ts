import {
  captureException,
  setObservabilityContext,
  setObservabilityUser,
  trackEvent,
} from '../utils/observability';

describe('observability', () => {
  let infoSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    infoSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it('logs structured app events with runtime context', () => {
    setObservabilityContext({ releaseChannel: 'test' });
    setObservabilityUser('user-123');

    trackEvent('device-scan-started', {
      area: 'devices',
      screen: 'profile',
      metadata: { homeId: 7 },
    });

    expect(infoSpy).toHaveBeenCalled();
    const payload = infoSpy.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.type).toBe('observability');
    expect(payload.kind).toBe('event');
    expect(payload.userId).toBe('user-123');
  });

  it('captures exceptions without leaking raw secrets', () => {
    captureException(new Error('Token exploded'), {
      area: 'spotify',
      action: 'refresh-token',
      metadata: { access_token: 'secret-token' },
    });

    expect(errorSpy).toHaveBeenCalled();
    const payload = errorSpy.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.kind).toBe('exception');
    expect(payload.error).toMatchObject({ message: 'Token exploded' });
    expect(JSON.stringify(payload)).not.toContain('secret-token');
  });
});
