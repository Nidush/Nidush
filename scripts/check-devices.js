const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDevices() {
  console.log('Fetching devices from database...');
  const { data: devices, error } = await supabase
    .from('devices')
    .select('id, name, type, room_id, home_id');

  if (error) {
    console.error('Error fetching devices:', error);
    process.exit(1);
  }

  console.log('\n--- CURRENT DEVICES IN DATABASE ---');
  console.log(`Total devices: ${devices.length}\n`);
  
  const counts = {};
  devices.forEach(d => {
    console.log(`ID: ${d.id} | Name: "${d.name}" | Type: "${d.type}" | Room ID: ${d.room_id} | Home ID: ${d.home_id}`);
    counts[d.name] = (counts[d.name] || 0) + 1;
  });

  console.log('\n--- DUPLICATE REPORT ---');
  let duplicatesFound = false;
  for (const [name, count] of Object.entries(counts)) {
    if (count > 1) {
      console.log(`❌ "${name}" is duplicated ${count} times!`);
      duplicatesFound = true;
    }
  }

  if (!duplicatesFound) {
    console.log('✅ No duplicated device names found!');
  }
}

checkDevices();
