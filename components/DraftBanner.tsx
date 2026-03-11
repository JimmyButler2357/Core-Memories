// Draft banner — shows above the timeline on Home when offline
// drafts exist. Tells the user how many memories are waiting
// to sync, and updates the count as they're processed.
//
// Think of it like the "unsent messages" bar in a chat app —
// it reassures you that your messages are safe and will be
// delivered as soon as possible.

import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radii } from '@/constants/theme';
import type { DraftEntry } from '@/stores/draftStore';

interface DraftBannerProps {
  drafts: DraftEntry[];
}

export default function DraftBanner({ drafts }: DraftBannerProps) {
  const syncingCount = drafts.filter((d) => d.status === 'syncing').length;
  const total = drafts.length;

  return (
    <View style={styles.banner}>
      <Ionicons name="cloud-upload-outline" size={16} color={colors.warning} />
      <Text style={styles.text}>
        {syncingCount > 0
          ? `Syncing ${syncingCount} of ${total}...`
          : `${total} ${total === 1 ? 'memory' : 'memories'} waiting to sync`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
    marginHorizontal: spacing(5),
    marginBottom: spacing(3),
    padding: spacing(4),
    backgroundColor: colors.warningSoft,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  text: {
    ...typography.formLabel,
    color: colors.text,
    flex: 1,
  },
});
