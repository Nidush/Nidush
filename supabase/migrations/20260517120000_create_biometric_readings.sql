CREATE TABLE IF NOT EXISTS public.biometric_readings (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(auth_uid) ON DELETE CASCADE,
  device_id TEXT NOT NULL DEFAULT 'health_connect',
  source TEXT NOT NULL DEFAULT 'health_connect',
  source_record_id TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
  heart_rate INTEGER,
  hrv INTEGER,
  skin_temperature NUMERIC,
  eda NUMERIC,
  stress_score INTEGER,
  detected_state TEXT CHECK (detected_state IN ('RELAXED', 'FOCUSED', 'STRESSED', 'ANXIOUS')),
  raw_payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, source, recorded_at, source_record_id)
);

CREATE INDEX IF NOT EXISTS biometric_readings_user_recorded_at_idx
ON public.biometric_readings (user_id, recorded_at DESC);

ALTER TABLE public.biometric_readings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their biometric readings" ON public.biometric_readings;
CREATE POLICY "Users can view their biometric readings"
ON public.biometric_readings
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their biometric readings" ON public.biometric_readings;
CREATE POLICY "Users can insert their biometric readings"
ON public.biometric_readings
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their biometric readings" ON public.biometric_readings;
CREATE POLICY "Users can update their biometric readings"
ON public.biometric_readings
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
