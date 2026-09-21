"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, LogOut, User, Menu, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface NavbarProps {
  email?: string | null;
  onToggleSidebar?: () => void;
  showSidebarToggle?: boolean;
}

export function Navbar({ email, onToggleSidebar, showSidebarToggle = false }: NavbarProps) {
  const router = useRouter();

  const handleSignOut = () => {
    localStorage.removeItem("groomai_token");
    localStorage.removeItem("groomai_email");
    document.cookie = "groomai_token=; path=/; max-age=0";
    router.push("/sign-in");
  };

  return (
    <header className="h-16 border-b border-slate-200/90 bg-white/80 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-3">
        {showSidebarToggle && (
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
            title="Toggle consultations list"
          >
            <Menu className="h-4 w-4" />
          </button>
        )}

        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="h-8 w-8 rounded-xl bg-[#4C7359] text-white flex items-center justify-center shadow-xs group-hover:bg-[#3D5D47] transition-colors">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight text-slate-900">
            Groom<span className="text-[#4C7359]">AI</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center ml-4 pl-4 border-l border-slate-200">
          <Badge variant="sage" className="gap-1 py-0.5 text-[11px]">
            <ShieldCheck className="h-3 w-3 text-[#4C7359]" />
            Clinical Agent v2.4 • FAISS RAG Active
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {email ? (
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
              <User className="h-3.5 w-3.5 text-slate-400" />
              <span className="font-medium text-slate-700">{email}</span>
            </div>

            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 text-slate-600 text-xs font-medium transition-all"
              title="Sign Out"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/sign-in"
              className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/chat"
              className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-[#4C7359] hover:bg-[#3E6049] shadow-xs transition-all hover:-translate-y-0.5"
            >
              Launch Advisor
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
