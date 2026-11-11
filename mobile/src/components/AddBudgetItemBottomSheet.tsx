import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { theme } from "../theme";

export interface BudgetItemMember {
  user_id: string;
  full_name: string;
}

export interface SplitPodOption {
  id: string;
  name: string;
  member_user_ids?: string[];
}

export type CalculationBasis = "FIXED" | "PER_PERSON" | "QTY_UNIT";
export type SplitScope = "EVERYONE" | "SELECTED" | "SPLIT_POD" | "PERSONAL";
export type SplitMethod = "EQUAL" | "EXACT" | "PERCENTAGE" | "SHARES" | "ITEMIZED";

export interface AddBudgetItemPayload {
  title: string;
  category: string;
  calculation_basis: CalculationBasis;
  unit_price: number;
  quantity: number;
  amount: number;
  split_scope: SplitScope;
  split_pod_id?: string;
  split_method: SplitMethod;
  selected_user_ids: string[];
  notes?: string;
}

interface AddBudgetItemBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: AddBudgetItemPayload) => Promise<void> | void;
  members: BudgetItemMember[];
  splitPods?: SplitPodOption[];
  currentUserId?: string;
  isForecastOnly?: boolean;
}

const CATEGORIES = [
  { id: "stay", label: "Stay", icon: "🏕️" },
  { id: "food", label: "Food", icon: "☕" },
  { id: "fuel", label: "Fuel/Cab", icon: "🚙" },
  { id: "passes", label: "Passes", icon: "🎟️" },
  { id: "gear", label: "Gear", icon: "🎒" },
  { id: "misc", label: "Misc", icon: "🪙" },
];

export const AddBudgetItemBottomSheet: React.FC<AddBudgetItemBottomSheetProps> = ({
  visible,
  onClose,
  onSubmit,
  members,
  splitPods = [],
  currentUserId,
  isForecastOnly = false,
}) => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("food");
  const [calculationBasis, setCalculationBasis] = useState<CalculationBasis>("FIXED");
  const [fixedAmount, setFixedAmount] = useState("600");
  const [unitPrice, setUnitPrice] = useState("150");
  const [quantity, setQuantity] = useState("4");
  const [perPersonRate, setPerPersonRate] = useState("200");

  const [splitScope, setSplitScope] = useState<SplitScope>("EVERYONE");
  const [selectedPodId, setSelectedPodId] = useState<string>(splitPods[0]?.id || "");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(
    members.map((m) => m.user_id)
  );
  const [splitMethod, setSplitMethod] = useState<SplitMethod>("EQUAL");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const participantCount = Math.max(1, selectedUserIds.length);

  const totalAmount = useMemo(() => {
    if (calculationBasis === "FIXED") {
      return parseFloat(fixedAmount) || 0;
    } else if (calculationBasis === "PER_PERSON") {
      return (parseFloat(perPersonRate) || 0) * participantCount;
    } else if (calculationBasis === "QTY_UNIT") {
      return (parseFloat(unitPrice) || 0) * (parseFloat(quantity) || 0);
    }
    return 0;
  }, [calculationBasis, fixedAmount, perPersonRate, unitPrice, quantity, participantCount]);

  const perPersonShare = useMemo(() => {
    return participantCount > 0 ? totalAmount / participantCount : 0;
  }, [totalAmount, participantCount]);

  const handleToggleUser = (userId: string) => {
    if (splitScope === "EVERYONE") setSplitScope("SELECTED");
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.length > 1
          ? prev.filter((id) => id !== userId)
          : prev
        : [...prev, userId]
    );
  };

  const handleFormSubmit = async () => {
    if (!title.trim()) {
      setErrorMsg("Please enter an item name");
      return;
    }
    if (totalAmount <= 0) {
      setErrorMsg("Amount must be greater than zero");
      return;
    }
    setErrorMsg(null);
    setSubmitting(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await onSubmit({
        title: title.trim(),
        category,
        calculation_basis: calculationBasis,
        unit_price:
          calculationBasis === "QTY_UNIT"
            ? parseFloat(unitPrice) || 0
            : calculationBasis === "PER_PERSON"
            ? parseFloat(perPersonRate) || 0
            : totalAmount,
        quantity:
          calculationBasis === "QTY_UNIT"
            ? parseFloat(quantity) || 1
            : calculationBasis === "PER_PERSON"
            ? participantCount
            : 1,
        amount: totalAmount,
        split_scope: splitScope,
        split_pod_id: splitScope === "SPLIT_POD" ? selectedPodId : undefined,
        split_method: splitMethod,
        selected_user_ids: selectedUserIds,
        notes: notes.trim() || undefined,
      });

      setTitle("");
      setFixedAmount("600");
      setNotes("");
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to save item.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.sheetContent}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.layerBadge}>
                {isForecastOnly ? "LAYER 1 · TRIP BUDGET FORECAST" : "LAYER 2/3 · SMART SPLIT ENGINE"}
              </Text>
              <Text style={styles.sheetTitle}>Add Budget Item · खर्च जोड़ें</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={theme.colors.parchment} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            {errorMsg && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle-outline" size={14} color="#B91C1C" />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            {/* Live Calculation Preview Banner */}
            <View style={styles.previewCard}>
              <View style={styles.previewHeader}>
                <Text style={styles.previewBadge}>LIVE SPLIT PREVIEW · अनुमान</Text>
                <Text style={styles.previewCount}>{participantCount} TRAVELLERS</Text>
              </View>

              <View style={styles.previewAmountRow}>
                <View>
                  <Text style={styles.previewPerPerson}>₹{perPersonShare.toFixed(2)}</Text>
                  <Text style={styles.previewPerPersonSub}>/ person</Text>
                </View>

                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.previewTotalLabel}>TOTAL AMOUNT</Text>
                  <Text style={styles.previewTotal}>₹{totalAmount.toFixed(2)}</Text>
                </View>
              </View>
            </View>

            {/* Title */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Item Title *</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Parvati Valley Riverside Camp, Chai"
                placeholderTextColor="#888"
                style={styles.textInput}
              />
            </View>

            {/* Category */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.catGrid}>
                {CATEGORIES.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => setCategory(c.id)}
                    style={[styles.catBtn, category === c.id && styles.catBtnActive]}
                  >
                    <Text>{c.icon}</Text>
                    <Text style={[styles.catBtnText, category === c.id && styles.catBtnTextActive]}>
                      {c.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Calculation Basis Tabs */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Calculation Basis</Text>
              <View style={styles.basisTabs}>
                {(["FIXED", "PER_PERSON", "QTY_UNIT"] as const).map((b) => (
                  <TouchableOpacity
                    key={b}
                    onPress={() => setCalculationBasis(b)}
                    style={[styles.basisBtn, calculationBasis === b && styles.basisBtnActive]}
                  >
                    <Text
                      style={[
                        styles.basisBtnText,
                        calculationBasis === b && styles.basisBtnTextActive,
                      ]}
                    >
                      {b === "FIXED" ? "Flat Total" : b === "PER_PERSON" ? "Per Person" : "Qty × Unit"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {calculationBasis === "FIXED" && (
                <View style={styles.subInputRow}>
                  <Text style={styles.currencyPrefix}>₹</Text>
                  <TextInput
                    value={fixedAmount}
                    onChangeText={setFixedAmount}
                    keyboardType="numeric"
                    placeholder="600"
                    placeholderTextColor="#888"
                    style={styles.subTextInput}
                  />
                </View>
              )}

              {calculationBasis === "PER_PERSON" && (
                <View style={styles.rowInputs}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.smallLabel}>Rate / Person (₹)</Text>
                    <TextInput
                      value={perPersonRate}
                      onChangeText={setPerPersonRate}
                      keyboardType="numeric"
                      placeholder="200"
                      placeholderTextColor="#888"
                      style={styles.textInput}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.smallLabel}>Travellers</Text>
                    <TextInput
                      value={`${participantCount} Members`}
                      editable={false}
                      style={[styles.textInput, { backgroundColor: "#EEE" }]}
                    />
                  </View>
                </View>
              )}

              {calculationBasis === "QTY_UNIT" && (
                <View style={styles.rowInputs}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.smallLabel}>Unit Price (₹)</Text>
                    <TextInput
                      value={unitPrice}
                      onChangeText={setUnitPrice}
                      keyboardType="numeric"
                      placeholder="150"
                      placeholderTextColor="#888"
                      style={styles.textInput}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.smallLabel}>Quantity</Text>
                    <TextInput
                      value={quantity}
                      onChangeText={setQuantity}
                      keyboardType="numeric"
                      placeholder="4"
                      placeholderTextColor="#888"
                      style={styles.textInput}
                    />
                  </View>
                </View>
              )}
            </View>

            {/* Split Scope */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Split Scope</Text>
              <View style={styles.scopeTabs}>
                {(["EVERYONE", "SELECTED", "SPLIT_POD", "PERSONAL"] as const).map((sc) => (
                  <TouchableOpacity
                    key={sc}
                    onPress={() => setSplitScope(sc)}
                    style={[styles.scopeBtn, splitScope === sc && styles.scopeBtnActive]}
                  >
                    <Text style={[styles.scopeBtnText, splitScope === sc && styles.scopeBtnTextActive]}>
                      {sc === "EVERYONE" ? "Everyone" : sc === "SELECTED" ? "Selected" : sc === "SPLIT_POD" ? "Pod" : "Personal"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Included Members */}
            {splitScope !== "PERSONAL" && members.length > 0 && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Included Travellers ({selectedUserIds.length}/{members.length})</Text>
                <View style={styles.membersList}>
                  {members.map((m) => {
                    const isChecked = selectedUserIds.includes(m.user_id);
                    return (
                      <TouchableOpacity
                        key={m.user_id}
                        onPress={() => handleToggleUser(m.user_id)}
                        style={[styles.memberItem, isChecked && styles.memberItemActive]}
                      >
                        <Text style={[styles.memberItemName, isChecked && styles.memberItemNameActive]}>
                          {m.full_name}
                        </Text>
                        <Ionicons
                          name={isChecked ? "checkbox" : "square-outline"}
                          size={18}
                          color={isChecked ? theme.colors.terracotta : "#888"}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Notes */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Notes (Optional)</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="e.g. Paid via UPI, bill on table"
                placeholderTextColor="#888"
                style={styles.textInput}
              />
            </View>
          </ScrollView>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleFormSubmit}
            disabled={submitting}
            style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitBtnText}>Add to Budget · खर्च जोड़ें</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheetContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "90%",
    paddingBottom: 24,
  },
  header: {
    backgroundColor: theme.colors.forestDark,
    padding: 18,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  layerBadge: {
    color: theme.colors.brass,
    fontSize: 9.5,
    fontFamily: "monospace",
    fontWeight: "800",
    letterSpacing: 1,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: theme.colors.parchment,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  formScroll: {
    padding: 16,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 10,
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 12,
    color: "#B91C1C",
    fontWeight: "600",
  },
  previewCard: {
    backgroundColor: theme.colors.forestDark,
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: `${theme.colors.brass}50`,
  },
  previewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  previewBadge: {
    fontSize: 9.5,
    fontFamily: "monospace",
    color: theme.colors.brass,
    fontWeight: "800",
  },
  previewCount: {
    fontSize: 9.5,
    fontFamily: "monospace",
    color: theme.colors.brass,
    fontWeight: "800",
  },
  previewAmountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 8,
  },
  previewPerPerson: {
    fontSize: 28,
    fontWeight: "900",
    color: theme.colors.parchment,
    fontFamily: "monospace",
  },
  previewPerPersonSub: {
    fontSize: 11,
    color: "rgba(239,229,210,0.8)",
  },
  previewTotalLabel: {
    fontSize: 9,
    fontFamily: "monospace",
    color: "rgba(239,229,210,0.7)",
  },
  previewTotal: {
    fontSize: 16,
    fontWeight: "800",
    color: theme.colors.brass,
    fontFamily: "monospace",
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: theme.colors.forestDark,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E5D5BA",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: theme.colors.forestDark,
  },
  catGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  catBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5D5BA",
  },
  catBtnActive: {
    backgroundColor: theme.colors.forestDark,
    borderColor: theme.colors.forestDark,
  },
  catBtnText: {
    fontSize: 11,
    color: theme.colors.forestDark,
    fontWeight: "600",
  },
  catBtnTextActive: {
    color: theme.colors.parchment,
  },
  basisTabs: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 8,
  },
  basisBtn: {
    flex: 1,
    paddingVertical: 7,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5D5BA",
    alignItems: "center",
  },
  basisBtnActive: {
    backgroundColor: theme.colors.forestDark,
  },
  basisBtnText: {
    fontSize: 11,
    fontFamily: "monospace",
    fontWeight: "700",
    color: theme.colors.forestDark,
  },
  basisBtnTextActive: {
    color: theme.colors.parchment,
  },
  subInputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E5D5BA",
    borderRadius: 12,
    paddingHorizontal: 10,
  },
  currencyPrefix: {
    fontSize: 15,
    fontWeight: "800",
    color: theme.colors.forestDark,
    marginRight: 4,
  },
  subTextInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 14,
    fontFamily: "monospace",
    fontWeight: "800",
    color: theme.colors.forestDark,
  },
  rowInputs: {
    flexDirection: "row",
    gap: 8,
  },
  smallLabel: {
    fontSize: 10,
    color: "#666",
    marginBottom: 4,
  },
  scopeTabs: {
    flexDirection: "row",
    gap: 6,
  },
  scopeBtn: {
    flex: 1,
    paddingVertical: 6,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5D5BA",
    alignItems: "center",
  },
  scopeBtnActive: {
    backgroundColor: theme.colors.forestDark,
  },
  scopeBtnText: {
    fontSize: 10,
    fontFamily: "monospace",
    fontWeight: "700",
    color: theme.colors.forestDark,
  },
  scopeBtnTextActive: {
    color: theme.colors.parchment,
  },
  membersList: {
    gap: 6,
  },
  memberItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5D5BA",
  },
  memberItemActive: {
    borderColor: theme.colors.terracotta,
    backgroundColor: "rgba(182,94,60,0.06)",
  },
  memberItemName: {
    fontSize: 12,
    color: theme.colors.forestDark,
  },
  memberItemNameActive: {
    fontWeight: "700",
    color: theme.colors.terracotta,
  },
  submitBtn: {
    backgroundColor: theme.colors.terracotta,
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
});

