import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline" | "ghost" | "sage" | "danger";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4C7359]/30 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]";

    const variantStyles = {
      default:
        "bg-[#4C7359] text-white shadow-sm hover:bg-[#3E6049] hover:shadow-md hover:-translate-y-0.5",
      sage:
        "bg-[#4C7359] text-white shadow-sm hover:bg-[#3E6049] hover:shadow-md hover:-translate-y-0.5",
      secondary:
        "bg-slate-100 text-slate-900 hover:bg-slate-200 hover:-translate-y-0.5",
      outline:
        "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 hover:border-slate-300 hover:-translate-y-0.5",
      ghost:
        "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
      danger:
        "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 hover:-translate-y-0.5",
    };

    const sizeStyles = {
      default: "h-10 px-4 py-2",
      sm: "h-8 rounded-lg px-3 text-xs",
      lg: "h-12 rounded-xl px-6 text-base",
      icon: "h-9 w-9 p-0",
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
