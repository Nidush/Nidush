import React from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { LegalContent } from './LegalContent';

type ConsentModalProps = {
  visible: boolean;
  onAccept: () => void;
};

export function ConsentModal({ visible, onAccept }: ConsentModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 justify-end bg-black/55">
        <View className="bg-white w-full rounded-t-[36px] px-6 pt-7 pb-16 max-h-[84%]">
          <View className="mb-5">
            <Text
              className="text-2xl text-[#3A4D3F]"
              style={{ fontFamily: 'Nunito_700Bold' }}
            >
              Privacy & Terms
            </Text>
            <Text
              className="text-[#71806F] mt-2 leading-5"
              style={{ fontFamily: 'Nunito_400Regular' }}
            >
              Please review and accept how Nidush handles app storage, account
              data, and integrations before using the app.
            </Text>
          </View>

          <ScrollView
            className="mb-5"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 8 }}
          >
            <LegalContent />
          </ScrollView>

          <TouchableOpacity
            onPress={onAccept}
            className="bg-[#5B8C51] py-4 rounded-full items-center shadow-md mb-4"
            accessibilityRole="button"
            accessibilityLabel="Accept privacy policy and terms of service"
          >
            <Text
              className="text-white text-lg"
              style={{ fontFamily: 'Nunito_700Bold' }}
            >
              I Accept
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
