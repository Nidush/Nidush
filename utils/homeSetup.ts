import { supabase } from './supabase';

export const DEFAULT_HOME_ROOMS = [
  'Bedroom',
  'Kitchen',
  'Living Room',
  'Bathroom',
] as const;

type RoomRow = {
  id: number;
  name: string;
};

export const ensureDefaultHomeRooms = async (homeId: number): Promise<RoomRow[]> => {
  const { data: existingRooms, error: fetchError } = await supabase
    .from('rooms')
    .select('id, name')
    .eq('home_id', homeId)
    .order('id', { ascending: true });

  if (fetchError) throw fetchError;

  const safeExistingRooms = existingRooms ?? [];
  const existingNames = new Set(
    safeExistingRooms.map((room) => room.name.trim().toLowerCase()),
  );

  const missingRooms = DEFAULT_HOME_ROOMS.filter(
    (roomName) => !existingNames.has(roomName.toLowerCase()),
  );

  if (missingRooms.length > 0) {
    const { error: insertError } = await supabase
      .from('rooms')
      .insert(missingRooms.map((name) => ({ name, home_id: homeId })));

    if (insertError) throw insertError;
  }

  const { data: ensuredRooms, error: ensuredError } = await supabase
    .from('rooms')
    .select('id, name')
    .eq('home_id', homeId)
    .order('id', { ascending: true });

  if (ensuredError) throw ensuredError;
  return ensuredRooms ?? [];
};

export const createHomeRoom = async (homeId: number, name: string) => {
  const trimmedName = name.trim();
  if (!trimmedName) throw new Error('Room name is required.');

  const { data, error } = await supabase
    .from('rooms')
    .insert({ home_id: homeId, name: trimmedName })
    .select('id, name')
    .single();

  if (error) throw error;
  return data as RoomRow;
};
