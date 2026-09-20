"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import {
  Compass, CheckCircle2, AlertCircle, Clock, RefreshCw, Send, ArrowRight, ShieldCheck, Mail, KeyRound
} from "lucide-react";

type VerificationStatus = "idle" | "verifying" | "success" | "already_verified" | "expired" | "invalid" | "max_attempts" | "error";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") || "";

  const [email, setEmail] = useState<string>(initialEmail);
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [status, setStatus] = useState<VerificationStatus>("idle");
  const [message, setMessage] = useState<string>("");
  const [verifiedEmail, setVerifiedEmail] = useState<string>("");

  // Resend state
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendNotice, setResendNotice] = useState<{ text: string; isError: boolean } | null>(null);

  // Input refs for 6 OTP boxes
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  useEffect(() => {
    // Focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleOtpChange = (index: number, value: string) => {
    // Accept only digits
    const cleaned = value.replace(/\D/g, "");
    if (!cleaned) {
      const newDigits = [...otpDigits];
      newDigits[index] = "";
      setOtpDigits(newDigits);
      return;
    }

    // Single digit entry
    const char = cleaned.slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = char;
    setOtpDigits(newDigits);

    // Auto-advance to next box if available
    if (index < 5 && char) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!otpDigits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pastedData) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pastedData[i] || "";
    }
    setOtpDigits(newDigits);

    // Focus the box after the last filled digit
    const nextIdx = Math.min(pastedData.length, 5);
    inputRefs.current[nextIdx]?.focus();
  };

  const fullOtp = otpDigits.join("");
  const isOtpComplete = fullOtp.length === 6 && /^[0-9]{6}$/.test(fullOtp);

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const targetEmail = email.trim().toLowerCase();
    if (!targetEmail) {
      setStatus("error");
      setMessage("Please enter your account email address.");
      return;
    }
    if (!isOtpComplete) {
      setStatus("error");
      setMessage("Please enter all 6 digits of your verification code.");
      return;
    }

    setStatus("verifying");
    setMessage("");

    try {
      const res = await api.verifyEmail(targetEmail, fullOtp);
      if (res.already_verified) {
        setStatus("already_verified");
        setMessage(res.message || "Your email address is already verified.");
      } else {
        setStatus("success");
        setMessage(res.message || "Your email has been verified successfully. Welcome to VANVAS!");
      }
      setVerifiedEmail(res.email || targetEmail);
    } catch (err: any) {
      const errStr = (err.message || "").toLowerCase();
      if (errStr.includes("expired")) {
        setStatus("expired");
        setMessage("Your verification code has expired. Please request a new code.");
      } else if (errStr.includes("too many") || errStr.includes("invalidated")) {
        setStatus("max_attempts");
        setMessage("Too many failed attempts. This code has been invalidated. Please request a new code.");
      } else if (errStr.includes("already verified")) {
        setStatus("already_verified");
        setMessage("This account is already verified. You can sign in immediately.");
      } else if (errStr.includes("invalid") || errStr.includes("not match")) {
        setStatus("invalid");
        setMessage(err.message || "Invalid verification code. Please check the digits and try again.");
      } else {
        setStatus("error");
        setMessage(err.message || "Unable to complete verification. Please check your connection and try again.");
      }
    }
  };

  const handleResend = async () => {
    const targetEmail = email.trim().toLowerCase();
    if (!targetEmail || resendCooldown > 0 || resendLoading) return;

    setResendLoading(true);
    setResendNotice(null);

    try {
      const res = await api.resendVerification(targetEmail);
      setResendNotice({
        text: res.message || "A new 6-digit verification code has been sent to your email.",
        isError: false
      });
      setResendCooldown(res.cooldown_seconds || 60);
      // Reset OTP inputs
      setOtpDigits(["", "", "", "", "", ""]);
      setStatus("idle");
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setResendNotice({
        text: err.message || "Failed to resend verification code. Please try again.",
        isError: true
      });
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF4E8] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Decorative Mountain Mist Ornaments */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#173B32]/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[#B65E3C]/5 blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-[#FAF7F0] py-10 px-6 sm:px-10 shadow-xl border border-[#D8CBB2] rounded-3xl relative text-center">

          {/* 1. SUCCESS STATE */}
          {status === "success" && (
            <div className="space-y-4 animate-fadeIn">
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
                {message || "Your VANVAS travel account is active and verified. You can now sign in to start curating Himalayan expeditions."}
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

          {/* 2. ALREADY VERIFIED STATE */}
          {status === "already_verified" && (
            <div className="space-y-4 animate-fadeIn">
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

          {/* 3. PRIMARY OTP INPUT FLOW */}
          {status !== "success" && status !== "already_verified" && (
            <div className="space-y-5">
              {/* Header Icon */}
              <div className="w-16 h-16 mx-auto rounded-2xl bg-[#173B32]/10 border border-[#173B32]/20 flex items-center justify-center text-[#173B32]">
                <KeyRound className="w-8 h-8 text-[#173B32]" />
              </div>

              <div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#173B32] tracking-tight">
                  Verify Your Email
                </h2>
                <div className="font-devanagari text-xs text-[#B49252] mt-0.5">
                  ओटीपी सत्यापन • ६ अंकों का कोड दर्ज करें
                </div>
              </div>

              {/* Email description */}
              <div className="p-3.5 rounded-2xl bg-[#EFE5D2]/70 border border-[#D8CBB2] text-left">
                <div className="text-[11px] font-semibold text-[#173B32] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#B49252]" />
                  <span>We sent a 6-digit code to:</span>
                </div>
                {email ? (
                  <div className="text-xs font-bold text-[#B65E3C] break-all">
                    {email}
                  </div>
                ) : (
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="block w-full px-3 py-1.5 border border-[#D8CBB2] rounded-xl text-xs bg-white text-[#20211D] focus:ring-2 focus:ring-[#173B32] focus:outline-hidden mt-1"
                  />
                )}
              </div>

              {/* Error alerts */}
              {message && (
                <div
                  className={`p-3.5 rounded-2xl text-xs font-medium flex items-start gap-2.5 text-left animate-fadeIn ${
                    status === "expired" || status === "max_attempts" || status === "invalid" || status === "error"
                      ? "bg-[#B65E3C]/10 border border-[#B65E3C]/30 text-[#7B4D36]"
                      : "bg-[#173B32]/10 border border-[#173B32]/30 text-[#173B32]"
                  }`}
                >
                  {status === "expired" ? (
                    <Clock className="w-4 h-4 text-[#B65E3C] shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-[#B65E3C] shrink-0 mt-0.5" />
                  )}
                  <span className="leading-relaxed">{message}</span>
                </div>
              )}

              {/* Resend status notice */}
              {resendNotice && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium flex items-start gap-2 text-left animate-fadeIn ${
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

              {/* 6-Digit OTP Box Grid */}
              <form onSubmit={handleVerify} className="space-y-5">
                <div className="flex justify-center items-center gap-2 sm:gap-3 my-2">
                  {otpDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        inputRefs.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={handlePaste}
                      disabled={status === "verifying"}
                      className={`w-11 h-13 sm:w-12 sm:h-14 text-center font-mono text-xl sm:text-2xl font-bold rounded-2xl border transition-all duration-150 shadow-xs focus:outline-hidden ${
                        digit
                          ? "border-[#173B32] bg-white text-[#173B32] ring-2 ring-[#173B32]/10"
                          : "border-[#D8CBB2] bg-white text-[#20211D] focus:border-[#B65E3C] focus:ring-2 focus:ring-[#B65E3C]/20"
                      }`}
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={status === "verifying" || !isOtpComplete || !email.trim()}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl text-xs font-bold uppercase tracking-widest text-[#EFE5D2] bg-[#B65E3C] hover:bg-[#9E4D2E] active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer shadow-md"
                >
                  {status === "verifying" ? (
                    <div className="w-4 h-4 border-2 border-[#EFE5D2] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Verify Email</span>
                      <ArrowRight className="w-4 h-4 text-[#EFE5D2]" />
                    </>
                  )}
                </button>
              </form>

              {/* Resend OTP Section */}
              <div className="pt-3 border-t border-[#D8CBB2]/60 space-y-2">
                <div className="text-xs text-[#20211D]/70">
                  Didn't receive the verification code?
                </div>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || resendLoading || !email.trim()}
                  className="inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl border border-[#D8CBB2] bg-white text-xs font-bold uppercase tracking-wider text-[#173B32] hover:bg-[#EFE5D2]/60 transition-all disabled:opacity-50 cursor-pointer shadow-2xs"
                >
                  {resendLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#173B32]" />
                  ) : (
                    <Send className="w-3.5 h-3.5 text-[#B49252]" />
                  )}
                  <span>
                    {resendCooldown > 0
                      ? `Resend Code (${resendCooldown}s)`
                      : "Resend 6-Digit Code"}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Footer Navigation Links */}
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
