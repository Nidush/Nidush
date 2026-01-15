import { Activity } from '@/constants/data/types';
import { MaterialIcons } from '@expo/vector-icons';
import React, { ComponentProps } from 'react';
import { View } from 'react-native';
import { SelectionCard } from '../SelectionCard';
import { StepWrapper } from '../StepWrapper';

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

// Mapeamento visual para os tipos de dados
const ACTIVITY_TYPES_MAP: Record<
  string,
  { label: string; icon: MaterialIconName }
> = {
  cooking: { label: 'Cooking', icon: 'restaurant' },
  audiobooks: { label: 'Audiobook', icon: 'menu-book' },
  meditation: { label: 'Meditation', icon: 'self-improvement' },
  workout: { label: 'Workout', icon: 'fitness-center' },
};

interface Step1Props {
  selected: string;
  onSelect: (type: Activity['type']) => void;
}

export const Step1_Type = ({ selected, onSelect }: Step1Props) => {
  // Converte o objeto em array para o map
  const options = Object.entries(ACTIVITY_TYPES_MAP).map(([key, value]) => ({
    id: key as Activity['type'],
    ...value,
  }));

  return (
    <StepWrapper
      title="What do you want to do?"
      subtitle="Select the activity type you want to do."
    >
      <View className="flex-row flex-wrap gap-3 justify-between">
        {options.map((option) => (
          <SelectionCard
            key={option.id}
            label={option.label}
            icon={option.icon}
            isSelected={selected === option.id}
            onPress={() => onSelect(option.id)}
          />
        ))}
      </View>
    </StepWrapper>
  );
};
