
-- Add DELETE policies for patients table
CREATE POLICY "Users can delete their own patient records"
ON public.patients FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Doctors can delete assigned patient records"
ON public.patients FOR DELETE
USING (public.is_doctor_assigned_to_patient(auth.uid(), id));

-- Add DELETE policy for predictions table
CREATE POLICY "Doctors can delete predictions"
ON public.predictions FOR DELETE
USING (public.has_role(auth.uid(), 'doctor'));

-- Add DELETE policy for doctor_messages table
CREATE POLICY "Users can delete their messages"
ON public.doctor_messages FOR DELETE
USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- Add DELETE policy for notifications table
CREATE POLICY "Users can delete their notifications"
ON public.notifications FOR DELETE
USING (auth.uid() = user_id);

-- Add DELETE policy for appointments table
CREATE POLICY "Doctors can delete appointments"
ON public.appointments FOR DELETE
USING (auth.uid() = doctor_id);
