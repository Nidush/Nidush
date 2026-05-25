jest.mock('../utils/supabase', () => ({
  supabase: {
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(),
    })),
  },
}));

import {
  isRealHomeDevice,
  normalizeDeviceStatus,
  normalizeDeviceType,
  sortDevicesByFreshness,
} from '../utils/devices';

describe('devices utils', () => {
  it('filters out mock and personal network devices', () => {
    expect(
      isRealHomeDevice({
        source: 'network',
        type: 'computer',
        name: 'Gabriel MacBook',
      }),
    ).toBe(false);

    expect(
      isRealHomeDevice({
        source: 'network',
        type: 'speaker',
        external_id: 'network:google-nest-speaker',
        name: 'Living Room Nest',
      }),
    ).toBe(false);
  });

  it('keeps legitimate home devices and normalizes their type/status', () => {
    const device = {
      source: 'network',
      type: 'smart plug',
      status: 'online',
      connectivity_status: 'online',
      name: 'Coffee Corner Plug',
      external_id: 'plug:coffee-corner',
    };

    expect(isRealHomeDevice(device)).toBe(true);
    expect(normalizeDeviceType(device.type)).toBe('outlet');
    expect(normalizeDeviceStatus(device)).toBe('On');
  });

  it('sorts devices from newest to oldest by last_seen', () => {
    const sorted = sortDevicesByFreshness([
      { id: 1, last_seen: '2026-05-24T10:00:00.000Z' },
      { id: 2, last_seen: '2026-05-25T10:00:00.000Z' },
      { id: 3, last_seen: '2026-05-23T10:00:00.000Z' },
    ]);

    expect(sorted.map((device) => device.id)).toEqual([2, 1, 3]);
  });
});
