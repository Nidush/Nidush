import { ImageSourcePropType } from 'react-native';

// Ingredientes
export interface Ingredient {
  item: string;
  amount: string;
}
export type InstructionStep = {
  text: string;
  duration?: number; // Em segundos. Se for undefined/null, é manual (o utilizador clica para avançar)
  description?: string;
};

// Conteúdo
export interface Content {
  id: string;
  title: string;
  type: 'video' | 'recipe' | 'audio' | 'workout';
  category: 'meditation' | 'audiobook' | 'cooking' | 'workout' | string;
  description: string;
  duration: string;
  image: ImageSourcePropType;
  instructions?: (string | InstructionStep)[];
  ingredients?: Ingredient[];
  videoUrl?: string;
  author?: string;
}

// Configuração de Dispositivo
export interface ScenarioDeviceState {
  deviceId: string;
  state: 'on' | 'off';
  value?: number | string;
  brightness?: string;
}

// Cenário
export interface Scenario {
  id: string;
  title: string;
  description: string;
  room: string;
  image: ImageSourcePropType;
  category?: 'My creations' | string;
  devices: ScenarioDeviceState[];
  playlist?: string;
  focusMode: boolean;
  keywords?: string[];
}

// Atividade
export interface Activity {
  id: string;
  title: string;
  description: string;
  room: string;
  image: ImageSourcePropType;
  category?: 'My creations' | 'Simple recipes' | 'For the morning' | string;
  type: 'cooking' | 'meditation' | 'workout' | 'audiobooks' | 'general';

  // Relacionamentos
  scenarioId?: string;
  contentId?: string;
  keywords?: string[];
}
