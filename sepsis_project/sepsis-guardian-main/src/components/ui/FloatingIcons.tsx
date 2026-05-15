import { cn } from "@/lib/utils";
import { Heart, Activity, Dna, Stethoscope, Pill, Syringe, Thermometer, HeartPulse } from "lucide-react";

interface FloatingIconsProps {
  className?: string;
  variant?: "subtle" | "prominent";
}

const icons = [
  { Icon: Heart, delay: "0s", duration: "8s", position: "top-20 left-[10%]", size: "h-8 w-8" },
  { Icon: Dna, delay: "1s", duration: "10s", position: "top-40 right-[15%]", size: "h-10 w-10" },
  { Icon: Activity, delay: "2s", duration: "9s", position: "bottom-32 left-[20%]", size: "h-6 w-6" },
  { Icon: Stethoscope, delay: "0.5s", duration: "11s", position: "top-60 left-[30%]", size: "h-7 w-7" },
  { Icon: HeartPulse, delay: "3s", duration: "7s", position: "bottom-40 right-[25%]", size: "h-9 w-9" },
  { Icon: Pill, delay: "1.5s", duration: "12s", position: "top-32 right-[35%]", size: "h-5 w-5" },
  { Icon: Syringe, delay: "2.5s", duration: "8s", position: "bottom-60 left-[40%]", size: "h-6 w-6" },
  { Icon: Thermometer, delay: "0.8s", duration: "10s", position: "bottom-20 right-[10%]", size: "h-7 w-7" },
];

export function FloatingIcons({ className, variant = "subtle" }: FloatingIconsProps) {
  return (
    <div className={cn("absolute inset-0 pointer-events-none overflow-hidden z-0", className)}>
      {icons.map(({ Icon, delay, duration, position, size }, index) => (
        <div
          key={index}
          className={cn(
            "absolute animate-float-3d",
            position
          )}
          style={{
            animationDelay: delay,
            animationDuration: duration,
          }}
        >
          <div
            className={cn(
              "rounded-xl p-3 backdrop-blur-sm transition-all",
              variant === "subtle" 
                ? "bg-primary/5 border border-primary/10" 
                : "bg-primary/10 border border-primary/20 shadow-lg shadow-primary/10",
            )}
          >
            <Icon 
              className={cn(
                size,
                variant === "subtle" ? "text-primary/30" : "text-primary/50"
              )} 
            />
          </div>
        </div>
      ))}
    </div>
  );
}
