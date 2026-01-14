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
  // Nova prop para decidir o ícone (opcional, default é 'info')
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
  type = 'info', // Valor por defeito
  onClose,
  onConfirm,
  confirmText = 'OK',
  cancelText = 'Cancel',
  isDestructive = false,
}: CustomAlertProps) => {
  // Função para escolher o ícone e a cor baseada no tipo
  const getHeaderConfig = () => {
    switch (type) {
      case 'success':
        return { icon: 'checkmark-circle', color: '#548F53' }; // Verde
      case 'error':
        return { icon: 'alert-circle', color: '#D32F2F' }; // Vermelho
      case 'warning':
        return { icon: 'warning', color: '#FFA000' }; // Laranja
      case 'info':
      default:
        return { icon: 'information-circle', color: '#548F53' }; // Verde/Azul
    }
  };

  const headerConfig = getHeaderConfig();

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* SUBSTITUIÇÃO: Fundo preto semi-transparente pelo BlurView */}
      <BlurView
        intensity={Platform.OS === 'android' ? 10 : 10}
        tint="dark" // 'dark' mantém o aspeto escurecido mas com blur
        experimentalBlurMethod="dimezisBlurView"
        className="flex-1 justify-center items-center px-6"
      >
        {/* Deteta toque fora para fechar */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View className="absolute inset-0" />
        </TouchableWithoutFeedback>

        {/* Cartão Branco */}
        <View className="bg-white w-full rounded-3xl p-6 items-center shadow-lg">
          {/* NOVO: Ícone no topo */}
          <View className="mb-4">
            <Ionicons
              name={headerConfig.icon as any}
              size={48}
              color={headerConfig.color}
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

          {/* Botões */}
          <View className="flex-row w-full space-x-3 gap-3">
            {onConfirm && (
              <TouchableOpacity
                onPress={onClose}
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

            {/* Botão Confirmar */}
            <TouchableOpacity
              onPress={() => {
                if (onConfirm) onConfirm();
                onClose();
              }}
              // Se for destrutivo (ex: apagar), podes querer mudar a cor para vermelho aqui também
              className={`flex-1 py-3 rounded-full items-center bg-[#548F53]`}
            >
              <Text
                className={`text-lg text-white`}
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
