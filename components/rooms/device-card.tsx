import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { PanResponder, Text, TouchableOpacity, View } from 'react-native';

export type DeviceType = 'light' | 'speaker' | 'difuser' | 'purifier';

export interface Device {
  id: number;
  name: string;
  type: DeviceType;
  status: 'On' | 'Off';
  level?: number;
}

interface IconProps {
  type: DeviceType;
  size?: number;
  color: string;
  isFilled?: boolean;
}

interface DeviceCardProps {
  item: Device;
  onToggle: () => void;
  onUpdateLevel: (level: number) => void;
}

const GetDeviceIcon = ({ type, size = 40, color, isFilled }: IconProps) => {
  switch (type) {
    case 'light':
      return (
        <MaterialIcons
          name={isFilled ? 'lightbulb' : 'lightbulb-outline'}
          size={size}
          color={color}
        />
      );
    case 'speaker':
      return <MaterialIcons name="speaker" size={size} color={color} />;
    case 'difuser':
      return (
        <MaterialCommunityIcons name="air-purifier" size={size} color={color} />
      );
    case 'purifier':
      return <MaterialIcons name="air" size={size} color={color} />;
    default:
      return (
        <MaterialIcons name="lightbulb-outline" size={size} color={color} />
      );
  }
};

const DeviceCard = ({ item, onToggle, onUpdateLevel }: DeviceCardProps) => {
  const isOn = item.status === 'On';
  const isDimmable = item.type === 'light';

  const [level, setLevel] = useState(item.level ?? 100);

  const stateRef = useRef({ isOn, isDimmable, level });

  useEffect(() => {
    stateRef.current = { isOn, isDimmable, level };
  }, [isOn, isDimmable, level]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, { dx, dy }) => {
        const { isOn, isDimmable } = stateRef.current;
        return (
          isOn && isDimmable && Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 5
        );
      },
      onPanResponderTerminationRequest: () => false,

      onPanResponderMove: (_, gestureState) => {
        const adjustment = -gestureState.dy / 25;
        setLevel((prev) => Math.max(0, Math.min(100, prev + adjustment)));
      },

      onPanResponderRelease: () => {
        onUpdateLevel(stateRef.current.level);
      },
    }),
  ).current;

  let containerBg = 'bg-[#F1F3EA]';

  if (isOn) {
    if (item.type === 'light') {
      containerBg = 'bg-[#E9D58F]';
    } else {
      containerBg = 'bg-[#BBE6BA]';
    }
  }

  const borderStyle = isOn ? 'border-0' : 'border border-[#548f537f]';

  const sliderFillColor = 'bg-[#FFE57C]';

  return (
    <View
      className={`w-[48%] ${containerBg} ${borderStyle} rounded-2xl h-44 mb-4 overflow-hidden relative`}
      {...panResponder.panHandlers}
      accessible={true} // Agrupa todo o cartão num único elemento de foco
      accessibilityRole={isOn && isDimmable ? 'adjustable' : 'button'} // "adjustable" ativa os gestos de swipe do VoiceOver
      accessibilityLabel={`${item.name}, ${isOn ? 'On' : 'Off'}`}
      accessibilityValue={
        isOn && isDimmable
          ? { min: 0, max: 100, now: Math.round(level) }
          : undefined
      }
      accessibilityHint={
        isOn ? 'Double tap to turn off' : 'Double tap to turn on'
      }
      accessibilityActions={[
        { name: 'activate', label: isOn ? 'Turn off' : 'Turn on' },
      ]}
      onAccessibilityAction={(event) => {
        switch (event.nativeEvent.actionName) {
          case 'activate': // Quando o utilizador de VoiceOver faz duplo toque no cartão
            onToggle();
            break;
          case 'increment': // Quando o utilizador faz "swipe up"
            if (isOn && isDimmable) {
              const newLevel = Math.min(100, level + 10);
              setLevel(newLevel);
              onUpdateLevel(newLevel);
            }
            break;
          case 'decrement': // Quando o utilizador faz "swipe down"
            if (isOn && isDimmable) {
              const newLevel = Math.max(0, level - 10);
              setLevel(newLevel);
              onUpdateLevel(newLevel);
            }
            break;
        }
      }}
    >
      {isOn && isDimmable && (
        <View
          className={`absolute bottom-0 left-0 right-0 ${sliderFillColor}`}
          style={{ height: `${level}%` }}
        />
      )}
      <View className="flex-1 p-4 justify-between z-10 bg-transparent">
        <View
          className="flex-row justify-between items-start "
          importantForAccessibility="no-hide-descendants"
        >
          <GetDeviceIcon
            type={item.type}
            color={isOn ? '#354F52' : '#7A8C85'}
            isFilled={isOn}
          />

          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className={`w-12 h-12 rounded-full border items-center justify-center 
              ${isOn ? 'bg-[#548F53] border-transparent' : 'border-[#548f537f] bg-transparent'}`}
          >
            <MaterialIcons
              name="power-settings-new"
              size={25}
              color={isOn ? '#FFFFFF' : '#354F52'}
              accessibilityRole="button"
              accessibilityLabel={isOn ? 'Turn off device' : 'Turn on device'}
            />
          </TouchableOpacity>
        </View>

        <View>
          <Text
            className="text-[#354F52] font-semibold text-base mb-1"
            numberOfLines={1}
            style={{ fontFamily: 'Nunito_600SemiBold' }}
          >
            {item.name}
          </Text>
          <Text
            className="text-[#354F52] text-xl"
            style={{ fontFamily: 'Nunito_600SemiBold' }}
          >
            {isOn ? (isDimmable ? `${Math.round(level)}%` : 'On') : 'Off'}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default DeviceCard;
