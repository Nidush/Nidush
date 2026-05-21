const dgram = require('dgram');
const http = require('http');
const https = require('https');
require('dotenv').config();

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const HOME_DEVICE_SYNC_TOKEN = process.env.HOME_DEVICE_SYNC_TOKEN;
const DISCOVERY_TIMEOUT_MS = Number(process.env.DEVICE_DISCOVERY_TIMEOUT_MS || 6000);
const SYNC_SOURCE = process.env.DEVICE_SYNC_SOURCE || 'ssdp';
const SEARCH_TARGETS = [
  'ssdp:all',
  'urn:schemas-upnp-org:device:MediaRenderer:1',
  'urn:schemas-upnp-org:device:MediaServer:1',
];

if (!SUPABASE_URL || !HOME_DEVICE_SYNC_TOKEN) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL or HOME_DEVICE_SYNC_TOKEN.');
  process.exit(1);
}

const readTag = (xml, tag) => {
  const match = xml.match(new RegExp(`<${tag}>([^<]+)</${tag}>`, 'i'));
  return match ? match[1].trim() : null;
};

const normalizeType = (value) => {
  const text = String(value || '').toLowerCase();
  if (text.includes('tv')) return 'tv';
  if (text.includes('speaker') || text.includes('audio') || text.includes('renderer')) return 'speaker';
  if (text.includes('light') || text.includes('bulb') || text.includes('lamp')) return 'light';
  if (text.includes('computer') || text.includes('laptop') || text.includes('desktop')) return 'computer';
  if (text.includes('router')) return 'router';
  if (text.includes('sensor')) return 'sensor';
  if (text.includes('outlet') || text.includes('plug')) return 'outlet';
  if (text.includes('display')) return 'display';
  return 'appliance';
};

const httpGet = (url) =>
  new Promise((resolve, reject) => {
    const client = url.startsWith('https://') ? https : http;
    client
      .get(url, (response) => {
        if (response.statusCode && response.statusCode >= 400) {
          reject(new Error(`HTTP ${response.statusCode} while fetching ${url}`));
          response.resume();
          return;
        }

        let body = '';
        response.setEncoding('utf8');
        response.on('data', (chunk) => {
          body += chunk;
        });
        response.on('end', () => resolve(body));
      })
      .on('error', reject);
  });

const parseHeaders = (message) => {
  const lines = message.split(/\r?\n/);
  const headers = {};
  for (const line of lines.slice(1)) {
    const separator = line.indexOf(':');
    if (separator === -1) continue;
    const key = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();
    headers[key] = value;
  }
  return headers;
};

const discoverSsdpDevices = async () =>
  new Promise((resolve) => {
    const socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
    const discovered = new Map();

    socket.on('message', (buffer, remoteInfo) => {
      const response = buffer.toString('utf8');
      const headers = parseHeaders(response);
      const location = headers.location;
      const usn = headers.usn || `${remoteInfo.address}:${remoteInfo.port}`;
      const server = headers.server || headers.st || 'unknown';

      if (!location || discovered.has(usn)) return;
      discovered.set(usn, {
        usn,
        location,
        server,
        remoteAddress: remoteInfo.address,
      });
    });

    socket.on('error', (error) => {
      console.error('SSDP discovery error:', error.message);
      socket.close();
      resolve([]);
    });

    socket.bind(() => {
      socket.setBroadcast(true);
      socket.setMulticastTTL(2);

      for (const searchTarget of SEARCH_TARGETS) {
        const message = [
          'M-SEARCH * HTTP/1.1',
          'HOST: 239.255.255.250:1900',
          'MAN: "ssdp:discover"',
          'MX: 2',
          `ST: ${searchTarget}`,
          '',
          '',
        ].join('\r\n');

        socket.send(Buffer.from(message), 1900, '239.255.255.250');
      }
    });

    setTimeout(() => {
      socket.close();
      resolve([...discovered.values()]);
    }, DISCOVERY_TIMEOUT_MS);
  });

const enrichDevice = async (device) => {
  try {
    const xml = await httpGet(device.location);
    const friendlyName = readTag(xml, 'friendlyName') || device.server;
    const manufacturer = readTag(xml, 'manufacturer');
    const model = readTag(xml, 'modelName');
    const deviceType = readTag(xml, 'deviceType') || device.server;

    return {
      name: friendlyName,
      type: normalizeType(deviceType),
      external_id: `upnp:${device.usn}`,
      source: 'network',
      status: 'online',
      connectivity_status: 'online',
      manufacturer,
      model,
      ip_address: device.remoteAddress,
      metadata: {
        location: device.location,
        server: device.server,
        usn: device.usn,
        deviceType,
      },
      capabilities: {
        transport: 'upnp',
      },
    };
  } catch (error) {
    return {
      name: device.server || device.usn,
      type: normalizeType(device.server),
      external_id: `upnp:${device.usn}`,
      source: 'network',
      status: 'online',
      connectivity_status: 'online',
      ip_address: device.remoteAddress,
      metadata: {
        location: device.location,
        server: device.server,
        usn: device.usn,
        descriptionFetchError: error.message,
      },
      capabilities: {
        transport: 'upnp',
      },
    };
  }
};

const syncDevices = async (devices) => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/sync-network-devices`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-device-sync-token': HOME_DEVICE_SYNC_TOKEN,
    },
    body: JSON.stringify({
      syncSource: SYNC_SOURCE,
      mode: 'snapshot',
      devices,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    const details =
      typeof data?.error === 'string'
        ? data.error
        : JSON.stringify(data?.error ?? data);
    throw new Error(details || 'Could not sync devices.');
  }

  return data;
};

async function main() {
  console.log('Searching for smart devices on the local network...');
  const rawDevices = await discoverSsdpDevices();
  const devices = await Promise.all(rawDevices.map(enrichDevice));

  console.log(`Discovered ${devices.length} candidate device(s).`);
  if (devices.length === 0) {
    console.log('Nothing found. The sync endpoint will still mark missing snapshot devices offline.');
  }

  const result = await syncDevices(devices);
  console.log('Sync completed:', JSON.stringify(result, null, 2));
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Device discovery sync failed:', error.message);
    process.exit(1);
  });
}

module.exports = {
  discoverSsdpDevices,
  enrichDevice,
  syncDevices,
};
