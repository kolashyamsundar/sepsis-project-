// Shared Patient type with all clinical fields (including new SOFA-related columns)
export interface PatientData {
  id?: string;
  user_id?: string;
  patient_name: string;
  age: number;
  gender: string;
  status?: string;
  created_at?: string;
  admission_date?: string | null;

  // Vital Signs
  heart_rate?: number | null;
  systolic_bp?: number | null;
  diastolic_bp?: number | null;
  respiratory_rate?: number | null;
  temperature?: number | null;
  spo2?: number | null;
  map_value?: number | null;

  // Lab Values
  wbc_count?: number | null;
  lactate?: number | null;
  creatinine?: number | null;
  bilirubin?: number | null;
  platelet_count?: number | null;
  glucose?: number | null;
  inr?: number | null;
  pao2?: number | null;
  fio2?: number | null;

  // New clinical fields
  weight?: number | null;
  gcs?: number | null;
  urine_output?: number | null;
  oxygen_support?: string | null;
  suspected_source?: string | null;

  // Vasopressor
  vasopressor_flag?: boolean | null;
  vasopressor_type?: string | null;
  vasopressor_dose?: number | null;

  // Comorbidities
  diabetes?: boolean;
  hypertension?: boolean;
  heart_disease?: boolean;
  kidney_disease?: boolean;
  liver_disease?: boolean;
  copd?: boolean;
  immunocompromised?: boolean;
  cancer?: boolean;

  // Medications
  current_medications?: string | null;
  allergies?: string | null;
  notes?: string | null;

  // SOFA
  sofa_score?: number | null;

  // Published fields
  published_risk_level?: string | null;
  published_mortality_probability?: number | null;
  published_sepsis_stage?: string | null;
  published_recommendations?: any;
  published_by?: string | null;
  published_at?: string | null;
}
