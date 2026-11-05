import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { Destination } from "@vanvas/shared";
import { theme } from "../theme";

interface DestinationCardProps {
  destination: Destination;
  onPress: () => void;
  width?: number;
}

export function DestinationCard({ destination, onPress, width = 240 }: DestinationCardProps) {
  const imageUrl =
    destination.hero_image ||
    destination.cover_image ||
    destination.image_url ||
    "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=800&q=80";

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[styles.container, { width }]}
    >
      <Image
        source={{ uri: imageUrl }}
        style={styles.image}
        contentFit="cover"
        transition={200}
      />
      <View style={styles.overlay}>
        <View style={styles.topBadge}>
          <Text style={styles.stateText}>{destination.state}</Text>
          {destination.badge ? (
            <View style={styles.curatedPill}>
              <Text style={styles.curatedText}>{destination.badge}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.bottomMeta}>
          <Text style={styles.name} numberOfLines={1}>
            {destination.name}
          </Text>
          {destination.tagline ? (
            <Text style={styles.tagline} numberOfLines={1}>
              {destination.tagline}
            </Text>
          ) : null}

          <View style={styles.statsRow}>
            {destination.ideal_duration_days ? (
              <View style={styles.statItem}>
                <Ionicons name="time-outline" size={12} color={theme.colors.parchment} />
                <Text style={styles.statText}>{destination.ideal_duration_days} Days</Text>
              </View>
            ) : null}
            {destination.places_count ? (
              <View style={styles.statItem}>
                <Ionicons name="location-outline" size={12} color={theme.colors.parchment} />
                <Text style={styles.statText}>{destination.places_count} Sights</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 300,
    borderRadius: theme.radius.xl,
    overflow: "hidden",
    backgroundColor: theme.colors.forestDark,
    marginRight: 14,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10, 16, 13, 0.42)",
    justifyContent: "space-between",
    padding: 14,
  },
  topBadge: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stateText: {
    color: theme.colors.parchment,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    backgroundColor: "rgba(23, 59, 50, 0.85)",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: theme.radius.sm,
  },
  curatedPill: {
    backgroundColor: theme.colors.brass,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: theme.radius.sm,
  },
  curatedText: {
    color: theme.colors.forestDark,
    fontSize: 10,
    fontWeight: "700",
  },
  bottomMeta: {
    gap: 4,
  },
  name: {
    color: theme.colors.parchment,
    fontSize: 20,
    fontWeight: "700",
  },
  tagline: {
    color: theme.colors.mist,
    fontSize: 12,
    lineHeight: 16,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 6,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    color: theme.colors.parchment,
    fontSize: 11,
    fontWeight: "500",
  },
});
