import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

type FeedbackStateProps = {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  loading?: boolean;
  compact?: boolean;
};

export function FeedbackState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
  loading = false,
  compact = false,
}: FeedbackStateProps) {
  return (
    <View
      className={`items-center justify-center px-8 ${compact ? 'py-8' : 'py-14'}`}
      accessible
      accessibilityLabel={[title, message].filter(Boolean).join('. ')}
    >
      <View className="w-[72px] h-[72px] rounded-full bg-[#E7EFE3] items-center justify-center mb-5">
        {loading ? (
          <ActivityIndicator color="#548F53" size="large" />
        ) : (
          <MaterialIcons name={icon} size={34} color="#548F53" accessible={false} />
        )}
      </View>

      <Text
        className="text-[#354F52] text-xl text-center"
        style={{ fontFamily: 'Nunito_700Bold' }}
      >
        {title}
      </Text>

      {message ? (
        <Text
          className="text-[#6C7A74] text-center text-sm mt-3 leading-5"
          style={{ fontFamily: 'Nunito_400Regular' }}
        >
          {message}
        </Text>
      ) : null}

      {actionLabel && onAction ? (
        <TouchableOpacity
          onPress={onAction}
          className="mt-6 bg-[#548F53] rounded-full px-5 py-3"
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          <Text
            className="text-white text-base"
            style={{ fontFamily: 'Nunito_700Bold' }}
          >
            {actionLabel}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
