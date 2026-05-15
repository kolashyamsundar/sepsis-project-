-- 1. Lock down user_roles: deny INSERT/UPDATE/DELETE for all clients (only service role bypasses RLS)
DROP POLICY IF EXISTS "Deny role inserts" ON public.user_roles;
DROP POLICY IF EXISTS "Deny role updates" ON public.user_roles;
DROP POLICY IF EXISTS "Deny role deletes" ON public.user_roles;

CREATE POLICY "Deny role inserts"
ON public.user_roles
FOR INSERT
TO authenticated, anon
WITH CHECK (false);

CREATE POLICY "Deny role updates"
ON public.user_roles
FOR UPDATE
TO authenticated, anon
USING (false)
WITH CHECK (false);

CREATE POLICY "Deny role deletes"
ON public.user_roles
FOR DELETE
TO authenticated, anon
USING (false);

-- 2. Remove overly-broad "Doctors can view unassigned patients" policy
DROP POLICY IF EXISTS "Doctors can view unassigned patients" ON public.patients;

-- 3. Restrict predictions DELETE to doctors assigned to that patient
DROP POLICY IF EXISTS "Doctors can delete predictions" ON public.predictions;

CREATE POLICY "Doctors can delete assigned predictions"
ON public.predictions
FOR DELETE
USING (
  has_role(auth.uid(), 'doctor'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.patients p
    WHERE p.id = predictions.patient_id
      AND public.is_doctor_assigned_to_patient(auth.uid(), p.id)
  )
);

-- 4. Restrict notifications INSERT: doctors can only notify their assigned patients
DROP POLICY IF EXISTS "Users can create notifications" ON public.notifications;

CREATE POLICY "Users can create notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  OR (
    has_role(auth.uid(), 'doctor'::app_role)
    AND patient_id IS NOT NULL
    AND public.is_doctor_assigned_to_patient(auth.uid(), patient_id)
    AND EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = patient_id AND p.user_id = notifications.user_id
    )
  )
);