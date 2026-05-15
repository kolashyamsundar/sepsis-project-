import { useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Download, FileText, Image, Copy, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { ShapValue } from "@/components/shap/ShapFeatureChart";

interface ShapExportPanelProps {
  shapValues: ShapValue[];
  patientName: string;
  predictedProb: number;
  riskLevel: string;
  containerRef?: React.RefObject<HTMLDivElement>;
  clinicianSummary: string;
}

export function ShapExportPanel({
  shapValues,
  patientName,
  predictedProb,
  riskLevel,
  containerRef,
  clinicianSummary,
}: ShapExportPanelProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const exportCSV = useCallback(() => {
    const headers = "feature,raw_value,shap_value,direction,description\n";
    const rows = shapValues.map(s =>
      `"${s.feature}","${s.actualValue || ""}",${s.value.toFixed(6)},${s.direction},"${s.description}"`
    ).join("\n");
    
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shap_values_${patientName.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "CSV Exported", description: "SHAP values downloaded as CSV" });
  }, [shapValues, patientName, toast]);

  const exportPNG = useCallback(async () => {
    if (!containerRef?.current) {
      toast({ title: "Export unavailable", description: "Chart container not found", variant: "destructive" });
      return;
    }
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(containerRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      });
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `shap_analysis_${patientName.replace(/\s+/g, "_")}.png`;
      a.click();
      toast({ title: "PNG Exported", description: "Analysis chart exported as PNG" });
    } catch (e) {
      toast({ title: "Export failed", description: "Could not generate PNG", variant: "destructive" });
    }
  }, [containerRef, patientName, toast]);

  const copyClinicalText = useCallback(() => {
    const text = `SHAP Explainability Report — ${patientName}\n` +
      `Risk Level: ${riskLevel} (${predictedProb.toFixed(1)}% mortality probability)\n` +
      `Generated: ${new Date().toISOString()}\n\n` +
      `Clinical Summary:\n${clinicianSummary}\n\n` +
      `Top Contributing Features:\n` +
      shapValues.slice(0, 5).map((s, i) =>
        `${i + 1}. ${s.feature}: ${s.actualValue || "N/A"} — ${s.value > 0 ? "+" : ""}${(s.value * 100).toFixed(1)}% impact\n   ${s.description}`
      ).join("\n") +
      `\n\nDisclaimer: This tool supports clinical decision-making and does not replace physician judgment.`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Copied", description: "Clinician summary copied to clipboard" });
    });
  }, [shapValues, patientName, predictedProb, riskLevel, clinicianSummary, toast]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm" onClick={exportCSV} className="gap-1.5">
        <FileText className="h-3.5 w-3.5" />
        Export CSV
      </Button>
      <Button variant="outline" size="sm" onClick={exportPNG} className="gap-1.5">
        <Image className="h-3.5 w-3.5" />
        Export PNG
      </Button>
      <Button variant="outline" size="sm" onClick={copyClinicalText} className="gap-1.5">
        {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? "Copied!" : "Copy Clinician Text"}
      </Button>
    </div>
  );
}
