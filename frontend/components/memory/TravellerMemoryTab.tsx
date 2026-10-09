"use client";

import React, { useState, useEffect, useTransition } from "react";
import { api } from "@/lib/api";
import { TravellerMemory, TravellerMemorySettings } from "@/types";
import {
  Sparkles, Shield, CheckCircle2, AlertCircle, RefreshCw,
  Trash2, Edit3, Check, X, Download, Play, Pause, Power,
  Plus, Compass, Clock, Home, Car, Mountain, Utensils, Info
} from "lucide-react";

export function TravellerMemoryTab() {
  const [memories, setMemories] = useState<TravellerMemory[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  // Learning settings state
  const [learningEnabled, setLearningEnabled] = useState(true);
  const [learningPaused, setLearningPaused] = useState(false);
  const [settingsUpdating, setSettingsUpdating] = useState(false);

  // Edit preference state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  // Add explicit preference state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCategory, setNewCategory] = useState("accommodation");
  const [newKey, setNewKey] = useState("stay_category");
  const [newValue, setNewValue] = useState("Homestay");
  const [isAdding, setIsAdding] = useState(false);

  const fetchMemories = async () => {
    try {
      setLoading(true);
      const data = await api.getTravellerMemories();
      setMemories(data || []);

      const ctx = await api.getPersonalizationContext();
      if (ctx) {
        setLearningEnabled(ctx.is_learning_enabled !== false);
        setLearningPaused(ctx.is_learning_paused === true);
      }
    } catch (err: any) {
      console.error("Failed to load memories:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemories();
  }, []);

  const handleToggleLearning = async (enabled: boolean, paused: boolean) => {
    setSettingsUpdating(true);
    setActionStatus(null);
    setActionError(null);
    try {
      const res = await api.updateMemorySettings({
        memory_learning_enabled: enabled,
        memory_learning_paused: paused,
      });
      setLearningEnabled(res.memory_learning_enabled);
      setLearningPaused(res.memory_learning_paused);
      setActionStatus(
        !enabled
          ? "Preference learning disabled."
          : paused
          ? "Preference learning paused."
          : "Preference learning active."
      );
      setTimeout(() => setActionStatus(null), 3000);
    } catch (err: any) {
      setActionError(err.message || "Failed to update learning settings.");
    } finally {
      setSettingsUpdating(false);
    }
  };

  const handleConfirm = async (memoryId: string) => {
    try {
      const updated = await api.confirmMemory(memoryId);
      setMemories(prev => prev.map(m => m.id === memoryId ? updated : m));
      setActionStatus("Preference confirmed & saved!");
      setTimeout(() => setActionStatus(null), 2500);
    } catch (err: any) {
      setActionError(err.message || "Failed to confirm preference.");
    }
  };

  const handleReject = async (memoryId: string) => {
    try {
      await api.rejectMemory(memoryId);
      setMemories(prev => prev.filter(m => m.id !== memoryId));
      setActionStatus("Preference dismissed.");
      setTimeout(() => setActionStatus(null), 2500);
    } catch (err: any) {
      setActionError(err.message || "Failed to dismiss preference.");
    }
  };

  const handleDelete = async (memoryId: string) => {
    try {
      await api.deleteMemory(memoryId);
      setMemories(prev => prev.filter(m => m.id !== memoryId));
      setActionStatus("Memory deleted.");
      setTimeout(() => setActionStatus(null), 2500);
    } catch (err: any) {
      setActionError(err.message || "Failed to delete preference.");
    }
  };

  const handleSaveEdit = async (memoryId: string) => {
    if (!editValue.trim()) return;
    try {
      const updated = await api.editMemory(memoryId, editValue.trim());
      setMemories(prev => prev.map(m => m.id === memoryId ? updated : m));
      setEditingId(null);
      setActionStatus("Preference updated.");
      setTimeout(() => setActionStatus(null), 2500);
    } catch (err: any) {
      setActionError(err.message || "Failed to update preference.");
    }
  };

  const handleAddExplicit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newValue.trim()) return;
    setIsAdding(true);
    setActionError(null);
    try {
      const created = await api.createExplicitMemory({
        category: newCategory,
        preference_key: newKey,
        preference_value: newValue.trim(),
      });
      setMemories(prev => [created, ...prev.filter(m => m.preference_key !== newKey)]);
      setShowAddModal(false);
      setNewValue("");
      setActionStatus("Explicit preference created.");
      setTimeout(() => setActionStatus(null), 2500);
    } catch (err: any) {
      setActionError(err.message || "Failed to add preference.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleResetInferred = async () => {
    if (!confirm("Reset learned preferences? Explicit preferences will remain untouched.")) return;
    try {
      await api.resetInferredMemories();
      await fetchMemories();
      setActionStatus("Learned preferences reset.");
      setTimeout(() => setActionStatus(null), 2500);
    } catch (err: any) {
      setActionError(err.message || "Failed to reset learned preferences.");
    }
  };

  const handleClearAll = async () => {
    if (!confirm("Are you sure you want to clear all travel memories? This will reset all personalized recommendations.")) return;
    try {
      await api.clearAllMemories();
      setMemories([]);
      setActionStatus("All travel memories cleared.");
      setTimeout(() => setActionStatus(null), 2500);
    } catch (err: any) {
      setActionError(err.message || "Failed to clear memories.");
    }
  };

  const handleExport = async () => {
    try {
      const data = await api.exportTravellerMemories();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `vanvas_traveller_memory_${data.user_id}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setActionError(err.message || "Failed to export memory data.");
    }
  };

  const filteredMemories = memories.filter(m => {
    if (filterCategory === "all") return true;
    return m.category.toLowerCase() === filterCategory.toLowerCase();
  });

  const getCategoryIcon = (cat: string) => {
    switch (cat.toLowerCase()) {
      case "timing": return <Clock className="w-3.5 h-3.5 text-[#B49252]" />;
      case "accommodation": return <Home className="w-3.5 h-3.5 text-[#173B32]" />;
      case "transport": return <Car className="w-3.5 h-3.5 text-[#5F605A]" />;
      case "activities": return <Mountain className="w-3.5 h-3.5 text-[#173B32]" />;
      case "practical": return <Utensils className="w-3.5 h-3.5 text-[#B49252]" />;
      default: return <Compass className="w-3.5 h-3.5 text-[#173B32]" />;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="border-b border-[#D8CBB2]/60 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#B49252]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Phase 5 Traveller Memory Engine</span>
            </div>
            <h2 className="font-serif text-xl font-bold text-[#173B32] mt-1">
              Traveller Memory & Personalization
            </h2>
            <p className="text-xs text-[#20211D]/70 mt-1 max-w-2xl">
              VANVAS learns how you like to travel from verified choices across trips.
              You maintain complete control to inspect, confirm, edit, or delete memories anytime.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#173B32] text-xs font-bold text-[#EFE5D2] hover:bg-[#20453B] transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Preference</span>
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#D8CBB2] text-xs font-bold text-[#173B32] hover:bg-[#FAF4E8] transition-colors shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
          </div>
        </div>

        {/* Status Alerts */}
        {actionStatus && (
          <div className="mt-3 p-2.5 rounded-xl bg-[#173B32]/10 border border-[#173B32]/30 flex items-center gap-2 text-xs font-semibold text-[#173B32]">
            <CheckCircle2 className="w-4 h-4 text-[#173B32]" />
            <span>{actionStatus}</span>
          </div>
        )}
        {actionError && (
          <div className="mt-3 p-2.5 rounded-xl bg-[#B65E3C]/10 border border-[#B65E3C]/30 flex items-center gap-2 text-xs font-semibold text-[#B65E3C]">
            <AlertCircle className="w-4 h-4 text-[#B65E3C]" />
            <span>{actionError}</span>
          </div>
        )}
      </div>

      {/* Learning Status & Consent Control Card */}
      <div className="bg-white border border-[#D8CBB2] rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#173B32]">
                Learning Status:
              </span>
              {!learningEnabled ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E5D5BA] text-[#5F605A]">
                  Disabled
                </span>
              ) : learningPaused ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#B49252]/20 text-[#8C6B2D]">
                  Paused
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#173B32]/15 text-[#173B32] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#173B32] animate-pulse" />
                  Active Learning
                </span>
              )}
            </div>
            <p className="text-xs text-[#20211D]/70">
              {!learningEnabled
                ? "Preference learning is completely disabled. Only explicit settings will apply."
                : learningPaused
                ? "Future learning is temporarily paused. Existing memories remain active."
                : "VANVAS observes repeated consistent choices (e.g. stay styles, pace, wake times) to improve planning."}
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {learningEnabled && (
              <button
                type="button"
                onClick={() => handleToggleLearning(true, !learningPaused)}
                disabled={settingsUpdating}
                className="px-3 py-1.5 rounded-xl border border-[#D8CBB2] text-xs font-semibold text-[#173B32] hover:bg-[#FAF4E8] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {learningPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                <span>{learningPaused ? "Resume" : "Pause"}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => handleToggleLearning(!learningEnabled, false)}
              disabled={settingsUpdating}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                learningEnabled
                  ? "border border-[#B65E3C]/40 text-[#B65E3C] hover:bg-[#B65E3C]/10"
                  : "bg-[#173B32] text-[#EFE5D2] hover:bg-[#20453B]"
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{learningEnabled ? "Disable" : "Enable Learning"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: "all", label: "All Memories" },
          { id: "accommodation", label: "Stays" },
          { id: "planning_style", label: "Pace & Density" },
          { id: "timing", label: "Timing" },
          { id: "activities", label: "Activities" },
          { id: "transport", label: "Transport" },
          { id: "practical", label: "Practical" },
        ].map(cat => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setFilterCategory(cat.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              filterCategory === cat.id
                ? "bg-[#173B32] text-[#EFE5D2] shadow-xs"
                : "bg-white border border-[#D8CBB2] text-[#20211D]/70 hover:text-[#173B32] hover:bg-[#FAF4E8]"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Memories Listing */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs text-[#5F605A]">
          <RefreshCw className="w-5 h-5 animate-spin text-[#B49252]" />
          <span>Loading travel memories...</span>
        </div>
      ) : filteredMemories.length === 0 ? (
        <div className="py-12 px-4 rounded-2xl bg-white border border-[#D8CBB2] text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-[#FAF4E8] text-[#B49252] flex items-center justify-center mx-auto">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#173B32]">No Memories in this Category</h4>
            <p className="text-xs text-[#20211D]/70 mt-1 max-w-md mx-auto">
              As you plan trips, select stays, or explicitly configure preferences, VANVAS will record verifiable preferences here.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#173B32] text-xs font-bold text-[#EFE5D2] hover:bg-[#20453B] transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Explicit Preference</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMemories.map(mem => {
            const isEditing = editingId === mem.id;
            const isExplicit = mem.memory_type === "EXPLICIT";
            const isInferred = mem.memory_type === "INFERRED";
            const isTripSpecific = mem.memory_type === "TRIP_SPECIFIC";
            const isConfirmed = mem.confirmation_status === "CONFIRMED";

            return (
              <div
                key={mem.id}
                className="bg-white border border-[#D8CBB2] rounded-2xl p-4 shadow-xs space-y-3 relative hover:border-[#B49252]/60 transition-colors"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[#FAF4E8] flex items-center justify-center">
                      {getCategoryIcon(mem.category)}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#B49252]">
                        {mem.category.replace("_", " ")}
                      </span>
                      <h4 className="text-xs font-bold text-[#173B32] capitalize">
                        {mem.preference_key.replace("_", " ")}
                      </h4>
                    </div>
                  </div>

                  {/* Badge */}
                  <div>
                    {isTripSpecific ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#B49252]/15 text-[#8C6B2D]">
                        Trip Constraint
                      </span>
                    ) : isExplicit ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#173B32]/10 text-[#173B32]">
                        {isConfirmed ? "Confirmed" : "Explicit"}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Learned ({intConfidence(mem.confidence)}%)
                      </span>
                    )}
                  </div>
                </div>

                {/* Preference Value */}
                {isEditing ? (
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 rounded-lg border border-[#B49252] text-xs font-bold text-[#173B32] focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(mem.id)}
                      className="p-1.5 rounded-lg bg-[#173B32] text-white hover:bg-[#20453B]"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="p-1.5 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="text-sm font-serif font-bold text-[#173B32]">
                    {mem.preference_value.replace("_", " ")}
                  </div>
                )}

                {/* Provenance note */}
                {mem.provenance_summary && (
                  <div className="text-[11px] text-[#5F605A] flex items-start gap-1.5 bg-[#FAF7F0] p-2 rounded-xl">
                    <Info className="w-3.5 h-3.5 text-[#B49252] shrink-0 mt-0.5" />
                    <span>{mem.provenance_summary}</span>
                  </div>
                )}

                {/* Footer Actions */}
                <div className="pt-2 border-t border-[#D8CBB2]/40 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-[#5F605A]">
                    Observed: {mem.evidence_count}x
                  </span>

                  <div className="flex items-center gap-1.5">
                    {isInferred && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleConfirm(mem.id)}
                          className="px-2 py-1 rounded-lg bg-[#173B32] text-[11px] font-bold text-[#EFE5D2] hover:bg-[#20453B] transition-colors cursor-pointer"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(mem.id)}
                          className="px-2 py-1 rounded-lg bg-white border border-[#D8CBB2] text-[11px] font-semibold text-[#5F605A] hover:bg-[#FAF4E8] transition-colors cursor-pointer"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {!isEditing && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(mem.id);
                          setEditValue(mem.preference_value);
                        }}
                        className="p-1 rounded-lg text-[#5F605A] hover:text-[#173B32] hover:bg-[#FAF4E8] transition-colors cursor-pointer"
                        title="Edit preference"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDelete(mem.id)}
                      className="p-1 rounded-lg text-[#B65E3C] hover:bg-[#B65E3C]/10 transition-colors cursor-pointer"
                      title="Delete memory"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bulk Maintenance Section */}
      <div className="border-t border-[#D8CBB2]/60 pt-6 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#173B32]">
          Privacy & Bulk Actions
        </h4>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleResetInferred}
            className="px-4 py-2 rounded-xl bg-white border border-[#D8CBB2] text-xs font-semibold text-[#173B32] hover:bg-[#FAF4E8] transition-colors cursor-pointer"
          >
            Reset Inferred Preferences
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            className="px-4 py-2 rounded-xl bg-white border border-[#B65E3C]/40 text-xs font-semibold text-[#B65E3C] hover:bg-[#B65E3C]/10 transition-colors cursor-pointer"
          >
            Clear All Travel Memories
          </button>
        </div>
      </div>

      {/* Add Explicit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF7F0] border border-[#D8CBB2] rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-[#D8CBB2] pb-3">
              <h3 className="font-serif text-lg font-bold text-[#173B32]">Add Explicit Preference</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-gray-500 hover:bg-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddExplicit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-[#173B32] uppercase tracking-wider mb-1">
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={e => {
                    setNewCategory(e.target.value);
                    if (e.target.value === "accommodation") setNewKey("stay_category");
                    else if (e.target.value === "timing") setNewKey("wake_up_preference");
                    else if (e.target.value === "planning_style") setNewKey("pace");
                    else if (e.target.value === "transport") setNewKey("transport_mode");
                    else if (e.target.value === "activities") setNewKey("nature_trails");
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-[#D8CBB2] bg-white text-xs text-[#173B32] focus:outline-hidden"
                >
                  <option value="accommodation">Accommodation</option>
                  <option value="planning_style">Planning Style & Pace</option>
                  <option value="timing">Timing & Wake-up</option>
                  <option value="activities">Activities & Nature</option>
                  <option value="transport">Transport</option>
                  <option value="practical">Practical</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#173B32] uppercase tracking-wider mb-1">
                  Preference Key
                </label>
                <input
                  type="text"
                  value={newKey}
                  onChange={e => setNewKey(e.target.value)}
                  placeholder="e.g. stay_category, pace, wake_up_preference"
                  className="w-full px-3 py-2 rounded-xl border border-[#D8CBB2] bg-white text-xs text-[#173B32] focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#173B32] uppercase tracking-wider mb-1">
                  Value
                </label>
                <input
                  type="text"
                  value={newValue}
                  onChange={e => setNewValue(e.target.value)}
                  placeholder="e.g. Homestays, Relaxed, Late Starts"
                  className="w-full px-3 py-2 rounded-xl border border-[#D8CBB2] bg-white text-xs text-[#173B32] focus:outline-hidden"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-white border border-[#D8CBB2] text-xs font-semibold text-[#5F605A] hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdding}
                  className="px-5 py-2 rounded-xl bg-[#173B32] text-xs font-bold text-[#EFE5D2] hover:bg-[#20453B] transition-colors shadow-xs"
                >
                  {isAdding ? "Saving..." : "Save Preference"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function intConfidence(conf: number): number {
  return Math.round((conf || 0.6) * 100);
}
