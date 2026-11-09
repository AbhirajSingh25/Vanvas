import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Destination, DestinationReel } from "@vanvas/shared";
import { nativeApi } from "../../src/services/api";
import { DestinationCard } from "../../src/components/DestinationCard";
import { ReelsCarousel } from "../../src/components/ReelsCarousel";
import { theme } from "../../src/theme";

const REGION_FILTERS = ["All", "Himachal", "Uttarakhand", "Rajasthan", "Goa"];

// Verified field reels from repository
const FEATURED_FIELD_REELS: DestinationReel[] = [
  {
    id: "manali-hadimba-forest",
    destinationSlug: "manali",
    destinationName: "Manali",
    title: "Hadimba Cedar Pagoda & Old Village",
    subtitle: "Ancient 1553 pagoda nestled in 400-year-old deodar forests.",
    videoUrl: "https://vanvas-api.onrender.com/static/videos/reels/manali_hadimba_loop.mp4",
    posterUrl: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=600&q=80",
    creator: "VANVAS Himalayan Field Unit",
    durationLabel: "0:42",
    experienceType: "Trail Trek",
    waypoints: [{ placeName: "Hadimba Temple", category: "Sacred" }],
  },
  {
    id: "dharamshala-triund",
    destinationSlug: "dharamshala",
    destinationName: "Dharamshala",
    title: "Triund Granite Ridge Ascent",
    subtitle: "Through rhododendron woods to the open Dhauladhar granite wall.",
    videoUrl: "https://vanvas-api.onrender.com/static/videos/reels/dharamshala_triund_trek.mp4",
    posterUrl: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=600&q=80",
    creator: "VANVAS Field Unit",
    durationLabel: "0:38",
    experienceType: "Alpine Ridge",
    waypoints: [{ placeName: "Triund", category: "Trek" }],
  },
  {
    id: "rishikesh-beatles",
    destinationSlug: "rishikesh",
    destinationName: "Rishikesh",
    title: "Beatles Ashram & Ganges Sunrise",
    subtitle: "Historic meditation caves nestled above the rushing Ganges.",
    videoUrl: "https://vanvas-api.onrender.com/static/videos/reels/rishikesh_beatles_ashram.mp4",
    posterUrl: "https://images.unsplash.com/photo-1588083949404-c4f1ed1323b3?auto=format&fit=crop&w=600&q=80",
    creator: "VANVAS Uttarakhand Unit",
    durationLabel: "0:50",
    experienceType: "Spiritual Walk",
    waypoints: [{ placeName: "Beatles Ashram", category: "Heritage" }],
  },
];

export default function ExploreScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedFilter, setSelectedFilter] = useState<string>("All");
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchDestinations = useCallback(async () => {
    try {
      if (searchQuery.trim().length > 1) {
        const results = await nativeApi.searchDestinations(searchQuery);
        setDestinations(results);
      } else {
        const res = await nativeApi.getDestinations(false);
        setDestinations(res.destinations);
      }
    } catch {
      // safe offline fallback
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchDestinations();
  }, [fetchDestinations]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await fetchDestinations();
  };

  const filteredDestinations = destinations.filter((d) => {
    if (selectedFilter === "All") return true;
    return d.state.toLowerCase().includes(selectedFilter.toLowerCase());
  });

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Explore Sanctuaries</Text>
        <Text style={styles.subtitle}>
          Curated mountain trails, sacred confluences, and slow destinations.
        </Text>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={theme.colors.foregroundSubtle} />
          <TextInput
            placeholder="Search Manali, Rishikesh, Chopta, Kasol..."
            placeholderTextColor={theme.colors.foregroundSubtle}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color={theme.colors.foregroundSubtle} />
            </TouchableOpacity>
          )}
        </View>

        {/* Region Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {REGION_FILTERS.map((filter) => {
            const isSelected = selectedFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedFilter(filter);
                }}
                style={[styles.filterPill, isSelected && styles.filterPillActive]}
              >
                <Text
                  style={[styles.filterText, isSelected && styles.filterTextActive]}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.forest}
          />
        }
      >
        {/* Field Reels Discovery (Authentic Cinema) */}
        {!searchQuery && (
          <ReelsCarousel reels={FEATURED_FIELD_REELS} isScreenFocused={isFocused} />
        )}

        {/* Destinations Grid / List */}
        <View style={styles.destinationsSection}>
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsCount}>
              {filteredDestinations.length} Sanctuaries Found
            </Text>
          </View>

          {isLoading ? (
            <ActivityIndicator
              size="large"
              color={theme.colors.forest}
              style={{ marginTop: 32 }}
            />
          ) : filteredDestinations.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="compass-outline" size={36} color={theme.colors.foregroundSubtle} />
              <Text style={styles.emptyTitle}>No Destinations Found</Text>
              <Text style={styles.emptySubtitle}>
                Try adjusting your search query or explore one of our canonical Himalayan sanctuaries.
              </Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {filteredDestinations.map((dest) => (
                <View key={dest.id || dest.slug} style={styles.gridItem}>
                  <DestinationCard
                    destination={dest}
                    width={170}
                    onPress={() => {
                      Haptics.selectionAsync();
                      router.push(`/destination/${dest.slug}`);
                    }}
                  />
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
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
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: theme.colors.parchment,
  },
  subtitle: {
    fontSize: 12,
    color: theme.colors.mist,
    marginTop: 2,
    marginBottom: 14,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.parchment,
    borderRadius: theme.radius.md,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.foreground,
  },
  filterScroll: {
    marginTop: 12,
    gap: 8,
  },
  filterPill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: theme.radius.full,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    marginRight: 6,
  },
  filterPillActive: {
    backgroundColor: theme.colors.brass,
  },
  filterText: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.parchment,
  },
  filterTextActive: {
    color: theme.colors.forestDark,
    fontWeight: "700",
  },
  scrollContent: {
    paddingBottom: 40,
  },
  destinationsSection: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  resultsHeader: {
    marginBottom: 12,
  },
  resultsCount: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.foregroundMuted,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  gridItem: {
    marginBottom: 4,
  },
  emptyContainer: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.primaryDark,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: theme.colors.foregroundMuted,
    textAlign: "center",
    marginTop: 4,
    lineHeight: 18,
  },
});
