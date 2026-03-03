-- Migration 025: add_partial_indexes
-- Adds two targeted indexes for the app's most common query patterns.
--
-- WHAT ARE PARTIAL INDEXES?
-- A regular index includes every row in the table. A partial index only includes
-- rows that match a WHERE condition. This makes the index smaller and faster
-- because it skips rows you'll never search for.
--
-- Think of it like a phone book that only lists people who live in your city,
-- instead of every person in the country. Much faster to look up your neighbor.

-- ============================================================
-- Index 1: Timeline query (the most-used query in the app)
-- ============================================================
-- The home screen does: WHERE family_id = ? AND is_deleted = false ORDER BY entry_date DESC
-- The existing idx_entries_family_date includes deleted entries, which wastes space
-- and forces PostgreSQL to skip over them. This partial index only includes
-- non-deleted entries, so it's smaller and perfectly matches the query.
CREATE INDEX idx_entries_family_active_date
  ON entries (family_id, entry_date DESC)
  WHERE is_deleted = false;

-- ============================================================
-- Index 2: Favorites query (Firefly Jar screen)
-- ============================================================
-- The Firefly Jar screen does: WHERE family_id = ? AND is_favorited = true AND is_deleted = false
-- Without this index, PostgreSQL scans all non-deleted entries and filters for favorites.
-- This partial index only includes favorited, non-deleted entries — much smaller.
CREATE INDEX idx_entries_family_favorites
  ON entries (family_id, entry_date DESC)
  WHERE is_favorited = true AND is_deleted = false;
