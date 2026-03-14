import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@/constants/theme';
import TopBar from '@/components/TopBar';

export default function ContactScreen() {
  return (
    <View style={styles.container}>
      <TopBar title="Contact Us" showBack />
      <View style={styles.content}>
        <Ionicons name="mail-outline" size={48} color={colors.textMuted} />
        <Text style={styles.heading}>Coming Soon</Text>
        <Text style={styles.body}>
          We'd love to hear from you. Contact options are on their way.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing(3),
    paddingHorizontal: spacing(8),
  },
  heading: {
    ...typography.sectionHeading,
    color: colors.text,
  },
  body: {
    ...typography.formLabel,
    color: colors.textSoft,
    textAlign: 'center',
    lineHeight: 21,
  },
});
