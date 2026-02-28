import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface FocusSectionProps {
  enabled: boolean;
  onToggle: (val: boolean) => void;
}

export const FocusSection = ({ enabled, onToggle }: FocusSectionProps) => {
  return (
    <View className="mb-8">
      <Text
        className="text-[#354F52] text-xl mb-3"
        style={{ fontFamily: 'Nunito_700Bold' }}
        accessible
        accessibilityRole="header"
      >
        Focus Mode
      </Text>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => onToggle(!enabled)}
        className="flex-row items-center justify-between bg-[#F0F2EB] border border-[#548f537f] p-4 rounded-2xl"
        // 3. SEMÂNTICA DE SWITCH: Todo o bloco é agora um grande botão de switch
        accessible={true}
        accessibilityRole="switch"
        accessibilityState={{ checked: enabled }}
        // Juntamos a informação principal na label e a descrição no hint
        accessibilityLabel="Do Not Disturb"
        accessibilityHint={`Notifications are currently ${
          enabled ? 'silenced' : 'enabled'
        }. Double tap to toggle.`}
      >
        {/* 4. REDUÇÃO DE RUÍDO: Escondemos os elementos de texto internos do leitor de ecrã, 
            pois toda a informação vital já está no accessibilityLabel e accessibilityHint acima */}
        <View
          className="flex-1 pr-4"
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden={true}
        >
          <Text
            className="text-[#354F52] text-lg"
            style={{ fontFamily: 'Nunito_700Bold' }}
            maxFontSizeMultiplier={1.5} // ZOOM CHECK
          >
            Do Not Disturb
          </Text>
          <Text
            className="text-[#6A7D5B] text-xs mt-1"
            style={{ fontFamily: 'Nunito_600SemiBold' }}
            maxFontSizeMultiplier={1.5} // ZOOM CHECK
          >
            {enabled ? 'Notifications silenced' : 'Notifications enabled'}
          </Text>
        </View>

        {/* 5. SWITCH VISUAL: O botão visual já não precisa de lógica de acessibilidade 
            porque a linha pai trata disso tudo. Fica puramente decorativo. */}
        <View
          className={`w-14 h-7 rounded-full px-1 justify-center ${
            enabled ? 'bg-[#548F53]' : 'bg-gray-400/60'
          }`}
          importantForAccessibility="no"
          accessibilityElementsHidden={true}
        >
          <View
            className={`w-5 h-5 bg-white rounded-full shadow-sm ${
              enabled ? 'self-end' : 'self-start'
            }`}
          />
        </View>
      </TouchableOpacity>
    </View>
  );
};
