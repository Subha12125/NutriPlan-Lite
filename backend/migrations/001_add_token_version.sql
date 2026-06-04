-- Migration 001: Add token_version column to users table
--
-- Purpose:
--   Enable server-side JWT revocation on logout. Each time the user logs out,
--   token_version is incremented. The protect middleware verifies that the
--   version embedded in the JWT matches the current value in the database.
--   Any token issued before the last logout is therefore immediately rejected.
--
-- This is a safe, additive migration. Existing rows get the default value of 0,
-- which matches the version embedded in all currently-valid JWTs (which do not
-- carry the field yet). Those tokens will continue to work until the user
-- logs out for the first time after this migration runs.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 0;
