-- Migration 022: fix_gin_index
-- Fixes the full-text search index so it actually gets used by queries.
--
-- The problem: the old index used COALESCE(transcript, '') but Supabase's
-- .textSearch() method generates queries against bare `transcript`. PostgreSQL
-- requires the expression to EXACTLY match for the index to kick in.
-- It's like alphabetizing books by "Lastname, Firstname" but searching by
-- "Firstname" — the index exists but PostgreSQL can't use it.
--
-- The fix: rebuild the index to match what Supabase generates.

-- Drop the old mismatched index
DROP INDEX IF EXISTS idx_entries_transcript_search;

-- Recreate with the expression that matches .textSearch('transcript', ...)
-- NULL transcripts are fine — to_tsvector handles NULL by returning NULL,
-- which simply won't match any search query (correct behavior).
CREATE INDEX idx_entries_transcript_search
  ON entries USING GIN (to_tsvector('english', transcript));
