-- Migration 013: create_user_devices
-- Stores push notification tokens for each device a user has.
-- Think of it like a phone book — when it's time to send the nightly reminder,
-- we look up which devices belong to this user and send a push to each one.

CREATE TABLE user_devices (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  push_token     text NOT NULL UNIQUE,  -- Expo push token (ExponentPushToken[...])
  platform       text NOT NULL CHECK (platform IN ('ios', 'android')),
  device_name    text,                  -- Optional device name for user reference
  is_active      boolean NOT NULL DEFAULT true,  -- Set false on logout, not delete
  last_active_at timestamptz NOT NULL DEFAULT now(),  -- Updated on each app open
  created_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;
