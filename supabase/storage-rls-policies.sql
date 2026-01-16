-- Storage RLS Policies for Shop Logos
-- Run this script in Supabase SQL Editor to set up Row Level Security for the shops storage bucket

-- ============================================================================
-- STORAGE POLICIES FOR 'shops' BUCKET
-- ============================================================================

-- Policy 1: Allow authenticated users to upload shop logos
-- Users can only upload to folders matching their shop IDs
CREATE POLICY "Allow authenticated users to upload shop logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'shops' AND
  EXISTS (
    SELECT 1 FROM shops 
    JOIN shop_users ON shop_users.shop_id = shops.id
    WHERE shop_users.user_id = auth.uid() 
    AND shops.id::uuid = ((storage.foldername(name))[1])::uuid
    AND shop_users.role IN ('owner', 'admin')
  )
);

-- Policy 2: Allow public read access to shop logos
-- Anyone can view/download shop logos (public bucket)
CREATE POLICY "Allow public read access to shop logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'shops');

-- Policy 3: Allow authenticated users to update their shop logos
-- Users can only update logos for shops they own
CREATE POLICY "Allow authenticated users to update shop logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'shops' AND
  EXISTS (
    SELECT 1 FROM shops 
    JOIN shop_users ON shop_users.shop_id = shops.id
    WHERE shop_users.user_id = auth.uid() 
    AND shops.id::uuid = ((storage.foldername(name))[1])::uuid
    AND shop_users.role IN ('owner', 'admin')
  )
);

-- Policy 4: Allow authenticated users to delete their shop logos
-- Users can only delete logos for shops they own
CREATE POLICY "Allow authenticated users to delete shop logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'shops' AND
  EXISTS (
    SELECT 1 FROM shops 
    JOIN shop_users ON shop_users.shop_id = shops.id
    WHERE shop_users.user_id = auth.uid() 
    AND shops.id::uuid = ((storage.foldername(name))[1])::uuid
    AND shop_users.role IN ('owner', 'admin')
  )
);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check if policies were created successfully
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%shop logo%';

-- ============================================================================
-- NOTES
-- ============================================================================
-- 
-- These policies ensure:
-- 1. Authenticated users can upload logos to folders matching their shop IDs
-- 2. Anyone can read/download logos (public access)
-- 3. Users can only update/delete logos for shops they own
-- 4. Security is enforced at the database level
--
-- Path structure: shops/{shopId}/logo.{extension}
-- Example: shops/abc123-def456/logo.jpg
--
