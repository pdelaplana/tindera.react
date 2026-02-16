-- Add email column to user_profiles so it can be read by shop members
-- without requiring direct access to auth.users.

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS email TEXT;

-- Back-fill existing rows from auth.users
UPDATE public.user_profiles up
SET email = au.email
FROM auth.users au
WHERE up.id = au.id;

-- Keep email in sync when new users are created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, display_name, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'display_name',
    NEW.email
  )
  ON CONFLICT (id) DO UPDATE
    SET display_name = EXCLUDED.display_name,
        email = EXCLUDED.email;
  RETURN NEW;
END;
$$;
