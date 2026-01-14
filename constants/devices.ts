// src/constants/devices.ts

export type DeviceType =
  | 'light'
  | 'speaker'
  | 'diffuser'
  | 'purifier'
  | 'thermostat'
  | 'blind';

export interface SmartDevice {
  id: string;
  name: string;
  type: DeviceType;
  room: string;
}

export const SMART_HOME_DEVICES: Record<string, SmartDevice> = {
  // --- QUARTO (BEDROOM) ---
  dev_light_bed: {
    id: 'dev_light_bed',
    name: 'Bedroom Lights',
    type: 'light',
    room: 'Bedroom',
  },
  dev_speaker_bed: {
    id: 'dev_speaker_bed',
    name: 'Bedside Speaker',
    type: 'speaker',
    room: 'Bedroom',
  },
  dev_diffuser_bed: {
    id: 'dev_diffuser_bed',
    name: 'Aroma Diffuser',
    type: 'diffuser',
    room: 'Bedroom',
  },
  dev_purifier_bed: {
    id: 'dev_purifier_bed',
    name: 'Air Purifier',
    type: 'purifier',
    room: 'Bedroom',
  },

  // --- SALA (LIVING ROOM) ---
  dev_light_living: {
    id: 'dev_light_living',
    name: 'Living Room Lights',
    type: 'light',
    room: 'Living Room',
  },
  dev_speaker_living: {
    // <--- NOVO
    id: 'dev_speaker_living',
    name: 'Speakers',
    type: 'speaker',
    room: 'Living Room',
  },

  // --- COZINHA (KITCHEN) ---
  dev_light_kitchen: {
    // <--- NOVO
    id: 'dev_light_kitchen',
    name: 'Counter Lights',
    type: 'light',
    room: 'Kitchen',
  },
  dev_speaker_kitchen: {
    // <--- NOVO
    id: 'dev_speaker_kitchen',
    name: 'Kitchen Assistant',
    type: 'speaker',
    room: 'Kitchen',
  },

  // --- OUTROS ---
  dev_thermostat_main: {
    id: 'dev_thermostat_main',
    name: 'Main Thermostat',
    type: 'thermostat',
    room: 'General',
  },
};
