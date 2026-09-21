"use client";

import React, { useState } from "react";
import { BentoGrid, BentoGridItem } from "@/components/aceternity/bento-grid";
import { ParsedRoutine } from "@/lib/routine-parser";
import { Sun, Moon, FlaskConical, ShoppingBag, AlertTriangle, Eye, FileText, CheckCircle2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Badge } from "@/components/ui/badge";

interface RoutineBentoProps {
  routine: ParsedRoutine;
}

export function RoutineBento({ routine }: RoutineBentoProps) {
  const [viewMode, setViewMode] = useState<"bento" | "markdown">("bento");

  if (!routine.hasRoutine) {
    return (
      <div className="prose prose-slate max-w-none text-slate-800 text-sm leading-relaxed bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <ReactMarkdown>{routine.rawText}</ReactMarkdown>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full">
      {/* View Toggle Bar */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
        <div className="flex items-center gap-2">
          <Badge variant="sage" className="gap-1.5 py-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-[#4C7359]" />
            AI Formulation Formatted
          </Badge>
          <span className="text-xs text-slate-500 hidden sm:inline">
            Extracted from active FAISS agent session
          </span>
        </div>

        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 text-xs">
          <button
            onClick={() => setViewMode("bento")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all ${
              viewMode === "bento"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Eye className="h-3.5 w-3.5 text-[#4C7359]" />
            Bento Cards
          </button>
          <button
            onClick={() => setViewMode("markdown")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all ${
              viewMode === "markdown"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            Full Notes
          </button>
        </div>
      </div>

      {viewMode === "markdown" ? (
        <div className="prose prose-slate max-w-none text-slate-800 text-sm leading-relaxed bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <ReactMarkdown>{routine.rawText}</ReactMarkdown>
        </div>
      ) : (
        <BentoGrid className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Morning Routine Card */}
          {routine.morningRoutine.length > 0 && (
            <BentoGridItem
              className="bg-amber-50/20 border-amber-200/60"
              title="Morning Routine (AM)"
              icon={<Sun className="h-5 w-5 text-amber-500" />}
              badge={<Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px]">Protection & Prep</Badge>}
              header={
                <div className="flex flex-col gap-2">
                  <div className="h-1.5 w-12 rounded-full bg-amber-400/80" />
                </div>
              }
              description={
                <ul className="space-y-2 mt-1">
                  {routine.morningRoutine.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-slate-700 text-xs">
                      <span className="flex-shrink-0 flex items-center justify-center h-4 w-4 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              }
            />
          )}

          {/* Night Routine Card */}
          {routine.nightRoutine.length > 0 && (
            <BentoGridItem
              className="bg-indigo-50/20 border-indigo-200/60"
              title="Night Routine (PM)"
              icon={<Moon className="h-5 w-5 text-indigo-600" />}
              badge={<Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 text-[10px]">Recovery & Repair</Badge>}
              header={
                <div className="flex flex-col gap-2">
                  <div className="h-1.5 w-12 rounded-full bg-indigo-400/80" />
                </div>
              }
              description={
                <ul className="space-y-2 mt-1">
                  {routine.nightRoutine.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-slate-700 text-xs">
                      <span className="flex-shrink-0 flex items-center justify-center h-4 w-4 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              }
            />
          )}

          {/* Recommended Active Ingredients Card */}
          {routine.ingredients.length > 0 && (
            <BentoGridItem
              className="bg-emerald-50/20 border-emerald-200/60"
              title="Target Actives"
              icon={<FlaskConical className="h-5 w-5 text-[#4C7359]" />}
              badge={<Badge variant="sage" className="text-[10px]">Clinical Match</Badge>}
              header={
                <div className="flex flex-col gap-2">
                  <div className="h-1.5 w-12 rounded-full bg-[#4C7359]" />
                </div>
              }
              description={
                <div className="space-y-2.5 mt-1">
                  {routine.ingredients.map((ing, idx) => (
                    <div key={idx} className="border-b border-slate-100 pb-1.5 last:border-0 last:pb-0">
                      <div className="font-semibold text-slate-800 text-xs flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#4C7359]" />
                        {ing.name}
                      </div>
                      <div className="text-[11px] text-slate-500 pl-3 mt-0.5">
                        {ing.purpose}
                      </div>
                    </div>
                  ))}
                </div>
              }
            />
          )}

          {/* Product Recommendations with Indian Pricing Card */}
          {routine.products.length > 0 && (
            <BentoGridItem
              className="bg-emerald-50/10 border-slate-200"
              title="Recommended Products"
              icon={<ShoppingBag className="h-5 w-5 text-emerald-700" />}
              badge={<Badge variant="outline" className="text-[10px]">Budget Aware</Badge>}
              description={
                <div className="space-y-2 mt-1">
                  {routine.products.map((prod, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-50/80 border border-slate-200/60">
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="font-medium text-slate-900 text-xs truncate">
                          {prod.name}
                        </div>
                        {prod.reason && (
                          <div className="text-[10px] text-slate-500 truncate">
                            {prod.reason}
                          </div>
                        )}
                      </div>
                      {prod.price && (
                        <span className="px-2 py-0.5 rounded-md bg-[#4C7359]/10 text-[#3E6049] font-bold text-xs">
                          {prod.price}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              }
            />
          )}

          {/* Dermatological Cautions & Tips Card */}
          {routine.cautions.length > 0 && (
            <BentoGridItem
              className="bg-rose-50/20 border-rose-200/60"
              title="Safety & Patch Testing"
              icon={<AlertTriangle className="h-5 w-5 text-rose-500" />}
              badge={<Badge className="bg-rose-100 text-rose-800 border-rose-200 text-[10px]">Important</Badge>}
              description={
                <ul className="space-y-1.5 mt-1">
                  {routine.cautions.map((tip, idx) => (
                    <li key={idx} className="text-slate-600 text-xs flex items-start gap-1.5">
                      <span className="text-rose-500 font-bold">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              }
            />
          )}
        </BentoGrid>
      )}
    </div>
  );
}
