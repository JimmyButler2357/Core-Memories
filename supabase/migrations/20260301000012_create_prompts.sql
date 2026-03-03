-- Migration 012: create_prompts
-- Curated prompt bank for recording screen suggestions and notification text.
-- Prompts can be filtered by child age range for developmental appropriateness.
-- The {child_name} placeholder gets replaced at runtime with the actual child's name.

CREATE TABLE prompts (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text           text NOT NULL,       -- Prompt text with {child_name} placeholder
  min_age_months smallint,            -- Minimum child age in months. Null = all ages
  max_age_months smallint,            -- Maximum child age in months. Null = all ages
  is_active      boolean NOT NULL DEFAULT true,  -- Can be deactivated without deleting
  created_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
