import { View, type ViewProps } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  accessible?: boolean;
  accessibilityRole?: ViewProps['accessibilityRole'];
};

export function ThemedView({
  style,
  lightColor,
  darkColor,
  accessible = true,
  accessibilityRole = 'none',
  ...otherProps
}: ThemedViewProps) {
  const backgroundColor = useThemeColor(
    { light: lightColor, dark: darkColor },
    'background',
  );

  return (
    <View
      style={[{ backgroundColor }, style]}
      accessible={accessible}
      accessibilityRole={accessibilityRole}
      {...otherProps}
    />
  );
}