import * as Location from "expo-location";
import { Platform } from "react-native";

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
}

export const locationService = {
  /**
   * Request foreground location permission only when needed (e.g. for I'M HERE or nearby discovery).
   * Does NOT request background location.
   */
  async requestForegroundPermission(): Promise<boolean> {
    if (Platform.OS === "web") {
      return new Promise((resolve) => {
        if (!navigator.geolocation) {
          resolve(false);
          return;
        }
        navigator.geolocation.getCurrentPosition(
          () => resolve(true),
          () => resolve(false)
        );
      });
    }

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === Location.PermissionStatus.GRANTED;
    } catch {
      return false;
    }
  },

  async getCurrentLocation(): Promise<GeoCoordinates | null> {
    try {
      if (Platform.OS === "web") {
        return new Promise((resolve) => {
          if (!navigator.geolocation) return resolve(null);
          navigator.geolocation.getCurrentPosition(
            (pos) =>
              resolve({
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                accuracy: pos.coords.accuracy,
              }),
            () => resolve(null),
            { timeout: 10000, enableHighAccuracy: true }
          );
        });
      }

      const hasPermission = await this.requestForegroundPermission();
      if (!hasPermission) return null;

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        accuracy: loc.coords.accuracy,
      };
    } catch {
      return null;
    }
  },
};
