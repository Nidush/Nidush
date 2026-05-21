BEGIN;

SELECT plan(18);

SELECT ok(to_regclass('public.users') IS NOT NULL, 'users table exists');
SELECT ok(to_regclass('public.homes') IS NOT NULL, 'homes table exists');
SELECT ok(to_regclass('public.user_homes') IS NOT NULL, 'user_homes table exists');
SELECT ok(to_regclass('public.activities') IS NOT NULL, 'activities table exists');
SELECT ok(to_regclass('public.notifications') IS NOT NULL, 'notifications table exists');
SELECT ok(to_regclass('public.devices') IS NOT NULL, 'devices table exists');
SELECT ok(to_regclass('public.activity_templates') IS NOT NULL, 'activity_templates table exists');
SELECT ok(to_regclass('public.scenario_templates') IS NOT NULL, 'scenario_templates table exists');

SELECT ok(to_regprocedure('public.join_home_by_code(text)') IS NOT NULL, 'join_home_by_code RPC exists');
SELECT ok(to_regprocedure('public.handle_updated_at()') IS NOT NULL, 'handle_updated_at trigger function exists');

SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.users'::regclass),
  'users has RLS enabled'
);
SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.homes'::regclass),
  'homes has RLS enabled'
);
SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.user_homes'::regclass),
  'user_homes has RLS enabled'
);
SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.activity_templates'::regclass),
  'activity_templates has RLS enabled'
);
SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.scenario_templates'::regclass),
  'scenario_templates has RLS enabled'
);

SELECT is((SELECT count(*)::int FROM public.activity_templates), 14, 'activity templates are seeded');
SELECT is((SELECT count(*)::int FROM public.scenario_templates), 13, 'scenario templates are seeded');
SELECT ok(
  EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'user_homes'
      AND indexname = 'user_homes_one_admin_per_home_idx'
  ),
  'single-admin partial index exists'
);

SELECT * FROM finish();

ROLLBACK;
