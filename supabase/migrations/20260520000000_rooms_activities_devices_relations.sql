-- ========================================================
-- ROOMS, ACTIVITIES, AND DEVICES RELATIONSHIPS
-- ========================================================

-- 1. Ensure room_id exists in activities table
ALTER TABLE public.activities 
  ADD COLUMN IF NOT EXISTS room_id INTEGER REFERENCES public.rooms(id) ON DELETE SET NULL;

-- 2. Ensure room_id exists in devices table
ALTER TABLE public.devices 
  ADD COLUMN IF NOT EXISTS room_id INTEGER REFERENCES public.rooms(id) ON DELETE SET NULL;

-- 3. Create junction table for many-to-many relationship between activities and devices
CREATE TABLE IF NOT EXISTS public.activity_devices (
    activity_id INTEGER REFERENCES public.activities(id) ON DELETE CASCADE,
    device_id INTEGER REFERENCES public.devices(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (activity_id, device_id)
);

-- Enable RLS for the junction table
ALTER TABLE public.activity_devices ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "p_activity_devices_all" ON public.activity_devices;

-- Create policy allowing users to access activity-device associations
CREATE POLICY "p_activity_devices_all" ON public.activity_devices
FOR ALL TO authenticated
USING (
  activity_id IN (
    SELECT id FROM public.activities WHERE user_id = auth.uid() OR public.is_member(home_id)
  )
)
WITH CHECK (
  activity_id IN (
    SELECT id FROM public.activities WHERE user_id = auth.uid()
  )
);

-- 3.5. Some legacy databases still have an old required rooms.user_iduser column.
-- The current app no longer uses it, so make it nullable before backfilling rooms.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'rooms'
      AND column_name = 'user_iduser'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.rooms
      ALTER COLUMN user_iduser DROP NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'rooms'
      AND column_name = 'private'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.rooms
      ALTER COLUMN private DROP NOT NULL;
  END IF;
END $$;

-- 4. Seed default rooms for any homes that do not have them
INSERT INTO public.rooms (name, home_id)
SELECT r.name, h.id
FROM public.homes h
CROSS JOIN (
  VALUES ('Bedroom'), ('Kitchen'), ('Living Room'), ('Bathroom')
) AS r(name)
WHERE NOT EXISTS (
  SELECT 1 FROM public.rooms WHERE rooms.home_id = h.id AND rooms.name = r.name
);

-- 5. Do not seed fake devices.
-- Real devices are discovered and synchronized separately so every room only shows
-- hardware that actually exists in the home.

-- 6. Add status_level column to devices if not present (to support dimmer/volume/level state)
ALTER TABLE public.devices ADD COLUMN IF NOT EXISTS status_level INTEGER DEFAULT 0;

-- 7. Stricter but highly permissive update policies for devices so home members can control them
DROP POLICY IF EXISTS "p_devices_update_own" ON public.devices;
CREATE POLICY "p_devices_update_member"
ON public.devices
FOR UPDATE
TO authenticated
USING (
  public.is_member(home_id)
)
WITH CHECK (
  public.is_member(home_id)
);

DROP POLICY IF EXISTS "p_devices_insert_own" ON public.devices;
CREATE POLICY "p_devices_insert_member"
ON public.devices
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_member(home_id)
);

-- 8. Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
