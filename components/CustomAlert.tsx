import React from 'react';
import {
  Modal,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean; // Se for true, o botão de confirmar fica vermelho (para apagar)
}

export const CustomAlert = ({
  visible,
  title,
  message,
  onClose,
  onConfirm,
  confirmText = 'OK',
  cancelText = 'Cancel',
  isDestructive = false,
}: CustomAlertProps) => {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Overlay Escuro */}
      <View className="flex-1 bg-black/40 justify-center items-center px-6">
        <TouchableWithoutFeedback onPress={onClose}>
          <View className="absolute inset-0" />
        </TouchableWithoutFeedback>

        {/* Caixa do Alerta */}
        <View className="bg-white w-full rounded-3xl p-6 items-center shadow-lg">
          <Text
            className="text-xl text-[#2F4F4F] mb-2 text-center"
            style={{ fontFamily: 'Nunito_700Bold' }}
          >
            {title}
          </Text>

          <Text
            className="text-base text-[#6A7D5B] text-center mb-6 leading-5"
            style={{ fontFamily: 'Nunito_400Regular' }}
          >
            {message}
          </Text>

          {/* Botões */}
          <View className="flex-row w-full space-x-3 gap-3">
            {/* Botão Cancelar (Só aparece se houver onConfirm) */}
            {onConfirm && (
              <TouchableOpacity
                onPress={onClose}
                className="flex-1 py-3 rounded-full border border-gray-200 bg-gray-50 items-center"
              >
                <Text
                  className="text-gray-600 text-base"
                  style={{ fontFamily: 'Nunito_600SemiBold' }}
                >
                  {cancelText}
                </Text>
              </TouchableOpacity>
            )}

            {/* Botão Confirmar */}
            <TouchableOpacity
              onPress={() => {
                if (onConfirm) onConfirm();
                onClose();
              }}
              className={`flex-1 py-3 rounded-full items-center ${
                isDestructive ? 'bg-[#FFEBEE]' : 'bg-[#548F53]'
              }`}
            >
              <Text
                className={`text-base ${isDestructive ? 'text-[#D32F2F]' : 'text-white'}`}
                style={{ fontFamily: 'Nunito_700Bold' }}
              >
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
