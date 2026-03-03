-- Migration 026: guard_subscription_fields
-- Prevents users from giving themselves free premium by updating their own
-- subscription_status or trial_ends_at through the client.
--
-- WHY IS THIS NEEDED?
-- The profiles_update_own RLS policy says "you can update your own row."
-- That's row-level security — it controls WHICH rows you can touch. But it
-- cannot control WHICH COLUMNS you can change. So a user could call:
--     supabase.from('profiles').update({ subscription_status: 'active' })
-- and give themselves free premium forever.
--
-- HOW DOES THE FIX WORK?
-- A BEFORE UPDATE trigger runs every time a profile row is about to change.
-- It checks: "did subscription_status or trial_ends_at change?" If yes, it
-- checks: "is the caller the service_role (our backend)?" If not, it quietly
-- puts the old values back. The user's other changes (display_name, etc.)
-- still go through — we only protect the billing columns.
--
-- Think of it like a form where some fields are grayed out. You can edit your
-- name and notification settings, but the "subscription" field is read-only
-- unless you're the system admin.

CREATE OR REPLACE FUNCTION guard_subscription_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Only check if billing columns actually changed
  IF NEW.subscription_status IS DISTINCT FROM OLD.subscription_status
     OR NEW.trial_ends_at IS DISTINCT FROM OLD.trial_ends_at THEN

    -- current_setting('request.jwt.claim.role') tells us WHO is making the call.
    -- 'service_role' = our backend/webhooks (trusted).
    -- 'authenticated' = a regular logged-in user (not trusted for billing).
    -- The 'true' parameter means "return NULL instead of error if the setting doesn't exist."
    IF current_setting('request.jwt.claim.role', true) IS DISTINCT FROM 'service_role' THEN
      -- Silently revert the billing fields to their old values
      NEW.subscription_status := OLD.subscription_status;
      NEW.trial_ends_at := OLD.trial_ends_at;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Fire this trigger BEFORE the row is written, so we can modify NEW
CREATE TRIGGER guard_subscription_update
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION guard_subscription_fields();
