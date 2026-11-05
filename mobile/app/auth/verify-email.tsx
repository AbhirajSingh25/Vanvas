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
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useAuth } from "../../src/context/AuthContext";
import { nativeApi } from "../../src/services/api";
import { theme } from "../../src/theme";

export default function VerifyEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const { verifyEmail } = useAuth();

  const [email, setEmail] = useState<string>(params.email || "");
  const [otp, setOtp] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isResending, setIsResending] = useState<boolean>(false);

  const handleVerify = async () => {
    if (!email.trim() || !otp.trim()) {
      Alert.alert("Missing Details", "Please enter your email and 6-digit OTP code.");
      return;
    }

    setIsLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      await verifyEmail(email.trim(), otp.trim());
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Verified", "Your email is confirmed and you are signed in.", [
        { text: "Continue", onPress: () => router.replace("/(tabs)/profile") },
      ]);
    } catch (err: any) {
      Alert.alert("Verification Failed", err.message || "Invalid or expired OTP code.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim()) {
      Alert.alert("Missing Email", "Please enter your email to request a new code.");
      return;
    }

    setIsResending(true);
    try {
      await nativeApi.resendVerification(email.trim());
      Alert.alert("Code Sent", `A new OTP has been dispatched to ${email.trim()}.`);
    } catch (err: any) {
      Alert.alert("Resend Failed", err.message || "Could not resend OTP code.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.badge}>SECURITY GATE</Text>
        <Text style={styles.title}>Confirm Your Email</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit verification code sent to your email to activate your account.
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

        <Text style={styles.label}>6-Digit OTP Code</Text>
        <TextInput
          value={otp}
          onChangeText={setOtp}
          placeholder="123456"
          placeholderTextColor={theme.colors.foregroundSubtle}
          keyboardType="number-pad"
          maxLength={6}
          style={[styles.input, styles.otpInput]}
        />

        <TouchableOpacity
          onPress={handleVerify}
          disabled={isLoading}
          style={[styles.submitButton, isLoading && { opacity: 0.7 }]}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={theme.colors.parchment} />
          ) : (
            <Text style={styles.submitButtonText}>Verify & Sign In</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleResend}
          disabled={isResending}
          style={styles.resendBtn}
        >
          <Text style={styles.resendText}>
            {isResending ? "Sending code..." : "Resend Verification Code"}
          </Text>
        </TouchableOpacity>
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
  otpInput: {
    fontSize: 20,
    letterSpacing: 6,
    textAlign: "center",
    fontWeight: "700",
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
  resendBtn: {
    alignItems: "center",
    marginTop: 16,
  },
  resendText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.forest,
  },
});
