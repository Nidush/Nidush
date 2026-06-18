import { ImageSourcePropType } from 'react-native';

export interface Ingredient {
  item: string;
  amount: string;
}
export type InstructionStep = {
  text: string;
  duration?: number;
  description?: string;
  url?: string;
};

export interface Content {
  id: string;
  title: string;
  type: 'video' | 'recipe' | 'audio' | 'workout' | 'exercise' | string;
  category: 'meditation' | 'audiobook' | 'cooking' | 'workout' | string;
  description: string;
  duration: string;
  image: ImageSourcePropType;
  instructions?: (string | InstructionStep)[];
  ingredients?: Ingredient[];
  videoUrl?: string;
  author?: string;
}

export interface ScenarioDeviceState {
  deviceId: string;
  state: 'on' | 'off';
  value?: number | string;
  brightness?: string;
  color?: string;
  temperature?: number;
  mode?: string;
  deviceName?: string;
  deviceType?: string;
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  room_id?: string; // Tornado opcional para os mocks
  room?: string;    // Adicionado para compatibilidade
  image: ImageSourcePropType;
  category?: 'My creations' | string;
  devices: ScenarioDeviceState[];
  playlist?: string;
  playlist_id?: string;
  focusMode: boolean;
  shortcuts: boolean;
  keywords?: string[];
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  room_id?: string; 
  room?: string;    
  image: ImageSourcePropType;
  category?: 'My creations' | 'Simple recipes' | 'For the morning' | string;
  type: 'cooking' | 'meditation' | 'workout' | 'audiobooks' | 'general' | 'reading' | 'yoga' | 'other';
  scenario_id?: string;
  scenarioId?: string; 
  content_id?: string;
  contentId?: string;  
  shortcuts: boolean;
  keywords?: string[];
  created_at?: string;
  updated_at?: string;
}

export type UserState = 'RELAXED' | 'FOCUSED' | 'STRESSED' | 'ANXIOUS';

export interface WearableData {
  deviceId: string;
  source?: string;
  timestamp: number;
  heartRate: number;
  hrv: number;
  skinTemperature: number;
  eda: number;
  stressScore: number;
  detectedState: UserState;
}
