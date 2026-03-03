// Purge Deleted Entries — Supabase Edge Function
//
// This function runs daily via a cron trigger and permanently
// deletes entries that have been in the "trash" for more than
// 30 days. It also cleans up their audio files from Storage.
//
// Think of it like a janitor who empties the recycling bin
// once a day — anything that's been sitting there for a month
// gets permanently removed.
//
// To deploy:
//   supabase functions deploy purge-deleted
//
// To set up the daily cron trigger, add this to Supabase Dashboard
// → Database → Extensions → pg_cron, or run this SQL:
//
//   select cron.schedule(
//     'purge-deleted-entries',
//     '0 3 * * *',  -- 3:00 AM UTC daily
//     $$
//     select net.http_post(
//       url := '<your-project-url>/functions/v1/purge-deleted',
//       headers := '{"Authorization": "Bearer <your-service-role-key>"}'::jsonb
//     );
//     $$
//   );

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const BUCKET = 'audio-recordings';

Deno.serve(async (req) => {
  try {
    // Use the service role key so we can bypass RLS
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Find entries soft-deleted more than 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: staleEntries, error: fetchError } = await supabase
      .from('entries')
      .select('id, user_id, audio_storage_path')
      .eq('is_deleted', true)
      .lt('deleted_at', thirtyDaysAgo.toISOString());

    if (fetchError) {
      return new Response(
        JSON.stringify({ error: fetchError.message }),
        { status: 500 },
      );
    }

    if (!staleEntries || staleEntries.length === 0) {
      return new Response(
        JSON.stringify({ purged: 0, message: 'No entries to purge' }),
        { status: 200 },
      );
    }

    // Delete audio files from Storage
    const audioPaths = staleEntries
      .map((e) => e.audio_storage_path)
      .filter((p): p is string => p != null);

    if (audioPaths.length > 0) {
      const { error: storageError } = await supabase.storage
        .from(BUCKET)
        .remove(audioPaths);

      if (storageError) {
        console.warn('Some audio files failed to delete:', storageError.message);
        // Don't abort — still delete the entry rows
      }
    }

    // Hard-delete the entry rows
    const entryIds = staleEntries.map((e) => e.id);
    const { error: deleteError } = await supabase
      .from('entries')
      .delete()
      .in('id', entryIds);

    if (deleteError) {
      return new Response(
        JSON.stringify({ error: deleteError.message }),
        { status: 500 },
      );
    }

    return new Response(
      JSON.stringify({
        purged: entryIds.length,
        audioFilesDeleted: audioPaths.length,
      }),
      { status: 200 },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500 },
    );
  }
});
