-- Migration 034: refresh_auto_detection_rpcs
--
-- THE PROBLEM:
-- When a user edits a transcript or re-records audio, the auto-detected
-- children and tags become stale. The existing set_entry_children/tags RPCs
-- (migration 031) can't be used here because they delete ALL rows — manual
-- AND auto. We only want to refresh the auto-detected ones.
--
-- Think of it like sticky notes on a fridge. Some notes were stuck there by
-- a robot (auto-detected), and some were stuck there by the human (manual).
-- When the robot re-scans, it should only peel off its OWN notes and put up
-- new ones — the human's notes stay exactly where they are.
--
-- THE FIX:
-- Two new RPCs that only touch auto-detected/auto-applied rows:
--   1. DELETE rows WHERE auto_detected = true (or auto_applied = true)
--   2. INSERT new auto rows, but skip any that collide with a manual row
--      (ON CONFLICT DO NOTHING)
--
-- This means if the user manually tagged "Emma" on an entry, and the
-- transcript ALSO mentions "Emma", the manual row is preserved and no
-- duplicate is created. Manual choices are always respected.

-- ============================================================
-- 1. refresh_auto_children: replace only auto-detected child links
-- ============================================================

CREATE OR REPLACE FUNCTION refresh_auto_children(
  target_entry_id uuid,
  child_ids uuid[]
)
RETURNS void AS $$
BEGIN
  -- Security check: entry must belong to the calling user
  IF NOT EXISTS (
    SELECT 1 FROM entries
    WHERE id = target_entry_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Entry not found or access denied';
  END IF;

  -- Step 1: Remove only auto-detected child links
  -- Manual links (auto_detected = false) are untouched.
  DELETE FROM entry_children
  WHERE entry_id = target_entry_id AND auto_detected = true;

  -- Step 2: Insert new auto-detected links.
  -- ON CONFLICT DO NOTHING means: if this child was already manually
  -- linked (auto_detected = false), skip the insert — no duplicate,
  -- and the manual row is preserved.
  IF array_length(child_ids, 1) IS NOT NULL THEN
    INSERT INTO entry_children (entry_id, child_id, auto_detected)
    SELECT target_entry_id, unnest(child_ids), true
    ON CONFLICT (entry_id, child_id) DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================
-- 2. refresh_auto_tags: replace only auto-applied tag links
-- ============================================================

CREATE OR REPLACE FUNCTION refresh_auto_tags(
  target_entry_id uuid,
  tag_ids uuid[]
)
RETURNS void AS $$
BEGIN
  -- Security check: entry must belong to the calling user
  IF NOT EXISTS (
    SELECT 1 FROM entries
    WHERE id = target_entry_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Entry not found or access denied';
  END IF;

  -- Step 1: Remove only auto-applied tag links
  -- Manual links (auto_applied = false) are untouched.
  DELETE FROM entry_tags
  WHERE entry_id = target_entry_id AND auto_applied = true;

  -- Step 2: Insert new auto-applied links.
  -- ON CONFLICT DO NOTHING preserves any manually-added tags.
  IF array_length(tag_ids, 1) IS NOT NULL THEN
    INSERT INTO entry_tags (entry_id, tag_id, auto_applied)
    SELECT target_entry_id, unnest(tag_ids), true
    ON CONFLICT (entry_id, tag_id) DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
