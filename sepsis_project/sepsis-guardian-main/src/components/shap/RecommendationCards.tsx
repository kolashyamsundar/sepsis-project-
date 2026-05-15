import { GlassCard } from "@/components/ui/GlassCard";
import { Shield, Pill, Activity, AlertCircle } from "lucide-react";

export interface MedicationRecommendation {
  name: string;
  dose: string;
  priority: "high" | "medium" | "low";
}

export interface Recommendations {
  precautions: string[];
  medications: MedicationRecommendation[];
  treatments: string[];
}

interface PrecautionsCardProps {
  precautions: string[];
}

export function PrecautionsCard({ precautions }: PrecautionsCardProps) {
  return (
    <GlassCard className="p-6" variant="elevated">
      <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
        <Shield className="h-5 w-5 text-warning" />
        Precautions
      </h2>
      <ul className="space-y-3">
        {precautions.map((item, index) => (
          <li
            key={index}
            className="flex items-start gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <AlertCircle className="h-4 w-4 mt-0.5 text-warning shrink-0" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </GlassCard>
  );
}

interface MedicationsCardProps {
  medications: MedicationRecommendation[];
}

export function MedicationsCard({ medications }: MedicationsCardProps) {
  return (
    <GlassCard className="p-6" variant="elevated">
      <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
        <Pill className="h-5 w-5 text-primary" />
        Recommended Medications
      </h2>
      <div className="space-y-3">
        {medications.map((med, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border transition-colors hover:scale-[1.02] ${
              med.priority === "high"
                ? "border-danger/30 bg-danger/5 hover:bg-danger/10"
                : med.priority === "medium"
                ? "border-warning/30 bg-warning/5 hover:bg-warning/10"
                : "border-border bg-muted/30 hover:bg-muted/50"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-sm">{med.name}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  med.priority === "high"
                    ? "bg-danger/20 text-danger"
                    : med.priority === "medium"
                    ? "bg-warning/20 text-warning"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {med.priority}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{med.dose}</p>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

interface TreatmentsCardProps {
  treatments: string[];
}

export function TreatmentsCard({ treatments }: TreatmentsCardProps) {
  return (
    <GlassCard className="p-6" variant="elevated">
      <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
        <Activity className="h-5 w-5 text-success" />
        Treatment Recommendations
      </h2>
      <ul className="space-y-3">
        {treatments.map((item, index) => (
          <li
            key={index}
            className="flex items-start gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <div className="h-2 w-2 rounded-full bg-success mt-2 shrink-0" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </GlassCard>
  );
}
