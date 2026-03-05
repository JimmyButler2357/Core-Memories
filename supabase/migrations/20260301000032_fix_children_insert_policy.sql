-- Migration 032: fix_children_insert_policy
--
-- THE PROBLEM (found through debugging):
-- The children_insert_family WITH CHECK policy's EXISTS check queries family_members
-- directly. This triggers the family_members_select_family USING policy, which calls
-- user_family_ids(), which queries family_members again (SECURITY DEFINER, no RLS).
-- This recursive chain causes the WITH CHECK to silently evaluate to false during
-- INSERT operations, even though the user's family_members record exists and a direct
-- SELECT on family_members works fine.
--
-- Think of it like a bouncer checking your ID by asking another bouncer, who has to
-- ask a third person... somewhere in that chain the answer gets lost for INSERTs.
--
-- THE FIX:
-- Replace the direct family_members query with a call to user_family_ids() — the
-- SECURITY DEFINER function that bypasses RLS entirely. This short-circuits the
-- recursive chain: instead of family_members → RLS → user_family_ids() → family_members,
-- we go straight to user_family_ids() → family_members (no RLS hop in the middle).
--
-- SECURITY: Identical. user_family_ids() already checks profile_id = auth.uid() AND
-- status = 'active', so membership validation is preserved. The 15-child cap remains.

DROP POLICY IF EXISTS children_insert_family ON children;

CREATE POLICY children_insert_family ON children
  FOR INSERT WITH CHECK (
    -- User must belong to at least one active family.
    -- user_family_ids() is SECURITY DEFINER — it reads family_members directly
    -- without triggering family_members' own RLS policies (no recursive chain).
    EXISTS (SELECT 1 FROM user_family_ids())
    AND
    -- That family must have fewer than 15 children.
    (
      SELECT count(*) FROM family_children
      WHERE family_id IN (SELECT user_family_ids())
    ) < 15
  );
