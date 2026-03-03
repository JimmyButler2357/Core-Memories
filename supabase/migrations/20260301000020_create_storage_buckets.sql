-- Migration 020: create_storage_buckets
-- Creates the private bucket for audio recordings and sets up RLS
-- so users can only access their own audio files.
-- Path pattern: {user_id}/{entry_id}.wav

-- Create the private audio bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio-recordings', 'audio-recordings', false);

-- RLS: users can read their own audio files
CREATE POLICY audio_select_own ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'audio-recordings'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- RLS: users can upload to their own folder
CREATE POLICY audio_insert_own ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'audio-recordings'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- RLS: users can update (replace) their own files
CREATE POLICY audio_update_own ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'audio-recordings'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- RLS: users can delete their own audio files
CREATE POLICY audio_delete_own ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'audio-recordings'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
