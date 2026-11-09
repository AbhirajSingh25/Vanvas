import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Destination } from "@vanvas/shared";
import { nativeApi } from "../../src/services/api";
import { useAuth } from "../../src/context/AuthContext";
import { theme } from "../../src/theme";

const COMPANIONS = ["Solo", "Couple", "Friends", "Family"];
const TRAVEL_STYLES = ["Spontaneous", "Balanced", "Structured", "Leisure"];
const WAKE_UP_TIMES = ["Early Riser (6 AM)", "Moderate (8 AM)", "Slow Morning (10 AM)"];
const INTENSITIES = ["Relaxed", "Moderate", "High Energy / Adventurous"];
const TRANSPORT_MODES = ["Train", "Flight", "Bus", "Self Drive", "Motorcycle"];
const INTEREST_OPTIONS = ["Hikes & Nature", "Cafes & Food", "Temples & Culture", "Photography", "Rivers & Lakes"];

interface PickupGateway {
  id: string;
  name: string;
  route: string;
  distanceKm: number;
  acclimatization: string;
  ratePerDay: number;
  isSeasonal?: boolean;
  statusNote?: string;
}

const SPITI_GATEWAYS: PickupGateway[] = [
  {
    id: "shimla",
    name: "Shimla Gateway",
    route: "Via NH-5 Hindustan-Tibet Highway (Kinnaur Route)",
    distanceKm: 420,
    acclimatization: "Gradual altitude gain via Narkanda, Rampur, Kalpa, and Nako (Recommended year-round).",
    ratePerDay: 1800,
  },
  {
    id: "chandigarh",
    name: "Chandigarh Gateway",
    route: "Via Himalayan Expressway & Shimla Bypass",
    distanceKm: 510,
    acclimatization: "Convenient airport/railway handover with transit gear inspection.",
    ratePerDay: 1900,
  },
  {
    id: "manali",
    name: "Manali Gateway",
    route: "Via Atal Tunnel & Kunzum Pass (4,590 m)",
    distanceKm: 200,
    acclimatization: "Steep altitude jump. Subject to seasonal Kunzum Pass snow clearance (June-October).",
    ratePerDay: 2000,
    isSeasonal: true,
    statusNote: "Seasonal route: Verify pass opening before departure",
  },
];

export default function PlanScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [step, setStep] = useState<number>(1);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [originCity, setOriginCity] = useState<string>("Delhi");
  const [durationDays, setDurationDays] = useState<number>(3);
  const [travellersCount, setTravellersCount] = useState<number>(1);
  const [companionType, setCompanionType] = useState<string>("Solo");
  const [travelStyle, setTravelStyle] = useState<string>("Balanced");
  const [wakeUpPreference, setWakeUpPreference] = useState<string>("Moderate (8 AM)");
  const [intensity, setIntensity] = useState<string>("Moderate");
  const [transportMode, setTransportMode] = useState<string>("Train");
  const [pickupGateway, setPickupGateway] = useState<string>("shimla");
  const [motorcycleModel, setMotorcycleModel] = useState<string>("Royal Enfield Himalayan 450");
  const [budget, setBudget] = useState<number>(12000);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(["Hikes & Nature", "Cafes & Food"]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    async function loadDestinations() {
      try {
        const res = await nativeApi.getDestinations(false);
        setDestinations(res.destinations);
        if (res.destinations.length > 0) {
          setSelectedDestination(res.destinations[0]);
        }
      } catch {
        // fallback
      }
    }
    loadDestinations();
  }, []);

  const toggleInterest = (interest: string) => {
    Haptics.selectionAsync();
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const handleBuildTrip = async () => {
    if (!selectedDestination) {
      Alert.alert("Missing Destination", "Please select a destination sanctuary.");
      return;
    }
    if (!originCity.trim()) {
      Alert.alert("Missing Origin", "Please specify your departure city.");
      return;
    }

    setIsSubmitting(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Calculate dates starting tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const endDate = new Date(tomorrow);
    endDate.setDate(endDate.getDate() + durationDays);

    const startDateStr = tomorrow.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];

    const isSpiti =
      selectedDestination.slug === "spiti" ||
      selectedDestination.name?.toLowerCase().includes("spiti");
    const gatewayObj = SPITI_GATEWAYS.find((g) => g.id === pickupGateway) || SPITI_GATEWAYS[0];

    try {
      const created = await nativeApi.createTrip({
        destination_id: selectedDestination.id,
        origin_city: originCity.trim(),
        start_date: startDateStr,
        end_date: endDateStr,
        transport_mode: transportMode,
        budget,
        travellers_count: travellersCount,
        companion_type: companionType,
        travel_style: travelStyle,
        wake_up_preference: wakeUpPreference,
        activity_intensity: intensity,
        interests: selectedInterests,
        transport_details:
          transportMode === "Motorcycle"
            ? {
                vehicle_type: "Motorcycle",
                vehicle_model: motorcycleModel,
                pickup_gateway: isSpiti ? gatewayObj.name : `${originCity.trim()} Rental Hub`,
                gateway_route: isSpiti ? gatewayObj.route : `Direct ride from ${originCity.trim()}`,
                distance_km: isSpiti ? gatewayObj.distanceKm : undefined,
                estimated_rental_per_day: isSpiti ? gatewayObj.ratePerDay : 1600,
                regulatory_warning: isSpiti
                  ? "CRITICAL ADVISORY: Outside commercial rental motorcycles are strictly restricted by the local Spiti/Kaza Taxi and Bike Union for sightseeing within Spiti. You can ride your gateway motorcycle into Kaza, but local places (Kibber, Langza, Hikkim, Pin Valley) require hiring locally registered Spiti bikes or union taxis."
                  : undefined,
              }
            : undefined,
      });

      router.replace(`/trip/${created.id}`);
    } catch (err: any) {
      Alert.alert("Failed to build trip", err.message || "Please check your network connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerBadge}>PLAN MY EXPEDITION</Text>
        <Text style={styles.headerTitle}>Curate Your Journey</Text>
        <Text style={styles.headerSubtitle}>Step {step} of 3</Text>

        {/* Progress bar */}
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${(step / 3) * 100}%` }]} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {step === 1 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Where and when are you travelling?</Text>

            {/* Destination Selection */}
            <Text style={styles.fieldLabel}>Destination Sanctuary</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.destScroll}>
              {destinations.map((d) => {
                const isSelected = selectedDestination?.id === d.id;
                return (
                  <TouchableOpacity
                    key={d.id}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedDestination(d);
                    }}
                    style={[styles.destPill, isSelected && styles.destPillActive]}
                  >
                    <Text style={[styles.destPillText, isSelected && styles.destPillTextActive]}>
                      {d.name}
                    </Text>
                    <Text style={[styles.destStateText, isSelected && styles.destStateTextActive]}>
                      {d.state}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Origin City */}
            <Text style={styles.fieldLabel}>Origin / Departing From</Text>
            <TextInput
              value={originCity}
              onChangeText={setOriginCity}
              placeholder="e.g. Delhi, Chandigarh, Mumbai"
              placeholderTextColor={theme.colors.foregroundSubtle}
              style={styles.textInput}
            />

            {/* Duration Days */}
            <Text style={styles.fieldLabel}>Duration: {durationDays} Days</Text>
            <View style={styles.stepperRow}>
              {[1, 2, 3, 4, 5, 7].map((days) => (
                <TouchableOpacity
                  key={days}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setDurationDays(days);
                  }}
                  style={[styles.stepperPill, durationDays === days && styles.stepperPillActive]}
                >
                  <Text
                    style={[styles.stepperText, durationDays === days && styles.stepperTextActive]}
                  >
                    {days}d
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setStep(2);
              }}
              style={styles.continueButton}
            >
              <Text style={styles.continueButtonText}>Next: Travellers & Style</Text>
              <Ionicons name="arrow-forward" size={18} color={theme.colors.parchment} />
            </TouchableOpacity>
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Who is travelling and what is the vibe?</Text>

            {/* Companion Type */}
            <Text style={styles.fieldLabel}>Companion</Text>
            <View style={styles.optionGrid}>
              {COMPANIONS.map((comp) => (
                <TouchableOpacity
                  key={comp}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setCompanionType(comp);
                  }}
                  style={[styles.optionPill, companionType === comp && styles.optionPillActive]}
                >
                  <Text style={[styles.optionText, companionType === comp && styles.optionTextActive]}>
                    {comp}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Number of Travellers */}
            <Text style={styles.fieldLabel}>Travellers: {travellersCount}</Text>
            <View style={styles.stepperRow}>
              {[1, 2, 3, 4, 6].map((num) => (
                <TouchableOpacity
                  key={num}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setTravellersCount(num);
                  }}
                  style={[styles.stepperPill, travellersCount === num && styles.stepperPillActive]}
                >
                  <Text
                    style={[styles.stepperText, travellersCount === num && styles.stepperTextActive]}
                  >
                    {num}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Travel Style */}
            <Text style={styles.fieldLabel}>Pacing & Style</Text>
            <View style={styles.optionGrid}>
              {TRAVEL_STYLES.map((st) => (
                <TouchableOpacity
                  key={st}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setTravelStyle(st);
                  }}
                  style={[styles.optionPill, travelStyle === st && styles.optionPillActive]}
                >
                  <Text style={[styles.optionText, travelStyle === st && styles.optionTextActive]}>
                    {st}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Wake Up Preference */}
            <Text style={styles.fieldLabel}>Wake Up Timing</Text>
            <View style={styles.verticalOptionList}>
              {WAKE_UP_TIMES.map((w) => (
                <TouchableOpacity
                  key={w}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setWakeUpPreference(w);
                  }}
                  style={[styles.radioItem, wakeUpPreference === w && styles.radioItemActive]}
                >
                  <Ionicons
                    name={wakeUpPreference === w ? "radio-button-on" : "radio-button-off"}
                    size={16}
                    color={wakeUpPreference === w ? theme.colors.forest : theme.colors.foregroundSubtle}
                  />
                  <Text style={styles.radioText}>{w}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.navButtonsRow}>
              <TouchableOpacity onPress={() => setStep(1)} style={styles.backButton}>
                <Ionicons name="arrow-back" size={18} color={theme.colors.forest} />
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setStep(3);
                }}
                style={styles.continueButtonFlex}
              >
                <Text style={styles.continueButtonText}>Next: Budget & Build</Text>
                <Ionicons name="arrow-forward" size={18} color={theme.colors.parchment} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Final Details & Interests</Text>

            {/* Transport Preference */}
            <Text style={styles.fieldLabel}>Preferred Transport</Text>
            <View style={styles.optionGrid}>
              {TRANSPORT_MODES.map((mode) => (
                <TouchableOpacity
                  key={mode}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setTransportMode(mode);
                  }}
                  style={[styles.optionPill, transportMode === mode && styles.optionPillActive]}
                >
                  <Text style={[styles.optionText, transportMode === mode && styles.optionTextActive]}>
                    {mode}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Motorcycle & Spiti Gateway Section */}
            {transportMode === "Motorcycle" && (
              <View style={styles.motorcycleSection}>
                <Text style={styles.fieldLabel}>Expedition Motorcycle</Text>
                <View style={styles.optionGrid}>
                  {["Royal Enfield Himalayan 450", "Classic 350 Cruiser", "KTM 390 Adventure"].map((bike) => (
                    <TouchableOpacity
                      key={bike}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setMotorcycleModel(bike);
                      }}
                      style={[styles.optionPill, motorcycleModel === bike && styles.optionPillActive]}
                    >
                      <Text style={[styles.optionText, motorcycleModel === bike && styles.optionTextActive]}>
                        {bike}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Spiti Gateway Selection */}
                {(selectedDestination?.slug === "spiti" ||
                  selectedDestination?.name?.toLowerCase().includes("spiti")) && (
                  <View style={styles.gatewayCard}>
                    <View style={styles.gatewayHeader}>
                      <Ionicons name="map-outline" size={16} color={theme.colors.forest} />
                      <Text style={styles.gatewayTitle}>Rental Pickup Gateway (Spiti)</Text>
                    </View>
                    <Text style={styles.gatewaySubtitle}>
                      Outside rental bikes from gateways take you to Kaza; select your authorized transit hub:
                    </Text>

                    {SPITI_GATEWAYS.map((gw) => {
                      const isSelected = pickupGateway === gw.id;
                      return (
                        <TouchableOpacity
                          key={gw.id}
                          onPress={() => {
                            Haptics.selectionAsync();
                            setPickupGateway(gw.id);
                          }}
                          style={[styles.gatewayItem, isSelected && styles.gatewayItemActive]}
                        >
                          <View style={styles.gatewayTop}>
                            <Text style={[styles.gatewayName, isSelected && styles.gatewayNameActive]}>
                              {gw.name}
                            </Text>
                            <Text style={styles.gatewayRate}>₹{gw.ratePerDay}/day</Text>
                          </View>
                          <Text style={styles.gatewayRoute}>{gw.route}</Text>
                          <Text style={styles.gatewayNote}>{gw.acclimatization}</Text>
                          {gw.isSeasonal && (
                            <View style={styles.seasonalBadge}>
                              <Ionicons name="snow-outline" size={12} color="#B45309" />
                              <Text style={styles.seasonalText}>{gw.statusNote}</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}

                    {/* Local Kaza Commercial Rental Warning */}
                    <View style={styles.warningBox}>
                      <Ionicons name="warning-outline" size={16} color="#DC2626" />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.warningTitle}>Local Kaza Rental Restriction</Text>
                        <Text style={styles.warningText}>
                          Outside commercial rental motorcycles (rented in Shimla, Chandigarh, or Manali) are strictly restricted by the local Spiti/Kaza Taxi and Bike Union for sightseeing within Spiti. You can ride your gateway motorcycle into Kaza, but local places (Kibber, Langza, Hikkim, Pin Valley) require hiring locally registered Spiti bikes or union taxis.
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Total Budget */}
            <Text style={styles.fieldLabel}>Total Estimated Budget: ₹{budget.toLocaleString("en-IN")}</Text>
            <View style={styles.stepperRow}>
              {[6000, 12000, 20000, 35000].map((b) => (
                <TouchableOpacity
                  key={b}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setBudget(b);
                  }}
                  style={[styles.stepperPill, budget === b && styles.stepperPillActive]}
                >
                  <Text style={[styles.stepperText, budget === b && styles.stepperTextActive]}>
                    ₹{(b / 1000).toFixed(0)}k
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Interests Multi-Select */}
            <Text style={styles.fieldLabel}>Trail Interests</Text>
            <View style={styles.interestsRow}>
              {INTEREST_OPTIONS.map((interest) => {
                const active = selectedInterests.includes(interest);
                return (
                  <TouchableOpacity
                    key={interest}
                    onPress={() => toggleInterest(interest)}
                    style={[styles.interestPill, active && styles.interestPillActive]}
                  >
                    <Ionicons
                      name={active ? "checkmark-circle" : "add-circle-outline"}
                      size={14}
                      color={active ? theme.colors.parchment : theme.colors.forest}
                    />
                    <Text style={[styles.interestText, active && styles.interestTextActive]}>
                      {interest}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Review Summary Card */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Expedition Blueprint</Text>
              <Text style={styles.summaryLine}>
                • {selectedDestination?.name} ({durationDays} Days, {selectedDestination?.state})
              </Text>
              <Text style={styles.summaryLine}>
                • From {originCity} via {transportMode}
                {transportMode === "Motorcycle" &&
                (selectedDestination?.slug === "spiti" ||
                  selectedDestination?.name?.toLowerCase().includes("spiti"))
                  ? ` (${SPITI_GATEWAYS.find((g) => g.id === pickupGateway)?.name || "Shimla"})`
                  : ""}
              </Text>
              {transportMode === "Motorcycle" && (
                <Text style={styles.summaryLine}>• Vehicle: {motorcycleModel}</Text>
              )}
              <Text style={styles.summaryLine}>• {travellersCount} {companionType} Traveller(s)</Text>
              <Text style={styles.summaryLine}>• {travelStyle} Pace, ₹{budget.toLocaleString("en-IN")} Budget</Text>
            </View>

            <View style={styles.navButtonsRow}>
              <TouchableOpacity onPress={() => setStep(2)} style={styles.backButton}>
                <Ionicons name="arrow-back" size={18} color={theme.colors.forest} />
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleBuildTrip}
                disabled={isSubmitting}
                style={[styles.buildButton, isSubmitting && { opacity: 0.7 }]}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={theme.colors.parchment} />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={18} color={theme.colors.brass} />
                    <Text style={styles.buildButtonText}>Build My Trip</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.forestDark,
    paddingTop: 54,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerBadge: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    color: theme.colors.brass,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: theme.colors.parchment,
    marginTop: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: theme.colors.mist,
    marginTop: 2,
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 2,
    marginTop: 14,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: theme.colors.brass,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
  },
  stepContainer: {
    gap: 12,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.primaryDark,
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.foreground,
    marginTop: 8,
  },
  destScroll: {
    marginVertical: 6,
  },
  destPill: {
    backgroundColor: theme.colors.surface,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: 10,
  },
  destPillActive: {
    backgroundColor: theme.colors.forest,
    borderColor: theme.colors.forest,
  },
  destPillText: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.foreground,
  },
  destPillTextActive: {
    color: theme.colors.parchment,
  },
  destStateText: {
    fontSize: 10,
    color: theme.colors.foregroundMuted,
    marginTop: 2,
  },
  destStateTextActive: {
    color: theme.colors.mist,
  },
  textInput: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: theme.colors.foreground,
  },
  stepperRow: {
    flexDirection: "row",
    gap: 8,
    marginVertical: 4,
  },
  stepperPill: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  stepperPillActive: {
    backgroundColor: theme.colors.forest,
    borderColor: theme.colors.forest,
  },
  stepperText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.foreground,
  },
  stepperTextActive: {
    color: theme.colors.parchment,
  },
  optionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionPill: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  optionPillActive: {
    backgroundColor: theme.colors.forest,
    borderColor: theme.colors.forest,
  },
  optionText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.foreground,
  },
  optionTextActive: {
    color: theme.colors.parchment,
  },
  verticalOptionList: {
    gap: 8,
  },
  radioItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  radioItemActive: {
    borderColor: theme.colors.forest,
  },
  radioText: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.foreground,
  },
  interestsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  interestPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.forest,
  },
  interestPillActive: {
    backgroundColor: theme.colors.forest,
  },
  interestText: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.forest,
  },
  interestTextActive: {
    color: theme.colors.parchment,
  },
  summaryCard: {
    padding: 16,
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radius.lg,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.terracotta,
    marginVertical: 12,
    gap: 4,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.primaryDark,
    marginBottom: 4,
  },
  summaryLine: {
    fontSize: 12,
    color: theme.colors.foreground,
    lineHeight: 18,
  },
  continueButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: theme.colors.forest,
    paddingVertical: 14,
    borderRadius: theme.radius.md,
    marginTop: 20,
  },
  continueButtonFlex: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: theme.colors.forest,
    paddingVertical: 14,
    borderRadius: theme.radius.md,
  },
  continueButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.parchment,
  },
  navButtonsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
  },
  backButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 14,
  },
  backButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.forest,
  },
  buildButton: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: theme.colors.terracotta,
    paddingVertical: 14,
    borderRadius: theme.radius.md,
  },
  buildButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.parchment,
  },
  motorcycleSection: {
    marginTop: 10,
    marginBottom: 10,
  },
  gatewayCard: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radius.lg,
    padding: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  gatewayHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  gatewayTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.primaryDark,
  },
  gatewaySubtitle: {
    fontSize: 12,
    color: theme.colors.foregroundMuted,
    marginBottom: 10,
  },
  gatewayItem: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  gatewayItemActive: {
    borderColor: theme.colors.forest,
    backgroundColor: theme.colors.surfaceMuted,
    borderWidth: 2,
  },
  gatewayTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  gatewayName: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.foreground,
  },
  gatewayNameActive: {
    color: theme.colors.forest,
  },
  gatewayRate: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.forest,
  },
  gatewayRoute: {
    fontSize: 12,
    color: theme.colors.foregroundSubtle,
    marginTop: 2,
  },
  gatewayNote: {
    fontSize: 11,
    color: theme.colors.foregroundMuted,
    marginTop: 4,
    fontStyle: "italic",
  },
  seasonalBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FEF3C7",
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginTop: 6,
  },
  seasonalText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#B45309",
  },
  warningBox: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#FEF2F2",
    borderRadius: theme.radius.sm,
    padding: 10,
    borderWidth: 1,
    borderColor: "#FCA5A5",
    marginTop: 8,
  },
  warningTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#B91C1C",
    marginBottom: 2,
  },
  warningText: {
    fontSize: 11,
    color: "#991B1B",
    lineHeight: 15,
  },
});
