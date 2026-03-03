// Children service — CRUD for child profiles.
// When you create a child, a database trigger automatically links them
// to your family (via family_children table), so you don't need to
// worry about that relationship manually.

import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';

type Child = Database['public']['Tables']['children']['Row'];
type ChildInsert = Database['public']['Tables']['children']['Insert'];
type ChildUpdate = Database['public']['Tables']['children']['Update'];

export const childrenService = {
  /** Get all children in the user's family, ordered by display_order */
  async getChildren(): Promise<Child[]> {
    const { data, error } = await supabase
      .from('children')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) throw new Error(`Failed to fetch children: ${error.message}`, { cause: error });
    return data;
  },

  /** Create a new child profile */
  async createChild(child: Pick<ChildInsert, 'name' | 'birthday' | 'nickname' | 'color_index' | 'display_order'>) {
    const { data, error } = await supabase
      .from('children')
      .insert(child)
      .select()
      .single();

    if (error) throw new Error(`Failed to create child: ${error.message}`, { cause: error });
    return data;
  },

  /** Update an existing child */
  async updateChild(childId: string, updates: ChildUpdate) {
    const { data, error } = await supabase
      .from('children')
      .update(updates)
      .eq('id', childId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update child: ${error.message}`, { cause: error });
    return data;
  },

  /** Delete a child (owner only) */
  async deleteChild(childId: string) {
    const { error } = await supabase
      .from('children')
      .delete()
      .eq('id', childId);

    if (error) throw new Error(`Failed to delete child: ${error.message}`, { cause: error });
  },
};
