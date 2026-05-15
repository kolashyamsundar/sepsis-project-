-- Add email column to profiles for direct email-based messaging (if needed for lookup)
-- This allows looking up users by email for messaging

-- Create index on profiles user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);