import React from "react";
import Link from "next/link";
import { FileText, ArrowLeft, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | VANVAS",
  description: "Terms and Conditions governing the use of the VANVAS mountain travel platform.",
};

export default function TermsOfServicePage() {
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
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#B65E3C]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#B65E3C]">
              <FileText className="w-4 h-4" />
              <span>User Agreement</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#173B32]">
              Terms of Service
            </h1>
            <p className="text-sm text-[#20211D]/80 max-w-2xl leading-relaxed">
              These terms govern your access to and use of VANVAS applications, services, and mountain expedition intelligence tools.
            </p>
          </div>
        </div>

        {/* Terms Content */}
        <div className="bg-[#FAF7F0] border border-[#D8CBB2] rounded-3xl p-6 sm:p-10 shadow-sm space-y-8 text-sm text-[#20211D]/85 leading-relaxed">
          <section className="space-y-3">
            <h2 className="font-serif text-xl font-bold text-[#173B32]">1. Acceptance of Terms</h2>
            <p>
              By accessing VANVAS (via web, standalone PWA, or native Android application), you agree to be bound by these Terms of Service. If you do not agree, please discontinue use of the platform.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-bold text-[#173B32]">2. Mountain Travel & Safety Advisory</h2>
            <div className="p-4 rounded-2xl bg-[#B65E3C]/10 border border-[#B65E3C]/30 text-xs text-[#7B4D36] space-y-2">
              <div className="font-bold flex items-center gap-1.5 text-sm">
                <AlertTriangle className="w-4 h-4 text-[#B65E3C]" />
                <span>High Altitude & Terrain Disclaimer</span>
              </div>
              <p className="leading-relaxed">
                Himalayan and mountain travel involves inherent risks including sudden weather shifts, landslide road closures, altitude sickness (AMS), and remote terrain hazards. While VANVAS aggregates verified route data, users are solely responsible for exercising caution, consulting local authorities, and verifying real-time pass openings.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-bold text-[#173B32]">3. User Responsibilities & Conduct</h2>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#20211D]/80">
              <li>Maintain the security of your authentication credentials.</li>
              <li>Respect local Himalayan communities, ecosystems, and Leave No Trace principles.</li>
              <li>Do not use the platform to transmit unlawful, harmful, or fraudulent content.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-bold text-[#173B32]">4. Third-Party Integrations & Live Services</h2>
            <p className="text-xs text-[#20211D]/80">
              Certain services (e.g. Open-Meteo weather forecasts, OSRM routing, live partner stays) depend on external providers. VANVAS is not liable for upstream provider outages or real-time schedule variances.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-serif text-xl font-bold text-[#173B32]">5. Modifications to Service</h2>
            <p className="text-xs text-[#20211D]/80">
              We reserve the right to modify or discontinue features to improve reliability or comply with regulatory standards. Substantial changes will be communicated via the app.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
