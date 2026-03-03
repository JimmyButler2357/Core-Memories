// Prompts service — fetch conversation starters for the recording screen
// and notifications. Tracks which prompts the user has seen so we don't
// repeat the same one too often (like a playlist on shuffle).

import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';

type Prompt = Database['public']['Tables']['prompts']['Row'];

export const promptsService = {
  /** Get a prompt the user hasn't seen recently, filtered by child age.
   *  Fetches a few candidates and picks one randomly (like a playlist on shuffle).
   *  Without randomization, PostgreSQL returns rows in storage order — meaning
   *  the same prompt would come up every time. */
  async getNextPrompt(profileId: string, childAgeMonths?: number): Promise<Prompt | null> {
    // Get recently shown prompt IDs (last 10)
    const { data: recentHistory, error: historyError } = await supabase
      .from('prompt_history')
      .select('prompt_id')
      .eq('profile_id', profileId)
      .order('shown_at', { ascending: false })
      .limit(10);

    if (historyError) throw new Error(`Failed to fetch prompt history: ${historyError.message}`, { cause: historyError });

    const recentIds = recentHistory?.map(h => h.prompt_id) ?? [];

    // Build the query — get prompts NOT in recent history
    let query = supabase
      .from('prompts')
      .select('*')
      .eq('is_active', true);

    // Filter by age range if provided
    if (childAgeMonths !== undefined) {
      query = query
        .or(`min_age_months.is.null,min_age_months.lte.${childAgeMonths}`)
        .or(`max_age_months.is.null,max_age_months.gte.${childAgeMonths}`);
    }

    // Exclude recently shown prompts
    if (recentIds.length > 0) {
      query = query.not('id', 'in', `(${recentIds.join(',')})`);
    }

    // Fetch a batch of candidates so we can pick one randomly.
    // (Supabase JS client doesn't support ORDER BY random(), so we
    // grab several and shuffle on the client side.)
    const { data: candidates, error } = await query.limit(10);

    // Always throw on real database errors — don't confuse "DB broke" with "no results"
    if (error) throw new Error(`Failed to fetch prompts: ${error.message}`, { cause: error });

    // If all prompts have been shown recently, grab from the full pool
    if (!candidates || candidates.length === 0) {
      const { data: fallbackCandidates, error: fallbackError } = await supabase
        .from('prompts')
        .select('*')
        .eq('is_active', true)
        .limit(10);

      if (fallbackError || !fallbackCandidates || fallbackCandidates.length === 0) return null;

      // Pick a random one from the fallback pool
      return fallbackCandidates[Math.floor(Math.random() * fallbackCandidates.length)];
    }

    // Pick a random one from the candidates
    return candidates[Math.floor(Math.random() * candidates.length)];
  },

  /** Record that a prompt was shown to the user */
  async recordPromptShown(profileId: string, promptId: string, context: 'recording_screen' | 'notification') {
    const { error } = await supabase
      .from('prompt_history')
      .insert({
        profile_id: profileId,
        prompt_id: promptId,
        context,
      });

    if (error) throw new Error(`Failed to record prompt shown: ${error.message}`, { cause: error });
  },
};
