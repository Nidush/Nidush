import { ImageSourcePropType } from 'react-native';

// Ingredientes
export interface Ingredient {
  item: string;
  amount: string;
}

// Conteúdo
export interface Content {
  id: string;
  title: string;
  type: 'video' | 'recipe' | 'audio' | 'workout';
  duration: string;
  image: ImageSourcePropType;
  instructions?: string[];
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
