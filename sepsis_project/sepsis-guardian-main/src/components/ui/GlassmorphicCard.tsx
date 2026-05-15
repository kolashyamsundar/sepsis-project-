import { cn } from "@/lib/utils";
import { ReactNode, forwardRef, HTMLAttributes } from "react";

interface GlassmorphicCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  variant?: "default" | "glow" | "border-glow" | "premium";
  hoverEffect?: boolean;
}

export const GlassmorphicCard = forwardRef<HTMLDivElement, GlassmorphicCardProps>(
  ({ children, className, variant = "default", hoverEffect = true, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative rounded-2xl transition-all duration-500",
          // Base glass effect
          "bg-card/60 backdrop-blur-2xl",
          // Border
          "border border-border/30",
          // Shadow
          "shadow-xl shadow-background/20",
          // Hover effects
          hoverEffect && [
            "hover:shadow-2xl hover:shadow-primary/10",
            "hover:border-primary/30",
            "hover:-translate-y-1",
          ],
          // Variants
          variant === "glow" && [
            "before:absolute before:inset-0 before:rounded-2xl",
            "before:bg-gradient-to-r before:from-primary/20 before:via-transparent before:to-secondary/20",
            "before:opacity-0 before:transition-opacity before:duration-500",
            "hover:before:opacity-100",
            "animate-pulse-glow",
          ],
          variant === "border-glow" && [
            "before:absolute before:-inset-[1px] before:rounded-2xl before:p-[1px]",
            "before:bg-gradient-to-r before:from-primary before:via-secondary before:to-primary",
            "before:bg-[length:200%_100%] before:animate-gradient-x",
            "before:-z-10 before:opacity-50",
          ],
          variant === "premium" && [
            "bg-gradient-to-br from-card/80 via-card/60 to-card/40",
            "border-primary/20",
            "before:absolute before:inset-0 before:rounded-2xl",
            "before:bg-gradient-to-br before:from-primary/10 before:via-transparent before:to-secondary/10",
            "after:absolute after:inset-0 after:rounded-2xl",
            "after:bg-gradient-radial after:from-primary/5 after:to-transparent",
            "after:opacity-0 after:transition-opacity after:duration-500",
            "hover:after:opacity-100",
          ],
          className
        )}
        {...props}
      >
        <div className="relative z-10">{children}</div>
      </div>
    );
  }
);

GlassmorphicCard.displayName = "GlassmorphicCard";
