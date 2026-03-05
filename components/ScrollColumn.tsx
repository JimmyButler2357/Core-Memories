import { useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { colors, fonts, radii } from '@/constants/theme';

export const ROW_HEIGHT = 40;
export const VISIBLE_ROWS = 3;
export const COLUMN_HEIGHT = ROW_HEIGHT * VISIBLE_ROWS;

export interface ScrollColumnProps {
  items: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

export default function ScrollColumn({ items, selectedIndex, onSelect }: ScrollColumnProps) {
  const scrollRef = useRef<ScrollView>(null);

  const handleScrollEnd = useCallback((e: any) => {
    const offsetY = e.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ROW_HEIGHT);
    const clamped = Math.max(0, Math.min(index, items.length - 1));
    onSelect(clamped);
  }, [items.length, onSelect]);

  const handleLayout = useCallback(() => {
    scrollRef.current?.scrollTo({ y: selectedIndex * ROW_HEIGHT, animated: false });
  }, [selectedIndex]);

  return (
    <View style={styles.wrapper}>
      <View style={styles.highlightBand} />
      <View style={styles.fadeTop} />
      <View style={styles.fadeBottom} />
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ROW_HEIGHT}
        decelerationRate="fast"
        nestedScrollEnabled
        onLayout={handleLayout}
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={handleScrollEnd}
        contentContainerStyle={{ paddingVertical: ROW_HEIGHT }}
      >
        {items.map((item, i) => {
          const isSelected = i === selectedIndex;
          return (
            <Pressable
              key={i}
              onPress={() => {
                onSelect(i);
                scrollRef.current?.scrollTo({ y: i * ROW_HEIGHT, animated: true });
              }}
              style={styles.row}
            >
              <Text style={isSelected ? styles.selectedText : styles.unselectedText}>
                {item}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    height: COLUMN_HEIGHT,
    overflow: 'hidden',
    position: 'relative',
  },
  highlightBand: {
    position: 'absolute',
    top: ROW_HEIGHT,
    left: 0,
    right: 0,
    height: ROW_HEIGHT,
    backgroundColor: colors.accentSoft,
    borderRadius: radii.sm,
    zIndex: 0,
  },
  fadeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 36,
    zIndex: 2,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  fadeBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 36,
    zIndex: 2,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  row: {
    height: ROW_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedText: {
    fontFamily: fonts.serif,
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  unselectedText: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textMuted,
  },
});
