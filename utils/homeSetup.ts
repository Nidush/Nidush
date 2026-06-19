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

type DeviceRoomCandidate = {
  id: number;
  room_id?: number | null;
  room_hint?: string | null;
  metadata?: Record<string, unknown> | null;
};

const normalizeRoomName = (value: string) => value.trim().toLowerCase();

const extractRoomCandidate = (device: DeviceRoomCandidate) => {
  const metadata = device.metadata && typeof device.metadata === 'object'
    ? device.metadata
    : null;

  const candidates = [
    device.room_hint,
    typeof metadata?.roomName === 'string' ? metadata.roomName : null,
    typeof metadata?.roomHint === 'string' ? metadata.roomHint : null,
  ];

  return candidates.find((value) => typeof value === 'string' && value.trim())?.trim() ?? null;
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

export const reconcileDeviceRoomAssignments = async (homeId: number) => {
  const { data: existingRooms, error: roomsError } = await supabase
    .from('rooms')
    .select('id, name')
    .eq('home_id', homeId)
    .order('id', { ascending: true });

  if (roomsError) throw roomsError;

  const roomIdByName = new Map<string, number>();
  for (const room of existingRooms ?? []) {
    if (!room?.name) continue;
    roomIdByName.set(normalizeRoomName(room.name), room.id);
  }

  const { data: devices, error: devicesError } = await supabase
    .from('devices')
    .select('id, room_id, room_hint, metadata')
    .eq('home_id', homeId)
    .is('room_id', null);

  if (devicesError) throw devicesError;

  for (const device of (devices ?? []) as DeviceRoomCandidate[]) {
    const roomName = extractRoomCandidate(device);
    if (!roomName) continue;

    const normalizedRoomName = normalizeRoomName(roomName);
    let roomId = roomIdByName.get(normalizedRoomName) ?? null;

    if (roomId == null) {
      const createdRoom = await createHomeRoom(homeId, roomName);
      roomId = createdRoom.id;
      roomIdByName.set(normalizedRoomName, createdRoom.id);
    }

    const { error: updateError } = await supabase
      .from('devices')
      .update({ room_id: roomId })
      .eq('id', device.id);

    if (updateError) throw updateError;
  }
};
