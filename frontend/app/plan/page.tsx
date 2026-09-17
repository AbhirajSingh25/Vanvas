"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Sparkles, MapPin, Calendar, Wallet, Users, Compass, Sun, Flame, Check,
  ArrowRight, ArrowLeft, Mountain, Coffee, Trees, Heart, Shield
} from "lucide-react";
import { api } from "@/lib/api";
import { Destination } from "@/types";
import { useAuth } from "@/context/AuthContext";
import confetti from "canvas-confetti";
import { TravelStamp } from "@/components/ui/TravelStamp";
import { DestinationArtwork } from "@/components/brand/DestinationArtwork";

function PlanTripContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialDest = searchParams?.get("dest") || "manali";
  const { user } = useAuth();

  // Step Tracker (1 to 9)
  const [step, setStep] = useState(1);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loadingDestinations, setLoadingDestinations] = useState(true);

  // Form State
  const [selectedDestId, setSelectedDestId] = useState<string>(initialDest);
  const [startDate, setStartDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split("T")[0];
  });
  const [budget, setBudget] = useState<number>(10000);
  const [customBudget, setCustomBudget] = useState<string>("");
  const [companionType, setCompanionType] = useState<string>("Solo");
  const [travellersCount, setTravellersCount] = useState<number>(1);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    "Nature",
    "Cafés",
    "Adventure",
    "Local Food",
    "Hidden places",
  ]);
  const [travelStyle, setTravelStyle] = useState<string>("Balanced");
  const [wakeUpPref, setWakeUpPref] = useState<string>("Normal");
  const [activityIntensity, setActivityIntensity] = useState<string>("Balanced");

  // Loading Sequence State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationMsgIndex, setGenerationMsgIndex] = useState(0);

  const generationMessages = [
    "Scouting pine valleys & riverside trails...",
    "Clustering stops to eliminate zigzag hill driving...",
    "Balancing your budget across stays, dhabas & fuel...",
    "Matching opening hours with sunset viewpoints...",
    "Binding your bespoke VANVAS travel journal...",
  ];

  const destHindiMap: Record<string, string> = {
    manali: "मनाली",
    rishikesh: "ऋषिकेश",
    kasol: "कसोल",
    dharamshala: "धर्मशाला",
    goa: "गोवा",
    jaipur: "जयपुर",
    udaipur: "उदयपुर",
    mussoorie: "मसूरी",
  };

  const fallbackDestinations: Destination[] = [
    { id: "dest-manali", name: "Manali", slug: "manali", state: "Himachal Pradesh", region: "Himalayan", tagline: "Pine forests & high passes", description: "", hero_image: "/images/destinations/fallbacks/himalayan.jpg", latitude: 32.2432, longitude: 77.1892, altitude_meters: 2050, weather_type: "Alpine Mist", is_featured: true, is_curated: true },
    { id: "dest-mussoorie", name: "Mussoorie", slug: "mussoorie", state: "Uttarakhand", region: "Garhwal", tagline: "Queen of the Hills", description: "", hero_image: "/images/destinations/fallbacks/himalayan.jpg", latitude: 30.4598, longitude: 78.0644, altitude_meters: 2005, weather_type: "Cool Mountain", is_featured: true, is_curated: true },
    { id: "dest-rishikesh", name: "Rishikesh", slug: "rishikesh", state: "Uttarakhand", region: "Garhwal", tagline: "Ganga currents & ghats", description: "", hero_image: "/images/destinations/fallbacks/himalayan.jpg", latitude: 30.0869, longitude: 78.2676, altitude_meters: 372, weather_type: "Temperate", is_featured: true, is_curated: true },
    { id: "dest-kasol", name: "Kasol", slug: "kasol", state: "Himachal Pradesh", region: "Parvati Valley", tagline: "Emerald streams & deodar trails", description: "", hero_image: "/images/destinations/fallbacks/himalayan.jpg", latitude: 32.0100, longitude: 77.3150, altitude_meters: 1580, weather_type: "Crisp Alpine", is_featured: true, is_curated: true },
    { id: "dest-dharamshala", name: "Dharamshala", slug: "dharamshala", state: "Himachal Pradesh", region: "Kangra Valley", tagline: "Tibetan monasteries & mist", description: "", hero_image: "/images/destinations/fallbacks/himalayan.jpg", latitude: 32.2190, longitude: 76.3234, altitude_meters: 1457, weather_type: "Mountain Spring", is_featured: true, is_curated: true },
    { id: "dest-jaipur", name: "Jaipur", slug: "jaipur", state: "Rajasthan", region: "Mewar & Desert", tagline: "Pink havelis & royal forts", description: "", hero_image: "/images/destinations/fallbacks/himalayan.jpg", latitude: 26.9124, longitude: 75.7873, altitude_meters: 431, weather_type: "Semi-Arid", is_featured: true, is_curated: true },
    { id: "dest-goa", name: "Goa", slug: "goa", state: "Goa", region: "West Coast", tagline: "Golden palm trails & spice air", description: "", hero_image: "/images/destinations/fallbacks/himalayan.jpg", latitude: 15.2993, longitude: 74.1240, altitude_meters: 10, weather_type: "Tropical Breeze", is_featured: true, is_curated: true },
    { id: "dest-udaipur", name: "Udaipur", slug: "udaipur", state: "Rajasthan", region: "Mewar", tagline: "City of lakes & palaces", description: "", hero_image: "/images/destinations/fallbacks/himalayan.jpg", latitude: 24.5854, longitude: 73.7125, altitude_meters: 598, weather_type: "Warm Lake", is_featured: true, is_curated: true },
  ];

  useEffect(() => {
    api.getDestinations(false)
      .then((data) => {
        const loaded = (data && data.length > 0) ? data : fallbackDestinations;
        setDestinations(loaded);
        const match = loaded.find(
          (d) => d.id === initialDest || d.slug.toLowerCase() === initialDest.toLowerCase()
        );
        if (match) {
          setSelectedDestId(match.id);
        } else if (loaded.length > 0) {
          setSelectedDestId(loaded[0].id);
        }
      })
      .catch((err) => {
        console.error("Could not fetch destinations for plan wizard:", err);
        setDestinations(fallbackDestinations);
        const match = fallbackDestinations.find(
          (d) => d.id === initialDest || d.slug.toLowerCase() === initialDest.toLowerCase()
        );
        if (match) setSelectedDestId(match.id);
      })
      .finally(() => setLoadingDestinations(false));
  }, [initialDest]);

  // Pre-fill user saved preferences if available
  useEffect(() => {
    if (user?.preferences) {
      const p = user.preferences;
      if (p.preferred_travel_style) setTravelStyle(p.preferred_travel_style);
      if (p.wake_up_preference) setWakeUpPref(p.wake_up_preference);
      if (p.activity_intensity) setActivityIntensity(p.activity_intensity);
      if (p.companion_style) setCompanionType(p.companion_style);
      if (p.interests) {
        const parsed = p.interests.split(",").map((s) => s.trim()).filter(Boolean);
        if (parsed.length > 0) setSelectedInterests(parsed);
      }
    }
  }, [user]);

  // Calculate days
  const numDays = Math.max(
    1,
    Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
  );

  const interestOptions = [
    { name: "Nature", hindi: "प्रकृति", desc: "Pine forests, rivers & ridges" },
    { name: "Adventure", hindi: "रोमांच", desc: "Hikes, paragliding & rafting" },
    { name: "Local Food", hindi: "स्थानीय स्वाद", desc: "Authentic siddu, kachori & dhabas" },
    { name: "Cafés", hindi: "कैफे", desc: "Riverside espresso & bakeries" },
    { name: "Culture", hindi: "संस्कृति", desc: "Ancient temples & havelis" },
    { name: "Photography", hindi: "फोटोग्राफी", desc: "Golden hour viewpoints & mist" },
    { name: "Relaxation", hindi: "सुकून", desc: "Quiet hammocks & slow mornings" },
    { name: "Hidden places", hindi: "अनछुए रास्ते", desc: "Away from commercial crowds" },
  ];

  const handleInterestToggle = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const handleGenerateTrip = async () => {
    setIsGenerating(true);
    const interval = setInterval(() => {
      setGenerationMsgIndex((prev) => (prev + 1) % generationMessages.length);
    }, 800);

    try {
      const trip = await api.createTrip({
        destination_id: selectedDestId,
        start_date: startDate,
        end_date: endDate,
        budget: customBudget ? parseFloat(customBudget) : budget,
        travellers_count: travellersCount,
        companion_type: companionType,
        travel_style: travelStyle,
        wake_up_preference: wakeUpPref,
        activity_intensity: activityIntensity,
        interests: selectedInterests,
      });

      clearInterval(interval);
      try {
        confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
      } catch {}
      router.push(`/trips/${trip.id}`);
    } catch (err) {
      console.error(err);
      clearInterval(interval);
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-[#EFE5D2] pt-6 pb-32 sm:py-12 px-3 sm:px-6 lg:px-8 flex flex-col justify-center">
      <div className="max-w-3xl mx-auto w-full space-y-6 sm:space-y-8">
        {/* Header Passport Stamp Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TravelStamp label="यात्रा डायरी" sub="JOURNAL WIZARD" variant="terracotta" />
              <TravelStamp label={`पड़ाव ${step} / 9`} variant="forest" />
            </div>
            <span className="text-xs font-mono text-[#7B4D36] font-semibold">
              VANVAS EXPEDITION LOG
            </span>
          </div>

          <div className="w-full bg-[#E5D5BA] h-2.5 rounded-full overflow-hidden border border-[#E5D5BA]">
            <div
              className="bg-[#173B32] h-full transition-all duration-500 rounded-full"
              style={{ width: `${(step / 9) * 100}%` }}
            />
          </div>
        </div>

        {/* Wizard Journal Page */}
        <div className="bg-[#FAF7F0] border-2 border-[#E5D5BA] rounded-3xl p-5 sm:p-10 shadow-xl relative overflow-hidden min-h-[440px] sm:min-h-[500px] flex flex-col justify-between">
          {/* Subtle paper background grid */}
          <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#173B32_1px,transparent_1px)] [background-size:20px_20px]" />

          {/* STEP 1: DESTINATION (कहाँ चलें?) */}
          {step === 1 && (
            <div className="space-y-5 sm:space-y-6 relative z-10 animate-fadeIn">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl sm:text-2xl font-serif font-black text-[#B65E3C]">कहाँ चलें?</span>
                  <span className="text-xs font-mono text-[#7B4D36] uppercase">• Step 1</span>
                </div>
                <h2 className="text-xl sm:text-3xl font-serif font-black text-[#17352C] mt-1">
                  Where is the road taking you?
                </h2>
                <p className="text-xs text-[#7B4D36] mt-0.5 sm:mt-1">Select your mountain sanctuary or heritage trail.</p>
              </div>

              {loadingDestinations ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <div
                      key={n}
                      className="p-3 sm:p-3.5 rounded-2xl border-2 border-[#E5D5BA] bg-[#FAF7F0] min-h-[110px] sm:min-h-[135px] animate-pulse flex flex-col justify-between"
                    >
                      <div className="w-12 h-3 bg-[#E5D5BA] rounded-md" />
                      <div className="space-y-1.5">
                        <div className="w-16 h-2.5 bg-[#E5D5BA] rounded-md" />
                        <div className="w-24 h-4 bg-[#E5D5BA] rounded-md" />
                        <div className="w-10 h-2 bg-[#E5D5BA] rounded-md" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5 max-h-[360px] sm:max-h-[340px] overflow-y-auto pr-1">
                  {destinations.map((d) => {
                    const isSelected = selectedDestId === d.id || selectedDestId === d.slug;
                    return (
                      <button
                        key={d.id}
                        onClick={() => setSelectedDestId(d.id)}
                        className={`p-3 sm:p-3.5 rounded-2xl border-2 text-left transition-all flex flex-col justify-between min-h-[110px] sm:min-h-[135px] relative overflow-hidden group cursor-pointer active:scale-95 ${
                          isSelected
                            ? "border-[#173B32] bg-[#173B32] text-[#EFE5D2] shadow-lg scale-102"
                            : "border-[#E5D5BA] bg-[#FAF7F0] text-[#20211D] hover:border-[#173B32]/50 hover:bg-[#EFE5D2]"
                        }`}
                      >
                        <div className="relative z-10 flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                            {d.region ? d.region.split(" ")[0] : "VALLEY"}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#B49252]" />}
                        </div>

                        <div className="relative z-10">
                          <span className="text-[11px] font-serif opacity-80 block leading-tight">
                            {destHindiMap[d.slug] || "यात्रा"}
                          </span>
                          <div className="font-serif font-black text-base sm:text-lg leading-tight mt-0.5">{d.name}</div>
                          <div className="text-[10px] sm:text-[11px] opacity-75 mt-0.5">{d.altitude_meters ? `${d.altitude_meters}m` : d.state}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: DATES (कितने दिन?) */}
          {step === 2 && (
            <div className="space-y-6 relative z-10 animate-fadeIn">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-serif font-black text-[#B65E3C]">कितने दिन?</span>
                  <span className="text-xs font-mono text-[#7B4D36] uppercase">• Step 2</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-serif font-black text-[#17352C] mt-1">
                  When are you setting off?
                </h2>
                <p className="text-xs text-[#7B4D36] mt-1">VANVAS automatically calculates your total journey days.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-[#FAF7F0] border-2 border-[#E5D5BA] space-y-1">
                  <label className="text-xs font-bold text-[#173B32] uppercase tracking-wider block flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#B65E3C]" />
                    रवाना होने की तारीख • Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E5D5BA] rounded-xl text-sm font-semibold text-[#20211D] bg-white focus:outline-none focus:border-[#173B32]"
                  />
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF7F0] border-2 border-[#E5D5BA] space-y-1">
                  <label className="text-xs font-bold text-[#173B32] uppercase tracking-wider block flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#B65E3C]" />
                    वापसी की तारीख • End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E5D5BA] rounded-xl text-sm font-semibold text-[#20211D] bg-white focus:outline-none focus:border-[#173B32]"
                  />
                </div>
              </div>

              {/* Calculated Days Banner */}
              <div className="p-4 rounded-2xl bg-[#EFE5D2] border-2 border-[#E5D5BA] flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase text-[#7B4D36]">Calculated Journey</span>
                  <div className="font-serif font-black text-xl text-[#173B32]">{numDays} Days in the Valley</div>
                </div>
                <TravelStamp label={`${numDays} DAYS`} variant="forest" />
              </div>
            </div>
          )}

          {/* STEP 3: BUDGET (कितना खर्च करना है?) */}
          {step === 3 && (
            <div className="space-y-6 relative z-10 animate-fadeIn">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-serif font-black text-[#B65E3C]">कितना खर्च?</span>
                  <span className="text-xs font-mono text-[#7B4D36] uppercase">• Step 3</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-serif font-black text-[#17352C] mt-1">
                  What is your total expedition budget?
                </h2>
                <p className="text-xs text-[#7B4D36] mt-1">Approximate budget for stays, scooter, food &amp; local sights.</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[5000, 8000, 10000, 15000, 25000, 40000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => {
                      setBudget(amt);
                      setCustomBudget("");
                    }}
                    className={`py-4 px-4 rounded-2xl border-2 text-center font-bold text-sm transition-all ${
                      budget === amt && !customBudget
                        ? "bg-[#173B32] text-[#EFE5D2] border-[#173B32] shadow-md scale-102"
                        : "bg-[#FAF7F0] text-[#20211D] border-[#E5D5BA] hover:bg-[#EFE5D2]"
                    }`}
                  >
                    <span className="block font-mono text-base">₹{amt.toLocaleString()}</span>
                  </button>
                ))}
              </div>

              <div className="pt-2">
                <label className="text-xs font-bold text-[#173B32] uppercase tracking-wider block mb-1">
                  Or enter Custom Budget (₹):
                </label>
                <input
                  type="number"
                  placeholder="e.g. 18000"
                  value={customBudget}
                  onChange={(e) => setCustomBudget(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border-2 border-[#E5D5BA] rounded-xl text-sm font-semibold text-[#20211D] focus:outline-none focus:border-[#173B32]"
                />
              </div>
            </div>
          )}

          {/* STEP 4: COMPANIONS (किसके साथ?) */}
          {step === 4 && (
            <div className="space-y-6 relative z-10 animate-fadeIn">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-serif font-black text-[#B65E3C]">किसके साथ?</span>
                  <span className="text-xs font-mono text-[#7B4D36] uppercase">• Step 4</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-serif font-black text-[#17352C] mt-1">
                  Who is travelling with you?
                </h2>
                <p className="text-xs text-[#7B4D36] mt-1">We tailor pacing, stay types, and group voting compatibility.</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                {[
                  { type: "Solo", hindi: "अकेले", count: 1, desc: "Soul-searching & quiet pine walks" },
                  { type: "Couple", hindi: "हमसफ़र", count: 2, desc: "Romantic stays & sunset dinners" },
                  { type: "Friends", hindi: "यार-दोस्त", count: 3, desc: "Cafés, scooters & paragliding" },
                  { type: "Family", hindi: "परिवार", count: 4, desc: "Comfortable pacing & heritage" },
                ].map((comp) => (
                  <button
                    key={comp.type}
                    onClick={() => {
                      setCompanionType(comp.type);
                      setTravellersCount(comp.count);
                    }}
                    className={`p-4 rounded-2xl border-2 text-left transition-all space-y-1.5 ${
                      companionType === comp.type
                        ? "bg-[#173B32] text-[#EFE5D2] border-[#173B32] shadow-md scale-102"
                        : "bg-[#FAF7F0] text-[#20211D] border-[#E5D5BA] hover:bg-[#EFE5D2]"
                    }`}
                  >
                    <span className="text-[11px] font-serif opacity-80">{comp.hindi}</span>
                    <div className="font-serif font-bold text-lg leading-tight">{comp.type}</div>
                    <div className="text-[11px] opacity-75">{comp.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: VIBES & INTERESTS (कैसा सफ़र?) */}
          {step === 5 && (
            <div className="space-y-6 relative z-10 animate-fadeIn">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-serif font-black text-[#B65E3C]">कैसा सफ़र?</span>
                  <span className="text-xs font-mono text-[#7B4D36] uppercase">• Step 5</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-serif font-black text-[#17352C] mt-1">
                  What vibes are you seeking?
                </h2>
                <p className="text-xs text-[#7B4D36] mt-1">Select multiple vibes to guide daily stop selection.</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {interestOptions.map((item) => {
                  const isSelected = selectedInterests.includes(item.name);
                  return (
                    <button
                      key={item.name}
                      onClick={() => handleInterestToggle(item.name)}
                      className={`p-3.5 rounded-2xl border-2 text-left transition-all space-y-1 ${
                        isSelected
                          ? "bg-[#B65E3C] text-[#EFE5D2] border-[#B65E3C] shadow-sm scale-102"
                          : "bg-[#FAF7F0] text-[#20211D] border-[#E5D5BA] hover:bg-[#EFE5D2]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-serif opacity-85">{item.hindi}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#B49252]" />}
                      </div>
                      <div className="font-serif font-bold text-sm">{item.name}</div>
                      <div className="text-[10px] opacity-75 leading-tight">{item.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 6: TRAVEL STYLE (सफ़र का अंदाज़) */}
          {step === 6 && (
            <div className="space-y-6 relative z-10 animate-fadeIn">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-serif font-black text-[#B65E3C]">सफ़र का अंदाज़</span>
                  <span className="text-xs font-mono text-[#7B4D36] uppercase">• Step 6</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-serif font-black text-[#17352C] mt-1">
                  What is your travel style?
                </h2>
                <p className="text-xs text-[#7B4D36] mt-1">Determines stay categories and dining choices.</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                {[
                  { style: "Budget", desc: "Hostels, local dhabas & buses" },
                  { style: "Balanced", desc: "Boutique stays & riverside cafés" },
                  { style: "Comfort", desc: "Heritage resorts & private cabs" },
                  { style: "Premium", desc: "Luxury mountain suites & fine dining" },
                ].map((s) => (
                  <button
                    key={s.style}
                    onClick={() => setTravelStyle(s.style)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all space-y-1.5 ${
                      travelStyle === s.style
                        ? "bg-[#173B32] text-[#EFE5D2] border-[#173B32] shadow-md scale-102"
                        : "bg-[#FAF7F0] text-[#20211D] border-[#E5D5BA] hover:bg-[#EFE5D2]"
                    }`}
                  >
                    <div className="font-serif font-bold text-lg">{s.style}</div>
                    <div className="text-[11px] opacity-75 leading-tight">{s.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 7: WAKE-UP PREFERENCE (सुबह का मिज़ाज) */}
          {step === 7 && (
            <div className="space-y-6 relative z-10 animate-fadeIn">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-serif font-black text-[#B65E3C]">सुबह का मिज़ाज</span>
                  <span className="text-xs font-mono text-[#7B4D36] uppercase">• Step 7</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-serif font-black text-[#17352C] mt-1">
                  When do you prefer waking up?
                </h2>
                <p className="text-xs text-[#7B4D36] mt-1">We align morning activity timings to your natural rhythm.</p>
              </div>

              <div className="grid grid-cols-3 gap-3.5">
                {[
                  { pref: "Early", time: "07:30 AM", desc: "Catch sunrise & quiet morning mist" },
                  { pref: "Normal", time: "08:30 AM", desc: "Relaxed breakfast and leisurely start" },
                  { pref: "Late", time: "10:00 AM", desc: "Sleep in & enjoy late brunch" },
                ].map((w) => (
                  <button
                    key={w.pref}
                    onClick={() => setWakeUpPref(w.pref)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all space-y-1.5 ${
                      wakeUpPref === w.pref
                        ? "bg-[#173B32] text-[#EFE5D2] border-[#173B32] shadow-md scale-102"
                        : "bg-[#FAF7F0] text-[#20211D] border-[#E5D5BA] hover:bg-[#EFE5D2]"
                    }`}
                  >
                    <div className="font-serif font-bold text-lg">{w.pref}</div>
                    <div className="text-xs text-[#B49252] font-mono font-semibold">{w.time}</div>
                    <div className="text-[11px] opacity-75">{w.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 8: ACTIVITY INTENSITY (दिन की रफ़्तार) */}
          {step === 8 && (
            <div className="space-y-6 relative z-10 animate-fadeIn">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-serif font-black text-[#B65E3C]">दिन की रफ़्तार</span>
                  <span className="text-xs font-mono text-[#7B4D36] uppercase">• Step 8</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-serif font-black text-[#17352C] mt-1">
                  How packed should your days be?
                </h2>
                <p className="text-xs text-[#7B4D36] mt-1">Control how many stops VANVAS schedules each day.</p>
              </div>

              <div className="grid grid-cols-3 gap-3.5">
                {[
                  { intensity: "Relaxed", stops: "3 stops/day", desc: "Plenty of downtime & slow riverside cafés" },
                  { intensity: "Balanced", stops: "4 stops/day", desc: "Optimal mix of trails, culture & food" },
                  { intensity: "Packed", stops: "5+ stops/day", desc: "Max out every hour of daylight" },
                ].map((i) => (
                  <button
                    key={i.intensity}
                    onClick={() => setActivityIntensity(i.intensity)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all space-y-1.5 ${
                      activityIntensity === i.intensity
                        ? "bg-[#173B32] text-[#EFE5D2] border-[#173B32] shadow-md scale-102"
                        : "bg-[#FAF7F0] text-[#20211D] border-[#E5D5BA] hover:bg-[#EFE5D2]"
                    }`}
                  >
                    <div className="font-serif font-bold text-lg">{i.intensity}</div>
                    <div className="text-xs text-[#B49252] font-semibold font-mono">{i.stops}</div>
                    <div className="text-[11px] opacity-75">{i.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 9: CONFIRMATION (डायरी का सारांश) */}
          {step === 9 && (
            <div className="space-y-6 relative z-10 animate-fadeIn">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-serif font-black text-[#B65E3C]">डायरी का सारांश</span>
                  <span className="text-xs font-mono text-[#7B4D36] uppercase">• Ready</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-serif font-black text-[#17352C] mt-1">
                  Your Spontaneous Journey Summary
                </h2>
                <p className="text-xs text-[#7B4D36] mt-1">Ready to compile your itinerary.</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {(() => {
                  const selectedDest = destinations.find(
                    (d) => d.id === selectedDestId || d.slug === selectedDestId
                  );
                  const destName = selectedDest ? selectedDest.name : (destHindiMap[selectedDestId] || selectedDestId);
                  const destHindi = selectedDest ? (destHindiMap[selectedDest.slug] || selectedDest.name) : "यात्रा";

                  return (
                    <div className="p-3.5 rounded-2xl bg-[#EFE5D2] border border-[#E5D5BA]">
                      <span className="text-[#7B4D36] block font-semibold">Destination</span>
                      <span className="font-serif font-bold text-base text-[#173B32]">
                        {destName} <span className="text-xs font-serif text-[#B65E3C] font-normal">({destHindi})</span>
                      </span>
                    </div>
                  );
                })()}
                <div className="p-3.5 rounded-2xl bg-[#EFE5D2] border border-[#E5D5BA]">
                  <span className="text-[#7B4D36] block font-semibold">Duration</span>
                  <span className="font-serif font-bold text-base text-[#173B32]">{numDays} Days</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#EFE5D2] border border-[#E5D5BA]">
                  <span className="text-[#7B4D36] block font-semibold">Expedition Budget</span>
                  <span className="font-mono font-bold text-base text-[#173B32]">
                    ₹{(customBudget ? parseFloat(customBudget) : budget).toLocaleString()}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#EFE5D2] border border-[#E5D5BA]">
                  <span className="text-[#7B4D36] block font-semibold">Style</span>
                  <span className="font-serif font-bold text-base text-[#173B32]">
                    {travelStyle} • {companionType}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="pt-8 border-t border-[#E5D5BA] flex items-center justify-between relative z-10">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-5 py-2.5 rounded-xl border-2 border-[#E5D5BA] bg-[#FAF7F0] text-xs font-bold text-[#173B32] hover:bg-[#E5D5BA] flex items-center gap-1.5 transition-all"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            {step < 9 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="px-7 py-3 rounded-xl bg-[#173B32] hover:bg-[#20453B] text-[#EFE5D2] text-xs font-bold tracking-wider uppercase flex items-center gap-2 shadow-md transition-all"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleGenerateTrip}
                disabled={isGenerating}
                className="px-8 py-3.5 rounded-xl bg-[#B65E3C] hover:bg-[#9E4D2E] text-[#EFE5D2] text-xs font-bold tracking-wider uppercase flex items-center gap-2 shadow-xl transition-all transform active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-[#B49252]" />
                <span>चलो निकलते हैं • Generate My Trip</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Atmospheric Fog Loading Screen */}
      {isGenerating && (
        <div className="fixed inset-0 z-50 bg-[#0F2924]/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-[#EFE5D2] animate-fadeIn">
          <div className="w-16 h-16 rounded-3xl bg-[#B65E3C] text-[#EFE5D2] flex items-center justify-center shadow-2xl mb-6 animate-bounce">
            <Sparkles className="w-8 h-8 text-[#B49252]" />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#B49252] mb-1">
            सफ़रनामा तैयार हो रहा है
          </span>
          <h3 className="text-3xl sm:text-4xl font-serif font-black tracking-tight mb-2">
            Binding Your Expedition Journal
          </h3>
          <p className="text-sm text-[#D8DED5] max-w-md h-6 font-light transition-opacity duration-300">
            {generationMessages[generationMsgIndex]}
          </p>
          <div className="mt-8 w-56 bg-[#173B32] h-2 rounded-full overflow-hidden border border-[#536B52]/40">
            <div className="bg-[#B49252] h-full w-2/3 animate-pulse rounded-full" />
          </div>
        </div>
      )}
    </div>
  );
}

export default function PlanTripPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[#EFE5D2] flex flex-col items-center justify-center text-[#173B32] gap-3">
          <div className="w-10 h-10 border-3 border-[#B65E3C] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-serif italic text-[#7B4D36]">Unrolling travel journal...</span>
        </div>
      }
    >
      <PlanTripContent />
    </React.Suspense>
  );
}
