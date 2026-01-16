-- Verify Storage Bucket Configuration

-- Check if the 'shops' bucket exists
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE name = 'shops';
-- Should return 1 row with the bucket details

-- If bucket doesn't exist, create it:
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('shops', 'shops', true);
