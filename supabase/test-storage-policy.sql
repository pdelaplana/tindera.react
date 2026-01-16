-- Test Storage Policy Logic
-- Run this to verify the policy would work for a specific user and shop

-- Replace these with actual values from your test:
-- YOUR_USER_ID: f1bc6401-7f0c-4cf2-8fe8-b1e76f853588 (from console logs)
-- YOUR_SHOP_ID: (use the shopId from the upload attempt)

-- Test 1: Check if user has access to the shop
SELECT 
  shop_users.shop_id,
  shop_users.user_id,
  shop_users.role,
  shops.name as shop_name
FROM shop_users
JOIN shops ON shop_users.shop_id = shops.id
WHERE shop_users.user_id = 'f1bc6401-7f0c-4cf2-8fe8-b1e76f853588'::uuid;
-- Should return rows showing your shops with role 'owner'

-- Test 2: Simulate the storage policy check for a specific upload
-- Replace 'YOUR_SHOP_ID' with the actual UUID from the upload attempt
SELECT 
  EXISTS (
    SELECT 1 FROM shops 
    JOIN shop_users ON shop_users.shop_id = shops.id
    WHERE shop_users.user_id = 'f1bc6401-7f0c-4cf2-8fe8-b1e76f853588'::uuid
    AND shops.id = 'YOUR_SHOP_ID'::uuid
    AND shop_users.role IN ('owner', 'admin')
  ) as would_allow_upload;
-- Should return: true

-- Test 3: Check what storage.foldername() returns
-- This tests the array indexing logic
SELECT 
  'ee02bf38-8b64-4f11-8e92-d0d6679ea1d6/logo.jpg' as example_path,
  storage.foldername('ee02bf38-8b64-4f11-8e92-d0d6679ea1d6/logo.jpg') as folder_array,
  (storage.foldername('ee02bf38-8b64-4f11-8e92-d0d6679ea1d6/logo.jpg'))[1] as first_element;
-- This will show what the policy is actually comparing

-- Test 4: Verify all policies exist
SELECT 
  policyname,
  cmd,
  roles,
  CASE 
    WHEN cmd = 'INSERT' THEN 'Upload'
    WHEN cmd = 'SELECT' THEN 'Read'
    WHEN cmd = 'UPDATE' THEN 'Update'
    WHEN cmd = 'DELETE' THEN 'Delete'
  END as operation
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%shop logo%'
ORDER BY cmd;
-- Should return 4 policies
