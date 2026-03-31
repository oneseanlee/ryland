-- Migrate admin roles from user_metadata to app_metadata
--
-- Background: is_admin() was changed to ONLY check app_metadata.role (not user_metadata)
-- because user_metadata is user-writable and was a privilege escalation vector.
-- app_metadata can only be set server-side (service role / admin API).
--
-- This migration copies the 'role' field from user_metadata to app_metadata
-- for all users that have role = 'admin' in user_metadata but NOT in app_metadata.

-- Move admin role to app_metadata for ALL admin users
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || jsonb_build_object('role', 'admin')
WHERE raw_user_meta_data->>'role' = 'admin'
  AND (raw_app_meta_data->>'role') IS DISTINCT FROM 'admin';

-- Also migrate command_center_role if present in user_metadata
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || jsonb_build_object('role', raw_user_meta_data->>'command_center_role')
WHERE raw_user_meta_data->>'command_center_role' IS NOT NULL
  AND (raw_app_meta_data->>'role') IS NULL;

-- Verify: show all users and their role status after migration
-- (run this SELECT separately to confirm)
-- SELECT id, email,
--        raw_user_meta_data->>'role' as user_meta_role,
--        raw_app_meta_data->>'role' as app_meta_role
-- FROM auth.users
-- WHERE raw_user_meta_data->>'role' IS NOT NULL
--    OR raw_app_meta_data->>'role' IS NOT NULL;
