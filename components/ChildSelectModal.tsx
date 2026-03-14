import { useState, useEffect } from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  colors,
  typography,
  radii,
  shadows,
  spacing,
  childColors,
  childColorWithOpacity,
} from '@/constants/theme';
import type { Child } from '@/stores/childrenStore';

interface ChildSelectModalProps {
  visible: boolean;
  /** All children in the family */
  familyChildren: Child[];
  /** Called when the user presses Continue with their selection */
  onConfirm: (selectedChildIds: string[]) => void;
}

/**
 * Full-screen modal that asks "Who is this memory about?"
 *
 * Shows when the app can't auto-detect which child a recording
 * is about (e.g. a "whole family" voice note that doesn't mention
 * any child by name). The user must pick at least one child
 * before they can continue to the entry detail screen.
 *
 * Think of it like a bouncer at a door — you can't get into
 * the entry until you've told the app who the memory belongs to.
 */
export default function ChildSelectModal({
  visible,
  familyChildren,
  onConfirm,
}: ChildSelectModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Reset selection each time the modal opens so it's always fresh
  useEffect(() => {
    if (visible) setSelectedIds(new Set());
  }, [visible]);

  const toggleChild = (childId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(childId)) {
        next.delete(childId);
      } else {
        next.add(childId);
      }
      return next;
    });
  };

  const hasSelection = selectedIds.size > 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => {}}>
      <View style={styles.overlay}>
        <View style={[styles.card, shadows.lg]}>
          <Text style={styles.title}>Who is this memory about?</Text>

          <View style={styles.pillRow}>
            {familyChildren.map((child) => {
              const isSelected = selectedIds.has(child.id);
              const hex = childColors[child.colorIndex]?.hex ?? childColors[0].hex;
              return (
                <Pressable
                  key={child.id}
                  onPress={() => toggleChild(child.id)}
                  style={[
                    styles.pill,
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
                      styles.pillText,
                      { color: isSelected ? hex : colors.textMuted },
                    ]}
                  >
                    {child.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {!hasSelection && (
            <Text style={styles.hint}>Select at least one</Text>
          )}

          <Pressable
            onPress={() => {
              if (!hasSelection) return;
              onConfirm(Array.from(selectedIds));
            }}
            style={({ pressed }) => [
              styles.continueBtn,
              !hasSelection && styles.continueBtnDisabled,
              pressed && hasSelection && { opacity: 0.85 },
            ]}
          >
            <Text
              style={[
                styles.continueLabel,
                !hasSelection && styles.continueLabelDisabled,
              ]}
            >
              Continue
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.overlay,
    paddingHorizontal: spacing(5),
  },
  card: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing(6),
  },
  title: {
    ...typography.screenTitle,
    color: colors.text,
    marginBottom: spacing(4),
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing(2),
    marginBottom: spacing(4),
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(1),
    paddingVertical: spacing(3),
    paddingHorizontal: spacing(4),
    borderRadius: radii.full,
    borderWidth: 1.5,
    minHeight: 44,
  },
  pillText: {
    ...typography.pillLabel,
  },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing(4),
  },
  continueBtn: {
    width: '100%',
    paddingVertical: spacing(3),
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  continueBtnDisabled: {
    opacity: 0.4,
  },
  continueLabel: {
    ...typography.buttonLabel,
    color: colors.card,
  },
  continueLabelDisabled: {
    color: colors.textMuted,
  },
});
