
-- Add ml_features JSONB column to store all ML model feature values
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS ml_features jsonb DEFAULT NULL;

-- Add phone column for patient identity
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS phone text DEFAULT NULL;
