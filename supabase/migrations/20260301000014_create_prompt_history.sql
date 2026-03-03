-- Migration 014: create_prompt_history
-- Tracks which prompts each user has seen, so we don't repeat the same one
-- five days in a row. Think of it like a playlist on shuffle — once a song plays,
-- it goes to the back of the queue.

CREATE TABLE prompt_history (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  prompt_id  uuid NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  shown_at   timestamptz NOT NULL DEFAULT now(),
  context    text NOT NULL DEFAULT 'recording_screen'
    CHECK (context IN ('recording_screen', 'notification'))
);

-- No unique constraint — same prompt can be shown again after enough time passes

ALTER TABLE prompt_history ENABLE ROW LEVEL SECURITY;
