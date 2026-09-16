import React from "react";
import { Bus, Clock, Hotel, Coffee, Luggage, Sparkles, ArrowRight, ExternalLink } from "lucide-react";
import { ArrivalOptimizerResponse } from "@/types";
import { TravelStamp } from "@/components/ui/TravelStamp";

interface ArrivalOptimizerCardProps {
  data: ArrivalOptimizerResponse;
}

export const ArrivalOptimizerCard: React.FC<ArrivalOptimizerCardProps> = ({ data }) => {
  const { best_option, alternative_options, traveller_tip, destination_name } = data;

  if (!best_option) return null;

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-[#FAF7F0] border-2 border-[#E5D5BA] shadow-sm space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5D5BA] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <TravelStamp label="पड़ाव अनुकूलन" sub="ARRIVAL OPTIMIZER" variant="terracotta" />
            <TravelStamp label="SMART TRANSIT BRIDGE" variant="forest" />
          </div>
          <h3 className="text-xl font-serif font-black text-[#173B32] mt-2">
            Best Transit Arrival Sequence for {destination_name}
          </h3>
        </div>
        <div className="text-left sm:text-right">
          <div className="text-xs text-[#7B4D36] uppercase font-bold">Estimated Transit Fare</div>
          <div className="text-2xl font-mono font-black text-[#B65E3C]">₹{best_option.transport_option.price}</div>
        </div>
      </div>

      {/* Selected Best Option Card */}
      <div className="p-5 rounded-2xl bg-[#EFE5D2] border-2 border-[#E5D5BA] space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#173B32] text-[#EFE5D2] flex items-center justify-center shadow-xs">
              <Bus className="w-5 h-5 text-[#B49252]" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-base text-[#173B32]">{best_option.transport_option.operator_name}</h4>
              <p className="text-xs text-[#7B4D36]">
                {best_option.transport_option.transport_type} • Depart {best_option.transport_option.departure_time} from {best_option.transport_option.departure_location}
              </p>
            </div>
          </div>
          {best_option.transport_option.booking_url && (
            <a
              href={best_option.transport_option.booking_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-4 py-2 rounded-xl bg-[#B65E3C] text-[#EFE5D2] font-bold uppercase tracking-wider hover:bg-[#9E4D2E] transition-colors flex items-center gap-1.5 self-end sm:self-auto shadow-xs"
            >
              <span>Book Ticket</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        {/* Arrival Bridge Schedule */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-[#FAF7F0] border border-[#E5D5BA]">
            <div className="flex items-center gap-1.5 text-xs text-[#7B4D36] font-semibold">
              <Clock className="w-3.5 h-3.5 text-[#173B32]" />
              <span>पहुँचने का समय • Arrival</span>
            </div>
            <div className="font-mono font-bold text-base text-[#173B32] mt-0.5">{best_option.expected_arrival}</div>
            <div className="text-[11px] text-[#20211D]/70 font-light">Valley Bus Stand</div>
          </div>

          <div className="p-3 rounded-xl bg-[#FAF7F0] border border-[#E5D5BA]">
            <div className="flex items-center gap-1.5 text-xs text-[#7B4D36] font-semibold">
              <Coffee className="w-3.5 h-3.5 text-[#B65E3C]" />
              <span>नाश्ता • Breakfast</span>
            </div>
            <div className="font-mono font-bold text-base text-[#173B32] mt-0.5">{best_option.breakfast_window}</div>
            <div className="text-[11px] text-[#20211D]/70 font-light">Riverside Dhaba / Chai</div>
          </div>

          <div className="p-3 rounded-xl bg-[#FAF7F0] border border-[#E5D5BA]">
            <div className="flex items-center gap-1.5 text-xs text-[#7B4D36] font-semibold">
              <Luggage className="w-3.5 h-3.5 text-[#B49252]" />
              <span>सामान रखना • Luggage</span>
            </div>
            <div className="font-mono font-bold text-base text-[#173B32] mt-0.5">09:45 AM</div>
            <div className="text-[11px] text-[#20211D]/70 font-light">Hotel Front Desk</div>
          </div>

          <div className="p-3 rounded-xl bg-[#FAF7F0] border border-[#E5D5BA]">
            <div className="flex items-center gap-1.5 text-xs text-[#7B4D36] font-semibold">
              <Hotel className="w-3.5 h-3.5 text-[#173B32]" />
              <span>कमरा • Room Check-in</span>
            </div>
            <div className="font-mono font-bold text-base text-[#173B32] mt-0.5">{best_option.hotel_check_in_time}</div>
            <div className="text-[11px] text-[#20211D]/70 font-light">Official Valley Check-In</div>
          </div>
        </div>

        {/* Verdict */}
        <p className="text-xs text-[#173B32] font-serif bg-[#FAF7F0] border border-[#E5D5BA] p-3 rounded-xl leading-relaxed italic">
          &ldquo;{best_option.overall_verdict}&rdquo;
        </p>
      </div>

      {/* Tip Banner */}
      <div className="p-4 rounded-2xl bg-[#EFE5D2] border border-[#E5D5BA] text-xs text-[#7B4D36] flex items-start gap-3">
        <Sparkles className="w-4 h-4 text-[#B65E3C] shrink-0 mt-0.5" />
        <span className="leading-relaxed font-light">{traveller_tip}</span>
      </div>
    </div>
  );
};
