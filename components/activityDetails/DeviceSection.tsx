import { ScenarioDeviceState } from '@/constants/data';
import { DeviceType, SMART_HOME_DEVICES } from '@/constants/devices';
import {
  Feather,
  MaterialCommunityIcons,
  MaterialIcons,
} from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

const getDeviceIcon = (type: DeviceType, color: string) => {
  switch (type) {
    case 'light':
      return <MaterialIcons name="lightbulb-outline" size={20} color={color} />;
    case 'thermostat':
      return (
        <MaterialCommunityIcons name="thermometer" size={20} color={color} />
      );
    case 'speaker':
      return <MaterialIcons name="speaker" size={20} color={color} />;
    case 'blind':
      return <MaterialCommunityIcons name="blinds" size={20} color={color} />;
    case 'diffuser':
      return (
        <MaterialCommunityIcons name="air-humidifier" size={20} color={color} />
      );
    case 'purifier':
      return (
        <MaterialCommunityIcons name="air-filter" size={20} color={color} />
      );
    default:
      return <Feather name="cpu" size={20} color={color} />;
  }
};

interface DeviceSectionProps {
  devices: ScenarioDeviceState[];
}

export const DeviceSection = ({ devices }: DeviceSectionProps) => {
  if (devices.length === 0) return null;

  return (
    <View className="mb-8">
      <Text
        className="text-[#354F52] text-xl mb-3"
        style={{ fontFamily: 'Nunito_700Bold' }}
        accessible
        accessibilityRole="header"
      >
        Selected Devices
      </Text>
      <View className="flex-row flex-wrap gap-3">
        {devices.map((config, i) => {
          const realDevice = SMART_HOME_DEVICES[config.deviceId];
          if (!realDevice) return null;

          const isLight = realDevice.type === 'light';
          const isColorValue =
            typeof config.value === 'string' &&
            config.value.trim().startsWith('#');
          const hasDetails = !!config.value;

          // Cria label de acessibilidade detalhada
          const accessibilityText = `${realDevice.name}${
            hasDetails
              ? isLight && isColorValue
                ? `, color ${config.value}, brightness ${config.brightness || '100%'}`
                : `, value ${config.value}${realDevice.type === 'thermostat' ? ' degrees Celsius' : ''}`
              : ''
          }`;

          return (
            <View
              key={i}
              className="w-[48%] flex-row items-center px-3 py-3 rounded-xl border border-[#548f537f]"
              accessible={true} // Diz que isto é um único bloco para ler
              accessibilityRole="text" // Corrige o summary para text (já que é só informação)
              accessibilityLabel={accessibilityText}
              // REDUÇÃO DE RUÍDO: Esconde os ícones e textos internos porque a Label acima já faz todo o trabalho!
              importantForAccessibility="no-hide-descendants" // Android
              accessibilityElementsHidden={true} // iOS
            >
              {getDeviceIcon(realDevice.type, '#548F53')}
              <View className="ml-3 justify-center flex-1">
                <Text
                  maxFontSizeMultiplier={1.2}
                  className={`text-[#354F52] text-sm capitalise ${
                    hasDetails ? 'mb-0.5' : 'mb-0'
                  }`}
                  style={{ fontFamily: 'Nunito_700Bold' }}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {realDevice.name}
                </Text>

                {hasDetails && (
                  <View className="flex-row items-center">
                    {isLight && isColorValue ? (
                      <>
                        <View
                          style={{
                            width: 14,
                            height: 14,
                            borderRadius: 7,
                            backgroundColor: config.value as string,
                            borderWidth: 1,
                            borderColor: '#E5E5E5',
                            marginRight: 6,
                          }}
                        />
                        <Text
                          maxFontSizeMultiplier={1.2}
                          className="text-[#548F53] text-sm"
                          style={{ fontFamily: 'Nunito_600SemiBold' }}
                        >
                          {config.brightness || '100%'}
                        </Text>
                      </>
                    ) : (
                      <Text
                        maxFontSizeMultiplier={1.2}
                        className="text-[#548F53] text-sm"
                        style={{ fontFamily: 'Nunito_600SemiBold' }}
                      >
                        {config.value}
                        {realDevice.type === 'thermostat' ? 'ºC' : ''}
                      </Text>
                    )}
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};
