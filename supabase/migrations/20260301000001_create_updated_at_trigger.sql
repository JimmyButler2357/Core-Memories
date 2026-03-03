-- Migration 001: create_updated_at_trigger
-- Reusable function that auto-updates the updated_at column on any row change.
-- Think of it like a "last modified" stamp that updates itself automatically.

CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
