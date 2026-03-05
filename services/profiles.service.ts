// Profiles service — read and update the current user's profile.
// The profile is auto-created by a database trigger when someone signs up,
// so there's no "create" method here.

import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export const profilesService = {
  /** Get the current user's profile.
   *  Checks auth first so an expired session gives a clear error
   *  instead of a confusing "0 rows returned" from .single(). */
  async getProfile(): Promise<Profile> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated — cannot fetch profile');

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (error) throw new Error(`Failed to fetch profile: ${error.message}`, { cause: error });
    return data;
  },

  /** Update profile fields (display name, notification prefs, etc.).
   *  Gets the user ID safely from the session instead of using a
   *  non-null assertion (!) that would crash with a confusing error. */
  async updateProfile(updates: ProfileUpdate) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated — cannot update profile');

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', session.user.id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update profile: ${error.message}`, { cause: error });
    return data;
  },

  /** Mark onboarding as completed */
  async completeOnboarding() {
    return this.updateProfile({ onboarding_completed: true });
  },

  /** Update notification preferences */
  async updateNotificationPrefs(prefs: {
    notification_enabled?: boolean;
    notification_time?: string;
    notification_days?: number[];
  }) {
    return this.updateProfile(prefs);
  },
};
