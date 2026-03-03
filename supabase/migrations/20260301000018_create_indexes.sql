-- Migration 018: create_indexes
-- Indexes are like tabs in a filing cabinet. Without them, the database reads
-- every single row to find what it needs (like flipping through every page of
-- a book). We create them now on empty tables because adding them later to
-- millions of rows is slow and locks the table.

-- Home screen timeline: "show this family's entries newest first"
CREATE INDEX idx_entries_family_date
  ON entries (family_id, entry_date DESC);

-- Soft delete filter: quickly skip deleted entries
CREATE INDEX idx_entries_family_deleted
  ON entries (family_id, is_deleted);

-- "Show entries I recorded" (for V2 partner view)
CREATE INDEX idx_entries_user
  ON entries (user_id);

-- Full-text search on transcripts
-- to_tsvector breaks text into searchable tokens (e.g., "Emma laughed" becomes
-- two searchable words). GIN index makes this lightning fast even on 100K+ entries.
CREATE INDEX idx_entries_transcript_search
  ON entries USING GIN (to_tsvector('english', COALESCE(transcript, '')));

-- Per-child tab view: "show all entries about Emma"
CREATE INDEX idx_entry_children_child
  ON entry_children (child_id);

-- Filter by tag
CREATE INDEX idx_entry_tags_tag
  ON entry_tags (tag_id);

-- RLS lookup: "which families does this user belong to?"
-- This index is critical for performance — almost every RLS policy
-- calls user_family_ids() which queries this table.
CREATE INDEX idx_family_members_profile
  ON family_members (profile_id);

-- RLS lookup: "which family does this child belong to?"
CREATE INDEX idx_family_children_child
  ON family_children (child_id);

-- Push notification delivery: "which devices does this user have?"
CREATE INDEX idx_user_devices_profile
  ON user_devices (profile_id);

-- Prompt rotation: "what has this user seen recently?"
CREATE INDEX idx_prompt_history_profile_shown
  ON prompt_history (profile_id, shown_at DESC);

-- Notification backoff: "were the last 5 notifications ignored?"
CREATE INDEX idx_notification_log_profile_sent
  ON notification_log (profile_id, sent_at DESC);

-- Prevent duplicate system/AI tags (NULL family_id).
-- PostgreSQL treats NULL != NULL in unique constraints, so without this
-- partial index you could insert "humor" as a system tag multiple times.
CREATE UNIQUE INDEX tags_slug_system_unique
  ON tags (slug) WHERE family_id IS NULL;
