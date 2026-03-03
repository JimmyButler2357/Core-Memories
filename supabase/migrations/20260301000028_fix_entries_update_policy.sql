-- Migration 028: fix_entries_update_policy
-- Tightens the entries UPDATE policy to prevent family_id reassignment.
--
-- THE PROBLEM:
-- The current entries_update_own policy says:
--   USING (user_id = auth.uid())        ← "you can update your own entries"
--   WITH CHECK (user_id = auth.uid())   ← "user_id must still be you after update"
--
-- But it doesn't check family_id! A user could do:
--   supabase.from('entries').update({ family_id: 'some-random-uuid' }).eq('id', entryId)
-- and change the entry's family association. In MVP (one family), this just
-- makes the entry disappear. In V2 (multiple families), it could move entries
-- between families.
--
-- THE FIX:
-- Add family_id validation to the WITH CHECK clause. The entry's family_id
-- must be one of the families the user belongs to — both before AND after
-- the update. This prevents reassigning entries to arbitrary families.
--
-- Think of it like a filing cabinet: you can edit documents in your drawers,
-- but you can't move them to someone else's cabinet.

DROP POLICY IF EXISTS entries_update_own ON entries;

CREATE POLICY entries_update_own ON entries
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND family_id IN (SELECT user_family_ids())
  );
