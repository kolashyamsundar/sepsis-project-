-- =============================================
-- FIX 1: Add rate limiting tracking to password_reset_tokens
-- =============================================
-- Add attempt tracking columns to password_reset_tokens
ALTER TABLE public.password_reset_tokens 
ADD COLUMN IF NOT EXISTS failed_attempts integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_attempt_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS locked_until timestamp with time zone;

-- Create index for efficient rate limit queries
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_email_created 
ON public.password_reset_tokens(email, created_at DESC);

-- Create a function to check rate limits for password reset requests
CREATE OR REPLACE FUNCTION public.check_password_reset_rate_limit(p_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_requests integer;
BEGIN
  -- Count requests in the last hour for this email
  SELECT COUNT(*) INTO recent_requests
  FROM public.password_reset_tokens
  WHERE email = p_email
    AND created_at > now() - interval '1 hour';
  
  -- Allow max 3 requests per hour
  RETURN recent_requests < 3;
END;
$$;

-- Create a function to check if token is locked due to failed attempts
CREATE OR REPLACE FUNCTION public.check_otp_lockout(p_token text)
RETURNS TABLE(is_locked boolean, locked_until timestamp with time zone, remaining_attempts integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  token_record RECORD;
BEGIN
  SELECT t.failed_attempts, t.locked_until 
  INTO token_record
  FROM public.password_reset_tokens t
  WHERE t.token = p_token AND t.used = false;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::timestamp with time zone, 0;
    RETURN;
  END IF;
  
  -- Check if currently locked
  IF token_record.locked_until IS NOT NULL AND token_record.locked_until > now() THEN
    RETURN QUERY SELECT true, token_record.locked_until, 0;
  ELSE
    -- Return remaining attempts (max 5 attempts)
    RETURN QUERY SELECT false, NULL::timestamp with time zone, GREATEST(0, 5 - COALESCE(token_record.failed_attempts, 0));
  END IF;
END;
$$;

-- Create a function to increment failed OTP attempts
CREATE OR REPLACE FUNCTION public.increment_otp_failed_attempt(p_token text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_attempts integer;
BEGIN
  -- Increment failed attempts
  UPDATE public.password_reset_tokens
  SET 
    failed_attempts = COALESCE(failed_attempts, 0) + 1,
    last_attempt_at = now(),
    -- Lock for 15 minutes after 5 failed attempts
    locked_until = CASE 
      WHEN COALESCE(failed_attempts, 0) + 1 >= 5 THEN now() + interval '15 minutes'
      ELSE locked_until
    END
  WHERE token = p_token;
END;
$$;

-- =============================================
-- FIX 2: Create doctor-patient assignment system
-- =============================================
-- Create the doctor_patient_assignments table
CREATE TABLE IF NOT EXISTS public.doctor_patient_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  assigned_at timestamp with time zone NOT NULL DEFAULT now(),
  assigned_by uuid,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  UNIQUE(doctor_id, patient_id)
);

-- Enable RLS on doctor_patient_assignments
ALTER TABLE public.doctor_patient_assignments ENABLE ROW LEVEL SECURITY;

-- Doctors can view their own assignments
CREATE POLICY "Doctors can view their assignments"
ON public.doctor_patient_assignments
FOR SELECT
USING (auth.uid() = doctor_id);

-- Doctors can create assignments (self-assign to patients)
CREATE POLICY "Doctors can create assignments"
ON public.doctor_patient_assignments
FOR INSERT
WITH CHECK (
  auth.uid() = doctor_id 
  AND has_role(auth.uid(), 'doctor')
);

-- Doctors can update their own assignments
CREATE POLICY "Doctors can update their assignments"
ON public.doctor_patient_assignments
FOR UPDATE
USING (auth.uid() = doctor_id);

-- Doctors can delete their own assignments
CREATE POLICY "Doctors can delete their assignments"
ON public.doctor_patient_assignments
FOR DELETE
USING (auth.uid() = doctor_id);

-- Create a helper function to check doctor-patient assignment
CREATE OR REPLACE FUNCTION public.is_doctor_assigned_to_patient(p_doctor_id uuid, p_patient_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.doctor_patient_assignments
    WHERE doctor_id = p_doctor_id
      AND patient_id = p_patient_id
      AND is_active = true
  )
$$;

-- Drop the old overly permissive policy for patients table
DROP POLICY IF EXISTS "Doctors can view all patient records" ON public.patients;

-- Create new restrictive policy for doctors viewing patients
CREATE POLICY "Doctors can view assigned patient records"
ON public.patients
FOR SELECT
USING (
  auth.uid() = user_id 
  OR public.is_doctor_assigned_to_patient(auth.uid(), id)
);

-- Drop the old overly permissive update policy for patients
DROP POLICY IF EXISTS "Doctors can update all patient records" ON public.patients;

-- Create new restrictive update policy for doctors
CREATE POLICY "Doctors can update assigned patient records"
ON public.patients
FOR UPDATE
USING (
  auth.uid() = user_id 
  OR public.is_doctor_assigned_to_patient(auth.uid(), id)
);

-- Also update predictions table policies
DROP POLICY IF EXISTS "Doctors can view all predictions" ON public.predictions;

CREATE POLICY "Doctors can view assigned patient predictions"
ON public.predictions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM patients 
    WHERE patients.id = predictions.patient_id 
    AND (
      patients.user_id = auth.uid() 
      OR public.is_doctor_assigned_to_patient(auth.uid(), patients.id)
    )
  )
);

-- Update notifications policies for doctor assignments
DROP POLICY IF EXISTS "Doctors can create notifications" ON public.notifications;

CREATE POLICY "Doctors can create notifications for assigned patients"
ON public.notifications
FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  OR (
    has_role(auth.uid(), 'doctor') 
    AND (
      patient_id IS NULL 
      OR public.is_doctor_assigned_to_patient(auth.uid(), patient_id)
    )
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_doctor_patient_assignments_doctor ON public.doctor_patient_assignments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctor_patient_assignments_patient ON public.doctor_patient_assignments(patient_id);
CREATE INDEX IF NOT EXISTS idx_doctor_patient_assignments_active ON public.doctor_patient_assignments(doctor_id, patient_id) WHERE is_active = true;