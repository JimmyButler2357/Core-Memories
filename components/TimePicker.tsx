import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, spacing } from '@/constants/theme';
import ScrollColumn from '@/components/ScrollColumn';

// 12-hour clock: 1, 2, 3, ... 12
const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));

// 5-minute intervals: 00, 05, 10, ... 55
const MINUTES = Array.from({ length: 12 }, (_, i) =>
  String(i * 5).padStart(2, '0'),
);

const PERIODS = ['AM', 'PM'];

/**
 * Parse a 12-hour display string like "8:30 PM" into column indices.
 *
 * Think of it like reading a clock face:
 * - Hour index: which number (1–12) the hour hand points to
 * - Minute index: which 5-minute mark the minute hand is on
 * - Period index: 0 for AM (morning), 1 for PM (afternoon/evening)
 */
function parseTime(display: string): { hourIdx: number; minuteIdx: number; periodIdx: number } {
  const [timePart, period] = display.split(' ');
  const [hourStr, minuteStr] = timePart.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);

  return {
    hourIdx: hour === 12 ? 11 : hour - 1,       // "12" → index 11, "1" → index 0
    minuteIdx: Math.round(minute / 5),            // "30" → index 6
    periodIdx: period === 'PM' ? 1 : 0,
  };
}

interface TimePickerProps {
  /** Current time in 12-hour format, e.g. "8:30 PM" */
  value: string;
  /** Called whenever the user scrolls to a new time */
  onChange: (displayTime: string) => void;
}

export default function TimePicker({ value, onChange }: TimePickerProps) {
  const initial = parseTime(value);
  const [hourIdx, setHourIdx] = useState(initial.hourIdx);
  const [minuteIdx, setMinuteIdx] = useState(initial.minuteIdx);
  const [periodIdx, setPeriodIdx] = useState(initial.periodIdx);

  // Recompose the display string and notify parent
  const emitChange = (h: number, m: number, p: number) => {
    const hour = HOURS[h];
    const minute = MINUTES[m];
    const period = PERIODS[p];
    onChange(`${hour}:${minute} ${period}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.columns}>
        <View style={{ flex: 30 }}>
          <ScrollColumn
            items={HOURS}
            selectedIndex={hourIdx}
            onSelect={(i) => {
              setHourIdx(i);
              emitChange(i, minuteIdx, periodIdx);
            }}
          />
        </View>
        <View style={{ flex: 30 }}>
          <ScrollColumn
            items={MINUTES}
            selectedIndex={minuteIdx}
            onSelect={(i) => {
              setMinuteIdx(i);
              emitChange(hourIdx, i, periodIdx);
            }}
          />
        </View>
        <View style={{ flex: 25 }}>
          <ScrollColumn
            items={PERIODS}
            selectedIndex={periodIdx}
            onSelect={(i) => {
              setPeriodIdx(i);
              emitChange(hourIdx, minuteIdx, i);
            }}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing(3),
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  columns: {
    flexDirection: 'row',
    gap: spacing(2),
  },
});
