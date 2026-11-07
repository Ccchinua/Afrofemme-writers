-- Return only the authenticated member's block relationships in either direction.
-- The member_blocks table remains private under RLS; this narrow RPC lets the app
-- hide members who blocked the current user without exposing the global block list.

CREATE INDEX IF NOT EXISTS member_blocks_blocked_id_idx
  ON public.member_blocks (blocked_id);

CREATE OR REPLACE FUNCTION public.get_blocked_member_ids()
RETURNS TABLE(member_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
  SELECT CASE
    WHEN mb.blocker_id = auth.uid() THEN mb.blocked_id
    ELSE mb.blocker_id
  END AS member_id
  FROM public.member_blocks AS mb
  WHERE auth.uid() IS NOT NULL
    AND (mb.blocker_id = auth.uid() OR mb.blocked_id = auth.uid());
$function$;

REVOKE ALL ON FUNCTION public.get_blocked_member_ids() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_blocked_member_ids() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_blocked_member_ids() TO authenticated;
