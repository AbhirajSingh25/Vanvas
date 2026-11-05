import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Place } from "@vanvas/shared";
import { resolveImageUrl } from "../services/api";
import { theme } from "../theme";

interface PlaceCardProps {
  place: Place;
  onPress?: () => void;
  onPlan?: (place: Place) => void;
  showMapLink?: boolean;
}

export function PlaceCard({ place, onPress, onPlan, showMapLink = true }: PlaceCardProps) {
  const openDirections = () => {
    if (!place.lat || !place.lng) return;
    Haptics.selectionAsync();
    const url = Platform.select({
      ios: `maps:0,0?q=${encodeURIComponent(place.name)}@${place.lat},${place.lng}`,
      android: `geo:0,0?q=${place.lat},${place.lng}(${encodeURIComponent(place.name)})`,
      default: `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`,
    });
    if (url) Linking.openURL(url);
  };

  const handlePlanPress = () => {
    if (!onPlan) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPlan(place);
  };

  const imageUrl = resolveImageUrl(place.image_url);

  // Compute distance & geographic cluster badge
  let zoneLabel: string | null = null;
  const rawCluster = (place as any).cluster || (place as any).zone;
  if (typeof rawCluster === "string" && rawCluster.trim()) {
    zoneLabel = rawCluster;
  } else if (typeof place.distance_km === "number") {
    if (place.distance_km <= 5) {
      zoneLabel = `Immediate Town • ${place.distance_km} km`;
    } else if (place.distance_km <= 25) {
      zoneLabel = `Nearby Circuit • ${place.distance_km} km`;
    } else {
      zoneLabel = `Regional Trip • ${place.distance_km} km`;
    }
  }

  // Provenance classification
  const isLive = place.is_live || place.source === "google_places" || place.source === "openstreetmap";
  const isPhoto = !isLive && place.image_url && (place.image_url.includes("/places/") || place.image_url.includes("images.unsplash.com") || place.image_url.startsWith("http"));
  const provenanceBadge = isLive ? "Live POI" : isPhoto ? "Verified Photo" : "Editorial Art";

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      disabled={!onPress}
      style={styles.container}
    >
      <View style={styles.imageContainer}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={[styles.image, styles.placeholderImage]}>
            <Ionicons name="compass-outline" size={32} color={theme.colors.foregroundSubtle} />
          </View>
        )}

        {/* Top Badges */}
        <View style={styles.imageBadgeOverlay}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{place.category || "Sight"}</Text>
          </View>

          <View style={[
            styles.provenanceBadge,
            isLive ? styles.provenanceLive : isPhoto ? styles.provenancePhoto : styles.provenanceArt
          ]}>
            <Text style={[
              styles.provenanceText,
              isLive ? styles.provenanceTextLive : isPhoto ? styles.provenanceTextPhoto : styles.provenanceTextArt
            ]}>
              {provenanceBadge}
            </Text>
          </View>
        </View>

        {/* Distance / Zone Pill */}
        {zoneLabel && (
          <View style={styles.zonePill}>
            <Ionicons name="location-sharp" size={10} color={theme.colors.brass} />
            <Text style={styles.zonePillText}>{zoneLabel}</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.name} numberOfLines={1}>
            {place.name}
          </Text>
          {place.rating !== undefined && place.rating > 0 ? (
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={12} color="#D97706" />
              <Text style={styles.ratingText}>{place.rating.toFixed(1)}</Text>
            </View>
          ) : null}
        </View>

        {place.short_description ? (
          <Text style={styles.description} numberOfLines={2}>
            {place.short_description}
          </Text>
        ) : null}

        {place.why_vanvas_recommends ? (
          <View style={styles.vanvasNoteBox}>
            <Ionicons name="sparkles" size={11} color={theme.colors.brass} style={{ marginTop: 1 }} />
            <Text style={styles.vanvasNoteText} numberOfLines={2}>
              {place.why_vanvas_recommends}
            </Text>
          </View>
        ) : null}

        <View style={styles.footerRow}>
          <View style={styles.costAndHours}>
            {place.estimated_cost !== undefined ? (
              <Text style={styles.costText}>
                {place.estimated_cost === 0 ? "Free Entry" : `₹${place.estimated_cost}`}
              </Text>
            ) : null}
            {place.opening_time ? (
              <Text style={styles.hoursText}>
                {place.opening_time} {place.closing_time ? `- ${place.closing_time}` : ""}
              </Text>
            ) : null}
          </View>

          <View style={styles.actionButtons}>
            {showMapLink && place.lat && place.lng ? (
              <TouchableOpacity onPress={openDirections} style={styles.directionsBtn}>
                <Ionicons name="navigate-outline" size={13} color={theme.colors.forest} />
                <Text style={styles.directionsText}>Map</Text>
              </TouchableOpacity>
            ) : null}

            {onPlan ? (
              <TouchableOpacity onPress={handlePlanPress} style={styles.planBtn}>
                <Ionicons name="add-circle-outline" size={13} color={theme.colors.parchment} />
                <Text style={styles.planBtnText}>Plan</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: "hidden",
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: 155,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    backgroundColor: theme.colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  imageBadgeOverlay: {
    position: "absolute",
    top: 8,
    left: 8,
    right: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryBadge: {
    backgroundColor: "rgba(15, 41, 36, 0.85)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  categoryBadgeText: {
    fontSize: 10,
    color: theme.colors.parchment,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  provenanceBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
  },
  provenancePhoto: {
    backgroundColor: "rgba(16, 85, 59, 0.9)",
    borderColor: "rgba(52, 211, 153, 0.6)",
  },
  provenanceTextPhoto: {
    color: "#D1FAE5",
  },
  provenanceArt: {
    backgroundColor: "rgba(180, 146, 82, 0.9)",
    borderColor: "rgba(180, 146, 82, 0.5)",
  },
  provenanceTextArt: {
    color: "#0F2924",
  },
  provenanceLive: {
    backgroundColor: "rgba(20, 83, 100, 0.9)",
    borderColor: "rgba(56, 189, 248, 0.6)",
  },
  provenanceTextLive: {
    color: "#E0F2FE",
  },
  provenanceText: {
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  zonePill: {
    position: "absolute",
    bottom: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(15, 41, 36, 0.85)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  zonePillText: {
    fontSize: 10,
    fontWeight: "700",
    color: theme.colors.parchment,
    letterSpacing: 0.3,
  },
  content: {
    padding: 12,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.primaryDark,
    marginRight: 8,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: theme.colors.parchmentSubtle,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.radius.sm,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.foreground,
  },
  description: {
    fontSize: 12,
    color: theme.colors.foregroundMuted,
    lineHeight: 17,
    marginBottom: 6,
  },
  vanvasNoteBox: {
    flexDirection: "row",
    gap: 5,
    backgroundColor: theme.colors.parchmentSubtle,
    padding: 8,
    borderRadius: theme.radius.sm,
    borderLeftWidth: 2,
    borderLeftColor: theme.colors.brass,
    marginBottom: 8,
  },
  vanvasNoteText: {
    flex: 1,
    fontSize: 11,
    fontStyle: "italic",
    color: theme.colors.foreground,
    lineHeight: 15,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderSubtle,
  },
  costAndHours: {
    flexDirection: "column",
  },
  costText: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.terracotta,
  },
  hoursText: {
    fontSize: 10,
    color: theme.colors.foregroundSubtle,
    marginTop: 1,
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  directionsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.parchmentSubtle,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  directionsText: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.forest,
  },
  planBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.forest,
  },
  planBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.parchment,
  },
});
