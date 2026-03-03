-- Migration 024: fix_hard_delete_and_child_trigger
-- Fixes two remaining high-priority issues:
--
-- HIGH 7: The DELETE policy on entries let users permanently delete entries
--   immediately, bypassing the 30-day soft-delete recovery window. Now you
--   can only hard-delete entries that were soft-deleted over 30 days ago.
--   Think of it like a recycling bin that only empties after 30 days — you
--   can't throw something directly into the incinerator anymore.
--
-- HIGH 9: The handle_new_child trigger silently failed when auth.uid() was
--   NULL (e.g., service-role calls), creating orphan children with no family
--   link. Now it raises an error instead of silently doing nothing.

-- ============================================================
-- HIGH 7: Restrict hard-delete to expired soft-deleted entries
-- ============================================================
DROP POLICY IF EXISTS entries_delete_own ON entries;

-- You can only permanently delete entries that:
-- 1. You own (user_id = your ID)
-- 2. Are already soft-deleted (is_deleted = true)
-- 3. Have been in the "trash" for over 30 days
CREATE POLICY entries_delete_own ON entries
  FOR DELETE USING (
    user_id = auth.uid()
    AND is_deleted = true
    AND deleted_at < now() - interval '30 days'
  );

-- ============================================================
-- HIGH 9: Add failure guard to handle_new_child trigger
-- ============================================================
-- If auth.uid() is NULL or the user isn't an active owner, the INSERT
-- returns zero rows and the child becomes an invisible orphan.
-- Now we raise a clear error instead of silently failing.
CREATE OR REPLACE FUNCTION handle_new_child()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO family_children (family_id, child_id)
  SELECT family_id, NEW.id
  FROM family_members
  WHERE profile_id = auth.uid()
    AND role = 'owner'
    AND status = 'active'
  LIMIT 1;

  -- If no family link was created, something is wrong
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Could not link child to family — no active owner found for user %', COALESCE(auth.uid()::text, 'NULL');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
