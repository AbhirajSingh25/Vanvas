"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import {
  Compass, Lock, Mail, User as UserIcon, ArrowRight, AlertCircle,
  CheckCircle2, RefreshCw, Send, Sparkles
} from "lucide-react";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get("redirect") || "/profile";
  const redirectUrl = rawRedirect.startsWith("/") && !rawRedirect.startsWith("//") ? rawRedirect : "/profile";

  const { register } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Post-registration verification card state
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
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
    if (!fullName.trim()) {
      setError("Please provide your full name.");
      return;
    }
    if (!email.trim()) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await register(email.trim(), password, fullName.trim());
      setRegisteredEmail(res.email || email.trim().toLowerCase());
      setResendCooldown(60);
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!registeredEmail || resendCooldown > 0 || resendLoading) return;
    setResendLoading(true);
    setResendMessage(null);
    try {
      const res = await api.resendVerification(registeredEmail);
      setResendMessage({ text: res.message || "Verification email resent.", isError: false });
      setResendCooldown(res.cooldown_seconds || 60);
    } catch (err: any) {
      setResendMessage({ text: err.message || "Failed to resend verification email.", isError: true });
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF4E8] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Decorative Blur Ornaments */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#173B32]/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[#B65E3C]/5 blur-3xl pointer-events-none" />

      {/* Main Container */}
      {registeredEmail ? (
        <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
          <div className="bg-[#FAF7F0] py-10 px-6 sm:px-10 shadow-xl border border-[#D8CBB2] rounded-3xl relative text-center">
            {/* Header Icon */}
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-[#173B32]/10 border border-[#173B32]/20 flex items-center justify-center text-[#173B32]">
              <Mail className="w-8 h-8 text-[#173B32]" />
            </div>

            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#173B32] tracking-tight">
              Account Created
            </h2>
            <div className="font-devanagari text-xs text-[#B49252] mt-1">
              खाता बनाया गया • सत्यापन आवश्यक है
            </div>

            <div className="mt-5 p-4 rounded-2xl bg-[#EFE5D2]/70 border border-[#D8CBB2] text-left space-y-2">
              <div className="text-xs font-semibold text-[#173B32] uppercase tracking-wider">
                Check your inbox at:
              </div>
              <div className="text-sm font-bold text-[#B65E3C] break-all">
                {registeredEmail}
              </div>
              <p className="text-xs text-[#20211D]/80 leading-relaxed pt-1">
                We sent you a secure verification link to activate your VANVAS travel passport. Please click the link to complete registration.
              </p>
            </div>

            {resendMessage && (
              <div
                className={`mt-4 p-3 rounded-xl text-xs font-medium flex items-start gap-2 text-left ${
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

            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0 || resendLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-[#D8CBB2] rounded-2xl bg-white text-xs font-bold uppercase tracking-wider text-[#173B32] hover:bg-[#E5D5BA]/40 active:scale-[0.99] transition-all disabled:opacity-60 cursor-pointer shadow-xs"
              >
                {resendLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-[#173B32]" />
                ) : (
                  <Send className="w-4 h-4 text-[#B49252]" />
                )}
                <span>
                  {resendCooldown > 0
                    ? `Resend Email (${resendCooldown}s)`
                    : "Resend Verification Email"}
                </span>
              </button>

              <Link
                href={`/login?redirect=${encodeURIComponent(redirectUrl)}`}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs font-bold uppercase tracking-widest text-[#EFE5D2] bg-[#173B32] hover:bg-[#20453B] active:scale-[0.99] transition-all shadow-md"
              >
                <span>Back to Sign In</span>
                <ArrowRight className="w-4 h-4 text-[#B49252]" />
              </Link>
            </div>

            <div className="mt-6 text-center">
              <Link
                href="/explore"
                className="text-xs text-[#173B32]/70 hover:text-[#173B32] font-semibold inline-flex items-center gap-1.5"
              >
                <Compass className="w-3.5 h-3.5 text-[#B49252]" />
                <span>Continue exploring destinations</span>
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Header without duplicate logo */}
          <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
            <h2 className="font-serif text-3xl font-bold text-[#173B32] tracking-tight">
              Join the Sorted Club
            </h2>
            <p className="mt-2 text-xs text-[#20211D]/70 font-medium">
              Create your personalized travel passport for thoughtful, spontaneous Himalayan expeditions.
            </p>
            <div className="font-devanagari text-xs text-[#B49252] mt-0.5">
              नया यात्रा खाता बनाएं
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

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#173B32] uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <UserIcon className="h-4 w-4 text-[#B49252]" />
                    </div>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Maya Negi"
                      className="block w-full pl-10 pr-4 py-3 border border-[#D8CBB2] rounded-2xl text-sm bg-white text-[#20211D] placeholder-[#20211D]/40 focus:outline-hidden focus:ring-2 focus:ring-[#173B32] focus:border-transparent transition-all"
                    />
                  </div>
                </div>

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
                      placeholder="your.email@example.com"
                      className="block w-full pl-10 pr-4 py-3 border border-[#D8CBB2] rounded-2xl text-sm bg-white text-[#20211D] placeholder-[#20211D]/40 focus:outline-hidden focus:ring-2 focus:ring-[#173B32] focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#173B32] uppercase tracking-wider mb-1.5">
                    Password (min 6 characters)
                  </label>
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

                <div>
                  <label className="block text-xs font-bold text-[#173B32] uppercase tracking-wider mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-[#B49252]" />
                    </div>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="block w-full pl-10 pr-4 py-3 border border-[#D8CBB2] rounded-2xl text-sm bg-white text-[#20211D] placeholder-[#20211D]/40 focus:outline-hidden focus:ring-2 focus:ring-[#173B32] focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 mt-2 border border-transparent rounded-2xl shadow-md text-xs font-bold uppercase tracking-widest text-[#EFE5D2] bg-[#B65E3C] hover:bg-[#9E4D2E] active:scale-[0.99] transition-all disabled:opacity-60 cursor-pointer"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-[#EFE5D2] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Create Account</span>
                      <ArrowRight className="w-4 h-4 text-[#EFE5D2]" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center text-xs text-[#20211D]/70">
                <span>Already have an account? </span>
                <Link
                  href={`/login?redirect=${encodeURIComponent(redirectUrl)}`}
                  className="font-bold text-[#173B32] hover:underline"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF4E8] flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-[#173B32] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
