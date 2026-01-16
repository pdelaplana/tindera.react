-- Simplified Storage Policy for Testing
-- This removes the complexity to isolate the issue

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to upload shop logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to shop logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update shop logos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete shop logos" ON storage.objects;

-- Create a very permissive upload policy for testing
-- THIS IS TEMPORARY - allows all authenticated users to upload to shops bucket
CREATE POLICY "Allow authenticated users to upload shop logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'shops'
);

-- Public read access
CREATE POLICY "Allow public read access to shop logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'shops');

-- Update policy - permissive for testing
CREATE POLICY "Allow authenticated users to update shop logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'shops');

-- Delete policy - permissive for testing
CREATE POLICY "Allow authenticated users to delete shop logos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'shops');

-- Verify
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%shop logo%'
ORDER BY policyname;
