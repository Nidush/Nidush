import { Platform } from 'react-native';
import { logger, sanitizeForLogs } from './logger';

type ObservabilityLevel = 'info' | 'warn' | 'error';

type ObservabilityContext = {
  area?: string;
  action?: string;
  screen?: string;
  feature?: string;
  userId?: string | null;
  metadata?: Record<string, unknown>;
};

type GlobalErrorUtils = {
  getGlobalHandler?: () => ((error: Error, isFatal?: boolean) => void) | undefined;
  setGlobalHandler?: (handler: (error: Error, isFatal?: boolean) => void) => void;
};

const sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const runtimeContext: Record<string, unknown> = {
  appEnv: process.env.EXPO_PUBLIC_APP_ENV || 'development',
  platform: Platform.OS,
  sessionId,
};

const formatError = (error: unknown) => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    message: typeof error === 'string' ? error : 'Unknown error',
    raw: sanitizeForLogs(error),
  };
};

const emit = (level: ObservabilityLevel, message: string, payload: Record<string, unknown>) => {
  const event = sanitizeForLogs({
    type: 'observability',
    level,
    message,
    timestamp: new Date().toISOString(),
    ...runtimeContext,
    ...payload,
  });

  if (level === 'error') {
    logger.error(event);
    return;
  }

  if (level === 'warn') {
    logger.warn(event);
    return;
  }

  logger.info(event);
};

export const setObservabilityUser = (userId: string | null | undefined) => {
  runtimeContext.userId = userId ?? null;
};

export const setObservabilityContext = (context: Record<string, unknown>) => {
  Object.assign(runtimeContext, sanitizeForLogs(context));
};

export const trackEvent = (
  name: string,
  context: ObservabilityContext = {},
  level: ObservabilityLevel = 'info',
) => {
  emit(level, name, {
    kind: 'event',
    area: context.area,
    action: context.action,
    screen: context.screen,
    feature: context.feature,
    userId: context.userId ?? runtimeContext.userId ?? null,
    metadata: context.metadata,
  });
};

export const captureException = (error: unknown, context: ObservabilityContext = {}) => {
  emit('error', context.action || 'Unhandled exception', {
    kind: 'exception',
    area: context.area,
    screen: context.screen,
    feature: context.feature,
    userId: context.userId ?? runtimeContext.userId ?? null,
    metadata: context.metadata,
    error: formatError(error),
  });
};

export const installGlobalErrorHandlers = () => {
  const errorUtils = (globalThis as { ErrorUtils?: GlobalErrorUtils }).ErrorUtils;
  const previousHandler = errorUtils?.getGlobalHandler?.();

  errorUtils?.setGlobalHandler?.((error, isFatal) => {
    captureException(error, {
      area: 'runtime',
      action: isFatal ? 'fatal-js-error' : 'js-error',
      metadata: { isFatal: Boolean(isFatal) },
    });
    previousHandler?.(error, isFatal);
  });

  if (typeof globalThis.addEventListener === 'function') {
    globalThis.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
      captureException(event.reason, {
        area: 'runtime',
        action: 'unhandled-promise-rejection',
      });
    });
  }
};
