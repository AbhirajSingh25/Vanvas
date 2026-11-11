import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Destination, TripSummary } from "@vanvas/shared";
import { useAuth } from "../../src/context/AuthContext";
import { nativeApi, resolveAvatarUrl } from "../../src/services/api";
import { DestinationCard } from "../../src/components/DestinationCard";
import { theme } from "../../src/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [activeTrip, setActiveTrip] = useState<TripSummary | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isCachedData, setIsCachedData] = useState<boolean>(false);

  const loadHomeData = useCallback(async () => {
    try {
      const destResult = await nativeApi.getDestinations(true);
      setDestinations(destResult.destinations);
      setIsCachedData(destResult.isCached);

      const tripsResult = await nativeApi.getTrips();
      const current = tripsResult.trips.find(
        (t) => t.status === "active" || t.status === "planned"
      );
      setActiveTrip(current || null);
    } catch {
      // safe fallback
    }
  }, []);

  useEffect(() => {
    loadHomeData();
  }, [loadHomeData]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadHomeData();
    setIsRefreshing(false);
  };

  const greeting = user?.full_name
    ? `Welcome back, ${user.full_name.split(" ")[0]}`
    : "The Mountain Awaits";

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor={theme.colors.parchment}
          colors={[theme.colors.forest, theme.colors.terracotta]}
        />
      }
    >
      {/* Brand Header */}
      <View style={styles.heroHeader}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.brandSubtitle}>THE SORTED CLUB</Text>
            <Text style={styles.brandTitle}>VANVAS</Text>
          </View>

          <TouchableOpacity
            onPress={() => router.push("/(tabs)/profile")}
            style={styles.avatarButton}
            accessibilityLabel="Open profile"
          >
            {user?.avatar_url ? (
              <Image
                source={{ uri: resolveAvatarUrl(user.avatar_url) }}
                style={styles.avatarImage}
                contentFit="cover"
              />
            ) : (
              <View style={styles.avatarFallback}>
                <Ionicons name="person" size={16} color={theme.colors.parchment} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.greetingText}>{greeting}</Text>
        <Text style={styles.subGreeting}>
          Slow Indian travel, Himalayan pine ridges, and spontaneous trails.
        </Text>

        <TouchableOpacity
          onPress={() => {
            Haptics.selectionAsync();
            router.push("/nearby");
          }}
          style={styles.radarHeaderPill}
        >
          <View style={styles.radarPillLeft}>
            <Ionicons name="radio" size={16} color={theme.colors.brass} />
            <Text style={styles.radarPillText}>Nearby Radar: Scan trails, POIs & fuel</Text>
          </View>
          <Ionicons name="chevron-forward" size={14} color={theme.colors.brass} />
        </TouchableOpacity>
      </View>

      {/* Active Trip Banner */}
      {activeTrip && (
        <View style={styles.activeTripCard}>
          <View style={styles.activeTripHeader}>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>ACTIVE EXPEDITION</Text>
            </View>
            <Text style={styles.tripDaysText}>{activeTrip.duration_days} Days</Text>
          </View>

          <Text style={styles.activeTripDestination}>
            {activeTrip.destination_name || "Himalayan Ridge"}
          </Text>

          <Text style={styles.activeTripDates}>
            {activeTrip.start_date} – {activeTrip.end_date}
          </Text>

          <View style={styles.activeTripActions}>
            <TouchableOpacity
              onPress={() => {
                Haptics.selectionAsync();
                router.push(`/trip/${activeTrip.id}`);
              }}
              style={styles.primaryActionButton}
            >
              <Ionicons name="map-outline" size={16} color={theme.colors.forestDark} />
              <Text style={styles.primaryActionText}>View Itinerary</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                Haptics.selectionAsync();
                router.push(`/trip/${activeTrip.id}/im-here`);
              }}
              style={styles.secondaryActionButton}
            >
              <Ionicons name="navigate" size={16} color={theme.colors.parchment} />
              <Text style={styles.secondaryActionText}>I&apos;M HERE</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Quick Launch Flows */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionBadge}>TRAVEL MODES</Text>
        <Text style={styles.sectionTitle}>Begin an Expedition</Text>
      </View>

      <View style={styles.quickGrid}>
        <TouchableOpacity
          onPress={() => {
            Haptics.selectionAsync();
            router.push("/(tabs)/plan");
          }}
          style={[styles.quickCard, { backgroundColor: theme.colors.forest }]}
        >
          <Ionicons name="compass" size={26} color={theme.colors.brass} />
          <Text style={styles.quickCardTitle}>Plan My Trip</Text>
          <Text style={styles.quickCardSub}>Full multi-day itinerary</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            Haptics.selectionAsync();
            router.push("/treks");
          }}
          style={[styles.quickCard, { backgroundColor: theme.colors.forestDark }]}
        >
          <Ionicons name="snow-outline" size={26} color={theme.colors.parchment} />
          <Text style={styles.quickCardTitle}>Himalayan Treks</Text>
          <Text style={styles.quickCardSub}>Altitude, route & safety</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            Haptics.selectionAsync();
            router.push("/road-trip");
          }}
          style={[styles.quickCard, { backgroundColor: theme.colors.forestHover }]}
        >
          <Ionicons name="car-sport-outline" size={26} color={theme.colors.terracotta} />
          <Text style={styles.quickCardTitle}>Road Trip</Text>
          <Text style={styles.quickCardSub}>Scenic corridor routes</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            Haptics.selectionAsync();
            router.push("/(tabs)/circles");
          }}
          style={[styles.quickCard, { backgroundColor: "#152F28" }]}
        >
          <Ionicons name="people-outline" size={26} color={theme.colors.brass} />
          <Text style={styles.quickCardTitle}>Crew Circles</Text>
          <Text style={styles.quickCardSub}>Collaborative travel &amp; split</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            Haptics.selectionAsync();
            router.push("/ask-vanvas");
          }}
          style={[styles.quickCard, { backgroundColor: "#11231D" }]}
        >
          <Ionicons name="chatbubbles-outline" size={26} color={theme.colors.brass} />
          <Text style={styles.quickCardTitle}>Ask VANVAS</Text>
          <Text style={styles.quickCardSub}>Contextual AI copilot</Text>
        </TouchableOpacity>
      </View>

      {/* Curated Himalayan Destinations */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <View>
            <Text style={styles.sectionBadge}>VERIFIED SANCTUARIES</Text>
            <Text style={styles.sectionTitle}>Curated Destinations</Text>
          </View>
          <TouchableOpacity onPress={() => router.push("/(tabs)/explore")}>
            <Text style={styles.seeAllText}>Explore All</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalList}
      >
        {destinations.map((dest) => (
          <DestinationCard
            key={dest.id || dest.slug}
            destination={dest}
            onPress={() => {
              Haptics.selectionAsync();
              router.push(`/destination/${dest.slug}`);
            }}
          />
        ))}
      </ScrollView>

      {/* Travel Philosophy Journal Note */}
      <View style={styles.journalCard}>
        <Text style={styles.journalQuote}>
          &ldquo;Travel should feel spontaneous. The planning should not.&rdquo;
        </Text>
        <Text style={styles.journalSign}>— VANVAS Slow Travel Manifesto</Text>
      </View>
    </ScrollView>
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
  heroHeader: {
    backgroundColor: theme.colors.forestDark,
    paddingTop: 54,
    paddingBottom: 28,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  brandSubtitle: {
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: "700",
    color: theme.colors.brass,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 3,
    color: theme.colors.parchment,
  },
  avatarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: theme.colors.brass,
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarFallback: {
    flex: 1,
    backgroundColor: theme.colors.forest,
    alignItems: "center",
    justifyContent: "center",
  },
  greetingText: {
    fontSize: 22,
    fontWeight: "700",
    color: theme.colors.parchment,
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 13,
    color: theme.colors.mist,
    lineHeight: 18,
  },
  radarHeaderPill: {
    marginTop: 14,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: "rgba(197, 160, 89, 0.35)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  radarPillLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  radarPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.parchment,
  },
  activeTripCard: {
    margin: 16,
    padding: 18,
    backgroundColor: theme.colors.forest,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  activeTripHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
  },
  liveText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: "#10B981",
  },
  tripDaysText: {
    fontSize: 12,
    color: theme.colors.brass,
    fontWeight: "600",
  },
  activeTripDestination: {
    fontSize: 22,
    fontWeight: "800",
    color: theme.colors.parchment,
  },
  activeTripDates: {
    fontSize: 12,
    color: theme.colors.mist,
    marginTop: 2,
    marginBottom: 14,
  },
  activeTripActions: {
    flexDirection: "row",
    gap: 10,
  },
  primaryActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: theme.colors.parchment,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
  },
  primaryActionText: {
    color: theme.colors.forestDark,
    fontSize: 13,
    fontWeight: "700",
  },
  secondaryActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: theme.colors.terracotta,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
  },
  secondaryActionText: {
    color: theme.colors.parchment,
    fontSize: 13,
    fontWeight: "700",
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  sectionBadge: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: theme.colors.terracotta,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.colors.primaryDark,
    marginTop: 2,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.forest,
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 10,
  },
  quickCard: {
    width: (SCREEN_WIDTH - 42) / 2,
    padding: 16,
    borderRadius: theme.radius.lg,
    gap: 4,
  },
  quickCardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.parchment,
    marginTop: 8,
  },
  quickCardSub: {
    fontSize: 11,
    color: theme.colors.mist,
  },
  horizontalList: {
    paddingHorizontal: 16,
  },
  journalCard: {
    margin: 20,
    padding: 20,
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radius.lg,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.brass,
  },
  journalQuote: {
    fontSize: 14,
    fontStyle: "italic",
    color: theme.colors.primaryDark,
    lineHeight: 22,
  },
  journalSign: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.burntEarth,
    marginTop: 8,
    textAlign: "right",
  },
});
