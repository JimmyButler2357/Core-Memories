-- Migration 019: create_rls_policies
-- Row Level Security is like giving each family their own invisible partition
-- in the database. Even though all families share the same tables, Family A
-- can never see Family B's data. Every query automatically gets a filter:
-- "...AND this row belongs to your family."

-- ============================================================
-- PROFILES: own-row only
-- You can only see and edit your own profile.
-- ============================================================
CREATE POLICY profiles_select_own ON profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================================
-- FAMILIES: read if member, update if owner
-- ============================================================
CREATE POLICY families_select_member ON families
  FOR SELECT USING (id IN (SELECT user_family_ids()));

CREATE POLICY families_update_owner ON families
  FOR UPDATE USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- ============================================================
-- FAMILY_MEMBERS: read family, insert if owner, update own, delete if owner
-- ============================================================
CREATE POLICY family_members_select_family ON family_members
  FOR SELECT USING (family_id IN (SELECT user_family_ids()));

CREATE POLICY family_members_insert_owner ON family_members
  FOR INSERT WITH CHECK (
    family_id IN (
      SELECT fm.family_id FROM family_members fm
      WHERE fm.profile_id = auth.uid()
        AND fm.role = 'owner'
        AND fm.status = 'active'
    )
  );

CREATE POLICY family_members_update_own ON family_members
  FOR UPDATE USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY family_members_delete_owner ON family_members
  FOR DELETE USING (
    family_id IN (
      SELECT fm.family_id FROM family_members fm
      WHERE fm.profile_id = auth.uid()
        AND fm.role = 'owner'
        AND fm.status = 'active'
    )
  );

-- ============================================================
-- CHILDREN: read/insert/update if family member, delete if owner
-- ============================================================
CREATE POLICY children_select_family ON children
  FOR SELECT USING (
    id IN (
      SELECT child_id FROM family_children
      WHERE family_id IN (SELECT user_family_ids())
    )
  );

-- Allow insert — the handle_new_child trigger links to family automatically.
-- RLS on family_children ensures only family members can read.
CREATE POLICY children_insert_family ON children
  FOR INSERT WITH CHECK (true);

CREATE POLICY children_update_family ON children
  FOR UPDATE USING (
    id IN (
      SELECT child_id FROM family_children
      WHERE family_id IN (SELECT user_family_ids())
    )
  );

CREATE POLICY children_delete_owner ON children
  FOR DELETE USING (
    id IN (
      SELECT fc.child_id FROM family_children fc
      JOIN family_members fm ON fm.family_id = fc.family_id
      WHERE fm.profile_id = auth.uid()
        AND fm.role = 'owner'
        AND fm.status = 'active'
    )
  );

-- ============================================================
-- FAMILY_CHILDREN: read/insert if family member, delete if owner
-- ============================================================
CREATE POLICY family_children_select_family ON family_children
  FOR SELECT USING (family_id IN (SELECT user_family_ids()));

CREATE POLICY family_children_insert_family ON family_children
  FOR INSERT WITH CHECK (family_id IN (SELECT user_family_ids()));

CREATE POLICY family_children_delete_owner ON family_children
  FOR DELETE USING (
    family_id IN (
      SELECT fm.family_id FROM family_members fm
      WHERE fm.profile_id = auth.uid()
        AND fm.role = 'owner'
        AND fm.status = 'active'
    )
  );

-- ============================================================
-- ENTRIES: read if family, insert/update/delete if own
-- ============================================================
CREATE POLICY entries_select_family ON entries
  FOR SELECT USING (family_id IN (SELECT user_family_ids()));

CREATE POLICY entries_insert_own ON entries
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND family_id IN (SELECT user_family_ids())
  );

CREATE POLICY entries_update_own ON entries
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Any family member can toggle favorite on any family entry
CREATE POLICY entries_update_family_favorite ON entries
  FOR UPDATE USING (family_id IN (SELECT user_family_ids()))
  WITH CHECK (family_id IN (SELECT user_family_ids()));

CREATE POLICY entries_delete_own ON entries
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================
-- ENTRY_CHILDREN: family read, own-entry write
-- ============================================================
CREATE POLICY entry_children_select_family ON entry_children
  FOR SELECT USING (
    entry_id IN (
      SELECT id FROM entries
      WHERE family_id IN (SELECT user_family_ids())
    )
  );

CREATE POLICY entry_children_insert_own ON entry_children
  FOR INSERT WITH CHECK (
    entry_id IN (
      SELECT id FROM entries WHERE user_id = auth.uid()
    )
  );

CREATE POLICY entry_children_delete_own ON entry_children
  FOR DELETE USING (
    entry_id IN (
      SELECT id FROM entries WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- TAGS: public read for system, family read for custom, family write
-- ============================================================
CREATE POLICY tags_select_all ON tags
  FOR SELECT USING (
    family_id IS NULL  -- system/AI tags visible to everyone
    OR family_id IN (SELECT user_family_ids())  -- custom tags for your family
  );

CREATE POLICY tags_insert_family ON tags
  FOR INSERT WITH CHECK (
    family_id IN (SELECT user_family_ids())
    AND source = 'user_created'
  );

CREATE POLICY tags_delete_family ON tags
  FOR DELETE USING (
    family_id IN (SELECT user_family_ids())
    AND source = 'user_created'
  );

-- ============================================================
-- ENTRY_TAGS: family read, own-entry write
-- ============================================================
CREATE POLICY entry_tags_select_family ON entry_tags
  FOR SELECT USING (
    entry_id IN (
      SELECT id FROM entries
      WHERE family_id IN (SELECT user_family_ids())
    )
  );

CREATE POLICY entry_tags_insert_own ON entry_tags
  FOR INSERT WITH CHECK (
    entry_id IN (
      SELECT id FROM entries WHERE user_id = auth.uid()
    )
  );

CREATE POLICY entry_tags_delete_own ON entry_tags
  FOR DELETE USING (
    entry_id IN (
      SELECT id FROM entries WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- PROMPTS: public read for all authenticated users
-- ============================================================
CREATE POLICY prompts_select_all ON prompts
  FOR SELECT TO authenticated
  USING (is_active = true);

-- ============================================================
-- USER_DEVICES: own-row only
-- ============================================================
CREATE POLICY user_devices_select_own ON user_devices
  FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY user_devices_insert_own ON user_devices
  FOR INSERT WITH CHECK (profile_id = auth.uid());

CREATE POLICY user_devices_update_own ON user_devices
  FOR UPDATE USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY user_devices_delete_own ON user_devices
  FOR DELETE USING (profile_id = auth.uid());

-- ============================================================
-- PROMPT_HISTORY: own-row only
-- ============================================================
CREATE POLICY prompt_history_select_own ON prompt_history
  FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY prompt_history_insert_own ON prompt_history
  FOR INSERT WITH CHECK (profile_id = auth.uid());

-- ============================================================
-- NOTIFICATION_LOG: read own, insert service-role only
-- ============================================================
CREATE POLICY notification_log_select_own ON notification_log
  FOR SELECT USING (profile_id = auth.uid());

-- Only the service_role key (which bypasses RLS) can insert.
-- This prevents users from faking notification records.
CREATE POLICY notification_log_insert_service ON notification_log
  FOR INSERT WITH CHECK (false);
