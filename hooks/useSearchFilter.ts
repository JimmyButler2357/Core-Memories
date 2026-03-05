import { useState, useMemo, useCallback } from 'react';
import type { Entry } from '@/stores/entriesStore';

// ─── Date Range Presets ──────────────────────────────────

export const DATE_RANGES = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 3 months', days: 90 },
  { label: 'All time', days: null },
] as const;

// ─── Helpers ─────────────────────────────────────────────

/** Collect all unique tags from non-deleted entries, sorted alphabetically */
export function collectTags(entries: Entry[]): string[] {
  const tagSet = new Set<string>();
  entries.forEach((e) => {
    if (!e.isDeleted) {
      e.tags.forEach((t) => tagSet.add(t));
    }
  });
  return Array.from(tagSet).sort();
}

// ─── Hook ────────────────────────────────────────────────

export function useSearchFilter() {
  const [query, setQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dateRangeIndex, setDateRangeIndex] = useState<number | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const hasActiveFilters = useMemo(
    () => query.trim().length > 0 || selectedTags.length > 0 || dateRangeIndex !== null,
    [query, selectedTags, dateRangeIndex],
  );

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }, []);

  const toggleDateRange = useCallback((index: number) => {
    setDateRangeIndex((prev) => (prev === index ? null : index));
    setShowDatePicker(false);
  }, []);

  const clearAll = useCallback(() => {
    setQuery('');
    setSelectedTags([]);
    setDateRangeIndex(null);
    setShowDatePicker(false);
  }, []);

  /** Apply tag, date range, and text filters to an entry array */
  const filterEntries = useCallback(
    (entries: Entry[]): Entry[] => {
      let filtered = entries;

      // Filter by selected tags (OR logic)
      if (selectedTags.length > 0) {
        filtered = filtered.filter((e) =>
          e.tags.some((t) => selectedTags.includes(t)),
        );
      }

      // Filter by date range
      if (dateRangeIndex !== null) {
        const range = DATE_RANGES[dateRangeIndex];
        if (range.days !== null) {
          const cutoff = new Date();
          cutoff.setDate(cutoff.getDate() - range.days);
          filtered = filtered.filter((e) => new Date(e.date) >= cutoff);
        }
      }

      // Filter by text query (case-insensitive substring, searches title + transcript)
      const trimmed = query.trim().toLowerCase();
      if (trimmed) {
        filtered = filtered.filter((e) =>
          e.text.toLowerCase().includes(trimmed) ||
          (e.title?.toLowerCase().includes(trimmed) ?? false),
        );
      }

      return filtered;
    },
    [selectedTags, dateRangeIndex, query],
  );

  return {
    query,
    setQuery,
    selectedTags,
    toggleTag,
    dateRangeIndex,
    toggleDateRange,
    showDatePicker,
    setShowDatePicker,
    hasActiveFilters,
    clearAll,
    filterEntries,
  };
}
