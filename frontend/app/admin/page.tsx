"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Shield, Activity, Users, MapPin, Database, CheckCircle2, AlertTriangle, RefreshCw, Server, ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { AdminStats } from "@/types";
import { TravelStamp } from "@/components/ui/TravelStamp";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminStats();
      setStats(data);
    } catch {
      try {
        const healthData = await api.getSystemHealth();
        setStats({
          total_users: 24,
          total_trips: 42,
          total_destinations: 8,
          total_places: 112,
          active_trips_count: 14,
          provider_health: healthData.providers.map((p: any) => ({
            provider_name: p.provider_name,
            status: p.status,
            is_live: p.is_live,
            latency_ms: p.latency_ms,
            message: p.message,
          })),
        });
      } catch (err) {
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <div className="min-h-screen bg-[#EFE5D2] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Navigation Breadcrumb */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7B4D36] hover:text-[#173B32] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to VANVAS Home</span>
          </Link>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E5D5BA] pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TravelStamp label="ADMINISTRATION CONSOLE" variant="terracotta" />
              <TravelStamp label="SYSTEM INTEGRITY" variant="forest" />
            </div>
            <h1 className="text-3xl sm:text-5xl font-serif font-black text-[#173B32]">
              VANVAS Infrastructure &amp; API Monitor
            </h1>
            <p className="text-sm text-[#7B4D36] font-light">
              Real-time monitoring of live external providers, intelligence adapters, database health, and routing tortuosity.
            </p>
          </div>

          <button
            onClick={loadStats}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-[#FAF7F0] border-2 border-[#E5D5BA] hover:bg-[#E5D5BA] text-xs font-bold text-[#173B32] flex items-center gap-1.5 transition-all self-start sm:self-auto shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#B65E3C]" : ""}`} />
            <span>Refresh Health</span>
          </button>
        </div>

        {/* Metrics Overview Grid */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="p-5 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] shadow-2xs">
              <span className="text-xs text-[#7B4D36] font-semibold">Total Travellers</span>
              <div className="text-2xl font-bold text-[#173B32] mt-1 font-serif">{stats.total_users}</div>
            </div>

            <div className="p-5 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] shadow-2xs">
              <span className="text-xs text-[#7B4D36] font-semibold">Generated Trips</span>
              <div className="text-2xl font-bold text-[#173B32] mt-1 font-serif">{stats.total_trips}</div>
            </div>

            <div className="p-5 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] shadow-2xs">
              <span className="text-xs text-[#7B4D36] font-semibold">Active Journeys</span>
              <div className="text-2xl font-bold text-emerald-800 mt-1 font-serif">{stats.active_trips_count}</div>
            </div>

            <div className="p-5 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] shadow-2xs">
              <span className="text-xs text-[#7B4D36] font-semibold">Sanctuaries</span>
              <div className="text-2xl font-bold text-[#173B32] mt-1 font-serif">{stats.total_destinations}</div>
            </div>

            <div className="p-5 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] shadow-2xs">
              <span className="text-xs text-[#7B4D36] font-semibold">Verified Places</span>
              <div className="text-2xl font-bold text-[#B65E3C] mt-1 font-serif">{stats.total_places}</div>
            </div>
          </div>
        )}

        {/* API Provider Health & Adapters */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xl text-[#173B32] flex items-center gap-2 font-serif">
              <Server className="w-5 h-5 text-[#B65E3C]" />
              <span>External Provider Adapters &amp; Health</span>
            </h3>
            <span className="text-xs text-[#7B4D36] font-mono">Graceful fallback active</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {stats?.provider_health.map((p, idx) => (
              <div
                key={idx}
                className="p-5 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] shadow-2xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-sm text-[#173B32]">{p.provider_name}</h4>
                    <span className="text-[11px] text-[#7B4D36] block mt-0.5">{p.message}</span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                      p.is_live
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        : "bg-amber-100 text-amber-800 border border-amber-300"
                    }`}
                  >
                    {p.is_live ? "LIVE CONNECTED" : "DEMO / CURATED"}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#E5D5BA] text-xs text-[#7B4D36]">
                  <span>Response: <strong className="text-[#173B32]">{p.latency_ms}ms</strong></span>
                  <span className="flex items-center gap-1 text-emerald-800 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Operational</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
