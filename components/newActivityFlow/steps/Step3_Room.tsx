import { ROOMS } from '@/constants/data';
import React from 'react';
import { View } from 'react-native';
import { SelectionCard } from '../SelectionCard';
import { StepWrapper } from '../StepWrapper';

interface Step3Props {
  selected: string;
  onSelect: (id: string) => void;
}

export const Step3_Room = ({ selected, onSelect }: Step3Props) => {
  return (
    <StepWrapper title="Where will it happen?" subtitle="Select the room.">
      <View className="flex-row flex-wrap gap-3 justify-between">
        {ROOMS.map((r) => (
          <SelectionCard
            key={r.id}
            label={r.name}
            icon={r.icon}
            isSelected={selected === r.id}
            onPress={() => onSelect(r.id)}
          />
        ))}
      </View>
    </StepWrapper>
  );
};
