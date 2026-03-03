// Auth store — holds the user's authentication state.
//
// Think of this like your app's "ID card holder." It knows:
// - WHO is logged in (session + user)
// - Their PROFILE (display name, notification prefs, etc.)
// - Which FAMILY they belong to (familyId)
// - Whether they've completed ONBOARDING
//
// Important: We do NOT persist the session here — Supabase's client
// already saves it in AsyncStorage automatically. We only persist
// `hasCompletedOnboarding` as a fast local flag so the app can
// route instantly on launch without waiting for a network call.

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session, User } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

import { authService } from '@/services/auth.service';
import { profilesService } from '@/services/profiles.service';
import { familiesService } from '@/services/families.service';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthState {
  // --- Persisted (survives app restart) ---
  hasCompletedOnboarding: boolean;

  // --- In-memory only (refreshed each launch) ---
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  familyId: string | null;
  isLoading: boolean;

  // --- Actions ---

  /** Called once on app launch. Checks for an existing Supabase session
   *  and loads the user's profile + family if found. */
  initialize: () => Promise<void>;

  /** Called when auth state changes (login, logout, token refresh).
   *  Loads profile + family on sign-in, clears everything on sign-out. */
  handleAuthChange: (session: Session | null) => Promise<void>;

  /** Sign in with email/password. Returns the session data. */
  signIn: (email: string, password: string) => Promise<void>;

  /** Sign up with email/password. Returns the session data. */
  signUp: (email: string, password: string) => Promise<void>;

  /** Sign out — clears Supabase session + local state. */
  signOut: () => Promise<void>;

  /** Mark onboarding as complete (local flag only — Supabase is
   *  updated separately via profilesService.completeOnboarding). */
  setOnboarded: () => void;

  /** Update the cached profile in the store (after editing profile fields). */
  setProfile: (profile: Profile) => void;

  /** Full reset — clears everything including onboarding flag. */
  reset: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // --- Persisted ---
      hasCompletedOnboarding: false,

      // --- In-memory ---
      session: null,
      user: null,
      profile: null,
      familyId: null,
      isLoading: true, // Start true — we're checking for a session

      // --- Actions ---

      initialize: async () => {
        try {
          const session = await authService.getSession();
          if (session) {
            await get().handleAuthChange(session);
          }
        } catch (error: any) {
          // If the cached token is stale (e.g. user was deleted from
          // Supabase dashboard), sign out cleanly so the app doesn't
          // get stuck with a zombie session.
          const message = error?.message ?? '';
          if (message.includes('Refresh Token') || message.includes('Invalid')) {
            console.warn('Stale session detected, signing out:', message);
            try { await authService.signOut(); } catch { /* ignore */ }
            set({ session: null, user: null, profile: null, familyId: null });
          } else {
            console.warn('Auth initialization failed:', error);
          }
        } finally {
          set({ isLoading: false });
        }
      },

      handleAuthChange: async (session: Session | null) => {
        if (!session) {
          // Signed out — clear everything except onboarding flag
          set({
            session: null,
            user: null,
            profile: null,
            familyId: null,
          });
          return;
        }

        // Signed in — load profile and family
        set({ session, user: session.user });

        try {
          const [profile, familyId] = await Promise.all([
            profilesService.getProfile(),
            familiesService.getMyFamilyId(),
          ]);

          set({
            profile,
            familyId,
            // Sync the local onboarding flag with the server value
            hasCompletedOnboarding: profile.onboarding_completed,
          });
        } catch (error) {
          // Profile/family fetch failed — user is authenticated but
          // we couldn't load their data. This might happen if the
          // handle_new_user trigger hasn't fired yet (race condition).
          console.warn('Failed to load profile/family:', error);
        }
      },

      signIn: async (email, password) => {
        const { session } = await authService.signInWithEmail(email, password);
        if (session) {
          await get().handleAuthChange(session);
        }
      },

      signUp: async (email, password) => {
        const { session } = await authService.signUpWithEmail(email, password);
        if (session) {
          await get().handleAuthChange(session);
        }
      },

      signOut: async () => {
        await authService.signOut();
        set({
          session: null,
          user: null,
          profile: null,
          familyId: null,
          hasCompletedOnboarding: false,
        });
      },

      setOnboarded: () => set({ hasCompletedOnboarding: true }),

      setProfile: (profile) => set({ profile }),

      reset: () =>
        set({
          hasCompletedOnboarding: false,
          session: null,
          user: null,
          profile: null,
          familyId: null,
        }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist the onboarding flag — everything else is
      // refreshed from Supabase on each app launch.
      partialize: (state) => ({
        hasCompletedOnboarding: state.hasCompletedOnboarding,
      }),
    },
  ),
);
