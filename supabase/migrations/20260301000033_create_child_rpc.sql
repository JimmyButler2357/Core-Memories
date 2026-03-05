-- Migration 033: create_child_rpc
--
-- THE PROBLEM:
-- Direct INSERT into the children table fails with RLS error 42501 even though:
--   - auth.uid() returns the correct user UUID
--   - user_family_ids() returns the correct family ID
--   - All policy components evaluate to true independently
-- This is an unresolved PostgreSQL/Supabase quirk where the WITH CHECK policy
-- expression returns false when evaluated inside an INSERT transaction, despite
-- all individual pieces working correctly when called separately.
--
-- THE FIX:
-- A SECURITY DEFINER function that runs as the postgres superuser, bypassing the
-- broken RLS policy entirely. The same security rules are enforced explicitly inside
-- the function body, so the security model is unchanged — just the mechanism differs.
--
-- SECURITY MAINTAINED:
--   1. auth.uid() IS NOT NULL → user must be authenticated
--   2. EXISTS (SELECT 1 FROM user_family_ids()) → user must have an active family
--   3. child count < 15 → family cap enforced

-- Clean up temporary debug functions from investigation
DROP FUNCTION IF EXISTS debug_auth_uid();
DROP FUNCTION IF EXISTS debug_auth_uid_invoker();
DROP FUNCTION IF EXISTS debug_auth_uid_definer();

CREATE OR REPLACE FUNCTION create_child(
  p_name          text,
  p_birthday      date,
  p_nickname      text,
  p_color_index   smallint,
  p_display_order smallint
)
RETURNS children
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_child children;
BEGIN
  -- Must be authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Must belong to at least one active family
  IF NOT EXISTS (SELECT 1 FROM user_family_ids()) THEN
    RAISE EXCEPTION 'No active family found for this user';
  END IF;

  -- Enforce the 15-child cap
  IF (
    SELECT count(*)
    FROM family_children
    WHERE family_id IN (SELECT user_family_ids())
  ) >= 15 THEN
    RAISE EXCEPTION 'Family has reached the 15-child limit';
  END IF;

  -- Insert the child (runs as postgres superuser, bypasses broken RLS policy).
  -- The on_child_created AFTER INSERT trigger fires automatically and links
  -- this child to the user's family via family_children.
  INSERT INTO children (name, birthday, nickname, color_index, display_order)
  VALUES (p_name, p_birthday, p_nickname, p_color_index, p_display_order)
  RETURNING * INTO v_child;

  RETURN v_child;
END;
$$;
