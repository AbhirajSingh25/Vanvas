import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAuth } from "../../src/context/AuthContext";
import { theme } from "../../src/theme";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Required Fields", "Please enter your email and password.");
      return;
    }

    setIsLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      await login(email.trim(), password);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err: any) {
      Alert.alert("Sign In Failed", err.message || "Invalid email or password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.badge}>VANVAS ACCOUNT</Text>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>
          Sign in to access your saved trips, offline mountain caches, and profile preferences.
        </Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Email Address</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="traveller@thesortedclub.com"
          placeholderTextColor={theme.colors.foregroundSubtle}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          placeholderTextColor={theme.colors.foregroundSubtle}
          secureTextEntry
          style={styles.input}
        />

        <TouchableOpacity
          onPress={handleLogin}
          disabled={isLoading}
          style={[styles.submitButton, isLoading && { opacity: 0.7 }]}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={theme.colors.parchment} />
          ) : (
            <Text style={styles.submitButtonText}>Sign In to VANVAS</Text>
          )}
        </TouchableOpacity>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>New to VANVAS?</Text>
          <TouchableOpacity onPress={() => router.replace("/auth/register")}>
            <Text style={styles.registerLink}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: 24,
    paddingTop: 32,
    backgroundColor: theme.colors.forestDark,
    gap: 4,
  },
  badge: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    color: theme.colors.brass,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: theme.colors.parchment,
  },
  subtitle: {
    fontSize: 13,
    color: theme.colors.mist,
    lineHeight: 18,
    marginTop: 2,
  },
  form: {
    padding: 24,
    gap: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.foreground,
    marginTop: 4,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: theme.colors.foreground,
  },
  submitButton: {
    backgroundColor: theme.colors.forest,
    paddingVertical: 14,
    borderRadius: theme.radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  submitButtonText: {
    color: theme.colors.parchment,
    fontSize: 14,
    fontWeight: "700",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 20,
  },
  footerText: {
    fontSize: 13,
    color: theme.colors.foregroundMuted,
  },
  registerLink: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.terracotta,
  },
});
