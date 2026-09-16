import React from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Emblem } from "@/components/brand/Emblem";
import { Heart, Compass, Mountain, ShieldCheck, MapPin, Sparkles } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-[#31483D] bg-[#0F2924] text-[#EFE5D2] pt-16 pb-20 px-4 sm:px-6 lg:px-8 mt-24 relative overflow-hidden">
      {/* Background Subtle Contour Texture */}
      <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#EFE5D2_1px,transparent_1px)] [background-size:24px_24px]" />

      <div className="max-w-7xl mx-auto relative z-10 space-y-12">
        {/* Top Story Banner */}
        <div className="pb-12 border-b border-[#243E36] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#B49252]">
              <Compass className="w-3.5 h-3.5" />
              <span>सफ़रनामा • The Mountain Expedition Journal</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-serif font-black text-[#EFE5D2]">
              जहाँ मन करे, निकल पड़ो।
            </h3>
            <p className="text-xs text-[#D8DED5]/80 max-w-xl font-light leading-relaxed">
              VANVAS is built for people who travel spontaneously, arrive late, and hate rigid itineraries.
              Routes, stays, dhabas and riverside cafés that adapt to your rhythm.
            </p>
          </div>

          <Link
            href="/plan"
            className="px-6 py-3.5 rounded-xl bg-[#B65E3C] hover:bg-[#9E4D2E] text-[#EFE5D2] text-xs font-bold tracking-wider uppercase shadow-lg transition-all flex items-center gap-2 whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#B49252]" />
            <span>चलो निकलते हैं • Plan Trip</span>
          </Link>
        </div>

        {/* Brand & Nav Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <Logo variant="light" size="lg" />
            <p className="text-xs italic text-[#D8DED5]/80 max-w-md font-serif leading-relaxed">
              &ldquo;Leave Delhi at night. Wake up somewhere in the pine mist.&rdquo;
            </p>
            <div className="flex items-center gap-3 pt-2 text-xs text-[#B49252]">
              <span className="px-2.5 py-1 rounded border border-[#31483D] bg-[#173B32]/60 font-mono text-[11px]">
                32°14′N • 77°11′E
              </span>
              <span className="text-[#D8DED5]/60 font-light">Himalayan Base Camp</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#B49252]">
              यात्रा • Destinations
            </h4>
            <ul className="space-y-2 text-xs text-[#D8DED5]/80">
              <li>
                <Link href="/explore/manali" className="hover:text-[#EFE5D2] transition-colors flex items-center gap-1.5">
                  <span className="text-[10px] text-[#B49252]">मनाली</span> Manali Valley
                </Link>
              </li>
              <li>
                <Link href="/explore/rishikesh" className="hover:text-[#EFE5D2] transition-colors flex items-center gap-1.5">
                  <span className="text-[10px] text-[#B49252]">ऋषिकेश</span> Rishikesh Ghats
                </Link>
              </li>
              <li>
                <Link href="/explore/kasol" className="hover:text-[#EFE5D2] transition-colors flex items-center gap-1.5">
                  <span className="text-[10px] text-[#B49252]">कसोल</span> Parvati Valley
                </Link>
              </li>
              <li>
                <Link href="/explore/jaipur" className="hover:text-[#EFE5D2] transition-colors flex items-center gap-1.5">
                  <span className="text-[10px] text-[#B49252]">जयपुर</span> Royal Jaipur
                </Link>
              </li>
              <li>
                <Link href="/explore/goa" className="hover:text-[#EFE5D2] transition-colors flex items-center gap-1.5">
                  <span className="text-[10px] text-[#B49252]">गोवा</span> Coastal Goa
                </Link>
              </li>
            </ul>
          </div>

          {/* Expedition Layer */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#B49252]">
              ऑपरेटिंग लेयर • Explorer
            </h4>
            <ul className="space-y-2 text-xs text-[#D8DED5]/80">
              <li>
                <Link href="/plan" className="hover:text-[#EFE5D2] transition-colors">
                  Plan My Trip (यात्रा डायरी)
                </Link>
              </li>
              <li>
                <Link href="/explore" className="hover:text-[#EFE5D2] transition-colors">
                  Explore Sanctuaries
                </Link>
              </li>
              <li>
                <Link href="/nearby" className="hover:text-[#EFE5D2] transition-colors">
                  Nearby Finder (आस-पास)
                </Link>
              </li>
              <li>
                <Link href="/trips" className="hover:text-[#EFE5D2] transition-colors">
                  My Journeys (डायरी)
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright & Region Info */}
        <div className="pt-8 border-t border-[#243E36] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#D8DED5]/60">
          <div className="flex items-center gap-1.5">
            <span>Crafted with</span>
            <Heart className="w-3 h-3 text-[#B65E3C] fill-current inline" />
            <span>for Indian Mountain Trails &amp; Spontaneous Wanderers</span>
          </div>
          <p>© {new Date().getFullYear()} VANVAS by The Sorted Club. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
