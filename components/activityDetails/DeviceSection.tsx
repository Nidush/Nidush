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

          return (
            <View
              key={i}
              className="w-[48%] flex-row items-center px-3 py-3 rounded-xl border border-[#548f537f]"
            >
              {getDeviceIcon(realDevice.type, '#548F53')}
              <View className="ml-3 justify-center flex-1">
                <Text
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
                          className="text-[#548F53] text-sm"
                          style={{ fontFamily: 'Nunito_600SemiBold' }}
                        >
                          {config.brightness || '100%'}
                        </Text>
                      </>
                    ) : (
                      <Text
                        className="text-[#548F53] text-sm"
                        style={{ fontFamily: 'Nunito_600SemiBold' }}
                      >
                        {config.value}
                        {/* AQUI ESTÁ A ALTERAÇÃO: Adiciona ºC se for termóstato */}
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
