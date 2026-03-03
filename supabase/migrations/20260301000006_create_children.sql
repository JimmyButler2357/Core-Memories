-- Migration 006: create_children
-- Child profiles. Each child belongs to a family (via family_children junction).
-- The app displays children as color-coded tabs on the home screen.

CREATE TABLE children (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  nickname      text,            -- Used for transcript auto-detection (e.g., "Bug")
  birthday      date NOT NULL,   -- Powers age stamps like "Emma 2y 4m"
  color_index   smallint NOT NULL DEFAULT 0
    CHECK (color_index >= 0 AND color_index <= 5),  -- Maps to 6-color palette
  display_order smallint NOT NULL DEFAULT 0,
  photo_url     text,            -- V2: child profile photo in Supabase Storage
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER children_updated_at
  BEFORE UPDATE ON children
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

ALTER TABLE children ENABLE ROW LEVEL SECURITY;
