-- Migration 003: create_families
-- The shared household unit. Think of it like a shared photo album —
-- right now only you have access, but later a partner can join the same
-- family and see all the same children and entries.

CREATE TABLE families (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text,           -- V2: optional family display name (e.g., "The Butler Family")
  created_by uuid NOT NULL REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER families_updated_at
  BEFORE UPDATE ON families
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

ALTER TABLE families ENABLE ROW LEVEL SECURITY;
