"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import {
  Compass, CheckCircle2, AlertCircle, Clock, RefreshCw, Send, ArrowRight, ShieldCheck
} from "lucide-react";

type VerificationStatus = "verifying" | "success" | "already_verified" | "expired" | "invalid" | "error" | "no_token";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<VerificationStatus>(token ? "verifying" : "no_token");
  const [message, setMessage] = useState<string>("");
  const [verifiedEmail, setVerifiedEmail] = useState<string>("");

  // Resend form state for expired / invalid flows
  const [resendEmail, setResendEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendNotice, setResendNotice] = useState<{ text: string; isError: boolean } | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    if (!token) {
      setStatus("no_token");
      return;
    }

    let isMounted = true;

    async function performVerification() {
      setStatus("verifying");
      try {
        const res = await api.verifyEmail(token!);
        if (!isMounted) return;

        if (res.already_verified) {
          setStatus("already_verified");
          setMessage(res.message || "Your email address is already verified.");
        } else {
          setStatus("success");
          setMessage(res.message || "Your email has been verified successfully.");
        }
        if (res.email) setVerifiedEmail(res.email);
      } catch (err: any) {
        if (!isMounted) return;
        const errStr = (err.message || "").toLowerCase();

        if (errStr.includes("expired")) {
          setStatus("expired");
          setMessage("Your verification link has expired. Verification links are valid for 24 hours.");
        } else if (errStr.includes("already been used")) {
          setStatus("already_verified");
          setMessage("This verification link has already been used. Your account is ready.");
        } else if (errStr.includes("invalid") || errStr.includes("not found")) {
          setStatus("invalid");
          setMessage("The verification link is invalid or malformed.");
        } else {
          setStatus("error");
          setMessage(err.message || "Unable to complete verification. Please check your network connection.");
        }
      }
    }

    performVerification();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail.trim() || resendCooldown > 0 || resendLoading) return;
    setResendLoading(true);
    setResendNotice(null);

    try {
      const res = await api.resendVerification(resendEmail.trim());
      setResendNotice({ text: res.message || "A new verification link has been sent.", isError: false });
      setResendCooldown(res.cooldown_seconds || 60);
    } catch (err: any) {
      setResendNotice({ text: err.message || "Failed to resend verification email.", isError: true });
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF4E8] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Decorative Blur Ornaments */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#173B32]/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[#B65E3C]/5 blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-[#FAF7F0] py-10 px-6 sm:px-10 shadow-xl border border-[#D8CBB2] rounded-3xl relative text-center">

          {/* 1. VERIFYING STATE */}
          {status === "verifying" && (
            <div className="space-y-4">
              <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-3 border-[#173B32]/20 border-t-[#B65E3C] animate-spin" />
                <Compass className="w-8 h-8 text-[#173B32] animate-pulse" />
              </div>
              <h2 className="font-serif text-2xl font-bold text-[#173B32] tracking-tight">
                Verifying Your Passport
              </h2>
              <p className="text-xs text-[#20211D]/70 font-medium">
                Validating your cryptographic credentials with VANVAS security servers...
              </p>
              <div className="font-devanagari text-xs text-[#B49252]">
                सत्यापन प्रगति पर है...
              </div>
            </div>
          )}

          {/* 2. SUCCESS STATE */}
          {status === "success" && (
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-[#173B32]/10 border border-[#173B32]/20 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-[#173B32]" />
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#173B32] tracking-tight">
                Email Verified
              </h2>
              <div className="font-devanagari text-xs text-[#B49252]">
                सत्यापन सफल • यात्रा शुरू करें
              </div>
              <p className="text-xs text-[#20211D]/80 leading-relaxed max-w-sm mx-auto">
                {message || "Your VANVAS travel account is active and verified. You can now sign in to start planning your journeys."}
              </p>
              {verifiedEmail && (
                <div className="inline-block px-3 py-1 rounded-full bg-[#EFE5D2] text-[11px] font-bold text-[#173B32] border border-[#D8CBB2]">
                  {verifiedEmail}
                </div>
              )}
              <div className="pt-4">
                <Link
                  href="/login"
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl text-xs font-bold uppercase tracking-widest text-[#EFE5D2] bg-[#B65E3C] hover:bg-[#9E4D2E] active:scale-[0.99] transition-all shadow-md"
                >
                  <span>Continue to Sign In</span>
                  <ArrowRight className="w-4 h-4 text-[#EFE5D2]" />
                </Link>
              </div>
            </div>
          )}

          {/* 3. ALREADY VERIFIED STATE */}
          {status === "already_verified" && (
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-[#B49252]/15 border border-[#B49252]/30 flex items-center justify-center">
                <ShieldCheck className="w-8 h-8 text-[#173B32]" />
              </div>
              <h2 className="font-serif text-2xl font-bold text-[#173B32] tracking-tight">
                Already Verified
              </h2>
              <div className="font-devanagari text-xs text-[#B49252]">
                खाता पहले से सत्यापित है
              </div>
              <p className="text-xs text-[#20211D]/80 leading-relaxed max-w-sm mx-auto">
                {message || "This email address is already verified. You can proceed directly to sign in."}
              </p>
              <div className="pt-4">
                <Link
                  href="/login"
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl text-xs font-bold uppercase tracking-widest text-[#EFE5D2] bg-[#173B32] hover:bg-[#20453B] active:scale-[0.99] transition-all shadow-md"
                >
                  <span>Continue to Sign In</span>
                  <ArrowRight className="w-4 h-4 text-[#B49252]" />
                </Link>
              </div>
            </div>
          )}

          {/* 4. EXPIRED TOKEN STATE */}
          {status === "expired" && (
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-[#B65E3C]/10 border border-[#B65E3C]/25 flex items-center justify-center">
                <Clock className="w-8 h-8 text-[#B65E3C]" />
              </div>
              <h2 className="font-serif text-2xl font-bold text-[#173B32] tracking-tight">
                Link Expired
              </h2>
              <div className="font-devanagari text-xs text-[#B65E3C]">
                सत्यापन लिंक समाप्त हो गया है
              </div>
              <p className="text-xs text-[#20211D]/80 leading-relaxed max-w-sm mx-auto">
                {message || "Your verification link has expired. Enter your email below to receive a fresh verification link."}
              </p>

              {resendNotice && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium flex items-start gap-2 text-left ${
                    resendNotice.isError
                      ? "bg-[#B65E3C]/10 border border-[#B65E3C]/30 text-[#7B4D36]"
                      : "bg-[#173B32]/10 border border-[#173B32]/30 text-[#173B32]"
                  }`}
                >
                  {resendNotice.isError ? (
                    <AlertCircle className="w-4 h-4 text-[#B65E3C] shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-[#173B32] shrink-0 mt-0.5" />
                  )}
                  <span>{resendNotice.text}</span>
                </div>
              )}

              <form onSubmit={handleResend} className="space-y-3 pt-2 text-left">
                <input
                  type="email"
                  required
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="Enter your registration email"
                  className="block w-full px-4 py-2.5 border border-[#D8CBB2] rounded-2xl text-xs bg-white text-[#20211D] focus:ring-2 focus:ring-[#173B32] focus:outline-hidden"
                />
                <button
                  type="submit"
                  disabled={resendCooldown > 0 || resendLoading || !resendEmail.trim()}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs font-bold uppercase tracking-wider text-[#EFE5D2] bg-[#173B32] hover:bg-[#20453B] active:scale-[0.99] transition-all disabled:opacity-60 cursor-pointer shadow-md"
                >
                  {resendLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-[#B49252]" />
                  ) : (
                    <Send className="w-4 h-4 text-[#B49252]" />
                  )}
                  <span>
                    {resendCooldown > 0
                      ? `Resend Email (${resendCooldown}s)`
                      : "Send New Verification Link"}
                  </span>
                </button>
              </form>
            </div>
          )}

          {/* 5. INVALID TOKEN / NO TOKEN / ERROR STATE */}
          {(status === "invalid" || status === "no_token" || status === "error") && (
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-[#B65E3C]/10 border border-[#B65E3C]/25 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-[#B65E3C]" />
              </div>
              <h2 className="font-serif text-2xl font-bold text-[#173B32] tracking-tight">
                {status === "no_token" ? "Verification Link Needed" : "Verification Failed"}
              </h2>
              <div className="font-devanagari text-xs text-[#B65E3C]">
                {status === "no_token" ? "लिंक उपलब्ध नहीं है" : "सत्यापन विफल रहा"}
              </div>
              <p className="text-xs text-[#20211D]/80 leading-relaxed max-w-sm mx-auto">
                {message || "The verification link is invalid, incomplete, or the server could not be reached. Request a new link below."}
              </p>

              {resendNotice && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium flex items-start gap-2 text-left ${
                    resendNotice.isError
                      ? "bg-[#B65E3C]/10 border border-[#B65E3C]/30 text-[#7B4D36]"
                      : "bg-[#173B32]/10 border border-[#173B32]/30 text-[#173B32]"
                  }`}
                >
                  {resendNotice.isError ? (
                    <AlertCircle className="w-4 h-4 text-[#B65E3C] shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-[#173B32] shrink-0 mt-0.5" />
                  )}
                  <span>{resendNotice.text}</span>
                </div>
              )}

              <form onSubmit={handleResend} className="space-y-3 pt-2 text-left">
                <input
                  type="email"
                  required
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="Enter your registration email"
                  className="block w-full px-4 py-2.5 border border-[#D8CBB2] rounded-2xl text-xs bg-white text-[#20211D] focus:ring-2 focus:ring-[#173B32] focus:outline-hidden"
                />
                <button
                  type="submit"
                  disabled={resendCooldown > 0 || resendLoading || !resendEmail.trim()}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs font-bold uppercase tracking-wider text-[#EFE5D2] bg-[#173B32] hover:bg-[#20453B] active:scale-[0.99] transition-all disabled:opacity-60 cursor-pointer shadow-md"
                >
                  {resendLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-[#B49252]" />
                  ) : (
                    <Send className="w-4 h-4 text-[#B49252]" />
                  )}
                  <span>
                    {resendCooldown > 0
                      ? `Resend Email (${resendCooldown}s)`
                      : "Send Verification Email"}
                  </span>
                </button>
              </form>
            </div>
          )}

          {/* Footer Back Links */}
          <div className="mt-8 pt-5 border-t border-[#D8CBB2]/60 flex items-center justify-center gap-4 text-xs font-semibold text-[#173B32]/80">
            <Link href="/login" className="hover:text-[#173B32] hover:underline">
              Sign In
            </Link>
            <span>•</span>
            <Link href="/register" className="hover:text-[#173B32] hover:underline">
              Register New
            </Link>
            <span>•</span>
            <Link href="/explore" className="hover:text-[#173B32] hover:underline">
              Explore
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF4E8] flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-[#173B32] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
