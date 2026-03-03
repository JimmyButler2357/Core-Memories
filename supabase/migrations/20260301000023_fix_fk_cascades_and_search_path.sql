-- Migration 023: fix_fk_cascades_and_search_path
-- Fixes two categories of issues:
--
-- HIGH 5: Missing ON DELETE CASCADE on families.created_by and entries.user_id.
--   Without these, deleting a user from Supabase Auth cascades to delete their
--   profile, then CRASHES because families and entries still reference it.
--   Like trying to close your bank account while you're still listed as branch manager.
--
-- HIGH 6: SECURITY DEFINER functions missing SET search_path = public.
--   These functions run with superadmin privileges. Without locking the search_path,
--   a malicious schema could intercept the table lookups. Like hardcoding a phone
--   number so no one can redirect your speed dial to a scammer.

-- ============================================================
-- HIGH 5: Add ON DELETE CASCADE to foreign keys
-- ============================================================

-- families.created_by → profiles.id
-- When a profile is deleted, cascade to delete the family too.
-- (The family has no meaning without its creator in MVP)
ALTER TABLE families
  DROP CONSTRAINT families_created_by_fkey,
  ADD CONSTRAINT families_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE CASCADE;

-- entries.user_id → profiles.id
-- When a profile is deleted, cascade to delete their entries too.
ALTER TABLE entries
  DROP CONSTRAINT entries_user_id_fkey,
  ADD CONSTRAINT entries_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- entries.family_id → families.id
-- When a family is deleted (cascading from profile deletion above),
-- also delete the entries that belonged to that family.
ALTER TABLE entries
  DROP CONSTRAINT entries_family_id_fkey,
  ADD CONSTRAINT entries_family_id_fkey
    FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE;

-- ============================================================
-- HIGH 6: Add SET search_path to SECURITY DEFINER functions
-- ============================================================

-- Recreate user_family_ids() with search_path locked down.
-- This is the RLS helper called by almost every policy.
CREATE OR REPLACE FUNCTION user_family_ids()
RETURNS SETOF uuid AS $$
  SELECT family_id
  FROM family_members
  WHERE profile_id = auth.uid()
    AND status = 'active'
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- Recreate handle_new_user() with search_path locked down.
-- Fires on signup to auto-create profile + family + membership.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_family_id uuid;
BEGIN
  -- 1. Create the profile row
  INSERT INTO profiles (id)
  VALUES (NEW.id);

  -- 2. Create a family for this user
  INSERT INTO families (created_by)
  VALUES (NEW.id)
  RETURNING id INTO new_family_id;

  -- 3. Add the user as owner of that family
  INSERT INTO family_members (family_id, profile_id, role, status)
  VALUES (new_family_id, NEW.id, 'owner', 'active');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate handle_new_child() with search_path locked down.
-- Fires when a child is created to auto-link to creator's family.
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

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
