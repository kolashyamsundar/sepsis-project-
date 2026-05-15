import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowRight, Clock, FlaskConical, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { calculateShapValues } from "@/lib/shapCalculator";
import type { PatientData } from "@/types/patient";

interface Counterfactual {
  id: string;
  label: string;
  variable: string;
  currentValue: string;
  targetValue: string;
  targetNumeric: Record<string, number | boolean | null>;
  timeAssumption: string;
}

interface CounterfactualResult {
  counterfactual: Counterfactual;
  currentProb: number;
  newProb: number;
  reduction: number;
  relativeReduction: number;
}

function generateCounterfactuals(patient: PatientData): Counterfactual[] {
  const cfList: Counterfactual[] = [];

  if (patient.lactate && patient.lactate > 2) {
    cfList.push({
      id: "lactate_norm",
      label: "Normalize Lactate",
      variable: "Lactate",
      currentValue: `${patient.lactate} mmol/L`,
      targetValue: "2.0 mmol/L",
      targetNumeric: { lactate: 2.0 },
      timeAssumption: "Assumes intervention effect within 2-4 hours",
    });
  }

  if (patient.systolic_bp && patient.systolic_bp < 90) {
    cfList.push({
      id: "map_correct",
      label: "Correct Hypotension",
      variable: "Systolic BP",
      currentValue: `${patient.systolic_bp} mmHg`,
      targetValue: "100 mmHg",
      targetNumeric: { systolic_bp: 100, map_value: 75 },
      timeAssumption: "Assumes vasopressor/fluid response within 1-2 hours",
    });
  }

  if (patient.creatinine && patient.creatinine > 1.5) {
    cfList.push({
      id: "creatinine_improve",
      label: "Improve Renal Function",
      variable: "Creatinine",
      currentValue: `${patient.creatinine} mg/dL`,
      targetValue: "1.2 mg/dL",
      targetNumeric: { creatinine: 1.2 },
      timeAssumption: "Assumes fluid resuscitation effect within 6-12 hours",
    });
  }

  if (patient.spo2 && patient.spo2 < 94) {
    cfList.push({
      id: "spo2_improve",
      label: "Improve Oxygenation",
      variable: "SpO₂",
      currentValue: `${patient.spo2}%`,
      targetValue: "96%",
      targetNumeric: { spo2: 96 },
      timeAssumption: "Assumes supplemental O₂ effect within 30 minutes",
    });
  }

  if (patient.heart_rate && (patient.heart_rate > 110 || patient.heart_rate < 50)) {
    cfList.push({
      id: "hr_normalize",
      label: "Normalize Heart Rate",
      variable: "Heart Rate",
      currentValue: `${patient.heart_rate} bpm`,
      targetValue: "80 bpm",
      targetNumeric: { heart_rate: 80 },
      timeAssumption: "Assumes pharmacological rate control within 1-2 hours",
    });
  }

  if (patient.platelet_count && patient.platelet_count < 100000) {
    cfList.push({
      id: "plt_improve",
      label: "Improve Platelets",
      variable: "Platelet Count",
      currentValue: `${patient.platelet_count?.toLocaleString()}/μL`,
      targetValue: "150,000/μL",
      targetNumeric: { platelet_count: 150000 },
      timeAssumption: "Assumes platelet transfusion effect within 1 hour",
    });
  }

  // Return at most 3
  return cfList.slice(0, 3);
}

function computeMortalityProb(shapValues: { value: number }[]): number {
  const baseline = 0.15;
  const totalShap = shapValues.reduce((s, v) => s + v.value, 0);
  return Math.max(0, Math.min(1, baseline + totalShap));
}

interface CounterfactualAnalysisProps {
  patient: PatientData;
  currentProb: number;
  confidenceLevel: "high" | "moderate" | "low";
  className?: string;
}

export function CounterfactualAnalysis({ patient, currentProb, confidenceLevel, className }: CounterfactualAnalysisProps) {
  const counterfactuals = useMemo(() => generateCounterfactuals(patient), [patient]);

  const results: CounterfactualResult[] = useMemo(() => {
    return counterfactuals.map(cf => {
      const modifiedPatient = { ...patient, ...cf.targetNumeric } as PatientData;
      const newShap = calculateShapValues(modifiedPatient);
      const newProb = computeMortalityProb(newShap);
      const actualCurrent = currentProb / 100; // convert from percentage
      return {
        counterfactual: cf,
        currentProb: actualCurrent,
        newProb,
        reduction: actualCurrent - newProb,
        relativeReduction: ((actualCurrent - newProb) / actualCurrent) * 100,
      };
    });
  }, [patient, currentProb, counterfactuals]);

  if (counterfactuals.length === 0) {
    return (
      <GlassCard className={cn("p-6", className)} variant="elevated">
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
          <FlaskConical className="h-5 w-5 text-primary" />
          Counterfactual Analysis
        </h3>
        <p className="text-sm text-muted-foreground">
          No modifiable risk factors identified for counterfactual scenarios. Patient parameters are within or near normal ranges.
        </p>
      </GlassCard>
    );
  }

  const chartData = results.map(r => ({
    name: r.counterfactual.label,
    current: r.currentProb * 100,
    after: r.newProb * 100,
    reduction: r.reduction * 100,
  }));

  const isApproximate = confidenceLevel === "low";

  return (
    <GlassCard className={cn("p-6", className)} variant="elevated">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-primary" />
          Counterfactual Analysis
        </h3>
        {isApproximate && (
          <span className="text-xs px-2 py-1 rounded bg-warning/10 text-warning border border-warning/20">
            Approximate — low confidence
          </span>
        )}
      </div>

      {/* Grouped Bar Chart */}
      <div className="h-52 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
            <YAxis
              tickFormatter={(v) => `${v.toFixed(0)}%`}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-sm">
                      <p className="font-semibold">{label}</p>
                      <p className="text-destructive">Current: {Number(payload[0]?.value).toFixed(1)}%</p>
                      <p className="text-success">After: {Number(payload[1]?.value).toFixed(1)}%</p>
                      <p className="font-medium mt-1">Reduction: {(Number(payload[0]?.value) - Number(payload[1]?.value)).toFixed(1)}%</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="current" fill="hsl(0, 85%, 60%)" radius={[4, 4, 0, 0]} barSize={28} name="Current" />
            <Bar dataKey="after" fill="hsl(152, 60%, 45%)" radius={[4, 4, 0, 0]} barSize={28} name="After Intervention" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Counterfactual Cards */}
      <div className="space-y-3">
        {results.map((r, i) => (
          <div key={r.counterfactual.id} className={cn("p-4 rounded-xl border", isApproximate ? "border-warning/20 bg-warning/5" : "border-border/50 bg-card/50")}>
            <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
              <span className="font-semibold text-sm">{r.counterfactual.label}</span>
              <span className="text-success font-bold text-sm">
                −{(r.reduction * 100).toFixed(1)}% risk reduction
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <span>{r.counterfactual.variable}: {r.counterfactual.currentValue}</span>
              <ArrowRight className="h-3 w-3 shrink-0" />
              <span className="text-primary font-medium">{r.counterfactual.targetValue}</span>
            </div>
            <div className="flex items-center gap-2 text-sm mb-1">
              <span className="text-destructive">{(r.currentProb * 100).toFixed(1)}%</span>
              <ArrowDown className="h-3 w-3 text-success" />
              <span className="text-success">{(r.newProb * 100).toFixed(1)}%</span>
              <span className="text-muted-foreground">({r.relativeReduction.toFixed(0)}% relative reduction)</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
              <Clock className="h-3 w-3" />
              {r.counterfactual.timeAssumption}
            </div>

            {/* Auditable caption */}
            <div className="mt-2 p-2 rounded bg-muted/30 text-xs text-muted-foreground italic">
              If {r.counterfactual.variable.toLowerCase()} lowered to {r.counterfactual.targetValue}, predicted risk falls from {(r.currentProb * 100).toFixed(0)}% → {(r.newProb * 100).toFixed(0)}% (−{(r.reduction * 100).toFixed(0)}%).
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
