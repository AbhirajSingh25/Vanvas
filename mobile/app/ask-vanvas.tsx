import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { CopilotAction, CopilotPlace } from "@vanvas/shared";
import { nativeApi } from "../src/services/api";
import { PlaceCard } from "../src/components/PlaceCard";
import { theme } from "../src/theme";

interface ChatMessage {
  id: string;
  sender: "user" | "copilot";
  text: string;
  actions?: CopilotAction[];
  places?: CopilotPlace[];
}

export default function AskVanvasScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ destination?: string; trip_id?: string }>();

  const [inputMessage, setInputMessage] = useState<string>("");
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "copilot",
      text: params.destination
        ? `Namaste! I am your VANVAS mountain companion for ${params.destination}. Ask me about sacred trails, local cafes along transit paths, or weather advisories.`
        : "Namaste! I am your VANVAS slow travel companion. Ask me anything about Himalayan trails, dhabas, road corridors, or active trip logistics.",
    },
  ]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isSending) return;

    setInputMessage("");
    const userMsgId = `user_${Date.now()}`;
    const userMsg: ChatMessage = { id: userMsgId, sender: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setIsSending(true);

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const res = await nativeApi.copilotChat({
        message: text,
        conversation_id: conversationId,
        destination_slug: params.destination,
        trip_id: params.trip_id,
      });

      if (res.conversation_id) {
        setConversationId(res.conversation_id);
      }

      const copilotMsg: ChatMessage = {
        id: `copilot_${Date.now()}`,
        sender: "copilot",
        text: res.message,
        actions: res.actions,
        places: res.places,
      };

      setMessages((prev) => [...prev, copilotMsg]);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        sender: "copilot",
        text: "I could not connect to the VANVAS travel intelligence layer right now. Please check your connection or retry in a moment.",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <ScrollView
        style={styles.chatScroll}
        contentContainerStyle={styles.chatContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((msg) => {
          const isUser = msg.sender === "user";
          return (
            <View
              key={msg.id}
              style={[
                styles.bubbleWrapper,
                isUser ? styles.bubbleUserWrapper : styles.bubbleCopilotWrapper,
              ]}
            >
              <View
                style={[
                  styles.bubble,
                  isUser ? styles.bubbleUser : styles.bubbleCopilot,
                ]}
              >
                {!isUser && (
                  <View style={styles.copilotBadge}>
                    <Ionicons name="sparkles" size={12} color={theme.colors.brass} />
                    <Text style={styles.copilotBadgeText}>VANVAS Copilot</Text>
                  </View>
                )}
                <Text
                  style={[
                    styles.bubbleText,
                    isUser ? styles.bubbleUserText : styles.bubbleCopilotText,
                  ]}
                >
                  {msg.text}
                </Text>

                {/* Places recommendations returned from copilot */}
                {msg.places && msg.places.length > 0 && (
                  <View style={styles.placesContainer}>
                    {msg.places.map((p) => (
                      <View key={p.id} style={styles.copilotPlaceCard}>
                        <Text style={styles.copilotPlaceName}>{p.name}</Text>
                        <Text style={styles.copilotPlaceCat}>{p.category}</Text>
                        {p.short_description ? (
                          <Text style={styles.copilotPlaceDesc}>{p.short_description}</Text>
                        ) : null}
                      </View>
                    ))}
                  </View>
                )}

                {/* Action pills */}
                {msg.actions && msg.actions.length > 0 && (
                  <View style={styles.actionsContainer}>
                    {msg.actions.map((act, aIdx) => (
                      <TouchableOpacity
                        key={aIdx}
                        onPress={() => handleSendMessage(act.title)}
                        style={styles.actionPill}
                      >
                        <Text style={styles.actionPillText}>{act.title}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>
          );
        })}

        {isSending && (
          <View style={styles.bubbleCopilotWrapper}>
            <View style={[styles.bubble, styles.bubbleCopilot, { paddingVertical: 12 }]}>
              <ActivityIndicator size="small" color={theme.colors.forest} />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input Row */}
      <View style={styles.inputContainer}>
        <TextInput
          value={inputMessage}
          onChangeText={setInputMessage}
          placeholder="Ask about mountain trails, food, or check-in..."
          placeholderTextColor={theme.colors.foregroundSubtle}
          style={styles.textInput}
          multiline
        />
        <TouchableOpacity
          onPress={() => handleSendMessage()}
          disabled={!inputMessage.trim() || isSending}
          style={[
            styles.sendButton,
            (!inputMessage.trim() || isSending) && styles.sendButtonDisabled,
          ]}
        >
          <Ionicons name="arrow-up" size={18} color={theme.colors.parchment} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  chatScroll: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
    paddingBottom: 24,
    gap: 12,
  },
  bubbleWrapper: {
    flexDirection: "row",
  },
  bubbleUserWrapper: {
    justifyContent: "flex-end",
  },
  bubbleCopilotWrapper: {
    justifyContent: "flex-start",
  },
  bubble: {
    maxWidth: "85%",
    borderRadius: theme.radius.lg,
    padding: 14,
  },
  bubbleUser: {
    backgroundColor: theme.colors.forest,
    borderBottomRightRadius: 4,
  },
  bubbleCopilot: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderBottomLeftRadius: 4,
  },
  copilotBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 6,
  },
  copilotBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: theme.colors.brass,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bubbleUserText: {
    color: theme.colors.parchment,
  },
  bubbleCopilotText: {
    color: theme.colors.foreground,
  },
  placesContainer: {
    marginTop: 10,
    gap: 8,
  },
  copilotPlaceCard: {
    backgroundColor: theme.colors.parchmentSubtle,
    borderRadius: theme.radius.sm,
    padding: 10,
    gap: 2,
  },
  copilotPlaceName: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.primaryDark,
  },
  copilotPlaceCat: {
    fontSize: 11,
    color: theme.colors.forest,
    fontWeight: "600",
  },
  copilotPlaceDesc: {
    fontSize: 11,
    color: theme.colors.foregroundMuted,
    marginTop: 2,
  },
  actionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 10,
  },
  actionPill: {
    backgroundColor: theme.colors.forest,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.radius.full,
  },
  actionPillText: {
    color: theme.colors.parchment,
    fontSize: 12,
    fontWeight: "600",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderSubtle,
    gap: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: theme.colors.parchment,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 14,
    color: theme.colors.foreground,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.forest,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.foregroundSubtle,
  },
});
