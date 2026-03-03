-- Migration 021: fix_rls_policies
-- Fixes 3 critical security issues found during review:
--
-- CRITICAL 1: family_members_update_own allowed users to change their own role
--   (e.g., promoting themselves from "contributor" to "owner"). Removed entirely —
--   only family owners should manage membership via the dashboard/API.
--
-- CRITICAL 2: entries_update_family_favorite let ANY family member update ANY
--   column on any entry (not just is_favorited). Replaced with a safe RPC function
--   that only toggles the favorite flag.
--
-- CRITICAL 3: children_insert_family used WITH CHECK (true), allowing any
--   authenticated user to insert unlimited children. Now requires active family
--   membership and caps at 15 children per family.

-- ============================================================
-- CRITICAL 1: Remove privilege escalation on family_members
-- ============================================================
-- Old policy let users UPDATE their own row — including the "role" column.
-- A contributor could change their role to "owner" and take over the family.
-- Like letting an employee edit their own badge, including the job title.
DROP POLICY IF EXISTS family_members_update_own ON family_members;

-- ============================================================
-- CRITICAL 2: Remove overly permissive entries UPDATE
-- ============================================================
-- The "family favorite" policy was a superset of "update own" because PostgreSQL
-- ORs same-type policies together. Any family member could modify ANY column
-- on any family entry — transcript, dates, deleted status, everything.
DROP POLICY IF EXISTS entries_update_family_favorite ON entries;

-- Replace with a safe RPC function that ONLY toggles is_favorited.
-- Think of it like a dedicated "star" button that can only do one thing,
-- vs a master key that opens every door.
CREATE OR REPLACE FUNCTION toggle_entry_favorite(target_entry_id uuid)
RETURNS void AS $$
  UPDATE entries
  SET is_favorited = NOT is_favorited
  WHERE id = target_entry_id
    AND family_id IN (SELECT user_family_ids());
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- ============================================================
-- CRITICAL 3: Lock down children INSERT + add 15-child cap
-- ============================================================
-- Old policy was WITH CHECK (true) — no restrictions at all.
-- New policy requires: (1) you're an active family member, (2) your family
-- has fewer than 15 children. Like a school that checks your parent ID
-- AND checks if the class is full before enrolling a new kid.
DROP POLICY IF EXISTS children_insert_family ON children;

CREATE POLICY children_insert_family ON children
  FOR INSERT WITH CHECK (
    -- Must be an active member of at least one family
    EXISTS (
      SELECT 1 FROM family_members
      WHERE profile_id = auth.uid()
        AND status = 'active'
    )
    AND
    -- Family must have fewer than 15 children
    (
      SELECT count(*) FROM family_children
      WHERE family_id IN (SELECT user_family_ids())
    ) < 15
  );
