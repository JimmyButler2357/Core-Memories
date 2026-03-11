// Auth service — handles sign in, sign out, and session management.
// Think of this as the "front door" of the app.

import { supabase } from '@/lib/supabase';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

export const authService = {
  /** Sign in with email and password */
  async signInWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw new Error(`Failed to sign in: ${error.message}`, { cause: error });
    return data;
  },

  /** Sign up with email and password */
  async signUpWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw new Error(`Failed to sign up: ${error.message}`, { cause: error });
    return data;
  },

  /** Sign in with Apple (OAuth).
   *  Opens Apple's native sign-in sheet. After the user authenticates,
   *  Apple sends a token back to Supabase, which creates/finds the user.
   *  The `redirectTo` tells the browser where to send the user after
   *  auth completes — our app's deep link scheme opens the app back up. */
  async signInWithApple() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: 'core-memories://auth/callback',
      },
    });
    if (error) throw new Error(`Failed to sign in with Apple: ${error.message}`, { cause: error });
    return data;
  },

  /** Sign in with Google (OAuth).
   *  Same flow as Apple — opens Google's login, then redirects back. */
  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'core-memories://auth/callback',
      },
    });
    if (error) throw new Error(`Failed to sign in with Google: ${error.message}`, { cause: error });
    return data;
  },

  /** Send a password reset email.
   *  Supabase emails the user a link containing temporary tokens.
   *  The `redirectTo` tells the link where to send the user —
   *  our app's deep link scheme opens the reset-password screen.
   *  We show the same success message regardless of whether the
   *  email exists (so attackers can't check if someone has an account). */
  async resetPasswordForEmail(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'core-memories://reset-password',
    });
    if (error) throw new Error(`Failed to send reset email: ${error.message}`, { cause: error });
  },

  /** Update the current user's password.
   *  Works when the user has an active session — either logged in
   *  normally (change password from Settings) or via the temporary
   *  PASSWORD_RECOVERY session from the email link (forgot password flow). */
  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(`Failed to update password: ${error.message}`, { cause: error });
  },

  /** Sign out */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(`Failed to sign out: ${error.message}`, { cause: error });
  },

  /** Get current session (null if not logged in) */
  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw new Error(`Failed to get session: ${error.message}`, { cause: error });
    return data.session;
  },

  /** Listen for auth state changes (login, logout, token refresh).
   *  Uses proper Supabase types instead of `string` and `any` so you get
   *  autocomplete and exhaustiveness checking on event types. */
  onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },
};
