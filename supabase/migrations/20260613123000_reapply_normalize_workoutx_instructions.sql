-- Reaplica a normalização das instruções do WorkoutX para registos que
-- continuaram com um único bloco de texto separado por ".,"

UPDATE public.contents AS c
SET instructions = normalized.instructions
FROM (
  SELECT
    id,
    to_jsonb(
      ARRAY(
        SELECT trimmed_part
        FROM (
          SELECT
            btrim(part) ||
              CASE
                WHEN right(btrim(part), 1) IN ('.', '!', '?') THEN ''
                ELSE '.'
              END AS trimmed_part
          FROM unnest(
            regexp_split_to_array(
              regexp_replace(
                btrim(coalesce(instructions->>0, '')),
                '\s+',
                ' ',
                'g'
              ),
              '[.!?],\s*|[.!?]\s+'
            )
          ) AS part
        ) split_parts
        WHERE trimmed_part <> ''
      )
    ) AS instructions
  FROM public.contents
  WHERE id LIKE 'workoutx_exercise_%'
    AND jsonb_typeof(instructions) = 'array'
    AND jsonb_array_length(instructions) = 1
    AND coalesce(instructions->>0, '') <> ''
) AS normalized
WHERE c.id = normalized.id;
