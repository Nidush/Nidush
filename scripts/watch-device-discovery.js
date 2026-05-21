require('dotenv').config();

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const HOME_DEVICE_SYNC_TOKEN = process.env.HOME_DEVICE_SYNC_TOKEN;
const POLL_INTERVAL_MS = Number(process.env.DEVICE_DISCOVERY_POLL_MS || 15000);

const {
  discoverSsdpDevices,
  enrichDevice,
  syncDevices,
} = require('./discover-network-devices');

if (!SUPABASE_URL || !HOME_DEVICE_SYNC_TOKEN) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL or HOME_DEVICE_SYNC_TOKEN.');
  process.exit(1);
}

const postToFunction = async (functionName, body) => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-device-sync-token': HOME_DEVICE_SYNC_TOKEN,
    },
    body: JSON.stringify(body ?? {}),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(
      typeof data?.error === 'string' ? data.error : JSON.stringify(data?.error ?? data),
    );
  }

  return data;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function handleClaimedRequest(request) {
  try {
    console.log(`Running requested device discovery for home ${request.home_id}...`);
    const rawDevices = await discoverSsdpDevices();
    const devices = await Promise.all(rawDevices.map(enrichDevice));
    const syncResult = await syncDevices(devices);

    await postToFunction('complete-device-discovery', {
      requestId: request.id,
      success: true,
      result: {
        discovered: devices.length,
        syncResult,
      },
    });

    console.log(`Discovery request ${request.id} completed.`, syncResult);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await postToFunction('complete-device-discovery', {
      requestId: request.id,
      success: false,
      errorMessage: message,
      result: {},
    });
    console.error(`Discovery request ${request.id} failed:`, message);
  }
}

async function main() {
  console.log(`Watching for discovery requests every ${POLL_INTERVAL_MS}ms...`);

  while (true) {
    try {
      const result = await postToFunction('claim-device-discovery', {});
      if (result.request) {
        await handleClaimedRequest(result.request);
      }
    } catch (error) {
      console.error('Discovery watcher error:', error instanceof Error ? error.message : String(error));
    }

    await sleep(POLL_INTERVAL_MS);
  }
}

main().catch((error) => {
  console.error('Watcher crashed:', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
