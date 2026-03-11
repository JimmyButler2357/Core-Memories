/**
 * Text quality utilities for checking whether a transcript has
 * enough meaningful content to save as a journal entry.
 *
 * Think of it like a bouncer at the door — if someone walks up
 * and just says "um, like, yeah," that's not really a memory.
 * But "Emma said her first word today" absolutely is.
 *
 * Keep in sync with supabase/functions/process-entry/index.ts
 */

/**
 * Words that don't count toward the "meaningful" threshold.
 * Filler words, articles, conjunctions, and common speech-to-text
 * noise — the verbal equivalent of white space.
 */
const FILLER_WORDS = new Set([
  'um', 'uh', 'uh-huh', 'like', 'you', 'know', 'so', 'basically',
  'mean', 'kind', 'of', 'sort', 'well', 'oh', 'yeah', 'ok', 'okay',
]);

/** Minimum number of meaningful words for an entry to be worth saving. */
const MIN_MEANINGFUL_WORDS = 3;

/**
 * Count how many "meaningful" words are in a piece of text.
 *
 * Strips punctuation before checking so "okay!" still matches
 * "okay" in the filler list. Numbers and symbols become empty
 * strings after stripping, so pure-number inputs like "2 or 3"
 * won't count the digits as meaningful.
 *
 * Examples:
 *   "um like yeah"                → 0 meaningful words
 *   "2 or 3"                      → 0 meaningful words
 *   "Emma said her first word"    → 4 meaningful words
 */
export function countMeaningfulWords(text: string): number {
  return text
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 0 && !FILLER_WORDS.has(w.replace(/[^a-z]/g, '')))
    .length;
}

/**
 * Returns true if the text has enough meaningful content to
 * save as a journal entry (currently 3+ meaningful words).
 */
export function hasEnoughContent(text: string): boolean {
  return countMeaningfulWords(text) >= MIN_MEANINGFUL_WORDS;
}

/**
 * Convert a display string to a URL-safe slug.
 *
 * "Emma's Laugh" → "emmas-laugh"
 *
 * Used for tag normalization — both the service layer (createTag)
 * and the UI (tag resolution) must produce the same slug for
 * the same input, so this is the single source of truth.
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
