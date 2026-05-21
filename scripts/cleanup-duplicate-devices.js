const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const buildDeviceKey = (device) => {
  if (device.home_id && device.source && device.external_id) {
    return `external:${device.home_id}:${device.source}:${device.external_id}`;
  }

  const normalizedName = String(device.name || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');

  return `room_name:${device.home_id || 'no-home'}:${device.room_id || 'no-room'}:${normalizedName}`;
};

const getFreshness = (device) =>
  new Date(device.last_seen || device.updated_at || device.created_at || 0).getTime();

async function cleanupDuplicateDevices() {
  console.log('Starting smart-device duplicate cleanup...');

  const { data: devices, error } = await supabase
    .from('devices')
    .select(
      'id, name, type, source, external_id, room_id, home_id, created_at, updated_at, last_seen, discovery_method',
    )
    .order('home_id', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching devices:', error);
    process.exit(1);
  }

  const allDevices = devices || [];
  console.log(`Loaded ${allDevices.length} devices.`);

  const groups = new Map();
  for (const device of allDevices) {
    const key = buildDeviceKey(device);
    const bucket = groups.get(key) || [];
    bucket.push(device);
    groups.set(key, bucket);
  }

  const duplicateGroups = [...groups.entries()].filter(([, bucket]) => bucket.length > 1);

  if (duplicateGroups.length === 0) {
    console.log('No duplicate smart devices found.');
    return;
  }

  const toDeleteIds = [];

  for (const [key, bucket] of duplicateGroups) {
    const sorted = [...bucket].sort((left, right) => getFreshness(right) - getFreshness(left));
    const keep = sorted[0];
    const remove = sorted.slice(1);

    console.log(`\nDuplicate group: ${key}`);
    console.log(`Keeping #${keep.id} "${keep.name}"`);

    for (const device of remove) {
      console.log(`Removing #${device.id} "${device.name}"`);
      toDeleteIds.push(device.id);
    }
  }

  if (toDeleteIds.length === 0) {
    console.log('Nothing to delete after evaluating duplicates.');
    return;
  }

  const { error: deleteError } = await supabase
    .from('devices')
    .delete()
    .in('id', toDeleteIds);

  if (deleteError) {
    console.error('Error deleting duplicate devices:', deleteError);
    process.exit(1);
  }

  console.log(`\nCleanup complete. Removed ${toDeleteIds.length} duplicate device(s).`);
}

cleanupDuplicateDevices().catch((cleanupError) => {
  console.error('Cleanup failed:', cleanupError);
  process.exit(1);
});
