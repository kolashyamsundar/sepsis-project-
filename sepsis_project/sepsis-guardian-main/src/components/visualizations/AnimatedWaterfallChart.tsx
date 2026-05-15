import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface WaterfallItem {
  name: string;
  value: number;
  color?: "positive" | "negative";
}

interface AnimatedWaterfallChartProps {
  data: WaterfallItem[];
  height?: number;
  className?: string;
  animated?: boolean;
}

export function AnimatedWaterfallChart({
  data,
  height = 300,
  className,
  animated = true,
}: AnimatedWaterfallChartProps) {
  const [animatedData, setAnimatedData] = useState<WaterfallItem[]>(
    data.map((item) => ({ ...item, value: 0 }))
  );
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!animated) {
      setAnimatedData(data);
      return;
    }

    setIsVisible(true);
    const duration = 1000;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);

      setAnimatedData(
        data.map((item, index) => ({
          ...item,
          value: item.value * easeOutCubic * Math.min(1, (progress * data.length - index + 1)),
        }))
      );

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setAnimatedData(data);
      }
    };

    const timer = setTimeout(() => {
      requestAnimationFrame(animate);
    }, 200);

    return () => clearTimeout(timer);
  }, [data, animated]);

  const maxAbsValue = Math.max(...data.map((d) => Math.abs(d.value)));
  const scale = (height - 60) / 2 / maxAbsValue;

  return (
    <div className={cn("relative", className)} style={{ height }}>
      {/* Center line */}
      <div 
        className="absolute left-0 right-0 border-t border-border/50"
        style={{ top: height / 2 }}
      />

      {/* Bars */}
      <div className="flex items-center justify-around h-full px-4">
        {animatedData.map((item, index) => {
          const barHeight = Math.abs(item.value) * scale;
          const isPositive = item.value >= 0;
          const color = item.color || (isPositive ? "positive" : "negative");

          return (
            <div
              key={item.name}
              className="flex flex-col items-center gap-2 flex-1"
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? "translateY(0)" : "translateY(20px)",
                transition: `opacity 0.5s ease-out ${index * 0.1}s, transform 0.5s ease-out ${index * 0.1}s`,
              }}
            >
              {/* Bar */}
              <div
                className="relative w-full max-w-[40px] flex flex-col items-center"
                style={{ height: height - 60 }}
              >
                <div
                  className={cn(
                    "absolute w-full rounded-lg transition-all duration-500",
                    color === "positive"
                      ? "bg-gradient-to-t from-success/80 to-success shadow-lg shadow-success/20"
                      : "bg-gradient-to-b from-danger/80 to-danger shadow-lg shadow-danger/20"
                  )}
                  style={{
                    height: barHeight,
                    top: isPositive ? (height - 60) / 2 - barHeight : (height - 60) / 2,
                  }}
                />
                
                {/* Value label */}
                <div
                  className={cn(
                    "absolute text-xs font-bold whitespace-nowrap",
                    color === "positive" ? "text-success" : "text-danger"
                  )}
                  style={{
                    top: isPositive 
                      ? (height - 60) / 2 - barHeight - 20 
                      : (height - 60) / 2 + barHeight + 6,
                  }}
                >
                  {item.value > 0 ? "+" : ""}{item.value.toFixed(2)}
                </div>
              </div>

              {/* Label */}
              <div className="text-xs text-muted-foreground text-center truncate w-full px-1">
                {item.name}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
