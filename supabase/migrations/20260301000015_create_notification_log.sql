-- Migration 015: create_notification_log
-- Tracks every notification sent and whether the user tapped it.
-- Powers the "if ignored 5+ days in a row, reduce frequency" backoff logic.
-- Without this table, we'd have no way to know if notifications are working.

CREATE TABLE notification_log (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id        uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  prompt_id         uuid REFERENCES prompts(id),           -- Which prompt was included
  child_id          uuid REFERENCES children(id),           -- Which child was mentioned
  sent_at           timestamptz NOT NULL DEFAULT now(),
  tapped            boolean NOT NULL DEFAULT false,          -- Did the user tap it?
  tapped_at         timestamptz,                             -- When they tapped it
  resulted_in_entry boolean NOT NULL DEFAULT false           -- Did tapping lead to a saved entry?
);

ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;
