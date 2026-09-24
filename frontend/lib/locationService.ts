/**
 * VANVAS Location & GPS Service
 * Reusable geolocation architecture with explicit permission states, timeout handling, and fallback support.
 */

export type LocationStatus =
  | "IDLE"
  | "REQUESTING"
  | "GRANTED"
  | "DENIED"
  | "TIMEOUT"
  | "UNAVAILABLE"
  | "MANUAL_OVERRIDE";

export interface GeoCoordinate {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  altitudeMeters?: number | null;
  timestamp: number;
}

export interface UserLocationState {
  status: LocationStatus;
  coords: GeoCoordinate | null;
  resolvedCityName?: string;
  errorMessage?: string;
}

const STORAGE_KEY = "vanvas_user_location";

export async function getCurrentGPSPosition(
  options: PositionOptions = { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
): Promise<UserLocationState> {
  if (typeof window === "undefined" || !navigator.geolocation) {
    return {
      status: "UNAVAILABLE",
      coords: null,
      errorMessage: "Geolocation is not supported by your browser.",
    };
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: GeoCoordinate = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracyMeters: pos.coords.accuracy,
          altitudeMeters: pos.coords.altitude,
          timestamp: pos.timestamp,
        };

        const state: UserLocationState = {
          status: "GRANTED",
          coords,
        };

        try {
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(coords));
        } catch {
          // ignore session storage error
        }

        resolve(state);
      },
      (error) => {
        let status: LocationStatus = "UNAVAILABLE";
        let message = "Unable to retrieve your location.";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            status = "DENIED";
            message = "Location access was denied. You can select your origin city manually.";
            break;
          case error.TIMEOUT:
            status = "TIMEOUT";
            message = "Location request timed out. Please try again or select city manually.";
            break;
          case error.POSITION_UNAVAILABLE:
            status = "UNAVAILABLE";
            message = "GPS satellite signal unavailable. Please select your origin city.";
            break;
        }

        resolve({
          status,
          coords: null,
          errorMessage: message,
        });
      },
      options
    );
  });
}

/**
 * Calculates Great-Circle distance in Kilometers between two coordinates using Haversine formula
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}
