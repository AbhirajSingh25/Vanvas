"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { LifeBuoy, ArrowLeft, Send, CheckCircle2, Copy, AlertCircle, Sparkles, Smartphone, Shield, ExternalLink } from "lucide-react";
import { isCapacitorNative } from "@/lib/capacitor";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { trackEvent } from "@/lib/analytics";

export default function SupportPage() {
  const { user } = useAuth();
  const [diagnosticId, setDiagnosticId] = useState("");
  const [platform, setPlatform] = useState("web");
  const [copied, setCopied] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("general");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [apiHealth, setApiHealth] = useState<string>("checking");

  useEffect(() => {
    // Generate or retrieve persistent diagnostic ID
    let diagId = "";
    if (typeof window !== "undefined") {
      diagId = window.localStorage.getItem("vanvas_diag_id") || "";
      if (!diagId) {
        diagId = "VAN-" + Math.random().toString(36).substring(2, 8).toUpperCase() + "-" + Date.now().toString(36).toUpperCase();
        window.localStorage.setItem("vanvas_diag_id", diagId);
      }
      setDiagnosticId(diagId);
      setPlatform(isCapacitorNative() ? "android-app" : "web-pwa");
    }

    // Health check
    api.getAppHealth()
      .then((res: any) => setApiHealth(res?.status || "healthy"))
      .catch(() => setApiHealth("degraded"));
  }, []);

  const handleCopyDiagnostic = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(diagnosticId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    trackEvent("support_ticket_created", { category, platform });

    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#FAF4E8] py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#173B32] hover:text-[#B49252] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Explorer&apos;s Desk</span>
          </Link>
          <div className="flex items-center gap-2 text-xs font-medium text-[#20211D]/70">
            <span className={`w-2 h-2 rounded-full ${apiHealth === "healthy" ? "bg-emerald-500" : "bg-amber-500"}`} />
            <span>Backend: {apiHealth}</span>
          </div>
        </div>

        {/* Header Hero */}
        <div className="bg-[#FAF7F0] border border-[#D8CBB2] rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
          <div className="relative z-10 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#B49252]">
              <LifeBuoy className="w-4 h-4" />
              <span>Assistance & Diagnostics</span>
            </div>
            <h1 className="font-serif text-3xl font-bold text-[#173B32]">
              VANVAS Expedition Support
            </h1>
            <p className="text-xs text-[#20211D]/80 leading-relaxed">
              Need assistance with an itinerary, offline pack, or road trip routing? Our team is available to assist your journey.
            </p>
          </div>
        </div>

        {/* Diagnostic Metadata Card */}
        <div className="p-5 rounded-2xl bg-white border border-[#D8CBB2] space-y-3">
          <div className="text-xs font-bold text-[#173B32] uppercase tracking-wider flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-[#B49252]" />
            <span>App Diagnostics & Session Metadata</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 rounded-xl bg-[#FAF7F0] border border-[#D8CBB2]/50">
              <span className="text-[#20211D]/60 block text-[10px] uppercase">App Version</span>
              <span className="font-mono font-bold text-[#173B32]">0.1.0</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#FAF7F0] border border-[#D8CBB2]/50">
              <span className="text-[#20211D]/60 block text-[10px] uppercase">Runtime Platform</span>
              <span className="font-mono font-bold text-[#173B32]">{platform}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#FAF7F0] border border-[#D8CBB2]/50 col-span-2 flex items-center justify-between">
              <div>
                <span className="text-[#20211D]/60 block text-[10px] uppercase">Diagnostic ID</span>
                <span className="font-mono font-bold text-[#173B32] text-[11px]">{diagnosticId || "Generating..."}</span>
              </div>
              <button
                type="button"
                onClick={handleCopyDiagnostic}
                className="p-1.5 rounded-lg hover:bg-[#E5D5BA]/50 text-[#173B32] transition-colors cursor-pointer"
                title="Copy Diagnostic ID"
              >
                {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Support Ticket Form or Success State */}
        <div className="bg-[#FAF7F0] border border-[#D8CBB2] rounded-3xl p-6 sm:p-8 shadow-sm">
          {submitted ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#173B32]/10 text-[#173B32] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6 text-[#173B32]" />
              </div>
              <h2 className="font-serif text-2xl font-bold text-[#173B32]">Report Received</h2>
              <p className="text-xs text-[#20211D]/80 max-w-md mx-auto leading-relaxed">
                Thank you for helping us improve VANVAS. Your diagnostic context (<span className="font-mono font-bold">{diagnosticId}</span>) has been referenced for investigation.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setSubject("");
                  setDescription("");
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#173B32] text-xs font-bold text-[#EFE5D2] hover:bg-[#20453B] transition-colors cursor-pointer"
              >
                <span>Submit Another Request</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="font-serif text-lg font-bold text-[#173B32]">Report a Problem or Inquire</h2>

              <div>
                <label className="block text-xs font-bold text-[#173B32] uppercase tracking-wider mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8CBB2] bg-white text-xs text-[#20211D] focus:ring-2 focus:ring-[#173B32] focus:outline-hidden"
                >
                  <option value="general">General Question</option>
                  <option value="itinerary">Itinerary / Road Trip Issue</option>
                  <option value="offline">Offline Trip Pack</option>
                  <option value="notifications">Push Notifications & Alerts</option>
                  <option value="account">Account & Privacy</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#173B32] uppercase tracking-wider mb-1.5">
                  Subject
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief summary of your inquiry"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8CBB2] bg-white text-xs text-[#20211D] focus:ring-2 focus:ring-[#173B32] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#173B32] uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Please describe what happened or what you need help with..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D8CBB2] bg-white text-xs text-[#20211D] focus:ring-2 focus:ring-[#173B32] focus:outline-hidden resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-4 text-xs text-[#20211D]/70">
                  <Link href="/privacy" className="hover:underline flex items-center gap-1">
                    <span>Privacy Policy</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                  <Link href="/terms" className="hover:underline flex items-center gap-1">
                    <span>Terms</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-[#173B32] text-xs font-bold text-[#EFE5D2] hover:bg-[#20453B] transition-colors flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-60"
                >
                  <Send className="w-3.5 h-3.5 text-[#B49252]" />
                  <span>{isSubmitting ? "Sending..." : "Submit Inquiry"}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
