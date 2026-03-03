-- Migration 010: create_tags
-- Tag taxonomy. Includes system tags (seeded), AI-generated tags (V1.5),
-- and user-created tags. System/AI tags are global; user tags are family-scoped.

CREATE TABLE tags (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,     -- Display name, e.g., "Humor", "Sweet Moment"
  slug       text NOT NULL,     -- URL-safe key, e.g., "humor", "sweet-moment"
  source     text NOT NULL DEFAULT 'system'
    CHECK (source IN ('system', 'ai_generated', 'user_created')),
  family_id  uuid REFERENCES families(id) ON DELETE CASCADE,  -- Null for system/AI tags
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Unique constraint for family-scoped (user-created) tags
-- Prevents duplicate tags within the same family
CREATE UNIQUE INDEX tags_slug_family_unique
  ON tags (slug, family_id)
  WHERE family_id IS NOT NULL;

-- Note: The partial unique index for system tags (WHERE family_id IS NULL)
-- is created in migration 018 along with all other performance indexes.

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
