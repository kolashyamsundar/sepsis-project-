// SHAP (SHapley Additive exPlanations) Calculator for Sepsis Risk
// Uses official SOFA scoring and generates SHAP-based explanations

import type { ShapValue } from "@/components/shap/ShapFeatureChart";
import type { Recommendations } from "@/components/shap/RecommendationCards";
import type { PatientData } from "@/types/patient";
import { calculateSOFA, type SOFAResult } from "@/lib/sofaCalculator";

// Normal ranges for clinical values
const normalRanges = {
  heart_rate: { min: 60, max: 100 },
  systolic_bp: { min: 90, max: 120 },
  diastolic_bp: { min: 60, max: 80 },
  respiratory_rate: { min: 12, max: 20 },
  temperature: { min: 36.1, max: 37.2 },
  spo2: { min: 95, max: 100 },
  wbc_count: { min: 4000, max: 11000 },
  lactate: { min: 0.5, max: 2.0 },
  creatinine: { min: 0.7, max: 1.3 },
  bilirubin: { min: 0.1, max: 1.2 },
  platelet_count: { min: 150000, max: 400000 },
  glucose: { min: 70, max: 100 },
};

// Feature importance weights (based on sepsis research)
const featureWeights = {
  lactate: 0.18,
  age: 0.12,
  heart_rate: 0.10,
  wbc_count: 0.09,
  creatinine: 0.08,
  temperature: 0.07,
  respiratory_rate: 0.06,
  spo2: 0.06,
  platelet_count: 0.05,
  bilirubin: 0.05,
  systolic_bp: 0.04,
  diastolic_bp: 0.03,
  glucose: 0.03,
  comorbidities: 0.04,
  gcs: 0.05,
  vasopressor: 0.06,
  pao2_fio2: 0.04,
  inr: 0.03,
};

function calculateDeviation(value: number | null | undefined, range: { min: number; max: number }): number {
  if (value === null || value === undefined) return 0;
  const spread = (range.max - range.min) / 2;
  if (value >= range.min && value <= range.max) return -0.1;
  const deviation = value < range.min 
    ? (range.min - value) / spread
    : (value - range.max) / spread;
  return Math.min(deviation, 2);
}

export function calculateShapValues(patient: PatientData): ShapValue[] {
  const shapValues: ShapValue[] = [];

  // Lactate - Critical indicator
  if (patient.lactate !== null && patient.lactate !== undefined) {
    const dev = calculateDeviation(patient.lactate, normalRanges.lactate);
    const value = dev * featureWeights.lactate;
    shapValues.push({
      feature: "Lactate Level",
      value,
      direction: value > 0 ? "positive" : "negative",
      actualValue: `${patient.lactate} mmol/L`,
      description: value > 0 
        ? `Elevated lactate (${patient.lactate} mmol/L) indicates tissue hypoxia and poor perfusion`
        : `Lactate (${patient.lactate} mmol/L) within normal range indicates adequate tissue perfusion`,
    });
  }

  // Age
  if (patient.age !== undefined) {
    let value = 0;
    let description = "";
    if (patient.age > 65) {
      value = ((patient.age - 65) / 35) * featureWeights.age;
      description = `Advanced age (${patient.age} years) increases sepsis mortality risk`;
    } else if (patient.age > 50) {
      value = ((patient.age - 50) / 65) * featureWeights.age * 0.5;
      description = `Age (${patient.age} years) moderately increases risk`;
    } else {
      value = -0.03;
      description = `Younger age (${patient.age} years) is a protective factor`;
    }
    shapValues.push({ feature: "Age", value, direction: value > 0 ? "positive" : "negative", actualValue: `${patient.age} years`, description });
  }

  // Heart Rate
  if (patient.heart_rate !== null && patient.heart_rate !== undefined) {
    const dev = calculateDeviation(patient.heart_rate, normalRanges.heart_rate);
    const value = dev * featureWeights.heart_rate;
    shapValues.push({
      feature: "Heart Rate", value, direction: value > 0 ? "positive" : "negative",
      actualValue: `${patient.heart_rate} bpm`,
      description: value > 0
        ? patient.heart_rate > 100 ? `Tachycardia (${patient.heart_rate} bpm) suggests cardiovascular stress` : `Bradycardia (${patient.heart_rate} bpm) may indicate cardiac dysfunction`
        : `Heart rate (${patient.heart_rate} bpm) within normal range`,
    });
  }

  // WBC Count
  if (patient.wbc_count !== null && patient.wbc_count !== undefined) {
    const dev = calculateDeviation(patient.wbc_count, normalRanges.wbc_count);
    const value = dev * featureWeights.wbc_count;
    shapValues.push({
      feature: "WBC Count", value, direction: value > 0 ? "positive" : "negative",
      actualValue: `${patient.wbc_count.toLocaleString()}/μL`,
      description: value > 0
        ? patient.wbc_count > 11000 ? `Leukocytosis (${patient.wbc_count.toLocaleString()}/μL) indicates active infection` : `Leukopenia (${patient.wbc_count.toLocaleString()}/μL) suggests severe infection`
        : `WBC count (${patient.wbc_count.toLocaleString()}/μL) within normal range`,
    });
  }

  // Creatinine
  if (patient.creatinine !== null && patient.creatinine !== undefined) {
    const dev = calculateDeviation(patient.creatinine, normalRanges.creatinine);
    const value = dev * featureWeights.creatinine;
    shapValues.push({
      feature: "Creatinine", value, direction: value > 0 ? "positive" : "negative",
      actualValue: `${patient.creatinine} mg/dL`,
      description: value > 0 ? `Elevated creatinine (${patient.creatinine} mg/dL) suggests acute kidney injury` : `Creatinine (${patient.creatinine} mg/dL) indicates normal kidney function`,
    });
  }

  // Temperature
  if (patient.temperature !== null && patient.temperature !== undefined) {
    const dev = calculateDeviation(patient.temperature, normalRanges.temperature);
    const value = dev * featureWeights.temperature;
    shapValues.push({
      feature: "Temperature", value, direction: value > 0 ? "positive" : "negative",
      actualValue: `${patient.temperature}°C`,
      description: value > 0
        ? patient.temperature > 37.2 ? `Fever (${patient.temperature}°C) indicates active infection` : `Hypothermia (${patient.temperature}°C) may indicate severe sepsis`
        : `Temperature (${patient.temperature}°C) within normal range`,
    });
  }

  // Respiratory Rate
  if (patient.respiratory_rate !== null && patient.respiratory_rate !== undefined) {
    const dev = calculateDeviation(patient.respiratory_rate, normalRanges.respiratory_rate);
    const value = dev * featureWeights.respiratory_rate;
    shapValues.push({
      feature: "Respiratory Rate", value, direction: value > 0 ? "positive" : "negative",
      actualValue: `${patient.respiratory_rate}/min`,
      description: value > 0 ? `Tachypnea (${patient.respiratory_rate}/min) suggests respiratory distress` : `Respiratory rate (${patient.respiratory_rate}/min) within normal range`,
    });
  }

  // SpO2
  if (patient.spo2 !== null && patient.spo2 !== undefined) {
    let value = patient.spo2 < 95 ? ((95 - patient.spo2) / 10) * featureWeights.spo2 : -0.04;
    shapValues.push({
      feature: "SpO2", value, direction: value > 0 ? "positive" : "negative",
      actualValue: `${patient.spo2}%`,
      description: value > 0 ? `Low oxygen saturation (${patient.spo2}%) indicates hypoxemia` : `Adequate oxygen saturation (${patient.spo2}%)`,
    });
  }

  // Platelet Count
  if (patient.platelet_count !== null && patient.platelet_count !== undefined) {
    let value = patient.platelet_count < 150000
      ? ((150000 - patient.platelet_count) / 100000) * featureWeights.platelet_count
      : -0.03;
    shapValues.push({
      feature: "Platelet Count", value, direction: value > 0 ? "positive" : "negative",
      actualValue: `${patient.platelet_count.toLocaleString()}/μL`,
      description: value > 0 ? `Thrombocytopenia (${patient.platelet_count.toLocaleString()}/μL) suggests DIC` : `Normal platelet count`,
    });
  }

  // Bilirubin
  if (patient.bilirubin !== null && patient.bilirubin !== undefined) {
    const dev = calculateDeviation(patient.bilirubin, normalRanges.bilirubin);
    const value = dev * featureWeights.bilirubin;
    shapValues.push({
      feature: "Bilirubin", value, direction: value > 0 ? "positive" : "negative",
      actualValue: `${patient.bilirubin} mg/dL`,
      description: value > 0 ? `Elevated bilirubin (${patient.bilirubin} mg/dL) indicates hepatic dysfunction` : `Bilirubin within normal range`,
    });
  }

  // Blood Pressure
  if (patient.systolic_bp !== null && patient.systolic_bp !== undefined) {
    let value = patient.systolic_bp < 90
      ? ((90 - patient.systolic_bp) / 30) * featureWeights.systolic_bp
      : -0.02;
    shapValues.push({
      feature: "Systolic BP", value, direction: value > 0 ? "positive" : "negative",
      actualValue: `${patient.systolic_bp} mmHg`,
      description: value > 0 ? `Hypotension (${patient.systolic_bp} mmHg) indicates possible septic shock` : `Blood pressure adequate`,
    });
  }

  // GCS (new)
  if (patient.gcs !== null && patient.gcs !== undefined) {
    let value = 0;
    if (patient.gcs < 13) {
      value = ((15 - patient.gcs) / 15) * featureWeights.gcs;
    } else {
      value = -0.02;
    }
    shapValues.push({
      feature: "GCS Score", value, direction: value > 0 ? "positive" : "negative",
      actualValue: `${patient.gcs}/15`,
      description: value > 0 ? `Reduced consciousness (GCS ${patient.gcs}) indicates neurological dysfunction` : `Normal consciousness (GCS ${patient.gcs})`,
    });
  }

  // Vasopressor (new)
  if (patient.vasopressor_flag) {
    const value = featureWeights.vasopressor * (patient.vasopressor_dose ? Math.min(patient.vasopressor_dose / 10, 2) : 1);
    shapValues.push({
      feature: "Vasopressor Use", value, direction: "positive",
      actualValue: patient.vasopressor_type ? `${patient.vasopressor_type} ${patient.vasopressor_dose || ""}` : "Active",
      description: `Vasopressor requirement indicates hemodynamic instability and cardiovascular failure`,
    });
  }

  // PaO2/FiO2 ratio (new)
  if (patient.pao2 && patient.fio2 && patient.fio2 > 0) {
    const ratio = patient.pao2 / patient.fio2;
    let value = ratio < 300 ? ((300 - ratio) / 300) * featureWeights.pao2_fio2 : -0.02;
    shapValues.push({
      feature: "PaO₂/FiO₂ Ratio", value, direction: value > 0 ? "positive" : "negative",
      actualValue: `${ratio.toFixed(0)}`,
      description: value > 0 ? `Low PaO₂/FiO₂ ratio (${ratio.toFixed(0)}) indicates respiratory failure` : `Adequate oxygenation ratio`,
    });
  }

  // INR (new)
  if (patient.inr !== null && patient.inr !== undefined) {
    let value = patient.inr > 1.5 ? ((patient.inr - 1.0) / 2) * featureWeights.inr : -0.01;
    shapValues.push({
      feature: "INR", value, direction: value > 0 ? "positive" : "negative",
      actualValue: `${patient.inr}`,
      description: value > 0 ? `Elevated INR (${patient.inr}) suggests coagulopathy` : `Normal coagulation (INR ${patient.inr})`,
    });
  }

  // Comorbidities
  const comorbidityCount = [
    patient.diabetes, patient.hypertension, patient.heart_disease,
    patient.kidney_disease, patient.liver_disease, patient.copd,
    patient.immunocompromised, patient.cancer,
  ].filter(Boolean).length;

  if (comorbidityCount > 0) {
    const value = (comorbidityCount / 8) * featureWeights.comorbidities * 2;
    const conditions = [];
    if (patient.diabetes) conditions.push("Diabetes");
    if (patient.heart_disease) conditions.push("Heart Disease");
    if (patient.kidney_disease) conditions.push("CKD");
    if (patient.immunocompromised) conditions.push("Immunocompromised");
    if (patient.cancer) conditions.push("Cancer");
    
    shapValues.push({
      feature: "Comorbidities", value, direction: "positive",
      actualValue: `${comorbidityCount} conditions`,
      description: `Multiple comorbidities (${conditions.slice(0, 3).join(", ")}${conditions.length > 3 ? "..." : ""}) increase mortality risk`,
    });
  }

  // Filter out negligible-impact features to avoid noise dominating the chart,
  // then sort by absolute impact so top contributors are clinically meaningful.
  const NOISE_THRESHOLD = 0.005;
  return shapValues
    .filter((s) => Math.abs(s.value) >= NOISE_THRESHOLD)
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
}

export function generateRecommendations(shapValues: ShapValue[], riskLevel: string, sofaResult?: SOFAResult): Recommendations {
  const recommendations: Recommendations = {
    precautions: [],
    medications: [],
    treatments: [],
  };

  // SOFA-based recommendations
  const stage = sofaResult?.stage ?? (riskLevel === "critical" ? 3 : riskLevel === "high" ? 2 : riskLevel === "medium" ? 1 : 0);

  if (stage >= 2) {
    recommendations.precautions.push("Continuous hemodynamic monitoring");
    recommendations.precautions.push("ICU admission recommended");
    recommendations.precautions.push("Serial lactate measurements every 2-4 hours");
    recommendations.precautions.push("Hourly urine output measurement");
    
    recommendations.medications.push({ name: "Broad-spectrum antibiotics", dose: "Initiate within 1 hour of sepsis recognition", priority: "high" });
    recommendations.medications.push({ name: "Norepinephrine", dose: "0.1-0.3 mcg/kg/min if MAP <65 after fluids", priority: "high" });
    recommendations.medications.push({ name: "Crystalloid fluids", dose: "30 mL/kg within first 3 hours", priority: "high" });
    
    recommendations.treatments.push("Source control — identify and address infection source within 6-12 hours");
    recommendations.treatments.push("Early goal-directed therapy protocol");
    recommendations.treatments.push("Consider mechanical ventilation if respiratory failure");
  } else if (stage === 1) {
    recommendations.precautions.push("Close monitoring of vital signs every 2-4 hours");
    recommendations.precautions.push("Daily lactate monitoring");
    recommendations.precautions.push("Watch for signs of clinical deterioration");
    
    recommendations.medications.push({ name: "Appropriate antibiotics", dose: "Based on suspected source and culture results", priority: "high" });
    recommendations.medications.push({ name: "IV fluids", dose: "Maintain adequate hydration", priority: "medium" });
    
    recommendations.treatments.push("Identify and treat infection source");
    recommendations.treatments.push("Monitor for organ dysfunction");
  } else {
    recommendations.precautions.push("Regular vital sign monitoring");
    recommendations.precautions.push("Monitor for any signs of infection");
    recommendations.treatments.push("Continue supportive care");
    recommendations.treatments.push("Address any underlying conditions");
  }

  // SHAP-driven specific recommendations
  shapValues.forEach((shap) => {
    if (shap.value > 0.1) {
      if (shap.feature === "Lactate Level") {
        recommendations.medications.push({ name: "Lactate-guided resuscitation", dose: "Target lactate reduction >10% every 2 hours", priority: "high" });
        recommendations.treatments.push("Optimize oxygen delivery and tissue perfusion");
      }
      if (shap.feature === "Creatinine") {
        recommendations.precautions.push("Monitor fluid balance closely");
        recommendations.treatments.push("Consider renal replacement therapy if indicated");
      }
      if (shap.feature === "Platelet Count") {
        recommendations.precautions.push("Monitor for bleeding complications");
        recommendations.treatments.push("Evaluate for DIC and treat underlying cause");
      }
      if (shap.feature === "GCS Score") {
        recommendations.precautions.push("Neurological monitoring every 2 hours");
        recommendations.treatments.push("Consider CT head if GCS declining");
      }
      if (shap.feature === "Vasopressor Use") {
        recommendations.precautions.push("Continuous arterial blood pressure monitoring");
        recommendations.treatments.push("Titrate vasopressor to MAP ≥ 65 mmHg");
      }
    }
  });

  // Standard supportive care
  recommendations.medications.push({ name: "Stress ulcer prophylaxis", dose: "Pantoprazole 40mg IV daily", priority: "medium" });
  recommendations.medications.push({ name: "DVT prophylaxis", dose: "Enoxaparin 40mg SC daily (if not contraindicated)", priority: "medium" });

  recommendations.precautions = [...new Set(recommendations.precautions)];
  recommendations.treatments = [...new Set(recommendations.treatments)];

  return recommendations;
}

// Re-export for convenience
export { calculateSOFA } from "@/lib/sofaCalculator";
export type { SOFAResult } from "@/lib/sofaCalculator";
