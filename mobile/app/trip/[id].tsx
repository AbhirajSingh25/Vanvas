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
import { Trip, ItineraryDay, ItineraryItem, Expense } from "@vanvas/shared";
import { nativeApi } from "../../src/services/api";
import { theme } from "../../src/theme";

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(1);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCached, setIsCached] = useState<boolean>(false);

  const loadTrip = useCallback(async () => {
    if (!id) return;
    try {
      const res = await nativeApi.getTrip(id);
      setTrip(res.trip);
      setIsCached(res.isCached);

      try {
        const exp = await nativeApi.getExpenses(id);
        setExpenses(exp);
      } catch {
        // expenses may be empty or offline
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to load expedition itinerary.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTrip();
  }, [loadTrip]);

  const handleToggleItemStatus = async (item: ItineraryItem) => {
    if (!trip) return;
    const targetStatus: "pending" | "completed" = item.status === "completed" ? "pending" : "completed";
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Optimistic update
    const prevTrip = { ...trip };
    const updatedDays = trip.itinerary_days.map((day) => ({
      ...day,
      items: day.items.map((it) => (it.id === item.id ? { ...it, status: targetStatus } : it)),
    }));
    setTrip({ ...trip, itinerary_days: updatedDays });

    try {
      await nativeApi.updateItineraryItem(trip.id, item.id, targetStatus as any);
    } catch {
      // Rollback on rejection
      setTrip(prevTrip);
      Alert.alert("Sync Error", "Could not update item status on the server.");
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.forest} />
        <Text style={styles.loadingText}>Unrolling Itinerary Scrolls...</Text>
      </View>
    );
  }

  if (!trip) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={40} color={theme.colors.terracotta} />
        <Text style={styles.errorText}>Trip not found.</Text>
      </View>
    );
  }

  const selectedDay: ItineraryDay | undefined = trip.itinerary_days?.find(
    (d) => d.day_number === selectedDayNumber
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: trip.destination_name || "Expedition",
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push(`/trip/${trip.id}/im-here`)}
              style={styles.imHereHeaderBtn}
            >
              <Text style={styles.imHereHeaderText}>I&apos;M HERE</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Expedition Status Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerLeft}>
            <Text style={styles.bannerBadge}>{trip.status.toUpperCase()}</Text>
            <Text style={styles.bannerTitle}>{trip.destination_name || "Mountain Trail"}</Text>
            <Text style={styles.bannerDates}>
              {trip.start_date} – {trip.end_date} • {trip.origin_city} departure
            </Text>
          </View>
          {isCached && (
            <View style={styles.cachedBadge}>
              <Text style={styles.cachedText}>Cached Snapshot</Text>
            </View>
          )}
        </View>

        {/* Quick Arrival / Copilot Action Bar */}
        <View style={styles.quickBar}>
          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync();
              router.push(`/trip/${trip.id}/im-here`);
            }}
            style={[styles.quickBarBtn, styles.quickBarImHere]}
          >
            <Ionicons name="navigate" size={16} color={theme.colors.parchment} />
            <Text style={styles.quickBarImHereText}>Arrival Mode (I&apos;M HERE)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync();
              router.push(`/ask-vanvas?trip_id=${trip.id}`);
            }}
            style={styles.quickBarBtn}
          >
            <Ionicons name="chatbubbles" size={16} color={theme.colors.forest} />
            <Text style={styles.quickBarBtnText}>Ask Copilot</Text>
          </TouchableOpacity>
        </View>

        {/* Day Selector Tabs */}
        {trip.itinerary_days && trip.itinerary_days.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.daySelectorScroll}
          >
            {trip.itinerary_days.map((day) => {
              const active = day.day_number === selectedDayNumber;
              return (
                <TouchableOpacity
                  key={day.day_number}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedDayNumber(day.day_number);
                  }}
                  style={[styles.dayTab, active && styles.dayTabActive]}
                >
                  <Text style={[styles.dayTabNumber, active && styles.dayTabNumberActive]}>
                    Day {day.day_number}
                  </Text>
                  <Text style={[styles.dayTabDate, active && styles.dayTabDateActive]}>
                    {day.date}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Day Itinerary Timeline */}
        <View style={styles.timelineSection}>
          <View style={styles.timelineHeader}>
            <Text style={styles.timelineTitle}>
              Day {selectedDayNumber} Schedule
            </Text>
            {selectedDay?.theme ? (
              <Text style={styles.dayTheme}>{selectedDay.theme}</Text>
            ) : null}
          </View>

          {(!selectedDay?.items || selectedDay.items.length === 0) ? (
            <View style={styles.emptyDayContainer}>
              <Ionicons name="time-outline" size={32} color={theme.colors.foregroundSubtle} />
              <Text style={styles.emptyDayText}>No scheduled items for this day.</Text>
            </View>
          ) : (
            selectedDay.items.map((item, idx) => {
              const isCompleted = item.status === "completed";
              return (
                <View key={item.id} style={styles.timelineRow}>
                  {/* Left indicator & connector */}
                  <View style={styles.timelineLeft}>
                    <TouchableOpacity
                      onPress={() => handleToggleItemStatus(item)}
                      style={[
                        styles.statusCheck,
                        isCompleted && styles.statusCheckCompleted,
                      ]}
                    >
                      <Ionicons
                        name={isCompleted ? "checkmark" : "ellipse-outline"}
                        size={14}
                        color={isCompleted ? theme.colors.parchment : theme.colors.forest}
                      />
                    </TouchableOpacity>
                    {idx < selectedDay.items.length - 1 && <View style={styles.connectorLine} />}
                  </View>

                  {/* Right Item Card */}
                  <View style={[styles.itemCard, isCompleted && styles.itemCardCompleted]}>
                    <View style={styles.itemCardHeader}>
                      <Text style={styles.itemTime}>
                        {item.start_time} – {item.end_time}
                      </Text>
                      {item.cost ? (
                        <Text style={styles.itemCost}>₹{item.cost}</Text>
                      ) : null}
                    </View>

                    <Text
                      style={[
                        styles.itemTitle,
                        isCompleted && styles.itemTitleCompleted,
                      ]}
                    >
                      {item.title}
                    </Text>

                    {item.description ? (
                      <Text style={styles.itemDescription}>{item.description}</Text>
                    ) : null}
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Budget Breakdown Summary */}
        <View style={styles.budgetSection}>
          <Text style={styles.sectionHeading}>Trip Budget Breakdown</Text>
          <View style={styles.budgetCard}>
            <View style={styles.budgetRow}>
              <Text style={styles.budgetLabel}>Total Allocated</Text>
              <Text style={styles.budgetValue}>₹{trip.total_budget.toLocaleString("en-IN")}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.budgetRow}>
              <Text style={styles.budgetLabel}>Recorded Expenses</Text>
              <Text style={styles.budgetValue}>
                ₹{expenses.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString("en-IN")}
              </Text>
            </View>
          </View>
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
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    fontSize: 13,
    color: theme.colors.foregroundMuted,
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.terracotta,
    marginTop: 8,
  },
  imHereHeaderBtn: {
    backgroundColor: theme.colors.terracotta,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: theme.radius.sm,
  },
  imHereHeaderText: {
    color: theme.colors.parchment,
    fontSize: 11,
    fontWeight: "700",
  },
  banner: {
    backgroundColor: theme.colors.forestDark,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  bannerLeft: {
    gap: 4,
  },
  bannerBadge: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: theme.colors.brass,
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: theme.colors.parchment,
  },
  bannerDates: {
    fontSize: 12,
    color: theme.colors.mist,
  },
  cachedBadge: {
    backgroundColor: theme.colors.terracotta,
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: theme.radius.sm,
  },
  cachedText: {
    color: theme.colors.parchment,
    fontSize: 10,
    fontWeight: "600",
  },
  quickBar: {
    flexDirection: "row",
    gap: 10,
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSubtle,
  },
  quickBarBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: theme.colors.parchment,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
  },
  quickBarImHere: {
    backgroundColor: theme.colors.terracotta,
    borderColor: theme.colors.terracotta,
  },
  quickBarImHereText: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.parchment,
  },
  quickBarBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.forestDark,
  },
  daySelectorScroll: {
    padding: 16,
    gap: 10,
  },
  dayTab: {
    backgroundColor: theme.colors.surface,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
  },
  dayTabActive: {
    backgroundColor: theme.colors.forest,
    borderColor: theme.colors.forest,
  },
  dayTabNumber: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.foreground,
  },
  dayTabNumberActive: {
    color: theme.colors.parchment,
  },
  dayTabDate: {
    fontSize: 10,
    color: theme.colors.foregroundMuted,
    marginTop: 2,
  },
  dayTabDateActive: {
    color: theme.colors.mist,
  },
  timelineSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  timelineHeader: {
    marginBottom: 16,
  },
  timelineTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.colors.primaryDark,
  },
  dayTheme: {
    fontSize: 12,
    color: theme.colors.burntEarth,
    marginTop: 2,
    fontStyle: "italic",
  },
  timelineRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  timelineLeft: {
    width: 32,
    alignItems: "center",
  },
  statusCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: theme.colors.forest,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surface,
  },
  statusCheckCompleted: {
    backgroundColor: theme.colors.forest,
  },
  connectorLine: {
    flex: 1,
    width: 2,
    backgroundColor: theme.colors.border,
    marginTop: 4,
  },
  itemCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 14,
    marginLeft: 8,
  },
  itemCardCompleted: {
    opacity: 0.6,
  },
  itemCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  itemTime: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.forest,
  },
  itemCost: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.terracotta,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.foreground,
    marginBottom: 4,
  },
  itemTitleCompleted: {
    textDecorationLine: "line-through",
  },
  itemDescription: {
    fontSize: 12,
    color: theme.colors.foregroundMuted,
    lineHeight: 18,
  },
  emptyDayContainer: {
    padding: 32,
    alignItems: "center",
  },
  emptyDayText: {
    fontSize: 13,
    color: theme.colors.foregroundSubtle,
    marginTop: 6,
  },
  budgetSection: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: theme.colors.foregroundMuted,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  budgetCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
  },
  budgetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  budgetLabel: {
    fontSize: 13,
    color: theme.colors.foreground,
  },
  budgetValue: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.forestDark,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.borderSubtle,
    marginVertical: 10,
  },
});
