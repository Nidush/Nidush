import { MaterialIcons } from '@expo/vector-icons';
import { ComponentProps } from 'react';

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

export interface Room {
  id: string;
  name: string;
  icon: MaterialIconName;
}

export const ROOMS: Room[] = [
  { id: 'Bedroom', name: 'Bedroom', icon: 'bed' },
  { id: 'Kitchen', name: 'Kitchen', icon: 'restaurant' },
  { id: 'Living Room', name: 'Living Room', icon: 'weekend' },
  { id: 'Bathroom', name: 'Bathroom', icon: 'bathtub' },
];
