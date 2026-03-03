import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  colors,
  fonts,
  typography,
  spacing,
  radii,
  shadows,
  childColors,
} from '@/constants/theme';
import { useChildrenStore, mapSupabaseChild } from '@/stores/childrenStore';
import { childrenService } from '@/services/children.service';
import PrimaryButton from '@/components/PrimaryButton';
import ChildPill from '@/components/ChildPill';
import PaperTexture from '@/components/PaperTexture';
import BirthdayPicker, { formatBirthdayDisplay } from '@/components/BirthdayPicker';

// ─── Add Child Screen ─────────────────────────────────────
//
// This screen writes to Supabase, not just local state.
// The flow:
// 1. User fills in name + birthday (+ optional nickname)
// 2. We call childrenService.createChild() → saves to the database
// 3. The server returns the saved row (with a real UUID)
// 4. We map it to the UI shape and add it to the local store
//
// If the network call fails, we show an error and DON'T add
// anything locally — we never want local and server data to
// get out of sync.

export default function AddChildScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { children, addChildLocal, removeChildLocal } = useChildrenStore();

  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [birthday, setBirthday] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const hasChildren = children.length > 0;
  const nameEntered = name.trim().length > 0;
  const birthdaySet = !!birthday;
  const formReady = nameEntered && birthdaySet;

  // Dynamic heading
  const heading = hasChildren
    ? 'Anyone else?'
    : nameEntered
      ? `Let's start ${name.trim()}'s memory book.`
      : 'Who are we remembering?';

  // Button label
  const getButtonLabel = () => {
    if (isLoading) return 'Saving...';
    if (!nameEntered) return 'Enter a name to continue';
    if (!birthdaySet) return 'Add a birthday to continue';
    if (hasChildren) return `Add ${name.trim()} & continue`;
    return `Add ${name.trim()}`;
  };

  // Save a child to Supabase, then update local store.
  // Returns true if successful, false if it failed.
  const saveChildToSupabase = async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Send to Supabase. The `color_index` auto-increments based
      // on how many children we already have (0, 1, 2... up to 5,
      // then wraps around). `display_order` works the same way.
      const row = await childrenService.createChild({
        name: name.trim(),
        birthday,
        nickname: nickname.trim() || null,
        color_index: children.length % 6,
        display_order: children.length,
      });

      // Convert the snake_case database row to our camelCase UI shape
      // and add it to the local store for instant display.
      addChildLocal(mapSupabaseChild(row));

      // Reset form for potential next child
      setName('');
      setNickname('');
      setBirthday('');
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Something went wrong';
      Alert.alert('Could not save', message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Remove a child — deletes from Supabase, then removes locally
  const handleRemoveChild = async (id: string) => {
    try {
      await childrenService.deleteChild(id);
      removeChildLocal(id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not remove child';
      Alert.alert('Error', message);
    }
  };

  const handleAddChild = async () => {
    if (!formReady) return;
    await saveChildToSupabase();
  };

  const handleContinue = async () => {
    if (formReady) {
      const success = await saveChildToSupabase();
      if (!success) return; // Don't navigate if save failed
    }
    router.push('/(onboarding)/mic-permission');
  };

  const handleButtonPress = async () => {
    if (!formReady) return;
    if (hasChildren) {
      // "Add [name] & continue" — add the child and move on
      await handleContinue();
    } else {
      // "Add [name]" — add first child, form resets, heading changes to "Anyone else?"
      await handleAddChild();
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + spacing(8), paddingBottom: insets.bottom + spacing(5) }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Heading */}
        <Text style={styles.heading}>{heading}</Text>

        {/* Existing children pills */}
        {hasChildren && (
          <View style={styles.pillRow}>
            {children.map((child) => {
              const color = childColors[child.colorIndex]?.hex ?? childColors[0].hex;
              return (
                <ChildPill
                  key={child.id}
                  name={`${child.name} · ${formatBirthdayDisplay(child.birthday)}`}
                  color={color}
                  showRemove
                  onRemove={() => handleRemoveChild(child.id)}
                />
              );
            })}
          </View>
        )}

        {/* Form card */}
        <View style={styles.card}>
          <PaperTexture />

          {/* Name field */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput
              style={styles.nameInput}
              value={name}
              onChangeText={setName}
              placeholder="Child's name"
              placeholderTextColor={colors.textMuted}
              editable={!isLoading}
            />
            <View style={styles.fieldDivider} />
          </View>

          {/* Birthday field */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Birthday</Text>
            <BirthdayPicker
              value={birthday || undefined}
              onChange={setBirthday}
            />
            <View style={styles.fieldDivider} />
          </View>

          {/* Nickname field */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Nickname (optional)</Text>
            <TextInput
              style={styles.nicknameInput}
              value={nickname}
              onChangeText={setNickname}
              placeholder="Used for voice auto-detection"
              placeholderTextColor={colors.textMuted}
              editable={!isLoading}
            />
          </View>
        </View>

        {/* Primary button */}
        <View style={styles.buttonArea}>
          <PrimaryButton
            label={getButtonLabel()}
            onPress={handleButtonPress}
            disabled={!formReady || isLoading}
          />

          {/* "Continue" button when children exist and form is empty */}
          {hasChildren && !formReady && (
            <Pressable
              onPress={() => router.push('/(onboarding)/mic-permission')}
              disabled={isLoading}
            >
              <Text style={styles.continueBtn}>Continue</Text>
            </Pressable>
          )}

          {/* "Add another child" link when children exist */}
          {hasChildren && formReady && (
            <Pressable onPress={handleAddChild} disabled={isLoading}>
              <Text style={styles.addAnotherLink}>Add another child</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing(5),
  },
  heading: {
    ...typography.sectionHeading,
    color: colors.text,
    marginBottom: spacing(5),
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing(2),
    marginBottom: spacing(5),
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing(4),
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing(6),
  },
  field: {
    marginBottom: spacing(4),
  },
  fieldLabel: {
    ...typography.timestamp,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing(2),
  },
  nameInput: {
    fontFamily: fonts.serif,
    fontSize: 16,
    color: colors.text,
    paddingVertical: spacing(2),
  },
  nicknameInput: {
    ...typography.formLabel,
    color: colors.text,
    paddingVertical: spacing(2),
  },
  fieldDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginTop: spacing(2),
  },
  buttonArea: {
    gap: spacing(4),
    alignItems: 'center',
  },
  continueBtn: {
    ...typography.buttonLabel,
    color: colors.accent,
  },
  addAnotherLink: {
    ...typography.formLabel,
    color: colors.accent,
  },
});
