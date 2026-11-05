import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Linking,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Destination, Place, Hotel, RentalOption } from "@vanvas/shared";
import { nativeApi } from "../../src/services/api";
import { PlaceCard } from "../../src/components/PlaceCard";
import { theme } from "../../src/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function DestinationDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();

  const [destination, setDestination] = useState<Destination | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [rentals, setRentals] = useState<RentalOption[]>([]);
  const [activeTab, setActiveTab] = useState<"places" | "stays" | "rentals">("places");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCached, setIsCached] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    if (!slug) return;
    try {
      const res = await nativeApi.getDestinationDetail(slug);
      setDestination(res.data.destination);
      setPlaces(res.data.places || []);
      setHotels(res.data.hotels || []);
      setRentals(res.data.rentals || []);
      setIsCached(res.isCached);
    } catch {
      // offline fallback
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openMapDirections = () => {
    if (!destination?.lat || !destination?.lng) return;
    const url = Platform.select({
      ios: `maps:0,0?q=${encodeURIComponent(destination.name)}@${destination.lat},${destination.lng}`,
      android: `geo:0,0?q=${destination.lat},${destination.lng}(${encodeURIComponent(destination.name)})`,
      default: `https://www.google.com/maps/search/?api=1&query=${destination.lat},${destination.lng}`,
    });
    if (url) Linking.openURL(url);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.forest} />
        <Text style={styles.loadingText}>Opening Sanctuary Archive...</Text>
      </View>
    );
  }

  if (!destination) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={40} color={theme.colors.terracotta} />
        <Text style={styles.errorText}>Destination not found.</Text>
      </View>
    );
  }

  const heroImage =
    destination.hero_image ||
    destination.cover_image ||
    destination.image_url ||
    "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1200&q=80";

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: destination.name,
        }}
      />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Hero Photo Header */}
        <View style={styles.heroWrapper}>
          <Image
            source={{ uri: heroImage }}
            style={styles.heroImage}
            contentFit="cover"
            transition={200}
          />
          <View style={styles.heroOverlay}>
            <View style={styles.heroTop}>
              <View style={styles.stateBadge}>
                <Text style={styles.stateText}>{destination.state}</Text>
              </View>
              {isCached && (
                <View style={styles.cachedBadge}>
                  <Text style={styles.cachedText}>Offline Snapshot</Text>
                </View>
              )}
            </View>

            <View style={styles.heroBottom}>
              <Text style={styles.title}>{destination.name}</Text>
              {destination.tagline ? (
                <Text style={styles.tagline}>{destination.tagline}</Text>
              ) : null}
            </View>
          </View>
        </View>

        {/* Action Row */}
        <View style={styles.actionRow}>
          <TouchableOpacity onPress={openMapDirections} style={styles.actionBtn}>
            <Ionicons name="navigate-outline" size={16} color={theme.colors.forest} />
            <Text style={styles.actionBtnText}>Map & Terrain</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync();
              router.push(`/ask-vanvas?destination=${destination.slug}`);
            }}
            style={[styles.actionBtn, styles.actionBtnCopilot]}
          >
            <Ionicons name="sparkles" size={16} color={theme.colors.brass} />
            <Text style={styles.actionBtnCopilotText}>Ask VANVAS</Text>
          </TouchableOpacity>
        </View>

        {/* Description Overview */}
        {destination.description ? (
          <View style={styles.descriptionCard}>
            <Text style={styles.descriptionText}>{destination.description}</Text>
          </View>
        ) : null}

        {/* Section Segment Tabs */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync();
              setActiveTab("places");
            }}
            style={[styles.tabItem, activeTab === "places" && styles.tabItemActive]}
          >
            <Text style={[styles.tabText, activeTab === "places" && styles.tabTextActive]}>
              Places ({places.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync();
              setActiveTab("stays");
            }}
            style={[styles.tabItem, activeTab === "stays" && styles.tabItemActive]}
          >
            <Text style={[styles.tabText, activeTab === "stays" && styles.tabTextActive]}>
              Stays ({hotels.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync();
              setActiveTab("rentals");
            }}
            style={[styles.tabItem, activeTab === "rentals" && styles.tabItemActive]}
          >
            <Text style={[styles.tabText, activeTab === "rentals" && styles.tabTextActive]}>
              Rentals ({rentals.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {activeTab === "places" && (
            <View>
              {places.map((place) => (
                <PlaceCard key={place.id} place={place} />
              ))}
            </View>
          )}

          {activeTab === "stays" && (
            <View>
              {hotels.map((hotel) => (
                <View key={hotel.id} style={styles.stayCard}>
                  <Text style={styles.stayName}>{hotel.name}</Text>
                  <Text style={styles.stayStyle}>{hotel.style || "Himalayan Homestay"}</Text>
                  <View style={styles.stayFooter}>
                    <Text style={styles.stayPrice}>₹{hotel.price_per_night || 2200} / night</Text>
                    {hotel.rating && (
                      <View style={styles.ratingRow}>
                        <Ionicons name="star" size={13} color="#D97706" />
                        <Text style={styles.ratingText}>{hotel.rating.toFixed(1)}</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}

          {activeTab === "rentals" && (
            <View>
              {rentals.map((rental) => (
                <View key={rental.id} style={styles.rentalCard}>
                  <View style={styles.rentalTop}>
                    <Text style={styles.rentalType}>{rental.vehicle_type}</Text>
                    <Text style={styles.rentalRate}>₹{rental.daily_rate}/day</Text>
                  </View>
                  <Text style={styles.vendorName}>{rental.vendor_name}</Text>
                </View>
              ))}
            </View>
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
  heroWrapper: {
    height: 280,
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10, 16, 13, 0.4)",
    justifyContent: "space-between",
    padding: 18,
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  stateBadge: {
    backgroundColor: theme.colors.forest,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: theme.radius.sm,
  },
  stateText: {
    color: theme.colors.parchment,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },
  cachedBadge: {
    backgroundColor: theme.colors.terracotta,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: theme.radius.sm,
  },
  cachedText: {
    color: theme.colors.parchment,
    fontSize: 10,
    fontWeight: "600",
  },
  heroBottom: {
    gap: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: theme.colors.parchment,
  },
  tagline: {
    fontSize: 13,
    color: theme.colors.mist,
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSubtle,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: theme.colors.surface,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.forestDark,
  },
  actionBtnCopilot: {
    backgroundColor: theme.colors.forestDark,
    borderColor: theme.colors.forestDark,
  },
  actionBtnCopilotText: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.parchment,
  },
  descriptionCard: {
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSubtle,
  },
  descriptionText: {
    fontSize: 13,
    color: theme.colors.foreground,
    lineHeight: 20,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabItemActive: {
    borderBottomColor: theme.colors.forest,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.foregroundMuted,
  },
  tabTextActive: {
    color: theme.colors.forest,
    fontWeight: "700",
  },
  tabContent: {
    padding: 16,
    paddingBottom: 40,
  },
  stayCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 14,
    marginBottom: 10,
  },
  stayName: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.primaryDark,
  },
  stayStyle: {
    fontSize: 12,
    color: theme.colors.foregroundMuted,
    marginTop: 2,
  },
  stayFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  stayPrice: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.terracotta,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.foreground,
  },
  rentalCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 14,
    marginBottom: 10,
  },
  rentalTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rentalType: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.primaryDark,
  },
  rentalRate: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.forest,
  },
  vendorName: {
    fontSize: 12,
    color: theme.colors.foregroundMuted,
    marginTop: 4,
  },
});
