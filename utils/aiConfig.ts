const parseBooleanEnv = (value: string | undefined, fallback: boolean) => {
  if (typeof value !== 'string') return fallback;

  switch (value.trim().toLowerCase()) {
    case '1':
    case 'true':
    case 'yes':
    case 'on':
      return true;
    case '0':
    case 'false':
    case 'no':
    case 'off':
      return false;
    default:
      return fallback;
  }
};

const isDevelopmentBuild = typeof __DEV__ !== 'undefined' && __DEV__;

export const isAiAutoInvocationEnabled = parseBooleanEnv(
  process.env.EXPO_PUBLIC_ENABLE_AI_AUTO_CALLS,
  isDevelopmentBuild,
);
