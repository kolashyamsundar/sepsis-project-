-- Create app role enum for user roles
CREATE TYPE public.app_role AS ENUM ('patient', 'doctor');

-- Create profiles table for storing user profile data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role app_role NOT NULL DEFAULT 'patient',
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create user_roles table for role-based access control
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles without recursion
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- User roles policies
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Create patients table for patient clinical data
CREATE TABLE public.patients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  age INTEGER NOT NULL,
  gender TEXT NOT NULL,
  admission_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Vital signs
  heart_rate DECIMAL,
  systolic_bp DECIMAL,
  diastolic_bp DECIMAL,
  respiratory_rate DECIMAL,
  temperature DECIMAL,
  spo2 DECIMAL,
  
  -- Lab values
  wbc_count DECIMAL,
  lactate DECIMAL,
  creatinine DECIMAL,
  bilirubin DECIMAL,
  platelet_count DECIMAL,
  glucose DECIMAL,
  
  -- Comorbidities
  diabetes BOOLEAN DEFAULT false,
  hypertension BOOLEAN DEFAULT false,
  heart_disease BOOLEAN DEFAULT false,
  kidney_disease BOOLEAN DEFAULT false,
  liver_disease BOOLEAN DEFAULT false,
  copd BOOLEAN DEFAULT false,
  immunocompromised BOOLEAN DEFAULT false,
  
  -- Medication history
  current_medications TEXT,
  allergies TEXT,
  notes TEXT,
  
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on patients
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Patient policies - patients can see their own data
CREATE POLICY "Users can view their own patient records"
  ON public.patients FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own patient records"
  ON public.patients FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own patient records"
  ON public.patients FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Doctors can view all patient records"
  ON public.patients FOR SELECT
  USING (public.has_role(auth.uid(), 'doctor'));

CREATE POLICY "Doctors can update all patient records"
  ON public.patients FOR UPDATE
  USING (public.has_role(auth.uid(), 'doctor'));

-- Create predictions table
CREATE TABLE public.predictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  predicted_by UUID REFERENCES auth.users(id),
  
  mortality_probability DECIMAL NOT NULL,
  risk_level TEXT NOT NULL,
  sepsis_stage TEXT,
  confidence DECIMAL,
  
  -- SHAP values stored as JSON
  shap_values JSONB,
  feature_contributions JSONB,
  
  recommendations JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on predictions
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;

-- Predictions policies
CREATE POLICY "Doctors can view all predictions"
  ON public.predictions FOR SELECT
  USING (public.has_role(auth.uid(), 'doctor'));

CREATE POLICY "Doctors can create predictions"
  ON public.predictions FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'doctor'));

CREATE POLICY "Patients can view their own predictions"
  ON public.predictions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.patients
      WHERE patients.id = predictions.patient_id
      AND patients.user_id = auth.uid()
    )
  );

-- Create function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, role, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'patient'),
    NEW.raw_user_meta_data->>'phone'
  );
  
  -- Also add to user_roles table
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'patient')
  );
  
  RETURN NEW;
END;
$$;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();