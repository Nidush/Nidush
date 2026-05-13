-- Normalize the legacy devices table so Profile can persist connected hardware.
-- Older schemas created devices for rooms only; the Profile screen stores
-- user-level network/wearable devices.

ALTER TABLE public.devices
  ADD COLUMN IF NOT EXISTS type text,
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'network',
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'connected',
  ADD COLUMN IF NOT EXISTS home_id integer REFERENCES public.homes(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS last_seen timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'devices'
      AND column_name = 'external_id'
  ) THEN
    ALTER TABLE public.devices ALTER COLUMN external_id DROP NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'devices'
      AND column_name = 'room_id'
  ) THEN
    ALTER TABLE public.devices ALTER COLUMN room_id DROP NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'devices'
      AND column_name = 'device_type_iddevice_type'
  ) THEN
    ALTER TABLE public.devices ALTER COLUMN device_type_iddevice_type DROP NOT NULL;
  END IF;
END $$;

UPDATE public.devices
SET
  source = COALESCE(source, 'network'),
  status = COALESCE(status, 'connected'),
  last_seen = COALESCE(last_seen, created_at, now()),
  created_at = COALESCE(created_at, now());

CREATE UNIQUE INDEX IF NOT EXISTS devices_user_source_external_id_idx
  ON public.devices (user_id, source, external_id)
  WHERE user_id IS NOT NULL
    AND source IS NOT NULL
    AND external_id IS NOT NULL;

ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Devices members access" ON public.devices;
DROP POLICY IF EXISTS "Usuários podem gerenciar seus próprios dispositivos" ON public.devices;
DROP POLICY IF EXISTS "Usuários podem ver seus próprios dispositivos" ON public.devices;
DROP POLICY IF EXISTS "p_devices_select_own_or_home" ON public.devices;
DROP POLICY IF EXISTS "p_devices_insert_own" ON public.devices;
DROP POLICY IF EXISTS "p_devices_update_own" ON public.devices;
DROP POLICY IF EXISTS "p_devices_delete_own" ON public.devices;

CREATE POLICY "p_devices_select_own_or_home"
ON public.devices
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_member(home_id)
);

CREATE POLICY "p_devices_insert_own"
ON public.devices
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "p_devices_update_own"
ON public.devices
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "p_devices_delete_own"
ON public.devices
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

NOTIFY pgrst, 'reload schema';
