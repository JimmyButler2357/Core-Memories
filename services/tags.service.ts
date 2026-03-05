// Tags service — read system tags and manage family-scoped custom tags.
// System tags (like "humor", "milestone") are global and seeded at setup.
// Custom tags are created by the user and scoped to their family.

import { supabase } from '@/lib/supabase';
import { slugify } from '@/lib/textQuality';
import type { Database } from '@/lib/database.types';

type Tag = Database['public']['Tables']['tags']['Row'];

export const tagsService = {
  /** Get all tags visible to the user (system + family custom) */
  async getAllTags(): Promise<Tag[]> {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw new Error(`Failed to fetch tags: ${error.message}`, { cause: error });
    return data;
  },

  /** Get only system tags */
  async getSystemTags(): Promise<Tag[]> {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .eq('source', 'system')
      .order('name', { ascending: true });

    if (error) throw new Error(`Failed to fetch system tags: ${error.message}`, { cause: error });
    return data;
  },

  /** Create a custom tag for the user's family */
  async createTag(name: string, familyId: string): Promise<Tag> {
    const slug = slugify(name);

    const { data, error } = await supabase
      .from('tags')
      .insert({
        name,
        slug,
        source: 'user_created' as const,
        family_id: familyId,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create tag "${name}": ${error.message}`, { cause: error });
    return data;
  },

  /** Delete a custom tag */
  async deleteTag(tagId: string) {
    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', tagId);

    if (error) throw new Error(`Failed to delete tag: ${error.message}`, { cause: error });
  },
};
