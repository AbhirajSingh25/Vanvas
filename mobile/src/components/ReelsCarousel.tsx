import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  ViewToken,
  TouchableOpacity,
  AccessibilityInfo,
  Platform,
  AppState,
} from "react-native";
import { Video, ResizeMode, AVPlaybackStatus } from "expo-av";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { DestinationReel } from "@vanvas/shared";
import { theme } from "../theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH * 0.72;
const CARD_HEIGHT = CARD_WIDTH * 1.5;
const SPACING = 14;

interface ReelsCarouselProps {
  reels: DestinationReel[];
  isScreenFocused?: boolean;
}

export function ReelsCarousel({ reels, isScreenFocused = true }: ReelsCarouselProps) {
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [reduceMotion, setReduceMotion] = useState<boolean>(false);
  const [isAppActive, setIsAppActive] = useState<boolean>(true);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState) => {
      setIsAppActive(nextState === "active");
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => sub?.remove();
  }, []);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setFocusedIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 70,
  }).current;

  if (!reels || reels.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="videocam-outline" size={32} color={theme.colors.foregroundSubtle} />
        <Text style={styles.emptyTitle}>No Field Reels Yet</Text>
        <Text style={styles.emptySubtitle}>
          Authentic, verified field videos for this destination are currently being captured by the VANVAS field unit.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.sectionBadge}>Slow Travel Cinema</Text>
          <Text style={styles.sectionTitle}>Field Reels & Discovery</Text>
        </View>
        <TouchableOpacity
          onPress={() => setIsMuted((prev) => !prev)}
          style={styles.soundButton}
          accessibilityLabel={isMuted ? "Unmute audio" : "Mute audio"}
        >
          <Ionicons
            name={isMuted ? "volume-mute-outline" : "volume-high-outline"}
            size={18}
            color={theme.colors.parchment}
          />
        </TouchableOpacity>
      </View>

      <FlatList
        data={reels}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + SPACING}
        decelerationRate="fast"
        contentContainerStyle={styles.listContent}
        keyExtractor={(item) => item.id}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        renderItem={({ item, index }) => {
          const isFocused = isScreenFocused && isAppActive && focusedIndex === index;
          return (
            <View style={[styles.card, { marginRight: SPACING }]}>
              {/* If reduceMotion is on or not focused, show high-res poster only */}
              {isFocused && !reduceMotion ? (
                <Video
                  source={{ uri: item.videoUrl }}
                  style={styles.media}
                  resizeMode={ResizeMode.COVER}
                  shouldPlay={true}
                  isLooping
                  isMuted={isMuted}
                  posterSource={{ uri: item.posterUrl }}
                  usePoster={true}
                />
              ) : (
                <Image
                  source={{ uri: item.posterUrl }}
                  style={styles.media}
                  contentFit="cover"
                  transition={200}
                />
              )}

              {/* Gradient Overlay & Metadata */}
              <View style={styles.overlay}>
                <View style={styles.badgeRow}>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeText}>{item.experienceType}</Text>
                  </View>
                  <Text style={styles.durationText}>{item.durationLabel}</Text>
                </View>

                <View style={styles.metaContainer}>
                  <Text style={styles.reelTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={styles.reelSubtitle} numberOfLines={2}>
                    {item.subtitle}
                  </Text>
                  <View style={styles.creatorRow}>
                    <Ionicons name="shield-checkmark" size={13} color={theme.colors.brass} />
                    <Text style={styles.creatorText}>{item.creator}</Text>
                  </View>
                </View>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 18,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionBadge: {
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: theme.colors.brass,
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.primaryDark,
    marginTop: 2,
  },
  soundButton: {
    backgroundColor: theme.colors.forest,
    padding: 8,
    borderRadius: theme.radius.full,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: theme.radius.lg,
    overflow: "hidden",
    backgroundColor: theme.colors.forestDark,
  },
  media: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10, 16, 13, 0.4)",
    justifyContent: "space-between",
    padding: 14,
  },
  badgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  typeBadge: {
    backgroundColor: "rgba(23, 59, 50, 0.85)",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: theme.radius.sm,
  },
  typeText: {
    color: theme.colors.parchment,
    fontSize: 10,
    fontWeight: "600",
  },
  durationText: {
    color: theme.colors.parchment,
    fontSize: 11,
    fontWeight: "500",
  },
  metaContainer: {
    gap: 4,
  },
  reelTitle: {
    color: theme.colors.parchment,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 20,
  },
  reelSubtitle: {
    color: theme.colors.mist,
    fontSize: 12,
    lineHeight: 16,
  },
  creatorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  creatorText: {
    color: theme.colors.brass,
    fontSize: 11,
    fontWeight: "600",
  },
  emptyContainer: {
    margin: 16,
    padding: 24,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
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
