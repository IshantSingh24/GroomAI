"use client";

import { cn } from "@/lib/utils";
import React from "react";

export const BentoGrid = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-3 gap-4 max-w-7xl mx-auto auto-rows-fr",
        className
      )}
    >
      {children}
    </div>
  );
};

export const BentoGridItem = ({
  className,
  title,
  description,
  header,
  icon,
  badge,
  onClick,
}: {
  className?: string;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  header?: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  onClick?: () => void;
}) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "row-span-1 rounded-2xl group/bento hover:shadow-xl transition-all duration-300 shadow-sm p-5 bg-white border border-slate-200/90 justify-between flex flex-col space-y-4 hover:-translate-y-1 relative overflow-hidden",
        onClick && "cursor-pointer",
        className
      )}
    >
      {/* Subtle top organic glow highlight */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#4C7359]/30 to-transparent opacity-0 group-hover/bento:opacity-100 transition-opacity" />

      {header}
      <div className="group-hover/bento:translate-x-1 transition duration-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {icon}
            <div className="font-semibold text-slate-900 text-base tracking-tight">
              {title}
            </div>
          </div>
          {badge}
        </div>
        <div className="font-normal text-slate-600 text-xs leading-relaxed">
          {description}
        </div>
      </div>
    </div>
  );
};
