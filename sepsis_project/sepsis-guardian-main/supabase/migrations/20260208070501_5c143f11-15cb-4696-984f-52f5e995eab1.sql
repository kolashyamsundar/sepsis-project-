
-- Fix the broken RLS policy for unassigned patients visibility
-- The bug: dpa.patient_id = dpa.id (self-reference) should be dpa.patient_id = patients.id
DROP POLICY IF EXISTS "Doctors can view unassigned patients" ON public.patients;

CREATE POLICY "Doctors can view unassigned patients"
ON public.patients FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'doctor'::app_role) 
  AND NOT EXISTS (
    SELECT 1 FROM public.doctor_patient_assignments dpa
    WHERE dpa.patient_id = patients.id AND dpa.is_active = true
  )
);

-- Fix notification insert: allow doctors to send notifications to any patient user
-- (needed when claiming unassigned patients)
DROP POLICY IF EXISTS "Doctors can create notifications for assigned patients" ON public.notifications;
DROP POLICY IF EXISTS "Users can create their own notifications" ON public.notifications;

CREATE POLICY "Users can create notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  OR has_role(auth.uid(), 'doctor'::app_role)
);
