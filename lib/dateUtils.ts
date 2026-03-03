// Shared date/time formatting utilities.
//
// These were previously duplicated across 4+ screens.
// Centralizing them means any locale or format changes
// only need to happen in one place.

/**
 * Format a date for display in cards and lists.
 * "Mon, Jan 5" (short) or "Monday, Jan 5" (long).
 */
export function formatDate(
  iso: string,
  weekday: 'short' | 'long' = 'short',
): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { weekday, month: 'short', day: 'numeric' });
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
  const b = new Date(birthday);
  const d = referenceDate ? new Date(referenceDate) : new Date();
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
 * Calculate a child's age in months (for prompt filtering).
 */
export function ageInMonths(birthday: string): number {
  const b = new Date(birthday);
  const now = new Date();
  return (now.getFullYear() - b.getFullYear()) * 12 + (now.getMonth() - b.getMonth());
}
