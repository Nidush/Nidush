-- Real smart-device sync foundation:
-- - secure sync token per home for local discovery agents
-- - richer device metadata for real network devices
-- - offline/online tracking and indexes
-- - mark seeded/mock devices so the app can ignore them safely

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE public.homes
  ADD COLUMN IF NOT EXISTS device_sync_token uuid DEFAULT gen_random_uuid();

UPDATE public.homes
SET device_sync_token = gen_random_uuid()
WHERE device_sync_token IS NULL;

ALTER TABLE public.homes
  ALTER COLUMN device_sync_token SET DEFAULT gen_random_uuid();

ALTER TABLE public.devices
  ADD COLUMN IF NOT EXISTS connectivity_status text DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS discovery_method text DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS sync_source text DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS manufacturer text,
  ADD COLUMN IF NOT EXISTS model text,
  ADD COLUMN IF NOT EXISTS room_hint text,
  ADD COLUMN IF NOT EXISTS mac_address text,
  ADD COLUMN IF NOT EXISTS ip_address text,
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS capabilities jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS last_state_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

UPDATE public.devices
SET
  connectivity_status = CASE
    WHEN lower(coalesce(status, '')) IN ('on', 'connected', 'online', 'playing') THEN 'online'
    WHEN lower(coalesce(status, '')) IN ('off', 'offline') THEN 'offline'
    ELSE coalesce(connectivity_status, 'unknown')
  END,
  discovery_method = coalesce(discovery_method, 'manual'),
  sync_source = coalesce(sync_source, source, 'manual'),
  metadata = coalesce(metadata, '{}'::jsonb),
  capabilities = coalesce(capabilities, '{}'::jsonb),
  last_state_at = coalesce(last_state_at, last_seen, created_at, now()),
  updated_at = coalesce(updated_at, created_at, now());

-- Remove legacy duplicates before adding the unique home/source/external_id index.
WITH ranked_devices AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY home_id, source, external_id
      ORDER BY coalesce(last_seen, updated_at, created_at, now()) DESC, id DESC
    ) AS rn
  FROM public.devices
  WHERE home_id IS NOT NULL
    AND source IS NOT NULL
    AND external_id IS NOT NULL
)
DELETE FROM public.devices
WHERE id IN (
  SELECT id
  FROM ranked_devices
  WHERE rn > 1
);

ALTER TABLE public.devices
  DROP CONSTRAINT IF EXISTS devices_connectivity_status_check;

ALTER TABLE public.devices
  ADD CONSTRAINT devices_connectivity_status_check
  CHECK (connectivity_status IN ('online', 'offline', 'unknown'));

ALTER TABLE public.devices
  DROP CONSTRAINT IF EXISTS devices_discovery_method_check;

ALTER TABLE public.devices
  ADD CONSTRAINT devices_discovery_method_check
  CHECK (discovery_method IN ('manual', 'ssdp', 'mdns', 'integration', 'health', 'seed', 'mock'));

CREATE UNIQUE INDEX IF NOT EXISTS homes_device_sync_token_idx
  ON public.homes (device_sync_token);

CREATE UNIQUE INDEX IF NOT EXISTS devices_home_source_external_id_idx
  ON public.devices (home_id, source, external_id)
  WHERE home_id IS NOT NULL
    AND source IS NOT NULL
    AND external_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS devices_home_room_idx
  ON public.devices (home_id, room_id);

CREATE INDEX IF NOT EXISTS devices_home_connectivity_idx
  ON public.devices (home_id, connectivity_status);

CREATE INDEX IF NOT EXISTS devices_sync_source_idx
  ON public.devices (home_id, sync_source);

DROP TRIGGER IF EXISTS tr_devices_updated_at ON public.devices;
CREATE TRIGGER tr_devices_updated_at
BEFORE UPDATE ON public.devices
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Mark seeded room mocks created by the old migration so the UI can ignore them
UPDATE public.devices
SET
  source = 'seeded_mock',
  discovery_method = 'seed',
  sync_source = 'seed'
WHERE external_id IS NULL
  AND coalesce(source, 'network') = 'network'
  AND name IN (
    'Bedroom Lights',
    'Bedroom Speakers',
    'Difuser',
    'Air Purifier',
    'Living Room Lights',
    'AC Unit',
    'Smart TV',
    'Kitchen Lights',
    'Smart Fridge',
    'Coffee Maker',
    'Bathroom Lights',
    'Water Heater'
  );

-- Mark the old Profile-page fake discoveries so they stop appearing as "real"
UPDATE public.devices
SET
  discovery_method = 'mock',
  sync_source = 'mock'
WHERE external_id IN (
  'network:samsung-smart-tv',
  'network:google-nest-speaker',
  'network:hp-envy-laptop'
);

DROP POLICY IF EXISTS "p_devices_insert_member" ON public.devices;
CREATE POLICY "p_devices_insert_member"
ON public.devices
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_member(home_id)
  OR user_id = auth.uid()
);

DROP POLICY IF EXISTS "p_devices_update_member" ON public.devices;
CREATE POLICY "p_devices_update_member"
ON public.devices
FOR UPDATE
TO authenticated
USING (
  public.is_member(home_id)
  OR user_id = auth.uid()
)
WITH CHECK (
  public.is_member(home_id)
  OR user_id = auth.uid()
);

NOTIFY pgrst, 'reload schema';
