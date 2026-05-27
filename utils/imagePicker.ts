import * as ImagePicker from 'expo-image-picker';
import { logger } from './logger';

export const pickImage = async (): Promise<string | null> => {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    logger.warn('Gallery permission was denied.');
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
    base64: true,
  });

  if (!result.canceled && result.assets && result.assets.length > 0) {
    const asset = result.assets[0];
    const imagePayload = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
    return imagePayload;
  }

  return null;
};
