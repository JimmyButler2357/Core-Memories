-- Migration 011: create_entry_tags
-- Junction table linking entries to tags.
-- An entry can have multiple tags ("humor" + "milestone" + "first").

CREATE TABLE entry_tags (
  entry_id     uuid NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  tag_id       uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  auto_applied boolean NOT NULL DEFAULT false,  -- Was this tag auto-applied by keyword matching or AI?
  confidence   real,           -- V1.5: AI confidence score 0.0-1.0. Null for manual/keyword tags
  created_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (entry_id, tag_id)
);

ALTER TABLE entry_tags ENABLE ROW LEVEL SECURITY;
