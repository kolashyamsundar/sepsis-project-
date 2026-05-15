// ML Feature Mapping Layer
// Maps between DB/form fields and exact ML model feature names

export const ML_FEATURE_KEYS = [
  "HR", "O2Sat", "Temp", "SBP", "MAP", "DBP", "Resp",
  "EtCO2", "BaseExcess", "HCO3", "FiO2", "pH", "PaCO2", "SaO2",
  "AST", "BUN", "Alkalinephos", "Calcium", "Chloride", "Creatinine",
  "Bilirubin_direct", "Glucose", "Lactate", "Magnesium", "Phosphate",
  "Potassium", "Bilirubin_total", "TroponinI", "Hct", "Hgb",
  "PTT", "WBC", "Fibrinogen", "Platelets",
  "Age", "Gender", "Unit1", "Unit2", "HospAdmTime", "ICULOS",
] as const;

export type MLFeatureKey = typeof ML_FEATURE_KEYS[number];

// Mapping from DB column names to ML feature keys
const DB_TO_ML: Record<string, MLFeatureKey> = {
  heart_rate: "HR",
  spo2: "O2Sat",
  temperature: "Temp",
  systolic_bp: "SBP",
  map_value: "MAP",
  diastolic_bp: "DBP",
  respiratory_rate: "Resp",
  fio2: "FiO2",
  creatinine: "Creatinine",
  glucose: "Glucose",
  lactate: "Lactate",
  platelet_count: "Platelets",
  wbc_count: "WBC",
  bilirubin: "Bilirubin_total",
  age: "Age",
  // NOTE: PaO2 is intentionally NOT mapped here. PaCO2 is a different
  // measurement (carbon dioxide partial pressure) and mapping PaO2 → PaCO2
  // corrupts the ML input. PaCO2 should come from ml_features JSONB if set.
};

// UI-friendly labels for each ML feature (shown above input)
export const ML_FEATURE_LABELS: Record<MLFeatureKey, string> = {
  HR: "Heart Rate (bpm)",
  O2Sat: "Oxygen Saturation (%)",
  Temp: "Temperature (°C)",
  SBP: "Systolic BP (mmHg)",
  MAP: "Mean Arterial Pressure (mmHg)",
  DBP: "Diastolic BP (mmHg)",
  Resp: "Respiratory Rate (/min)",
  EtCO2: "End-Tidal CO₂ (mmHg)",
  BaseExcess: "Base Excess (mmol/L)",
  HCO3: "Bicarbonate (mmol/L)",
  FiO2: "Fraction of Inspired O₂",
  pH: "Blood pH",
  PaCO2: "PaCO₂ (mmHg)",
  SaO2: "Arterial O₂ Saturation (%)",
  AST: "AST (U/L)",
  BUN: "Blood Urea Nitrogen (mg/dL)",
  Alkalinephos: "Alkaline Phosphatase (U/L)",
  Calcium: "Calcium (mg/dL)",
  Chloride: "Chloride (mEq/L)",
  Creatinine: "Creatinine (mg/dL)",
  Bilirubin_direct: "Direct Bilirubin (mg/dL)",
  Glucose: "Glucose (mg/dL)",
  Lactate: "Lactate (mmol/L)",
  Magnesium: "Magnesium (mg/dL)",
  Phosphate: "Phosphate (mg/dL)",
  Potassium: "Potassium (mEq/L)",
  Bilirubin_total: "Total Bilirubin (mg/dL)",
  TroponinI: "Troponin I (ng/mL)",
  Hct: "Hematocrit (%)",
  Hgb: "Hemoglobin (g/dL)",
  PTT: "Partial Thromboplastin Time (sec)",
  WBC: "White Blood Cell Count (×10³/μL)",
  Fibrinogen: "Fibrinogen (mg/dL)",
  Platelets: "Platelets (×10³/μL)",
  Age: "Age (years)",
  Gender: "Gender (0=Female, 1=Male)",
  Unit1: "ICU Unit 1 (0/1)",
  Unit2: "ICU Unit 2 (0/1)",
  HospAdmTime: "Hours Since Hospital Admission",
  ICULOS: "ICU Length of Stay (hours)",
};

// Placeholder hints (reference ranges) shown inside input fields
export const ML_FEATURE_PLACEHOLDERS: Record<MLFeatureKey, string> = {
  HR: "Normal: 60–100",
  O2Sat: "Normal: 95–100",
  Temp: "Normal: 36.1–37.2",
  SBP: "Normal: 90–120",
  MAP: "Normal: 70–100",
  DBP: "Normal: 60–80",
  Resp: "Normal: 12–20",
  EtCO2: "Normal: 35–45",
  BaseExcess: "Normal: −2 to +2",
  HCO3: "Normal: 22–28",
  FiO2: "Typical: 21–100 (%)",
  pH: "Normal: 7.35–7.45",
  PaCO2: "Normal: 35–45",
  SaO2: "Normal: 95–100",
  AST: "Normal: 10–40",
  BUN: "Normal: 7–20",
  Alkalinephos: "Normal: 44–147",
  Calcium: "Normal: 8.6–10.2",
  Chloride: "Normal: 96–106",
  Creatinine: "Normal: 0.6–1.3",
  Bilirubin_direct: "Normal: 0.0–0.3",
  Glucose: "Normal: 70–140",
  Lactate: "Normal: 0.5–2.2",
  Magnesium: "Normal: 1.7–2.2",
  Phosphate: "Normal: 2.5–4.5",
  Potassium: "Normal: 3.5–5.0",
  Bilirubin_total: "Normal: 0.1–1.2",
  TroponinI: "Normal: <0.04",
  Hct: "Normal: 36–50",
  Hgb: "Normal: 12–17",
  PTT: "Normal: 25–35",
  WBC: "Normal: 4–11",
  Fibrinogen: "Normal: 200–400",
  Platelets: "Normal: 150–450",
  Age: "Example: 18–90",
  Gender: "0 = Female, 1 = Male",
  Unit1: "0 = No, 1 = Yes",
  Unit2: "0 = No, 1 = Yes",
  HospAdmTime: "Example: 0–240",
  ICULOS: "Example: 1–720",
};

// Feature groupings for the UI
export const ML_FEATURE_GROUPS = [
  {
    title: "Patient Demographics",
    features: ["Age", "Gender", "Unit1", "Unit2", "HospAdmTime", "ICULOS"] as MLFeatureKey[],
  },
  {
    title: "Vital Signs",
    features: ["HR", "O2Sat", "Temp", "SBP", "MAP", "DBP", "Resp", "EtCO2"] as MLFeatureKey[],
  },
  {
    title: "Blood Gas & Electrolytes",
    features: ["BaseExcess", "HCO3", "FiO2", "pH", "PaCO2", "SaO2", "Calcium", "Chloride", "Magnesium", "Phosphate", "Potassium"] as MLFeatureKey[],
  },
  {
    title: "Metabolic & Organ Function",
    features: ["AST", "BUN", "Alkalinephos", "Creatinine", "Bilirubin_direct", "Bilirubin_total", "Glucose", "Lactate", "TroponinI"] as MLFeatureKey[],
  },
  {
    title: "Hematology",
    features: ["Hct", "Hgb", "PTT", "WBC", "Fibrinogen", "Platelets"] as MLFeatureKey[],
  },
];

// Convert form values to ML API request body
export function buildMLPayload(
  patientName: string,
  features: Record<string, string>
): Record<string, any> {
  const payload: Record<string, any> = { patient_name: patientName };

  for (const key of ML_FEATURE_KEYS) {
    const val = features[key];
    if (val !== undefined && val !== null && val !== "") {
      payload[key] = parseFloat(val);
      if (isNaN(payload[key])) payload[key] = null;
    } else {
      payload[key] = null;
    }
  }

  return payload;
}

// Convert DB patient record to ML features object
export function dbPatientToMLFeatures(patient: Record<string, any>): Record<string, string> {
  const features: Record<string, string> = {};

  // If ml_features JSONB exists, use it directly
  if (patient.ml_features && typeof patient.ml_features === "object") {
    for (const key of ML_FEATURE_KEYS) {
      if (patient.ml_features[key] !== null && patient.ml_features[key] !== undefined) {
        features[key] = String(patient.ml_features[key]);
      }
    }
    return features;
  }

  // Fallback: map from DB columns
  for (const [dbCol, mlKey] of Object.entries(DB_TO_ML)) {
    if (patient[dbCol] !== null && patient[dbCol] !== undefined) {
      features[mlKey] = String(patient[dbCol]);
    }
  }

  // Gender conversion: male→1, female→0
  if (patient.gender) {
    features["Gender"] = patient.gender.toLowerCase() === "male" ? "1" : "0";
  }

  return features;
}

// Extract values from text for ML features (PDF extraction)
export function extractMLFeaturesFromText(text: string): Record<string, string> {
  const features: Record<string, string> = {};
  const lowerText = text.toLowerCase();

  const patterns: Record<string, RegExp[]> = {
    HR: [/(?:heart\s*rate|pulse|hr)[:\s]*(\d+(?:\.\d+)?)/gi, /(\d+)\s*bpm/gi],
    O2Sat: [/(?:spo2|oxygen\s*sat|o2\s*sat)[:\s]*(\d+(?:\.\d+)?)/gi],
    Temp: [/(?:temp|temperature)[:\s]*(\d+(?:\.\d+)?)/gi],
    SBP: [/(?:systolic|sbp)[:\s]*(\d+)/gi, /(?:bp|blood\s*pressure)[:\s]*(\d+)\s*\//gi],
    MAP: [/(?:map|mean\s*arterial)[:\s]*(\d+(?:\.\d+)?)/gi],
    DBP: [/(?:diastolic|dbp)[:\s]*(\d+)/gi, /(?:bp|blood\s*pressure)[:\s]*\d+\s*\/\s*(\d+)/gi],
    Resp: [/(?:respiratory\s*rate|rr|resp)[:\s]*(\d+)/gi],
    EtCO2: [/(?:etco2|end.?tidal)[:\s]*(\d+(?:\.\d+)?)/gi],
    BaseExcess: [/(?:base\s*excess|be)[:\s]*(-?\d+(?:\.\d+)?)/gi],
    HCO3: [/(?:hco3|bicarbonate)[:\s]*(\d+(?:\.\d+)?)/gi],
    FiO2: [/(?:fio2|fi\s*o2)[:\s]*(0?\.\d+|\d+(?:\.\d+)?)/gi],
    pH: [/(?:ph)[:\s]*(\d+(?:\.\d+)?)/gi],
    PaCO2: [/(?:paco2|pa\s*co2)[:\s]*(\d+(?:\.\d+)?)/gi],
    SaO2: [/(?:sao2|sa\s*o2)[:\s]*(\d+(?:\.\d+)?)/gi],
    AST: [/(?:ast|sgot)[:\s]*(\d+(?:\.\d+)?)/gi],
    BUN: [/(?:bun|blood\s*urea)[:\s]*(\d+(?:\.\d+)?)/gi],
    Alkalinephos: [/(?:alkaline\s*phos|alp|alk\s*phos)[:\s]*(\d+(?:\.\d+)?)/gi],
    Calcium: [/(?:calcium|ca)[:\s]*(\d+(?:\.\d+)?)/gi],
    Chloride: [/(?:chloride|cl)[:\s]*(\d+(?:\.\d+)?)/gi],
    Creatinine: [/(?:creatinine|cr)[:\s]*(\d+(?:\.\d+)?)/gi],
    Bilirubin_direct: [/(?:direct\s*bilirubin|dbili)[:\s]*(\d+(?:\.\d+)?)/gi],
    Glucose: [/(?:glucose|blood\s*sugar|bs)[:\s]*(\d+(?:\.\d+)?)/gi],
    Lactate: [/(?:lactate|lactic)[:\s]*(\d+(?:\.\d+)?)/gi],
    Magnesium: [/(?:magnesium|mg)[:\s]*(\d+(?:\.\d+)?)/gi],
    Phosphate: [/(?:phosphate|phos)[:\s]*(\d+(?:\.\d+)?)/gi],
    Potassium: [/(?:potassium|k\+?)[:\s]*(\d+(?:\.\d+)?)/gi],
    Bilirubin_total: [/(?:total\s*bilirubin|tbili|bilirubin)[:\s]*(\d+(?:\.\d+)?)/gi],
    TroponinI: [/(?:troponin\s*i|tni)[:\s]*(\d+(?:\.\d+)?)/gi],
    Hct: [/(?:hematocrit|hct)[:\s]*(\d+(?:\.\d+)?)/gi],
    Hgb: [/(?:hemoglobin|hgb|hb)[:\s]*(\d+(?:\.\d+)?)/gi],
    PTT: [/(?:ptt|aptt)[:\s]*(\d+(?:\.\d+)?)/gi],
    WBC: [/(?:wbc|white\s*blood|leukocyte)[:\s]*(\d+(?:,?\d+)?(?:\.\d+)?)/gi],
    Fibrinogen: [/(?:fibrinogen)[:\s]*(\d+(?:\.\d+)?)/gi],
    Platelets: [/(?:platelets?|plt)[:\s]*(\d+(?:,?\d+)?(?:\.\d+)?)/gi],
    Age: [/(?:age)[:\s]*(\d+)/gi],
    Gender: [/(?:sex|gender)[:\s]*(male|female|0|1)/gi],
  };

  for (const [key, pats] of Object.entries(patterns)) {
    for (const pat of pats) {
      pat.lastIndex = 0;
      const match = pat.exec(text);
      if (match && match[1]) {
        let val = match[1].trim().replace(/,/g, "");
        // Gender conversion
        if (key === "Gender") {
          val = val.toLowerCase() === "male" ? "1" : val.toLowerCase() === "female" ? "0" : val;
        }
        features[key] = val;
        break;
      }
    }
  }

  return features;
}
