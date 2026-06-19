import { ImageSourcePropType } from 'react-native';

export const AVATAR_PRESET_MAP = {
  'preset:logo': require('../assets/images/Logo.png'),
  'preset:profile': require('../assets/avatars/Group 216.png'),
  'preset:profile1': require('../assets/avatars/Group 217.png'),
  'preset:profile2': require('../assets/avatars/Group 218.png'),
  'preset:profile3': require('../assets/avatars/Group 219.png'),
} as const;

export type AvatarPresetKey = keyof typeof AVATAR_PRESET_MAP;

export const DEFAULT_AVATAR_PRESET: AvatarPresetKey = 'preset:logo';

export const isAvatarPreset = (value: string | null | undefined): value is AvatarPresetKey =>
  Boolean(value && value in AVATAR_PRESET_MAP);

export const getAvatarSource = (avatarUrl?: string | null): ImageSourcePropType => {
  if (isAvatarPreset(avatarUrl)) {
    return AVATAR_PRESET_MAP[avatarUrl];
  }

  if (avatarUrl) {
    return { uri: avatarUrl };
  }

  return AVATAR_PRESET_MAP[DEFAULT_AVATAR_PRESET];
};
