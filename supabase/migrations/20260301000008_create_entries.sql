-- Migration 008: create_entries
-- The core table — every voice recording and text entry lives here.
-- This is the table the whole app revolves around: the home screen timeline,
-- Firefly Jar, and search all read from it.

CREATE TABLE entries (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                uuid NOT NULL REFERENCES profiles(id),
  family_id              uuid NOT NULL REFERENCES families(id),
  transcript             text,
  original_transcript    text,         -- Preserved original before user edits
  entry_type             text NOT NULL DEFAULT 'voice'
    CHECK (entry_type IN ('voice', 'text')),
  entry_date             date NOT NULL DEFAULT CURRENT_DATE,  -- User-selectable for backdating
  audio_storage_path     text,         -- Path in Supabase Storage. Null for text entries
  audio_duration_seconds smallint,     -- Recording length. Null for text entries
  title                  text,         -- V1.5: AI-generated entry title
  location_text          text,         -- Auto-detected location (e.g., "Tampa, FL")
  is_favorited           boolean NOT NULL DEFAULT false,  -- Firefly toggle
  is_deleted             boolean NOT NULL DEFAULT false,  -- Soft delete flag
  deleted_at             timestamptz,  -- 30-day recovery window start
  mood                   text,         -- V1.5: quick-react mood tag
  unlock_at_date         timestamptz,  -- V3+: Time Capsule by date
  unlock_at_age_months   smallint,     -- V3+: Time Capsule by child age
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

-- Why family_id is denormalized here:
-- RLS needs to check "does this user belong to the family that owns this entry?"
-- on every query. Joining through profiles → family_members → families on every
-- row is expensive. Storing family_id directly lets RLS do a simple subquery.

CREATE TRIGGER entries_updated_at
  BEFORE UPDATE ON entries
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
