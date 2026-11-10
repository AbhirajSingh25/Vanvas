import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "../src/context/AuthContext";
import { ThemeProvider } from "../src/context/ThemeContext";
import { ConnectionBanner } from "../src/components/ConnectionBanner";
import { theme } from "../src/theme";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider>
          <StatusBar style="light" />
          <ConnectionBanner />
          <Stack
            screenOptions={{
              headerStyle: {
                backgroundColor: theme.colors.forestDark,
              },
              headerTintColor: theme.colors.parchment,
              headerTitleStyle: {
                fontWeight: "700",
                fontSize: 18,
              },
              headerBackVisible: true,
              contentStyle: {
                backgroundColor: theme.colors.background,
              },
              animation: "slide_from_right",
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="destination/[slug]"
              options={{
                headerTitle: "Destination",
                headerBackTitle: "Back",
              }}
            />
            <Stack.Screen
              name="trip/[id]"
              options={{
                headerTitle: "Trip Itinerary",
                headerBackTitle: "Trips",
              }}
            />
            <Stack.Screen
              name="trip/[id]/im-here"
              options={{
                headerTitle: "I'M HERE Arrival Mode",
                headerStyle: { backgroundColor: theme.colors.primaryDark },
              }}
            />
            <Stack.Screen
              name="road-trip/index"
              options={{
                headerTitle: "Road Trip Planner",
              }}
            />
            <Stack.Screen
              name="treks/index"
              options={{
                headerTitle: "Himalayan Treks",
              }}
            />
            <Stack.Screen
              name="ask-vanvas"
              options={{
                presentation: "modal",
                headerTitle: "Ask VANVAS AI Copilot",
                headerStyle: { backgroundColor: theme.colors.forestDark },
              }}
            />
            <Stack.Screen
              name="auth/login"
              options={{
                presentation: "modal",
                headerTitle: "Sign In",
              }}
            />
            <Stack.Screen
              name="auth/register"
              options={{
                headerTitle: "Create Account",
              }}
            />
            <Stack.Screen
              name="auth/verify-email"
              options={{
                headerTitle: "Verify Email",
              }}
            />
          </Stack>
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
