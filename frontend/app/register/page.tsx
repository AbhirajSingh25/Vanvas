"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "@/components/brand/Logo";
import {
  Compass, Lock, Mail, User as UserIcon, ArrowRight, AlertCircle, Sparkles
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
      await register(email.trim(), password, fullName.trim());
      router.push(redirectUrl);
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF4E8] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Decorative Blur Ornaments */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#173B32]/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[#B65E3C]/5 blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-6">
          <Logo size="lg" />
        </div>
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
