-- Allow routines to persist a selected cover image key
ALTER TABLE public.routines
  ADD COLUMN IF NOT EXISTS image text;

-- Let home members read and manage scenarios through their room membership
ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Scenarios members access" ON public.scenarios;

CREATE POLICY "Scenarios members access" ON public.scenarios
FOR ALL TO authenticated
USING (
  room_id IN (
    SELECT id
    FROM public.rooms
    WHERE public.is_member(home_id)
  )
)
WITH CHECK (
  room_id IN (
    SELECT id
    FROM public.rooms
    WHERE public.is_member(home_id)
  )
);

NOTIFY pgrst, 'reload schema';
