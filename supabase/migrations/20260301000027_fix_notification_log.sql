-- Migration 027: fix_notification_log
-- Fixes two issues with the notification_log table:
--   1. Foreign keys that block child/prompt deletion
--   2. Missing UPDATE policy that prevents marking notifications as tapped
--
-- ISSUE 1: FOREIGN KEY ON DELETE BEHAVIOR
-- When you create a foreign key (like child_id REFERENCES children(id)),
-- PostgreSQL needs to know: "what happens if the referenced row is deleted?"
--
-- The default is NO ACTION — which means "block the delete." So if we ever
-- sent a notification mentioning a child, and the parent later tries to delete
-- that child, PostgreSQL says "NOPE, notification_log still points to them."
-- That's not what we want for a log table.
--
-- ON DELETE SET NULL says: "keep the log row, but erase the reference."
-- The notification history is preserved (we know a notification was sent),
-- but the link to the specific child/prompt is cleared. Think of it like
-- crossing out a name in a diary instead of ripping out the whole page.
--
-- ISSUE 2: MISSING UPDATE POLICY
-- When a user taps a notification, the app needs to mark tapped = true.
-- But there's no RLS UPDATE policy on notification_log — so any UPDATE
-- attempt is silently blocked. The feature exists in the schema (the columns
-- are there) but is literally impossible to use from the client.

-- ============================================================
-- Fix 1: Change FK behavior from NO ACTION to SET NULL
-- ============================================================

-- prompt_id: if a prompt is deleted, set to NULL (keep the log row)
ALTER TABLE notification_log
  DROP CONSTRAINT IF EXISTS notification_log_prompt_id_fkey,
  ADD CONSTRAINT notification_log_prompt_id_fkey
    FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE SET NULL;

-- child_id: if a child is deleted, set to NULL (keep the log row)
ALTER TABLE notification_log
  DROP CONSTRAINT IF EXISTS notification_log_child_id_fkey,
  ADD CONSTRAINT notification_log_child_id_fkey
    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE SET NULL;

-- ============================================================
-- Fix 2: Add UPDATE policy so users can mark notifications as tapped
-- ============================================================
-- USING: you can only update your own notification rows
-- WITH CHECK: the row must still belong to you after the update
-- (prevents changing profile_id to someone else's)

CREATE POLICY notification_log_update_own ON notification_log
  FOR UPDATE
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());
