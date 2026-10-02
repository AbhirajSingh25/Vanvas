"use client";

import React, { useEffect } from "react";
import { AskVanvasModal } from "./AskVanvasModal";
import { useAskVanvas } from "@/context/AskVanvasContext";

interface TripAssistantModalProps {
  tripId?: string;
  destinationName?: string;
  destinationSlug?: string;
  isOpen: boolean;
  onClose: () => void;
  onTriggerAction?: (actionType: string, payload?: any) => void;
  trip?: any;
}

/**
 * Unified TripAssistantModal: delegates directly to rebuilt Ask VANVAS assistant.
 * Eliminates duplicate assistant interfaces across the product.
 */
export const TripAssistantModal: React.FC<TripAssistantModalProps> = ({
  tripId,
  destinationName,
  destinationSlug,
  isOpen,
  onClose,
  trip,
}) => {
  const context = useAskVanvas();

  useEffect(() => {
    if (isOpen) {
      context.setTravelContext({
        type: "trip",
        tripId: tripId || trip?.id,
        trip,
        destinationName: destinationName || trip?.destination?.name,
        destinationSlug: destinationSlug || trip?.destination?.slug,
        title: trip?.title ? `ASK VANVAS · ${trip.title.toUpperCase()}` : "ASK VANVAS · YOUR TRIP",
        subtitle: `Trip · ${trip?.num_days || 4} days · Active itinerary`,
      });
    }
  }, [isOpen, tripId, trip, destinationName, destinationSlug]);

  return (
    <AskVanvasModal
      isOpen={isOpen}
      onClose={onClose}
      tripId={tripId}
      trip={trip}
      defaultDestination={destinationName}
    />
  );
};
