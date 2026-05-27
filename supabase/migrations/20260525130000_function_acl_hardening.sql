-- Restrict execution of internal SECURITY DEFINER functions.

REVOKE ALL ON FUNCTION public.handle_updated_at() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_user_deleted() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_default_home_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.seed_dynamic_api_activity(text, text, text, text, text, text, jsonb, jsonb, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.seed_api_content(text, text, text, text, text, text, jsonb, jsonb, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cleanup_orphan_users() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cleanup_orphan_homes() FROM PUBLIC;

REVOKE ALL ON FUNCTION public.seed_dynamic_api_activity(text, text, text, text, text, text, jsonb, jsonb, text, text, text) FROM anon;
REVOKE ALL ON FUNCTION public.seed_dynamic_api_activity(text, text, text, text, text, text, jsonb, jsonb, text, text, text) FROM authenticated;
REVOKE ALL ON FUNCTION public.seed_api_content(text, text, text, text, text, text, jsonb, jsonb, text) FROM anon;
REVOKE ALL ON FUNCTION public.seed_api_content(text, text, text, text, text, text, jsonb, jsonb, text) FROM authenticated;
REVOKE ALL ON FUNCTION public.cleanup_orphan_users() FROM anon;
REVOKE ALL ON FUNCTION public.cleanup_orphan_users() FROM authenticated;
REVOKE ALL ON FUNCTION public.cleanup_orphan_homes() FROM anon;
REVOKE ALL ON FUNCTION public.cleanup_orphan_homes() FROM authenticated;

GRANT EXECUTE ON FUNCTION public.seed_dynamic_api_activity(text, text, text, text, text, text, jsonb, jsonb, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.seed_api_content(text, text, text, text, text, text, jsonb, jsonb, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_orphan_users() TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_orphan_homes() TO service_role;

NOTIFY pgrst, 'reload schema';
