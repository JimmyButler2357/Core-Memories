-- Migration 007: create_family_children
-- Junction table linking children to families.
-- PLUS a trigger that automatically links a new child to the creator's family.
-- Without this trigger, you'd need to manually insert a row into family_children
-- every time you add a child — the trigger does it for you.

CREATE TABLE family_children (
  family_id  uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  child_id   uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (family_id, child_id)
);

ALTER TABLE family_children ENABLE ROW LEVEL SECURITY;

-- Trigger: when a child is created, auto-link to the creator's family
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_child_created
  AFTER INSERT ON children
  FOR EACH ROW EXECUTE FUNCTION handle_new_child();
