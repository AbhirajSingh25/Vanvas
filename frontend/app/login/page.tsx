"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "@/components/brand/Logo";
import {
  Compass, Lock, Mail, ArrowRight, AlertCircle, Sparkles, CheckCircle2
} from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get("redirect") || "/profile";
  // Prevent open redirect vulnerabilities by ensuring redirect starts with '/'
  const redirectUrl = rawRedirect.startsWith("/") && !rawRedirect.startsWith("//") ? rawRedirect : "/profile";

  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Please provide both email and password.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await login(email.trim(), password);
      router.push(redirectUrl);
    } catch (err: any) {
      setError(err.message || "Invalid credentials. Please check your email and password.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = () => {
    setEmail("traveller@vanvas.com");
    setPassword("pass123");
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#FAF4E8] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Decorative Mountain Mist Ornaments */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#173B32]/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[#B65E3C]/5 blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-6">
          <Logo size="lg" />
        </div>
        <h2 className="font-serif text-3xl font-bold text-[#173B32] tracking-tight">
          Welcome Back, Traveler
        </h2>
        <p className="mt-2 text-xs text-[#20211D]/70 font-medium">
          Sign in to access your Himalayan expeditions, saved gems, and AI travel journal.
        </p>
        <div className="font-devanagari text-xs text-[#B49252] mt-0.5">
          यात्रा फिर से शुरू करें
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-[#FAF7F0] py-8 px-6 sm:px-10 shadow-lg border border-[#D8CBB2] rounded-3xl relative">
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-[#B65E3C]/10 border border-[#B65E3C]/30 flex items-start gap-3 animate-fadeIn">
              <AlertCircle className="w-5 h-5 text-[#B65E3C] shrink-0 mt-0.5" />
              <div className="text-xs text-[#7B4D36] font-medium leading-relaxed">
                {error}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-[#173B32] uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-[#B49252]" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.name@example.com"
                  className="block w-full pl-10 pr-4 py-3 border border-[#D8CBB2] rounded-2xl text-sm bg-white text-[#20211D] placeholder-[#20211D]/40 focus:outline-hidden focus:ring-2 focus:ring-[#173B32] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-[#173B32] uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-[#B49252]" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-4 py-3 border border-[#D8CBB2] rounded-2xl text-sm bg-white text-[#20211D] placeholder-[#20211D]/40 focus:outline-hidden focus:ring-2 focus:ring-[#173B32] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 border border-transparent rounded-2xl shadow-md text-xs font-bold uppercase tracking-widest text-[#EFE5D2] bg-[#173B32] hover:bg-[#20453B] active:scale-[0.99] transition-all disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-[#EFE5D2] border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 text-[#B49252]" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Pre-fill Pill */}
          <div className="mt-6 pt-5 border-t border-[#D8CBB2]/60 text-center">
            <button
              type="button"
              onClick={fillDemoAccount}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E5D5BA]/50 text-[11px] font-semibold text-[#173B32] hover:bg-[#E5D5BA] transition-colors cursor-pointer border border-[#D8CBB2]"
            >
              <Sparkles className="w-3 h-3 text-[#B49252]" />
              <span>Use Demo Account (traveller@vanvas.com)</span>
            </button>
          </div>

          <div className="mt-6 text-center text-xs text-[#20211D]/70">
            <span>New to VANVAS? </span>
            <Link
              href={`/register?redirect=${encodeURIComponent(redirectUrl)}`}
              className="font-bold text-[#B65E3C] hover:text-[#9E4D2E] hover:underline"
            >
              Create Account
            </Link>
          </div>
        </div>

        {/* Footer Back to Explore */}
        <div className="mt-6 text-center">
          <Link
            href="/explore"
            className="text-xs text-[#173B32]/70 hover:text-[#173B32] font-semibold inline-flex items-center gap-1"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Continue exploring destinations without signing in</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF4E8] flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-[#173B32] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
