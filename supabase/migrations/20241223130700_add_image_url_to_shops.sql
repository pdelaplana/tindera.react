-- Add image_url column to shops table
-- This migration adds support for storing shop logo URLs

ALTER TABLE shops 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add a comment to document the column
COMMENT ON COLUMN shops.image_url IS 'URL to the shop logo image stored in Supabase storage';

-- Optional: Add a check constraint to ensure it's a valid URL format (if needed)
-- ALTER TABLE shops 
-- ADD CONSTRAINT shops_image_url_format CHECK (
--   image_url IS NULL OR image_url ~* '^https?://.+'
-- );
