import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Platform,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import { Destination } from "@vanvas/shared";
import { nativeApi } from "../src/services/api";
import { theme } from "../src/theme";

interface NearbyItem {
  id: string;
  name: string;
  category: string;
  distanceKm: number;
  lat: number;
  lng: number;
  elevationMeters?: number;
  description?: string;
  destinationSlug?: string;
}

const HIMALAYAN_BASES = [
  { name: "Kaza, Spiti Valley", lat: 32.2276, lng: 78.071, elevation: 3650 },
  { name: "Old Manali, Himachal", lat: 32.2536, lng: 77.1751, elevation: 2050 },
  { name: "McLeod Ganj, Dharamshala", lat: 32.2426, lng: 76.3213, elevation: 2082 },
  { name: "Kasol, Parvati Valley", lat: 32.01, lng: 77.315, elevation: 1580 },
  { name: "Leh, Ladakh", lat: 34.1526, lng: 77.5771, elevation: 3524 },
  { name: "Rishikesh, Uttarakhand", lat: 30.0869, lng: 78.2676, elevation: 372 },
  { name: "Shimla Mall Road", lat: 31.1048, lng: 77.1734, elevation: 2206 },
];

function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
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

export default function NearbyRadarScreen() {
  const router = useRouter();

  const [locationStatus, setLocationStatus] = useState<"detecting" | "granted" | "denied" | "custom">("detecting");
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [currentLocationName, setCurrentLocationName] = useState<string>("Detecting GPS...");
  const [selectedFilter, setSelectedFilter] = useState<string>("All");
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [nearbyItems, setNearbyItems] = useState<NearbyItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 1. Initialize GPS or Mountain Base Fallback
  const initLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationStatus("denied");
        // Default to Kaza mountain base for remote travel demonstration
        const fallback = HIMALAYAN_BASES[0];
        setCurrentCoords({ lat: fallback.lat, lng: fallback.lng });
        setCurrentLocationName(fallback.name);
        return;
      }

      setLocationStatus("granted");
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = position.coords;
      setCurrentCoords({ lat: latitude, lng: longitude });

      try {
        const reverse = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (reverse && reverse.length > 0) {
          const r = reverse[0];
          const name = [r.city || r.subregion || r.district, r.region].filter(Boolean).join(", ");
          setCurrentLocationName(name || `${latitude.toFixed(3)}°N, ${longitude.toFixed(3)}°E`);
        } else {
          setCurrentLocationName(`${latitude.toFixed(3)}°N, ${longitude.toFixed(3)}°E`);
        }
      } catch {
        setCurrentLocationName(`${latitude.toFixed(3)}°N, ${longitude.toFixed(3)}°E`);
      }
    } catch {
      setLocationStatus("denied");
      const fallback = HIMALAYAN_BASES[0];
      setCurrentCoords({ lat: fallback.lat, lng: fallback.lng });
      setCurrentLocationName(fallback.name);
    }
  }, []);

  // 2. Fetch Destinations Catalogue & Compute Distances
  const loadDestinationsAndRadar = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await nativeApi.getDestinations(false);
      setDestinations(res.destinations);
    } catch {
      // offline fallback handled by nativeApi
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initLocation();
    loadDestinationsAndRadar();
  }, [initLocation, loadDestinationsAndRadar]);

  // Recalculate sorted nearby items when coords or destinations update
  useEffect(() => {
    if (!currentCoords || destinations.length === 0) return;

    const items: NearbyItem[] = [];

    // Add destinations
    for (const d of destinations) {
      if (d.lat && d.lng) {
        const dist = calculateHaversineDistanceKm(
          currentCoords.lat,
          currentCoords.lng,
          d.lat,
          d.lng
        );
        items.push({
          id: d.id,
          name: d.name,
          category: "Destination",
          distanceKm: dist,
          lat: d.lat,
          lng: d.lng,
          description: d.tagline || d.state,
          destinationSlug: d.slug,
        });
      }
    }

    // Add key mountain emergency / transit hubs
    const mountainHubs = [
      { id: "kaza-petrol", name: "Indian Oil Kaza (Highest Fuel Pump)", category: "Fuel & Service", lat: 32.2276, lng: 78.071, elevationMeters: 3650, description: "Critical fuel stop before Kunzum Pass." },
      { id: "manali-workshop", name: "Old Manali Bullet & 4x4 Workshop", category: "Fuel & Service", lat: 32.2536, lng: 77.1751, elevationMeters: 2050, description: "Spares and altitude carburettor tuning." },
      { id: "key-monastery", name: "Key Gompa Ancient Meditation Hall", category: "Sacred", lat: 32.298, lng: 78.012, elevationMeters: 4166, description: "11th-century Gelug monastery overlooking the Spiti River.", destinationSlug: "spiti" },
      { id: "hadimba-cedar", name: "Hadimba Temple Deodar Sanctuary", category: "Sacred", lat: 32.2483, lng: 77.1805, elevationMeters: 2060, description: "Historic timber shrine in pristine cedar woods.", destinationSlug: "manali" },
      { id: "triund-ridge", name: "Triund Granite Ridge Trailhead", category: "Treks", lat: 32.258, lng: 76.353, elevationMeters: 2828, description: "Panoramic Dhauladhar trail starting above Dharamkot.", destinationSlug: "dharamshala" },
    ];

    for (const hub of mountainHubs) {
      const dist = calculateHaversineDistanceKm(
        currentCoords.lat,
        currentCoords.lng,
        hub.lat,
        hub.lng
      );
      items.push({
        ...hub,
        distanceKm: dist,
      });
    }

    // Sort by distance ascending
    items.sort((a, b) => a.distanceKm - b.distanceKm);
    setNearbyItems(items);
  }, [currentCoords, destinations]);

  const handleSelectBase = (base: (typeof HIMALAYAN_BASES)[0]) => {
    Haptics.selectionAsync();
    setCurrentCoords({ lat: base.lat, lng: base.lng });
    setCurrentLocationName(base.name);
    setLocationStatus("custom");
  };

  const openInNativeMaps = (item: NearbyItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const label = encodeURIComponent(item.name);
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${item.lat},${item.lng}`,
      android: `geo:0,0?q=${item.lat},${item.lng}(${label})`,
      default: `https://www.google.com/maps/search/?api=1&query=${item.lat},${item.lng}`,
    });
    Linking.openURL(url as string).catch(() => {});
  };

  const filteredItems = nearbyItems.filter((it) => {
    if (selectedFilter === "All") return true;
    if (selectedFilter === "Destinations") return it.category === "Destination";
    if (selectedFilter === "Sacred") return it.category === "Sacred";
    if (selectedFilter === "Treks") return it.category === "Treks";
    if (selectedFilter === "Fuel & Service") return it.category === "Fuel & Service";
    return true;
  });

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "Nearby Radar",
          headerStyle: { backgroundColor: theme.colors.forestDark },
          headerTintColor: theme.colors.parchment,
        }}
      />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Radar Hero Header */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.radarPulse}>
              <Ionicons name="radio" size={24} color={theme.colors.brass} />
            </View>
            <View style={styles.heroInfo}>
              <Text style={styles.heroBadge}>GPS TRAIL SCANNER</Text>
              <Text style={styles.heroTitle}>Nearby Mountain Radar</Text>
              <Text style={styles.heroLocality} numberOfLines={1}>
                {currentLocationName}
              </Text>
            </View>
          </View>

          {locationStatus === "denied" && (
            <View style={styles.deniedNotice}>
              <Ionicons name="information-circle" size={16} color={theme.colors.brass} />
              <Text style={styles.deniedNoticeText}>
                GPS permission denied. Showing proximity relative to mountain base.
              </Text>
            </View>
          )}

          {/* Quick Himalayan Base Switcher */}
          <View style={styles.basesContainer}>
            <Text style={styles.basesLabel}>Or choose your expedition base:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.basesScroll}>
              {HIMALAYAN_BASES.map((base) => {
                const isActive = currentLocationName === base.name;
                return (
                  <TouchableOpacity
                    key={base.name}
                    onPress={() => handleSelectBase(base)}
                    style={[styles.basePill, isActive && styles.basePillActive]}
                  >
                    <Text style={[styles.basePillText, isActive && styles.basePillTextActive]}>
                      {base.name.split(",")[0]}
                    </Text>
                    <Text style={[styles.basePillElevation, isActive && styles.basePillElevationActive]}>
                      {base.elevation}m
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {["All", "Destinations", "Sacred", "Treks", "Fuel & Service"].map((filter) => {
            const active = selectedFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedFilter(filter);
                }}
                style={[styles.filterChip, active && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Radar Results Listing */}
        <View style={styles.resultsList}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.colors.forest} />
              <Text style={styles.loadingText}>Calibrating mountain waypoints...</Text>
            </View>
          ) : filteredItems.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="compass-outline" size={40} color={theme.colors.foregroundSubtle} />
              <Text style={styles.emptyText}>No POIs found in this filter range.</Text>
            </View>
          ) : (
            filteredItems.map((item) => (
              <View key={item.id} style={styles.radarCard}>
                <View style={styles.radarCardHeader}>
                  <View style={styles.radarBadgeRow}>
                    <Text style={styles.radarCategoryBadge}>{item.category.toUpperCase()}</Text>
                    {item.elevationMeters ? (
                      <Text style={styles.radarElevationBadge}>{item.elevationMeters}m MSL</Text>
                    ) : null}
                  </View>

                  <View style={styles.distanceBadge}>
                    <Ionicons name="navigate-circle" size={14} color={theme.colors.terracotta} />
                    <Text style={styles.distanceText}>{item.distanceKm} km</Text>
                  </View>
                </View>

                <Text style={styles.radarTitle}>{item.name}</Text>
                {item.description ? (
                  <Text style={styles.radarDescription} numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : null}

                <View style={styles.radarActions}>
                  {item.destinationSlug ? (
                    <TouchableOpacity
                      onPress={() => {
                        Haptics.selectionAsync();
                        router.push(`/destination/${item.destinationSlug}`);
                      }}
                      style={styles.cardPrimaryBtn}
                    >
                      <Ionicons name="trail-sign-outline" size={14} color={theme.colors.parchment} />
                      <Text style={styles.cardPrimaryBtnText}>Explore Valley</Text>
                    </TouchableOpacity>
                  ) : null}

                  <TouchableOpacity
                    onPress={() => openInNativeMaps(item)}
                    style={styles.cardSecondaryBtn}
                  >
                    <Ionicons name="map-outline" size={14} color={theme.colors.forestDark} />
                    <Text style={styles.cardSecondaryBtnText}>Maps Navigation</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  heroCard: {
    backgroundColor: theme.colors.forestDark,
    padding: 20,
    borderBottomLeftRadius: theme.radius.lg,
    borderBottomRightRadius: theme.radius.lg,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  radarPulse: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(197, 160, 89, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.brass,
  },
  heroInfo: {
    flex: 1,
  },
  heroBadge: {
    fontSize: 10,
    fontWeight: "700",
    color: theme.colors.brass,
    letterSpacing: 1.2,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.colors.parchment,
    marginTop: 2,
  },
  heroLocality: {
    fontSize: 12,
    color: theme.colors.mist,
    marginTop: 2,
  },
  deniedNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    padding: 8,
    borderRadius: theme.radius.sm,
    marginTop: 12,
  },
  deniedNoticeText: {
    fontSize: 11,
    color: theme.colors.parchment,
    flex: 1,
  },
  basesContainer: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
    paddingTop: 12,
  },
  basesLabel: {
    fontSize: 11,
    color: theme.colors.mist,
    marginBottom: 8,
  },
  basesScroll: {
    gap: 8,
  },
  basePill: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  basePillActive: {
    backgroundColor: theme.colors.terracotta,
    borderColor: theme.colors.terracotta,
  },
  basePillText: {
    fontSize: 11,
    color: theme.colors.parchment,
    fontWeight: "600",
  },
  basePillTextActive: {
    color: theme.colors.parchment,
    fontWeight: "800",
  },
  basePillElevation: {
    fontSize: 9,
    color: theme.colors.brass,
  },
  basePillElevationActive: {
    color: theme.colors.parchment,
  },
  filterScroll: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterChipActive: {
    backgroundColor: theme.colors.forest,
    borderColor: theme.colors.forest,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.foregroundMuted,
  },
  filterChipTextActive: {
    color: theme.colors.parchment,
  },
  resultsList: {
    padding: 16,
    gap: 12,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: theme.colors.foregroundMuted,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    color: theme.colors.foregroundMuted,
  },
  radarCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 8,
  },
  radarCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  radarBadgeRow: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  radarCategoryBadge: {
    fontSize: 9,
    fontWeight: "700",
    color: theme.colors.forest,
    backgroundColor: "rgba(23, 53, 44, 0.08)",
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: theme.radius.sm,
  },
  radarElevationBadge: {
    fontSize: 9,
    fontWeight: "600",
    color: theme.colors.terracotta,
    backgroundColor: "rgba(196, 92, 59, 0.08)",
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: theme.radius.sm,
  },
  distanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.terracotta,
  },
  radarTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.foreground,
  },
  radarDescription: {
    fontSize: 12,
    color: theme.colors.foregroundMuted,
    lineHeight: 17,
  },
  radarActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderSubtle,
  },
  cardPrimaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: theme.colors.forest,
    paddingVertical: 8,
    borderRadius: theme.radius.sm,
  },
  cardPrimaryBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.parchment,
  },
  cardSecondaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: theme.colors.parchment,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 8,
    borderRadius: theme.radius.sm,
  },
  cardSecondaryBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.forestDark,
  },
});
