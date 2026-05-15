// Official SOFA (Sequential Organ Failure Assessment) Score Calculator
// Based on the Third International Consensus Definitions for Sepsis (Sepsis-3)

import type { PatientData } from "@/types/patient";

export interface SOFAComponents {
  respiratory: number;   // PaO2/FiO2
  coagulation: number;   // Platelets
  liver: number;          // Bilirubin
  cardiovascular: number; // MAP + Vasopressors
  neurological: number;   // GCS
  renal: number;          // Creatinine or Urine output
}

export interface SOFAResult {
  total: number;
  components: SOFAComponents;
  stage: SepsisStage;
  stageLabel: string;
  stageDescription: string;
}

export type SepsisStage = 0 | 1 | 2 | 3;

/**
 * Calculate the Respiratory SOFA component
 * Based on PaO2/FiO2 ratio
 */
function calcRespiratoryScore(pao2?: number | null, fio2?: number | null, spo2?: number | null): number {
  if (pao2 && fio2 && fio2 > 0) {
    const ratio = pao2 / fio2;
    if (ratio < 100) return 4;
    if (ratio < 200) return 3;
    if (ratio < 300) return 2;
    if (ratio < 400) return 1;
    return 0;
  }
  // Fallback: estimate from SpO2 if PaO2/FiO2 not available
  if (spo2 !== null && spo2 !== undefined) {
    if (spo2 < 85) return 4;
    if (spo2 < 90) return 3;
    if (spo2 < 94) return 2;
    if (spo2 < 96) return 1;
    return 0;
  }
  return 0;
}

/**
 * Calculate the Coagulation SOFA component
 * Based on Platelet count (×10³/μL)
 */
function calcCoagulationScore(platelets?: number | null): number {
  if (platelets === null || platelets === undefined) return 0;
  // Convert to thousands if stored as absolute count
  const plt = platelets > 1000 ? platelets / 1000 : platelets;
  if (plt < 20) return 4;
  if (plt < 50) return 3;
  if (plt < 100) return 2;
  if (plt < 150) return 1;
  return 0;
}

/**
 * Calculate the Liver SOFA component
 * Based on Bilirubin (mg/dL)
 */
function calcLiverScore(bilirubin?: number | null): number {
  if (bilirubin === null || bilirubin === undefined) return 0;
  if (bilirubin >= 12) return 4;
  if (bilirubin >= 6) return 3;
  if (bilirubin >= 2) return 2;
  if (bilirubin >= 1.2) return 1;
  return 0;
}

/**
 * Calculate the Cardiovascular SOFA component
 * Based on MAP and Vasopressor use
 */
function calcCardiovascularScore(
  mapValue?: number | null,
  systolicBp?: number | null,
  diastolicBp?: number | null,
  vasopressorFlag?: boolean | null,
  vasopressorDose?: number | null
): number {
  // Calculate MAP if not directly provided
  let map = mapValue;
  if (!map && systolicBp && diastolicBp) {
    map = (systolicBp + 2 * diastolicBp) / 3;
  }

  if (vasopressorFlag) {
    const dose = vasopressorDose || 0;
    if (dose > 15) return 4; // High-dose vasopressor
    if (dose > 5) return 3;  // Moderate-dose
    return 2; // Low-dose vasopressor
  }

  if (map !== null && map !== undefined) {
    if (map < 70) return 1;
  }

  return 0;
}

/**
 * Calculate the Neurological SOFA component
 * Based on Glasgow Coma Scale (GCS)
 */
function calcNeurologicalScore(gcs?: number | null): number {
  if (gcs === null || gcs === undefined) return 0;
  if (gcs < 6) return 4;
  if (gcs < 10) return 3;
  if (gcs < 13) return 2;
  if (gcs < 15) return 1;
  return 0;
}

/**
 * Calculate the Renal SOFA component
 * Based on Creatinine (mg/dL) or Urine output (mL/day estimated from hourly)
 */
function calcRenalScore(creatinine?: number | null, urineOutput?: number | null): number {
  let score = 0;

  if (creatinine !== null && creatinine !== undefined) {
    if (creatinine >= 5.0) score = 4;
    else if (creatinine >= 3.5) score = 3;
    else if (creatinine >= 2.0) score = 2;
    else if (creatinine >= 1.2) score = 1;
  }

  // Urine output (provided as mL/hr from last hour)
  if (urineOutput !== null && urineOutput !== undefined) {
    const dailyEstimate = urineOutput * 24;
    let uoScore = 0;
    if (dailyEstimate < 200) uoScore = 4;
    else if (dailyEstimate < 500) uoScore = 3;
    // Use whichever is worse
    score = Math.max(score, uoScore);
  }

  return score;
}

/**
 * Calculate the full SOFA score from patient data
 */
export function calculateSOFA(patient: PatientData): SOFAResult {
  const components: SOFAComponents = {
    respiratory: calcRespiratoryScore(patient.pao2, patient.fio2, patient.spo2),
    coagulation: calcCoagulationScore(patient.platelet_count),
    liver: calcLiverScore(patient.bilirubin),
    cardiovascular: calcCardiovascularScore(
      patient.map_value,
      patient.systolic_bp,
      patient.diastolic_bp,
      patient.vasopressor_flag,
      patient.vasopressor_dose
    ),
    neurological: calcNeurologicalScore(patient.gcs),
    renal: calcRenalScore(patient.creatinine, patient.urine_output),
  };

  const total = Object.values(components).reduce((sum, v) => sum + v, 0);

  // Stage classification based on SOFA and shock criteria
  const stage = classifySepsisStage(total, patient);

  const stageLabels: Record<SepsisStage, string> = {
    0: "No Sepsis",
    1: "Early Sepsis",
    2: "Severe Sepsis",
    3: "Septic Shock",
  };

  const stageDescriptions: Record<SepsisStage, string> = {
    0: "SOFA < 2. No significant organ dysfunction detected.",
    1: "SOFA ≥ 2 and < 6. Early organ dysfunction — close monitoring recommended.",
    2: "SOFA 6–9. Multiple organ involvement — intervention required.",
    3: "SOFA ≥ 10 or vasopressor-dependent with lactate > 2. Critical condition requiring aggressive resuscitation.",
  };

  return {
    total,
    components,
    stage,
    stageLabel: stageLabels[stage],
    stageDescription: stageDescriptions[stage],
  };
}

/**
 * Classify sepsis stage based on SOFA score and shock criteria
 *
 * Stage 0: SOFA < 2
 * Stage 1: SOFA ≥ 2 and < 6
 * Stage 2: SOFA 6–9
 * Stage 3: SOFA ≥ 10 OR (vasopressor required AND lactate > 2)
 */
function classifySepsisStage(sofaTotal: number, patient: PatientData): SepsisStage {
  // Septic Shock check: vasopressor + lactate > 2
  const hasShockCriteria =
    patient.vasopressor_flag === true &&
    patient.lactate !== null &&
    patient.lactate !== undefined &&
    patient.lactate > 2;

  if (sofaTotal >= 10 || hasShockCriteria) return 3;
  if (sofaTotal >= 6) return 2;
  if (sofaTotal >= 2) return 1;
  return 0;
}

/**
 * Calculate MAP from systolic and diastolic blood pressure
 */
export function calculateMAP(systolic: number, diastolic: number): number {
  return Math.round(((systolic + 2 * diastolic) / 3) * 10) / 10;
}
