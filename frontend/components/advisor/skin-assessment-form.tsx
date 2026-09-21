"use client";

import React, { useState } from "react";
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { Sparkles, Check, Droplets, ShieldAlert, Target, IndianRupee } from "lucide-react";

interface SkinAssessmentFormProps {
  onSubmit: (prompt: string) => void;
  isLoading: boolean;
}

export function SkinAssessmentForm({ onSubmit, isLoading }: SkinAssessmentFormProps) {
  const [skinType, setSkinType] = useState("Oily");
  const [concerns, setConcerns] = useState<string[]>(["Acne & Breakouts"]);
  const [goal, setGoal] = useState("Clear Active Acne");
  const [budget, setBudget] = useState("Balanced (₹1000 - ₹2500)");

  const skinTypes = ["Oily", "Dry", "Combination", "Normal", "Sensitive"];
  const allConcerns = [
    "Acne & Breakouts",
    "Hyperpigmentation",
    "Dullness",
    "Uneven Texture",
    "Large Pores",
    "Redness / Rosacea",
  ];
  const allGoals = [
    "Clear Active Acne",
    "Glass Skin Glow",
    "Strengthen Skin Barrier",
    "Fade Dark Spots",
  ];
  const budgets = ["Budget (< ₹1000)", "Balanced (₹1000 - ₹2500)", "Premium (₹2500+)"];

  const toggleConcern = (item: string) => {
    if (concerns.includes(item)) {
      setConcerns(concerns.filter((c) => c !== item));
    } else {
      setConcerns([...concerns, item]);
    }
  };

  const handleGenerate = () => {
    const prompt = `Please analyze my skin profile and build a complete dermatological routine:\n- Skin Type: ${skinType}\n- Main Concerns: ${concerns.join(", ") || "General maintenance"}\n- Primary Goal: ${goal}\n- Target Budget: ${budget}\n\nPlease format with a step-by-step Morning Routine, Night Routine, Recommended Active Ingredients, and affordable Indian market product suggestions with ₹ prices.`;
    onSubmit(prompt);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#4C7359]" />
            Clinical Skin Consultation Assessment
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure your dermatological parameters to receive a tailored routine
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* 1. Skin Type */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <Droplets className="h-3.5 w-3.5 text-[#4C7359]" />
            1. Your Skin Type
          </label>
          <div className="flex flex-wrap gap-1.5">
            {skinTypes.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setSkinType(t)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 border ${
                  skinType === t
                    ? "bg-[#4C7359] text-white border-[#4C7359] shadow-xs"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Target Goal */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5 text-[#4C7359]" />
            2. Primary Skin Goal
          </label>
          <div className="flex flex-wrap gap-1.5">
            {allGoals.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGoal(g)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 border ${
                  goal === g
                    ? "bg-[#4C7359] text-white border-[#4C7359] shadow-xs"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Concerns */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
          <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
          3. Specific Concerns (Select all that apply)
        </label>
        <div className="flex flex-wrap gap-1.5">
          {allConcerns.map((c) => {
            const isSelected = concerns.includes(c);
            return (
              <button
                key={c}
                type="button"
                onClick={() => toggleConcern(c)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 border ${
                  isSelected
                    ? "bg-[#4C7359]/10 text-[#3E6049] border-[#4C7359]/30 font-semibold"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {isSelected && <Check className="h-3 w-3 text-[#4C7359]" />}
                {c}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Budget */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
          <IndianRupee className="h-3.5 w-3.5 text-[#4C7359]" />
          4. Budget Preference
        </label>
        <div className="flex flex-wrap gap-1.5">
          {budgets.map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setBudget(b)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 border ${
                budget === b
                  ? "bg-[#4C7359] text-white border-[#4C7359] shadow-xs"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Submit with Shimmer Button */}
      <div className="pt-2 flex justify-end">
        <ShimmerButton
          onClick={handleGenerate}
          disabled={isLoading}
          className="w-full sm:w-auto text-sm font-semibold"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          {isLoading ? "Analyzing & Formulating..." : "Generate Clinical Routine"}
        </ShimmerButton>
      </div>
    </div>
  );
}
