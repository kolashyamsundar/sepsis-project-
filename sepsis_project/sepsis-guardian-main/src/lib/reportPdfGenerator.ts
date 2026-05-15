import jsPDF from "jspdf";
import type { PatientData } from "@/types/patient";
import { ML_FEATURE_KEYS, ML_FEATURE_LABELS, dbPatientToMLFeatures, type MLFeatureKey } from "@/lib/mlFeatureMapping";

interface ReportData {
  patient: PatientData;
  prediction: {
    probability: number;
    riskLevel: string;
    warning?: string;
  };
  doctorName?: string;
}

const COLORS = {
  primary: [30, 58, 138] as [number, number, number],
  header: [15, 23, 42] as [number, number, number],
  text: [30, 41, 59] as [number, number, number],
  muted: [100, 116, 139] as [number, number, number],
  border: [203, 213, 225] as [number, number, number],
  green: [22, 163, 74] as [number, number, number],
  orange: [234, 88, 12] as [number, number, number],
  red: [220, 38, 38] as [number, number, number],
  lightBg: [241, 245, 249] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

function getRiskColor(prob: number): [number, number, number] {
  if (prob < 40) return COLORS.green;
  if (prob < 60) return COLORS.orange;
  return COLORS.red;
}

function getRiskLabel(prob: number): string {
  if (prob < 40) return "LOW RISK";
  if (prob < 60) return "MODERATE RISK";
  return "HIGH RISK";
}

function getSepsisDetection(prob: number): string {
  if (prob < 40) return "No Significant Sepsis Risk Detected";
  if (prob < 60) return "Early Sepsis Symptoms Detected";
  return "Stage-1 Sepsis Risk Detected";
}

function generateInterpretation(data: ReportData): string {
  const prob = data.prediction.probability.toFixed(1);
  if (data.prediction.probability < 40) {
    return `Based on the AI analysis of current physiological parameters, the patient presents a low probability (${prob}%) of sepsis. Vital signs and laboratory values are within acceptable ranges. Continued standard monitoring is recommended.`;
  }
  if (data.prediction.probability < 60) {
    return `The AI model indicates early sepsis symptoms with a moderate probability (${prob}%). Some clinical parameters show deviation from normal ranges. Enhanced monitoring and clinical reassessment are advised.`;
  }
  return `ALERT: The AI model indicates Stage-1 sepsis risk with a high probability (${prob}%). Multiple clinical parameters indicate significant concern. Immediate clinical intervention and aggressive management are strongly recommended.`;
}

function generateRecommendations(data: ReportData): string[] {
  if (data.prediction.probability < 40) {
    return [
      "Continue standard vital sign monitoring every 4-6 hours",
      "Maintain current treatment protocol",
      "Reassess clinical status in 12-24 hours",
      "Ensure adequate hydration and nutrition",
    ];
  }
  if (data.prediction.probability < 60) {
    return [
      "Increase monitoring frequency to every 2-4 hours",
      "Obtain blood cultures if not already done",
      "Consider empiric antibiotic therapy within 1 hour if infection suspected",
      "Initiate IV fluid resuscitation (30 mL/kg crystalloid)",
      "Serial lactate measurements every 2-4 hours",
      "Reassess within 6 hours for clinical deterioration",
    ];
  }
  return [
    "IMMEDIATE: Initiate Sepsis Bundle (Hour-1) protocols",
    "Obtain blood cultures before antibiotic administration",
    "Administer broad-spectrum IV antibiotics within 1 hour",
    "Begin aggressive IV fluid resuscitation (30 mL/kg crystalloid within 3 hours)",
    "Apply vasopressors if MAP < 65 mmHg despite fluid resuscitation",
    "Continuous hemodynamic monitoring and ICU admission",
    "Serial lactate monitoring every 2 hours until normalization",
    "Consult Infectious Disease and Critical Care teams",
  ];
}

export function generateDiagnosticReport(data: ReportData): void {
  const doc = new jsPDF("p", "mm", "a4");
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentW = pw - margin * 2;
  let y = 0;

  const setColor = (c: [number, number, number]) => doc.setTextColor(c[0], c[1], c[2]);
  const drawLine = (yPos: number, color = COLORS.border) => {
    doc.setDrawColor(color[0], color[1], color[2]);
    doc.setLineWidth(0.3);
    doc.line(margin, yPos, pw - margin, yPos);
  };
  const checkPage = (needed: number) => {
    if (y + needed > ph - 25) { doc.addPage(); y = 20; }
  };

  // ── HOSPITAL HEADER ──
  doc.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.rect(0, 0, pw, 38, "F");
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("AI Health Diagnostics Center", pw / 2, 14, { align: "center" });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Gayatri Vidya Parishad  |  +91 8599050535  |  shyamsundarkola2005@gmail.com", pw / 2, 22, { align: "center" });
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("SEPSIS RISK ASSESSMENT REPORT", pw / 2, 33, { align: "center" });
  y = 44;

  // ── PATIENT INFORMATION ──
  doc.setFillColor(COLORS.lightBg[0], COLORS.lightBg[1], COLORS.lightBg[2]);
  doc.rect(margin, y, contentW, 22, "F");
  doc.setDrawColor(COLORS.border[0], COLORS.border[1], COLORS.border[2]);
  doc.rect(margin, y, contentW, 22, "S");

  const col1 = margin + 4;
  const col2 = margin + contentW / 2 + 4;
  let iy = y + 6;

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  setColor(COLORS.primary);
  doc.text("PATIENT INFORMATION", col1, iy);
  iy += 6;

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  setColor(COLORS.text);
  doc.text("Patient Name:", col1, iy);
  doc.setFont("helvetica", "normal");
  doc.text(data.patient.patient_name, col1 + 28, iy);

  doc.setFont("helvetica", "bold");
  doc.text("Date & Time:", col2, iy);
  doc.setFont("helvetica", "normal");
  doc.text(new Date().toLocaleString(), col2 + 28, iy);

  iy += 5;
  doc.setFont("helvetica", "bold");
  doc.text("Age / Gender:", col1, iy);
  doc.setFont("helvetica", "normal");
  doc.text(`${data.patient.age} years / ${data.patient.gender}`, col1 + 28, iy);

  doc.setFont("helvetica", "bold");
  doc.text("Doctor:", col2, iy);
  doc.setFont("helvetica", "normal");
  doc.text(data.doctorName || "Attending Physician", col2 + 28, iy);

  y += 28;

  // ── CLINICAL PARAMETERS TABLE ──
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  setColor(COLORS.primary);
  doc.text("CLINICAL PARAMETERS SUMMARY", margin + 4, y);
  y += 4;

  doc.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.rect(margin, y, contentW, 6, "F");
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  const colWidths = [contentW * 0.35, contentW * 0.25, contentW * 0.4];
  doc.text("Parameter", margin + 3, y + 4);
  doc.text("Value", margin + colWidths[0] + 3, y + 4);
  doc.text("Reference Range", margin + colWidths[0] + colWidths[1] + 3, y + 4);
  y += 6;

  const params: [string, string | null, string][] = [
    ["Heart Rate", data.patient.heart_rate ? `${data.patient.heart_rate} bpm` : null, "60-100 bpm"],
    ["Temperature", data.patient.temperature ? `${data.patient.temperature} °C` : null, "36.1-37.2 °C"],
    ["Respiratory Rate", data.patient.respiratory_rate ? `${data.patient.respiratory_rate} /min` : null, "12-20 /min"],
    ["Blood Pressure", data.patient.systolic_bp && data.patient.diastolic_bp ? `${data.patient.systolic_bp}/${data.patient.diastolic_bp} mmHg` : null, "90/60-120/80 mmHg"],
    ["SpO₂", data.patient.spo2 ? `${data.patient.spo2}%` : null, "≥95%"],
    ["WBC Count", data.patient.wbc_count ? `${data.patient.wbc_count} /μL` : null, "4,000-11,000 /μL"],
    ["Lactate", data.patient.lactate ? `${data.patient.lactate} mmol/L` : null, "<2 mmol/L"],
    ["Creatinine", data.patient.creatinine ? `${data.patient.creatinine} mg/dL` : null, "0.6-1.2 mg/dL"],
    ["Bilirubin", data.patient.bilirubin ? `${data.patient.bilirubin} mg/dL` : null, "0.1-1.2 mg/dL"],
    ["Platelets", data.patient.platelet_count ? `${data.patient.platelet_count} ×10³/μL` : null, "150-400 ×10³/μL"],
    ["Glucose", data.patient.glucose ? `${data.patient.glucose} mg/dL` : null, "70-100 mg/dL"],
  ];

  const filteredParams = params.filter(([, val]) => val != null);
  doc.setFontSize(7);
  filteredParams.forEach(([name, value, ref], i) => {
    checkPage(5);
    if (i % 2 === 0) {
      doc.setFillColor(COLORS.lightBg[0], COLORS.lightBg[1], COLORS.lightBg[2]);
      doc.rect(margin, y, contentW, 5, "F");
    }
    doc.setFont("helvetica", "normal");
    setColor(COLORS.text);
    doc.text(name, margin + 3, y + 3.5);
    doc.setFont("helvetica", "bold");
    doc.text(String(value), margin + colWidths[0] + 3, y + 3.5);
    doc.setFont("helvetica", "normal");
    setColor(COLORS.muted);
    doc.text(ref, margin + colWidths[0] + colWidths[1] + 3, y + 3.5);
    y += 5;
  });

  if (filteredParams.length > 0) {
    doc.setDrawColor(COLORS.border[0], COLORS.border[1], COLORS.border[2]);
    doc.rect(margin, y - filteredParams.length * 5, contentW, filteredParams.length * 5, "S");
  }
  y += 6;

  // ── AI ANALYSIS RESULT ──
  checkPage(35);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  setColor(COLORS.primary);
  doc.text("AI ANALYSIS RESULT", margin + 4, y);
  y += 5;

  const riskColor = getRiskColor(data.prediction.probability);
  doc.setFillColor(riskColor[0], riskColor[1], riskColor[2]);
  doc.roundedRect(margin, y, contentW, 20, 2, 2, "F");
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text(getSepsisDetection(data.prediction.probability), pw / 2, y + 8, { align: "center" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Risk Level: ${getRiskLabel(data.prediction.probability)}  |  Probability: ${data.prediction.probability.toFixed(1)}%  |  Classification: ${data.prediction.riskLevel}`,
    pw / 2, y + 15, { align: "center" }
  );
  y += 26;

  // Warning from model
  if (data.prediction.warning) {
    checkPage(10);
    doc.setFillColor(255, 248, 240);
    doc.setDrawColor(COLORS.orange[0], COLORS.orange[1], COLORS.orange[2]);
    doc.roundedRect(margin, y, contentW, 8, 1, 1, "FD");
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    setColor(COLORS.orange);
    doc.text("⚠ MODEL WARNING: ", margin + 4, y + 5);
    doc.setFont("helvetica", "normal");
    setColor(COLORS.text);
    doc.text(data.prediction.warning, margin + 35, y + 5);
    y += 12;
  }

  // ── PROVIDED vs MISSING VALUES ──
  checkPage(30);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  setColor(COLORS.primary);
  doc.text("INPUT DATA TRANSPARENCY", margin + 4, y);
  y += 5;

  const features = dbPatientToMLFeatures(data.patient as any);
  const providedKeys = ML_FEATURE_KEYS.filter(k => features[k] !== undefined && features[k] !== "");
  const missingKeys = ML_FEATURE_KEYS.filter(k => !features[k] || features[k] === "");

  // Provided values
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  setColor(COLORS.green);
  doc.text(`Provided Values (${providedKeys.length}/${ML_FEATURE_KEYS.length}):`, margin + 4, y + 3);
  y += 5;
  doc.setFont("helvetica", "normal");
  setColor(COLORS.text);
  const providedText = providedKeys.map(k => `${ML_FEATURE_LABELS[k]}: ${features[k]}`).join("  |  ");
  const providedLines = doc.splitTextToSize(providedText || "None", contentW - 8);
  doc.text(providedLines, margin + 4, y + 3);
  y += providedLines.length * 3.5 + 3;

  // Missing values
  if (missingKeys.length > 0) {
    checkPage(10);
    doc.setFont("helvetica", "bold");
    setColor(COLORS.orange);
    doc.text(`Missing Values — Handled by Model (${missingKeys.length}):`, margin + 4, y + 3);
    y += 5;
    doc.setFont("helvetica", "normal");
    setColor(COLORS.muted);
    const missingText = missingKeys.map(k => ML_FEATURE_LABELS[k]).join(", ");
    const missingLines = doc.splitTextToSize(missingText, contentW - 8);
    doc.text(missingLines, margin + 4, y + 3);
    y += missingLines.length * 3.5 + 3;
  } else {
    doc.setFont("helvetica", "normal");
    setColor(COLORS.green);
    doc.text("All required inputs were provided. Prediction is based on complete patient data.", margin + 4, y + 3);
    y += 6;
  }
  y += 4;

  // ── CLINICAL INTERPRETATION ──
  checkPage(25);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  setColor(COLORS.primary);
  doc.text("CLINICAL INTERPRETATION", margin + 4, y);
  y += 5;

  doc.setFillColor(COLORS.lightBg[0], COLORS.lightBg[1], COLORS.lightBg[2]);
  const interpText = generateInterpretation(data);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  setColor(COLORS.text);
  const interpLines = doc.splitTextToSize(interpText, contentW - 8);
  const interpH = interpLines.length * 4 + 6;
  doc.roundedRect(margin, y, contentW, interpH, 1, 1, "F");
  doc.text(interpLines, margin + 4, y + 5);
  y += interpH + 4;

  // ── RECOMMENDATIONS ──
  checkPage(25);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  setColor(COLORS.primary);
  doc.text("RECOMMENDATIONS", margin + 4, y);
  y += 5;

  const recs = generateRecommendations(data);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  setColor(COLORS.text);
  recs.forEach((rec, i) => {
    checkPage(6);
    const lines = doc.splitTextToSize(`${i + 1}. ${rec}`, contentW - 10);
    doc.text(lines, margin + 4, y + 3);
    y += lines.length * 4 + 1;
  });
  y += 4;

  // ── DISCLAIMER ──
  checkPage(18);
  drawLine(y);
  y += 4;
  doc.setFillColor(255, 248, 240);
  doc.roundedRect(margin, y, contentW, 12, 1, 1, "F");
  doc.setDrawColor(COLORS.orange[0], COLORS.orange[1], COLORS.orange[2]);
  doc.roundedRect(margin, y, contentW, 12, 1, 1, "S");
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  setColor(COLORS.orange);
  doc.text("DISCLAIMER", margin + 4, y + 4);
  doc.setFont("helvetica", "normal");
  setColor(COLORS.text);
  doc.text("This report is AI-assisted and should not replace professional medical diagnosis. All clinical decisions", margin + 4, y + 8);
  doc.text("must be made by qualified healthcare professionals based on comprehensive patient evaluation.", margin + 4, y + 11);
  y += 18;

  // ── FOOTER ON ALL PAGES ──
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
    doc.setLineWidth(0.5);
    doc.line(margin, ph - 16, pw - margin, ph - 16);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    setColor(COLORS.muted);
    doc.text("Generated by: Sepsis AI Prediction System (S.E.P.S.I.S)", margin, ph - 12);
    doc.text(`Report Date: ${new Date().toLocaleString()}`, margin, ph - 8);
    doc.text(`Page ${i} of ${totalPages}`, pw - margin, ph - 12, { align: "right" });
    doc.setDrawColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
    doc.line(pw - margin - 50, ph - 10, pw - margin, ph - 10);
    doc.setFontSize(6);
    doc.text("Authorized Signature", pw - margin - 25, ph - 7, { align: "center" });
  }

  const safeName = data.patient.patient_name.replace(/\s+/g, "_");
  doc.save(`Sepsis_Report_${safeName}_${new Date().toISOString().slice(0, 10)}.pdf`);
}
