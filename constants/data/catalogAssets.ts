import { ImageSourcePropType } from 'react-native';

const CATALOG_IMAGES: Record<string, ImageSourcePropType> = {
  'activities_for_you/evening_read.png': require('@/assets/activities_for_you/evening_read.png'),
  'activities_for_you/stretching.png': require('@/assets/activities_for_you/stretching.png'),
  'activities_for_you/sunrise_flow.png': require('@/assets/activities_for_you/sunrise_flow.png'),
  'cooking_activities/my_creations_cooking/italian_night.png': require('@/assets/cooking_activities/my_creations_cooking/italian_night.png'),
  'cooking_activities/recommended/brownies.png': require('@/assets/cooking_activities/recommended/brownies.png'),
  'cooking_activities/recommended/eggs_benedict.png': require('@/assets/cooking_activities/recommended/eggs_benedict.png'),
  'cooking_activities/simple_recipes/chocolate_cake.png': require('@/assets/cooking_activities/simple_recipes/chocolate_cake.png'),
  'cooking_activities/simple_recipes/pasta.png': require('@/assets/cooking_activities/simple_recipes/pasta.png'),
  'cooking_activities/simple_recipes/vodka_pasta.png': require('@/assets/cooking_activities/simple_recipes/vodka_pasta.png'),
  'meditation_activities/my_creations/gratitude_flow.png': require('@/assets/meditation_activities/my_creations/gratitude_flow.png'),
  'meditation_activities/recommended/visualization_for_success.png': require('@/assets/meditation_activities/recommended/visualization_for_success.png'),
  'meditation_content/video_sessions/morning_zen.png': require('@/assets/meditation_content/video_sessions/morning_zen.png'),
  'shortcuts/cooking_time.png': require('@/assets/shortcuts/cooking_time.png'),
  'shortcuts/meditation_time.png': require('@/assets/shortcuts/meditation_time.png'),
  'Scenarios/cinema_night.png': require('@/assets/Scenarios/cinema_night.png'),
  'Scenarios/deep_focus.png': require('@/assets/Scenarios/deep_focus.png'),
  'Scenarios/desert_heat.png': require('@/assets/Scenarios/desert_heat.png'),
  'Scenarios/dinner_date.png': require('@/assets/Scenarios/dinner_date.png'),
  'Scenarios/forest_bathing.png': require('@/assets/Scenarios/forest_bathing.png'),
  'Scenarios/inner_sanctuary.png': require('@/assets/Scenarios/inner_sanctuary.png'),
  'Scenarios/lavender_dream.png': require('@/assets/Scenarios/lavender_dream.png'),
  'Scenarios/moonlight_bay.png': require('@/assets/Scenarios/moonlight_bay.png'),
  'Scenarios/morning_brew.png': require('@/assets/Scenarios/morning_brew.png'),
  'Scenarios/rainy_library.png': require('@/assets/Scenarios/rainy_library.png'),
  'Scenarios/rose_garden.png': require('@/assets/Scenarios/rose_garden.png'),
  'Scenarios/slow_cooking.png': require('@/assets/Scenarios/slow_cooking.png'),
};

export const resolveCatalogImage = (
  image: ImageSourcePropType | string | null | undefined,
): ImageSourcePropType => {
  if (!image) return { uri: 'https://picsum.photos/seed/nidush/400/600' };
  if (typeof image !== 'string') return image;

  const catalogImage = CATALOG_IMAGES[image];
  if (catalogImage) return catalogImage;

  if (/^\d+$/.test(image)) {
    return { uri: `https://picsum.photos/seed/${image}/400/600` };
  }

  return { uri: image };
};
