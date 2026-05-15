import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import jsPDF from "jspdf";

interface HealthStatusPDFProps {
  patientName: string;
  healthStatus: {
    risk_level: string | null;
    mortality: number | null;
    stage: string | null;
    updated: string | null;
    recommendations?: any;
  };
}

const COLORS = {
  primary: [30, 58, 138] as [number, number, number],
  text: [30, 41, 59] as [number, number, number],
  muted: [100, 116, 139] as [number, number, number],
  border: [203, 213, 225] as [number, number, number],
  green: [22, 163, 74] as [number, number, number],
  orange: [234, 88, 12] as [number, number, number],
  red: [220, 38, 38] as [number, number, number],
  lightBg: [241, 245, 249] as [number, number, number],
};

function getRiskColor(level: string): [number, number, number] {
  const l = level.toLowerCase();
  if (l === "low") return COLORS.green;
  if (l === "medium" || l === "moderate") return COLORS.orange;
  return COLORS.red;
}

export function HealthStatusPDF({ patientName, healthStatus }: HealthStatusPDFProps) {
  const handleDownload = () => {
    const doc = new jsPDF("p", "mm", "a4");
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentW = pw - margin * 2;
    let y = 0;

    const setColor = (c: [number, number, number]) => doc.setTextColor(c[0], c[1], c[2]);
    const checkPage = (needed: number) => {
      if (y + needed > ph - 25) { doc.addPage(); y = 20; }
    };

    // ── Header bar ──
    doc.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
    doc.rect(0, 0, pw, 32, "F");
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("AI Health Diagnostics Center", pw / 2, 12, { align: "center" });
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("PATIENT HEALTH STATUS REPORT", pw / 2, 22, { align: "center" });
    doc.setFontSize(7);
    doc.text("123 Medical Research Blvd  |  +1-800-SEPSIS1  |  support@sepsis.ai", pw / 2, 29, { align: "center" });

    y = 40;

    // ── Patient Info ──
    doc.setFillColor(COLORS.lightBg[0], COLORS.lightBg[1], COLORS.lightBg[2]);
    doc.rect(margin, y, contentW, 16, "F");
    doc.setDrawColor(COLORS.border[0], COLORS.border[1], COLORS.border[2]);
    doc.rect(margin, y, contentW, 16, "S");

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    setColor(COLORS.text);
    doc.text("Patient Name:", margin + 4, y + 6);
    doc.setFont("helvetica", "normal");
    doc.text(patientName, margin + 34, y + 6);

    doc.setFont("helvetica", "bold");
    doc.text("Report Date:", margin + contentW / 2, y + 6);
    doc.setFont("helvetica", "normal");
    doc.text(healthStatus.updated ? new Date(healthStatus.updated).toLocaleDateString() : "N/A", margin + contentW / 2 + 28, y + 6);

    doc.setFont("helvetica", "bold");
    doc.text("Generated:", margin + 4, y + 12);
    doc.setFont("helvetica", "normal");
    doc.text(new Date().toLocaleString(), margin + 34, y + 12);

    y += 22;

    // ── Risk Assessment Box ──
    const riskColor = getRiskColor(healthStatus.risk_level || "low");
    doc.setFillColor(riskColor[0], riskColor[1], riskColor[2]);
    doc.roundedRect(margin, y, contentW, 20, 2, 2, "F");
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(`Risk Level: ${(healthStatus.risk_level || "N/A").toUpperCase()}`, pw / 2, y + 9, { align: "center" });
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const details = [];
    if (healthStatus.mortality !== null) details.push(`Mortality Risk: ${healthStatus.mortality.toFixed(1)}%`);
    if (healthStatus.stage) details.push(`Sepsis Stage: ${healthStatus.stage}`);
    doc.text(details.join("  |  "), pw / 2, y + 16, { align: "center" });

    y += 28;

    // ── Recommendations ──
    if (healthStatus.recommendations) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      setColor(COLORS.primary);
      doc.text("RECOMMENDATIONS", margin + 4, y);
      y += 6;

      const recs = healthStatus.recommendations;

      const printSection = (title: string, items: string[]) => {
        if (!items || items.length === 0) return;
        checkPage(10);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        setColor(COLORS.primary);
        doc.text(title, margin + 4, y);
        y += 5;
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        setColor(COLORS.text);
        items.forEach((item: string) => {
          checkPage(6);
          const lines = doc.splitTextToSize(`• ${item}`, contentW - 12);
          doc.text(lines, margin + 8, y);
          y += lines.length * 4 + 1;
        });
        y += 3;
      };

      if (Array.isArray(recs)) {
        recs.forEach((r: string) => {
          checkPage(6);
          doc.setFontSize(8);
          doc.setFont("helvetica", "normal");
          setColor(COLORS.text);
          const lines = doc.splitTextToSize(`• ${r}`, contentW - 12);
          doc.text(lines, margin + 8, y);
          y += lines.length * 4 + 1;
        });
      } else if (typeof recs === "object") {
        if (recs.medications) printSection("💊 Medications", Array.isArray(recs.medications) ? recs.medications : [recs.medications]);
        if (recs.diet) printSection("🥗 Diet", Array.isArray(recs.diet) ? recs.diet : [recs.diet]);
        if (recs.lifestyle) printSection("🏃 Lifestyle", Array.isArray(recs.lifestyle) ? recs.lifestyle : [recs.lifestyle]);
        if (recs.monitoring) printSection("📊 Monitoring", Array.isArray(recs.monitoring) ? recs.monitoring : [recs.monitoring]);
        if (recs.meditation) printSection("🧘 Meditation & Wellness", Array.isArray(recs.meditation) ? recs.meditation : [recs.meditation]);
      }
    }

    y += 4;

    // ── Disclaimer ──
    checkPage(18);
    doc.setDrawColor(COLORS.orange[0], COLORS.orange[1], COLORS.orange[2]);
    doc.setFillColor(255, 248, 240);
    doc.roundedRect(margin, y, contentW, 10, 1, 1, "FD");
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    setColor(COLORS.orange);
    doc.text("DISCLAIMER:", margin + 4, y + 4);
    doc.setFont("helvetica", "normal");
    setColor(COLORS.text);
    doc.text("This report is AI-assisted and should not replace professional medical diagnosis.", margin + 28, y + 4);
    doc.text("All clinical decisions must be made by qualified healthcare professionals.", margin + 4, y + 8);

    // ── Footer ──
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setDrawColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      doc.setLineWidth(0.5);
      doc.line(margin, ph - 14, pw - margin, ph - 14);
      doc.setFontSize(7);
      setColor(COLORS.muted);
      doc.text("Generated by: S.E.P.S.I.S - Sepsis AI Prediction System", margin, ph - 10);
      doc.text(`Page ${i} of ${totalPages}`, pw - margin, ph - 10, { align: "right" });
      doc.setDrawColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
      doc.line(pw - margin - 45, ph - 8, pw - margin, ph - 8);
      doc.setFontSize(6);
      doc.text("Authorized Signature", pw - margin - 22, ph - 5, { align: "center" });
    }

    doc.save(`Health-Report-${patientName.replace(/\s+/g, "-")}.pdf`);
  };

  if (!healthStatus.risk_level) return null;

  return (
    <Button variant="outline" onClick={handleDownload} className="gap-2">
      <Download className="h-4 w-4" />
      Download Report
    </Button>
  );
}
