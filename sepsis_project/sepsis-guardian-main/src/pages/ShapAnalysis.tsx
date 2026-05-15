import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { ShapFeatureChart, FeatureExplanationList } from "@/components/shap/ShapFeatureChart";
import { PrecautionsCard, MedicationsCard, TreatmentsCard } from "@/components/shap/RecommendationCards";
import { EnhancedShapAnalysis } from "@/components/shap/EnhancedShapAnalysis";
import { PatientSummaryCard } from "@/components/shap/PatientSummaryCard";
import { ClinicalWaterfallChart } from "@/components/shap/ClinicalWaterfallChart";
import { CounterfactualAnalysis } from "@/components/shap/CounterfactualAnalysis";
import { ConfidenceBadge, computeConfidenceLevel } from "@/components/shap/ConfidenceBadge";
import { ShapExportPanel } from "@/components/shap/ShapExportPanel";
import { RiskGauge } from "@/components/visualizations/RiskGauge";
import { calculateShapValues, generateRecommendations } from "@/lib/shapCalculator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Activity,
  TrendingUp,
  Info,
  ChevronDown,
  ChevronUp,
  Brain,
  User,
  Loader2,
  AlertTriangle,
  RefreshCw,
  PlayCircle,
  FileWarning,
  ClipboardList,
  Stethoscope,
  Shield,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import heroImage from "@/assets/hero-medical.jpg";
import type { ShapValue } from "@/components/shap/ShapFeatureChart";
import type { Recommendations } from "@/components/shap/RecommendationCards";

interface Patient {
  id: string;
  patient_name: string;
  age: number;
  gender: string;
  heart_rate: number | null;
  systolic_bp: number | null;
  diastolic_bp: number | null;
  respiratory_rate: number | null;
  temperature: number | null;
  spo2: number | null;
  wbc_count: number | null;
  lactate: number | null;
  creatinine: number | null;
  bilirubin: number | null;
  platelet_count: number | null;
  glucose: number | null;
  diabetes: boolean;
  hypertension: boolean;
  heart_disease: boolean;
  kidney_disease: boolean;
  liver_disease: boolean;
  copd: boolean;
  immunocompromised: boolean;
  pao2: number | null;
  fio2: number | null;
  gcs: number | null;
  urine_output: number | null;
  vasopressor_flag: boolean | null;
  vasopressor_type: string | null;
  vasopressor_dose: number | null;
  map_value: number | null;
  weight: number | null;
  suspected_source: string | null;
  inr: number | null;
  user_id: string;
}

interface Prediction {
  id: string;
  patient_id: string;
  mortality_probability: number;
  risk_level: string;
  sepsis_stage: string;
  created_at: string;
}

const CLINICAL_FIELD_GROUPS = {
  "Vital Signs": [
    { key: "heart_rate", label: "Heart Rate" },
    { key: "systolic_bp", label: "Systolic BP" },
    { key: "diastolic_bp", label: "Diastolic BP" },
    { key: "respiratory_rate", label: "Respiratory Rate" },
    { key: "temperature", label: "Temperature" },
    { key: "spo2", label: "SpO₂" },
  ],
  "Laboratory Values": [
    { key: "wbc_count", label: "WBC Count" },
    { key: "lactate", label: "Lactate" },
    { key: "creatinine", label: "Creatinine" },
    { key: "bilirubin", label: "Bilirubin" },
    { key: "platelet_count", label: "Platelet Count" },
    { key: "glucose", label: "Glucose" },
  ],
  "Advanced Parameters": [
    { key: "pao2", label: "PaO₂" },
    { key: "fio2", label: "FiO₂" },
    { key: "gcs", label: "GCS Score" },
    { key: "urine_output", label: "Urine Output" },
    { key: "inr", label: "INR" },
    { key: "map_value", label: "MAP" },
    { key: "weight", label: "Weight" },
  ],
};

function getMissingFields(patient: Patient) {
  const missing: { group: string; fields: { key: string; label: string }[] }[] = [];
  for (const [group, fields] of Object.entries(CLINICAL_FIELD_GROUPS)) {
    const missingInGroup = fields.filter(
      (f) => patient[f.key as keyof Patient] === null || patient[f.key as keyof Patient] === undefined
    );
    if (missingInGroup.length > 0) {
      missing.push({ group, fields: missingInGroup });
    }
  }
  return missing;
}

function hasMinimalData(patient: Patient): boolean {
  let count = 0;
  if (patient.heart_rate) count++;
  if (patient.systolic_bp) count++;
  if (patient.temperature) count++;
  if (patient.lactate) count++;
  if (patient.creatinine) count++;
  if (patient.wbc_count) count++;
  if (patient.spo2) count++;
  if (patient.respiratory_rate) count++;
  return count >= 2;
}

function isDataComplete(patient: Patient): boolean {
  const allFields = Object.values(CLINICAL_FIELD_GROUPS).flat();
  const filledCount = allFields.filter(
    (f) => patient[f.key as keyof Patient] !== null && patient[f.key as keyof Patient] !== undefined
  ).length;
  return filledCount >= allFields.length * 0.7;
}

function getRiskHeadline(riskLevel: string, prob: number): string {
  if (riskLevel === "critical") return `Critical risk (${prob.toFixed(0)}%) — Immediate ICU review. Draw blood cultures and start empiric antibiotics within 1 hour.`;
  if (riskLevel === "high") return `High risk (${prob.toFixed(0)}%) — Urgent review recommended. Activate sepsis bundle protocol.`;
  if (riskLevel === "medium") return `Moderate risk (${prob.toFixed(0)}%) — Close monitoring required. Increase vital sign frequency to q4h.`;
  return `Low risk (${prob.toFixed(0)}%) — Continue routine monitoring and supportive care.`;
}

export default function ShapAnalysis() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const chartContainerRef = useRef<HTMLDivElement>(null);

  const [patients, setPatients] = useState<Patient[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>(searchParams.get("patient") || "");
  const [selectedPrediction, setSelectedPrediction] = useState<Prediction | null>(null);
  const [shapValues, setShapValues] = useState<ShapValue[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendations | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>("waterfall");
  const [isLoading, setIsLoading] = useState(false);
  const [forceRun, setForceRun] = useState(false);
  const [autoPredicting, setAutoPredicting] = useState(false);
  const analyzeReqIdRef = useRef(0);

  // Auth is handled by ProtectedRoute. Role check for doctor-only access:
  useEffect(() => {
    if (!loading && profile && profile.role !== "doctor") navigate("/dashboard", { replace: true });
  }, [loading, profile, navigate]);

  useEffect(() => {
    if (user) fetchPatientsWithPredictions();
  }, [user]);

  // Reset SHAP/prediction state immediately when the patient selection changes
  // to prevent stale data from a previous patient leaking into the new view.
  useEffect(() => {
    setSelectedPrediction(null);
    setShapValues([]);
    setRecommendations(null);
    setForceRun(false);
  }, [selectedPatientId]);

  useEffect(() => {
    if (selectedPatientId && patients.length > 0 && !autoPredicting) {
      const hasPrediction = !!predictions.find(p => p.patient_id === selectedPatientId);
      analyzePatient({ autoPredict: !hasPrediction });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPatientId, patients, predictions]);

  const fetchPatientsWithPredictions = async () => {
    setIsLoading(true);
    try {
      const { data: assignments } = await supabase
        .from("doctor_patient_assignments")
        .select("patient_id")
        .eq("doctor_id", user!.id)
        .eq("is_active", true);

      const assignedIds = assignments?.map(a => a.patient_id) || [];
      if (assignedIds.length === 0) {
        setPatients([]);
        setPredictions([]);
        setIsLoading(false);
        return;
      }

      const { data: patientsData, error: patientsError } = await supabase
        .from("patients")
        .select("*")
        .in("id", assignedIds)
        .eq("status", "submitted")
        .order("created_at", { ascending: false });

      if (patientsError) throw patientsError;
      setPatients(patientsData || []);

      const { data: predictionsData, error: predictionsError } = await supabase
        .from("predictions")
        .select("*")
        .in("patient_id", assignedIds)
        .order("created_at", { ascending: false });

      if (predictionsError) throw predictionsError;
      setPredictions(predictionsData || []);

      const urlPatientId = searchParams.get("patient");
      if (urlPatientId && patientsData?.find(p => p.id === urlPatientId)) {
        setSelectedPatientId(urlPatientId);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({ title: "Error", description: "Failed to load patient data.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-generate a prediction via the existing edge function if none exists.
  const ensurePredictionForPatient = async (patient: Patient): Promise<Prediction | null> => {
    try {
      const { dbPatientToMLFeatures, buildMLPayload } = await import("@/lib/mlFeatureMapping");
      const features = dbPatientToMLFeatures(patient as any);
      const mlPayload = buildMLPayload(patient.patient_name, features);

      const { data, error } = await supabase.functions.invoke("predict-sepsis", {
        body: { ml_payload: mlPayload, patient_id: patient.id },
      });
      if (error || data?.error) {
        console.error("Auto-predict failed:", error || data?.error);
        return null;
      }

      // Re-fetch newest prediction from DB (edge function inserted it)
      const { data: latest } = await supabase
        .from("predictions")
        .select("*")
        .eq("patient_id", patient.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latest) {
        setPredictions((prev) => [latest as Prediction, ...prev.filter(p => p.id !== (latest as any).id)]);
        return latest as Prediction;
      }
      return null;
    } catch (e) {
      console.error("ensurePredictionForPatient error:", e);
      return null;
    }
  };

  const analyzePatient = async (opts?: { autoPredict?: boolean }) => {
    const reqId = ++analyzeReqIdRef.current;
    const patient = patients.find(p => p.id === selectedPatientId);
    if (!patient) return;

    let prediction = predictions.find(p => p.patient_id === selectedPatientId) || null;

    // Auto-generate prediction if missing and requested (e.g., Run Anyway)
    if (!prediction && opts?.autoPredict) {
      setAutoPredicting(true);
      prediction = await ensurePredictionForPatient(patient);
      setAutoPredicting(false);
      // Race-condition guard: ignore if a newer analyze call started
      if (reqId !== analyzeReqIdRef.current) return;
    }

    setSelectedPrediction(prediction);

    // Compute SHAP from patient features. If no prediction exists, derive a
    // best-effort risk level so the waterfall/recommendations still render
    // (clearly labeled in UI as partial / unreliable when applicable).
    const shap = calculateShapValues(patient);
    const riskLevel = prediction?.risk_level || "medium";
    setShapValues(shap);
    const recs = generateRecommendations(shap, riskLevel);
    setRecommendations(recs);
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Activity className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const selectedPatient = patients.find(p => p.id === selectedPatientId);
  const missingFields = selectedPatient ? getMissingFields(selectedPatient) : [];
  const dataComplete = selectedPatient ? isDataComplete(selectedPatient) : false;
  const canRunPartial = selectedPatient ? hasMinimalData(selectedPatient) : false;
  const shouldShowAnalysis = selectedPatient && shapValues.length > 0 && (dataComplete || forceRun);
  const noPredictionWarning = selectedPatient && !selectedPrediction && shouldShowAnalysis;

  const currentProb = selectedPrediction?.mortality_probability || 0;
  const expectedValue = 0.15; // baseline
  const confidence = computeConfidenceLevel(shapValues);

  const clinicianSummary = selectedPatient && selectedPrediction
    ? `${selectedPatient.patient_name}, ${selectedPatient.age}y ${selectedPatient.gender}. ` +
      `Predicted mortality: ${currentProb.toFixed(1)}% (${selectedPrediction.risk_level} risk). ` +
      `Top contributors: ${shapValues.slice(0, 3).map(s => `${s.feature} (${s.actualValue})`).join(", ")}. ` +
      `Explanation confidence: ${confidence.level}.`
    : "";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: `url(${heroImage})` }} />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
        <div className="absolute inset-0 medical-grid opacity-30" />
      </div>

      <Navbar />

      <main className="container py-12 md:py-20 max-w-7xl flex-1 relative z-10">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-16 w-16 rounded-2xl gradient-bg flex items-center justify-center shadow-2xl shadow-primary/30">
              <Brain className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold">
                <span className="gradient-text">SHAP Explainability Analysis</span>
              </h1>
              <p className="text-lg text-muted-foreground mt-1">
                Clinician-grade explainability: what, why, how confident, and what to do
              </p>
            </div>
          </div>
        </div>

        {/* Patient Selection */}
        <GlassCard className="p-6 md:p-8 mb-8" variant="elevated">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-primary/20 flex items-center justify-center">
                <User className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Select Patient</h2>
                <p className="text-sm text-muted-foreground">Choose a patient for SHAP analysis</p>
              </div>
            </div>
            <div className="flex-1 w-full lg:max-w-md">
              {isLoading ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-muted-foreground">Loading patients...</span>
                </div>
              ) : patients.length === 0 ? (
                <div className="flex items-center gap-3 text-warning">
                  <AlertTriangle className="h-5 w-5" />
                  <span>No patients with predictions found</span>
                </div>
              ) : (
                <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select a patient..." />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.patient_name} - Age {patient.age}, {patient.gender}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </GlassCard>

        {/* Insufficient Data */}
        {selectedPatient && !dataComplete && !forceRun ? (
          <div className="space-y-6">
            <GlassCard className="p-8 md:p-10" variant="elevated">
              <div className="text-center mb-8">
                <FileWarning className="h-16 w-16 mx-auto text-warning/60 mb-4" />
                <h3 className="text-2xl font-semibold mb-2">Insufficient Data for Full Analysis</h3>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Below are the missing fields. Update them for a complete SHAP explainability report.
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {missingFields.map(({ group, fields }) => (
                  <div key={group} className="p-4 rounded-xl bg-warning/5 border border-warning/20">
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <ClipboardList className="h-4 w-4 text-warning" />
                      {group}
                    </h4>
                    <ul className="space-y-1">
                      {fields.map((f) => (
                        <li key={f.key} className="text-sm text-muted-foreground flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-warning inline-block" />
                          {f.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
                <Button className="h-12 px-6" onClick={() => navigate("/patient-entry")}>
                  <User className="h-4 w-4 mr-2" />
                  Update Patient Data (Doctor)
                </Button>
                <Button
                  className="h-12 px-6"
                  variant="outline"
                  onClick={() => {
                    if (selectedPatient) {
                      supabase.from("notifications").insert({
                        user_id: selectedPatient.user_id,
                        title: "Please Update Your Clinical Data",
                        message: `Your doctor has requested you to update missing clinical data fields.`,
                        type: "info",
                        patient_id: selectedPatient.id,
                      }).then(() => {
                        toast({ title: "Notification Sent", description: `${selectedPatient.patient_name} has been notified.` });
                      });
                    }
                  }}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Ask Patient to Update
                </Button>
              </div>

              {canRunPartial && (
                <div className="mt-8 pt-6 border-t border-border/50 text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    Run analysis with available data? Results may be less accurate.
                  </p>
                  <Button
                    variant="outline"
                    disabled={autoPredicting}
                    className="h-11 px-6 gap-2 border-primary/30 hover:bg-primary/10"
                    onClick={() => { setForceRun(true); analyzePatient({ autoPredict: true }); }}
                  >
                    {autoPredicting ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Generating prediction…</>
                    ) : (
                      <><PlayCircle className="h-4 w-4 text-primary" /> Run Anyway with Available Data</>
                    )}
                  </Button>
                </div>
              )}
            </GlassCard>
          </div>
        ) : shouldShowAnalysis ? (
          <div className="space-y-6" ref={chartContainerRef}>
            {/* Partial data warning */}
            {!dataComplete && forceRun && (
              <div className="p-3 rounded-lg bg-warning/10 border border-warning/30 flex items-start gap-3">
                <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                <p className="text-sm">
                  <strong>SHAP explanation may be less reliable due to missing inputs.</strong>{" "}
                  Some clinical fields are unavailable, so contributing factors are computed only from the data provided. Update missing fields for a more accurate explanation.
                </p>
              </div>
            )}

            {noPredictionWarning && (
              <div className="p-3 rounded-lg bg-warning/10 border border-warning/30 flex items-start gap-3">
                <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                <p className="text-sm">
                  <strong>No ML prediction yet.</strong> Showing feature-driven explanation only.{" "}
                  <button
                    className="underline text-primary"
                    onClick={() => analyzePatient({ autoPredict: true })}
                    disabled={autoPredicting}
                  >
                    {autoPredicting ? "Generating…" : "Generate prediction now"}
                  </button>
                </p>
              </div>
            )}
            {/* ===== TOP HEADER: Patient + Headline + Risk Gauge + Confidence ===== */}
            <GlassCard className="p-6 md:p-8" variant="elevated">
              <div className="flex flex-col lg:flex-row gap-6 items-start">
                {/* Left: headline */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    <Stethoscope className="h-6 w-6 text-primary shrink-0" />
                    <h2 className="text-xl font-bold">{selectedPatient.patient_name}</h2>
                    <span className="text-muted-foreground text-sm">
                      {selectedPatient.age}y • {selectedPatient.gender}
                    </span>
                  </div>

                  {/* Clinical headline */}
                  <div className={`p-4 rounded-xl border-2 mb-4 ${
                    (selectedPrediction?.risk_level === "critical") ? "bg-destructive/10 border-destructive/30 text-destructive" :
                    (selectedPrediction?.risk_level === "high") ? "bg-danger/10 border-danger/30 text-danger" :
                    (selectedPrediction?.risk_level === "medium") ? "bg-warning/10 border-warning/30 text-warning" :
                    "bg-success/10 border-success/30 text-success"
                  }`}>
                    <p className="font-semibold text-sm leading-relaxed">
                      {getRiskHeadline(selectedPrediction?.risk_level || "low", currentProb)}
                    </p>
                  </div>

                  {/* Confidence + Export */}
                  <div className="flex items-center gap-4 flex-wrap">
                    <ConfidenceBadge level={confidence.level} stabilityRatio={confidence.ratio} size="md" />
                    <ShapExportPanel
                      shapValues={shapValues}
                      patientName={selectedPatient.patient_name}
                      predictedProb={currentProb}
                      riskLevel={selectedPrediction?.risk_level || "unknown"}
                      containerRef={chartContainerRef}
                      clinicianSummary={clinicianSummary}
                    />
                  </div>
                </div>

                {/* Right: Risk Gauge */}
                <div className="shrink-0 flex flex-col items-center">
                  <RiskGauge value={currentProb} size={180} strokeWidth={14} />
                  <p className="text-xs text-muted-foreground mt-2 text-center">Mortality Probability</p>
                </div>
              </div>
            </GlassCard>

            {/* ===== NATURAL LANGUAGE SHAP SUMMARY ===== */}
            <GlassCard className="p-6 md:p-8" variant="elevated">
              <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
                <Brain className="h-5 w-5 text-primary" />
                What This Means (Plain Language)
              </h2>
              <div className="space-y-3">
                {shapValues.slice(0, 5).map((s, i) => {
                  const isTop3 = i < 3;
                  return (
                    <div
                      key={i}
                      className={`p-3 rounded-lg border ${
                        s.value > 0
                          ? isTop3 ? "bg-destructive/10 border-destructive/30" : "bg-destructive/5 border-destructive/20"
                          : isTop3 ? "bg-success/10 border-success/30" : "bg-success/5 border-success/20"
                      }`}
                    >
                      <p className={`text-sm font-medium ${s.value > 0 ? "text-destructive" : "text-success"}`}>
                        {s.value > 0 ? "⬆" : "⬇"} {s.description}
                      </p>
                      {isTop3 && (
                        <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                          Top {i + 1} contributor
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </GlassCard>

            {/* ===== MAIN LAYOUT: Left (waterfall) + Right (counterfactuals + confidence) ===== */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Left column: Waterfall + Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Waterfall Chart */}
                <GlassCard className="p-6 md:p-8" variant="elevated">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Feature Contributions (Waterfall)
                    </h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { analyzePatient(); toast({ title: "Analysis Refreshed" }); }}
                      className="gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Refresh
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Top contributors to predicted risk (positive = raises risk). Hover for clinical detail.
                  </p>
                  <ClinicalWaterfallChart
                    shapValues={shapValues}
                    expectedValue={expectedValue}
                    predictedProb={currentProb / 100}
                  />
                </GlassCard>

                {/* Feature Explanations (collapsible) */}
                <GlassCard className="p-6" variant="elevated">
                  <button className="w-full flex items-center justify-between" onClick={() => toggleSection("features")}>
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <Info className="h-5 w-5 text-primary" />
                      Detailed Feature Explanations
                    </h2>
                    {expandedSection === "features" ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                  </button>
                  {expandedSection === "features" && (
                    <div className="mt-6">
                      <FeatureExplanationList data={shapValues} />
                    </div>
                  )}
                </GlassCard>

                {/* Patient Summary + Enhanced Analysis (collapsible) */}
                <GlassCard className="p-6" variant="elevated">
                  <button className="w-full flex items-center justify-between" onClick={() => toggleSection("enhanced")}>
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      Comprehensive Clinical Analysis
                    </h2>
                    {expandedSection === "enhanced" ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                  </button>
                  {expandedSection === "enhanced" && (
                    <div className="mt-6 space-y-6">
                      <PatientSummaryCard patient={selectedPatient} />
                      <EnhancedShapAnalysis patient={selectedPatient} />
                    </div>
                  )}
                </GlassCard>
              </div>

              {/* Right column: Counterfactuals + Recommendations */}
              <div className="space-y-6">
                <CounterfactualAnalysis
                  patient={selectedPatient}
                  currentProb={currentProb}
                  confidenceLevel={confidence.level}
                />

                {recommendations && (
                  <>
                    <PrecautionsCard precautions={recommendations.precautions} />
                    <MedicationsCard medications={recommendations.medications} />
                    <TreatmentsCard treatments={recommendations.treatments} />
                  </>
                )}

                <Button className="w-full h-12" variant="outline" onClick={() => navigate("/predictions")}>
                  Back to Predictions
                </Button>
              </div>
            </div>

            {/* Safety disclaimer */}
            <div className="p-3 rounded-lg bg-muted/30 border border-border/50 text-center">
              <p className="text-xs text-muted-foreground">
                ⚕️ This tool supports clinical decision-making and does not replace physician judgment.
                Model version: SOFA-SHAP v1.0 • Generated: {new Date().toISOString().slice(0, 19)}
              </p>
            </div>
          </div>
        ) : selectedPatient ? (
          <GlassCard className="p-12 text-center" variant="elevated">
            <AlertTriangle className="h-20 w-20 mx-auto text-warning/50 mb-6" />
            <h3 className="text-2xl font-semibold mb-4">
              {predictions.find((p) => p.patient_id === selectedPatientId)
                ? "Not Enough Data to Analyze"
                : "No Prediction Available Yet"}
            </h3>
            <p className="text-muted-foreground mb-8">
              {predictions.find((p) => p.patient_id === selectedPatientId)
                ? "This patient needs at least basic vitals to run any analysis."
                : "Run a sepsis prediction for this patient first — SHAP explanations are derived from the model's actual output to ensure consistency."}
            </p>
            <Button
              className="h-12 px-8"
              onClick={() =>
                navigate(
                  predictions.find((p) => p.patient_id === selectedPatientId)
                    ? "/patient-entry"
                    : "/predictions"
                )
              }
            >
              {predictions.find((p) => p.patient_id === selectedPatientId)
                ? "Update Patient Data"
                : "Go to Predictions"}
            </Button>
          </GlassCard>
        ) : (
          <GlassCard className="p-12 text-center" variant="elevated">
            <Brain className="h-20 w-20 mx-auto text-muted-foreground/30 mb-6" />
            <h3 className="text-2xl font-semibold mb-4">No Analysis Available</h3>
            <p className="text-muted-foreground mb-8">
              Select a patient above to view their SHAP explainability analysis
            </p>
            <Button className="h-12 px-8" onClick={() => navigate("/predictions")}>
              Go to Predictions
            </Button>
          </GlassCard>
        )}
      </main>

      <Footer />
    </div>
  );
}
