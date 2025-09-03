import { cn } from "@/lib/utils";
import { forwardRef } from "react";

export interface FloatingCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  glow?: boolean;
}

const FloatingCard = forwardRef<HTMLDivElement, FloatingCardProps>(
  ({ className, hover = true, glow = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "glass-effect rounded-3xl border transition-all duration-400 cubic-bezier(0.4, 0, 0.2, 1)",
          {
            "floating-card": hover,
            "animate-glow": glow,
          },
          className
        )}
        {...props}
      />
    );
  }
);

FloatingCard.displayName = "FloatingCard";

export { FloatingCard };
