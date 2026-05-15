import { cn } from "@/lib/utils";

type RiskLevel = "low" | "medium" | "high" | "critical";

interface RiskBadgeProps {
  level: RiskLevel;
  percentage?: number;
  className?: string;
}

const riskConfig: Record<RiskLevel, { label: string; color: string }> = {
  low: { label: "Low Risk", color: "bg-success/20 text-success border-success/30" },
  medium: { label: "Moderate Risk", color: "bg-warning/20 text-warning border-warning/30" },
  high: { label: "High Risk", color: "bg-danger/20 text-danger border-danger/30" },
  critical: { label: "Critical", color: "bg-destructive/30 text-destructive border-destructive/50" },
};

export function RiskBadge({ level, percentage, className }: RiskBadgeProps) {
  const config = riskConfig[level];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-4 py-2 font-medium",
        config.color,
        className
      )}
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 bg-current" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
      </span>
      <span>{config.label}</span>
      {percentage !== undefined && (
        <span className="font-bold">{percentage.toFixed(1)}%</span>
      )}
    </div>
  );
}
