-- Migration 009: create_entry_children
-- Junction table linking entries to children.
-- An entry can be about multiple children ("Emma and Liam went to the park together").

CREATE TABLE entry_children (
  entry_id      uuid NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  child_id      uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  auto_detected boolean NOT NULL DEFAULT false,  -- Was this child auto-detected from transcript?
  created_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (entry_id, child_id)
);

-- CASCADE delete: when an entry is hard-deleted, its child links go too

ALTER TABLE entry_children ENABLE ROW LEVEL SECURITY;
