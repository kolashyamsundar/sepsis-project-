
-- Fix 1: Lock down password_reset_tokens table
DROP POLICY IF EXISTS "Anyone can create password reset tokens" ON public.password_reset_tokens;
DROP POLICY IF EXISTS "Service role can read tokens" ON public.password_reset_tokens;
DROP POLICY IF EXISTS "Service role can update tokens" ON public.password_reset_tokens;

CREATE POLICY "Deny all direct access to reset tokens"
ON public.password_reset_tokens
FOR ALL
USING (false)
WITH CHECK (false);

-- Fix 2: Add CHECK constraints with correct ranges for absolute counts
ALTER TABLE public.patients ADD CONSTRAINT valid_heart_rate
  CHECK (heart_rate IS NULL OR (heart_rate >= 0 AND heart_rate <= 300));
ALTER TABLE public.patients ADD CONSTRAINT valid_systolic_bp
  CHECK (systolic_bp IS NULL OR (systolic_bp >= 20 AND systolic_bp <= 300));
ALTER TABLE public.patients ADD CONSTRAINT valid_diastolic_bp
  CHECK (diastolic_bp IS NULL OR (diastolic_bp >= 10 AND diastolic_bp <= 200));
ALTER TABLE public.patients ADD CONSTRAINT valid_temperature
  CHECK (temperature IS NULL OR (temperature >= 25 AND temperature <= 45));
ALTER TABLE public.patients ADD CONSTRAINT valid_spo2
  CHECK (spo2 IS NULL OR (spo2 >= 0 AND spo2 <= 100));
ALTER TABLE public.patients ADD CONSTRAINT valid_respiratory_rate
  CHECK (respiratory_rate IS NULL OR (respiratory_rate >= 0 AND respiratory_rate <= 80));
ALTER TABLE public.patients ADD CONSTRAINT valid_wbc_count
  CHECK (wbc_count IS NULL OR (wbc_count >= 0 AND wbc_count <= 500000));
ALTER TABLE public.patients ADD CONSTRAINT valid_lactate
  CHECK (lactate IS NULL OR (lactate >= 0 AND lactate <= 30));
ALTER TABLE public.patients ADD CONSTRAINT valid_creatinine
  CHECK (creatinine IS NULL OR (creatinine >= 0 AND creatinine <= 30));
ALTER TABLE public.patients ADD CONSTRAINT valid_bilirubin
  CHECK (bilirubin IS NULL OR (bilirubin >= 0 AND bilirubin <= 50));
ALTER TABLE public.patients ADD CONSTRAINT valid_platelet_count
  CHECK (platelet_count IS NULL OR (platelet_count >= 0 AND platelet_count <= 5000000));
ALTER TABLE public.patients ADD CONSTRAINT valid_glucose
  CHECK (glucose IS NULL OR (glucose >= 0 AND glucose <= 2000));
ALTER TABLE public.patients ADD CONSTRAINT valid_gcs
  CHECK (gcs IS NULL OR (gcs >= 3 AND gcs <= 15));
ALTER TABLE public.patients ADD CONSTRAINT valid_age
  CHECK (age >= 0 AND age <= 150);
ALTER TABLE public.patients ADD CONSTRAINT valid_fio2
  CHECK (fio2 IS NULL OR (fio2 >= 21 AND fio2 <= 100));
ALTER TABLE public.patients ADD CONSTRAINT valid_pao2
  CHECK (pao2 IS NULL OR (pao2 >= 0 AND pao2 <= 700));
ALTER TABLE public.patients ADD CONSTRAINT notes_length
  CHECK (notes IS NULL OR LENGTH(notes) <= 5000);
ALTER TABLE public.patients ADD CONSTRAINT medications_length
  CHECK (current_medications IS NULL OR LENGTH(current_medications) <= 5000);
ALTER TABLE public.patients ADD CONSTRAINT allergies_length
  CHECK (allergies IS NULL OR LENGTH(allergies) <= 5000);
