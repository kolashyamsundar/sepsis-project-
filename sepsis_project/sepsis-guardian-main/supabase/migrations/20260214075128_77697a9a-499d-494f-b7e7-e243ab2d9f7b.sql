
-- Add new clinical columns to patients table
ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS weight numeric,
  ADD COLUMN IF NOT EXISTS gcs integer,
  ADD COLUMN IF NOT EXISTS urine_output numeric,
  ADD COLUMN IF NOT EXISTS fio2 numeric,
  ADD COLUMN IF NOT EXISTS pao2 numeric,
  ADD COLUMN IF NOT EXISTS inr numeric,
  ADD COLUMN IF NOT EXISTS vasopressor_flag boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS vasopressor_type text,
  ADD COLUMN IF NOT EXISTS vasopressor_dose numeric,
  ADD COLUMN IF NOT EXISTS suspected_source text,
  ADD COLUMN IF NOT EXISTS oxygen_support text DEFAULT 'room_air',
  ADD COLUMN IF NOT EXISTS map_value numeric,
  ADD COLUMN IF NOT EXISTS sofa_score integer,
  ADD COLUMN IF NOT EXISTS cancer boolean DEFAULT false;
