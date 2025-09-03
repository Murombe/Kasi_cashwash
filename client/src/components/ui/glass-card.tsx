import { cn } from "@/lib/utils";
import { forwardRef } from "react";

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "dark" | "light";
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-3xl border transition-all duration-300",
          {
            "glass-effect": variant === "default",
            "glass-dark": variant === "dark", 
            "bg-white/5 backdrop-blur-xl border-white/10": variant === "light",
          },
          className
        )}
        {...props}
      />
    );
  }
);

GlassCard.displayName = "GlassCard";

export { GlassCard };
