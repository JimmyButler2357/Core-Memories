import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { colors, typography, spacing, radii } from '@/constants/theme';
import PrimaryButton from '@/components/PrimaryButton';

/**
 * Mic Permission — onboarding step 3.
 *
 * This screen asks the OS for microphone access using
 * Audio.requestPermissionsAsync(). This triggers the native
 * iOS/Android permission dialog ("Allow [app] to access the
 * microphone?").
 *
 * We navigate forward regardless of whether they grant or deny —
 * the app works with text-only entries too. But if they deny,
 * we show a "voice-first" card explaining why the mic matters.
 */
export default function MicPermissionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [showSkipCard, setShowSkipCard] = useState(false);

  const goNext = () => router.push('/(onboarding)/location-permission');

  // Request the actual mic permission from the OS.
  // Audio.requestPermissionsAsync() triggers the native dialog.
  // We navigate forward no matter what — mic is optional.
  const handleAllow = async () => {
    await Audio.requestPermissionsAsync();
    goNext();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="mic" size={40} color={colors.accent} />
        </View>

        <Text style={styles.heading}>Your voice tells the story best.</Text>

        <Text style={styles.body}>
          Nothing records until you say so. Just tap, talk, and the moment is saved.
        </Text>

        {showSkipCard && (
          <View style={styles.skipCard}>
            <Ionicons name="information-circle-outline" size={24} color={colors.accent} />
            <Text style={styles.skipCardHeading}>Forever Fireflies is voice-first</Text>
            <Text style={styles.skipCardBody}>
              The app is built around recording your voice — it's the fastest way to
              capture a moment. You can still type entries instead, but you'll get the
              most out of it with the microphone.
            </Text>
            <PrimaryButton
              label="Allow microphone"
              onPress={handleAllow}
            />
            <Pressable onPress={goNext}>
              <Text style={styles.skipLink}>Continue with text only</Text>
            </Pressable>
          </View>
        )}
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + spacing(12) }]}>
        {!showSkipCard && (
          <>
            <PrimaryButton
              label="Allow microphone"
              onPress={handleAllow}
            />
            <Pressable onPress={() => setShowSkipCard(true)}>
              <Text style={styles.skipLink}>Not now</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing(5),
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing(6),
  },
  heading: {
    ...typography.sectionHeading,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing(4),
  },
  body: {
    fontSize: 15,
    fontWeight: '400',
    color: colors.textSoft,
    textAlign: 'center',
    lineHeight: 22.5,
    paddingHorizontal: spacing(4),
  },
  skipCard: {
    marginTop: spacing(6),
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing(5),
    alignItems: 'center',
    gap: spacing(3),
    width: '100%',
  },
  skipCardHeading: {
    ...typography.sectionHeading,
    color: colors.text,
    textAlign: 'center',
  },
  skipCardBody: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSoft,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: spacing(1),
  },
  skipLink: {
    ...typography.formLabel,
    color: colors.textMuted,
  },
  bottom: {
    gap: spacing(4),
    alignItems: 'center',
    paddingBottom: spacing(12),
  },
});
