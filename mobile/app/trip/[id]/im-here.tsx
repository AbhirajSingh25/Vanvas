import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ImHereResponse, Place } from "@vanvas/shared";
import { nativeApi } from "../../../src/services/api";
import { locationService } from "../../../src/services/location";
import { PlaceCard } from "../../../src/components/PlaceCard";
import { theme } from "../../../src/theme";

export default function ImHereScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [context, setContext] = useState<ImHereResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isReplanning, setIsReplanning] = useState<boolean>(false);
  const [locationName, setLocationName] = useState<string>("Detecting mountain location...");

  const fetchArrivalContext = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const coords = await locationService.getCurrentLocation();
      const res = await nativeApi.getImHereContext(
        id,
        coords?.latitude,
        coords?.longitude,
        coords ? "Current GPS Coordinates" : "Transit Arrival Point"
      );
      setContext(res);
      setLocationName(res.current_location_name || res.arrival_hub || "Arrival Hub");
    } catch (err: any) {
      Alert.alert("Arrival Sync", err.message || "Unable to fetch immediate arrival schedule.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchArrivalContext();
  }, [fetchArrivalContext]);

  const handleReplan = async (actionType: string) => {
    if (!id) return;
    setIsReplanning(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const res = await nativeApi.replanTrip(id, actionType);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Itinerary Adapted", res.message || "Your upcoming schedule has been updated.");
      await fetchArrivalContext();
    } catch (err: any) {
      Alert.alert("Replan Failed", err.message || "Could not adapt schedule at this time.");
    } finally {
      setIsReplanning(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.parchment} />
        <Text style={styles.loadingText}>Synthesizing 3-Hour Arrival Blueprint...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "I'M HERE Arrival Mode",
          headerStyle: { backgroundColor: theme.colors.forestDark },
          headerTintColor: theme.colors.parchment,
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Arrival Hero Banner */}
        <View style={styles.heroBanner}>
          <View style={styles.pulseIndicator}>
            <View style={styles.pulseDot} />
            <Text style={styles.pulseText}>LIVE TRANSIT ORIENTATION</Text>
          </View>
          <Text style={styles.hubTitle}>{locationName}</Text>
          <Text style={styles.hubSubtitle}>
            Immediate next steps to bridge arrival, luggage drops, and check-ins.
          </Text>
        </View>

        {/* Dynamic Replan Action Triggers */}
        <View style={styles.replanSection}>
          <Text style={styles.sectionBadge}>RAPID ADAPTATIONS</Text>
          <View style={styles.replanRow}>
            <TouchableOpacity
              onPress={() => handleReplan("running_late")}
              disabled={isReplanning}
              style={[styles.replanPill, { backgroundColor: theme.colors.terracotta }]}
            >
              <Ionicons name="time" size={14} color={theme.colors.parchment} />
              <Text style={styles.replanText}>Running Late</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleReplan("fatigued")}
              disabled={isReplanning}
              style={[styles.replanPill, { backgroundColor: theme.colors.forest }]}
            >
              <Ionicons name="bed-outline" size={14} color={theme.colors.parchment} />
              <Text style={styles.replanText}>Tired / Slow Down</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleReplan("raining")}
              disabled={isReplanning}
              style={[styles.replanPill, { backgroundColor: theme.colors.forestHover }]}
            >
              <Ionicons name="rainy-outline" size={14} color={theme.colors.parchment} />
              <Text style={styles.replanText}>It&apos;s Raining</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Hotel Check-In Guidance */}
        {context?.hotel_checkin_guidance && (
          <View style={styles.guidanceCard}>
            <View style={styles.guidanceHeader}>
              <Ionicons name="business" size={18} color={theme.colors.brass} />
              <Text style={styles.guidanceTitle}>Hotel Check-In & Luggage</Text>
            </View>
            <Text style={styles.guidanceHotel}>
              {context.hotel_checkin_guidance.hotel_name || "Reserved Mountain Stay"}
            </Text>
            <Text style={styles.guidanceMessage}>
              {context.hotel_checkin_guidance.message}
            </Text>
          </View>
        )}

        {/* NOW / NEXT / LATER Triad */}
        <View style={styles.scheduleSection}>
          {/* NOW Card */}
          {context?.now_item && (
            <View style={[styles.triadCard, styles.nowCard]}>
              <View style={styles.triadBadgeRow}>
                <View style={styles.nowBadge}>
                  <Text style={styles.nowBadgeText}>NOW</Text>
                </View>
                <Text style={styles.triadTime}>{context.now_item.time}</Text>
              </View>
              <Text style={styles.triadTitle}>{context.now_item.title}</Text>
              <Text style={styles.triadDesc}>{context.now_item.description}</Text>
            </View>
          )}

          {/* NEXT Card */}
          {context?.next_item && (
            <View style={[styles.triadCard, styles.nextCard]}>
              <View style={styles.triadBadgeRow}>
                <View style={styles.nextBadge}>
                  <Text style={styles.nextBadgeText}>NEXT</Text>
                </View>
                <Text style={styles.triadTime}>{context.next_item.time}</Text>
              </View>
              <Text style={styles.triadTitle}>{context.next_item.title}</Text>
              <Text style={styles.triadDesc}>{context.next_item.description}</Text>
            </View>
          )}

          {/* LATER Card */}
          {context?.later_items && context.later_items.length > 0 && (
            <View style={styles.triadCard}>
              <View style={styles.triadBadgeRow}>
                <View style={styles.laterBadge}>
                  <Text style={styles.laterBadgeText}>LATER</Text>
                </View>
                <Text style={styles.triadTime}>{context.later_items[0].time}</Text>
              </View>
              <Text style={styles.triadTitle}>{context.later_items[0].title}</Text>
              <Text style={styles.triadDesc}>{context.later_items[0].description}</Text>
            </View>
          )}
        </View>

        {/* Local Mobility Tip */}
        {context?.transport_guidance && (
          <View style={styles.mobilityCard}>
            <View style={styles.mobilityHeader}>
              <Ionicons name="bicycle" size={16} color={theme.colors.forest} />
              <Text style={styles.mobilityTitle}>
                Local Mobility: {context.transport_guidance.recommended_mode}
              </Text>
            </View>
            <Text style={styles.mobilityFare}>
              Est. Fare: {context.transport_guidance.estimated_fare}
            </Text>
            <Text style={styles.mobilityTip}>{context.transport_guidance.tip}</Text>
          </View>
        )}

        {/* Nearby Food */}
        {context?.nearby_food && context.nearby_food.length > 0 && (
          <View style={styles.foodSection}>
            <Text style={styles.sectionBadge}>MORNING FUEL</Text>
            <Text style={styles.sectionTitle}>Nearest Verified Cafes & Dhabas</Text>
            {context.nearby_food.map((p) => (
              <PlaceCard key={p.id} place={p} />
            ))}
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.forestDark,
  },
  loadingText: {
    fontSize: 13,
    color: theme.colors.parchment,
    marginTop: 10,
    fontWeight: "600",
  },
  heroBanner: {
    backgroundColor: theme.colors.forestDark,
    padding: 20,
    gap: 4,
  },
  pulseIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
  },
  pulseText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: "#10B981",
  },
  hubTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: theme.colors.parchment,
  },
  hubSubtitle: {
    fontSize: 12,
    color: theme.colors.mist,
    lineHeight: 16,
  },
  replanSection: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  sectionBadge: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: theme.colors.terracotta,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.colors.primaryDark,
    marginBottom: 12,
  },
  replanRow: {
    flexDirection: "row",
    gap: 8,
  },
  replanPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
  },
  replanText: {
    color: theme.colors.parchment,
    fontSize: 11,
    fontWeight: "700",
  },
  guidanceCard: {
    margin: 16,
    padding: 16,
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radius.lg,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.brass,
    gap: 4,
  },
  guidanceHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  guidanceTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    color: theme.colors.burntEarth,
    textTransform: "uppercase",
  },
  guidanceHotel: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.primaryDark,
  },
  guidanceMessage: {
    fontSize: 13,
    color: theme.colors.foreground,
    lineHeight: 18,
  },
  scheduleSection: {
    paddingHorizontal: 16,
    gap: 10,
    marginTop: 4,
  },
  triadCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
    gap: 6,
  },
  nowCard: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.terracotta,
  },
  nextCard: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.forest,
  },
  triadBadgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  nowBadge: {
    backgroundColor: theme.colors.terracotta,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: theme.radius.sm,
  },
  nowBadgeText: {
    color: theme.colors.parchment,
    fontSize: 10,
    fontWeight: "800",
  },
  nextBadge: {
    backgroundColor: theme.colors.forest,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: theme.radius.sm,
  },
  nextBadgeText: {
    color: theme.colors.parchment,
    fontSize: 10,
    fontWeight: "800",
  },
  laterBadge: {
    backgroundColor: theme.colors.surfaceMuted,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: theme.radius.sm,
  },
  laterBadgeText: {
    color: theme.colors.foregroundMuted,
    fontSize: 10,
    fontWeight: "700",
  },
  triadTime: {
    fontSize: 11,
    color: theme.colors.foregroundSubtle,
    fontWeight: "600",
  },
  triadTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.primaryDark,
  },
  triadDesc: {
    fontSize: 13,
    color: theme.colors.foregroundMuted,
    lineHeight: 18,
  },
  mobilityCard: {
    margin: 16,
    padding: 14,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 4,
  },
  mobilityHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  mobilityTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.forestDark,
  },
  mobilityFare: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.terracotta,
  },
  mobilityTip: {
    fontSize: 12,
    color: theme.colors.foregroundMuted,
  },
  foodSection: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
});
