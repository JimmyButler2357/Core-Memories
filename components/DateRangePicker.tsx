import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import {
  colors,
  typography,
  spacing,
  radii,
} from '@/constants/theme';
import { DATE_RANGES } from '@/hooks/useSearchFilter';

interface DateRangePickerProps {
  activeIndex: number | null;
  onSelect: (index: number) => void;
}

export default function DateRangePicker({ activeIndex, onSelect }: DateRangePickerProps) {
  return (
    <View style={styles.row}>
      {DATE_RANGES.map((range, i) => {
        const isActive = activeIndex === i;
        return (
          <Pressable
            key={range.label}
            onPress={() => onSelect(i)}
            style={[
              styles.option,
              isActive && styles.optionActive,
            ]}
          >
            <Text
              style={[
                styles.label,
                isActive && styles.labelActive,
              ]}
            >
              {range.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: spacing(5),
    paddingBottom: spacing(3),
    gap: spacing(2),
    flexWrap: 'wrap',
  },
  option: {
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(3),
    borderRadius: radii.sm,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionActive: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  label: {
    ...typography.caption,
    color: colors.textSoft,
  },
  labelActive: {
    color: colors.accent,
    fontWeight: '700',
  },
});
