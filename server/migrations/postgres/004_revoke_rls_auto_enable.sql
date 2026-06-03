-- Revoke public API execution on Supabase's internal rls_auto_enable() helper.
-- This prevents PostgREST from exposing it under /rest/v1/rpc/.
-- Run this after connecting your Supabase PostgreSQL database.

-- Only proceed if the function exists (Supabase-specific internal helper)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'rls_auto_enable'
  ) THEN
    ALTER FUNCTION public.rls_auto_enable() SECURITY DEFINER;
    REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
    GRANT EXECUTE ON FUNCTION public.rls_auto_enable() TO service_role, postgres;
    RAISE NOTICE 'RLS auto-enable function secured successfully';
  ELSE
    RAISE NOTICE 'Function rls_auto_enable() not found — skipping';
  END IF;
END $$;
