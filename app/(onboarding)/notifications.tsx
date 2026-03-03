import { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radii } from '@/constants/theme';
import { profilesService } from '@/services/profiles.service';
import PrimaryButton from '@/components/PrimaryButton';

const TIMES = [
  '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM',
  '9:00 PM', '9:30 PM', '10:00 PM',
];

const DEFAULT_TIME = '8:30 PM';

/**
 * Converts a display time like "8:30 PM" to a 24-hour string
 * like "20:30" that the database expects.
 *
 * Why? Databases prefer 24-hour format because it's unambiguous
 * and sorts correctly. "8:30 PM" is nice for humans but messy
 * for computers (is "12:00 PM" noon or midnight?).
 */
function to24Hour(displayTime: string): string {
  const [timePart, period] = displayTime.split(' ');
  const [hourStr, minute] = timePart.split(':');
  let hour = parseInt(hourStr, 10);
  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;
  return `${hour.toString().padStart(2, '0')}:${minute}`;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedTime, setSelectedTime] = useState(DEFAULT_TIME);
  const [isLoading, setIsLoading] = useState(false);

  const goNext = () => router.push('/(onboarding)/first-recording');

  // Save the selected time to the user's profile in Supabase,
  // then move on. If the save fails, we still navigate forward —
  // they can change this later in Settings.
  const handleSetReminder = async () => {
    setIsLoading(true);
    try {
      await profilesService.updateNotificationPrefs({
        notification_enabled: true,
        notification_time: to24Hour(selectedTime),
      });
    } catch (error) {
      // Non-blocking — the user can set this later in Settings.
      // We just log it and move on.
      console.warn('Failed to save notification prefs:', error);
    } finally {
      setIsLoading(false);
      goNext();
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="notifications" size={36} color={colors.glow} />
        </View>

        <Text style={styles.heading}>A gentle nudge at bedtime.</Text>

        <View style={styles.timeList}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {TIMES.map((time) => {
              const isSelected = time === selectedTime;
              return (
                <Pressable
                  key={time}
                  onPress={() => setSelectedTime(time)}
                  style={[styles.timeRow, isSelected && styles.timeRowSelected]}
                >
                  <Text style={[styles.timeText, isSelected && styles.timeTextSelected]}>
                    {time}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark" size={18} color={colors.accent} />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + spacing(12) }]}>
        <PrimaryButton
          label={isLoading ? 'Saving...' : 'Set reminder'}
          onPress={handleSetReminder}
          disabled={isLoading}
        />
        <Pressable onPress={goNext} disabled={isLoading}>
          <Text style={styles.skipLink}>Not now</Text>
        </Pressable>
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
    backgroundColor: colors.glowGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing(6),
  },
  heading: {
    ...typography.sectionHeading,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing(6),
  },
  timeList: {
    width: '100%',
    maxHeight: 280,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing(2),
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing(3),
    paddingHorizontal: spacing(4),
    borderRadius: radii.md,
  },
  timeRowSelected: {
    backgroundColor: colors.accentSoft,
  },
  timeText: {
    ...typography.formLabel,
    color: colors.textSoft,
  },
  timeTextSelected: {
    color: colors.accent,
    fontWeight: '600',
  },
  bottom: {
    gap: spacing(4),
    alignItems: 'center',
    paddingBottom: spacing(12),
  },
  skipLink: {
    ...typography.formLabel,
    color: colors.textMuted,
  },
});
