// Shared entry helpers — used by home, core-memories, and settings.
//
// Previously duplicated across screens. Centralizing means
// EntryCard format changes only need to happen once.

import type { Entry } from '@/stores/entriesStore';
import type { Child } from '@/stores/childrenStore';
import { childColors, colors } from '@/constants/theme';
import { formatDate, formatTime } from '@/lib/dateUtils';

/** Build a lookup map from child array for O(1) access by ID. */
export function buildChildMap(children: Child[]): Record<string, Child> {
  const map: Record<string, Child> = {};
  children.forEach((c) => (map[c.id] = c));
  return map;
}

/** Map an Entry to the shape EntryCard expects. */
export function entryToCard(
  entry: Entry,
  childMap: Record<string, Child>,
  dateWeekday: 'short' | 'long' = 'short',
) {
  const childNames = entry.childIds.map((id) => childMap[id]?.name ?? 'Unknown');
  const entryChildColors = entry.childIds.map(
    (id) => childColors[childMap[id]?.colorIndex ?? 0]?.hex ?? colors.textMuted,
  );
  return {
    childNames,
    childColors: entryChildColors,
    date: formatDate(entry.date, dateWeekday),
    time: formatTime(entry.date),
    preview: entry.text,
    tags: entry.tags,
    isFavorited: entry.isFavorited,
    hasAudio: entry.hasAudio,
  };
}
