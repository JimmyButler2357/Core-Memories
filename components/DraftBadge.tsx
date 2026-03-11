// Draft badge — shows sync status on an EntryCard for offline drafts.
//
// Three states:
// - pending: amber dot + "Waiting to sync" (draft is queued)
// - syncing: spinner + "Syncing..." (actively uploading)
// - failed:  red dot + "Tap to retry" (something went wrong)
//
// Think of it like a status light on a printer: amber = warming up,
// spinning = printing, red = paper jam (tap to clear).

import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import { colors, childColorWithOpacity, typography, spacing, radii } from '@/constants/theme';
import type { DraftStatus } from '@/stores/draftStore';

interface DraftBadgeProps {
  status: DraftStatus;
}

export default function DraftBadge({ status }: DraftBadgeProps) {
  return (
    <View style={[styles.badge, statusStyles[status]]}>
      {status === 'syncing' ? (
        <ActivityIndicator size={8} color={colors.accent} />
      ) : (
        <View style={[styles.dot, dotStyles[status]]} />
      )}
      <Text style={[styles.label, labelStyles[status]]}>
        {statusLabels[status]}
      </Text>
    </View>
  );
}

const statusLabels: Record<DraftStatus, string> = {
  pending: 'Waiting to sync',
  syncing: 'Syncing...',
  failed: 'Tap to retry',
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1),
    paddingVertical: 2,
    paddingHorizontal: spacing(2),
    borderRadius: radii.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    ...typography.caption,
  },
});

// Status-specific styles — keeps the main StyleSheet clean
const statusStyles: Record<DraftStatus, ViewStyle> = {
  pending: { backgroundColor: colors.warningSoft },
  syncing: { backgroundColor: colors.accentSoft },
  failed: { backgroundColor: childColorWithOpacity(colors.danger, 0.08) },
};

const dotStyles: Record<DraftStatus, ViewStyle> = {
  pending: { backgroundColor: colors.warning },
  syncing: { backgroundColor: colors.accent },
  failed: { backgroundColor: colors.danger },
};

const labelStyles: Record<DraftStatus, TextStyle> = {
  pending: { color: colors.warning },
  syncing: { color: colors.accent },
  failed: { color: colors.danger },
};
