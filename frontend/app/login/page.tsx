"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import {
  Compass, Lock, Mail, ArrowRight, AlertCircle, RefreshCw, Send, CheckCircle2
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

  // Unverified account handling
  const [isUnverified, setIsUnverified] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState<{ text: string; isError: boolean } | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Please provide both email and password.");
      return;
    }

    setLoading(true);
    setError(null);
    setIsUnverified(false);
    setResendMessage(null);

    try {
      await login(email.trim(), password);
      router.push(redirectUrl);
    } catch (err: any) {
      const errMsg = err.message || "Invalid credentials. Please check your email and password.";
      setError(errMsg);
      if (errMsg.toLowerCase().includes("verify your email") || errMsg.toLowerCase().includes("email_not_verified")) {
        setIsUnverified(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim() || resendCooldown > 0 || resendLoading) return;
    setResendLoading(true);
    setResendMessage(null);
    try {
      const res = await api.resendVerification(email.trim());
      setResendMessage({ text: res.message || "Verification email sent.", isError: false });
      setResendCooldown(res.cooldown_seconds || 60);
    } catch (err: any) {
      setResendMessage({ text: err.message || "Failed to resend verification link.", isError: true });
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF4E8] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Decorative Mountain Mist Ornaments */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#173B32]/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[#B65E3C]/5 blur-3xl pointer-events-none" />

      {/* Header without duplicate logo */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
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
            <div className="mb-6 p-4 rounded-2xl bg-[#B65E3C]/10 border border-[#B65E3C]/30 space-y-3 animate-fadeIn">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-[#B65E3C] shrink-0 mt-0.5" />
                <div className="text-xs text-[#7B4D36] font-medium leading-relaxed">
                  {error}
                </div>
              </div>

              {/* Inline Resend Action if Account is Unverified */}
              {isUnverified && (
                <div className="pt-2 border-t border-[#B65E3C]/20">
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendCooldown > 0 || resendLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#173B32] text-[11px] font-bold uppercase tracking-wider text-[#EFE5D2] hover:bg-[#20453B] transition-all disabled:opacity-60 cursor-pointer shadow-xs"
                  >
                    {resendLoading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#B49252]" />
                    ) : (
                      <Send className="w-3.5 h-3.5 text-[#B49252]" />
                    )}
                    <span>
                      {resendCooldown > 0
                        ? `Resend Link (${resendCooldown}s)`
                        : "Resend Verification Email"}
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}

          {resendMessage && (
            <div
              className={`mb-6 p-3 rounded-xl text-xs font-medium flex items-start gap-2 ${
                resendMessage.isError
                  ? "bg-[#B65E3C]/10 border border-[#B65E3C]/30 text-[#7B4D36]"
                  : "bg-[#173B32]/10 border border-[#173B32]/30 text-[#173B32]"
              }`}
            >
              {resendMessage.isError ? (
                <AlertCircle className="w-4 h-4 text-[#B65E3C] shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-[#173B32] shrink-0 mt-0.5" />
              )}
              <span>{resendMessage.text}</span>
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
