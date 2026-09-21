"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { BentoGrid, BentoGridItem } from "@/components/aceternity/bento-grid";
import { RagSearchingBeam } from "@/components/advisor/rag-searching-beam";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/navbar";
import {
  Sparkles,
  Camera,
  Layers,
  ShieldCheck,
  Zap,
  ArrowRight,
  Sun,
  Moon,
  FlaskConical,
  IndianRupee,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [selectedSkinType, setSelectedSkinType] = useState<"oily" | "dry" | "pigmented">("oily");

  const previewRoutines = {
    oily: {
      morning: ["Gentle Salicylic Acid 1% Cleanser", "Niacinamide 5% Pore-Refining Serum", "Ultra-Light Gel Moisturizer", "Matte Finish SPF 50+ Sunscreen"],
      night: ["Double Cleanse (Micellar Water)", "Barrier Repair Ceramide Serum", "Non-Comedogenic Hydrating Lotion"],
      actives: "2% Salicylic Acid + 5% Niacinamide (Regulates sebum, eliminates blackheads)",
      budgetPick: "Sebamed Clear Face / Minimalist 2% SA (~₹399)",
    },
    dry: {
      morning: ["Cream-to-Foam Gentle Hydrating Wash", "Multi-Molecular Hyaluronic Acid (on damp skin)", "Ceramide & Oat Soothing Cream", "Dewy Hybrid Sunscreen SPF 50"],
      night: ["Gentle Cleansing Balm", "5% Lactic Acid (2x a week)", "Deep Lipid Barrier Recovery Cream with Squalane"],
      actives: "Ceramides AP/EOP + 2% Hyaluronic Acid + Colloidal Oatmeal",
      budgetPick: "Bioderma Atoderm / Re'equil Ceramide (~₹450)",
    },
    pigmented: {
      morning: ["Gentle Centella Cleanser", "10% Vitamin C (Ethyl Ascorbic Acid)", "Lightweight Peptide Emulsion", "Broad Spectrum UVA/UVB Fluid SPF 50+"],
      night: ["Mild Hydrating Wash", "Azelaic Acid 10% / Tranexamic Acid 3%", "Centella Asiatica Barrier Gel"],
      actives: "10% Azelaic Acid + 3% Tranexamic Acid + Vitamin C",
      budgetPick: "Pharmacy Aziderm 10% / Minimalist Tranexamic (~₹380)",
    },
  };

  const currentPreview = previewRoutines[selectedSkinType];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col selection:bg-[#4C7359]/20 selection:text-[#3E6049]">
      <Navbar />

      {/* ── HERO SECTION ──────────────────────────────────────────────── */}
      <section className="relative pt-12 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full flex flex-col items-center text-center overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-[#4C7359]/15 via-emerald-100/30 to-blue-50/40 blur-3xl rounded-full pointer-events-none -z-10" />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200/90 shadow-xs mb-6"
        >
          <span className="flex h-2 w-2 rounded-full bg-[#4C7359] animate-pulse" />
          <span className="text-xs font-semibold text-slate-700">
            Dermatology AI • FAISS Vector Memory • Indian Climate Formulations
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 max-w-4xl leading-[1.12]"
        >
          Clinical Skincare Formulations. <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4C7359] via-[#3E6049] to-emerald-700">
            Engineered For Your Real Skin.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed"
        >
          Tired of generic 10-step influencer routines that break your barrier? GroomAI cross-references your skin type, climate humidity, and active ingredients against a clinical FAISS knowledge base to build proven, budget-conscious morning and night routines.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8 flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto"
        >
          <ShimmerButton
            onClick={() => router.push("/chat")}
            className="w-full sm:w-auto text-base font-semibold shadow-lg"
          >
            <Sparkles className="h-5 w-5 mr-2" />
            Analyze My Skin & Generate Routine
          </ShimmerButton>

          <Link
            href="#interactive-preview"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white border border-slate-200/90 text-sm font-semibold text-slate-800 hover:bg-slate-50 hover:border-slate-300 transition-all hover:-translate-y-0.5 shadow-xs"
          >
            Explore Live Sample Routine
            <ArrowRight className="h-4 w-4 text-slate-400" />
          </Link>
        </motion.div>

        {/* Trust Badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-[#4C7359]" />
            <span>Formulation Conflict Protection</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-[#4C7359]" />
            <span>Inventory Aware (Zero Duplicate Purchases)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-[#4C7359]" />
            <span>Honest Indian Pharmacy & Brand Prices (₹)</span>
          </div>
        </div>
      </section>

      {/* ── INTERACTIVE LIVE ROUTINE PREVIEW (ACETERNITY BENTO GRID) ── */}
      <section id="interactive-preview" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <Badge variant="sage" className="mb-2">
            Interactive Bento Preview
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            See Exactly How GroomAI Structures Your Advice
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            No massive blocks of unreadable text. Every recommendation is parsed into structured morning, evening, and active ingredient cards.
          </p>

          {/* Skin Type Switcher Pills */}
          <div className="inline-flex p-1 bg-slate-200/70 rounded-2xl mt-6 border border-slate-200 gap-1">
            <button
              onClick={() => setSelectedSkinType("oily")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                selectedSkinType === "oily"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              💧 Oily / Acne-Prone
            </button>
            <button
              onClick={() => setSelectedSkinType("dry")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                selectedSkinType === "dry"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              🌿 Dry / Barrier Damaged
            </button>
            <button
              onClick={() => setSelectedSkinType("pigmented")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                selectedSkinType === "pigmented"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              ✨ Hyperpigmentation & Dullness
            </button>
          </div>
        </div>

        {/* The Live Bento Grid */}
        <BentoGrid className="grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Morning Routine */}
          <BentoGridItem
            className="bg-amber-50/25 border-amber-200/70"
            title="Morning Routine (AM)"
            icon={<Sun className="h-5 w-5 text-amber-500" />}
            badge={<Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px]">Protection</Badge>}
            description={
              <ul className="space-y-2 mt-2">
                {currentPreview.morning.map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                    <span className="flex-shrink-0 flex items-center justify-center h-4 w-4 rounded-full bg-amber-200/80 text-amber-900 text-[10px] font-bold mt-0.5">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            }
          />

          {/* Card 2: Night Routine */}
          <BentoGridItem
            className="bg-indigo-50/25 border-indigo-200/70"
            title="Night Routine (PM)"
            icon={<Moon className="h-5 w-5 text-indigo-600" />}
            badge={<Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 text-[10px]">Repair</Badge>}
            description={
              <ul className="space-y-2 mt-2">
                {currentPreview.night.map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                    <span className="flex-shrink-0 flex items-center justify-center h-4 w-4 rounded-full bg-indigo-200/80 text-indigo-900 text-[10px] font-bold mt-0.5">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            }
          />

          {/* Card 3: Formulated Actives & Budget Match */}
          <BentoGridItem
            className="bg-emerald-50/25 border-emerald-200/70"
            title="Target Actives & Budget Pick"
            icon={<FlaskConical className="h-5 w-5 text-[#4C7359]" />}
            badge={<Badge variant="sage" className="text-[10px]">Efficacy Match</Badge>}
            description={
              <div className="space-y-4 mt-2">
                <div>
                  <div className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                    Target Chemistry
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    {currentPreview.actives}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200/70">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                    <span className="flex items-center gap-1">
                      <IndianRupee className="h-3.5 w-3.5 text-[#4C7359]" />
                      Budget-Friendly Indian Pick
                    </span>
                  </div>
                  <div className="mt-1.5 p-2 rounded-xl bg-white border border-slate-200/90 text-xs font-medium text-slate-700">
                    {currentPreview.budgetPick}
                  </div>
                </div>
              </div>
            }
          />
        </BentoGrid>
      </section>

      {/* ── MAGIC UI ANIMATED BEAM ARCHITECTURE SHOWCASE ─────────────── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-10 shadow-sm relative overflow-hidden">
          <div className="text-center max-w-xl mx-auto mb-6">
            <Badge variant="sage" className="mb-2">
              Agentic RAG Engine
            </Badge>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
              Powered by Live Vector Search & OpenAI Agents SDK
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
              Watch how your skin consultation is contextualized in real-time through multi-node knowledge graphs.
            </p>
          </div>

          <RagSearchingBeam status="Real-time RAG: Querying FAISS vector index & analyzing formulation compatibility..." />
        </div>
      </section>

      {/* ── BENTO FEATURES GRID ───────────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Badge variant="outline" className="mb-2">
            Why GroomAI Is Different
          </Badge>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Built Like a Dermatology Clinic, Not a Marketing Blog
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Everything your skin actually needs, engineered with medical integrity.
          </p>
        </div>

        <BentoGrid className="grid-cols-1 md:grid-cols-3 gap-5">
          <BentoGridItem
            title="Vision Assessment"
            icon={<Camera className="h-5 w-5 text-blue-600" />}
            badge={<Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]">AI Vision</Badge>}
            description="Take a photo of your skin or active flare-up. Our vision agent assesses surface texture, hyperpigmentation depth, and erythema redness before prescribing actives."
          />

          <BentoGridItem
            title="Zero-Waste Inventory Tracker"
            icon={<Layers className="h-5 w-5 text-amber-600" />}
            badge={<Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">No Waste</Badge>}
            description="Add your existing cleansers, toners, and moisturizers into your GroomAI Wardrobe. The AI prioritizes finishing what you already own instead of pushing new bottles."
          />

          <BentoGridItem
            title="Formulation Conflict Guard"
            icon={<ShieldCheck className="h-5 w-5 text-[#4C7359]" />}
            badge={<Badge variant="sage" className="text-[10px]">Skin Safety</Badge>}
            description="Never combine Vitamin C with copper peptides or Retinol with high-percentage AHAs. The system flags dangerous layerings before they irritate your moisture barrier."
          />

          <BentoGridItem
            title="India Climate Tuning"
            icon={<Sun className="h-5 w-5 text-orange-500" />}
            badge={<Badge className="bg-orange-50 text-orange-700 border-orange-200 text-[10px]">Local Context</Badge>}
            description="Heavy European creams clog pores during Indian humid monsoons. GroomAI factors in local humidity, UV index, and pollution index for non-greasy finishes."
          />

          <BentoGridItem
            title="Affordable Indian Holy Grails"
            icon={<IndianRupee className="h-5 w-5 text-emerald-600" />}
            badge={<Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">Pocket Friendly</Badge>}
            description="Why spend ₹4,000 when high-grade pharmacy formulations (like Aziderm, Glyco-6, and Sebamed) cost under ₹450? GroomAI surfaces the best value formulations."
          />

          <BentoGridItem
            title="Persistent Consultation Memory"
            icon={<Zap className="h-5 w-5 text-indigo-600" />}
            badge={<Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px]">Fast Recall</Badge>}
            description="Tracks your skin evolution week-over-week across up to 10 stored consultation sessions. No starting from scratch every time you log in."
          />
        </BentoGrid>
      </section>

      {/* ── BOTTOM CTA BANNER ─────────────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full mb-12">
        <div className="bg-gradient-to-br from-[#4C7359] to-[#385942] rounded-3xl p-8 sm:p-12 text-center text-white shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.2),transparent_60%)] pointer-events-none" />
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight relative z-10">
            Ready to Fix Your Skin Barrier for Good?
          </h2>
          <p className="mt-3 text-sm sm:text-base text-emerald-100 max-w-xl mx-auto relative z-10 leading-relaxed">
            Take the 60-second clinical consultation and get your customized morning and night routines in seconds.
          </p>
          <div className="mt-8 flex justify-center relative z-10">
            <ShimmerButton
              onClick={() => router.push("/chat")}
              background="radial-gradient(ellipse 80% 80% at 50% 120%, #ffffff, #f1f5f9)"
              shimmerColor="#4C7359"
              className="text-slate-900 font-bold text-base shadow-xl"
            >
              Start Skin Consultation Now
              <ArrowRight className="h-4 w-4 ml-2 text-[#4C7359]" />
            </ShimmerButton>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 py-8 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-md bg-[#4C7359] text-white flex items-center justify-center font-bold text-xs">
              G
            </div>
            <span className="font-semibold text-slate-800">GroomAI</span>
            <span>— AI-Driven Skincare & Grooming Intelligence</span>
          </div>
          <div>
            Consultations are for informational guidance. Always patch test active formulations.
          </div>
        </div>
      </footer>
    </div>
  );
}
