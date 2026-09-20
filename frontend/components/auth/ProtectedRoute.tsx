"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import {
  Compass, Mail, Send, RefreshCw, AlertCircle, CheckCircle2, ArrowRight
} from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  requireVerified?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  redirectTo,
  requireVerified = true,
}) => {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);
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
    if (!isLoading && !user) {
      const destination = redirectTo || `/login?redirect=${encodeURIComponent(pathname)}`;
      router.push(destination);
    }
  }, [user, isLoading, router, pathname, redirectTo]);

  const handleResend = async () => {
    if (!user?.email || resendCooldown > 0 || resendLoading) return;
    setResendLoading(true);
    setResendNotice(null);

    try {
      const res = await api.resendVerification(user.email);
      setResendNotice({ text: res.message || "Verification email sent.", isError: false });
      setResendCooldown(res.cooldown_seconds || 60);
    } catch (err: any) {
      setResendNotice({ text: err.message || "Failed to resend verification link.", isError: true });
    } finally {
      setResendLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] bg-[#FAF4E8] flex flex-col items-center justify-center p-6 text-center">
        <div className="relative w-16 h-16 mb-4 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-3 border-[#173B32]/20 border-t-[#B65E3C] animate-spin" />
          <Compass className="w-7 h-7 text-[#173B32] animate-pulse" />
        </div>
        <div className="font-serif text-lg font-bold text-[#173B32]">
          Verifying Travel Credentials
        </div>
        <div className="font-devanagari text-xs text-[#B49252] mt-1">
          यात्री सत्यापन हो रहा है...
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // If email verification is required and user has not verified their email
  if (requireVerified && user.email_verified_at === null) {
    return (
      <div className="min-h-[70vh] bg-[#FAF4E8] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-[#FAF7F0] p-8 rounded-3xl border border-[#D8CBB2] shadow-xl space-y-4 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#B65E3C]/10 border border-[#B65E3C]/20 flex items-center justify-center">
            <Mail className="w-8 h-8 text-[#B65E3C]" />
          </div>

          <h2 className="font-serif text-2xl font-bold text-[#173B32]">
            Email Verification Required
          </h2>
          <div className="font-devanagari text-xs text-[#B49252]">
            खाता सत्यापन आवश्यक है
          </div>

          <p className="text-xs text-[#20211D]/80 leading-relaxed">
            Please verify your email address (<strong>{user.email}</strong>) to access private travel features, trips, and saved bookmarks.
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

          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0 || resendLoading}
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
                  : "Resend Verification Email"}
              </span>
            </button>

            <button
              type="button"
              onClick={logout}
              className="w-full py-2.5 px-4 text-xs font-semibold text-[#B65E3C] hover:underline cursor-pointer"
            >
              Sign Out & Switch Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
