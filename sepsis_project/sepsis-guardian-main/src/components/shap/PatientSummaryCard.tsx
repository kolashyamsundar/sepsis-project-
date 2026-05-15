import { GlassCard } from "@/components/ui/GlassCard";
import {
  User,
  Heart,
  Thermometer,
  Activity,
  Droplets,
  Wind,
  CircleDot,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Patient {
  patient_name: string;
  age: number;
  gender: string;
  heart_rate?: number | null;
  systolic_bp?: number | null;
  diastolic_bp?: number | null;
  respiratory_rate?: number | null;
  temperature?: number | null;
  spo2?: number | null;
  wbc_count?: number | null;
  lactate?: number | null;
  creatinine?: number | null;
  bilirubin?: number | null;
  platelet_count?: number | null;
  glucose?: number | null;
  diabetes?: boolean;
  hypertension?: boolean;
  heart_disease?: boolean;
  kidney_disease?: boolean;
  liver_disease?: boolean;
  copd?: boolean;
  immunocompromised?: boolean;
}

interface PatientSummaryCardProps {
  patient: Patient;
  className?: string;
}

function VitalIndicator({
  label,
  value,
  unit,
  icon: Icon,
  status,
}: {
  label: string;
  value: number | null | undefined;
  unit: string;
  icon: React.ElementType;
  status: "normal" | "warning" | "critical";
}) {
  if (value === null || value === undefined) return null;

  const statusColors = {
    normal: "bg-success/10 text-success border-success/30",
    warning: "bg-warning/10 text-warning border-warning/30",
    critical: "bg-destructive/10 text-destructive border-destructive/30",
  };

  return (
    <div
      className={cn(
        "p-3 rounded-lg border",
        statusColors[status]
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-4 w-4" />
        <span className="text-xs opacity-80">{label}</span>
      </div>
      <p className="font-bold text-lg">
        {value} <span className="text-xs font-normal opacity-70">{unit}</span>
      </p>
    </div>
  );
}

function getVitalStatus(
  value: number | null | undefined,
  ranges: { critical_low?: number; warning_low?: number; warning_high?: number; critical_high?: number }
): "normal" | "warning" | "critical" {
  if (value === null || value === undefined) return "normal";

  if (
    (ranges.critical_low !== undefined && value < ranges.critical_low) ||
    (ranges.critical_high !== undefined && value > ranges.critical_high)
  ) {
    return "critical";
  }

  if (
    (ranges.warning_low !== undefined && value < ranges.warning_low) ||
    (ranges.warning_high !== undefined && value > ranges.warning_high)
  ) {
    return "warning";
  }

  return "normal";
}

export function PatientSummaryCard({ patient, className }: PatientSummaryCardProps) {
  const comorbidities = [
    patient.diabetes && "Diabetes",
    patient.hypertension && "Hypertension",
    patient.heart_disease && "Heart Disease",
    patient.kidney_disease && "Kidney Disease",
    patient.liver_disease && "Liver Disease",
    patient.copd && "COPD",
    patient.immunocompromised && "Immunocompromised",
  ].filter(Boolean);

  return (
    <GlassCard className={cn("p-6", className)} variant="elevated">
      {/* Patient Header */}
      <div className="flex items-center gap-4 mb-6 pb-4 border-b border-border">
        <div className="h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center">
          <User className="h-8 w-8 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-2xl font-bold">{patient.patient_name}</h3>
          <p className="text-muted-foreground">
            {patient.age} years old • {patient.gender}
          </p>
        </div>
      </div>

      {/* Vitals Grid */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-muted-foreground mb-3">VITAL SIGNS</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <VitalIndicator
            label="Heart Rate"
            value={patient.heart_rate}
            unit="bpm"
            icon={Heart}
            status={getVitalStatus(patient.heart_rate, {
              critical_low: 45,
              warning_low: 55,
              warning_high: 110,
              critical_high: 130,
            })}
          />
          <VitalIndicator
            label="Temperature"
            value={patient.temperature}
            unit="°C"
            icon={Thermometer}
            status={getVitalStatus(patient.temperature, {
              critical_low: 35,
              warning_low: 36,
              warning_high: 38.3,
              critical_high: 39,
            })}
          />
          <VitalIndicator
            label="SpO2"
            value={patient.spo2}
            unit="%"
            icon={Activity}
            status={getVitalStatus(patient.spo2, {
              critical_low: 90,
              warning_low: 94,
            })}
          />
          <VitalIndicator
            label="Lactate"
            value={patient.lactate}
            unit="mmol/L"
            icon={Droplets}
            status={getVitalStatus(patient.lactate, {
              warning_high: 2,
              critical_high: 4,
            })}
          />
          <VitalIndicator
            label="Respiratory Rate"
            value={patient.respiratory_rate}
            unit="/min"
            icon={Wind}
            status={getVitalStatus(patient.respiratory_rate, {
              warning_high: 22,
              critical_high: 30,
            })}
          />
          {patient.systolic_bp && patient.diastolic_bp && (
            <div
              className={cn(
                "p-3 rounded-lg border",
                getVitalStatus(patient.systolic_bp, {
                  critical_low: 90,
                  warning_low: 100,
                }) === "critical"
                  ? "bg-destructive/10 text-destructive border-destructive/30"
                  : getVitalStatus(patient.systolic_bp, {
                      critical_low: 90,
                      warning_low: 100,
                    }) === "warning"
                  ? "bg-warning/10 text-warning border-warning/30"
                  : "bg-success/10 text-success border-success/30"
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <CircleDot className="h-4 w-4" />
                <span className="text-xs opacity-80">Blood Pressure</span>
              </div>
              <p className="font-bold text-lg">
                {patient.systolic_bp}/{patient.diastolic_bp}{" "}
                <span className="text-xs font-normal opacity-70">mmHg</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Lab Values */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-muted-foreground mb-3">LAB VALUES</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-sm">
          {patient.wbc_count && (
            <div className="flex justify-between p-2 rounded bg-muted/30">
              <span className="text-muted-foreground">WBC Count</span>
              <span className="font-medium">{patient.wbc_count.toLocaleString()}/μL</span>
            </div>
          )}
          {patient.creatinine && (
            <div className="flex justify-between p-2 rounded bg-muted/30">
              <span className="text-muted-foreground">Creatinine</span>
              <span className="font-medium">{patient.creatinine} mg/dL</span>
            </div>
          )}
          {patient.bilirubin && (
            <div className="flex justify-between p-2 rounded bg-muted/30">
              <span className="text-muted-foreground">Bilirubin</span>
              <span className="font-medium">{patient.bilirubin} mg/dL</span>
            </div>
          )}
          {patient.platelet_count && (
            <div className="flex justify-between p-2 rounded bg-muted/30">
              <span className="text-muted-foreground">Platelets</span>
              <span className="font-medium">{patient.platelet_count.toLocaleString()}/μL</span>
            </div>
          )}
          {patient.glucose && (
            <div className="flex justify-between p-2 rounded bg-muted/30">
              <span className="text-muted-foreground">Glucose</span>
              <span className="font-medium">{patient.glucose} mg/dL</span>
            </div>
          )}
        </div>
      </div>

      {/* Comorbidities */}
      {comorbidities.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">COMORBIDITIES</h4>
          <div className="flex flex-wrap gap-2">
            {comorbidities.map((condition, i) => (
              <span
                key={i}
                className="px-3 py-1 rounded-full bg-warning/20 text-warning text-xs font-medium"
              >
                {condition}
              </span>
            ))}
          </div>
        </div>
      )}
    </GlassCard>
  );
}
