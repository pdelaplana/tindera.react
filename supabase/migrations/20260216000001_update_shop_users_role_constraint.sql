-- Update role constraint: rename 'admin' to 'manager'
ALTER TABLE shop_users DROP CONSTRAINT IF EXISTS shop_users_role_check;

-- Migrate any existing 'admin' rows to 'manager'
UPDATE shop_users SET role = 'manager' WHERE role = 'admin';

ALTER TABLE shop_users
  ADD CONSTRAINT shop_users_role_check
  CHECK (role IN ('owner', 'manager', 'staff'));
