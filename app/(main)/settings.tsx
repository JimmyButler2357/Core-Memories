import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  Modal,
  TextInput,
  FlatList,
  Alert,
  Linking,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  colors,
  typography,
  spacing,
  radii,
  shadows,
  childColors,
  childColorWithOpacity,
  hitSlop,
  minTouchTarget,
} from '@/constants/theme';
import { useChildrenStore, mapSupabaseChild, type Child } from '@/stores/childrenStore';
import { useEntriesStore, mapSupabaseEntry, type Entry } from '@/stores/entriesStore';
import { useAuthStore } from '@/stores/authStore';
import { childrenService } from '@/services/children.service';
import { entriesService } from '@/services/entries.service';
import { storageService } from '@/services/storage.service';
import TopBar from '@/components/TopBar';
import ConfirmationDialog from '@/components/ConfirmationDialog';
import PrimaryButton from '@/components/PrimaryButton';
import BirthdayPicker from '@/components/BirthdayPicker';
import ColorPicker from '@/components/ColorPicker';
import { useLocationPermission } from '@/hooks/useLocation';
import { formatDate } from '@/lib/dateUtils';

// ─── Helpers ──────────────────────────────────────────────

function formatBirthday(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function daysAgo(iso: string): number {
  const now = new Date();
  const then = new Date(iso);
  return Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24));
}

// Reminder time options: 7:00 PM – 10:00 PM in 30-min steps
const REMINDER_TIMES = [
  '7:00 PM',
  '7:30 PM',
  '8:00 PM',
  '8:30 PM',
  '9:00 PM',
  '9:30 PM',
  '10:00 PM',
];

// ─── Settings Screen ──────────────────────────────────────

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const children = useChildrenStore((s) => s.children);
  const removeChildLocal = useChildrenStore((s) => s.removeChildLocal);
  const updateChildLocal = useChildrenStore((s) => s.updateChildLocal);
  const addChildLocal = useChildrenStore((s) => s.addChildLocal);
  const addEntryLocal = useEntriesStore((s) => s.addEntryLocal);
  const removeEntryLocal = useEntriesStore((s) => s.removeEntryLocal);
  const signOut = useAuthStore((s) => s.signOut);
  const familyId = useAuthStore((s) => s.familyId);
  const clearChildren = useChildrenStore((s) => s.clearChildren);
  const clearEntries = useEntriesStore((s) => s.clearEntries);
  const locationEnabled = useLocationPermission();

  // Local state
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState('8:30 PM');
  const [isSaving, setIsSaving] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDeletedModal, setShowDeletedModal] = useState(false);
  const [showEditChildModal, setShowEditChildModal] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [editName, setEditName] = useState('');
  const [editBirthday, setEditBirthday] = useState('');
  const [editColorIndex, setEditColorIndex] = useState(0);
  const [editNickname, setEditNickname] = useState('');
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [newChildName, setNewChildName] = useState('');
  const [newChildBirthday, setNewChildBirthday] = useState('');
  const [newChildColorIndex, setNewChildColorIndex] = useState(children.length % 6);
  const [newChildNickname, setNewChildNickname] = useState('');

  // Recently deleted entries — fetched from Supabase when the
  // modal opens, not filtered from local state.
  const [deletedEntries, setDeletedEntries] = useState<Entry[]>([]);
  const [isLoadingDeleted, setIsLoadingDeleted] = useState(false);

  // Fetch deleted entries when the modal opens
  const fetchDeletedEntries = useCallback(async () => {
    if (!familyId) return;
    setIsLoadingDeleted(true);
    try {
      const rows = await entriesService.getDeleted(familyId);
      setDeletedEntries(rows.map(mapSupabaseEntry));
    } catch (err) {
      console.warn('Failed to fetch deleted entries:', err);
    } finally {
      setIsLoadingDeleted(false);
    }
  }, [familyId]);

  useEffect(() => {
    if (showDeletedModal) fetchDeletedEntries();
  }, [showDeletedModal]);

  // Build child lookup
  const childMap = useMemo(() => {
    const map: Record<string, Child> = {};
    children.forEach((c) => (map[c.id] = c));
    return map;
  }, [children]);

  // ─── Edit Child Handlers ───────────────────────────────

  const openEditChild = (child: Child) => {
    setEditingChild(child);
    setEditName(child.name);
    setEditBirthday(child.birthday);
    setEditColorIndex(child.colorIndex);
    setEditNickname(child.nickname ?? '');
    setShowEditChildModal(true);
  };

  // Save edits to Supabase, then update the local store.
  // We use the "pessimistic" approach — wait for the server
  // to confirm before updating the UI. This means the user
  // sees a brief loading state, but we never show stale data.
  const saveEditChild = async () => {
    if (!editingChild || !editName.trim() || !editBirthday) return;

    setIsSaving(true);
    try {
      const updated = await childrenService.updateChild(editingChild.id, {
        name: editName.trim(),
        birthday: editBirthday,
        color_index: editColorIndex,
        nickname: editNickname.trim() || null,
      });
      // Update local cache with the server's response
      const mapped = mapSupabaseChild(updated);
      updateChildLocal(mapped.id, {
        name: mapped.name,
        birthday: mapped.birthday,
        colorIndex: mapped.colorIndex,
        nickname: mapped.nickname,
      });
      setShowEditChildModal(false);
      setEditingChild(null);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Could not save changes';
      Alert.alert('Error', msg);
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Add Child Handler ─────────────────────────────────

  // Create child in Supabase, then add to local store.
  const handleAddChild = async () => {
    if (!newChildName.trim() || !newChildBirthday) return;

    setIsSaving(true);
    try {
      const row = await childrenService.createChild({
        name: newChildName.trim(),
        birthday: newChildBirthday,
        nickname: newChildNickname.trim() || null,
        color_index: newChildColorIndex,
        display_order: children.length,
      });
      addChildLocal(mapSupabaseChild(row));
      setNewChildName('');
      setNewChildBirthday('');
      setNewChildNickname('');
      setNewChildColorIndex((children.length + 1) % 6);
      setShowAddChildModal(false);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Could not add child';
      Alert.alert('Error', msg);
    } finally {
      setIsSaving(false);
    }
  };

  const openAddChildModal = () => {
    setNewChildName('');
    setNewChildBirthday('');
    setNewChildNickname('');
    setNewChildColorIndex(children.length % 6);
    setShowAddChildModal(true);
  };

  // ─── Delete Account Handler ────────────────────────────

  const handleDeleteAccount = () => {
    setShowDeleteAccountDialog(false);
    // For MVP: sign out (simulates account deletion).
    // Real account deletion will be added in a future phase.
    handleSignOut();
  };

  // Sign out — clears Supabase session + all local stores,
  // then routes back to onboarding/sign-in.
  const handleSignOut = async () => {
    try {
      await signOut();
      clearChildren();
      clearEntries();
      router.replace('/(onboarding)');
    } catch (error) {
      console.warn('Sign out error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <TopBar title="Settings" showBack />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── 1. Children Section ─────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Children</Text>
          <View style={styles.card}>
            {children.map((child, i) => (
              <Pressable
                key={child.id}
                onPress={() => openEditChild(child)}
                style={({ pressed }) => [
                  styles.row,
                  i < children.length - 1 && styles.rowBorder,
                  pressed && { backgroundColor: colors.cardPressed },
                ]}
              >
                <View style={styles.rowContent}>
                  <View style={styles.childInfo}>
                    <View
                      style={[
                        styles.childDot,
                        {
                          backgroundColor:
                            childColors[child.colorIndex]?.hex ??
                            childColors[0].hex,
                        },
                      ]}
                    />
                    <Text style={styles.rowLabel}>{child.name}</Text>
                  </View>
                  <Text style={styles.rowSublabel}>
                    Born {formatBirthday(child.birthday)}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={colors.textMuted}
                />
              </Pressable>
            ))}

            {/* Add child button */}
            <Pressable
              onPress={openAddChildModal}
              style={({ pressed }) => [
                styles.row,
                pressed && { backgroundColor: colors.cardPressed },
              ]}
            >
              <View style={styles.addRow}>
                <Ionicons name="add-circle-outline" size={18} color={colors.accent} />
                <Text style={styles.addLabel}>Add Child</Text>
              </View>
            </Pressable>
          </View>
        </View>

        {/* ─── 2. Reminder Section ─────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Daily Reminder</Text>
          <View style={styles.card}>
            {/* Toggle row */}
            <View style={[styles.row, styles.rowBorder]}>
              <Text style={styles.rowLabel}>Reminder</Text>
              <Switch
                value={reminderEnabled}
                onValueChange={setReminderEnabled}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor={colors.card}
              />
            </View>

            {/* Time row */}
            <Pressable
              onPress={() => reminderEnabled && setShowTimePicker((p) => !p)}
              style={({ pressed }) => [
                styles.row,
                !reminderEnabled && { opacity: 0.5 },
                pressed && reminderEnabled && { backgroundColor: colors.cardPressed },
              ]}
            >
              <Text style={styles.rowLabel}>Time</Text>
              <View style={styles.timeValueRow}>
                <Text style={styles.timeValue}>{reminderTime}</Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={colors.textMuted}
                />
              </View>
            </Pressable>

            {/* Time picker dropdown */}
            {showTimePicker && reminderEnabled && (
              <View style={styles.timePickerWrap}>
                {REMINDER_TIMES.map((time) => (
                  <Pressable
                    key={time}
                    onPress={() => {
                      setReminderTime(time);
                      setShowTimePicker(false);
                    }}
                    style={[
                      styles.timeOption,
                      reminderTime === time && styles.timeOptionActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.timeOptionText,
                        reminderTime === time && styles.timeOptionTextActive,
                      ]}
                    >
                      {time}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* ─── 3. Subscription Section ─────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Subscription</Text>
          <View style={styles.card}>
            <Pressable
              onPress={() => {
                // No-op for MVP
              }}
              style={({ pressed }) => [
                styles.row,
                pressed && { backgroundColor: colors.cardPressed },
              ]}
            >
              <View style={styles.rowContent}>
                <Text style={styles.rowLabel}>Plan</Text>
                <Text style={styles.rowSublabel}>
                  Free Trial — 7 days remaining
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.textMuted}
              />
            </Pressable>
          </View>
        </View>

        {/* ─── 4. Recently Deleted ─────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Recently Deleted</Text>
          <View style={[styles.card, styles.deletedSectionCard]}>
            <Pressable
              onPress={() => setShowDeletedModal(true)}
              style={({ pressed }) => [
                styles.row,
                pressed && { backgroundColor: colors.cardPressed },
              ]}
            >
              <View style={styles.rowContent}>
                <Text style={styles.rowLabel}>View deleted memories</Text>
                <Text style={styles.rowSublabel}>
                  {deletedEntries.length > 0
                    ? `${deletedEntries.length} ${deletedEntries.length === 1 ? 'entry' : 'entries'} · Kept for 30 days`
                    : 'Entries are kept for 30 days'}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.textMuted}
              />
            </Pressable>
          </View>
        </View>

        {/* ─── 5. Data & Privacy ───────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Data & Privacy</Text>
          <View style={styles.card}>
            <Pressable
              onPress={() => {
                // No-op for MVP
              }}
              style={({ pressed }) => [
                styles.row,
                styles.rowBorder,
                pressed && { backgroundColor: colors.cardPressed },
              ]}
            >
              <Text style={styles.rowLabel}>Export All Entries</Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.textMuted}
              />
            </Pressable>

            <Pressable
              onPress={() => Linking.openSettings()}
              style={({ pressed }) => [
                styles.row,
                styles.rowBorder,
                pressed && { backgroundColor: colors.cardPressed },
              ]}
            >
              <View style={styles.rowContent}>
                <Text style={styles.rowLabel}>Location</Text>
                <Text style={styles.rowSublabel}>
                  {locationEnabled
                    ? 'Tag where memories happen'
                    : 'Turn on to auto-tag locations'}
                </Text>
              </View>
              <Text style={[styles.rowSublabel, { color: locationEnabled ? colors.accent : colors.textMuted }]}>
                {locationEnabled ? 'On' : 'Off'}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setShowDeleteAccountDialog(true)}
              style={({ pressed }) => [
                styles.row,
                pressed && { backgroundColor: colors.cardPressed },
              ]}
            >
              <Text style={styles.dangerLabel}>Delete Account</Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.danger}
              />
            </Pressable>
          </View>
        </View>

        {/* ─── 6. About ────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>About</Text>
          <View style={styles.card}>
            <View style={[styles.row, styles.rowBorder]}>
              <Text style={styles.rowLabel}>Version</Text>
              <Text style={styles.rowSublabel}>1.0.0</Text>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.row,
                styles.rowBorder,
                pressed && { backgroundColor: colors.cardPressed },
              ]}
            >
              <Text style={styles.rowLabel}>Privacy Policy</Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.textMuted}
              />
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.row,
                styles.rowBorder,
                pressed && { backgroundColor: colors.cardPressed },
              ]}
            >
              <Text style={styles.rowLabel}>Terms of Service</Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.textMuted}
              />
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.row,
                pressed && { backgroundColor: colors.cardPressed },
              ]}
            >
              <Text style={styles.rowLabel}>Contact Support</Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.textMuted}
              />
            </Pressable>
          </View>
        </View>

        {/* ─── 7. Sign Out ─────────────────────── */}
        <View style={styles.section}>
          <View style={styles.card}>
            <Pressable
              onPress={handleSignOut}
              style={({ pressed }) => [
                styles.row,
                pressed && { backgroundColor: colors.cardPressed },
              ]}
            >
              <View style={styles.addRow}>
                <Ionicons name="log-out-outline" size={18} color={colors.danger} />
                <Text style={styles.dangerLabel}>Sign Out</Text>
              </View>
            </Pressable>
          </View>
        </View>

        {/* Bottom spacer */}
        <View style={{ height: insets.bottom + spacing(8) }} />
      </ScrollView>

      {/* ─── Edit Child Modal (full-screen) ──────── */}
      <Modal
        visible={showEditChildModal}
        animationType="slide"
        onRequestClose={() => setShowEditChildModal(false)}
      >
        <View style={styles.fullModalContainer}>
          <View style={[styles.fullModalHeader, { paddingTop: insets.top + spacing(3) }]}>
            <Pressable
              onPress={() => setShowEditChildModal(false)}
              hitSlop={hitSlop.icon}
              style={({ pressed }) => [
                styles.fullModalCloseBtn,
                pressed && { opacity: 0.6 },
              ]}
            >
              <Ionicons name="chevron-back" size={22} color={colors.text} />
            </Pressable>
            <Text style={styles.fullModalTitle}>Edit Child</Text>
            <View style={{ width: minTouchTarget }} />
          </View>

          <ScrollView
            contentContainerStyle={styles.fullModalContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Name */}
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              value={editName}
              onChangeText={setEditName}
              style={styles.textInput}
              placeholder="Child's name"
              placeholderTextColor={colors.textMuted}
              autoFocus
            />

            {/* Birthday */}
            <Text style={styles.inputLabel}>Birthday</Text>
            <View style={styles.pickerField}>
              <BirthdayPicker
                value={editBirthday || undefined}
                onChange={setEditBirthday}
              />
            </View>

            {/* Color */}
            <Text style={styles.inputLabel}>Color</Text>
            <View style={styles.pickerField}>
              <ColorPicker
                selectedIndex={editColorIndex}
                onSelect={setEditColorIndex}
              />
            </View>

            {/* Nickname */}
            <Text style={styles.inputLabel}>Nickname (optional)</Text>
            <TextInput
              value={editNickname}
              onChangeText={setEditNickname}
              style={styles.textInput}
              placeholder="Used for voice auto-detection"
              placeholderTextColor={colors.textMuted}
            />

            {/* Save button */}
            <View style={styles.fullModalButtonArea}>
              <PrimaryButton
                label={isSaving ? 'Saving...' : 'Save'}
                onPress={saveEditChild}
                disabled={!editName.trim() || !editBirthday || isSaving}
              />
            </View>

            {/* Remove child */}
            {children.length > 1 && editingChild && (
              <Pressable
                onPress={async () => {
                  try {
                    await childrenService.deleteChild(editingChild.id);
                    removeChildLocal(editingChild.id);
                    setShowEditChildModal(false);
                    setEditingChild(null);
                  } catch (error) {
                    const msg = error instanceof Error ? error.message : 'Could not remove child';
                    Alert.alert('Error', msg);
                  }
                }}
                disabled={isSaving}
                style={({ pressed }) => [
                  styles.removeChildBtn,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={styles.dangerLabel}>Remove Child</Text>
              </Pressable>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* ─── Add Child Modal (full-screen) ──────── */}
      <Modal
        visible={showAddChildModal}
        animationType="slide"
        onRequestClose={() => setShowAddChildModal(false)}
      >
        <View style={styles.fullModalContainer}>
          <View style={[styles.fullModalHeader, { paddingTop: insets.top + spacing(3) }]}>
            <Pressable
              onPress={() => setShowAddChildModal(false)}
              hitSlop={hitSlop.icon}
              style={({ pressed }) => [
                styles.fullModalCloseBtn,
                pressed && { opacity: 0.6 },
              ]}
            >
              <Ionicons name="chevron-back" size={22} color={colors.text} />
            </Pressable>
            <Text style={styles.fullModalTitle}>Add Child</Text>
            <View style={{ width: minTouchTarget }} />
          </View>

          <ScrollView
            contentContainerStyle={styles.fullModalContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Name */}
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              value={newChildName}
              onChangeText={setNewChildName}
              style={styles.textInput}
              placeholder="Child's name"
              placeholderTextColor={colors.textMuted}
              autoFocus
            />

            {/* Birthday */}
            <Text style={styles.inputLabel}>Birthday</Text>
            <View style={styles.pickerField}>
              <BirthdayPicker
                value={newChildBirthday || undefined}
                onChange={setNewChildBirthday}
              />
            </View>

            {/* Color */}
            <Text style={styles.inputLabel}>Color</Text>
            <View style={styles.pickerField}>
              <ColorPicker
                selectedIndex={newChildColorIndex}
                onSelect={setNewChildColorIndex}
              />
            </View>

            {/* Nickname */}
            <Text style={styles.inputLabel}>Nickname (optional)</Text>
            <TextInput
              value={newChildNickname}
              onChangeText={setNewChildNickname}
              style={styles.textInput}
              placeholder="Used for voice auto-detection"
              placeholderTextColor={colors.textMuted}
            />

            {/* Add button */}
            <View style={styles.fullModalButtonArea}>
              <PrimaryButton
                label={isSaving
                  ? 'Saving...'
                  : newChildName.trim() && newChildBirthday
                    ? `Add ${newChildName.trim()}`
                    : 'Fill name & birthday to continue'}
                onPress={handleAddChild}
                disabled={!newChildName.trim() || !newChildBirthday || isSaving}
              />
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* ─── Recently Deleted Modal ────────────── */}
      <Modal
        visible={showDeletedModal}
        animationType="slide"
        onRequestClose={() => setShowDeletedModal(false)}
      >
        <View style={styles.deletedModalContainer}>
          <View style={[styles.deletedHeader, { paddingTop: insets.top + spacing(3) }]}>
            <Pressable
              onPress={() => setShowDeletedModal(false)}
              hitSlop={hitSlop.icon}
              style={({ pressed }) => [
                styles.deletedCloseBtn,
                pressed && { opacity: 0.6 },
              ]}
            >
              <Ionicons name="chevron-back" size={22} color={colors.text} />
            </Pressable>
            <Text style={styles.deletedTitle}>Recently Deleted</Text>
            <View style={{ width: minTouchTarget }} />
          </View>

          {isLoadingDeleted ? (
            <View style={styles.deletedEmpty}>
              <ActivityIndicator size="large" color={colors.accent} />
            </View>
          ) : deletedEntries.length === 0 ? (
            <View style={styles.deletedEmpty}>
              <Ionicons name="trash-outline" size={40} color={colors.textMuted} />
              <Text style={styles.deletedEmptyText}>No deleted memories</Text>
              <Text style={styles.deletedEmptyBody}>
                Deleted entries appear here for 30 days.
              </Text>
            </View>
          ) : (
            <FlatList
              data={deletedEntries}
              keyExtractor={(item) => item.id}
              contentContainerStyle={[styles.deletedList, { paddingBottom: insets.bottom + spacing(8) }]}
              renderItem={({ item }) => {
                const childNames = item.childIds
                  .map((id) => childMap[id]?.name ?? 'Unknown')
                  .join(', ');
                const deletedDays = item.deletedAt
                  ? daysAgo(item.deletedAt)
                  : 0;

                return (
                  <View style={styles.deletedCard}>
                    <Text style={styles.deletedPreview} numberOfLines={2}>
                      {item.text}
                    </Text>
                    <Text style={styles.deletedMeta}>
                      {childNames} · {formatDate(item.date)} · Deleted{' '}
                      {deletedDays === 0
                        ? 'today'
                        : `${deletedDays}d ago`}
                    </Text>
                    <View style={styles.deletedActions}>
                      <Pressable
                        onPress={async () => {
                          try {
                            await entriesService.restore(item.id);
                            // Refetch the full entry and add it back to Home
                            const row = await entriesService.getEntry(item.id);
                            addEntryLocal(mapSupabaseEntry(row));
                            // Remove from local deleted list
                            setDeletedEntries((prev) =>
                              prev.filter((e) => e.id !== item.id),
                            );
                          } catch (err) {
                            console.warn('Failed to restore:', err);
                          }
                        }}
                        style={({ pressed }) => [
                          styles.restoreBtn,
                          pressed && { opacity: 0.7 },
                        ]}
                      >
                        <Ionicons
                          name="arrow-undo-outline"
                          size={14}
                          color={colors.accent}
                        />
                        <Text style={styles.restoreLabel}>Restore</Text>
                      </Pressable>
                      <Pressable
                        onPress={async () => {
                          try {
                            await entriesService.hardDelete(item.id);
                            setDeletedEntries((prev) =>
                              prev.filter((e) => e.id !== item.id),
                            );
                          } catch (err) {
                            console.warn('Failed to permanently delete:', err);
                          }
                        }}
                        style={({ pressed }) => [
                          styles.permDeleteBtn,
                          pressed && { opacity: 0.7 },
                        ]}
                      >
                        <Text style={styles.permDeleteLabel}>
                          Delete forever
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                );
              }}
              ItemSeparatorComponent={() => (
                <View style={{ height: spacing(3) }} />
              )}
            />
          )}
        </View>
      </Modal>

      {/* ─── Delete Account Confirmation ───────── */}
      <ConfirmationDialog
        visible={showDeleteAccountDialog}
        title="Delete your account?"
        body="This will permanently delete all your memories, children, and settings. This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDeleteAccount}
        onCancel={() => setShowDeleteAccountDialog(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    paddingHorizontal: spacing(5),
    paddingTop: spacing(2),
  },
  // ─── Sections ──────────────────────────
  section: {
    marginBottom: spacing(3),
  },
  sectionHeader: {
    ...typography.timestamp,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing(2),
    marginLeft: spacing(1),
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
    overflow: 'hidden',
  },
  deletedSectionCard: {
    borderColor: childColorWithOpacity('#E8724A', 0.25),
  },
  // ─── Rows ──────────────────────────────
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing(3) + 1, // ~13px
    paddingHorizontal: spacing(4),
    minHeight: minTouchTarget,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowContent: {
    flex: 1,
    marginRight: spacing(2),
  },
  rowLabel: {
    ...typography.formLabel,
    color: colors.text,
  },
  rowSublabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  dangerLabel: {
    ...typography.formLabel,
    color: colors.danger,
  },
  // ─── Child Info ────────────────────────
  childInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
    marginBottom: 2,
  },
  childDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  // ─── Add Row ───────────────────────────
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
  },
  addLabel: {
    ...typography.formLabel,
    color: colors.accent,
    fontWeight: '600',
  },
  // ─── Time Picker ──────────────────────
  timeValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
  },
  timeValue: {
    ...typography.formLabel,
    color: colors.accent,
    fontWeight: '600',
  },
  timePickerWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing(3),
    gap: spacing(2),
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  timeOption: {
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(3),
    borderRadius: radii.sm,
    backgroundColor: colors.tag,
  },
  timeOptionActive: {
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  timeOptionText: {
    ...typography.caption,
    color: colors.textSoft,
  },
  timeOptionTextActive: {
    color: colors.accent,
    fontWeight: '700',
  },
  // ─── Modals (Edit/Add Child) ──────────
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.overlay,
    paddingHorizontal: spacing(5),
  },
  modalCard: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing(6),
  },
  modalTitle: {
    ...typography.screenTitle,
    color: colors.text,
    marginBottom: spacing(4),
  },
  inputLabel: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing(2),
  },
  textInput: {
    ...typography.formLabel,
    color: colors.text,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingVertical: spacing(3),
    paddingHorizontal: spacing(3),
    marginBottom: spacing(3),
  },
  modalMeta: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing(4),
  },
  modalButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(3),
    marginTop: spacing(2),
  },
  modalButtonCancel: {
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(4),
    borderRadius: radii.md,
    backgroundColor: colors.tag,
  },
  modalButtonSave: {
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(4),
    borderRadius: radii.md,
    backgroundColor: colors.accent,
  },
  modalButtonDanger: {
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(4),
    borderRadius: radii.md,
  },
  cancelLabel: {
    ...typography.buttonLabel,
    fontSize: 13,
    color: colors.textSoft,
  },
  saveLabel: {
    ...typography.buttonLabel,
    fontSize: 13,
    color: colors.card,
  },
  // ─── Full-screen Modal (Add/Edit Child) ─
  fullModalContainer: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  fullModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing(5),
    paddingBottom: spacing(3),
  },
  fullModalCloseBtn: {
    minWidth: minTouchTarget,
    minHeight: minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullModalTitle: {
    ...typography.screenTitle,
    color: colors.text,
  },
  fullModalContent: {
    paddingHorizontal: spacing(5),
    paddingBottom: spacing(8),
  },
  pickerField: {
    marginBottom: spacing(4),
  },
  fullModalButtonArea: {
    marginTop: spacing(4),
  },
  removeChildBtn: {
    alignItems: 'center',
    paddingVertical: spacing(4),
    marginTop: spacing(2),
  },
  // ─── Recently Deleted Modal ────────────
  deletedModalContainer: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  deletedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing(5),
    paddingBottom: spacing(3),
  },
  deletedCloseBtn: {
    minWidth: minTouchTarget,
    minHeight: minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deletedTitle: {
    ...typography.screenTitle,
    color: colors.text,
  },
  deletedList: {
    paddingHorizontal: spacing(5),
    paddingBottom: spacing(8),
  },
  deletedEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing(3),
  },
  deletedEmptyText: {
    ...typography.sectionHeading,
    color: colors.text,
  },
  deletedEmptyBody: {
    ...typography.formLabel,
    color: colors.textSoft,
  },
  // ─── Deleted Entry Card ────────────────
  deletedCard: {
    backgroundColor: colors.card,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing(4),
    ...shadows.sm,
  },
  deletedPreview: {
    ...typography.entryPreview,
    color: colors.text,
    marginBottom: spacing(2),
  },
  deletedMeta: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing(3),
  },
  deletedActions: {
    flexDirection: 'row',
    gap: spacing(4),
  },
  restoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1),
    paddingVertical: spacing(1),
  },
  restoreLabel: {
    ...typography.caption,
    color: colors.accent,
    fontWeight: '700',
  },
  permDeleteBtn: {
    paddingVertical: spacing(1),
  },
  permDeleteLabel: {
    ...typography.caption,
    color: colors.danger,
    fontWeight: '600',
  },
});
