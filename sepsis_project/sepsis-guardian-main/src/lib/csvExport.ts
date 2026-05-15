// CSV Export utility for patient clinical data

import type { PatientData } from "@/types/patient";
import type { SOFAResult } from "@/lib/sofaCalculator";

const CSV_COLUMNS = [
  "patient_id",
  "timestamp",
  "age",
  "sex",
  "weight",
  "suspected_source",
  "hr",
  "rr",
  "sbp",
  "dbp",
  "map",
  "temp",
  "spo2",
  "fio2",
  "gcs",
  "urine_output",
  "lactate",
  "wbc",
  "platelets",
  "creatinine",
  "bilirubin",
  "inr",
  "pao2",
  "vasopressor_flag",
  "vasopressor_type",
  "vasopressor_dose",
  "sofa_score",
  "sepsis_stage",
  "risk_level",
  "mortality_probability",
];

export function patientToCSVRow(
  patient: PatientData,
  sofa?: SOFAResult | null,
  prediction?: { riskLevel: string; probability: number } | null
): Record<string, string | number | boolean | null> {
  const map =
    patient.map_value ??
    (patient.systolic_bp && patient.diastolic_bp
      ? Math.round(((patient.systolic_bp + 2 * patient.diastolic_bp) / 3) * 10) / 10
      : null);

  return {
    patient_id: patient.id || "",
    timestamp: new Date().toISOString(),
    age: patient.age,
    sex: patient.gender,
    weight: patient.weight ?? "",
    suspected_source: patient.suspected_source ?? "",
    hr: patient.heart_rate ?? "",
    rr: patient.respiratory_rate ?? "",
    sbp: patient.systolic_bp ?? "",
    dbp: patient.diastolic_bp ?? "",
    map: map ?? "",
    temp: patient.temperature ?? "",
    spo2: patient.spo2 ?? "",
    fio2: patient.fio2 ?? "",
    gcs: patient.gcs ?? "",
    urine_output: patient.urine_output ?? "",
    lactate: patient.lactate ?? "",
    wbc: patient.wbc_count ?? "",
    platelets: patient.platelet_count ?? "",
    creatinine: patient.creatinine ?? "",
    bilirubin: patient.bilirubin ?? "",
    inr: patient.inr ?? "",
    pao2: patient.pao2 ?? "",
    vasopressor_flag: patient.vasopressor_flag ?? false,
    vasopressor_type: patient.vasopressor_type ?? "",
    vasopressor_dose: patient.vasopressor_dose ?? "",
    sofa_score: sofa?.total ?? patient.sofa_score ?? "",
    sepsis_stage: sofa?.stageLabel ?? "",
    risk_level: prediction?.riskLevel ?? "",
    mortality_probability: prediction?.probability ?? "",
  };
}

export function generateCSV(
  patients: PatientData[],
  sofaResults?: Map<string, SOFAResult>,
  predictions?: Map<string, { riskLevel: string; probability: number }>
): string {
  const header = CSV_COLUMNS.join(",");
  const rows = patients.map((p) => {
    const row = patientToCSVRow(
      p,
      sofaResults?.get(p.id || ""),
      predictions?.get(p.id || "")
    );
    return CSV_COLUMNS.map((col) => {
      const val = row[col];
      if (val === null || val === undefined || val === "") return "";
      if (typeof val === "string" && val.includes(",")) return `"${val}"`;
      return String(val);
    }).join(",");
  });

  return [header, ...rows].join("\n");
}

export function downloadCSV(csvContent: string, filename: string) {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
