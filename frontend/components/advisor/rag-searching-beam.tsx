"use client";

import React, { useRef } from "react";
import { motion } from "framer-motion";
import { AnimatedBeam } from "@/components/magicui/animated-beam";
import { Database, User, Sparkles, Box, ShieldCheck } from "lucide-react";

export function RagSearchingBeam({ status = "Querying FAISS vector index & analyzing formulation compatibility..." }: { status?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const agentRef = useRef<HTMLDivElement>(null);
  const faissRef = useRef<HTMLDivElement>(null);
  const inventoryRef = useRef<HTMLDivElement>(null);
  const safetyRef = useRef<HTMLDivElement>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="relative flex flex-col items-center justify-center w-full max-w-2xl mx-auto p-6 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-lg overflow-hidden my-4"
    >
      {/* Background soft radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(76,115,89,0.08),transparent_70%)] pointer-events-none" />

      <div
        ref={containerRef}
        className="relative flex h-[150px] w-full items-center justify-between px-6 z-10"
      >
        {/* Node 1: User & Skin Profile */}
        <div className="flex flex-col items-center gap-1.5 z-10">
          <div
            ref={userRef}
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 border border-slate-200 shadow-sm text-slate-700"
          >
            <User className="h-5 w-5 text-slate-700" />
          </div>
          <span className="text-[11px] font-medium text-slate-500">Skin Profile</span>
        </div>

        {/* Secondary Inputs: User Inventory & Safety */}
        <div className="flex flex-col gap-5 z-10">
          <div className="flex items-center gap-1.5">
            <div
              ref={inventoryRef}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50/80 border border-amber-200/70 shadow-xs text-amber-700"
            >
              <Box className="h-4 w-4 text-amber-700" />
            </div>
            <span className="text-[10px] font-medium text-slate-500 hidden sm:inline">Inventory</span>
          </div>

          <div className="flex items-center gap-1.5">
            <div
              ref={safetyRef}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50/80 border border-emerald-200/70 shadow-xs text-emerald-700"
            >
              <ShieldCheck className="h-4 w-4 text-emerald-700" />
            </div>
            <span className="text-[10px] font-medium text-slate-500 hidden sm:inline">Formulation Check</span>
          </div>
        </div>

        {/* Node 2: GroomAI Core Agent */}
        <div className="flex flex-col items-center gap-1.5 z-10">
          <div
            ref={agentRef}
            className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-[#4C7359] border-2 border-white shadow-md text-white"
          >
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <Sparkles className="h-6 w-6 text-white animate-pulse" />
          </div>
          <span className="text-[11px] font-semibold text-[#3E6049]">GroomAI Agent</span>
        </div>

        {/* Node 3: FAISS Vector Knowledge Base */}
        <div className="flex flex-col items-center gap-1.5 z-10">
          <div
            ref={faissRef}
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 border border-blue-200 shadow-sm text-blue-700"
          >
            <Database className="h-5 w-5 text-blue-600" />
          </div>
          <span className="text-[11px] font-medium text-slate-500">FAISS Vector DB</span>
        </div>

        {/* Beams */}
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={userRef}
          toRef={agentRef}
          gradientStartColor="#4C7359"
          gradientStopColor="#60A5FA"
          duration={3}
        />
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={agentRef}
          toRef={faissRef}
          gradientStartColor="#60A5FA"
          gradientStopColor="#4C7359"
          duration={2.5}
        />
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={inventoryRef}
          toRef={agentRef}
          curvature={-25}
          gradientStartColor="#F59E0B"
          gradientStopColor="#4C7359"
          duration={3.2}
        />
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={safetyRef}
          toRef={agentRef}
          curvature={25}
          gradientStartColor="#10B981"
          gradientStopColor="#4C7359"
          duration={2.8}
        />
      </div>

      {/* Pulsing Status Bar */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 w-full justify-center text-xs text-slate-600">
        <span className="inline-block w-2 h-2 rounded-full bg-[#4C7359] animate-ping" />
        <span className="font-medium text-slate-700">{status}</span>
      </div>
    </motion.div>
  );
}
