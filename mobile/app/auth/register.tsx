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
import * as Haptics from "expo-haptics";
import { useAuth } from "../../src/context/AuthContext";
import { theme } from "../../src/theme";

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();

  const [fullName, setFullName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleRegister = async () => {
    if (!fullName.trim() || !email.trim() || !password) {
      Alert.alert("Required Fields", "Please fill in all registration fields.");
      return;
    }

    setIsLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const res = await register(email.trim(), password, fullName.trim());
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Verification Email Sent",
        `We sent an OTP verification code to ${email.trim()}. Enter it to activate your account.`,
        [
          {
            text: "Verify Email",
            onPress: () => router.push(`/auth/verify-email?email=${encodeURIComponent(email.trim())}`),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert("Registration Failed", err.message || "Could not create account.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.badge}>NEW EXPLORER</Text>
        <Text style={styles.title}>Join VANVAS</Text>
        <Text style={styles.subtitle}>
          Create an account to curate spontaneous slow trips across Indian mountain sanctuaries.
        </Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          value={fullName}
          onChangeText={setFullName}
          placeholder="Aarav Sharma"
          placeholderTextColor={theme.colors.foregroundSubtle}
          style={styles.input}
        />

        <Text style={styles.label}>Email Address</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="aarav@mountain.in"
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
          onPress={handleRegister}
          disabled={isLoading}
          style={[styles.submitButton, isLoading && { opacity: 0.7 }]}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={theme.colors.parchment} />
          ) : (
            <Text style={styles.submitButtonText}>Create Account</Text>
          )}
        </TouchableOpacity>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Already registered?</Text>
          <TouchableOpacity onPress={() => router.replace("/auth/login")}>
            <Text style={styles.registerLink}>Sign In</Text>
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
