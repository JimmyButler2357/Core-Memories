-- Migration 031: create_junction_rpcs
-- Atomic (all-or-nothing) functions for replacing entry_children and entry_tags.
--
-- THE PROBLEM:
-- The old approach used two separate API calls:
--   1. DELETE all existing links for this entry
--   2. INSERT the new links
-- If step 1 succeeds but step 2 fails (network hiccup, invalid child_id,
-- RLS rejection), the entry ends up with ZERO children/tags. The old data
-- is gone and the new data never arrived. Silent data loss.
--
-- THE FIX — DATABASE TRANSACTIONS:
-- A "transaction" means "do ALL of these steps, or NONE of them." If any
-- step fails, everything rolls back to how it was before. Think of it like
-- an undo button that activates automatically on failure.
--
-- In Supabase, each API call is its own transaction. You can't wrap two
-- API calls in one transaction from the client. But a single database
-- FUNCTION runs entirely within one transaction. So we move the
-- delete-then-insert logic into a function, and now it's atomic.
--
-- WHY SECURITY DEFINER?
-- These functions bypass RLS (they run as the function owner, not the caller).
-- This is necessary because the function needs to delete AND insert across
-- junction tables. We build the security check INTO the function: it verifies
-- the entry belongs to the caller before doing anything.

-- ============================================================
-- 1. set_entry_children: atomic replace of entry ↔ child links
-- ============================================================

CREATE OR REPLACE FUNCTION set_entry_children(
  target_entry_id uuid,
  child_ids uuid[],
  is_auto_detected boolean DEFAULT false
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

  -- Step 1: Remove all existing child links for this entry
  DELETE FROM entry_children WHERE entry_id = target_entry_id;

  -- Step 2: Insert the new links (skip if empty array)
  IF array_length(child_ids, 1) IS NOT NULL THEN
    INSERT INTO entry_children (entry_id, child_id, auto_detected)
    SELECT target_entry_id, unnest(child_ids), is_auto_detected;
  END IF;

  -- If we reach here, both steps succeeded. If either failed,
  -- PostgreSQL automatically rolls back BOTH steps.
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================
-- 2. set_entry_tags: atomic replace of entry ↔ tag links
-- ============================================================

CREATE OR REPLACE FUNCTION set_entry_tags(
  target_entry_id uuid,
  tag_ids uuid[],
  is_auto_applied boolean DEFAULT false
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

  -- Step 1: Remove all existing tag links for this entry
  DELETE FROM entry_tags WHERE entry_id = target_entry_id;

  -- Step 2: Insert the new links (skip if empty array)
  IF array_length(tag_ids, 1) IS NOT NULL THEN
    INSERT INTO entry_tags (entry_id, tag_id, auto_applied)
    SELECT target_entry_id, unnest(tag_ids), is_auto_applied;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
