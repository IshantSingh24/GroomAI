"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BACKEND_URL } from "@/lib/config";
import { Sparkles, ArrowRight, ShieldCheck, Mail, Lock } from "lucide-react";
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { Input } from "@/components/ui/input";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        /* silent */
      }

      if (!res.ok) {
        const errorDetail =
          typeof data?.detail === "string"
            ? data.detail
            : Array.isArray(data?.detail)
            ? data.detail.map((d: any) => d.msg || JSON.stringify(d)).join(", ")
            : "Login failed";
        setError(errorDetail);
        return;
      }

      localStorage.setItem("groomai_token", data.access_token);
      localStorage.setItem("groomai_email", data.email);
      document.cookie = `groomai_token=${data.access_token}; path=/; max-age=${60 * 60 * 24 * 7}`;

      router.push("/chat");
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Soft background ambient gradient */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-gradient-to-tr from-[#4C7359]/10 via-emerald-50/20 to-blue-50/30 blur-3xl rounded-full pointer-events-none -z-10" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 group mb-6">
          <div className="h-10 w-10 rounded-2xl bg-[#4C7359] text-white flex items-center justify-center shadow-sm group-hover:bg-[#3E6049] transition-colors">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-slate-900">
            Groom<span className="text-[#4C7359]">AI</span>
          </span>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Welcome back to your skin clinic
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-slate-500">
          Log in to access your consultations and inventory routines
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-sm rounded-3xl border border-slate-200/90 space-y-6">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                Email Address
              </label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-11"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-slate-400" />
                Password
              </label>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11"
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 font-medium">
                {error}
              </div>
            )}

            <div className="pt-2">
              <ShimmerButton
                type="submit"
                disabled={loading}
                className="w-full text-sm font-semibold py-3"
              >
                {loading ? "Signing in..." : "Sign In to GroomAI"}
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </ShimmerButton>
            </div>
          </form>

          <div className="border-t border-slate-100 pt-4 text-center">
            <p className="text-xs text-slate-500">
              Don&apos;t have an account yet?{" "}
              <Link
                href="/sign-up"
                className="font-semibold text-[#4C7359] hover:underline"
              >
                Create your clinical profile
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-slate-400">
          <ShieldCheck className="h-4 w-4 text-[#4C7359]" />
          <span>Secure Encrypted Medical-Grade Token Authentication</span>
        </div>
      </div>
    </div>
  );
}
