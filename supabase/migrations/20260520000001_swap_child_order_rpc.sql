-- Migration: swap_child_order RPC
--
-- Atomically swap the display_order of two children belonging to the same
-- family. Wrapping the two UPDATEs in a single function call gives us one
-- transaction — if the second UPDATE fails (network drop, RLS surprise,
-- whatever), the first is rolled back, so we never leave the family with
-- two children sharing the same display_order.
--
-- SECURITY:
--   1. Caller must be authenticated (auth.uid() IS NOT NULL).
--   2. Both children must belong to a family the caller is a member of.
--   3. SECURITY DEFINER + explicit search_path so an attacker can't hijack
--      the function via search_path manipulation (project rule).

CREATE OR REPLACE FUNCTION swap_child_order(p_a uuid, p_b uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  order_a smallint;
  order_b smallint;
  family_match_count int;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_a = p_b THEN
    RAISE EXCEPTION 'Cannot swap a child with itself';
  END IF;

  -- Both children must belong to a family the caller is a member of.
  -- Count must equal 2 (one row per child).
  SELECT count(*) INTO family_match_count
  FROM family_children
  WHERE family_id IN (SELECT user_family_ids())
    AND child_id IN (p_a, p_b);

  IF family_match_count <> 2 THEN
    RAISE EXCEPTION 'Both children must belong to your family';
  END IF;

  SELECT display_order INTO order_a FROM children WHERE id = p_a;
  SELECT display_order INTO order_b FROM children WHERE id = p_b;

  -- Both UPDATEs run inside the same function = same transaction.
  UPDATE children SET display_order = order_b WHERE id = p_a;
  UPDATE children SET display_order = order_a WHERE id = p_b;
END;
$$;

GRANT EXECUTE ON FUNCTION swap_child_order(uuid, uuid) TO authenticated;
