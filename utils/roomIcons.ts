import { MaterialIcons } from '@expo/vector-icons';
import { ROOMS } from '@/constants/data/rooms';

export type RoomIconName = React.ComponentProps<typeof MaterialIcons>['name'];

const ROOM_ICON_RULES: Array<{ icon: RoomIconName; keywords: string[] }> = [
  { icon: 'bed', keywords: ['bed', 'bedroom', 'quarto', 'suite', 'guest room'] },
  { icon: 'restaurant', keywords: ['kitchen', 'cook', 'cozinha', 'dining', 'meal'] },
  { icon: 'weekend', keywords: ['living', 'lounge', 'sala', 'sofa', 'tv room'] },
  { icon: 'bathtub', keywords: ['bath', 'bathroom', 'wc', 'toilet', 'banho'] },
  { icon: 'computer', keywords: ['office', 'desk', 'study', 'studio', 'work'] },
  { icon: 'fitness-center', keywords: ['gym', 'workout', 'training', 'yoga', 'pilates'] },
  { icon: 'sports-esports', keywords: ['game', 'gaming', 'playroom'] },
  { icon: 'local-laundry-service', keywords: ['laundry', 'wash', 'lavandaria'] },
  { icon: 'deck', keywords: ['garden', 'outdoor', 'patio', 'balcony', 'terrace', 'varanda'] },
  { icon: 'book', keywords: ['library', 'books', 'reading'] },
  { icon: 'chair', keywords: ['closet', 'wardrobe', 'dressing'] },
  { icon: 'self-improvement', keywords: ['meditation', 'zen', 'relax', 'wellness'] },
  { icon: 'movie', keywords: ['cinema', 'movie', 'theater'] },
  { icon: 'child-care', keywords: ['kid', 'kids', 'child', 'baby', 'nursery'] },
  { icon: 'directions-car', keywords: ['garage', 'car'] },
];

const normalizeRoomName = (value: string) => value.trim().toLowerCase();

export const getRoomIconName = (roomName: string) => {
  const normalized = normalizeRoomName(roomName);
  const fallback = ROOMS.find((room) => normalizeRoomName(room.name) === normalized);
  if (fallback) return fallback.icon;

  const matchedRule = ROOM_ICON_RULES.find((rule) =>
    rule.keywords.some((keyword) => normalized.includes(keyword)),
  );

  return matchedRule?.icon ?? 'home';
};
