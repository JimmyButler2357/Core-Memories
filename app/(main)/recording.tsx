import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Animated,
  StyleSheet,
  Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ExpoSpeechRecognitionModule } from 'expo-speech-recognition';
import {
  colors,
  typography,
  spacing,
  radii,
  shadows,
  hitSlop,
  minTouchTarget,
} from '@/constants/theme';
import { useChildrenStore } from '@/stores/childrenStore';
import { useEntriesStore } from '@/stores/entriesStore';
import { useAuthStore } from '@/stores/authStore';
import { entriesService } from '@/services/entries.service';
import { storageService } from '@/services/storage.service';
import { audioCleanupService } from '@/services/audioCleanup.service';
import { promptsService } from '@/services/prompts.service';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { ageInMonths, formatDuration } from '@/lib/dateUtils';
import { useLocation } from '@/hooks/useLocation';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import ErrorState from '@/components/ErrorState';
import PaperTexture from '@/components/PaperTexture';
import WarmGlow from '@/components/WarmGlow';

// ─── Fallback Prompts ─────────────────────────────────────
//
// Used when we can't reach Supabase (offline, first launch,
// loading delay). Once real prompts load, these are replaced.

const FALLBACK_PROMPTS = [
  "What's something they said today that made you smile?",
  "What made them laugh the hardest today?",
  "What's something small you don't want to forget?",
];

// ─── Recording Screen ─────────────────────────────────────

export default function RecordingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { reRecordEntryId, onboarding } = useLocalSearchParams<{
    reRecordEntryId?: string;
    onboarding?: string;
  }>();
  const isReRecord = !!reRecordEntryId;

  const children = useChildrenStore((s) => s.children);
  const updateEntryLocal = useEntriesStore((s) => s.updateEntryLocal);
  const profile = useAuthStore((s) => s.profile);

  // Real speech recognition — captures audio + live transcript
  const speech = useSpeechRecognition();

  // Check mic permission on mount so we can show the denied
  // screen immediately instead of waiting for them to tap record.
  const [micPermission, setMicPermission] = useState<'granted' | 'denied' | 'checking'>('checking');

  const [state, setState] = useState<'prompts' | 'recording'>('prompts');
  const [seconds, setSeconds] = useState(0);
  const [prompts, setPrompts] = useState<string[] | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Tracks when we've called stop() but speech hasn't finalized yet.
  // Once isRecording goes false, the transcript is ready to use.
  const [isStopping, setIsStopping] = useState(false);

  // Shows a brief "too short" message when user stops immediately
  const [tooShortMessage, setTooShortMessage] = useState(false);

  // Breathing circle animation (built-in Animated, not Reanimated)
  const breatheAnim = useRef(new Animated.Value(1)).current;
  const ringAnim = useRef(new Animated.Value(1)).current;
  const ringOpacity = useRef(new Animated.Value(0.12)).current;
  const promptOpacity = useRef(new Animated.Value(1)).current;

  const { locationText } = useLocation();

  // Refs for the navigate-after-stop effect — keep them after
  // the hooks above so the initial values are defined.
  const secondsRef = useRef(seconds);
  secondsRef.current = seconds;
  const speechRef = useRef(speech);
  speechRef.current = speech;
  const locationTextRef = useRef(locationText);
  locationTextRef.current = locationText;
  const reduceMotion = useReduceMotion();

  // ─── Permission Check ──────────────────────────────────
  //
  // On mount, ask the OS whether mic access was already
  // granted or permanently denied. If "canAskAgain" is true,
  // we let the hook request permission when they tap record.

  useEffect(() => {
    ExpoSpeechRecognitionModule.getPermissionsAsync()
      .then((result) => {
        if (result.granted) {
          setMicPermission('granted');
        } else if (!result.canAskAgain) {
          // Permanently denied — show the "open settings" screen
          setMicPermission('denied');
        } else {
          // Not yet decided — the hook will prompt when they tap record
          setMicPermission('granted');
        }
      })
      .catch(() => {
        // Can't check? Assume ok — hook will handle errors
        setMicPermission('granted');
      });
  }, []);

  // ─── Load Daily Prompts ────────────────────────────────
  //
  // Fetches 3 prompts per day from Supabase, then caches them
  // in AsyncStorage. First open today = network fetch (~200ms).
  // Every open after that = instant from local cache (~10ms).
  // Child names are substituted at render time (not cached) so
  // renames take effect immediately without clearing the cache.

  useEffect(() => {
    if (!profile?.id || onboarding === 'true') return;

    let cancelled = false;
    const childAge = children.length > 0
      ? ageInMonths(children[0].birthday)
      : undefined;

    (async () => {
      try {
        const daily = await promptsService.getDailyPrompts(profile.id, 3, childAge);
        if (cancelled) return;

        const texts = daily.map((p, i) =>
          p.text.replace(
            /\{child_name\}/gi,
            children.length > 0 ? children[i % children.length].name : 'your child',
          )
        );
        setPrompts(texts);
      } catch {
        if (!cancelled) setPrompts(FALLBACK_PROMPTS);
      }
    })();

    return () => { cancelled = true; };
  }, [profile?.id]);

  // ─── Sync UI State with Speech Hook ────────────────────
  //
  // Instead of manually tracking isRecording ourselves, we
  // watch the hook's isRecording flag. When the speech engine
  // fires its "start" event, we switch to recording mode.

  useEffect(() => {
    if (speech.isRecording && state !== 'recording') {
      setState('recording');
    }
  }, [speech.isRecording]);

  // If the hook reports a permission error, show the denied screen
  useEffect(() => {
    if (speech.error) {
      setState('prompts');
      if (speech.error.toLowerCase().includes('permission')) {
        setMicPermission('denied');
      }
    }
  }, [speech.error]);

  // Start breathing animation
  useEffect(() => {
    if (state === 'recording') {
      if (reduceMotion) {
        // Skip decorative animations — jump to final states
        promptOpacity.setValue(0);
        return;
      }

      // Breathe: scale 1 → 1.15 → 1
      Animated.loop(
        Animated.sequence([
          Animated.timing(breatheAnim, {
            toValue: 1.15,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(breatheAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]),
      ).start();

      // Ring pulse: scale 1 → 1.7, opacity 0.12 → 0
      Animated.loop(
        Animated.parallel([
          Animated.timing(ringAnim, {
            toValue: 1.7,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(ringOpacity, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
      ).start();

      // Fade out prompts
      Animated.timing(promptOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [state]);

  // Timer
  useEffect(() => {
    if (state === 'recording') {
      timerRef.current = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state]);

  // Auto-stop at 60 seconds
  useEffect(() => {
    if (seconds >= 60) {
      handleStop();
    }
  }, [seconds]);

  // ─── Navigate After Speech Finishes ────────────────────
  //
  // When the user taps stop, we set isStopping=true and call
  // speech.stop(). The speech engine takes a moment to
  // finalize the transcript + save the audio file. Once
  // speech.isRecording flips to false, everything is ready —
  // we create the entry and navigate.

  useEffect(() => {
    if (!isStopping || speech.isRecording) return;

    // Read latest values from refs to avoid stale closures.
    // The effect only depends on [isStopping, speech.isRecording]
    // so it fires at the right time, but reads fresh data via refs.
    const s = speechRef.current;
    const secs = secondsRef.current;
    const loc = locationTextRef.current;

    // ── Edge case: Empty recording ──
    //
    // If the user tapped record then immediately stopped (less
    // than 2 seconds), there's nothing useful to save. Show a
    // brief message instead of creating a blank entry.
    if (secs < 2 && !s.transcript) {
      setIsStopping(false);
      setState('prompts');
      setSeconds(0);
      setTooShortMessage(true);
      setTimeout(() => setTooShortMessage(false), 3000);
      return;
    }

    if (isReRecord && reRecordEntryId) {
      // Re-record: update existing entry's audio + transcript
      // via Supabase, then go back to the entry detail screen.
      (async () => {
        try {
          // Upload the new audio file (upsert overwrites the old one)
          if (s.audioUri) {
            await storageService.uploadAudio(reRecordEntryId, s.audioUri);
            // Clean up local .wav after successful upload
            await audioCleanupService.deleteLocalFile(s.audioUri);
          }
          // Update the transcript in the database
          await entriesService.update(reRecordEntryId, {
            transcript: s.transcript || '',
          });
          // Update local cache too
          updateEntryLocal(reRecordEntryId, {
            text: s.transcript || '',
            hasAudio: true,
          });
          // Re-run AI with the new transcript so the title stays fresh
          entriesService.processWithAI(reRecordEntryId).catch(() => {});
        } catch (err) {
          console.warn('Re-record save failed:', err);
        }
        router.back();
      })();
    } else {
      // Normal: navigate to entry-detail with the transcript
      // and audioUri. Entry-detail will create the Supabase
      // entry and upload the audio itself.
      router.replace({
        pathname: '/(main)/entry-detail',
        params: {
          transcript: s.transcript,
          audioUri: s.audioUri ?? '',
          locationText: loc ?? '',
          onboarding: onboarding ?? '',
        },
      });
    }

    setIsStopping(false);
  }, [isStopping, speech.isRecording]);

  // ─── Start / Stop Handlers ─────────────────────────────

  const handleStart = useCallback(async () => {
    setSeconds(0);
    speech.reset(); // Clear any previous error or transcript
    await speech.start();
    // The hook fires a 'start' event → speech.isRecording = true
    // → our useEffect above switches state to 'recording'.
    // If permission is denied, speech.error gets set instead.
  }, [speech]);

  const handleStop = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    speech.stop();
    setIsStopping(true);
  }, [speech]);

  // Clean up if the user navigates away mid-recording
  useEffect(() => {
    return () => {
      speech.stop();
    };
  }, []);


  // Mic permission denied — show friendly error
  if (micPermission === 'denied') {
    return (
      <View style={styles.container}>
        <View style={[styles.topBar, { paddingTop: insets.top + spacing(3) }]}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={hitSlop.icon}
            style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.6 }]}
          >
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
        </View>
        <ErrorState
          icon="mic-off-outline"
          title="Microphone access needed"
          body="Forever Fireflies needs mic access to record your voice. You can enable it in your device settings."
          actionLabel="Open Settings"
          onAction={() => Linking.openSettings()}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Warm radial gradient backdrop */}
      <WarmGlow />

      {/* Top bar: just an X */}
      <View style={[styles.topBar, { paddingTop: insets.top + spacing(3) }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={hitSlop.icon}
          style={({ pressed }) => [
            styles.closeBtn,
            pressed && { opacity: 0.6 },
          ]}
        >
          <Ionicons name="close" size={24} color={colors.text} />
        </Pressable>
      </View>

      {/* Prompt cards — fade out during recording */}
      <Animated.View style={[styles.promptArea, { opacity: promptOpacity }]}>
        {state === 'prompts' && (
          isReRecord ? (
            <View style={styles.promptScroll}>
              <View style={styles.promptCard}>
                <PaperTexture radius={radii.card} />
                <Ionicons name="refresh-outline" size={20} color={colors.accent} style={{ marginBottom: spacing(2) }} />
                <Text style={styles.promptText}>Take your time and re-record this memory</Text>
              </View>
            </View>
          ) : onboarding === 'true' ? (
            <View style={styles.promptScroll}>
              <View style={styles.promptCard}>
                <PaperTexture radius={radii.card} />
                <Text style={styles.promptText}>Tap the mic and tell us about a moment you never want to forget</Text>
              </View>
            </View>
          ) : prompts === null ? (
            /* Skeleton cards while cache loads (~10ms, barely visible) */
            <View style={styles.promptScroll}>
              {[0, 1, 2].map((i) => (
                <View key={i} style={[styles.promptCard, { opacity: 0.4 }]}>
                  <View style={styles.skeletonLine} />
                  <View style={[styles.skeletonLine, styles.skeletonLineShort]} />
                </View>
              ))}
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.promptScroll}
            >
              {prompts.map((prompt, i) => (
                <View key={i} style={styles.promptCard}>
                  <PaperTexture radius={radii.card} />
                  <Text style={styles.promptText}>{prompt}</Text>
                </View>
              ))}
            </ScrollView>
          )
        )}
      </Animated.View>

      {/* Recording area */}
      <View style={[styles.recordingArea, { paddingBottom: insets.bottom + spacing(12) }]}>
        {state === 'recording' && (
          <>
            {/* Timer */}
            <Text style={styles.timer}>{formatDuration(seconds)}</Text>
            <Text style={styles.timerHint}>
              {seconds < 5 ? 'Recording...' : `${60 - seconds}s remaining`}
            </Text>

            {/* Live transcript — updates in real-time as you speak */}
            <ScrollView
              style={styles.transcriptScroll}
              contentContainerStyle={styles.transcriptContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={speech.transcript ? styles.liveTranscript : styles.transcriptPlaceholder}>
                {speech.transcript || 'Start speaking...'}
              </Text>
            </ScrollView>
          </>
        )}

        {/* Breathing circle + ring pulse (recording only) */}
        <View style={styles.micWrapper}>
          {state === 'recording' && (
            <>
              {/* Expanding ring */}
              <Animated.View
                style={[
                  styles.ring,
                  {
                    transform: [{ scale: ringAnim }],
                    opacity: ringOpacity,
                  },
                ]}
              />
              {/* Breathing circle */}
              <Animated.View
                style={[
                  styles.breatheCircle,
                  { transform: [{ scale: breatheAnim }] },
                ]}
              />
            </>
          )}

          {/* Mic button (prompts mode) / Stop button (recording mode) */}
          {state === 'prompts' ? (
            <Pressable
              onPress={handleStart}
              style={({ pressed }) => [
                styles.micButton,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Ionicons name="mic" size={42} color={colors.card} />
            </Pressable>
          ) : (
            <Pressable
              onPress={handleStop}
              style={({ pressed }) => [
                styles.stopButton,
                pressed && { opacity: 0.85 },
              ]}
            >
              <View style={styles.stopIcon} />
            </Pressable>
          )}
        </View>

        {state === 'prompts' && !tooShortMessage && !speech.error && (
          <Text style={styles.micHint}>Tap to start recording</Text>
        )}
        {tooShortMessage && (
          <Text style={styles.errorHint}>Recording too short — try again</Text>
        )}
        {speech.error && !speech.error.toLowerCase().includes('permission') && (
          <Text style={styles.errorHint}>Something went wrong — try again</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  // ─── Top Bar ────────────────────────
  topBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing(5),
  },
  closeBtn: {
    minWidth: minTouchTarget,
    minHeight: minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // ─── Prompts ────────────────────────
  promptArea: {
    flex: 1,
    paddingHorizontal: spacing(5),
  },
  promptScroll: {
    paddingTop: spacing(4),
    gap: spacing(3),
    paddingBottom: spacing(4),
  },
  promptCard: {
    backgroundColor: colors.card,
    borderRadius: radii.card,
    paddingVertical: 20,
    paddingHorizontal: 24,
    ...shadows.promptCard,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  promptText: {
    ...typography.promptCard,
    color: colors.text,
  },
  skeletonLine: {
    height: 16,
    backgroundColor: colors.border,
    borderRadius: radii.sm,
    width: '80%',
  },
  skeletonLineShort: {
    width: '55%',
    marginTop: spacing(2),
  },
  // ─── Recording Area ─────────────────
  recordingArea: {
    alignItems: 'center',
    paddingBottom: spacing(12),
    gap: spacing(4),
  },
  timer: {
    fontSize: 28,
    fontWeight: '300',
    color: colors.text,
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
  },
  timerHint: {
    ...typography.caption,
    color: colors.textMuted,
  },
  micWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 160,
    height: 160,
  },
  ring: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  breatheCircle: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.accentGlow,
  },
  micButton: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 4,
    zIndex: 1,
  },
  stopButton: {
    width: 80,
    height: 80,
    borderRadius: radii.lg,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.20,
    shadowRadius: 12,
    elevation: 3,
    zIndex: 1,
  },
  stopIcon: {
    width: 24,
    height: 24,
    borderRadius: 3,
    backgroundColor: colors.card,
  },
  micHint: {
    ...typography.caption,
    color: colors.textMuted,
  },
  errorHint: {
    ...typography.caption,
    color: colors.accent,
    fontWeight: '500',
  },
  // ─── Live Transcript ──────────────────
  transcriptScroll: {
    maxHeight: 120,
    width: '100%',
    paddingHorizontal: spacing(5),
  },
  transcriptContent: {
    paddingVertical: spacing(2),
  },
  liveTranscript: {
    fontSize: 15,
    fontWeight: '400',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 22,
  },
  transcriptPlaceholder: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
