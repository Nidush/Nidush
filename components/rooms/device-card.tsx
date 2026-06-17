import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { PanResponder, Text, TouchableOpacity, View } from 'react-native';

export type DeviceType =
  | 'light'
  | 'speaker'
  | 'difuser'
  | 'purifier'
  | 'tv'
  | 'computer'
  | 'assistant'
  | 'outlet'
  | 'display'
  | 'router'
  | 'sensor'
  | 'appliance'
  | 'coffee'
  | 'ac'
  | 'heater'
  | 'heart'
  | 'unknown';

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
  onPress?: () => void;
  onAdjustingChange?: (isAdjusting: boolean) => void;
}

const GetDeviceIcon = ({ type, size = 40, color, isFilled }: IconProps) => {
  switch (type) {
    case 'light':
      return (
        <MaterialIcons
          name={isFilled ? 'lightbulb' : 'lightbulb-outline'}
          size={size}
          color={color}
          accessible={false}
        />
      );
    case 'speaker':
      return (
        <MaterialIcons
          name="speaker"
          size={size}
          color={color}
          accessible={false}
        />
      );
    case 'difuser':
      return (
        <MaterialCommunityIcons
          name="air-purifier"
          size={size}
          color={color}
          accessible={false}
        />
      );
    case 'purifier':
      return (
        <MaterialIcons
          name="air"
          size={size}
          color={color}
          accessible={false}
        />
      );
    case 'tv':
      return (
        <MaterialIcons
          name="tv"
          size={size}
          color={color}
          accessible={false}
        />
      );
    case 'computer':
      return (
        <MaterialIcons
          name="computer"
          size={size}
          color={color}
          accessible={false}
        />
      );
    case 'assistant':
      return (
        <MaterialCommunityIcons
          name="google-assistant"
          size={size}
          color={color}
          accessible={false}
        />
      );
    case 'outlet':
      return (
        <MaterialCommunityIcons
          name="power-socket-eu"
          size={size}
          color={color}
          accessible={false}
        />
      );
    case 'display':
      return (
        <MaterialIcons
          name="cast-connected"
          size={size}
          color={color}
          accessible={false}
        />
      );
    case 'router':
      return (
        <MaterialCommunityIcons
          name="router-wireless"
          size={size}
          color={color}
          accessible={false}
        />
      );
    case 'sensor':
      return (
        <MaterialCommunityIcons
          name="access-point"
          size={size}
          color={color}
          accessible={false}
        />
      );
    case 'appliance':
      return (
        <MaterialCommunityIcons
          name="fridge-outline"
          size={size}
          color={color}
          accessible={false}
        />
      );
    case 'coffee':
      return (
        <MaterialCommunityIcons
          name="coffee-maker-outline"
          size={size}
          color={color}
          accessible={false}
        />
      );
    case 'ac':
      return (
        <MaterialCommunityIcons
          name="air-conditioner"
          size={size}
          color={color}
          accessible={false}
        />
      );
    case 'heater':
      return (
        <MaterialCommunityIcons
          name="radiator"
          size={size}
          color={color}
          accessible={false}
        />
      );
    case 'heart':
      return (
        <MaterialCommunityIcons
          name="heart-pulse"
          size={size}
          color={color}
          accessible={false}
        />
      );
    default:
      return (
        <MaterialIcons
          name="devices"
          size={size}
          color={color}
          accessible={false}
        />
      );
  }
};

const DeviceCard = ({
  item,
  onToggle,
  onUpdateLevel,
  onPress,
  onAdjustingChange,
}: DeviceCardProps) => {
  const isOn = item.status === 'On';
  const isDimmable = item.type === 'light';

  const [level, setLevel] = useState(item.level ?? 100);

  const stateRef = useRef({ isOn, isDimmable, level });
  const dragStartLevelRef = useRef(level);
  const isAdjustingRef = useRef(false);

  useEffect(() => {
    if (isAdjustingRef.current) return;
    setLevel(item.level ?? 100);
  }, [item.level]);

  useEffect(() => {
    stateRef.current = { isOn, isDimmable, level };
  }, [isOn, isDimmable, level]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, { dx, dy }) => {
        const { isOn, isDimmable } = stateRef.current;
        return (
          isOn && isDimmable && Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8
        );
      },
      onMoveShouldSetPanResponderCapture: (_, { dx, dy }) => {
        const { isOn, isDimmable } = stateRef.current;
        return (
          isOn && isDimmable && Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8
        );
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        isAdjustingRef.current = true;
        dragStartLevelRef.current = stateRef.current.level;
        onAdjustingChange?.(true);
      },

      onPanResponderMove: (_, gestureState) => {
        const nextLevel = Math.max(
          0,
          Math.min(100, dragStartLevelRef.current - gestureState.dy / 1.4),
        );
        stateRef.current.level = nextLevel;
        setLevel(nextLevel);
      },

      onPanResponderRelease: () => {
        isAdjustingRef.current = false;
        onUpdateLevel(Math.round(stateRef.current.level));
        onAdjustingChange?.(false);
      },
      onPanResponderTerminate: () => {
        isAdjustingRef.current = false;
        onAdjustingChange?.(false);
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
      onTouchStart={() => {
        if (isOn && isDimmable) {
          isAdjustingRef.current = true;
          onAdjustingChange?.(true);
        }
      }}
      onTouchEnd={() => {
        if (isOn && isDimmable) {
          isAdjustingRef.current = false;
          onAdjustingChange?.(false);
        }
      }}
      accessible={false}
    >
      <View
        style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
        pointerEvents="box-none"
        accessible={true}
        importantForAccessibility="yes"
        accessibilityRole={isOn && isDimmable ? 'adjustable' : 'button'} // "adjustable" ativa os gestos de swipe do VoiceOver
        accessibilityLabel={
          isOn && isDimmable
            ? `${item.name}, On, Brightness ${Math.round(level)} percent`
            : `${item.name}, ${isOn ? 'On' : 'Off'}`
        }
        accessibilityValue={
          isOn && isDimmable
            ? { min: 0, max: 100, now: Math.round(level) }
            : undefined
        }
        accessibilityHint={
          isOn && isDimmable
            ? 'Swipe up or down to adjust brightness. Double tap to turn off.'
            : isOn
              ? 'Double tap to turn off.'
              : 'Double tap to turn on.'
        }
        accessibilityActions={
          isOn && isDimmable
            ? [
                { name: 'activate', label: 'Turn off' },
                { name: 'increment', label: 'Increase brightness' },
                { name: 'decrement', label: 'Decrease brightness' },
              ]
            : [{ name: 'activate', label: isOn ? 'Turn off' : 'Turn on' }]
        }
        onAccessibilityAction={(event) => {
          switch (event.nativeEvent.actionName) {
            case 'activate': // Quando o utilizador de VoiceOver faz duplo toque no cartão
              onToggle();
              break;
            case 'increment': // Quando o utilizador faz "swipe up"
              if (isOn && isDimmable) {
                const newLevel = Math.min(100, level + 10);
                isAdjustingRef.current = false;
                setLevel(newLevel);
                onUpdateLevel(newLevel);
              }
              break;
            case 'decrement': // Quando o utilizador faz "swipe down"
              if (isOn && isDimmable) {
                const newLevel = Math.max(0, level - 10);
                isAdjustingRef.current = false;
                setLevel(newLevel);
                onUpdateLevel(newLevel);
              }
              break;
          }
        }}
      />
      {isOn && isDimmable && (
        <View
          className={`absolute bottom-0 left-0 right-0 ${sliderFillColor}`}
          style={{ height: `${level}%` }}
        />
      )}
      <TouchableOpacity
        className="flex-1 p-4 justify-between z-10 bg-transparent"
        activeOpacity={0.96}
        onPress={onPress}
      >
        <View
          className="flex-row justify-between items-start "
        >
          <View
            importantForAccessibility="no-hide-descendants"
            accessibilityElementsHidden={true}
          >
            <GetDeviceIcon
              type={item.type}
              color={isOn ? '#354F52' : '#7A8C85'}
              isFilled={isOn}
            />
          </View>

          <View className="items-end">
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                onToggle();
              }}
              className={`w-12 h-12 rounded-full border items-center justify-center 
                ${isOn ? 'bg-[#548F53] border-transparent' : 'border-[#548f537f] bg-transparent'}`}
              accessibilityRole="button"
              accessibilityLabel={`${isOn ? 'Turn off' : 'Turn on'} ${item.name}`}
              accessibilityHint={isOn ? 'Double tap to turn off.' : 'Double tap to turn on.'}
            >
              <MaterialIcons
                name="power-settings-new"
                size={25}
                color={isOn ? '#FFFFFF' : '#354F52'}
                accessible={false}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden={true}
        >
          <Text
            maxFontSizeMultiplier={1.2}
            className="text-[#354F52] font-semibold text-base mb-1"
            numberOfLines={1}
            style={{ fontFamily: 'Nunito_600SemiBold' }}
          >
            {item.name}
          </Text>
          <Text
            maxFontSizeMultiplier={1.2}
            className="text-[#354F52] text-xl"
            style={{ fontFamily: 'Nunito_600SemiBold' }}
          >
            {isOn ? (isDimmable ? `${Math.round(level)}%` : 'On') : 'Off'}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default DeviceCard;
