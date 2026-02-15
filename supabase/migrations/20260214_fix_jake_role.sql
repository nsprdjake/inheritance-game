-- Fix Jake's user role from 'kid' to 'admin'
-- This will allow him to access the parent dashboard instead of being redirected to /kid

-- Update by auth UUID (from environments.md)
UPDATE users 
SET role = 'admin'
WHERE id = '40fa30b9-3ea3-44b0-aa10-70f00a9e4bcf';

-- Also update by email as backup
UPDATE users 
SET role = 'admin'
WHERE email = 'eyejake@me.com';

-- Verify the update
SELECT id, email, role, family_id FROM users WHERE email = 'eyejake@me.com';
