import React from "react";
import Link from "next/link";
import { Shield, ArrowLeft, Lock, Eye, Database, Bell, RefreshCw } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | VANVAS",
  description: "Learn how VANVAS collects, uses, and protects your personal travel data and location information.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#FAF4E8] py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#173B32] hover:text-[#B49252] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Explorer&apos;s Desk</span>
          </Link>
          <span className="text-[11px] font-mono text-[#20211D]/60">
            Effective Date: October 8, 2026 • v1.0
          </span>
        </div>

        {/* Header Hero */}
        <div className="bg-[#FAF7F0] border border-[#D8CBB2] rounded-3xl p-6 sm:p-10 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#B49252]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#B49252]">
              <Shield className="w-4 h-4" />
              <span>Trust & Data Protection</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#173B32]">
              VANVAS Privacy Policy
            </h1>
            <p className="text-sm text-[#20211D]/80 max-w-2xl leading-relaxed">
              We believe your expeditions, journal entries, and journey memories are personal. VANVAS is architected to minimize data collection, prevent background surveillance, and keep you in total control of your travel footprint.
            </p>
          </div>
        </div>

        {/* Policy Sections */}
        <div className="bg-[#FAF7F0] border border-[#D8CBB2] rounded-3xl p-6 sm:p-10 shadow-sm space-y-8 text-sm text-[#20211D]/85 leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="font-serif text-xl font-bold text-[#173B32] flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-[#173B32] text-[#EFE5D2] text-xs flex items-center justify-center font-mono">1</span>
              <span>Information We Collect</span>
            </h2>
            <p>We only collect information necessary to plan and synchronize your travel experience:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#20211D]/80">
              <li><strong>Account Credentials:</strong> Email address and encrypted password hash for account authentication.</li>
              <li><strong>Travel Preferences:</strong> Travel style, activity intensity, transport modes, dietary needs, and regional preferences.</li>
              <li><strong>Trip Artifacts:</strong> Multi-day itineraries, custom road trips, split expenses, saved spots, and offline pack configurations.</li>
              <li><strong>Device Push Tokens:</strong> Firebase Cloud Messaging (FCM) tokens required to deliver opt-in travel alerts and schedule modifications.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="font-serif text-xl font-bold text-[#173B32] flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-[#173B32] text-[#EFE5D2] text-xs flex items-center justify-center font-mono">2</span>
              <span>Geolocation & Exploration Privacy</span>
            </h2>
            <p>
              VANVAS does <strong>not</strong> track your background location or build continuous movement histories. Geolocation is requested solely when you actively trigger nearby exploration features (such as Nearby Gems or live route distance calculations).
            </p>
            <p className="text-xs text-[#20211D]/75 bg-[#E5D5BA]/30 p-3.5 rounded-xl border border-[#D8CBB2]">
              In Solo Traveler Discovery mode, only broad overlapping region proximity is shared with verified travelers who share mutual trip dates. Your exact GPS coordinates are never published.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="font-serif text-xl font-bold text-[#173B32] flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-[#173B32] text-[#EFE5D2] text-xs flex items-center justify-center font-mono">3</span>
              <span>AI Copilot & Data Isolation</span>
            </h2>
            <p>
              VANVAS AI utilizes Google Gemini foundation models. Prompts generated during autonomous replanning and Ask VANVAS consultations are processed transiently and are never used to train public language models.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="font-serif text-xl font-bold text-[#173B32] flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-[#173B32] text-[#EFE5D2] text-xs flex items-center justify-center font-mono">4</span>
              <span>Your Data Rights: Export & Permanent Deletion</span>
            </h2>
            <p>
              You maintain uncompromised ownership of your data. At any time via your <Link href="/settings" className="font-bold text-[#173B32] underline hover:text-[#B49252]">Account Settings</Link>, you can:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-4 rounded-2xl bg-white border border-[#D8CBB2] space-y-1">
                <div className="font-bold text-xs text-[#173B32] flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-[#B49252]" />
                  <span>One-Click JSON Data Export</span>
                </div>
                <div className="text-[11px] text-[#20211D]/70">
                  Export all profile data, trip journals, bookmarks, and split expenses directly to your device.
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-[#D8CBB2] space-y-1">
                <div className="font-bold text-xs text-[#B65E3C] flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#B65E3C]" />
                  <span>Permanent Account Deletion</span>
                </div>
                <div className="text-[11px] text-[#20211D]/70">
                  Instantly purges all account records, active tokens, and trip histories from our servers.
                </div>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="font-serif text-xl font-bold text-[#173B32] flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-[#173B32] text-[#EFE5D2] text-xs flex items-center justify-center font-mono">5</span>
              <span>Contact & Data Protection Officer</span>
            </h2>
            <p className="text-xs text-[#20211D]/80">
              For inquiries regarding this policy or data processing practices, reach out directly through the <Link href="/support" className="font-bold text-[#173B32] underline hover:text-[#B49252]">Support Center</Link> or email <span className="font-mono font-semibold">privacy@vanvasai.com</span>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
