// Families service — get the current user's family and membership info.
// In MVP, every user has exactly one family (auto-created on signup).
// This service exists so other parts of the app can easily get the familyId
// without having to query family_members directly.

import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';

type Family = Database['public']['Tables']['families']['Row'];
type FamilyMember = Database['public']['Tables']['family_members']['Row'];

export const familiesService = {
  /** Get the current user's family.
   *  In MVP, each user has exactly one family. This returns it.
   *  Joins through family_members to find the family the user belongs to. */
  async getMyFamily(): Promise<Family> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated — cannot fetch family');

    const { data, error } = await supabase
      .from('family_members')
      .select('family_id, families(*)')
      .eq('profile_id', session.user.id)
      .eq('status', 'active')
      .limit(1)
      .single();

    if (error) throw new Error(`Failed to fetch family: ${error.message}`, { cause: error });
    if (!data.families) throw new Error('Family data missing from join result');
    return data.families as unknown as Family;
  },

  /** Get the current user's family ID (convenience shortcut).
   *  Most service methods need just the ID, not the full family object. */
  async getMyFamilyId(): Promise<string> {
    const family = await this.getMyFamily();
    return family.id;
  },

  /** Get all members of a family (for V2 partner features) */
  async getFamilyMembers(familyId: string): Promise<FamilyMember[]> {
    const { data, error } = await supabase
      .from('family_members')
      .select('*')
      .eq('family_id', familyId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(`Failed to fetch family members: ${error.message}`, { cause: error });
    return data;
  },
};
