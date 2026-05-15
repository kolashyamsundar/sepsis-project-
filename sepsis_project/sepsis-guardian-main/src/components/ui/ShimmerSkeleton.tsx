import { cn } from "@/lib/utils";

interface ShimmerSkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular" | "card";
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export function ShimmerSkeleton({
  className,
  variant = "rectangular",
  width,
  height,
  lines = 1,
}: ShimmerSkeletonProps) {
  const baseClasses = cn(
    "relative overflow-hidden bg-muted/50",
    "before:absolute before:inset-0",
    "before:bg-gradient-to-r before:from-transparent before:via-foreground/5 before:to-transparent",
    "before:animate-shimmer",
    variant === "circular" && "rounded-full",
    variant === "rectangular" && "rounded-lg",
    variant === "text" && "rounded h-4",
    variant === "card" && "rounded-2xl"
  );

  if (lines > 1) {
    return (
      <div className={cn("space-y-3", className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(baseClasses, "h-4")}
            style={{
              width: i === lines - 1 ? "60%" : width || "100%",
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(baseClasses, className)}
      style={{ width, height }}
    />
  );
}

// Preset skeleton components
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-border/30 bg-card/30 p-6 space-y-4", className)}>
      <div className="flex items-center gap-4">
        <ShimmerSkeleton variant="circular" width={48} height={48} />
        <div className="flex-1 space-y-2">
          <ShimmerSkeleton height={20} width="60%" />
          <ShimmerSkeleton height={14} width="40%" />
        </div>
      </div>
      <ShimmerSkeleton variant="text" lines={3} />
      <div className="flex gap-2">
        <ShimmerSkeleton height={36} width={100} className="rounded-lg" />
        <ShimmerSkeleton height={36} width={80} className="rounded-lg" />
      </div>
    </div>
  );
}

export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="border-b border-border/30">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="p-4">
          <ShimmerSkeleton height={20} width={i === 0 ? "80%" : "60%"} />
        </td>
      ))}
    </tr>
  );
}

export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-border/30 bg-card/30 p-6", className)}>
      <div className="flex justify-between items-center mb-6">
        <ShimmerSkeleton height={24} width={150} />
        <ShimmerSkeleton height={32} width={100} className="rounded-lg" />
      </div>
      <div className="flex items-end gap-2 h-48">
        {Array.from({ length: 12 }).map((_, i) => (
          <ShimmerSkeleton
            key={i}
            className="flex-1 rounded-t-lg"
            height={`${Math.random() * 60 + 40}%`}
          />
        ))}
      </div>
    </div>
  );
}
