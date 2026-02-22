import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React from 'react';
import {
  Modal,
  Platform,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export const CustomAlert = ({
  visible,
  title,
  message,
  type = 'info',
  onClose,
  onConfirm,
  confirmText = 'OK',
  cancelText = 'Cancel',
  isDestructive = false,
}: CustomAlertProps) => {
  const getHeaderConfig = () => {
    switch (type) {
      case 'success':
        return { icon: 'checkmark-circle', color: '#548F53' };
      case 'error':
        return { icon: 'alert-circle', color: '#D32F2F' };
      case 'warning':
        return { icon: 'warning', color: '#FFA000' };
      case 'info':
      default:
        return { icon: 'information-circle', color: '#548F53' };
    }
  };

  const headerConfig = getHeaderConfig();

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      accessible
      accessibilityViewIsModal
    >
      <BlurView
        intensity={Platform.OS === 'android' ? 10 : 10}
        tint="dark"
        experimentalBlurMethod="dimezisBlurView"
        className="flex-1 justify-center items-center px-6"
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View className="absolute inset-0" />
        </TouchableWithoutFeedback>

        <View
          accessible
          accessibilityRole="alert"
          accessibilityLabel={`${type} alert: ${title}. ${message}`}
          className="bg-white w-full rounded-3xl p-6 items-center shadow-lg"
        >
          <View className="mb-4" accessible={false}>
            <Ionicons
              name={headerConfig.icon as any}
              size={48}
              color={headerConfig.color}
              accessible={false}
            />
          </View>

          <Text
            className="text-2xl text-[#354F52] mb-2 text-center"
            style={{ fontFamily: 'Nunito_700Bold' }}
          >
            {title}
          </Text>

          <Text
            className="text-base text-[#354F52] text-center mb-6 leading-5"
            style={{ fontFamily: 'Nunito_400Regular' }}
          >
            {message}
          </Text>

          <View className="flex-row w-full space-x-3 gap-3">
            {onConfirm && (
              <TouchableOpacity
                onPress={onClose}
                accessible
                accessibilityRole="button"
                accessibilityLabel={cancelText}
                className="flex-1 py-3 items-center"
              >
                <Text
                  className="text-[#548F53] text-lg"
                  style={{ fontFamily: 'Nunito_700Bold' }}
                >
                  {cancelText}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={() => {
                if (onConfirm) onConfirm();
                onClose();
              }}
              accessible
              accessibilityRole="button"
              accessibilityLabel={confirmText}
              className={`flex-1 py-3 rounded-full items-center bg-[#548F53]`}
            >
              <Text
                className="text-lg text-white"
                style={{ fontFamily: 'Nunito_700Bold' }}
              >
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </BlurView>
    </Modal>
  );
};