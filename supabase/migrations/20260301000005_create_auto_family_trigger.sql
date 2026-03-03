-- Migration 005: create_auto_family_trigger
-- The "magic" migration. Creates a trigger that fires every time someone signs up.
-- It automatically: (1) creates their profile, (2) creates a family for them,
-- and (3) adds them as the owner of that family.
--
-- Think of it like checking into a hotel: you give your name at the front desk,
-- and behind the scenes they create your guest record, assign you a room,
-- and put your name on the door — all in one step.

-- Helper function used by RLS policies everywhere.
-- Returns all family IDs the current user belongs to.
CREATE OR REPLACE FUNCTION user_family_ids()
RETURNS SETOF uuid AS $$
  SELECT family_id
  FROM family_members
  WHERE profile_id = auth.uid()
    AND status = 'active'
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- The big trigger: on signup, create profile + family + membership
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Wire it up: fire after every new auth.users row
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
