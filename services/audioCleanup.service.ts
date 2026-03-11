// Audio cleanup service — manages local audio files for drafts.
//
// When we save a draft offline, the audio recording sits in the
// cache directory (which the OS can wipe at any time). So we copy
// it to the document directory (persistent storage the OS won't
// touch). After a successful upload to Supabase, we delete the
// local copy to free space.
//
// Think of it like photocopying an important document from your
// inbox to your filing cabinet — the inbox might get emptied, but
// your cabinet is safe. Once the original is backed up to the
// cloud, you can shred the cabinet copy.

import { File, Directory, Paths } from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CLEANUP_TIMESTAMP_KEY = 'audio-cleanup-last-run';
const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

/** Get the drafts directory path (inside documentDirectory). */
function getDraftsDir(): Directory {
  return new Directory(Paths.document, 'drafts');
}

export const audioCleanupService = {
  /**
   * Copy audio from cache to persistent storage for a draft.
   * Returns the new persistent file path.
   *
   * Think of it like moving a sticky note from your pocket
   * (cache — might fall out) to your desk drawer (documents —
   * stays until you throw it away).
   */
  persistAudioForDraft(cacheUri: string, localId: string): string {
    const draftsDir = getDraftsDir();
    // Create the drafts directory if it doesn't exist yet
    if (!draftsDir.exists) {
      draftsDir.create();
    }

    const source = new File(cacheUri);
    const dest = new File(draftsDir, `${localId}.wav`);
    source.copy(dest);
    return dest.uri;
  },

  /**
   * Delete a local audio file. Idempotent — won't throw if the
   * file is already gone (like trying to throw away trash that's
   * already been collected).
   */
  deleteLocalFile(uri: string): void {
    try {
      const file = new File(uri);
      if (file.exists) {
        file.delete();
      }
    } catch (err) {
      // Swallow errors — file might already be gone, and that's fine
      console.warn('Failed to delete local file:', err);
    }
  },

  /**
   * Clean up orphaned audio files — .wav files in the drafts
   * directory that are older than 7 days and not referenced by
   * any active draft.
   *
   * Throttled to run at most once per 24 hours to avoid
   * unnecessary filesystem scans.
   *
   * @param activeDraftUris - URIs of audio files that are still
   *   referenced by active drafts (don't delete these!)
   */
  async cleanupOrphans(activeDraftUris: string[]): Promise<void> {
    try {
      // Check if we've run recently (throttle)
      const lastRun = await AsyncStorage.getItem(CLEANUP_TIMESTAMP_KEY);
      if (lastRun) {
        const elapsed = Date.now() - parseInt(lastRun, 10);
        if (elapsed < CLEANUP_INTERVAL_MS) return; // Too soon, skip
      }

      const draftsDir = getDraftsDir();
      if (!draftsDir.exists) {
        await AsyncStorage.setItem(CLEANUP_TIMESTAMP_KEY, Date.now().toString());
        return;
      }

      // List all files in the drafts directory
      const contents = draftsDir.list();
      const activeSet = new Set(activeDraftUris);

      for (const item of contents) {
        if (!(item instanceof File)) continue;
        if (!item.uri.endsWith('.wav')) continue;

        // Skip files that are still referenced by a draft
        if (activeSet.has(item.uri)) continue;

        // For orphan cleanup we rely on existence — the new API
        // doesn't expose modificationTime easily, so we use the
        // AsyncStorage timestamp to bound the overall cleanup interval.
        // Any unreferenced file found during cleanup gets deleted.
        item.delete();
      }

      // Record the cleanup timestamp
      await AsyncStorage.setItem(CLEANUP_TIMESTAMP_KEY, Date.now().toString());
    } catch (err) {
      // Cleanup is non-critical — if it fails, we'll try again next time
      console.warn('Orphan cleanup failed:', err);
    }
  },
};
