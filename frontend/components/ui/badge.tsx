import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "sage" | "secondary" | "outline" | "accent";
}

function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  const variantStyles = {
    default:
      "bg-slate-100 text-slate-800 border-slate-200",
    sage:
      "bg-[#4C7359]/10 text-[#3E6049] border-[#4C7359]/20 font-medium",
    secondary:
      "bg-slate-100 text-slate-700 border-transparent",
    outline:
      "border-slate-200 text-slate-700 bg-white",
    accent:
      "bg-amber-50 text-amber-800 border-amber-200 font-medium",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
