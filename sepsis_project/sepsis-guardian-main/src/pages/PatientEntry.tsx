import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MedicalReportUpload } from "@/components/patient/MedicalReportUpload";
import { MessagesInbox } from "@/components/messaging/MessagesInbox";
import {
  Activity,
  User,
  Heart,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  Upload,
  Droplets,
  Brain,
  Save,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import heroImage from "@/assets/hero-medical.jpg";
import {
  ML_FEATURE_KEYS,
  ML_FEATURE_LABELS,
  ML_FEATURE_PLACEHOLDERS,
  ML_FEATURE_GROUPS,
  type MLFeatureKey,
} from "@/lib/mlFeatureMapping";

type EntryMode = null | "upload" | "manual";

export default function PatientEntry() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [entryMode, setEntryMode] = useState<EntryMode>(null);
  const [uploadDone, setUploadDone] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingPatientId, setExistingPatientId] = useState<string | null>(null);
  const [prefillLoading, setPrefillLoading] = useState(true);

  // Page 1 data
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");

  // Page 2 data — ML features (all optional, keyed by exact ML feature name)
  const [mlFeatures, setMlFeatures] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const key of ML_FEATURE_KEYS) init[key] = "";
    return init;
  });

  // Prefill from most recent existing patient record (allows editing)
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setPrefillLoading(true);
      const { data } = await supabase
        .from("patients")
        .select("id, patient_name, phone, ml_features")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cancelled) return;

      if (data) {
        setExistingPatientId(data.id);
        setPatientName(data.patient_name || "");
        setPatientPhone(data.phone || "");
        if (data.ml_features && typeof data.ml_features === "object") {
          setMlFeatures((prev) => {
            const updated = { ...prev };
            for (const key of ML_FEATURE_KEYS) {
              const v = (data.ml_features as Record<string, any>)[key];
              if (v !== null && v !== undefined && v !== "") {
                updated[key] = String(v);
              }
            }
            return updated;
          });
        }
      }
      setPrefillLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleMLFeatureChange = (key: string, value: string) => {
    setMlFeatures((prev) => ({ ...prev, [key]: value }));
  };

  // Handle PDF extraction — map extracted values to ML feature keys
  const handleDataExtracted = (data: Record<string, string>) => {
    setMlFeatures((prev) => {
      const updated = { ...prev };
      for (const [key, value] of Object.entries(data)) {
        if (value && key in updated) {
          updated[key] = value;
        }
      }
      return updated;
    });
    // Also extract patient name if present
    if (data.patient_name) setPatientName(data.patient_name);
    setUploadDone(true);
  };

  const handleSubmit = async (status: "draft" | "submitted") => {
    if (!user) return;

    if (status === "submitted" && !patientName.trim()) {
      toast({
        title: "Patient Name Required",
        description: "Please enter the patient's name on Page 1.",
        variant: "destructive",
      });
      setCurrentStep(1);
      return;
    }

    if (patientPhone && patientPhone.length !== 10) {
      setPhoneError("Enter a valid 10-digit phone number");
      toast({
        title: "Invalid Phone Number",
        description: "Phone number must be exactly 10 digits.",
        variant: "destructive",
      });
      setCurrentStep(1);
      return;
    }

    setIsSubmitting(true);
    try {
      // Build ml_features JSONB — only non-empty values
      const mlFeaturesJson: Record<string, number | null> = {};
      for (const key of ML_FEATURE_KEYS) {
        const val = mlFeatures[key];
        if (val !== "" && val !== undefined && val !== null) {
          const num = parseFloat(val);
          mlFeaturesJson[key] = isNaN(num) ? null : num;
        } else {
          mlFeaturesJson[key] = null;
        }
      }

      // Map back to DB columns for backward compatibility
      const age = mlFeaturesJson.Age ?? 0;
      const genderNum = mlFeaturesJson.Gender;
      const gender = genderNum === 1 ? "male" : genderNum === 0 ? "female" : "unknown";

      const patientData: Record<string, any> = {
        user_id: user.id,
        patient_name: patientName.trim() || "-",
        phone: patientPhone.trim() || null,
        age: age,
        gender: gender,
        heart_rate: mlFeaturesJson.HR,
        systolic_bp: mlFeaturesJson.SBP,
        diastolic_bp: mlFeaturesJson.DBP,
        respiratory_rate: mlFeaturesJson.Resp,
        temperature: mlFeaturesJson.Temp,
        spo2: mlFeaturesJson.O2Sat,
        wbc_count: mlFeaturesJson.WBC,
        lactate: mlFeaturesJson.Lactate,
        creatinine: mlFeaturesJson.Creatinine,
        bilirubin: mlFeaturesJson.Bilirubin_total,
        platelet_count: mlFeaturesJson.Platelets,
        glucose: mlFeaturesJson.Glucose,
        fio2: mlFeaturesJson.FiO2,
        map_value: mlFeaturesJson.MAP,
        ml_features: mlFeaturesJson,
        status,
      };

      let error;
      if (existingPatientId) {
        // Update existing record (preserves doctor assignments, predictions, etc.)
        ({ error } = await supabase
          .from("patients")
          .update(patientData as any)
          .eq("id", existingPatientId)
          .eq("user_id", user.id));
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from("patients")
          .insert(patientData as any)
          .select("id")
          .single();
        error = insertError;
        if (inserted?.id) setExistingPatientId(inserted.id);
      }
      if (error) throw error;

      toast({
        title: status === "draft" ? "Draft Saved" : "Data Submitted",
        description: status === "draft"
          ? "Your patient data has been saved as a draft."
          : "Patient data has been submitted successfully for prediction.",
      });
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Error saving patient data:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to save patient data.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Activity className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const filledCount = ML_FEATURE_KEYS.filter((k) => mlFeatures[k] !== "").length;

  const steps = [
    { id: 1, title: "Patient Identity", icon: User },
    { id: 2, title: "Medical Reports", icon: Heart },
  ];

  // ==================== MODE SELECTION SCREEN ====================
  if (entryMode === null) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: `url(${heroImage})` }} />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
        </div>
        <Navbar />
        <main className="container py-12 md:py-20 max-w-4xl flex-1 relative z-10">
          <div className="mb-12 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="gradient-text">Patient Data Entry</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Do you have laboratory reports to upload? We can extract clinical values automatically.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <GlassCard
              className="p-8 cursor-pointer hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 group text-center"
              variant="elevated"
              onClick={() => setEntryMode("upload")}
            >
              <Upload className="h-16 w-16 text-primary mx-auto mb-6 group-hover:scale-110 transition-transform" />
              <h3 className="text-2xl font-semibold mb-3">Yes, I Have Reports</h3>
              <p className="text-muted-foreground">
                Upload your PDF or text reports and we'll extract clinical values automatically.
              </p>
            </GlassCard>
            <GlassCard
              className="p-8 cursor-pointer hover:border-secondary/50 hover:shadow-2xl hover:shadow-secondary/20 transition-all duration-300 group text-center"
              variant="elevated"
              onClick={() => setEntryMode("manual")}
            >
              <FileText className="h-16 w-16 text-secondary mx-auto mb-6 group-hover:scale-110 transition-transform" />
              <h3 className="text-2xl font-semibold mb-3">No, I'll Enter Manually</h3>
              <p className="text-muted-foreground">
                Fill in clinical values manually for sepsis risk assessment.
              </p>
            </GlassCard>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ==================== UPLOAD SCREEN ====================
  if (entryMode === "upload" && !uploadDone) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: `url(${heroImage})` }} />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
        </div>
        <Navbar />
        <main className="container py-12 md:py-20 max-w-4xl flex-1 relative z-10">
          <div className="mb-8">
            <Button variant="ghost" onClick={() => setEntryMode(null)} className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="gradient-text">Upload Medical Reports</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Upload your PDF or text reports. We'll extract only the ML-relevant clinical values.
            </p>
          </div>
          <MedicalReportUpload onDataExtracted={handleDataExtracted} />
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground mb-3">Changed your mind?</p>
            <Button variant="outline" onClick={() => setEntryMode("manual")}>
              Enter All Values Manually Instead
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ==================== MAIN 2-PAGE FORM ====================
  const renderPage1 = () => (
    <div className="space-y-8 animate-fade-in">
      <h2 className="text-2xl font-semibold flex items-center gap-3">
        <User className="h-7 w-7 text-primary" />
        Patient Identity
        <span className="text-sm text-destructive ml-3">* Required</span>
      </h2>
      <p className="text-muted-foreground">
        This information is for identification only and is NOT used by the ML model.
      </p>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-3">
          <Label htmlFor="patient_name" className="flex items-center gap-1 text-base">
            Patient Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="patient_name"
            placeholder="Enter patient name"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            className="h-14 text-lg"
          />
        </div>
        <div className="space-y-3">
          <Label htmlFor="patient_phone" className="text-base">
            Phone Number <span className="text-muted-foreground text-sm">(Optional — 10 digits)</span>
          </Label>
          <Input
            id="patient_phone"
            placeholder="e.g. 8599050535"
            value={patientPhone}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
              setPatientPhone(digits);
              if (digits.length > 0 && digits.length !== 10) {
                setPhoneError("Enter a valid 10-digit phone number");
              } else {
                setPhoneError("");
              }
            }}
            className={`h-14 text-lg ${phoneError ? "border-destructive" : ""}`}
            inputMode="numeric"
            maxLength={10}
          />
          {phoneError && (
            <p className="text-sm text-destructive">{phoneError}</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderPage2 = () => (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-semibold flex items-center gap-3">
          <Brain className="h-7 w-7 text-primary" />
          Medical Reports (ML Input)
        </h2>
        <span className="text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
          {filledCount}/{ML_FEATURE_KEYS.length} fields filled
        </span>
      </div>
      <p className="text-muted-foreground">
        All fields are optional. Missing values remain <code className="text-xs bg-muted px-1 py-0.5 rounded">null</code> — the ML model handles them automatically. Do NOT generate fake values.
      </p>

      {ML_FEATURE_GROUPS.map((group) => (
        <div key={group.title} className="space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2 border-b border-border pb-2">
            {group.title === "Vital Signs" && <Heart className="h-5 w-5 text-primary" />}
            {group.title === "Hematology" && <Droplets className="h-5 w-5 text-primary" />}
            {group.title === "Blood Gas & Electrolytes" && <Droplets className="h-5 w-5 text-secondary" />}
            {group.title === "Metabolic & Organ Function" && <Brain className="h-5 w-5 text-primary" />}
            {group.title === "Patient Demographics" && <User className="h-5 w-5 text-primary" />}
            {group.title}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {group.features.map((key) => {
              const hasValue = mlFeatures[key] !== "";
              return (
                <div key={key} className="space-y-1.5">
                  <Label htmlFor={`ml-${key}`} className="text-xs flex items-center gap-1" title={ML_FEATURE_LABELS[key]}>
                    <span className="truncate">{ML_FEATURE_LABELS[key]}</span>
                    {hasValue && <CheckCircle2 className="h-3 w-3 text-success flex-shrink-0" />}
                  </Label>
                  <Input
                    id={`ml-${key}`}
                    type="number"
                    step="any"
                    placeholder={ML_FEATURE_PLACEHOLDERS[key]}
                    value={mlFeatures[key]}
                    onChange={(e) => handleMLFeatureChange(key, e.target.value)}
                    className="h-10 text-sm"
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: `url(${heroImage})` }} />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
      </div>
      <Navbar />
      <main className="container py-12 md:py-20 max-w-6xl flex-1 relative z-10">
        <div className="mb-8">
          <Button variant="ghost" size="sm" onClick={() => {
            if (entryMode === "upload" && uploadDone) {
              setUploadDone(false);
            } else {
              setEntryMode(null);
            }
            setCurrentStep(1);
          }}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 mt-4">
            <span className="gradient-text">Patient Data Entry</span>
          </h1>
        </div>

        {profile?.role === "patient" && (
          <div className="mb-10">
            <MessagesInbox />
          </div>
        )}

        {/* Step Indicator */}
        <div className="mb-8 flex items-center gap-3">
          {steps.map((step, i) => (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => setCurrentStep(step.id)}
                className={`flex items-center gap-3 px-6 py-3.5 rounded-xl transition-all ${
                  currentStep === step.id
                    ? "bg-primary text-primary-foreground shadow-xl shadow-primary/30"
                    : currentStep > step.id
                    ? "bg-success/20 text-success border-2 border-success/30"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {currentStep > step.id ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <step.icon className="h-5 w-5" />
                )}
                <span className="text-base font-medium">{step.title}</span>
              </button>
              {i < steps.length - 1 && (
                <div className={`w-10 h-0.5 mx-2 ${currentStep > step.id ? "bg-success" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Form Content */}
        <GlassCard className="p-8 md:p-12 mb-8" variant="elevated">
          {currentStep === 1 ? renderPage1() : renderPage2()}
        </GlassCard>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(1)}
            disabled={currentStep === 1}
            className="w-full sm:w-auto h-14 px-8 text-lg"
          >
            <ArrowLeft className="h-5 w-5 mr-3" />
            Previous
          </Button>

          <div className="flex items-center gap-4 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => handleSubmit("draft")}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none h-14 px-8 text-lg"
            >
              <Save className="h-5 w-5 mr-3" />
              Save Draft
            </Button>

            {currentStep < 2 ? (
              <Button onClick={() => setCurrentStep(2)} className="flex-1 sm:flex-none h-14 px-8 text-lg">
                Next
                <ArrowRight className="h-5 w-5 ml-3" />
              </Button>
            ) : (
              <Button
                className="gradient-bg flex-1 sm:flex-none h-14 px-8 text-lg shadow-2xl shadow-primary/30"
                onClick={() => handleSubmit("submitted")}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Activity className="h-5 w-5 mr-3 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5 mr-3" />
                    Submit Data
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 p-4 rounded-lg bg-muted/30 border border-border/50 text-center">
          <p className="text-sm text-muted-foreground">
            ⚕️ <strong>Disclaimer:</strong> All fields are optional. Missing values remain null — the ML model handles them. Do not fabricate values.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
