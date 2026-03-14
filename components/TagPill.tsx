import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, typography, radii, hitSlop } from '@/constants/theme';

interface TagPillProps {
  label: string;
  onRemove?: () => void;
  /** Use 'muted' for footnote-style tags (smaller, lighter) */
  variant?: 'default' | 'muted';
}

/**
 * Small tag pill for entry metadata.
 * Uniform treatment — no color-coding by tag type.
 *
 * 'default' = standard tag styling (used on home cards, search).
 * 'muted'   = smaller, lighter pills for footnote-style display
 *             (used at the bottom of the Story Flow entry detail).
 */
export default function TagPill({ label, onRemove, variant = 'default' }: TagPillProps) {
  const isMuted = variant === 'muted';
  return (
    <View style={[styles.pill, isMuted && styles.pillMuted]}>
      <Text style={[styles.label, isMuted && styles.labelMuted]}>{label}</Text>
      {onRemove && (
        <Pressable onPress={onRemove} hitSlop={hitSlop.icon}>
          <Text style={styles.removeIcon}>×</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.tag,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: radii.sm,
    gap: 4,
  },
  pillMuted: {
    backgroundColor: 'rgba(243,237,232,0.6)',
    paddingVertical: 2,
    paddingHorizontal: 7,
  },
  label: {
    ...typography.tag,
    color: colors.textSoft,
  },
  labelMuted: {
    fontSize: 10,
    color: colors.textMuted,
  },
  removeIcon: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
});
