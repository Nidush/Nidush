import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
// 1. Importar o Reanimated
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

interface ExitModalProps {
  visible: boolean;
  onResume: () => void;
  onEnd: () => void;
}

export const ExitModal = ({ visible, onResume, onEnd }: ExitModalProps) => {
  return (
    <Modal
      // 2. IMPORTANTE: Mudar para "none" para não entrar em conflito com a nossa animação
      animationType="none"
      transparent
      visible={visible}
    >
      {/* 3. Envolver tudo num Animated.View.
          Isto garante que o BlurView (fundo) e o View do cartão aparecem juntos. */}
      <Animated.View
        style={StyleSheet.absoluteFill} // Ocupa o ecrã todo
        entering={FadeIn.duration(300)}
        exiting={FadeOut.duration(300)}
      >
        <BlurView
          intensity={Platform.OS === 'android' ? 15 : 60}
          tint="light"
          experimentalBlurMethod="dimezisBlurView"
          className="flex-1"
          style={{ backgroundColor: 'rgba(240, 242, 235, 0.8)' }}
        >
          <Pressable
            className="flex-1 justify-center items-center px-8"
            onPress={onResume}
          >
            <TouchableWithoutFeedback>
              <View
                className="bg-[#F1F4EE] w-full rounded-3xl p-8 items-center shadow-2xl"
                style={styles.cardShadow}
              >
                <View className="mb-6">
                  <MaterialCommunityIcons
                    name="stop-circle-outline"
                    size={60}
                    color="#548F53"
                  />
                </View>

                <Text
                  className="text-[#354F52] text-3xl mb-4"
                  style={{ fontFamily: 'Nunito_700Bold' }}
                >
                  End the activity?
                </Text>
                <Text
                  className="text-center mb-8 text-[#354F52] text-md"
                  style={{ fontFamily: 'Nunito_400Regular' }}
                >
                  {
                    "It's okay if you need to stop. You can come back whenever you're ready."
                  }
                </Text>
                <TouchableOpacity
                  onPress={onResume}
                  className="bg-[#5E8C5D] w-52 py-4 rounded-full mb-4 flex-row justify-center items-center "
                >
                  <Text
                    className="text-white text-center text-2xl"
                    style={{ fontFamily: 'Nunito_700Bold' }}
                  >
                    Resume
                  </Text>
                  <View>
                    <MaterialIcons
                      name={'play-arrow'}
                      size={28}
                      color="white"
                    />
                  </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={onEnd}>
                  <Text
                    className="text-[#5E8C5D] text-xl"
                    style={{ fontFamily: 'Nunito_700Bold' }}
                  >
                    End activity
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </Pressable>
        </BlurView>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  cardShadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 3,
  },
});
