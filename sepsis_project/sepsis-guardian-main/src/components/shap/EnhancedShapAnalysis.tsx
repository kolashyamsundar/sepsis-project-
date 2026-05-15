import { GlassCard } from "@/components/ui/GlassCard";
import { 
  Activity, 
  Apple, 
  Brain, 
  Heart, 
  Pill, 
  Shield, 
  Stethoscope,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  User
} from "lucide-react";

interface PatientData {
  patient_name: string;
  age: number;
  gender: string;
  lactate?: number | null;
  heart_rate?: number | null;
  temperature?: number | null;
  wbc_count?: number | null;
  creatinine?: number | null;
  spo2?: number | null;
  respiratory_rate?: number | null;
  systolic_bp?: number | null;
  platelet_count?: number | null;
  diabetes?: boolean;
  hypertension?: boolean;
  heart_disease?: boolean;
  kidney_disease?: boolean;
  liver_disease?: boolean;
  copd?: boolean;
  immunocompromised?: boolean;
}

interface EnhancedAnalysis {
  sepsisLevel: "none" | "early" | "moderate" | "severe" | "septic_shock";
  sepsisScore: number;
  riskFactors: string[];
  protectiveFactors: string[];
  dietRecommendations: {
    title: string;
    items: string[];
    avoid: string[];
  };
  lifestyleRecommendations: string[];
  meditationGuidance: {
    type: string;
    duration: string;
    frequency: string;
    benefits: string[];
  };
  doctorInsights: {
    clinicalSummary: string;
    keyFindings: string[];
    immediateActions: string[];
    monitoringPlan: string[];
    prognosticIndicators: string[];
  };
}

function analyzePatient(patient: PatientData): EnhancedAnalysis {
  let sepsisScore = 0;
  const riskFactors: string[] = [];
  const protectiveFactors: string[] = [];

  // SOFA-like scoring
  if (patient.lactate && patient.lactate > 2) {
    sepsisScore += patient.lactate > 4 ? 4 : 2;
    riskFactors.push(`Elevated lactate (${patient.lactate} mmol/L) indicates tissue hypoperfusion`);
  } else if (patient.lactate && patient.lactate <= 1.5) {
    protectiveFactors.push("Normal lactate levels suggest adequate tissue perfusion");
  }

  if (patient.heart_rate) {
    if (patient.heart_rate > 110) {
      sepsisScore += 2;
      riskFactors.push(`Tachycardia (${patient.heart_rate} bpm) suggests cardiovascular stress`);
    } else if (patient.heart_rate < 50) {
      sepsisScore += 3;
      riskFactors.push(`Bradycardia (${patient.heart_rate} bpm) may indicate cardiac dysfunction`);
    } else if (patient.heart_rate >= 60 && patient.heart_rate <= 100) {
      protectiveFactors.push("Heart rate within normal range");
    }
  }

  if (patient.systolic_bp && patient.systolic_bp < 90) {
    sepsisScore += 4;
    riskFactors.push(`Hypotension (${patient.systolic_bp} mmHg) - possible septic shock`);
  }

  if (patient.temperature) {
    if (patient.temperature > 38.3) {
      sepsisScore += 1;
      riskFactors.push(`Fever (${patient.temperature}°C) indicates active infection`);
    } else if (patient.temperature < 36) {
      sepsisScore += 2;
      riskFactors.push(`Hypothermia (${patient.temperature}°C) - concerning sign`);
    }
  }

  if (patient.wbc_count) {
    if (patient.wbc_count > 12000 || patient.wbc_count < 4000) {
      sepsisScore += 2;
      riskFactors.push(`Abnormal WBC (${patient.wbc_count}/μL) indicates immune response`);
    }
  }

  if (patient.creatinine && patient.creatinine > 1.5) {
    sepsisScore += 2;
    riskFactors.push(`Elevated creatinine (${patient.creatinine} mg/dL) - kidney dysfunction`);
  }

  if (patient.spo2 && patient.spo2 < 94) {
    sepsisScore += 2;
    riskFactors.push(`Low oxygen saturation (${patient.spo2}%) - hypoxemia`);
  } else if (patient.spo2 && patient.spo2 >= 95) {
    protectiveFactors.push("Adequate oxygen saturation");
  }

  if (patient.respiratory_rate && patient.respiratory_rate > 22) {
    sepsisScore += 1;
    riskFactors.push(`Tachypnea (${patient.respiratory_rate}/min)`);
  }

  if (patient.platelet_count && patient.platelet_count < 100000) {
    sepsisScore += 2;
    riskFactors.push(`Thrombocytopenia (${patient.platelet_count}/μL) - possible DIC`);
  }

  // Comorbidities
  if (patient.diabetes) riskFactors.push("Diabetes increases infection susceptibility");
  if (patient.immunocompromised) {
    sepsisScore += 2;
    riskFactors.push("Immunocompromised status increases sepsis risk significantly");
  }
  if (patient.heart_disease) riskFactors.push("Pre-existing heart disease complicates recovery");
  if (patient.kidney_disease) riskFactors.push("Chronic kidney disease affects drug clearance");

  // Age factor
  if (patient.age > 65) {
    sepsisScore += 1;
    riskFactors.push(`Advanced age (${patient.age}) increases mortality risk`);
  } else if (patient.age < 50) {
    protectiveFactors.push("Younger age is a favorable prognostic factor");
  }

  // Determine sepsis level
  let sepsisLevel: EnhancedAnalysis["sepsisLevel"];
  if (sepsisScore <= 2) sepsisLevel = "none";
  else if (sepsisScore <= 5) sepsisLevel = "early";
  else if (sepsisScore <= 8) sepsisLevel = "moderate";
  else if (sepsisScore <= 12) sepsisLevel = "severe";
  else sepsisLevel = "septic_shock";

  // Diet recommendations based on condition
  const dietRecommendations = {
    title: sepsisLevel === "none" ? "Preventive Nutrition" : "Recovery & Immune Support Diet",
    items: [
      "High-protein foods (lean meats, fish, eggs, legumes) for tissue repair",
      "Antioxidant-rich foods (berries, leafy greens, nuts) to reduce oxidative stress",
      "Omega-3 fatty acids (salmon, walnuts, flaxseed) for anti-inflammatory effects",
      "Probiotics (yogurt, kefir) to support gut microbiome",
      "Adequate hydration (2-3L water daily unless fluid restricted)",
      "Zinc-rich foods (pumpkin seeds, chickpeas) for immune function",
      "Vitamin C sources (citrus, bell peppers) for immune support",
    ],
    avoid: [
      "Processed and high-sugar foods (suppress immune function)",
      "Excessive salt (can worsen fluid retention)",
      "Alcohol (immunosuppressive and dehydrating)",
      "Raw or undercooked foods (infection risk)",
      "Caffeine in excess (can affect heart rate)",
    ],
  };

  // Lifestyle recommendations
  const lifestyleRecommendations = sepsisLevel === "none" || sepsisLevel === "early"
    ? [
        "Light physical activity as tolerated (walking 15-30 min daily)",
        "Adequate sleep (7-9 hours) for immune recovery",
        "Stress management through relaxation techniques",
        "Hand hygiene and infection prevention practices",
        "Regular monitoring of temperature and symptoms",
        "Avoid crowded places during recovery",
      ]
    : [
        "Complete bed rest with gradual mobility as approved by physician",
        "Deep breathing exercises to prevent respiratory complications",
        "Passive range of motion exercises to prevent clots",
        "Strict medication adherence",
        "Monitor and report any changes in symptoms immediately",
      ];

  // Meditation guidance
  const meditationGuidance = {
    type: sepsisLevel === "severe" || sepsisLevel === "septic_shock" 
      ? "Guided relaxation breathing" 
      : "Mindfulness meditation",
    duration: sepsisLevel === "none" || sepsisLevel === "early" ? "15-20 minutes" : "5-10 minutes",
    frequency: "2-3 times daily",
    benefits: [
      "Reduces cortisol levels and stress response",
      "Improves heart rate variability",
      "Supports immune system function",
      "Promotes better sleep quality",
      "Reduces anxiety about health condition",
    ],
  };

  // Doctor insights
  const doctorInsights = {
    clinicalSummary: generateClinicalSummary(patient, sepsisLevel, sepsisScore),
    keyFindings: riskFactors.slice(0, 5),
    immediateActions: getImmediateActions(sepsisLevel, patient),
    monitoringPlan: getMonitoringPlan(sepsisLevel),
    prognosticIndicators: getPrognosticIndicators(patient, sepsisLevel),
  };

  return {
    sepsisLevel,
    sepsisScore,
    riskFactors,
    protectiveFactors,
    dietRecommendations,
    lifestyleRecommendations,
    meditationGuidance,
    doctorInsights,
  };
}

function generateClinicalSummary(patient: PatientData, level: string, score: number): string {
  const levelDescriptions: Record<string, string> = {
    none: "No significant sepsis indicators present. Patient shows stable vital signs.",
    early: "Early sepsis indicators detected. Close monitoring recommended with preventive measures.",
    moderate: "Moderate sepsis with organ stress markers. Requires intervention and close monitoring.",
    severe: "Severe sepsis with multiple organ involvement. Immediate ICU-level care required.",
    septic_shock: "Septic shock criteria met. Critical condition requiring aggressive resuscitation.",
  };
  
  return `${patient.patient_name}, ${patient.age}y ${patient.gender}. SOFA-adapted score: ${score}. ${levelDescriptions[level]}`;
}

function getImmediateActions(level: string, patient: PatientData): string[] {
  const actions: Record<string, string[]> = {
    none: [
      "Continue routine monitoring",
      "Ensure adequate nutrition and hydration",
      "Address any underlying conditions",
    ],
    early: [
      "Initiate sepsis protocol screening",
      "Obtain blood cultures if not done",
      "Consider early antibiotic therapy if infection suspected",
      "Increase monitoring frequency to q4h",
    ],
    moderate: [
      "Activate sepsis bundle protocol",
      "Administer broad-spectrum antibiotics within 1 hour",
      "Initiate fluid resuscitation (30mL/kg crystalloid)",
      "Place central line for vasopressor access if needed",
      "Transfer to intermediate care unit",
    ],
    severe: [
      "ICU admission mandatory",
      "Aggressive fluid resuscitation with lactate-guided therapy",
      "Start vasopressors if MAP <65 despite fluids",
      "Consider mechanical ventilation support",
      "Continuous hemodynamic monitoring",
      "Nephrology consult for potential RRT",
    ],
    septic_shock: [
      "Maximum ICU support required",
      "Multi-vasopressor therapy as needed",
      "Stress-dose steroids (hydrocortisone 200mg/day)",
      "Consider ECMO if refractory hypoxemia",
      "Multidisciplinary critical care team involvement",
      "Family communication regarding prognosis",
    ],
  };
  
  return actions[level] || actions.none;
}

function getMonitoringPlan(level: string): string[] {
  const plans: Record<string, string[]> = {
    none: [
      "Vital signs every 8 hours",
      "Daily assessment of infection signs",
      "Weekly laboratory follow-up as needed",
    ],
    early: [
      "Vital signs every 4 hours",
      "Serial lactate every 6 hours",
      "Daily CBC, BMP, and liver function",
      "Urine output monitoring",
    ],
    moderate: [
      "Vital signs every 2 hours",
      "Lactate every 4-6 hours",
      "Continuous SpO2 monitoring",
      "Strict I/O with hourly urine output",
      "Daily procalcitonin levels",
    ],
    severe: [
      "Continuous vital signs monitoring",
      "Arterial line for continuous BP",
      "Lactate every 2-4 hours",
      "Central venous pressure monitoring",
      "Hourly urine output",
      "Serial organ function panels",
    ],
    septic_shock: [
      "Continuous invasive hemodynamic monitoring",
      "Cardiac output monitoring (if available)",
      "Hourly lactate until normalized",
      "Continuous renal replacement therapy monitoring",
      "Daily imaging as indicated",
      "Frequent neurological assessment",
    ],
  };
  
  return plans[level] || plans.none;
}

function getPrognosticIndicators(patient: PatientData, level: string): string[] {
  const indicators: string[] = [];
  
  if (patient.lactate) {
    if (patient.lactate < 2) indicators.push("✓ Lactate clearance favorable");
    else if (patient.lactate > 4) indicators.push("⚠ Elevated lactate - poor prognostic sign");
  }
  
  if (patient.age < 50) indicators.push("✓ Younger age improves prognosis");
  else if (patient.age > 75) indicators.push("⚠ Advanced age increases mortality risk");
  
  if (!patient.immunocompromised) indicators.push("✓ Intact immune system aids recovery");
  else indicators.push("⚠ Immunocompromised - higher complication risk");
  
  if (patient.platelet_count && patient.platelet_count > 150000) {
    indicators.push("✓ Normal platelets - no DIC evidence");
  }
  
  if (level === "none" || level === "early") {
    indicators.push("✓ Early detection improves outcomes significantly");
  }
  
  return indicators;
}

interface EnhancedShapAnalysisProps {
  patient: PatientData;
  className?: string;
}

export function EnhancedShapAnalysis({ patient, className }: EnhancedShapAnalysisProps) {
  const analysis = analyzePatient(patient);

  const sepsisLevelColors: Record<string, { bg: string; text: string; border: string }> = {
    none: { bg: "bg-success/10", text: "text-success", border: "border-success/30" },
    early: { bg: "bg-warning/10", text: "text-warning", border: "border-warning/30" },
    moderate: { bg: "bg-orange-500/10", text: "text-orange-500", border: "border-orange-500/30" },
    severe: { bg: "bg-danger/10", text: "text-danger", border: "border-danger/30" },
    septic_shock: { bg: "bg-destructive/10", text: "text-destructive", border: "border-destructive/30" },
  };

  const colors = sepsisLevelColors[analysis.sepsisLevel];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Sepsis Status Card */}
      <GlassCard className={`p-6 ${colors.bg} border-2 ${colors.border}`} variant="elevated">
        <div className="flex items-center gap-4 mb-4">
          <div className={`h-14 w-14 rounded-2xl ${colors.bg} flex items-center justify-center`}>
            <Activity className={`h-7 w-7 ${colors.text}`} />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Sepsis Status</h3>
            <p className={`text-2xl font-bold capitalize ${colors.text}`}>
              {analysis.sepsisLevel.replace("_", " ")}
            </p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-sm text-muted-foreground">SOFA Score</p>
            <p className={`text-3xl font-bold ${colors.text}`}>{analysis.sepsisScore}</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {analysis.doctorInsights.clinicalSummary}
        </p>
      </GlassCard>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Risk Factors */}
        <GlassCard className="p-6" variant="elevated">
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-danger" />
            Risk Factors ({analysis.riskFactors.length})
          </h3>
          <ul className="space-y-2">
            {analysis.riskFactors.map((factor, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <XCircle className="h-4 w-4 text-danger shrink-0 mt-0.5" />
                <span>{factor}</span>
              </li>
            ))}
            {analysis.riskFactors.length === 0 && (
              <p className="text-sm text-muted-foreground">No significant risk factors identified</p>
            )}
          </ul>
        </GlassCard>

        {/* Protective Factors */}
        <GlassCard className="p-6" variant="elevated">
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-success" />
            Protective Factors ({analysis.protectiveFactors.length})
          </h3>
          <ul className="space-y-2">
            {analysis.protectiveFactors.map((factor, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                <span>{factor}</span>
              </li>
            ))}
            {analysis.protectiveFactors.length === 0 && (
              <p className="text-sm text-muted-foreground">Limited protective factors identified</p>
            )}
          </ul>
        </GlassCard>
      </div>

      {/* Doctor Insights */}
      <GlassCard className="p-6" variant="elevated">
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Stethoscope className="h-5 w-5 text-primary" />
          Doctor's Clinical Insights
        </h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-2">Immediate Actions Required</h4>
            <ul className="space-y-2">
              {analysis.doctorInsights.immediateActions.map((action, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-xs font-medium text-primary">{i + 1}</span>
                  </div>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-2">Monitoring Plan</h4>
            <ul className="space-y-2">
              {analysis.doctorInsights.monitoringPlan.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Activity className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-border">
          <h4 className="font-medium text-sm text-muted-foreground mb-2">Prognostic Indicators</h4>
          <div className="flex flex-wrap gap-2">
            {analysis.doctorInsights.prognosticIndicators.map((indicator, i) => (
              <span 
                key={i} 
                className={`text-xs px-3 py-1.5 rounded-full ${
                  indicator.startsWith("✓") 
                    ? "bg-success/10 text-success" 
                    : "bg-warning/10 text-warning"
                }`}
              >
                {indicator}
              </span>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Diet Recommendations */}
      <GlassCard className="p-6" variant="elevated">
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Apple className="h-5 w-5 text-success" />
          {analysis.dietRecommendations.title}
        </h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-sm text-success mb-2">Recommended Foods</h4>
            <ul className="space-y-2">
              {analysis.dietRecommendations.items.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-sm text-danger mb-2">Foods to Avoid</h4>
            <ul className="space-y-2">
              {analysis.dietRecommendations.avoid.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <XCircle className="h-4 w-4 text-danger shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </GlassCard>

      {/* Meditation Guidance */}
      <GlassCard className="p-6" variant="elevated">
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Brain className="h-5 w-5 text-secondary" />
          Meditation & Relaxation Guidance
        </h3>
        
        <div className="grid md:grid-cols-3 gap-4 mb-4">
          <div className="p-4 rounded-lg bg-secondary/10">
            <p className="text-sm text-muted-foreground">Type</p>
            <p className="font-medium">{analysis.meditationGuidance.type}</p>
          </div>
          <div className="p-4 rounded-lg bg-secondary/10">
            <p className="text-sm text-muted-foreground">Duration</p>
            <p className="font-medium">{analysis.meditationGuidance.duration}</p>
          </div>
          <div className="p-4 rounded-lg bg-secondary/10">
            <p className="text-sm text-muted-foreground">Frequency</p>
            <p className="font-medium">{analysis.meditationGuidance.frequency}</p>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium text-sm text-muted-foreground mb-2">Benefits</h4>
          <div className="flex flex-wrap gap-2">
            {analysis.meditationGuidance.benefits.map((benefit, i) => (
              <span key={i} className="text-xs px-3 py-1.5 rounded-full bg-secondary/10 text-secondary">
                {benefit}
              </span>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Lifestyle Recommendations */}
      <GlassCard className="p-6" variant="elevated">
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Heart className="h-5 w-5 text-primary" />
          Lifestyle Recommendations
        </h3>
        <ul className="grid md:grid-cols-2 gap-3">
          {analysis.lifestyleRecommendations.map((rec, i) => (
            <li key={i} className="flex items-start gap-2 text-sm p-3 rounded-lg bg-muted/30">
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span>{rec}</span>
            </li>
          ))}
        </ul>
      </GlassCard>
    </div>
  );
}
