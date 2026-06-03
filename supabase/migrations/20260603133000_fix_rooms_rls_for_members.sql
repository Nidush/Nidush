ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Rooms members access" ON public.rooms;
DROP POLICY IF EXISTS "Rooms members manage" ON public.rooms;

CREATE POLICY "Rooms members manage"
ON public.rooms
FOR ALL
TO authenticated
USING (public.is_member(home_id))
WITH CHECK (public.is_member(home_id));

NOTIFY pgrst, 'reload schema';
