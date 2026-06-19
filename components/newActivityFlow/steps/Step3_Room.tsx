import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { SelectionCard } from '../SelectionCard';
import { StepWrapper } from '../StepWrapper';
import { getRoomIconName } from '@/utils/roomIcons';

type MaterialIconName = React.ComponentProps<typeof MaterialIcons>['name'];

interface RoomOption {
  id: string;
  name: string;
  icon?: MaterialIconName;
}

interface Step3Props {
  selected: string;
  onSelect: (id: string) => void;
  options: RoomOption[];
}

export const Step3_Room = ({ selected, onSelect, options }: Step3Props) => {
  return (
    <StepWrapper title="Where will it happen?" subtitle="Select the room.">
      {options.length === 0 ? (
        <View className="rounded-3xl border border-[#DDE5D7] bg-white p-5">
          <Text className="text-[#354F52] text-lg mb-2">
            No rooms available yet
          </Text>
          <Text className="text-[#6C7A74] text-base">
            Create a room in the Rooms tab before building an activity.
          </Text>
        </View>
      ) : (
        <View
          className="flex-row flex-wrap gap-3 justify-between"
          accessible={true}
          accessibilityRole="radiogroup"
          accessibilityLabel="Room options"
        >
          {options.map((r) => (
            <SelectionCard
              key={r.id}
              label={r.name}
              icon={r.icon || getRoomIconName(r.name)}
              isSelected={selected === r.id}
              onPress={() => onSelect(r.id)}
            />
          ))}
        </View>
      )}
    </StepWrapper>
  );
};
