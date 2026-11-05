import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { Place } from "@vanvas/shared";
import { theme } from "../theme";

interface PlaceCardProps {
  place: Place;
  onPress?: () => void;
  showMapLink?: boolean;
}

export function PlaceCard({ place, onPress, showMapLink = true }: PlaceCardProps) {
  const openDirections = () => {
    if (!place.lat || !place.lng) return;
    const url = Platform.select({
      ios: `maps:0,0?q=${encodeURIComponent(place.name)}@${place.lat},${place.lng}`,
      android: `geo:0,0?q=${place.lat},${place.lng}(${encodeURIComponent(place.name)})`,
      default: `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`,
    });
    if (url) Linking.openURL(url);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      disabled={!onPress}
      style={styles.container}
    >
      {place.image_url ? (
        <Image
          source={{ uri: place.image_url }}
          style={styles.image}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View style={[styles.image, styles.placeholderImage]}>
          <Ionicons name="image-outline" size={28} color={theme.colors.foregroundSubtle} />
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{place.category || "Sight"}</Text>
          </View>
          {place.rating !== undefined && place.rating > 0 && (
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={12} color="#D97706" />
              <Text style={styles.ratingText}>{place.rating.toFixed(1)}</Text>
            </View>
          )}
        </View>

        <Text style={styles.name} numberOfLines={1}>
          {place.name}
        </Text>

        {place.short_description ? (
          <Text style={styles.description} numberOfLines={2}>
            {place.short_description}
          </Text>
        ) : null}

        <View style={styles.footerRow}>
          {place.estimated_cost !== undefined ? (
            <Text style={styles.costText}>
              {place.estimated_cost === 0 ? "Free Entry" : `₹${place.estimated_cost}`}
            </Text>
          ) : (
            <View />
          )}

          {showMapLink && place.lat && place.lng ? (
            <TouchableOpacity onPress={openDirections} style={styles.directionsBtn}>
              <Ionicons name="navigate-outline" size={12} color={theme.colors.forest} />
              <Text style={styles.directionsText}>Directions</Text>
            </TouchableOpacity>
          ) : null}
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
    marginBottom: 12,
  },
  image: {
    width: "100%",
    height: 140,
  },
  placeholderImage: {
    backgroundColor: theme.colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: 12,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  categoryBadge: {
    backgroundColor: theme.colors.surfaceMuted,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.radius.sm,
  },
  categoryText: {
    fontSize: 11,
    color: theme.colors.forestDark,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.foreground,
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.primaryDark,
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: theme.colors.foregroundMuted,
    lineHeight: 18,
    marginBottom: 8,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  costText: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.terracotta,
  },
  directionsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.parchmentSubtle,
  },
  directionsText: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.forest,
  },
});
