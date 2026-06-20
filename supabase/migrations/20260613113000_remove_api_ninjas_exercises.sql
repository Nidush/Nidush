-- Remove exercícios antigos importados pela API Ninjas para ficar apenas com o catálogo WorkoutX.

CREATE TEMP TABLE tmp_old_api_ninjas_contents ON COMMIT DROP AS
SELECT id
FROM public.contents
WHERE id LIKE 'api_ninjas_exercise_%'
   OR author = 'API Ninjas';

CREATE TEMP TABLE tmp_old_api_ninjas_activities ON COMMIT DROP AS
SELECT id
FROM public.activities
WHERE content_id IN (SELECT id FROM tmp_old_api_ninjas_contents);

DELETE FROM public.shortcuts
WHERE activity_idactivity IN (SELECT id FROM tmp_old_api_ninjas_activities);

DELETE FROM public.activity_devices
WHERE activity_id IN (SELECT id FROM tmp_old_api_ninjas_activities);

DELETE FROM public.activities
WHERE id IN (SELECT id FROM tmp_old_api_ninjas_activities);

DELETE FROM public.contents
WHERE id LIKE 'api_ninjas_exercise_%'
   OR author = 'API Ninjas';
