
-- 1. Appointments table
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL,
  patient_id UUID NOT NULL REFERENCES public.patients(id),
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Patients can view their own appointments
CREATE POLICY "Patients can view their appointments"
ON public.appointments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM patients WHERE patients.id = patient_id AND patients.user_id = auth.uid()
  )
);

-- Doctors can view their appointments
CREATE POLICY "Doctors can view their appointments"
ON public.appointments FOR SELECT
USING (doctor_id = auth.uid());

-- Doctors can create appointments
CREATE POLICY "Doctors can create appointments"
ON public.appointments FOR INSERT
WITH CHECK (doctor_id = auth.uid() AND has_role(auth.uid(), 'doctor'::app_role));

-- Doctors can update their appointments
CREATE POLICY "Doctors can update appointments"
ON public.appointments FOR UPDATE
USING (doctor_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_appointments_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Add published health status fields to patients table
ALTER TABLE public.patients 
  ADD COLUMN published_risk_level TEXT,
  ADD COLUMN published_mortality_probability NUMERIC,
  ADD COLUMN published_sepsis_stage TEXT,
  ADD COLUMN published_recommendations JSONB,
  ADD COLUMN published_by UUID,
  ADD COLUMN published_at TIMESTAMP WITH TIME ZONE;

-- 3. Allow doctors to see unassigned patients (for new patients queue)
CREATE POLICY "Doctors can view unassigned patients"
ON public.patients FOR SELECT
USING (
  has_role(auth.uid(), 'doctor'::app_role) AND 
  NOT EXISTS (
    SELECT 1 FROM public.doctor_patient_assignments dpa 
    WHERE dpa.patient_id = id AND dpa.is_active = true
  )
);

-- 4. Enable realtime for appointments
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
