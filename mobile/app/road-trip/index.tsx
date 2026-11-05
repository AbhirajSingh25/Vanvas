import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { RoadTripCorridor, RoadTripPlanResponse } from "@vanvas/shared";
import { nativeApi } from "../../src/services/api";
import { useAuth } from "../../src/context/AuthContext";
import { theme } from "../../src/theme";

export default function RoadTripScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [corridors, setCorridors] = useState<RoadTripCorridor[]>([]);
  const [selectedCorridor, setSelectedCorridor] = useState<RoadTripCorridor | null>(null);
  const [durationDays, setDurationDays] = useState<number>(3);
  const [travellersCount, setTravellersCount] = useState<number>(2);
  const [isLoadingCorridors, setIsLoadingCorridors] = useState<boolean>(true);
  const [isPlanning, setIsPlanning] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [planResult, setPlanResult] = useState<RoadTripPlanResponse | null>(null);

  useEffect(() => {
    async function loadCorridors() {
      try {
        const res = await nativeApi.getRoadTripCorridors();
        setCorridors(res);
        if (res.length > 0) {
          setSelectedCorridor(res[0]);
        }
      } catch {
        // offline fallback
      } finally {
        setIsLoadingCorridors(false);
      }
    }
    loadCorridors();
  }, []);

  const handlePlanRoute = async () => {
    if (!selectedCorridor) return;
    setIsPlanning(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const res = await nativeApi.planRoadTrip({
        origin: selectedCorridor.origin,
        destination: selectedCorridor.destination,
        duration_days: durationDays,
        travellers_count: travellersCount,
        corridor_id: selectedCorridor.id,
      });
      setPlanResult(res);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      Alert.alert("Planning Error", err.message || "Failed to calculate road-trip route.");
    } finally {
      setIsPlanning(false);
    }
  };

  const handleSaveRoadTrip = async () => {
    if (!user) {
      Alert.alert(
        "Authentication Required",
        "Please sign in to save this road trip to your VANVAS account.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Sign In", onPress: () => router.push("/auth/login") },
        ]
      );
      return;
    }
    if (!selectedCorridor) return;

    setIsSaving(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const savedTrip = await nativeApi.saveRoadTrip({
        origin: selectedCorridor.origin,
        destination: selectedCorridor.destination,
        duration_days: durationDays,
        travellers_count: travellersCount,
        corridor_id: selectedCorridor.id,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Road Trip Saved", "Expedition saved to your active trips.", [
        { text: "View Trip", onPress: () => router.push(`/trip/${savedTrip.id}`) },
      ]);
    } catch (err: any) {
      Alert.alert("Save Failed", err.message || "Could not save road trip.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "Himalayan Road Trips",
          headerStyle: { backgroundColor: theme.colors.forestDark },
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.badge}>SCENIC CORRIDORS</Text>
          <Text style={styles.title}>Overland Road Expedition</Text>
          <Text style={styles.subtitle}>
            Curated highway routes, valley switchbacks, scenic dhaba stops, and fuel estimations.
          </Text>
        </View>

        {/* Corridor Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Scenic Corridor</Text>
          {isLoadingCorridors ? (
            <ActivityIndicator size="small" color={theme.colors.forest} />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.corridorScroll}>
              {corridors.map((c) => {
                const isSelected = selectedCorridor?.id === c.id;
                return (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedCorridor(c);
                      setPlanResult(null);
                    }}
                    style={[styles.corridorCard, isSelected && styles.corridorCardActive]}
                  >
                    <Text style={[styles.corridorName, isSelected && styles.corridorNameActive]}>
                      {c.name}
                    </Text>
                    <Text style={[styles.corridorRoute, isSelected && styles.corridorRouteActive]}>
                      {c.origin} → {c.destination}
                    </Text>
                    <View style={styles.corridorStats}>
                      <Text style={[styles.corridorStat, isSelected && styles.corridorStatActive]}>
                        {c.distance_km} km
                      </Text>
                      <Text style={[styles.corridorStat, isSelected && styles.corridorStatActive]}>
                        ~{c.drive_time_hours}h Drive
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* Route Preferences */}
        {selectedCorridor && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Duration & Travellers</Text>
            <View style={styles.prefGrid}>
              <View style={styles.prefItem}>
                <Text style={styles.prefLabel}>Duration</Text>
                <View style={styles.pillsRow}>
                  {[2, 3, 4, 5].map((d) => (
                    <TouchableOpacity
                      key={d}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setDurationDays(d);
                      }}
                      style={[styles.smallPill, durationDays === d && styles.smallPillActive]}
                    >
                      <Text
                        style={[styles.smallPillText, durationDays === d && styles.smallPillTextActive]}
                      >
                        {d}d
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.prefItem}>
                <Text style={styles.prefLabel}>Travellers</Text>
                <View style={styles.pillsRow}>
                  {[1, 2, 4, 6].map((t) => (
                    <TouchableOpacity
                      key={t}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setTravellersCount(t);
                      }}
                      style={[styles.smallPill, travellersCount === t && styles.smallPillActive]}
                    >
                      <Text
                        style={[styles.smallPillText, travellersCount === t && styles.smallPillTextActive]}
                      >
                        {t}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <TouchableOpacity
              onPress={handlePlanRoute}
              disabled={isPlanning}
              style={[styles.planBtn, isPlanning && { opacity: 0.7 }]}
            >
              {isPlanning ? (
                <ActivityIndicator size="small" color={theme.colors.parchment} />
              ) : (
                <>
                  <Ionicons name="map" size={18} color={theme.colors.parchment} />
                  <Text style={styles.planBtnText}>Calculate Route & Stops</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Calculated Plan Output */}
        {planResult && (
          <View style={styles.planSection}>
            <View style={styles.resultsHeader}>
              <View>
                <Text style={styles.planCorridorTitle}>{planResult.corridor_name}</Text>
                <Text style={styles.planMetrics}>
                  {planResult.total_distance_km} km • ~{planResult.total_driving_hours} hrs driving
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleSaveRoadTrip}
                disabled={isSaving}
                style={[styles.saveBtn, isSaving && { opacity: 0.7 }]}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color={theme.colors.parchment} />
                ) : (
                  <>
                    <Ionicons name="bookmark" size={14} color={theme.colors.parchment} />
                    <Text style={styles.saveBtnText}>Save Trip</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Itemized Budget Card */}
            {planResult.itemized_budget && (
              <View style={styles.budgetCard}>
                <Text style={styles.budgetHeading}>Estimated Overland Budget</Text>
                <View style={styles.budgetRow}>
                  <Text style={styles.budgetLabel}>Fuel Estimate</Text>
                  <Text style={styles.budgetValue}>₹{planResult.itemized_budget.fuel_estimate}</Text>
                </View>
                <View style={styles.budgetRow}>
                  <Text style={styles.budgetLabel}>Tolls & Checkposts</Text>
                  <Text style={styles.budgetValue}>₹{planResult.itemized_budget.tolls_estimate}</Text>
                </View>
                <View style={styles.budgetRow}>
                  <Text style={styles.budgetLabel}>Food & Highway Stalls</Text>
                  <Text style={styles.budgetValue}>₹{planResult.itemized_budget.food_estimate}</Text>
                </View>
                <View style={styles.budgetRow}>
                  <Text style={styles.budgetLabel}>Overnight Stays</Text>
                  <Text style={styles.budgetValue}>₹{planResult.itemized_budget.stays_estimate}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.budgetRow}>
                  <Text style={[styles.budgetLabel, { fontWeight: "700" }]}>Total Estimate</Text>
                  <Text style={[styles.budgetValue, { color: theme.colors.terracotta }]}>
                    ₹{planResult.itemized_budget.total_estimate.toLocaleString("en-IN")}
                  </Text>
                </View>
              </View>
            )}

            {/* Daily Stops */}
            <Text style={styles.dayStopsHeading}>Day-by-Day Corridor Route</Text>
            {planResult.days?.map((day) => (
              <View key={day.day_number} style={styles.dayCard}>
                <View style={styles.dayHeader}>
                  <Text style={styles.dayTitle}>Day {day.day_number}</Text>
                  <Text style={styles.dayCities}>
                    {day.from_city} → {day.to_city} ({day.distance_km} km)
                  </Text>
                </View>

                {day.stops?.map((stop, sIdx) => (
                  <View key={sIdx} style={styles.stopRow}>
                    <Ionicons name="pin" size={14} color={theme.colors.forest} />
                    <View style={styles.stopInfo}>
                      <Text style={styles.stopName}>{stop.name}</Text>
                      <Text style={styles.stopDesc}>{stop.description}</Text>
                    </View>
                  </View>
                ))}

                <View style={styles.stayRow}>
                  <Ionicons name="bed" size={14} color={theme.colors.terracotta} />
                  <Text style={styles.stayText}>Overnight: {day.overnight_stay}</Text>
                </View>
              </View>
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
  header: {
    backgroundColor: theme.colors.forestDark,
    padding: 20,
    gap: 4,
  },
  badge: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    color: theme.colors.brass,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: theme.colors.parchment,
  },
  subtitle: {
    fontSize: 12,
    color: theme.colors.mist,
    lineHeight: 18,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: theme.colors.foregroundMuted,
    marginBottom: 10,
  },
  corridorScroll: {
    marginVertical: 4,
  },
  corridorCard: {
    backgroundColor: theme.colors.surface,
    padding: 14,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: 10,
    width: 220,
    gap: 4,
  },
  corridorCardActive: {
    backgroundColor: theme.colors.forest,
    borderColor: theme.colors.forest,
  },
  corridorName: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.primaryDark,
  },
  corridorNameActive: {
    color: theme.colors.parchment,
  },
  corridorRoute: {
    fontSize: 12,
    color: theme.colors.foregroundMuted,
  },
  corridorRouteActive: {
    color: theme.colors.mist,
  },
  corridorStats: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  corridorStat: {
    fontSize: 11,
    color: theme.colors.terracotta,
    fontWeight: "600",
  },
  corridorStatActive: {
    color: theme.colors.brass,
  },
  prefGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  prefItem: {
    flex: 1,
  },
  prefLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.foreground,
    marginBottom: 6,
  },
  pillsRow: {
    flexDirection: "row",
    gap: 6,
  },
  smallPill: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  smallPillActive: {
    backgroundColor: theme.colors.forest,
    borderColor: theme.colors.forest,
  },
  smallPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.foreground,
  },
  smallPillTextActive: {
    color: theme.colors.parchment,
  },
  planBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: theme.colors.forest,
    paddingVertical: 14,
    borderRadius: theme.radius.md,
  },
  planBtnText: {
    color: theme.colors.parchment,
    fontSize: 14,
    fontWeight: "700",
  },
  planSection: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderSubtle,
  },
  resultsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  planCorridorTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.colors.primaryDark,
  },
  planMetrics: {
    fontSize: 12,
    color: theme.colors.foregroundMuted,
    marginTop: 2,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: theme.colors.terracotta,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: theme.radius.md,
  },
  saveBtnText: {
    color: theme.colors.parchment,
    fontSize: 12,
    fontWeight: "700",
  },
  budgetCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
    gap: 6,
    marginBottom: 16,
  },
  budgetHeading: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: theme.colors.foregroundMuted,
    marginBottom: 4,
  },
  budgetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  budgetLabel: {
    fontSize: 13,
    color: theme.colors.foreground,
  },
  budgetValue: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.forestDark,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.borderSubtle,
    marginVertical: 6,
  },
  dayStopsHeading: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.primaryDark,
    marginBottom: 10,
  },
  dayCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
    marginBottom: 12,
    gap: 8,
  },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  dayTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.forest,
  },
  dayCities: {
    fontSize: 12,
    color: theme.colors.foregroundMuted,
    fontWeight: "600",
  },
  stopRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
  },
  stopInfo: {
    flex: 1,
  },
  stopName: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.foreground,
  },
  stopDesc: {
    fontSize: 11,
    color: theme.colors.foregroundMuted,
    lineHeight: 16,
  },
  stayRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderSubtle,
  },
  stayText: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.terracotta,
  },
});
