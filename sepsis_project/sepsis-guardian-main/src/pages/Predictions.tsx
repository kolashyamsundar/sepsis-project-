import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Activity,
  Brain,
  Clock,
  AlertTriangle,
  User,
  ChevronRight,
  Loader2,
  Stethoscope,
  Shield,
  Download,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import heroImage from "@/assets/hero-medical.jpg";
import { buildMLPayload, dbPatientToMLFeatures, ML_FEATURE_KEYS, ML_FEATURE_LABELS, type MLFeatureKey } from "@/lib/mlFeatureMapping";
import { generateDiagnosticReport } from "@/lib/reportPdfGenerator";

interface Patient {
  id: string;
  patient_name: string;
  age: number;
  gender: string;
  status: string;
  created_at: string;
  user_id: string;
  ml_features: Record<string, any> | null;
  heart_rate: number | null;
  systolic_bp: number | null;
  diastolic_bp: number | null;
  respiratory_rate: number | null;
  temperature: number | null;
  spo2: number | null;
  lactate: number | null;
  wbc_count: number | null;
  creatinine: number | null;
  platelet_count: number | null;
  bilirubin: number | null;
  glucose: number | null;
  fio2: number | null;
  map_value: number | null;
}

interface MLPredictionResult {
  sepsis_probability: number;
  risk_level: string;
  warning?: string;
}

function getRiskDisplay(probability: number): { label: string; color: string; bgColor: string } {
  if (probability < 40) {
    return { label: "🟢 Low Sepsis Risk", color: "text-success", bgColor: "bg-success" };
  }
  if (probability < 60) {
    return { label: "🟡 Early Sepsis Symptoms", color: "text-warning", bgColor: "bg-warning" };
  }
  return { label: "🔴 Stage-1 Sepsis Risk", color: "text-destructive", bgColor: "bg-destructive" };
}

export default function Predictions() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [prediction, setPrediction] = useState<MLPredictionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  const [showLimitedDataDialog, setShowLimitedDataDialog] = useState(false);

  // Auth is handled by ProtectedRoute. Role check for doctor-only access:
  useEffect(() => {
    if (!authLoading && profile && profile.role !== "doctor") {
      navigate("/dashboard", { replace: true });
      toast({ title: "Access Denied", description: "Only doctors can access prediction features.", variant: "destructive" });
    }
  }, [authLoading, profile, navigate, toast]);

  useEffect(() => {
    if (user) fetchPatients();
  }, [user]);

  const fetchPatients = async () => {
    setIsLoading(true);
    try {
      const { data: assignments } = await supabase
        .from("doctor_patient_assignments")
        .select("patient_id")
        .eq("doctor_id", user!.id)
        .eq("is_active", true);

      const assignedIds = assignments?.map((a) => a.patient_id) || [];
      if (assignedIds.length === 0) { setPatients([]); setIsLoading(false); return; }

      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .in("id", assignedIds)
        .eq("status", "submitted")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPatients((data as any) || []);
    } catch (error) {
      console.error("Error fetching patients:", error);
      toast({ title: "Error", description: "Failed to load patients.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const getFilledFeatureCount = (patient: Patient): number => {
    const features = dbPatientToMLFeatures(patient as any);
    return Object.values(features).filter((v) => v !== "" && v !== undefined).length;
  };

  const runPrediction = async () => {
    if (!selectedPatientId) return;
    const patient = patients.find((p) => p.id === selectedPatientId);
    if (!patient) return;

    // Check how many features are filled
    const filledCount = getFilledFeatureCount(patient);
    if (filledCount < 5) {
      setShowLimitedDataDialog(true);
      return;
    }

    await executePrediction(patient);
  };

  const executePrediction = async (patient: Patient) => {
    setIsPredicting(true);
    setPrediction(null);
    setShowLimitedDataDialog(false);

    try {
      const features = dbPatientToMLFeatures(patient as any);
      const mlPayload = buildMLPayload(patient.patient_name, features);

     console.log("Sending to FastAPI:", mlPayload);

const response = await fetch("http://127.0.0.1:8000/predict", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(mlPayload),
});

const data = await response.json();

if (!response.ok) {
  throw new Error(data?.error || "Prediction failed");
}

      if (data?.error) {
        toast({ title: "Prediction Error", description: data.error, variant: "destructive" });
        setIsPredicting(false);
        return;
      }

      setPrediction(data as MLPredictionResult);
      await supabase.from("predictions").insert({
  patient_id: patient.id,
  mortality_probability: data.sepsis_probability,
  risk_level: data.risk_level.toLowerCase().includes("stage") ? "high" : data.risk_level.toLowerCase(),
  sepsis_stage: data.risk_level,
});
      toast({ title: "Prediction Complete", description: `Risk: ${data.risk_level}` });
    } catch (error: any) {
      console.error("Prediction error:", error);
      toast({
        title: "Prediction Failed",
        description: error?.message || "Could not connect to ML model. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPredicting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Activity className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);
  const riskDisplay = prediction ? getRiskDisplay(prediction.sepsis_probability) : null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: `url(${heroImage})` }} />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
      </div>
      <Navbar />

      <main className="container py-12 md:py-20 max-w-7xl flex-1 relative z-10">
        <div className="mb-12">
          <div className="flex items-center gap-5 mb-4">
            <div className="h-20 w-20 rounded-2xl gradient-bg flex items-center justify-center shadow-2xl shadow-primary/30">
              <Stethoscope className="h-10 w-10 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold">
                <span className="gradient-text">Sepsis Prediction</span>
              </h1>
              <p className="text-lg text-muted-foreground mt-2">
                Powered by Custom FastAPI XGBoost ML Model
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-10">
          {/* Patient Selection */}
          <GlassCard className="p-8 md:p-10" variant="elevated">
            <h2 className="text-2xl font-semibold mb-8 flex items-center gap-3">
              <User className="h-7 w-7 text-primary" />
              Select Patient
            </h2>

            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
            ) : patients.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <AlertTriangle className="h-20 w-20 mx-auto mb-6 opacity-30" />
                <p className="text-xl font-medium">No submitted patients found</p>
                <p className="text-base mt-2">Patients need to submit their data first.</p>
                <Button className="mt-8" variant="outline" onClick={() => navigate("/patient-entry")}>
                  Add Patient Data
                </Button>
              </div>
            ) : (
              <>
                <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                  <SelectTrigger className="mb-8 h-14 text-lg">
                    <SelectValue placeholder="Choose a patient..." />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id} className="text-base py-3">
                        {patient.patient_name} - Age {patient.age}, {patient.gender}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedPatient && (
                  <div className="space-y-4 p-6 rounded-xl bg-muted/30 border border-border/50 mb-8">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Name</span>
                        <p className="font-semibold">{selectedPatient.patient_name}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Age / Gender</span>
                        <p className="font-semibold">{selectedPatient.age}y / {selectedPatient.gender}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Submitted</span>
                        <p className="font-semibold">{new Date(selectedPatient.created_at).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">ML Features Filled</span>
                        <p className="font-semibold">{getFilledFeatureCount(selectedPatient)}/{ML_FEATURE_KEYS.length}</p>
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  className="w-full h-16 text-lg gradient-bg shadow-2xl shadow-primary/30"
                  disabled={!selectedPatientId || isPredicting}
                  onClick={runPrediction}
                >
                  {isPredicting ? (
                    <>
                      <Loader2 className="h-6 w-6 mr-3 animate-spin" />
                      Running ML Prediction...
                    </>
                  ) : (
                    <>
                      <Brain className="h-6 w-6 mr-3" />
                      Run AI Prediction
                    </>
                  )}
                </Button>
              </>
            )}
          </GlassCard>

          {/* Prediction Results */}
          <GlassCard className="p-8 md:p-10" variant="elevated">
            <h2 className="text-2xl font-semibold mb-8 flex items-center gap-3">
              <Brain className="h-7 w-7 text-secondary" />
              Prediction Results
            </h2>

            {isPredicting ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="relative">
                  <div className="h-36 w-36 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                  <Brain className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-16 w-16 text-primary" />
                </div>
                <p className="mt-10 text-xl font-medium">Analyzing patient data...</p>
                <p className="text-base text-muted-foreground mt-2">Sending to FastAPI ML model</p>
              </div>
            ) : prediction && riskDisplay ? (
              <div className="space-y-6">
                {/* Risk Level Banner */}
                <div className={`text-center py-6 rounded-xl ${riskDisplay.bgColor} text-white`}>
                  <p className="text-3xl font-bold">{riskDisplay.label}</p>
                </div>

                {/* Probability */}
                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <span className="text-lg text-muted-foreground">Sepsis Probability</span>
                    <span className="font-bold text-3xl">{prediction.sepsis_probability.toFixed(1)}%</span>
                  </div>
                  <div className="h-5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${riskDisplay.bgColor}`}
                      style={{ width: `${Math.min(prediction.sepsis_probability, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Model Risk Level */}
                <div className="flex justify-between items-center p-5 rounded-xl bg-muted/30 border border-border/50">
                  <span className="text-muted-foreground">Model Classification</span>
                  <span className={`text-lg font-semibold ${riskDisplay.color}`}>
                    {prediction.risk_level}
                  </span>
                </div>

                {/* Warning */}
                {prediction.warning && (
                  <div className="p-4 rounded-xl bg-warning/10 border border-warning/30">
                    <p className="text-sm flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                      <span className="text-warning">{prediction.warning}</span>
                    </p>
                  </div>
                )}

                {/* Timestamp */}
                <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Predicted at {new Date().toLocaleTimeString()}</span>
                </div>

                {/* ===== PREDICTION TRANSPARENCY ===== */}
                {selectedPatient && (() => {
                  const features = dbPatientToMLFeatures(selectedPatient as any);
                  // Use explicit undefined/empty check so legitimate "0" values
                  // (Gender=Female, Unit1/Unit2=No) are NOT treated as missing.
                  const isProvided = (k: MLFeatureKey) =>
                    features[k] !== undefined && features[k] !== null && features[k] !== "";
                  const provided = ML_FEATURE_KEYS.filter(isProvided);
                  const missing = ML_FEATURE_KEYS.filter((k) => !isProvided(k));
                  const allProvided = missing.length === 0;

                  return (
                    <div className="space-y-4 pt-2">
                      {/* Provided Values */}
                      <div className="rounded-xl border border-border/50 overflow-hidden">
                        <div className="px-4 py-3 bg-success/10 border-b border-border/50">
                          <h4 className="text-sm font-semibold flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-success" />
                            Prediction Based On Provided Values ({provided.length})
                          </h4>
                        </div>
                        <div className="p-4 grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                          {provided.map(k => (
                            <div key={k} className="flex justify-between text-xs px-2 py-1 rounded bg-muted/30">
                              <span className="text-muted-foreground truncate mr-2">{ML_FEATURE_LABELS[k]}</span>
                              <span className="font-medium shrink-0">{features[k]}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Missing Values or Complete Message */}
                      {allProvided ? (
                        <div className="p-4 rounded-xl bg-success/10 border border-success/30 text-center">
                          <p className="text-sm text-success font-medium flex items-center justify-center gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            All required inputs were provided. Prediction is based on complete patient data.
                          </p>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-border/50 overflow-hidden">
                          <div className="px-4 py-3 bg-warning/10 border-b border-border/50">
                            <h4 className="text-sm font-semibold flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-warning" />
                              Missing Inputs — Handled by Model ({missing.length})
                            </h4>
                          </div>
                          <div className="p-4 grid grid-cols-2 gap-2 max-h-36 overflow-y-auto">
                            {missing.map(k => (
                              <div key={k} className="text-xs px-2 py-1 rounded bg-muted/30 text-muted-foreground truncate">
                                {ML_FEATURE_LABELS[k]}
                              </div>
                            ))}
                          </div>
                          <div className="px-4 py-2 bg-muted/20 border-t border-border/50">
                            <p className="text-xs text-muted-foreground italic">
                              Missing values handled automatically by model (default/imputed)
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Action Buttons */}
                <div className="pt-4 space-y-3">
                  <Button
                    className="w-full h-14 text-lg gradient-bg shadow-lg"
                    onClick={async () => {
                      if (!selectedPatientId || !prediction) return;
                      try {
                        let dbRisk = "low";
                        if (prediction.sepsis_probability >= 60) dbRisk = "critical";
                        else if (prediction.sepsis_probability >= 40) dbRisk = "medium";

                        const { error } = await supabase
                          .from("patients")
                          .update({
                            published_risk_level: dbRisk,
                            published_mortality_probability: prediction.sepsis_probability,
                            published_sepsis_stage: prediction.risk_level,
                            published_by: user?.id,
                            published_at: new Date().toISOString(),
                            published_recommendations: JSON.stringify({
                              riskLevel: dbRisk,
                              probability: prediction.sepsis_probability,
                              stage: prediction.risk_level,
                              warning: prediction.warning || null,
                            }),
                          })
                          .eq("id", selectedPatientId);

                        if (error) throw error;

                        const patient = patients.find((p) => p.id === selectedPatientId);
                        if (patient) {
                          await supabase.from("notifications").insert({
                            user_id: patient.user_id,
                            title: "Health Status Updated",
                            message: `Your doctor has updated your health status. Risk: ${prediction.risk_level}`,
                            type: prediction.sepsis_probability >= 60 ? "emergency" : "info",
                            patient_id: selectedPatientId,
                          });
                        }

                        toast({ title: "Published to Patient", description: "Health status shared." });
                      } catch (error) {
                        console.error("Error publishing:", error);
                        toast({ title: "Error", description: "Failed to publish.", variant: "destructive" });
                      }
                    }}
                  >
                    <Shield className="h-5 w-5 mr-2" />
                    Publish to Patient
                  </Button>

                  <Button
                    className="w-full h-12"
                    variant="outline"
                    onClick={() => {
                      if (!selectedPatient || !prediction) return;
                      generateDiagnosticReport({
                        patient: selectedPatient as any,
                        prediction: {
                          probability: prediction.sepsis_probability,
                          riskLevel: prediction.risk_level,
                          warning: prediction.warning,
                        },
                        doctorName: profile?.full_name || undefined,
                      });
                      toast({ title: "PDF Downloaded", description: "Diagnostic report exported." });
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Diagnostic Report (PDF)
                  </Button>

                  <Button
                    className="w-full h-14 text-lg"
                    variant="outline"
                    onClick={() => navigate(`/shap?patient=${selectedPatientId}`)}
                  >
                    View SHAP Explainability Analysis
                    <ChevronRight className="h-5 w-5 ml-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Brain className="h-28 w-28 text-muted-foreground/20 mb-8" />
                <p className="text-xl font-medium text-muted-foreground">No prediction yet</p>
                <p className="text-base text-muted-foreground mt-3">
                  Select a patient and run the AI prediction
                </p>
              </div>
            )}
          </GlassCard>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 p-4 rounded-lg bg-muted/30 border border-border/50 text-center">
          <p className="text-sm text-muted-foreground">
            ⚕️ <strong>Disclaimer:</strong> This tool uses a custom ML model and does not replace physician judgment.
            Predictions are logged for audit purposes.
          </p>
        </div>
      </main>

      <Footer />

      {/* Limited Data Confirmation Dialog */}
      <Dialog open={showLimitedDataDialog} onOpenChange={setShowLimitedDataDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Limited Data Warning
            </DialogTitle>
            <DialogDescription>
              Prediction will be generated using limited reports. Accuracy may be affected. Continue?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowLimitedDataDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                const patient = patients.find((p) => p.id === selectedPatientId);
                if (patient) executePrediction(patient);
              }}
            >
              Continue Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
