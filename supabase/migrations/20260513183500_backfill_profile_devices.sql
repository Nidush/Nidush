-- Backfill devices created before the Profile hardware schema was normalized.

ALTER TABLE public.devices
  ALTER COLUMN name TYPE text,
  ALTER COLUMN external_id TYPE text;

WITH normalized AS (
  SELECT
    d.id,
    COALESCE(NULLIF(d.source, ''), 'network') AS normalized_source,
    COALESCE(
      NULLIF(
        trim(both '-' from regexp_replace(lower(d.name), '[^a-z0-9]+', '-', 'g')),
        ''
      ),
      'device'
    ) AS normalized_slug,
    row_number() OVER (
      PARTITION BY
        d.user_id,
        COALESCE(NULLIF(d.source, ''), 'network'),
        COALESCE(
          NULLIF(
            trim(both '-' from regexp_replace(lower(d.name), '[^a-z0-9]+', '-', 'g')),
            ''
          ),
          'device'
        )
      ORDER BY d.created_at ASC NULLS LAST, d.id ASC
    ) AS duplicate_rank
  FROM public.devices d
  WHERE d.external_id IS NULL
     OR d.external_id = ''
)
UPDATE public.devices d
SET external_id = CASE
    WHEN normalized.duplicate_rank = 1 THEN normalized.normalized_source || ':' || normalized.normalized_slug
    ELSE normalized.normalized_source || ':' || normalized.normalized_slug || '-' || d.id::text
  END,
  source = normalized.normalized_source
FROM normalized
WHERE d.id = normalized.id;

WITH first_home AS (
  SELECT DISTINCT ON (uh.user_id)
    uh.user_id,
    uh.home_id
  FROM public.user_homes uh
  ORDER BY uh.user_id, uh.created_at ASC
)
UPDATE public.devices d
SET home_id = first_home.home_id
FROM first_home
WHERE d.user_id = first_home.user_id
  AND d.home_id IS NULL;

UPDATE public.devices
SET
  status = COALESCE(NULLIF(status, ''), 'connected'),
  source = COALESCE(NULLIF(source, ''), 'network'),
  last_seen = COALESCE(last_seen, created_at, now()),
  created_at = COALESCE(created_at, now());

NOTIFY pgrst, 'reload schema';
