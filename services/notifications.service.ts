// Notifications service — manage push notification device tokens.
// When the app opens, it registers the device's push token so Supabase
// knows where to send the nightly recording reminder.

import { supabase } from '@/lib/supabase';

export const notificationsService = {
  /** Register or update a device's push token */
  async registerDevice(profileId: string, pushToken: string, platform: 'ios' | 'android', deviceName?: string) {
    const { data, error } = await supabase
      .from('user_devices')
      .upsert(
        {
          profile_id: profileId,
          push_token: pushToken,
          platform,
          device_name: deviceName,
          is_active: true,
          last_active_at: new Date().toISOString(),
        },
        { onConflict: 'push_token' }
      )
      .select()
      .single();

    if (error) throw new Error(`Failed to register device: ${error.message}`, { cause: error });
    return data;
  },

  /** Update last active timestamp (called on each app open) */
  async updateDeviceActivity(pushToken: string) {
    const { error } = await supabase
      .from('user_devices')
      .update({ last_active_at: new Date().toISOString() })
      .eq('push_token', pushToken);

    if (error) throw new Error(`Failed to update device activity: ${error.message}`, { cause: error });
  },

  /** Deactivate a device on logout (don't delete — they might log back in) */
  async deactivateDevice(pushToken: string) {
    const { error } = await supabase
      .from('user_devices')
      .update({ is_active: false })
      .eq('push_token', pushToken);

    if (error) throw new Error(`Failed to deactivate device: ${error.message}`, { cause: error });
  },
};
