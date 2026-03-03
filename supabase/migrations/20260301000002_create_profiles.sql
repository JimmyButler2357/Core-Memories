-- Migration 002: create_profiles
-- Extends Supabase's built-in auth.users with app-specific data.
-- Think of auth.users as the key to your front door, and profiles as your
-- personal file cabinet inside — one gets created automatically when you sign up.

CREATE TABLE profiles (
  id                   uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name         text,
  notification_time    time DEFAULT '20:30',
  notification_enabled boolean NOT NULL DEFAULT true,
  notification_days    smallint[] DEFAULT '{0,1,2,3,4,5,6}',
  onboarding_completed boolean NOT NULL DEFAULT false,
  subscription_status  text NOT NULL DEFAULT 'trial'
    CHECK (subscription_status IN ('trial', 'active', 'canceled', 'expired')),
  trial_ends_at        timestamptz,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

-- Auto-update updated_at on any change
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Enable RLS immediately (policies added in migration 019)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
