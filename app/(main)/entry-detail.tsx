import { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Animated,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams, useNavigation } from 'expo-router';
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
import { useEntriesStore, mapSupabaseEntry } from '@/stores/entriesStore';
import type { Entry } from '@/stores/entriesStore';
import { useChildrenStore, type Child } from '@/stores/childrenStore';
import { useAuthStore } from '@/stores/authStore';
import { entriesService } from '@/services/entries.service';
import { storageService } from '@/services/storage.service';
import ChildPill from '@/components/ChildPill';
import TagPill from '@/components/TagPill';
import PaperTexture from '@/components/PaperTexture';
import ConfirmationDialog from '@/components/ConfirmationDialog';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { useLocationPermission } from '@/hooks/useLocation';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { detectChildren, detectTags } from '@/lib/autoDetect';
import { formatDate, formatTime, formatDuration, getAge } from '@/lib/dateUtils';
import { tagsService } from '@/services/tags.service';

// ─── FadeInUp Wrapper ────────────────────────────────────

/**
 * Wraps children in a subtle slide-up + fade-in entrance.
 * Think of a card sliding up from just below where it sits —
 * it only moves 10px, so it feels snappy, not dramatic.
 */
function FadeInUp({ children, skip }: { children: React.ReactNode; skip: boolean }) {
  const opacity = useRef(new Animated.Value(skip ? 1 : 0)).current;
  const translateY = useRef(new Animated.Value(skip ? 0 : 10)).current;

  useEffect(() => {
    if (skip) return;
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

// ─── Frequent Tags ────────────────────────────────────────

const FREQUENT_TAGS = [
  'funny', 'milestone', 'first', 'sweet',
  'bedtime', 'outing', 'words', 'siblings',
];

// ─── Helpers (shared from lib/) ───────────────────────────

// ─── Entry Detail Screen ──────────────────────────────────

export default function EntryDetailScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  // ─── Route Params ──────────────────────────────────────
  //
  // This screen works in two modes:
  //   1. Existing entry: params.entryId → fetch from Supabase
  //   2. New entry (from recording): params.transcript + params.audioUri
  //      → create in Supabase, then display
  //
  // Think of it like opening a document — either you open an
  // existing file (entryId) or you create a new one from
  // what you just wrote (transcript + audioUri).

  const params = useLocalSearchParams<{
    entryId?: string;
    transcript?: string;
    audioUri?: string;
    locationText?: string;
  }>();

  const allChildren = useChildrenStore((s) => s.children);
  const familyId = useAuthStore((s) => s.familyId);

  // Local store methods — update the cache after Supabase writes
  const addEntryLocal = useEntriesStore((s) => s.addEntryLocal);
  const updateEntryLocal = useEntriesStore((s) => s.updateEntryLocal);
  const removeEntryLocal = useEntriesStore((s) => s.removeEntryLocal);

  // ─── Entry State ───────────────────────────────────────
  //
  // The entry starts as null and gets populated either by
  // fetching an existing one or by creating a new one.

  const [entry, setEntry] = useState<Entry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Location — lightweight check, no GPS (just permission status)
  const permissionGranted = useLocationPermission();
  const [editingLocation, setEditingLocation] = useState(false);
  const [locationInput, setLocationInput] = useState('');

  // Local UI state
  const [transcript, setTranscript] = useState('');
  const [showChildPicker, setShowChildPicker] = useState(false);
  const [showTagEditor, setShowTagEditor] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showReRecordDialog, setShowReRecordDialog] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [saveIndicator, setSaveIndicator] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Banner auto-dismiss (built-in Animated, not Reanimated)
  const bannerOpacity = useRef(new Animated.Value(1)).current;
  const reduceMotion = useReduceMotion();

  // Debounce timer for transcript saves — we don't want to
  // hit Supabase on every single keystroke. Think of it like
  // Google Docs: it saves a moment after you stop typing.
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Audio player — loads a signed URL from Supabase Storage
  // and gives us play/pause/seek/position/duration.
  const player = useAudioPlayer();

  // ─── Load or Create Entry ──────────────────────────────
  //
  // On mount, figure out which mode we're in:
  //   - entryId → fetch existing entry from Supabase
  //   - transcript/audioUri → create a new entry in Supabase
  //   - neither → show "no entry" screen

  useEffect(() => {
    let cancelled = false;

    async function loadEntry() {
      try {
        if (params.entryId) {
          // ── Mode 1: Existing entry ──
          const row = await entriesService.getEntry(params.entryId);
          if (cancelled) return;
          const mapped = mapSupabaseEntry(row);
          setEntry(mapped);
          setTranscript(mapped.text);
          setLocationInput(mapped.locationText ?? '');
        } else if (params.transcript !== undefined || params.audioUri) {
          // ── Mode 2: New entry from recording ──
          if (!familyId) throw new Error('No family — cannot create entry');

          // Step 1: Create the entry row in the database
          const row = await entriesService.create({
            family_id: familyId,
            transcript: params.transcript || '',
            entry_date: new Date().toISOString(),
            entry_type: params.audioUri ? 'voice' : 'text',
            location_text: params.locationText || null,
          });
          if (cancelled) return;

          // Steps 2 & 3 run in parallel — audio upload and
          // child/tag detection don't depend on each other, so
          // running them at the same time saves hundreds of ms.

          const transcriptText = params.transcript || '';

          // Branch A: Upload audio (if we have a recording)
          const audioPromise = params.audioUri
            ? storageService.uploadAudio(row.id, params.audioUri)
                .then((storagePath) =>
                  entriesService.update(row.id, { audio_storage_path: storagePath }),
                )
                .catch((uploadErr) => {
                  // Audio upload failed — entry still saved with text
                  console.warn('Audio upload failed:', uploadErr);
                })
            : Promise.resolve();

          // Branch B: Auto-detect children + tags from transcript
          const detectPromise = (async () => {
            // Detect children mentioned by name/nickname
            let detectedChildIds = detectChildren(transcriptText, allChildren);
            if (detectedChildIds.length === 0 && allChildren.length > 0) {
              detectedChildIds = [allChildren[0].id];
            }
            if (detectedChildIds.length > 0) {
              try {
                await entriesService.setEntryChildren(row.id, detectedChildIds, true);
              } catch (childErr) {
                console.warn('Failed to assign children:', childErr);
              }
            }
            // Detect tags from keywords
            try {
              const allTags = await tagsService.getSystemTags();
              const detectedTagIds = detectTags(transcriptText, allTags);
              if (detectedTagIds.length > 0) {
                await entriesService.setEntryTags(row.id, detectedTagIds, true);
              }
            } catch (tagErr) {
              console.warn('Failed to auto-detect tags:', tagErr);
            }
          })();

          // Wait for both branches to finish
          await Promise.all([audioPromise, detectPromise]);

          // Step 4: Fetch the full entry (with joins) for display
          const fullRow = await entriesService.getEntry(row.id);
          if (cancelled) return;
          const mapped = mapSupabaseEntry(fullRow);
          setEntry(mapped);
          setTranscript(mapped.text);
          setLocationInput(mapped.locationText ?? '');

          // Also add to local cache so Home shows it immediately
          addEntryLocal(mapped);
        } else {
          // No params at all — nothing to show
          setEntry(null);
        }
      } catch (err) {
        if (cancelled) return;
        console.warn('Entry load/create failed:', err);
        const msg = err instanceof Error ? err.message : String(err);
        // Give a friendlier message for network errors
        if (msg.includes('network') || msg.includes('fetch') || msg.includes('timeout')) {
          setError('No internet connection — check your network and try again');
        } else {
          setError(msg || 'Something went wrong');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadEntry();
    return () => { cancelled = true; };
  }, [params.entryId, retryCount]);

  // Banner auto-dismiss
  useEffect(() => {
    if (showBanner && entry?.hasAudio) {
      const timer = setTimeout(() => {
        if (reduceMotion) {
          bannerOpacity.setValue(0);
          setShowBanner(false);
        } else {
          Animated.timing(bannerOpacity, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }).start(() => setShowBanner(false));
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showBanner, entry]);

  // ─── Load Audio for Playback ──────────────────────────
  //
  // When we have an entry with audio, get a signed URL from
  // Supabase Storage and load it into the player. The signed
  // URL is like a temporary pass — it expires after 1 hour.

  useEffect(() => {
    if (!entry?.hasAudio || !entry.audioStoragePath) return;

    let cancelled = false;
    const path = entry.audioStoragePath;
    (async () => {
      try {
        const signedUrl = await storageService.getPlaybackUrl(path);
        if (cancelled) return;
        await player.load(signedUrl);
      } catch (err) {
        console.warn('Failed to load audio for playback:', err);
      }
    })();

    return () => { cancelled = true; };
  }, [entry?.id, entry?.hasAudio]);

  // ─── Refresh on Focus (for Re-Record) ──────────────────
  //
  // When the user comes back from re-recording, the entry
  // has been updated in Supabase but our local state is stale.
  // We listen for the screen regaining focus and refetch.

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      if (!entry?.id) return;
      try {
        const row = await entriesService.getEntry(entry.id);
        const mapped = mapSupabaseEntry(row);
        setEntry(mapped);
        setTranscript(mapped.text);
        updateEntryLocal(entry.id, mapped);
      } catch {
        // Entry may have been deleted — ignore
      }
    });
    return unsubscribe;
  }, [navigation, entry?.id]);

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  // ─── Loading State ──────────────────────────────────────

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  // ─── Error State ────────────────────────────────────────

  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
        <Text style={styles.emptyText}>{error}</Text>
        <Pressable
          onPress={() => {
            setError(null);
            setIsLoading(true);
            setRetryCount((c) => c + 1);
          }}
        >
          <Text style={styles.retryLink}>Retry</Text>
        </Pressable>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backLink}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  if (!entry) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="document-text-outline" size={48} color={colors.textMuted} />
        <Text style={styles.emptyText}>No entry to display</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backLink}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  // Derived data
  const entryChildren = entry.childIds
    .map((id) => allChildren.find((c) => c.id === id))
    .filter(Boolean) as Child[];
  const untaggedChildren = allChildren.filter(
    (c) => !entry.childIds.includes(c.id),
  );
  const allChildrenTagged = untaggedChildren.length === 0;

  // ─── Handlers ──────────────────────────────────────────

  // Debounced transcript save — updates local state immediately
  // (so typing feels instant) but waits 800ms before sending
  // the change to Supabase. If you keep typing, the timer
  // resets, so only the final version gets saved.
  const handleTranscriptChange = (text: string) => {
    setTranscript(text);
    setEntry((prev) => prev ? { ...prev, text } : prev);
    updateEntryLocal(entry.id, { text });

    // Debounce the Supabase save
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        await entriesService.update(entry.id, { transcript: text });
        setSaveIndicator(true);
        setTimeout(() => setSaveIndicator(false), 2000);
      } catch (err) {
        console.warn('Failed to save transcript:', err);
      }
    }, 800);
  };

  const handleAddChildToEntry = async (childId: string) => {
    const newIds = [...entry.childIds, childId];
    // Optimistic update — show change immediately
    setEntry((prev) => prev ? { ...prev, childIds: newIds } : prev);
    updateEntryLocal(entry.id, { childIds: newIds });
    try {
      await entriesService.setEntryChildren(entry.id, newIds);
    } catch (err) {
      // Revert on failure
      console.warn('Failed to update children:', err);
      setEntry((prev) => prev ? { ...prev, childIds: entry.childIds } : prev);
      updateEntryLocal(entry.id, { childIds: entry.childIds });
    }
  };

  const handleRemoveChildFromEntry = async (childId: string) => {
    if (entry.childIds.length <= 1) {
      setShowChildPicker(true);
      return;
    }
    const newIds = entry.childIds.filter((id) => id !== childId);
    setEntry((prev) => prev ? { ...prev, childIds: newIds } : prev);
    updateEntryLocal(entry.id, { childIds: newIds });
    try {
      await entriesService.setEntryChildren(entry.id, newIds);
    } catch (err) {
      console.warn('Failed to remove child:', err);
      setEntry((prev) => prev ? { ...prev, childIds: entry.childIds } : prev);
      updateEntryLocal(entry.id, { childIds: entry.childIds });
    }
  };

  const handleToggleChildInPicker = (childId: string) => {
    if (entry.childIds.includes(childId)) {
      if (entry.childIds.length > 1) {
        handleRemoveChildFromEntry(childId);
      }
    } else {
      handleAddChildToEntry(childId);
    }
  };

  const handleAddTag = (tag: string) => {
    const trimmed = tag.trim().toLowerCase();
    if (!trimmed || entry.tags.includes(trimmed)) return;
    const newTags = [...entry.tags, trimmed];
    setEntry((prev) => prev ? { ...prev, tags: newTags } : prev);
    updateEntryLocal(entry.id, { tags: newTags });
    setTagInput('');
    // Tag sync to Supabase is complex (needs tag IDs, not slugs).
    // Chunk 11 will handle this with auto-detection + proper tag lookup.
  };

  const handleRemoveTag = (tag: string) => {
    const newTags = entry.tags.filter((t) => t !== tag);
    setEntry((prev) => prev ? { ...prev, tags: newTags } : prev);
    updateEntryLocal(entry.id, { tags: newTags });
  };

  const handleToggleFavorite = async () => {
    // Optimistic update
    const newVal = !entry.isFavorited;
    setEntry((prev) => prev ? { ...prev, isFavorited: newVal } : prev);
    updateEntryLocal(entry.id, { isFavorited: newVal });
    try {
      await entriesService.toggleFavorite(entry.id);
    } catch (err) {
      // Revert on failure
      console.warn('Failed to toggle favorite:', err);
      setEntry((prev) => prev ? { ...prev, isFavorited: !newVal } : prev);
      updateEntryLocal(entry.id, { isFavorited: !newVal });
    }
  };

  const handleDelete = async () => {
    setShowDeleteDialog(false);
    try {
      await entriesService.softDelete(entry.id);
      removeEntryLocal(entry.id);
      router.back();
    } catch (err) {
      console.warn('Failed to delete entry:', err);
    }
  };

  const handleLocationSave = async (text: string) => {
    const loc = text.trim() || undefined;
    setEntry((prev) => prev ? { ...prev, locationText: loc } : prev);
    updateEntryLocal(entry.id, { locationText: loc });
    setEditingLocation(false);
    try {
      await entriesService.update(entry.id, {
        location_text: loc || null,
      });
    } catch (err) {
      console.warn('Failed to save location:', err);
    }
  };

  // Date picker — lets users backdate entries (but not into the future).
  // On iOS the picker is inline (appears below the date line).
  // On Android the picker is a native modal dialog.
  const handleDateChange = async (_event: any, selectedDate?: Date) => {
    // On Android, the picker fires the event and closes itself.
    // On iOS, it stays open — we dismiss it via a Done button.
    if (Platform.OS === 'android') setShowDatePicker(false);

    if (!selectedDate) return;

    // Block future dates — you can't create a memory that
    // hasn't happened yet!
    const now = new Date();
    if (selectedDate > now) return;

    const newDate = selectedDate.toISOString();
    setEntry((prev) => prev ? { ...prev, date: newDate } : prev);
    updateEntryLocal(entry.id, { date: newDate });
    try {
      await entriesService.update(entry.id, { entry_date: newDate });
    } catch (err) {
      console.warn('Failed to update date:', err);
    }
  };

  const handleReRecord = () => {
    setShowReRecordDialog(false);
    router.push({
      pathname: '/(main)/recording',
      params: { reRecordEntryId: entry.id },
    });
  };

  // Age line
  const ageLine = entryChildren
    .map((c) => `${c.name} ${getAge(c.birthday, entry.date)}`)
    .join(' · ');

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + spacing(3) }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={hitSlop.icon}
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <View style={styles.topBarRight}>
          <Pressable
            onPress={handleToggleFavorite}
            hitSlop={hitSlop.icon}
            style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
          >
            <Ionicons
              name={entry.isFavorited ? 'heart' : 'heart-outline'}
              size={22}
              color={entry.isFavorited ? colors.heartFilled : colors.text}
            />
          </Pressable>
          <Pressable
            onPress={() => setShowDeleteDialog(true)}
            hitSlop={hitSlop.icon}
            style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
          >
            <Ionicons name="trash-outline" size={20} color={colors.text} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + spacing(10) }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Post-recording banner */}
        {showBanner && entry.hasAudio && (
          <Animated.View style={[styles.banner, { opacity: bannerOpacity }]}>
            <Ionicons name="heart" size={16} color={colors.accent} />
            <Text style={styles.bannerText}>Memory saved</Text>
          </Animated.View>
        )}

        {/* Line 1: Date + time — tap to change date */}
        <Pressable
          onPress={() => setShowDatePicker(true)}
          style={styles.dateLine}
        >
          <Text style={styles.dateText}>{formatDate(entry.date, 'long')}</Text>
          <Text style={styles.timeText}>{formatTime(entry.date)}</Text>
          <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
        </Pressable>

        {/* Inline date picker — iOS shows inline, Android shows modal */}
        {showDatePicker && (
          <FadeInUp skip={reduceMotion}>
            <View style={styles.datePickerContainer}>
              <DateTimePicker
                value={new Date(entry.date)}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                maximumDate={new Date()}
                onChange={handleDateChange}
                accentColor={colors.accent}
              />
              {Platform.OS === 'ios' && (
                <Pressable
                  onPress={() => setShowDatePicker(false)}
                  style={styles.datePickerDone}
                >
                  <Text style={styles.datePickerDoneText}>Done</Text>
                </Pressable>
              )}
            </View>
          </FadeInUp>
        )}

        {/* Line 2: Location
             - Permission granted + has location → show, tappable to edit
             - Permission granted + no location → show "Add location" placeholder
             - Permission revoked + has location → show read-only (data still visible)
             - Permission revoked + no location → hide entirely (no wasted space) */}
        {(permissionGranted || entry.locationText) && (
          <>
            <Pressable
              onPress={permissionGranted ? () => setEditingLocation(true) : undefined}
              disabled={!permissionGranted}
              style={styles.locationLine}
              hitSlop={hitSlop.icon}
            >
              <Ionicons
                name="location-outline"
                size={14}
                color={colors.textMuted}
              />
              <Text style={styles.locationText}>
                {entry.locationText || 'Add location'}
              </Text>
            </Pressable>

            {editingLocation && permissionGranted && (
              <FadeInUp skip={reduceMotion}>
                <View style={styles.locationEditorCard}>
                  <TextInput
                    style={styles.locationInput}
                    value={locationInput}
                    onChangeText={setLocationInput}
                    placeholder="Enter a location..."
                    placeholderTextColor={colors.textMuted}
                    onSubmitEditing={() => handleLocationSave(locationInput)}
                    returnKeyType="done"
                    autoFocus
                  />
                  <View style={styles.locationActions}>
                    <Pressable
                      onPress={() => {
                        setLocationInput('');
                        handleLocationSave('');
                      }}
                      style={styles.locationClearBtn}
                    >
                      <Text style={styles.locationClearText}>Clear</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleLocationSave(locationInput)}
                      style={styles.locationDoneBtn}
                    >
                      <Text style={styles.locationDoneText}>Done</Text>
                    </Pressable>
                  </View>
                </View>
              </FadeInUp>
            )}
          </>
        )}

        {/* Line 3: Child pills + add button */}
        <View style={styles.childLine}>
          {entryChildren.map((child) => (
            <ChildPill
              key={child.id}
              name={child.name}
              color={childColors[child.colorIndex]?.hex ?? childColors[0].hex}
              showRemove
              onRemove={() => handleRemoveChildFromEntry(child.id)}
            />
          ))}
          {!allChildrenTagged && (
            <Pressable
              onPress={() => setShowChildPicker(!showChildPicker)}
              hitSlop={hitSlop.icon}
              style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.6 }]}
            >
              <Ionicons name="add" size={18} color={colors.accent} />
            </Pressable>
          )}
        </View>

        {/* Line 3: Age line */}
        {ageLine.length > 0 && (
          <Text style={styles.ageLine}>{ageLine}</Text>
        )}

        {/* Child Picker */}
        {showChildPicker && (
          <FadeInUp skip={reduceMotion}>
            <View style={styles.pickerCard}>
              {allChildren.map((child) => {
                const isSelected = entry.childIds.includes(child.id);
                const hex = childColors[child.colorIndex]?.hex ?? childColors[0].hex;
                return (
                  <Pressable
                    key={child.id}
                    onPress={() => handleToggleChildInPicker(child.id)}
                    style={[
                      styles.pickerPill,
                      {
                        borderColor: isSelected ? hex : colors.border,
                        backgroundColor: isSelected
                          ? childColorWithOpacity(hex, 0.12)
                          : colors.card,
                      },
                    ]}
                  >
                    {isSelected && (
                      <Ionicons name="checkmark" size={14} color={hex} />
                    )}
                    <Text
                      style={[
                        styles.pickerPillText,
                        { color: isSelected ? hex : colors.textMuted },
                      ]}
                    >
                      {child.name}
                    </Text>
                  </Pressable>
                );
              })}
              <Pressable
                onPress={() => setShowChildPicker(false)}
                style={styles.pickerDone}
              >
                <Text style={styles.pickerDoneText}>Done</Text>
              </Pressable>
            </View>
          </FadeInUp>
        )}

        {/* Tags Row */}
        <View style={styles.tagsRow}>
          {entry.tags.map((tag) => (
            <TagPill
              key={tag}
              label={tag}
              onRemove={() => handleRemoveTag(tag)}
            />
          ))}
          <Pressable onPress={() => setShowTagEditor(!showTagEditor)}>
            <Text style={styles.addTagLink}>+ add</Text>
          </Pressable>
        </View>

        {/* Tag Editor */}
        {showTagEditor && (
          <FadeInUp skip={reduceMotion}>
            <View style={styles.tagEditorCard}>
              <TextInput
                style={styles.tagInput}
                value={tagInput}
                onChangeText={setTagInput}
                placeholder="Add a tag..."
                placeholderTextColor={colors.textMuted}
                onSubmitEditing={() => handleAddTag(tagInput)}
                returnKeyType="done"
              />
              <Text style={styles.frequentLabel}>Your Frequent Tags</Text>
              <View style={styles.frequentRow}>
                {FREQUENT_TAGS.map((tag) => {
                  const isAdded = entry.tags.includes(tag);
                  return (
                    <Pressable
                      key={tag}
                      onPress={() =>
                        isAdded ? handleRemoveTag(tag) : handleAddTag(tag)
                      }
                      style={[
                        styles.frequentPill,
                        isAdded && styles.frequentPillActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.frequentPillText,
                          isAdded && styles.frequentPillTextActive,
                        ]}
                      >
                        {tag}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </FadeInUp>
        )}

        {/* Transcript hint — when voice recording produced no text */}
        {entry.hasAudio && !transcript && (
          <View style={styles.transcriptHint}>
            <Ionicons name="create-outline" size={14} color={colors.textMuted} />
            <Text style={styles.transcriptHintText}>
              No speech detected — type your memory below
            </Text>
          </View>
        )}

        {/* Transcript Area */}
        <View style={styles.transcriptCard}>
          <PaperTexture />
          <TextInput
            style={styles.transcriptInput}
            value={transcript}
            onChangeText={handleTranscriptChange}
            placeholder="Start typing your memory..."
            placeholderTextColor={colors.textMuted}
            multiline
            textAlignVertical="top"
          />
        </View>
        {saveIndicator && (
          <Text style={styles.savedIndicator}>All changes saved</Text>
        )}

        {/* Audio Playback Bar */}
        {entry.hasAudio && (
          <View style={styles.audioBar}>
            <Pressable
              onPress={() => player.isPlaying ? player.pause() : player.play()}
              style={styles.playBtn}
              disabled={!player.isLoaded}
            >
              <Ionicons
                name={player.isPlaying ? 'pause' : 'play'}
                size={16}
                color={player.isLoaded ? colors.accent : colors.textMuted}
              />
            </Pressable>
            <View style={styles.scrubTrack}>
              <View
                style={[
                  styles.scrubFill,
                  {
                    width: player.duration > 0
                      ? `${(player.position / player.duration) * 100}%`
                      : '0%',
                  },
                ]}
              />
            </View>
            <Text style={styles.audioDuration}>
              {player.duration > 0
                ? formatDuration(player.isPlaying ? player.position : player.duration, true)
                : '--:--'}
            </Text>
            <Pressable
              onPress={() => setShowReRecordDialog(true)}
              hitSlop={hitSlop.icon}
              style={({ pressed }) => [styles.reRecordBtn, pressed && { opacity: 0.6 }]}
            >
              <Ionicons name="mic-outline" size={16} color={colors.accent} />
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* Delete confirmation */}
      <ConfirmationDialog
        visible={showDeleteDialog}
        title="Delete this memory?"
        body="Deleted entries can be recovered for 30 days."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
      />

      {/* Re-record confirmation */}
      <ConfirmationDialog
        visible={showReRecordDialog}
        title="Re-record this memory?"
        body="Your current recording will be replaced with a new one. The transcript will update to match."
        confirmLabel="Re-record"
        variant="default"
        onConfirm={handleReRecord}
        onCancel={() => setShowReRecordDialog(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing(3),
  },
  emptyText: {
    ...typography.formLabel,
    color: colors.textMuted,
  },
  backLink: {
    ...typography.formLabel,
    color: colors.textMuted,
  },
  retryLink: {
    ...typography.formLabel,
    color: colors.accent,
    fontWeight: '600',
  },
  // ─── Top Bar ────────────────────────
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing(5),
    paddingBottom: spacing(3),
  },
  topBarRight: {
    flexDirection: 'row',
    gap: spacing(3),
  },
  iconBtn: {
    minWidth: minTouchTarget,
    minHeight: minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // ─── Scroll ─────────────────────────
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing(5),
    paddingBottom: spacing(10),
  },
  // ─── Banner ─────────────────────────
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
    backgroundColor: colors.accentSoft,
    padding: spacing(3),
    borderRadius: radii.md,
    marginBottom: spacing(4),
  },
  bannerText: {
    ...typography.formLabel,
    color: colors.accent,
    fontWeight: '600',
  },
  // ─── Metadata ───────────────────────
  dateLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing(2),
    marginBottom: spacing(3),
  },
  dateText: {
    ...typography.formLabel,
    fontWeight: '700',
    color: colors.text,
  },
  timeText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  // ─── Date Picker ──────────────────
  datePickerContainer: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing(3),
    marginBottom: spacing(4),
    alignItems: 'center',
  },
  datePickerDone: {
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(4),
    marginTop: spacing(2),
  },
  datePickerDoneText: {
    ...typography.formLabel,
    color: colors.accent,
  },
  // ─── Location ─────────────────────
  locationLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1),
    marginBottom: spacing(3),
    minHeight: minTouchTarget,
  },
  locationText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  locationEditorCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing(3),
    marginBottom: spacing(4),
  },
  locationInput: {
    ...typography.formLabel,
    color: colors.text,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing(2),
  },
  locationActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing(3),
    marginTop: spacing(2),
  },
  locationClearBtn: {
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(3),
    minWidth: minTouchTarget,
    minHeight: minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationClearText: {
    ...typography.formLabel,
    color: colors.textMuted,
  },
  locationDoneBtn: {
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(3),
    minWidth: minTouchTarget,
    minHeight: minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationDoneText: {
    ...typography.formLabel,
    color: colors.accent,
  },
  childLine: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing(2),
    marginBottom: spacing(2),
  },
  addBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: minTouchTarget,
    minHeight: minTouchTarget,
  },
  ageLine: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing(4),
  },
  // ─── Child Picker ───────────────────
  pickerCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing(3),
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing(2),
    marginBottom: spacing(4),
  },
  pickerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1),
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(3),
    borderRadius: radii.pill,
    borderWidth: 1.5,
  },
  pickerPillText: {
    ...typography.pillLabel,
  },
  pickerDone: {
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(3),
  },
  pickerDoneText: {
    ...typography.formLabel,
    color: colors.accent,
  },
  // ─── Tags ───────────────────────────
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing(2),
    marginBottom: spacing(4),
  },
  addTagLink: {
    ...typography.caption,
    color: colors.accent,
  },
  // ─── Tag Editor ─────────────────────
  tagEditorCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing(3),
    marginBottom: spacing(4),
  },
  tagInput: {
    ...typography.formLabel,
    color: colors.text,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing(2),
    marginBottom: spacing(3),
  },
  frequentLabel: {
    ...typography.timestamp,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing(2),
  },
  frequentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing(2),
  },
  frequentPill: {
    backgroundColor: colors.tag,
    paddingVertical: 4,
    paddingHorizontal: spacing(2),
    borderRadius: radii.sm,
  },
  frequentPillActive: {
    backgroundColor: colors.accentSoft,
  },
  frequentPillText: {
    ...typography.tag,
    color: colors.textSoft,
  },
  frequentPillTextActive: {
    color: colors.accent,
  },
  // ─── Transcript ─────────────────────
  transcriptHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
    marginBottom: spacing(2),
    paddingHorizontal: spacing(1),
  },
  transcriptHintText: {
    ...typography.caption,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  transcriptCard: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
    overflow: 'hidden',
    padding: spacing(4),
    minHeight: 200,
    marginBottom: spacing(2),
  },
  transcriptInput: {
    ...typography.transcript,
    color: colors.text,
    minHeight: 180,
  },
  savedIndicator: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'right',
    marginBottom: spacing(4),
  },
  // ─── Audio Bar ──────────────────────
  audioBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(3),
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing(3),
  },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrubTrack: {
    flex: 1,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
  },
  scrubFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 2,
  },
  audioDuration: {
    ...typography.caption,
    color: colors.textMuted,
  },
  reRecordBtn: {
    width: 28,
    height: 28,
    borderRadius: radii.full,
    backgroundColor: colors.accentSoft,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    minWidth: minTouchTarget,
    minHeight: minTouchTarget,
  },
});
