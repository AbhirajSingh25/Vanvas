import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { TripSummary } from "@vanvas/shared";
import { nativeApi } from "../../src/services/api";
import { useAuth } from "../../src/context/AuthContext";
import { theme } from "../../src/theme";

export default function TripsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [trips, setTrips] = useState<TripSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isCached, setIsCached] = useState<boolean>(false);

  const loadTrips = useCallback(async () => {
    try {
      const res = await nativeApi.getTrips();
      setTrips(res.trips);
      setIsCached(res.isCached);
    } catch {
      // offline fallback
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadTrips();
  };

  const renderTripCard = ({ item }: { item: TripSummary }) => {
    const isCompleted = item.status === "completed";
    const isActive = item.status === "active";

    return (
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={() => {
          Haptics.selectionAsync();
          router.push(`/trip/${item.id}`);
        }}
        style={styles.tripCard}
      >
        <View style={styles.cardHeader}>
          <View style={styles.statusPill}>
            {isActive && <View style={styles.activeDot} />}
            <Text style={[styles.statusText, isActive && styles.activeStatusText]}>
              {item.status.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.durationBadge}>{item.duration_days} Days</Text>
        </View>

        <Text style={styles.destTitle}>
          {item.destination_name || "Himalayan Expedition"}
        </Text>

        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={13} color={theme.colors.foregroundSubtle} />
          <Text style={styles.dateText}>
            {item.start_date} – {item.end_date}
          </Text>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.travellersInfo}>
            <Ionicons name="people-outline" size={13} color={theme.colors.foregroundSubtle} />
            <Text style={styles.travellersText}>
              {item.travellers_count} Traveller(s) • {item.companion_type || "Solo"}
            </Text>
          </View>

          <View style={styles.budgetBadge}>
            <Text style={styles.budgetText}>₹{item.total_budget.toLocaleString("en-IN")}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.badge}>EXPEDITION LOGBOOK</Text>
        <Text style={styles.title}>My Mountain Trips</Text>
        {isCached && (
          <View style={styles.cachedNotice}>
            <Ionicons name="cloud-offline-outline" size={12} color={theme.colors.terracotta} />
            <Text style={styles.cachedNoticeText}>Viewing offline cached snapshots</Text>
          </View>
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator
          size="large"
          color={theme.colors.forest}
          style={{ marginTop: 40 }}
        />
      ) : trips.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="trail-sign-outline" size={48} color={theme.colors.foregroundSubtle} />
          <Text style={styles.emptyTitle}>No Mountain Expeditions Yet</Text>
          <Text style={styles.emptySubtitle}>
            Plan your first slow slow slow travel journey into the Himalayas or explore curated trails.
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/plan")}
            style={styles.planFirstButton}
          >
            <Ionicons name="compass" size={18} color={theme.colors.parchment} />
            <Text style={styles.planFirstText}>Plan My First Trip</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(item) => item.id}
          renderItem={renderTripCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.forest}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.forestDark,
    paddingTop: 54,
    paddingBottom: 20,
    paddingHorizontal: 20,
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
    marginTop: 2,
  },
  cachedNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  cachedNoticeText: {
    fontSize: 11,
    color: theme.colors.terracotta,
    fontWeight: "600",
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  tripCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: theme.colors.surfaceMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.sm,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
    color: theme.colors.foregroundMuted,
    letterSpacing: 0.8,
  },
  activeStatusText: {
    color: "#059669",
  },
  durationBadge: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.forest,
  },
  destTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.primaryDark,
    marginBottom: 6,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  dateText: {
    fontSize: 12,
    color: theme.colors.foregroundSubtle,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderSubtle,
    paddingTop: 10,
  },
  travellersInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  travellersText: {
    fontSize: 12,
    color: theme.colors.foregroundMuted,
  },
  budgetBadge: {
    backgroundColor: theme.colors.parchmentSubtle,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: theme.radius.sm,
  },
  budgetText: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.forestDark,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.primaryDark,
    marginTop: 14,
  },
  emptySubtitle: {
    fontSize: 13,
    color: theme.colors.foregroundMuted,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
    marginBottom: 20,
  },
  planFirstButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: theme.colors.forest,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: theme.radius.md,
  },
  planFirstText: {
    color: theme.colors.parchment,
    fontSize: 14,
    fontWeight: "700",
  },
});
