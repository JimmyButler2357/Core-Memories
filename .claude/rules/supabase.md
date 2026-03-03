---
paths:
  - "services/**/*.ts"
  - "supabase/**/*.sql"
  - "lib/supabase.ts"
  - "lib/database.types.ts"
---

# Supabase & Backend Rules

Rules learned from security and database audits. Follow these when writing migrations, RLS policies, RPC functions, or service layer code.

## RLS & Security

- **RLS is row-level only.** It cannot restrict which columns are updated. To protect sensitive columns (billing, roles), use a BEFORE UPDATE trigger that reverts changes from non-service_role callers.
- **Same-type RLS policies are ORed together.** Adding a second SELECT or UPDATE policy can only make things MORE permissive, never less. If you need a narrow action (like toggling one column), use an RPC function instead of a second UPDATE policy.
- **Every SECURITY DEFINER function must have `SET search_path = public`.** Without it, an attacker could hijack the search path to run malicious code with elevated privileges.
- **To change a function's return type, DROP then CREATE.** PostgreSQL does not allow `CREATE OR REPLACE` to change a return type. You must `DROP FUNCTION IF EXISTS name(args)` first.

## Service Layer

- **Always derive user identity from `supabase.auth.getUser()`** — never accept `userId` or `profileId` as a parameter. Even if RLS blocks misuse, the service layer should not trust caller-supplied identity.
- **Always check auth before `.single()`.** If the session is expired, RLS returns zero rows and `.single()` throws a confusing PGRST116 error. Call `auth.getUser()` first and throw a clear "Not authenticated" message.
- **Never swallow errors.** Always check the `error` return from every Supabase call. If a method has fallback logic (e.g., retry with a different query), throw on real errors first, then fall back only for empty results.
- **Use contextual error messages.** `throw new Error('Failed to [operation]: ${error.message}', { cause: error })` — not bare `throw error`. This makes debugging 10x easier.
- **Use `Omit<Type, 'field'>` to prevent callers from supplying server-derived fields** like `user_id`. TypeScript will enforce this at compile time.

## Database Schema

- **Add CHECK constraints for value ranges.** Don't rely solely on app-level validation — constraints are the last line of defense. Examples: `confidence BETWEEN 0 AND 1`, `length(trim(name)) > 0`, `min <= max`.
- **Log/audit tables should use `ON DELETE SET NULL` for FKs** — not the default `NO ACTION` which blocks deleting the referenced row. Logs should never prevent real operations.
- **Every table with RLS needs policies for every operation it should support.** A missing UPDATE policy means the operation is silently blocked. Check: SELECT, INSERT, UPDATE, DELETE.

## Queries & Indexes

- **Pass `config: 'english'` to `.textSearch()`.** The GIN index is built with a specific config. If the query doesn't match, PostgreSQL does a slow full table scan.
- **Use RPC functions for multi-step writes** (delete-then-insert patterns). Each Supabase API call is its own transaction. An RPC wraps both steps in one transaction so they succeed or fail together.

## Storage

- **Use `upsert: true`** for file uploads that may be re-done (like re-recording audio).
- **Validate storage paths in the service layer** — check that the path starts with the current user's ID before calling Supabase. RLS is the safety net, not the only check.

## After Migrations

- **Regenerate types after adding/changing RPC functions:** `npm run gen:types`
- **Filter out CLI status messages** when piping type generation to a file (the "Initialising login role..." prefix breaks TypeScript).
