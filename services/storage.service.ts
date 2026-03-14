// Storage service — upload, download, and delete audio recordings.
// Files are stored in a private Supabase Storage bucket with RLS,
// so each user can only access their own audio files.
// Path pattern: {user_id}/{entry_id}.wav

import { File as ExpoFile, Paths } from 'expo-file-system';
import { supabase } from '@/lib/supabase';

const BUCKET = 'audio-recordings';

export const storageService = {
  /** Upload an audio file for an entry.
   *  Derives the user ID from the authenticated session (not caller-supplied)
   *  so storage paths can't be spoofed. */
  async uploadAudio(entryId: string, fileUri: string) {
    // Get user ID from the cached session — faster than getUser()
    // which always hits the network. RLS is the real security check.
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('Not authenticated — cannot upload audio');
    const user = session.user;

    const path = `${user.id}/${entryId}.wav`;

    // Read the local file as an ArrayBuffer via expo-file-system.
    // React Native's fetch().blob() produces malformed data that
    // Supabase Storage rejects (HTTP 400). The expo-file-system
    // File class reads local files reliably and its arrayBuffer()
    // method gives us the format Supabase accepts.
    const file = new ExpoFile(fileUri);
    const arrayBuffer = await file.arrayBuffer();

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(path, arrayBuffer, {
        contentType: 'audio/wav',
        upsert: true,  // Allow re-recording (overwrite existing file for same entry)
      });

    if (error) throw new Error(`Failed to upload audio: ${error.message}`, { cause: error });
    return data.path;
  },

  /** Get a signed URL for audio playback (valid for 1 hour).
   *  Validates the path belongs to the current user before requesting. */
  async getPlaybackUrl(storagePath: string): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('Not authenticated — cannot get playback URL');
    const user = session.user;
    if (!storagePath.startsWith(`${user.id}/`)) {
      throw new Error('Access denied — cannot access another user\'s audio');
    }

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(storagePath, 3600); // 3600 seconds = 1 hour

    if (error) throw new Error(`Failed to get playback URL: ${error.message}`, { cause: error });
    return data.signedUrl;
  },

  /** Delete an audio file.
   *  Validates the path belongs to the current user before deleting. */
  async deleteAudio(storagePath: string) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error('Not authenticated — cannot delete audio');
    const user = session.user;
    if (!storagePath.startsWith(`${user.id}/`)) {
      throw new Error('Access denied — cannot delete another user\'s audio');
    }

    const { error } = await supabase.storage
      .from(BUCKET)
      .remove([storagePath]);

    if (error) throw new Error(`Failed to delete audio: ${error.message}`, { cause: error });
  },

  /** Download an audio file to local cache for concatenation.
   *  Gets a signed URL, fetches the bytes, and writes them locally.
   *  Returns the local file URI so it can be passed to concatWavFiles(). */
  async downloadAudio(storagePath: string): Promise<string> {
    // getPlaybackUrl already validates auth + ownership
    const signedUrl = await this.getPlaybackUrl(storagePath);

    // Fetch the audio bytes from the signed URL
    const response = await fetch(signedUrl);
    if (!response.ok) {
      throw new Error(`Failed to download audio: HTTP ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();

    // Write to a temp file in cache (auto-cleaned by the OS when space is needed)
    const localFile = new ExpoFile(Paths.cache, `download_${Date.now()}.wav`);
    await localFile.write(new Uint8Array(arrayBuffer));

    return localFile.uri;
  },
};
