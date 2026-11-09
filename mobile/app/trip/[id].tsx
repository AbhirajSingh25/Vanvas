import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Share,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Trip, ItineraryDay, ItineraryItem, Expense } from "@vanvas/shared";
import { nativeApi } from "../../src/services/api";
import { theme } from "../../src/theme";

const EXPENSE_CATEGORIES = [
  { id: "Food", label: "Food & Chai", icon: "cafe-outline" },
  { id: "Stay", label: "Stay & Camp", icon: "bed-outline" },
  { id: "Fuel", label: "Fuel & Transit", icon: "speedometer-outline" },
  { id: "Permits", label: "Permits & Passes", icon: "document-text-outline" },
  { id: "Rental", label: "Bike / Vehicle", icon: "bicycle-outline" },
  { id: "Misc", label: "Miscellaneous", icon: "receipt-outline" },
];

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(1);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCached, setIsCached] = useState<boolean>(false);

  // Dynamic Replanner State
  const [isReplanModalVisible, setIsReplanModalVisible] = useState<boolean>(false);
  const [isReplanning, setIsReplanning] = useState<boolean>(false);

  // Travel Ledger State
  const [isExpenseModalVisible, setIsExpenseModalVisible] = useState<boolean>(false);
  const [newExpenseTitle, setNewExpenseTitle] = useState<string>("");
  const [newExpenseAmount, setNewExpenseAmount] = useState<string>("");
  const [newExpenseCategory, setNewExpenseCategory] = useState<string>("Food");
  const [newExpenseNote, setNewExpenseNote] = useState<string>("");
  const [isSavingExpense, setIsSavingExpense] = useState<boolean>(false);

  const loadTrip = useCallback(async () => {
    if (!id) return;
    try {
      const res = await nativeApi.getTrip(id);
      setTrip(res.trip);
      setIsCached(res.isCached);

      try {
        const exp = await nativeApi.getExpenses(id);
        setExpenses(exp);
      } catch {
        // expenses may be empty or offline
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to load expedition itinerary.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTrip();
  }, [loadTrip]);

  const handleToggleItemStatus = async (item: ItineraryItem) => {
    if (!trip) return;
    const targetStatus: "pending" | "completed" = item.status === "completed" ? "pending" : "completed";
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Optimistic update
    const prevTrip = { ...trip };
    const updatedDays = trip.itinerary_days.map((day) => ({
      ...day,
      items: day.items.map((it) => (it.id === item.id ? { ...it, status: targetStatus } : it)),
    }));
    setTrip({ ...trip, itinerary_days: updatedDays });

    try {
      await nativeApi.updateItineraryItem(trip.id, item.id, targetStatus as any);
    } catch {
      // Rollback on rejection
      setTrip(prevTrip);
      Alert.alert("Sync Error", "Could not update item status on the server.");
    }
  };

  // Group Circle Native Share
  const handleShareTrip = async () => {
    if (!trip) return;
    await Haptics.selectionAsync();
    try {
      const shareMessage = `Join my Himalayan expedition to ${trip.destination_name} on VANVAS!\nDates: ${trip.start_date} – ${trip.end_date}\nExpedition ID: ${trip.id}\nhttps://vanvasai.vercel.app/trip/${trip.id}`;
      await Share.share({
        title: `VANVAS Expedition: ${trip.destination_name}`,
        message: shareMessage,
      });
    } catch {
      // dismissed
    }
  };

  // Dynamic Replanner Execution
  const handleExecuteReplan = async (actionType: string) => {
    if (!trip) return;
    setIsReplanning(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const result = await nativeApi.replanTrip(trip.id, actionType, selectedDayNumber);
      if (result.trip) {
        setTrip(result.trip);
      } else {
        await loadTrip();
      }
      setIsReplanModalVisible(false);
      Alert.alert("Itinerary Recalibrated", result.message || "Schedule updated according to mountain conditions.");
    } catch (err: any) {
      Alert.alert("Replan Notice", err.message || "Unable to sync replan with server. Check connectivity.");
    } finally {
      setIsReplanning(false);
    }
  };

  // Travel Ledger: Add Expense
  const handleSaveExpense = async () => {
    if (!trip) return;
    const amountNum = parseFloat(newExpenseAmount.trim());
    if (!newExpenseTitle.trim() || isNaN(amountNum) || amountNum <= 0) {
      Alert.alert("Invalid Input", "Please enter a valid description and positive expense amount.");
      return;
    }

    setIsSavingExpense(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const today = new Date().toISOString().split("T")[0];
      const saved = await nativeApi.addExpense(trip.id, {
        title: newExpenseTitle.trim(),
        amount: amountNum,
        category: newExpenseCategory,
        date: today,
        notes: newExpenseNote.trim() || undefined,
      });

      setExpenses((prev) => [saved, ...prev]);
      setNewExpenseTitle("");
      setNewExpenseAmount("");
      setNewExpenseNote("");
      setIsExpenseModalVisible(false);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Could not log expense.");
    } finally {
      setIsSavingExpense(false);
    }
  };

  // Travel Ledger: Delete Expense
  const handleDeleteExpense = async (expenseId: string) => {
    if (!trip) return;
    await Haptics.selectionAsync();

    Alert.alert("Delete Expense", "Remove this expense from your trip ledger?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await nativeApi.deleteExpense(trip.id, expenseId);
            setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
          } catch {
            Alert.alert("Error", "Could not delete expense.");
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.forest} />
        <Text style={styles.loadingText}>Unrolling Itinerary Scrolls...</Text>
      </View>
    );
  }

  if (!trip) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={40} color={theme.colors.terracotta} />
        <Text style={styles.errorText}>Trip not found.</Text>
      </View>
    );
  }

  const selectedDay: ItineraryDay | undefined = trip.itinerary_days?.find(
    (d) => d.day_number === selectedDayNumber
  );

  const totalSpent = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: trip.destination_name || "Expedition",
          headerRight: () => (
            <View style={styles.headerRightActions}>
              <TouchableOpacity onPress={handleShareTrip} style={styles.headerIconBtn} accessibilityLabel="Share Circle">
                <Ionicons name="share-social-outline" size={18} color={theme.colors.parchment} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push(`/trip/${trip.id}/im-here`)}
                style={styles.imHereHeaderBtn}
              >
                <Text style={styles.imHereHeaderText}>I&apos;M HERE</Text>
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Expedition Status Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerLeft}>
            <Text style={styles.bannerBadge}>{trip.status.toUpperCase()}</Text>
            <Text style={styles.bannerTitle}>{trip.destination_name || "Mountain Trail"}</Text>
            <Text style={styles.bannerDates}>
              {trip.start_date} – {trip.end_date} • {trip.origin_city} departure
            </Text>
          </View>
          {isCached && (
            <View style={styles.cachedBadge}>
              <Text style={styles.cachedText}>Cached Snapshot</Text>
            </View>
          )}
        </View>

        {/* Quick Action Hub */}
        <View style={styles.quickBar}>
          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync();
              router.push(`/trip/${trip.id}/im-here`);
            }}
            style={[styles.quickBarBtn, styles.quickBarImHere]}
          >
            <Ionicons name="navigate" size={15} color={theme.colors.parchment} />
            <Text style={styles.quickBarImHereText}>I&apos;M HERE</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync();
              setIsReplanModalVisible(true);
            }}
            style={styles.quickBarBtn}
          >
            <Ionicons name="shuffle-outline" size={15} color={theme.colors.terracotta} />
            <Text style={styles.quickBarBtnText}>Dynamic Replan</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync();
              router.push(`/ask-vanvas?trip_id=${trip.id}`);
            }}
            style={styles.quickBarBtn}
          >
            <Ionicons name="chatbubbles-outline" size={15} color={theme.colors.forest} />
            <Text style={styles.quickBarBtnText}>Copilot</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleShareTrip}
            style={styles.quickBarBtn}
          >
            <Ionicons name="people-outline" size={15} color={theme.colors.brass} />
            <Text style={styles.quickBarBtnText}>Circle</Text>
          </TouchableOpacity>
        </View>

        {/* Day Selector Tabs */}
        {trip.itinerary_days && trip.itinerary_days.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.daySelectorScroll}
          >
            {trip.itinerary_days.map((day) => {
              const active = day.day_number === selectedDayNumber;
              return (
                <TouchableOpacity
                  key={day.day_number}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedDayNumber(day.day_number);
                  }}
                  style={[styles.dayTab, active && styles.dayTabActive]}
                >
                  <Text style={[styles.dayTabNumber, active && styles.dayTabNumberActive]}>
                    Day {day.day_number}
                  </Text>
                  <Text style={[styles.dayTabDate, active && styles.dayTabDateActive]}>
                    {day.date}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* Day Itinerary Timeline */}
        <View style={styles.timelineSection}>
          <View style={styles.timelineHeader}>
            <Text style={styles.timelineTitle}>
              Day {selectedDayNumber} Schedule
            </Text>
            {selectedDay?.theme ? (
              <Text style={styles.dayTheme}>{selectedDay.theme}</Text>
            ) : null}
          </View>

          {(!selectedDay?.items || selectedDay.items.length === 0) ? (
            <View style={styles.emptyDayContainer}>
              <Ionicons name="time-outline" size={32} color={theme.colors.foregroundSubtle} />
              <Text style={styles.emptyDayText}>No scheduled items for this day.</Text>
            </View>
          ) : (
            selectedDay.items.map((item, idx) => {
              const isCompleted = item.status === "completed";
              return (
                <View key={item.id} style={styles.timelineRow}>
                  {/* Left indicator & connector */}
                  <View style={styles.timelineLeft}>
                    <TouchableOpacity
                      onPress={() => handleToggleItemStatus(item)}
                      style={[
                        styles.statusCheck,
                        isCompleted && styles.statusCheckCompleted,
                      ]}
                    >
                      <Ionicons
                        name={isCompleted ? "checkmark" : "ellipse-outline"}
                        size={14}
                        color={isCompleted ? theme.colors.parchment : theme.colors.forest}
                      />
                    </TouchableOpacity>
                    {idx < selectedDay.items.length - 1 && <View style={styles.connectorLine} />}
                  </View>

                  {/* Right Item Card */}
                  <View style={[styles.itemCard, isCompleted && styles.itemCardCompleted]}>
                    <View style={styles.itemCardHeader}>
                      <Text style={styles.itemTime}>
                        {item.start_time} – {item.end_time}
                      </Text>
                      {item.cost ? (
                        <Text style={styles.itemCost}>₹{item.cost}</Text>
                      ) : null}
                    </View>

                    <Text
                      style={[
                        styles.itemTitle,
                        isCompleted && styles.itemTitleCompleted,
                      ]}
                    >
                      {item.title}
                    </Text>

                    {item.description ? (
                      <Text style={styles.itemDescription}>{item.description}</Text>
                    ) : null}
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Travel Ledger: Budget & Expenses Section */}
        <View style={styles.budgetSection}>
          <View style={styles.ledgerHeaderRow}>
            <Text style={styles.sectionHeading}>Travel Ledger</Text>
            <TouchableOpacity
              onPress={() => {
                Haptics.selectionAsync();
                setIsExpenseModalVisible(true);
              }}
              style={styles.addExpenseBtn}
            >
              <Ionicons name="add" size={14} color={theme.colors.parchment} />
              <Text style={styles.addExpenseBtnText}>Log Expense</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.budgetCard}>
            <View style={styles.budgetRow}>
              <Text style={styles.budgetLabel}>Total Allocated</Text>
              <Text style={styles.budgetValue}>₹{trip.total_budget.toLocaleString("en-IN")}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.budgetRow}>
              <Text style={styles.budgetLabel}>Recorded Expenses</Text>
              <Text style={styles.budgetValue}>
                ₹{totalSpent.toLocaleString("en-IN")}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.budgetRow}>
              <Text style={styles.budgetLabel}>Remaining Balance</Text>
              <Text style={[styles.budgetValue, { color: trip.total_budget - totalSpent < 0 ? theme.colors.terracotta : theme.colors.forest }]}>
                ₹{(trip.total_budget - totalSpent).toLocaleString("en-IN")}
              </Text>
            </View>
          </View>

          {/* Logged Expenses List */}
          {expenses.length > 0 && (
            <View style={styles.expenseList}>
              <Text style={styles.expenseListTitle}>Recorded Receipts ({expenses.length})</Text>
              {expenses.map((exp) => (
                <View key={exp.id} style={styles.expenseItem}>
                  <View style={styles.expenseItemLeft}>
                    <View style={styles.expenseCategoryPill}>
                      <Text style={styles.expenseCategoryText}>{exp.category}</Text>
                    </View>
                    <View>
                      <Text style={styles.expenseTitle}>{exp.title}</Text>
                      <Text style={styles.expenseDate}>{exp.date}</Text>
                    </View>
                  </View>
                  <View style={styles.expenseItemRight}>
                    <Text style={styles.expenseAmount}>₹{exp.amount.toLocaleString("en-IN")}</Text>
                    <TouchableOpacity
                      onPress={() => handleDeleteExpense(exp.id)}
                      style={styles.deleteExpenseBtn}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="trash-outline" size={14} color={theme.colors.terracotta} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Dynamic Replanner Modal */}
      <Modal
        visible={isReplanModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsReplanModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalBadge}>DYNAMIC ADAPTATION</Text>
                <Text style={styles.modalTitle}>Recalibrate Day {selectedDayNumber}</Text>
              </View>
              <TouchableOpacity onPress={() => setIsReplanModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.colors.foreground} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              Select mountain or trail conditions to automatically adjust timelines and stops:
            </Text>

            {isReplanning ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color={theme.colors.forest} />
                <Text style={styles.modalLoadingText}>Recalculating trail intervals...</Text>
              </View>
            ) : (
              <View style={styles.replanActions}>
                <TouchableOpacity
                  onPress={() => handleExecuteReplan("delay_1h")}
                  style={styles.replanOption}
                >
                  <Ionicons name="hourglass-outline" size={20} color={theme.colors.forest} />
                  <View style={styles.replanOptionText}>
                    <Text style={styles.replanOptionTitle}>Running 1 Hour Behind</Text>
                    <Text style={styles.replanOptionSub}>Shift remaining afternoon stops by +60 mins</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleExecuteReplan("weather_delay")}
                  style={styles.replanOption}
                >
                  <Ionicons name="rainy-outline" size={20} color={theme.colors.terracotta} />
                  <View style={styles.replanOptionText}>
                    <Text style={styles.replanOptionTitle}>Mountain Rain / Road Block</Text>
                    <Text style={styles.replanOptionSub}>Prioritize covered monasteries, cafes & safety</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleExecuteReplan("rest_break")}
                  style={styles.replanOption}
                >
                  <Ionicons name="pulse-outline" size={20} color={theme.colors.brass} />
                  <View style={styles.replanOptionText}>
                    <Text style={styles.replanOptionTitle}>Altitude Fatigue / Rest Pause</Text>
                    <Text style={styles.replanOptionSub}>Insert 90-min acclimatization tea pause</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleExecuteReplan("skip_current")}
                  style={styles.replanOption}
                >
                  <Ionicons name="play-skip-forward-outline" size={20} color={theme.colors.foregroundMuted} />
                  <View style={styles.replanOptionText}>
                    <Text style={styles.replanOptionTitle}>Skip Next Scheduled Stop</Text>
                    <Text style={styles.replanOptionSub}>Advance timeline directly to following waypoint</Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Add Expense Modal */}
      <Modal
        visible={isExpenseModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsExpenseModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalBadge}>OFFLINE TRAVEL LEDGER</Text>
                <Text style={styles.modalTitle}>Log Expense</Text>
              </View>
              <TouchableOpacity onPress={() => setIsExpenseModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.colors.foreground} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Title or Item</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Chai at Rohtang Pass, Homestay dinner"
                placeholderTextColor={theme.colors.foregroundSubtle}
                value={newExpenseTitle}
                onChangeText={setNewExpenseTitle}
              />

              <Text style={styles.inputLabel}>Amount (₹ INR)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 450"
                placeholderTextColor={theme.colors.foregroundSubtle}
                keyboardType="numeric"
                value={newExpenseAmount}
                onChangeText={setNewExpenseAmount}
              />

              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.categoryGrid}>
                {EXPENSE_CATEGORIES.map((cat) => {
                  const isSelected = newExpenseCategory === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setNewExpenseCategory(cat.id);
                      }}
                      style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                    >
                      <Ionicons
                        name={cat.icon as any}
                        size={14}
                        color={isSelected ? theme.colors.parchment : theme.colors.forest}
                      />
                      <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextActive]}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.inputLabel}>Notes (Optional)</Text>
              <TextInput
                style={[styles.textInput, { height: 60 }]}
                placeholder="Split details or cash note..."
                placeholderTextColor={theme.colors.foregroundSubtle}
                multiline
                value={newExpenseNote}
                onChangeText={setNewExpenseNote}
              />

              <TouchableOpacity
                onPress={handleSaveExpense}
                disabled={isSavingExpense}
                style={styles.saveExpenseBtn}
              >
                {isSavingExpense ? (
                  <ActivityIndicator size="small" color={theme.colors.parchment} />
                ) : (
                  <Text style={styles.saveExpenseBtnText}>Save to Ledger</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    fontSize: 13,
    color: theme.colors.foregroundMuted,
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.terracotta,
    marginTop: 8,
  },
  headerRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerIconBtn: {
    padding: 6,
  },
  imHereHeaderBtn: {
    backgroundColor: theme.colors.terracotta,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: theme.radius.sm,
  },
  imHereHeaderText: {
    color: theme.colors.parchment,
    fontSize: 11,
    fontWeight: "700",
  },
  banner: {
    backgroundColor: theme.colors.forestDark,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  bannerLeft: {
    gap: 4,
  },
  bannerBadge: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: theme.colors.brass,
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: theme.colors.parchment,
  },
  bannerDates: {
    fontSize: 12,
    color: theme.colors.mist,
  },
  cachedBadge: {
    backgroundColor: theme.colors.terracotta,
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: theme.radius.sm,
  },
  cachedText: {
    color: theme.colors.parchment,
    fontSize: 10,
    fontWeight: "600",
  },
  quickBar: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSubtle,
  },
  quickBarBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: theme.colors.parchment,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 8,
    borderRadius: theme.radius.sm,
  },
  quickBarImHere: {
    backgroundColor: theme.colors.terracotta,
    borderColor: theme.colors.terracotta,
  },
  quickBarImHereText: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.parchment,
  },
  quickBarBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.forestDark,
  },
  daySelectorScroll: {
    padding: 16,
    gap: 10,
  },
  dayTab: {
    backgroundColor: theme.colors.surface,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
  },
  dayTabActive: {
    backgroundColor: theme.colors.forest,
    borderColor: theme.colors.forest,
  },
  dayTabNumber: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.foreground,
  },
  dayTabNumberActive: {
    color: theme.colors.parchment,
  },
  dayTabDate: {
    fontSize: 10,
    color: theme.colors.foregroundMuted,
    marginTop: 2,
  },
  dayTabDateActive: {
    color: theme.colors.mist,
  },
  timelineSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  timelineHeader: {
    marginBottom: 16,
  },
  timelineTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.colors.primaryDark,
  },
  dayTheme: {
    fontSize: 12,
    color: theme.colors.burntEarth,
    marginTop: 2,
    fontStyle: "italic",
  },
  timelineRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  timelineLeft: {
    width: 32,
    alignItems: "center",
  },
  statusCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: theme.colors.forest,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.surface,
  },
  statusCheckCompleted: {
    backgroundColor: theme.colors.forest,
  },
  connectorLine: {
    flex: 1,
    width: 2,
    backgroundColor: theme.colors.border,
    marginTop: 4,
  },
  itemCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 14,
    marginLeft: 8,
  },
  itemCardCompleted: {
    opacity: 0.6,
  },
  itemCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  itemTime: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.forest,
  },
  itemCost: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.terracotta,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.foreground,
    marginBottom: 4,
  },
  itemTitleCompleted: {
    textDecorationLine: "line-through",
  },
  itemDescription: {
    fontSize: 12,
    color: theme.colors.foregroundMuted,
    lineHeight: 18,
  },
  emptyDayContainer: {
    padding: 32,
    alignItems: "center",
  },
  emptyDayText: {
    fontSize: 13,
    color: theme.colors.foregroundSubtle,
    marginTop: 6,
  },
  budgetSection: {
    padding: 16,
    paddingBottom: 40,
  },
  ledgerHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: theme.colors.foregroundMuted,
    textTransform: "uppercase",
  },
  addExpenseBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: theme.colors.forest,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: theme.radius.sm,
  },
  addExpenseBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.parchment,
  },
  budgetCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
  },
  budgetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  budgetLabel: {
    fontSize: 13,
    color: theme.colors.foreground,
  },
  budgetValue: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.forestDark,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.borderSubtle,
    marginVertical: 10,
  },
  expenseList: {
    marginTop: 16,
    gap: 8,
  },
  expenseListTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.foregroundMuted,
    marginBottom: 4,
  },
  expenseItem: {
    backgroundColor: theme.colors.surface,
    padding: 12,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  expenseItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  expenseCategoryPill: {
    backgroundColor: "rgba(23, 53, 44, 0.08)",
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: theme.radius.sm,
  },
  expenseCategoryText: {
    fontSize: 10,
    fontWeight: "700",
    color: theme.colors.forest,
  },
  expenseTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.foreground,
  },
  expenseDate: {
    fontSize: 10,
    color: theme.colors.foregroundSubtle,
  },
  expenseItemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  expenseAmount: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.forestDark,
  },
  deleteExpenseBtn: {
    padding: 4,
  },
  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    padding: 20,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  modalBadge: {
    fontSize: 9,
    fontWeight: "700",
    color: theme.colors.brass,
    letterSpacing: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.colors.foreground,
    marginTop: 2,
  },
  modalSub: {
    fontSize: 12,
    color: theme.colors.foregroundMuted,
    marginBottom: 16,
    lineHeight: 17,
  },
  modalLoading: {
    padding: 40,
    alignItems: "center",
    gap: 10,
  },
  modalLoadingText: {
    fontSize: 12,
    color: theme.colors.foregroundMuted,
  },
  replanActions: {
    gap: 10,
    paddingBottom: 20,
  },
  replanOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: theme.colors.background,
    padding: 14,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  replanOptionText: {
    flex: 1,
  },
  replanOptionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.foreground,
  },
  replanOptionSub: {
    fontSize: 11,
    color: theme.colors.foregroundMuted,
    marginTop: 2,
  },
  // Add Expense Form
  inputLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.foregroundMuted,
    textTransform: "uppercase",
    marginTop: 10,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    padding: 10,
    fontSize: 13,
    color: theme.colors.foreground,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  categoryChipActive: {
    backgroundColor: theme.colors.forest,
    borderColor: theme.colors.forest,
  },
  categoryChipText: {
    fontSize: 11,
    fontWeight: "600",
    color: theme.colors.foreground,
  },
  categoryChipTextActive: {
    color: theme.colors.parchment,
  },
  saveExpenseBtn: {
    backgroundColor: theme.colors.forest,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  saveExpenseBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.parchment,
  },
});
