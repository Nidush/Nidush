import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  LayoutAnimation,
  Platform,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { ReviewCard } from './ReviewCard';

// Habilitar animações no Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Interfaces
interface ScenarioDevice {
  deviceId: string;
  state: string;
  value?: string | number;
  brightness?: string;
}

interface ScenarioEnvironment {
  id: string;
  title: string;
  playlist?: string;
  focusMode: boolean;
  devices: ScenarioDevice[];
}

interface ScenarioReviewCardProps {
  environment: ScenarioEnvironment | null;
  onEdit: () => void;
}

// Helper para ícones (movido para aqui)
const getDeviceIcon = (id: string) => {
  if (id.includes('light')) return 'lightbulb';
  if (id.includes('speaker')) return 'speaker';
  if (id.includes('thermostat')) return 'thermostat';
  if (id.includes('diffuser')) return 'air';
  if (id.includes('purifier')) return 'filter-vintage';
  return 'devices';
};

export const ScenarioReviewCard = ({
  environment,
  onEdit,
}: ScenarioReviewCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleScenario = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  return (
    <ReviewCard label="Environment" onEdit={onEdit}>
      <TouchableOpacity
        onPress={toggleScenario}
        activeOpacity={0.7}
        className="flex-row justify-between items-center"
      >
        <View className="flex-row items-center">
          <View className="w-11 h-11 rounded-xl bg-[#C8E2C8] justify-center items-center mr-3">
            <MaterialIcons name="landscape" size={24} color="#354F52" />
          </View>
          <Text
            className="text-base text-[#2F4F4F]"
            style={{ fontFamily: 'Nunito_700Bold' }}
          >
            {environment?.title || 'Not selected'}
          </Text>
        </View>
        <MaterialIcons
          name={isExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
          size={24}
          color="#354F52"
        />
      </TouchableOpacity>

      {/* Dropdown Content */}
      {isExpanded && environment && (
        <View className="mt-4 border-t border-[#DDE5D7] pt-3">
          <View className="flex-row justify-between mb-4">
            {environment.playlist && (
              <View className="flex-row items-center flex-1 mr-2">
                <Ionicons name="musical-notes" size={16} color="#548F53" />
                <Text
                  className="ml-2 text-[#2F4F4F] text-sm"
                  style={{ fontFamily: 'Nunito_600SemiBold' }}
                  numberOfLines={1}
                >
                  {environment.playlist}
                </Text>
              </View>
            )}

            <View className="flex-row items-center bg-white px-2 py-1 rounded-lg border border-[#DDE5D7]">
              <Ionicons
                name={environment.focusMode ? 'moon' : 'sunny'}
                size={12}
                color={environment.focusMode ? '#5E35B1' : '#F9A825'}
              />
              <Text
                className="ml-1 text-xs text-[#2F4F4F]"
                style={{ fontFamily: 'Nunito_600SemiBold' }}
              >
                Focus: {environment.focusMode ? 'On' : 'Off'}
              </Text>
            </View>
          </View>

          <Text
            className="text-xs text-[#6A7D5B] mb-2 uppercase tracking-widest"
            style={{ fontFamily: 'Nunito_700Bold' }}
          >
            Devices
          </Text>

          {environment.devices?.map((device, index) => (
            <View
              key={index}
              className="flex-row items-center justify-between mb-2 bg-white/60 p-2 rounded-lg"
            >
              <View className="flex-row items-center">
                <MaterialIcons
                  name={getDeviceIcon(device.deviceId) as any}
                  size={18}
                  color="#354F52"
                />
                <Text
                  className="ml-2 text-sm text-[#2F4F4F]"
                  style={{ fontFamily: 'Nunito_600SemiBold' }}
                >
                  {device.deviceId
                    .replace('dev_', '')
                    .replace('_', ' ')
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                </Text>
              </View>
              <Text
                className="text-sm text-[#548F53]"
                style={{ fontFamily: 'Nunito_700Bold' }}
              >
                {device.value ? device.value.toString() : 'On'}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ReviewCard>
  );
};
