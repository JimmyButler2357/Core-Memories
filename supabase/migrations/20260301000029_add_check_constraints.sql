-- Migration 029: add_check_constraints
-- Adds data-quality guardrails to several columns across the schema.
--
-- WHAT ARE CHECK CONSTRAINTS?
-- A CHECK constraint is a rule attached to a column that says "this value
-- must pass this test, or the INSERT/UPDATE is rejected." Think of it like
-- a form validation rule that lives in the database itself — even if the
-- app has a bug and sends bad data, the database says "nope."
--
-- WHY NOT JUST VALIDATE IN THE APP?
-- App-level validation can be bypassed (modified client, API call from
-- Postman, etc.). Database constraints are the last line of defense.
-- It's the lock on the drawer even if the security guard falls asleep.

-- ============================================================
-- 1. children.name: prevent empty strings
-- ============================================================
-- NOT NULL prevents null, but '' (empty string) slips through.
-- A child with no name would show blank tabs and labels in the UI.
-- trim() removes leading/trailing whitespace so '   ' also fails.

ALTER TABLE children
  ADD CONSTRAINT children_name_not_empty
  CHECK (length(trim(name)) > 0);

-- ============================================================
-- 2. prompts: ensure min_age_months <= max_age_months
-- ============================================================
-- Without this, you could create a prompt with min=36, max=12.
-- That prompt would match zero children and silently never appear.
-- We also prevent negative values (can't be -5 months old).
-- Either value can be NULL (meaning "no limit on that end").

ALTER TABLE prompts
  ADD CONSTRAINT prompts_min_age_not_negative
  CHECK (min_age_months IS NULL OR min_age_months >= 0);

ALTER TABLE prompts
  ADD CONSTRAINT prompts_max_age_not_negative
  CHECK (max_age_months IS NULL OR max_age_months >= 0);

ALTER TABLE prompts
  ADD CONSTRAINT prompts_age_range_valid
  CHECK (
    min_age_months IS NULL
    OR max_age_months IS NULL
    OR min_age_months <= max_age_months
  );

-- ============================================================
-- 3. entry_tags.confidence: must be 0.0 to 1.0
-- ============================================================
-- This column stores AI confidence scores for auto-applied tags.
-- The comment says "0.0-1.0" but nothing enforced it until now.
-- A bug in the AI service could write 99.5 or -3.0 without this.

ALTER TABLE entry_tags
  ADD CONSTRAINT entry_tags_confidence_range
  CHECK (confidence IS NULL OR (confidence >= 0.0 AND confidence <= 1.0));

-- ============================================================
-- 4. profiles.notification_days: only valid days of the week
-- ============================================================
-- Days are 0-6 (Sunday=0 through Saturday=6). Without this check,
-- values like {-1, 42, 999} would be accepted.
-- The <@ operator means "is contained by" — every element in the
-- array must be one of the values in the right-hand array.

ALTER TABLE profiles
  ADD CONSTRAINT profiles_notification_days_valid
  CHECK (notification_days <@ ARRAY[0,1,2,3,4,5,6]::smallint[]);
