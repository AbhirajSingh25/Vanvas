"use client";

import React from "react";
import Link from "next/link";
import {
  Star, MapPin, Clock, ArrowRight, Sparkles, Navigation,
  ShieldCheck, ExternalLink, BedDouble, Bike, Utensils, Info, Check
} from "lucide-react";
import { VanvasImage } from "@/components/ui/VanvasImage";
import { Place, Hotel, RentalOption } from "@/types";
import { resolvePlaceArtwork, resolveHotelArtwork } from "@/lib/placeVisualResolver";
import { VehicleArtwork } from "@/components/ui/VehicleArtwork";

export interface FeaturedPlaceCardProps {
  place: Place;
  destinationName: string;
  onExplore: (place: Place) => void;
  onPlan?: (place: Place) => void;
}

export const FeaturedPlaceCard: React.FC<FeaturedPlaceCardProps> = ({
  place,
  destinationName,
  onExplore,
  onPlan,
}) => {
  const visual = resolvePlaceArtwork(
    place.name,
    destinationName,
    place.category || "Must Visit",
    place.image_url,
    place.is_live,
    place.source
  );

  return (
    <div className="relative rounded-3xl overflow-hidden bg-[#FAF7F0] dark:bg-[#15231F] border-2 border-[#E5D5BA] dark:border-[#2C3B34] shadow-md hover:shadow-xl transition-all group">
      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* Large Cinematic Visual Frame */}
        <div className="lg:col-span-7 relative h-64 sm:h-80 lg:h-96 overflow-hidden bg-[#0F2924]">
          <VanvasImage
            src={visual.imageUrl}
            fallbackSrc={visual.fallbackUrl}
            alt={`${place.name} in ${destinationName}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F2924]/90 via-transparent to-black/20 pointer-events-none" />

          {/* Top Badges */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-[#B65E3C] text-white text-[11px] font-mono font-black uppercase tracking-wider shadow-sm flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              <span>Primary Landmark</span>
            </span>
            <span className="px-2.5 py-1 rounded-full bg-[#0F2924]/80 backdrop-blur-md text-[#EFE5D2] text-[10px] font-bold uppercase tracking-wider border border-white/10">
              {place.category || "Must Visit"}
            </span>
          </div>

          {/* Quick Stats on Bottom of Image */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-[#FAF7F0] text-xs font-mono">
            {place.rating !== undefined && place.rating !== null ? (
              <span className="px-2.5 py-1 rounded-md bg-[#0F2924]/80 backdrop-blur-md border border-white/10 flex items-center gap-1.5 font-bold">
                <Star className="w-3.5 h-3.5 text-[#B49252] fill-current" />
                <span>{place.rating}</span>
                {place.review_count && <span className="opacity-70">({place.review_count})</span>}
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-md bg-[#0F2924]/80 backdrop-blur-md border border-white/10 text-[10px]">
                Verified Sanctuary
              </span>
            )}

            {typeof place.distance_km === "number" && (
              <span className="px-2.5 py-1 rounded-md bg-[#0F2924]/80 backdrop-blur-md border border-white/10 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#B49252]" />
                <span>{place.distance_km} km from town</span>
              </span>
            )}
          </div>
        </div>

        {/* Narrative & Field Dossier Content */}
        <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#B65E3C] dark:text-[#E28C68]">
                Featured Sanctuary • {destinationName}
              </span>
              <h3 className="font-serif font-black text-2xl sm:text-3xl text-[#173B32] dark:text-[#FAF7F0] leading-tight">
                {place.name}
              </h3>
            </div>

            <p className="text-xs sm:text-sm text-[#7B4D36] dark:text-[#C5A898] leading-relaxed line-clamp-3">
              {place.description || place.historical_significance || `Iconic landmark in ${destinationName} renowned for spiritual heritage and natural panoramas.`}
            </p>

            {/* Field Meta Chips */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E5D5BA]/70 dark:border-[#2C3B34] text-xs">
              <div className="p-2.5 rounded-xl bg-[#FAF4E8] dark:bg-[#1C2E27] border border-[#E5D5BA]/80 dark:border-[#2C3B34] space-y-0.5">
                <span className="text-[10px] font-mono text-[#7B4D36] dark:text-[#A89284] uppercase block">Timing</span>
                <span className="font-bold text-[#173B32] dark:text-[#FAF7F0] text-xs truncate block">
                  {place.opening_hours || "06:00 AM - 06:00 PM"}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#FAF4E8] dark:bg-[#1C2E27] border border-[#E5D5BA]/80 dark:border-[#2C3B34] space-y-0.5">
                <span className="text-[10px] font-mono text-[#7B4D36] dark:text-[#A89284] uppercase block">Entry &amp; Access</span>
                <span className="font-bold text-[#173B32] dark:text-[#FAF7F0] text-xs truncate block">
                  {place.entry_fee_details || (place.approx_cost ? `₹${place.approx_cost}` : "Free Admission")}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onExplore(place)}
              className="flex-1 py-3 px-4 rounded-xl bg-[#173B32] hover:bg-[#20453B] text-[#FAF7F0] font-serif font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
            >
              <Info className="w-4 h-4 text-[#B49252]" />
              <span>Explore Landmark</span>
            </button>

            {onPlan && (
              <button
                type="button"
                onClick={() => onPlan(place)}
                className="py-3 px-4 rounded-xl bg-[#B65E3C] hover:bg-[#A35131] text-[#FAF7F0] font-serif font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <span>Plan This Place</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export interface FeaturedStayCardProps {
  hotel: Hotel;
  destinationName: string;
  onSelect: (hotel: Hotel) => void;
  onBook?: (hotel: Hotel) => void;
}

export const FeaturedStayCard: React.FC<FeaturedStayCardProps> = ({
  hotel,
  destinationName,
  onSelect,
  onBook,
}) => {
  const stayVisual = resolveHotelArtwork(
    hotel.name,
    destinationName,
    hotel.hotel_style || hotel.accommodation_type,
    hotel.image_url,
    hotel.is_live,
    hotel.source
  );

  const priceText = hotel.price_formatted || (hotel.price_per_night ? `₹${hotel.price_per_night}/night` : "Rate upon inquiry");
  
  const amenitiesList: string[] = Array.isArray(hotel.amenities)
    ? hotel.amenities
    : typeof hotel.amenities === "string"
    ? (hotel.amenities as string).split(",")
    : [];

  return (
    <div className="relative rounded-3xl overflow-hidden bg-[#FAF7F0] dark:bg-[#15231F] border-2 border-[#E5D5BA] dark:border-[#2C3B34] shadow-md hover:shadow-xl transition-all group">
      <div className="grid grid-cols-1 lg:grid-cols-12">
        <div className="lg:col-span-7 relative h-64 sm:h-80 overflow-hidden bg-[#0F2924]">
          <VanvasImage
            src={stayVisual.imageUrl}
            fallbackSrc={stayVisual.fallbackUrl}
            alt={`${hotel.name} in ${destinationName}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F2924]/90 via-transparent to-black/20 pointer-events-none" />

          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-[#173B32] text-[#FAF7F0] text-[11px] font-mono font-bold uppercase tracking-wider shadow-sm flex items-center gap-1.5">
              <BedDouble className="w-3 h-3 text-[#B49252]" />
              <span>Featured Stay Sanctuary</span>
            </span>
          </div>

          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-[#FAF7F0] text-xs font-mono">
            <span className="px-3 py-1 rounded-md bg-[#0F2924]/85 backdrop-blur-md border border-white/10 font-bold text-sm text-[#FAF7F0]">
              {priceText}
            </span>
            {hotel.rating && (
              <span className="px-2.5 py-1 rounded-md bg-[#0F2924]/80 backdrop-blur-md border border-white/10 flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-[#B49252] fill-current" />
                <span>{hotel.rating}</span>
              </span>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#B65E3C] dark:text-[#E28C68]">
                {hotel.accommodation_type || "Verified Retreat"} • {destinationName}
              </span>
              <h3 className="font-serif font-black text-2xl text-[#173B32] dark:text-[#FAF7F0]">
                {hotel.name}
              </h3>
              <p className="text-xs text-[#7B4D36] dark:text-[#C5A898] flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#B65E3C]" />
                <span>{hotel.address || destinationName}</span>
              </p>
            </div>

            <p className="text-xs text-[#7B4D36] dark:text-[#C5A898] leading-relaxed line-clamp-3">
              Verified hospitality sanctuary in {destinationName} with direct mountain access, regional food, and local hosts.
            </p>

            {amenitiesList.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {amenitiesList.slice(0, 4).map((am, i) => (
                  <span key={i} className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#EFE5D2] dark:bg-[#1C2E27] text-[#173B32] dark:text-[#FAF7F0] border border-[#E5D5BA] dark:border-[#2C3B34]">
                    {am.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onSelect(hotel)}
              className="flex-1 py-3 px-4 rounded-xl bg-[#173B32] hover:bg-[#20453B] text-[#FAF7F0] font-serif font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
            >
              <span>View Stay Details</span>
            </button>
            {onBook && (
              <button
                type="button"
                onClick={() => onBook(hotel)}
                className="py-3 px-4 rounded-xl bg-[#B65E3C] hover:bg-[#A35131] text-[#FAF7F0] font-serif font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <span>Reserve</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export interface FeaturedVehicleCardProps {
  rental: RentalOption;
  destinationName: string;
  onSelect: (rental: RentalOption) => void;
}

export const FeaturedVehicleCard: React.FC<FeaturedVehicleCardProps> = ({
  rental,
  destinationName,
  onSelect,
}) => {
  return (
    <div className="relative rounded-3xl overflow-hidden bg-[#FAF7F0] dark:bg-[#15231F] border-2 border-[#E5D5BA] dark:border-[#2C3B34] shadow-md hover:shadow-xl transition-all group">
      <div className="grid grid-cols-1 lg:grid-cols-12">
        <div className="lg:col-span-7 relative h-60 sm:h-72 overflow-hidden bg-[#0F2924]">
          <VehicleArtwork
            type={rental.vehicle_type}
            name={rental.vehicle_name}
            destination={destinationName}
            imageUrl={rental.image_url}
            alt={rental.vehicle_name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F2924]/90 via-transparent to-black/20 pointer-events-none" />

          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-[#173B32] text-[#FAF7F0] text-[11px] font-mono font-bold uppercase tracking-wider shadow-sm flex items-center gap-1.5">
              <Bike className="w-3 h-3 text-[#B49252]" />
              <span>Recommended Expedition Vehicle</span>
            </span>
          </div>

          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-[#FAF7F0] text-xs font-mono">
            <span className="px-3 py-1 rounded-md bg-[#0F2924]/85 backdrop-blur-md border border-white/10 font-bold text-sm text-[#FAF7F0]">
              {rental.price_per_day ? `₹${rental.price_per_day}/day` : "Rate upon inquiry"}
            </span>
            <span className="px-2.5 py-1 rounded-md bg-[#0F2924]/80 backdrop-blur-md border border-white/10">
              {rental.location || "Central Hub Depot"}
            </span>
          </div>
        </div>

        <div className="lg:col-span-5 p-6 sm:p-7 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#B65E3C] dark:text-[#E28C68]">
                {rental.vehicle_type || "Motorcycle / Scooter"} • Verified Mobility
              </span>
              <h3 className="font-serif font-black text-2xl text-[#173B32] dark:text-[#FAF7F0]">
                {rental.vehicle_name}
              </h3>
              <p className="text-xs text-[#7B4D36] dark:text-[#C5A898]">
                Provider: {rental.provider_name || "Verified Local Fleet"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-[#FAF4E8] dark:bg-[#1C2E27] border border-[#E5D5BA] dark:border-[#2C3B34]">
                <span className="text-[10px] text-[#7B4D36] dark:text-[#A89284] block">Refundable Deposit</span>
                <span className="font-bold text-[#173B32] dark:text-[#FAF7F0]">
                  {rental.deposit ? `₹${rental.deposit}` : "Original ID / Card"}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#FAF4E8] dark:bg-[#1C2E27] border border-[#E5D5BA] dark:border-[#2C3B34]">
                <span className="text-[10px] text-[#7B4D36] dark:text-[#A89284] block">Operating Hours</span>
                <span className="font-bold text-[#173B32] dark:text-[#FAF7F0]">
                  {rental.opening_hours || "08:00 AM - 08:00 PM"}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSelect(rental)}
            className="w-full py-3 px-4 rounded-xl bg-[#173B32] hover:bg-[#20453B] text-[#FAF7F0] font-serif font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
          >
            <span>View Rental Terms &amp; Book</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#B49252]" />
          </button>
        </div>
      </div>
    </div>
  );
};
