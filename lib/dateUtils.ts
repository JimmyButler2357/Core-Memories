// Shared date/time formatting utilities.
//
// These were previously duplicated across 4+ screens.
// Centralizing them means any locale or format changes
// only need to happen in one place.

import { captureException } from '@/lib/sentry';

// Birthday and entry_date come from Postgres DATE columns and are
// expected to be plain YYYY-MM-DD. Anything else means upstream data
// corruption — guard so we don't propagate NaN into the UI.
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isValidDateString(value: string): boolean {
  return typeof value === 'string' && ISO_DATE_RE.test(value);
}

// Dedupe Sentry sends — the same bad value would otherwise log on
// every render (the entry-detail screen re-renders ~2x/sec during
// audio playback).
const _reportedBadDates = new Set<string>();

function reportBadDate(fn: string, field: string, value: unknown) {
  const key = `${fn}:${field}:${String(value)}`;
  if (_reportedBadDates.has(key)) return;
  _reportedBadDates.add(key);
  captureException(new Error(`${fn}: invalid ${field}`), {
    extra: { fn, field, value },
  });
}

/**
 * Format a date for display.
 * 'short' → "Mon, Jan 5" (cards, lists)
 * 'long'  → "Jan 5, 2026" (entry detail — no weekday, includes year)
 */
export function formatDate(
  iso: string,
  variant: 'short' | 'long' = 'short',
): string {
  const d = new Date(iso);
  if (variant === 'long') {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

/**
 * Format a time for display: "3:42 PM".
 */
export function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

/**
 * Format a duration in seconds to "m:ss".
 * Accepts either seconds or milliseconds (pass ms=true).
 */
export function formatDuration(value: number, ms = false): string {
  const totalSeconds = ms ? Math.floor(value / 1000) : Math.floor(value);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

/**
 * Calculate a child's age relative to a reference date.
 * Returns a compact string like "2y 3m", "8m", or "1y".
 */
export function getAge(birthday: string, referenceDate?: string): string {
  if (!isValidDateString(birthday)) {
    reportBadDate('getAge', 'birthday', birthday);
    return '';
  }
  if (referenceDate && !isValidDateString(referenceDate)) {
    reportBadDate('getAge', 'referenceDate', referenceDate);
    return '';
  }
  const [by, bm, bd] = birthday.split('-').map(Number);
  const b = new Date(by, bm - 1, bd);
  const d = referenceDate
    ? (() => { const [ry, rm, rd] = referenceDate.split('-').map(Number); return new Date(ry, rm - 1, rd); })()
    : new Date();
  // Future birthday (bad data) — show "newborn" as a safe fallback
  if (b > d) return 'newborn';

  let years = d.getFullYear() - b.getFullYear();
  let months = d.getMonth() - b.getMonth();
  if (months < 0) {
    years--;
    months += 12;
  }
  if (years < 1) return `${months}mo`;
  if (months === 0) return `${years}y`;
  return `${years}y ${months}m`;
}

/**
 * Convert a 12-hour display string like "8:30 PM" to 24-hour format "20:30".
 * The database stores times in 24-hour format, but the UI shows 12-hour.
 */
export function to24Hour(display: string): string {
  const [timePart, period] = display.split(' ');
  const [hourStr, minute] = timePart.split(':');
  let hour = parseInt(hourStr, 10);

  if (period === 'AM' && hour === 12) hour = 0;
  else if (period === 'PM' && hour !== 12) hour += 12;

  return `${String(hour).padStart(2, '0')}:${minute}`;
}

/**
 * Convert a 24-hour string like "20:30" back to 12-hour display "8:30 PM".
 */
export function from24Hour(time24: string): string {
  const [hourStr, minute] = time24.split(':');
  let hour = parseInt(hourStr, 10);
  const period = hour >= 12 ? 'PM' : 'AM';

  if (hour === 0) hour = 12;
  else if (hour > 12) hour -= 12;

  return `${hour}:${minute} ${period}`;
}

/**
 * Return how many days ago a given ISO date string was.
 * Returns 0 if the date is today or in the future.
 */
export function daysAgo(iso: string): number {
  const then = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

/**
 * Calculate a child's age in months (for prompt filtering).
 */
export function ageInMonths(birthday: string): number {
  const [by, bm] = birthday.split('-').map(Number);
  const b = new Date(by, bm - 1, 1);
  const now = new Date();
  return Math.max(0, (now.getFullYear() - b.getFullYear()) * 12 + (now.getMonth() - b.getMonth()));
}

/**
 * Total age in months on a specific reference date (typically an entry's date).
 * Mirrors the year/month math in `getAge`, but returns a number for range comparisons.
 * Reference < birthday returns 0 (treats future dates as newborn).
 */
export function ageInMonthsAt(birthday: string, referenceDate: string): number {
  if (!isValidDateString(birthday)) {
    reportBadDate('ageInMonthsAt', 'birthday', birthday);
    return 0;
  }
  if (!isValidDateString(referenceDate)) {
    reportBadDate('ageInMonthsAt', 'referenceDate', referenceDate);
    return 0;
  }
  const [by, bm, bd] = birthday.split('-').map(Number);
  const [ry, rm, rd] = referenceDate.split('-').map(Number);
  const b = new Date(by, bm - 1, bd);
  const d = new Date(ry, rm - 1, rd);
  if (b > d) return 0;
  let years = d.getFullYear() - b.getFullYear();
  let months = d.getMonth() - b.getMonth();
  if (d.getDate() < b.getDate()) months--;
  if (months < 0) {
    years--;
    months += 12;
  }
  return years * 12 + months;
}
