-- Migration 030: fix_functions
-- Two function improvements:
--   1. handle_updated_at — add SET search_path for consistency
--   2. toggle_entry_favorite — return the new favorited state instead of void
--
-- WHY SET search_path ON handle_updated_at?
-- Migration 023 added SET search_path = public to the three SECURITY DEFINER
-- functions, but missed handle_updated_at. This function is SECURITY INVOKER
-- (the default), so the risk is near-zero. But consistency matters — if a
-- future developer sees 3 of 4 functions with search_path pinned, they might
-- wonder if this one was intentionally different. It wasn't. Fix it now so
-- every function follows the same pattern.
--
-- WHY RETURN boolean INSTEAD OF void?
-- When toggle_entry_favorite returns void, the caller has no idea:
--   (a) whether the toggle actually found the entry (might have been wrong ID)
--   (b) what the NEW favorite state is (is it now true or false?)
-- Returning the new is_favorited value lets the UI update instantly without
-- having to re-fetch the entire entry.

-- ============================================================
-- 1. handle_updated_at: add SET search_path for consistency
-- ============================================================

CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============================================================
-- 2. toggle_entry_favorite: return new favorited state
-- ============================================================
-- RETURNING gives us the value of is_favorited AFTER the toggle.
-- If the entry doesn't exist or isn't in the user's family,
-- zero rows are updated and the function returns NULL — the
-- caller can check for this and show an appropriate error.
--
-- NOTE: PostgreSQL does not allow CREATE OR REPLACE to change a function's
-- return type. We must DROP the old version first, then CREATE the new one.

DROP FUNCTION IF EXISTS toggle_entry_favorite(uuid);

CREATE FUNCTION toggle_entry_favorite(target_entry_id uuid)
RETURNS boolean AS $$
  UPDATE entries
  SET is_favorited = NOT is_favorited
  WHERE id = target_entry_id
    AND family_id IN (SELECT user_family_ids())
  RETURNING is_favorited;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;
