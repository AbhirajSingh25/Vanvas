import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { setApiStatusListener } from "../services/api";
import { theme } from "../theme";
import { Ionicons } from "@expo/vector-icons";

export function ConnectionBanner() {
  const [isWakingUp, setIsWakingUp] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(false);

  useEffect(() => {
    setApiStatusListener((waking, offline) => {
      setIsWakingUp(waking);
      setIsOffline(offline);
    });
    return () => setApiStatusListener(null);
  }, []);

  if (!isWakingUp && !isOffline) return null;

  return (
    <View
      style={[
        styles.banner,
        isWakingUp ? styles.wakingBanner : styles.offlineBanner,
      ]}
    >
      <Ionicons
        name={isWakingUp ? "cloud-outline" : "cloud-offline-outline"}
        size={14}
        color={theme.colors.parchment}
        style={styles.icon}
      />
      <Text style={styles.text}>
        {isWakingUp
          ? "VANVAS mountain servers are waking up... displaying offline cache"
          : "Offline mode active — showing cached mountain trails"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  wakingBanner: {
    backgroundColor: theme.colors.forestHover,
  },
  offlineBanner: {
    backgroundColor: theme.colors.terracotta,
  },
  icon: {
    marginRight: 6,
  },
  text: {
    color: theme.colors.parchment,
    fontSize: 12,
    fontWeight: "500",
  },
});
