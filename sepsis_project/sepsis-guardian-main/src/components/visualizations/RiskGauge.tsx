import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface RiskGaugeProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  animated?: boolean;
  showLabel?: boolean;
  className?: string;
}

export function RiskGauge({
  value,
  size = 200,
  strokeWidth = 12,
  animated = true,
  showLabel = true,
  className,
}: RiskGaugeProps) {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    if (animated) {
      const duration = 1500;
      const startTime = Date.now();
      const startValue = animatedValue;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);
        const current = startValue + (value - startValue) * easeOutCubic;
        
        setAnimatedValue(current);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    } else {
      setAnimatedValue(value);
    }
  }, [value, animated]);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * Math.PI; // Half circle
  const offset = circumference - (animatedValue / 100) * circumference;

  const getRiskLevel = (val: number) => {
    if (val < 30) return { label: "Low", color: "text-success", bgColor: "stroke-success" };
    if (val < 60) return { label: "Medium", color: "text-warning", bgColor: "stroke-warning" };
    return { label: "High", color: "text-danger", bgColor: "stroke-danger" };
  };

  const risk = getRiskLevel(animatedValue);

  return (
    <div className={cn("relative inline-flex flex-col items-center", className)}>
      <svg
        width={size}
        height={size / 2 + 20}
        viewBox={`0 0 ${size} ${size / 2 + 20}`}
        className="overflow-visible"
      >
        {/* Background arc */}
        <path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-muted/30"
          strokeLinecap="round"
        />
        
        {/* Gradient definition */}
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--success))" />
            <stop offset="50%" stopColor="hsl(var(--warning))" />
            <stop offset="100%" stopColor="hsl(var(--danger))" />
          </linearGradient>
        </defs>

        {/* Progress arc */}
        <path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          fill="none"
          strokeWidth={strokeWidth}
          stroke="url(#gaugeGradient)"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-300 drop-shadow-lg"
          style={{
            filter: `drop-shadow(0 0 8px hsl(var(--${risk.label.toLowerCase() === "low" ? "success" : risk.label.toLowerCase() === "medium" ? "warning" : "danger"}) / 0.5))`,
          }}
        />

        {/* Needle */}
        <g transform={`translate(${size / 2}, ${size / 2})`}>
          <line
            x1="0"
            y1="0"
            x2="0"
            y2={-radius + 20}
            strokeWidth="3"
            className="stroke-foreground"
            strokeLinecap="round"
            transform={`rotate(${-90 + (animatedValue / 100) * 180})`}
            style={{ transition: "transform 0.3s ease-out" }}
          />
          <circle r="8" className="fill-foreground" />
          <circle r="4" className="fill-background" />
        </g>

        {/* Tick marks */}
        {[0, 25, 50, 75, 100].map((tick) => {
          const angle = -90 + (tick / 100) * 180;
          const tickRadius = radius + strokeWidth / 2 + 8;
          const x = size / 2 + tickRadius * Math.cos((angle * Math.PI) / 180);
          const y = size / 2 + tickRadius * Math.sin((angle * Math.PI) / 180);
          
          return (
            <text
              key={tick}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-muted-foreground text-xs font-medium"
            >
              {tick}
            </text>
          );
        })}
      </svg>

      {showLabel && (
        <div className="text-center -mt-2">
          <div className={cn("text-4xl font-bold", risk.color)}>
            {Math.round(animatedValue)}%
          </div>
          <div className={cn("text-sm font-medium uppercase tracking-wider", risk.color)}>
            {risk.label} Risk
          </div>
        </div>
      )}
    </div>
  );
}
