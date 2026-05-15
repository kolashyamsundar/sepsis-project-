import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface SparklineChartProps {
  data: number[];
  width?: number;
  height?: number;
  color?: "primary" | "success" | "warning" | "danger";
  showDots?: boolean;
  animated?: boolean;
  className?: string;
}

export function SparklineChart({
  data,
  width = 100,
  height = 32,
  color = "primary",
  showDots = false,
  animated = true,
  className,
}: SparklineChartProps) {
  const [progress, setProgress] = useState(animated ? 0 : 1);

  useEffect(() => {
    if (!animated) return;

    const duration = 1000;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min(elapsed / duration, 1);
      setProgress(newProgress);

      if (newProgress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [animated, data]);

  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 4;

  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((value - min) / range) * (height - padding * 2);
    return { x, y, value };
  });

  const visiblePoints = points.slice(0, Math.ceil(points.length * progress));
  
  const pathD = visiblePoints
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const areaD = pathD + ` L ${visiblePoints[visiblePoints.length - 1]?.x || 0} ${height} L ${padding} ${height} Z`;

  const colorClasses = {
    primary: "stroke-primary fill-primary/10",
    success: "stroke-success fill-success/10",
    warning: "stroke-warning fill-warning/10",
    danger: "stroke-danger fill-danger/10",
  };

  const dotColorClasses = {
    primary: "fill-primary",
    success: "fill-success",
    warning: "fill-warning",
    danger: "fill-danger",
  };

  return (
    <svg
      width={width}
      height={height}
      className={cn("overflow-visible", className)}
      viewBox={`0 0 ${width} ${height}`}
    >
      {/* Gradient fill */}
      <defs>
        <linearGradient id={`sparkline-gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={`hsl(var(--${color}))`} stopOpacity="0.3" />
          <stop offset="100%" stopColor={`hsl(var(--${color}))`} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Area */}
      {visiblePoints.length > 1 && (
        <path
          d={areaD}
          fill={`url(#sparkline-gradient-${color})`}
          className="transition-all duration-300"
        />
      )}

      {/* Line */}
      {visiblePoints.length > 1 && (
        <path
          d={pathD}
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn(colorClasses[color].split(" ")[0], "transition-all duration-300")}
        />
      )}

      {/* Dots */}
      {showDots &&
        visiblePoints.map((point, i) => (
          <circle
            key={i}
            cx={point.x}
            cy={point.y}
            r={i === visiblePoints.length - 1 ? 3 : 2}
            className={cn(
              dotColorClasses[color],
              i === visiblePoints.length - 1 && "animate-pulse"
            )}
          />
        ))}

      {/* Current value indicator */}
      {visiblePoints.length > 0 && (
        <circle
          cx={visiblePoints[visiblePoints.length - 1].x}
          cy={visiblePoints[visiblePoints.length - 1].y}
          r="4"
          className={cn(dotColorClasses[color], "animate-pulse")}
        />
      )}
    </svg>
  );
}
