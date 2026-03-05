// Auto-detection — scans a transcript to figure out which
// children and tags are mentioned.
//
// These are "pure functions" — they don't call the database
// or change any state. You give them the transcript text and
// a list of things to look for, and they return the matches.
//
// Think of it like a word search puzzle: the transcript is
// the grid, and we're checking which names and keywords
// appear somewhere inside it.

import type { Child } from '@/stores/childrenStore';
import { entriesService } from '@/services/entries.service';
import { tagsService } from '@/services/tags.service';

// ─── Tag Shape ────────────────────────────────────────────
// This matches the tag rows from Supabase. We only need
// id and slug for matching.

interface TagForDetection {
  id: string;
  slug: string;
  name: string;
}

// ─── Child Detection ──────────────────────────────────────
//
// Scans the transcript for child names and nicknames.
// Case-insensitive — "emma", "Emma", and "EMMA" all match.
//
// We use "word boundary" matching so "Em" doesn't match
// inside "remember." A word boundary means the name must
// appear as its own word, not as part of another word.
//
// Returns the IDs of all matched children (no duplicates).

export function detectChildren(
  transcript: string,
  children: Child[],
): string[] {
  if (!transcript.trim()) return [];

  const lower = transcript.toLowerCase();
  const matched = new Set<string>();

  for (const child of children) {
    // Build a list of names to search for:
    // the full name, plus the nickname if they have one
    const names = [child.name];
    if (child.nickname) names.push(child.nickname);

    for (const name of names) {
      if (!name.trim()) continue;

      // Escape special regex characters in the name
      // (in case someone names their kid "A.J." or similar)
      const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      // \b = word boundary — ensures "Em" doesn't match "remember"
      const pattern = new RegExp(`\\b${escaped}\\b`, 'i');

      if (pattern.test(transcript)) {
        matched.add(child.id);
        break; // Already matched this child, no need to check nickname
      }
    }
  }

  return Array.from(matched);
}

// ─── Tag Detection ────────────────────────────────────────
//
// Scans the transcript for tag keywords. Each tag has a
// "slug" (like "funny", "milestone", "first-time") which
// we use as the search term.
//
// For multi-word slugs (like "first-time"), we search for
// the slug with hyphens replaced by spaces ("first time")
// since that's how people naturally speak.
//
// Returns the IDs of all matched tags (no duplicates).

// Some tags map to multiple spoken phrases. For example,
// the "humor" tag should match "funny", "hilarious",
// "laughing", etc. This map expands each slug into
// additional keywords to search for.
const TAG_SYNONYMS: Record<string, string[]> = {
  humor: ['funny', 'hilarious', 'laughing', 'laugh', 'giggle', 'silly', 'joke', 'cracked up'],
  milestone: ['first time', 'first ever', 'brand new', 'never before', 'big moment'],
  first: ['first time', 'first ever', 'for the first'],
  sweet: ['adorable', 'precious', 'tender', 'heartwarming', 'touching'],
  bedtime: ['bed time', 'sleep', 'sleeping', 'nap', 'napping', 'goodnight', 'tucked in'],
  outing: ['went to', 'trip to', 'visited', 'park', 'playground', 'zoo', 'museum'],
  words: ['said', 'word', 'talking', 'spoke', 'sentence', 'vocabulary', 'new word'],
  siblings: ['brother', 'sister', 'sibling', 'together', 'each other', 'playing together'],
};

export function detectTags(
  transcript: string,
  tags: TagForDetection[],
): string[] {
  if (!transcript.trim()) return [];

  const lower = transcript.toLowerCase();
  const matched = new Set<string>();

  for (const tag of tags) {
    // Build the list of keywords to search for:
    // 1. The slug itself (e.g. "funny")
    // 2. The slug with hyphens → spaces (e.g. "first-time" → "first time")
    // 3. The tag name (e.g. "Humor")
    // 4. Any synonyms from our map
    const keywords = [
      tag.slug,
      tag.slug.replace(/-/g, ' '),
      tag.name.toLowerCase(),
      ...(TAG_SYNONYMS[tag.slug] ?? []),
    ];

    // Deduplicate keywords
    const unique = [...new Set(keywords)];

    for (const keyword of unique) {
      if (!keyword.trim()) continue;

      // For multi-word keywords, just check if the phrase appears
      // For single words, use word boundaries to avoid partial matches
      if (keyword.includes(' ')) {
        if (lower.includes(keyword)) {
          matched.add(tag.id);
          break;
        }
      } else {
        const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const pattern = new RegExp(`\\b${escaped}\\b`, 'i');
        if (pattern.test(transcript)) {
          matched.add(tag.id);
          break;
        }
      }
    }
  }

  return Array.from(matched);
}

// ─── Build Contextual Strings ────────────────────────────
//
// Creates an array of "hint" strings to give the speech engine
// so it's more likely to recognize unusual names correctly.
//
// Think of it like writing the names on a whiteboard before a
// meeting — the transcriber can glance at it and know what to
// listen for.

export function buildContextualStrings(children: Child[]): string[] {
  const hints: string[] = [];
  for (const child of children) {
    hints.push(child.name);
    if (child.nickname) hints.push(child.nickname);
  }
  return hints;
}

// ─── Refresh Detection ───────────────────────────────────
//
// Re-runs auto-detection on an edited transcript and updates
// the database. Think of it like "re-running the label maker."
//
// Only touches auto-detected/auto-applied rows — any children
// or tags the user manually added are preserved.
//
// Detection failure is non-critical. If this throws, the
// transcript was already saved successfully. Callers should
// catch and warn.

export async function refreshDetection(
  entryId: string,
  transcript: string,
  allChildren: Child[],
): Promise<void> {
  // Step 1: Detect children from transcript
  let detectedChildIds = detectChildren(transcript, allChildren);

  // Fallback: single-child family — auto-assign (no ambiguity).
  // Multi-child family with no detection — keep existing children
  // rather than silently guessing the first child.
  if (detectedChildIds.length === 0 && allChildren.length === 1) {
    detectedChildIds = [allChildren[0].id];
  } else if (detectedChildIds.length === 0 && allChildren.length > 1) {
    return;
  }

  // Step 2: Detect tags from transcript
  // Fetch the system tags list for keyword matching
  const systemTags = await tagsService.getSystemTags();
  const detectedTagIds = detectTags(transcript, systemTags);

  // Step 3: Update the database — both calls are independent,
  // so we run them in parallel (saves ~100-200ms).
  await Promise.all([
    entriesService.refreshAutoChildren(entryId, detectedChildIds),
    entriesService.refreshAutoTags(entryId, detectedTagIds),
  ]);
}
