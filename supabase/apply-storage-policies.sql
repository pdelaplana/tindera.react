-- Apply Storage RLS Policies for Shop Logos
-- Run this entire script in Supabase SQL Editor

-- ============================================================================
-- STEP 1: DROP EXISTING POLICIES (if any)
-- ============================================================================

DROP POLICY IF EXISTS "Allow authenticated users to upload shop logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to shop logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update shop logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete shop logos" ON storage.objects;

-- ============================================================================
-- STEP 2: CREATE NEW POLICIES
-- ============================================================================

-- Policy 1: Allow authenticated users to upload shop logos
-- Users can only upload to folders matching their shop IDs where they are owner/admin
CREATE POLICY "Allow authenticated users to upload shop logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'shops' AND
  ((storage.foldername(name))[1])::uuid IN (
    SELECT public.shop_users.shop_id
    FROM public.shop_users
    WHERE public.shop_users.user_id = auth.uid()
    AND public.shop_users.role IN ('owner', 'admin')
  )
);

-- Policy 2: Allow public read access to shop logos
-- Anyone can view/download shop logos (public bucket)
CREATE POLICY "Allow public read access to shop logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'shops');

-- Policy 3: Allow authenticated users to update their shop logos
-- Users can only update logos for shops they own/admin
CREATE POLICY "Allow authenticated users to update shop logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'shops' AND
  ((storage.foldername(name))[1])::uuid IN (
    SELECT public.shop_users.shop_id
    FROM public.shop_users
    WHERE public.shop_users.user_id = auth.uid()
    AND public.shop_users.role IN ('owner', 'admin')
  )
);

-- Policy 4: Allow authenticated users to delete their shop logos
-- Users can only delete logos for shops they own/admin
CREATE POLICY "Allow authenticated users to delete shop logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'shops' AND
  ((storage.foldername(name))[1])::uuid IN (
    SELECT public.shop_users.shop_id
    FROM public.shop_users
    WHERE public.shop_users.user_id = auth.uid()
    AND public.shop_users.role IN ('owner', 'admin')
  )
);

-- ============================================================================
-- STEP 3: VERIFY POLICIES WERE CREATED
-- ============================================================================

SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%shop logo%'
ORDER BY policyname;

-- Should return 4 policies (INSERT, SELECT, UPDATE, DELETE)
