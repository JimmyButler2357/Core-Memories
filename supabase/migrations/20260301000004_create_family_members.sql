-- Migration 004: create_family_members
-- Junction table linking profiles to families with a role.
-- Think of it as a membership list: "Jimmy is an owner of the Butler Family."
-- In MVP there's exactly one member per family.

CREATE TABLE family_members (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id   uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  profile_id  uuid REFERENCES profiles(id) ON DELETE CASCADE,  -- nullable for V2 contributors without accounts
  role        text NOT NULL DEFAULT 'owner'
    CHECK (role IN ('owner', 'partner', 'contributor')),
  label       text,           -- V2: display name like "Grandma Sarah"
  status      text NOT NULL DEFAULT 'active'
    CHECK (status IN ('pending', 'active', 'revoked')),
  invited_at  timestamptz,    -- V2: when the invitation was sent
  accepted_at timestamptz,    -- V2: when the invitation was accepted
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- A profile can only be in a family once.
-- Partial index because profile_id is nullable (V2 contributors without accounts).
-- PostgreSQL treats NULL != NULL in unique constraints, so without this partial index
-- you could accidentally add the same profile to the same family twice.
CREATE UNIQUE INDEX family_members_family_profile_unique
  ON family_members (family_id, profile_id)
  WHERE profile_id IS NOT NULL;

CREATE TRIGGER family_members_updated_at
  BEFORE UPDATE ON family_members
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
