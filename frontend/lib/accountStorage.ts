export interface ChecklistItem {
  id: string;
  category: "Essentials" | "Documents" | "Clothing" | "Gear";
  text: string;
  isChecked: boolean;
}

export interface ExpenseRow {
  id: string;
  name: string;
  amount: number;
  allocationType?: "equal" | "custom";
}

export interface BudgetStorageV3 {
  version: 3;
  mode: "scratch" | "trip";
  travellersCount: number | null;
  participantsConfigured: boolean;
  participantsAmbiguous?: boolean;
  allocationType: "equal" | "custom";
  expenses: ExpenseRow[];
}

export interface ChecklistStorageV3 {
  version: 3;
  items: ChecklistItem[];
}

export const LEGACY_BUDGET_KEY = "vanvas_local_budget_split";
export const LEGACY_CHECKLIST_KEY = "vanvas_general_checklist";
export const LEGACY_UNASSIGNED_BUDGET_KEY = "vanvas:legacy_unassigned:budget:v3";
export const LEGACY_UNASSIGNED_CHECKLIST_KEY = "vanvas:legacy_unassigned:checklist:v3";

export const SUGGESTED_CHECKLIST_ESSENTIALS: ChecklistItem[] = [
  { id: "c1", category: "Essentials", text: "ID / Aadhaar / Passport & copies", isChecked: false },
  { id: "c2", category: "Essentials", text: "Cash & UPI payment device", isChecked: false },
  { id: "c3", category: "Essentials", text: "First Aid kit & personal medications", isChecked: false },
  { id: "c4", category: "Essentials", text: "Water bottle / Hydration bladder", isChecked: false },
  { id: "c5", category: "Essentials", text: "Powerbank & charging cables", isChecked: false },
  { id: "c6", category: "Documents", text: "Hotel / Homestay confirmations", isChecked: false },
  { id: "c7", category: "Documents", text: "Driver's license & vehicle RC/permit", isChecked: false },
  { id: "c8", category: "Documents", text: "Emergency contacts offline note", isChecked: false },
  { id: "c9", category: "Clothing", text: "Quick-dry trekking t-shirts", isChecked: false },
  { id: "c10", category: "Clothing", text: "Thermal base layer / Warm fleece", isChecked: false },
  { id: "c11", category: "Clothing", text: "Windproof & rain jacket / Poncho", isChecked: false },
  { id: "c12", category: "Clothing", text: "Trekking shoes & moisture-wick socks", isChecked: false },
  { id: "c13", category: "Gear", text: "UV sunglasses & high-SPF sunscreen", isChecked: false },
  { id: "c14", category: "Gear", text: "Headlamp / High-lumen torch", isChecked: false },
  { id: "c15", category: "Gear", text: "Daypack (20–30L) with rain cover", isChecked: false },
  { id: "c16", category: "Gear", text: "Leave No Trace waste bag", isChecked: false },
];

const LEGACY_CHECKLIST_PRECHECKED_IDS = new Set(["c1", "c2", "c4", "c16"]);

const LEGACY_SEEDED_EXPENSES: Record<string, { name: string; amount: number }> = {
  e1: { name: "Fuel & Transport", amount: 4500 },
  e2: { name: "Stays & Camps", amount: 5000 },
  e3: { name: "Food & Dhabas", amount: 2000 },
  e4: { name: "Tolls & Permits", amount: 500 },
};

export function isExactLegacySeededExpense(row: ExpenseRow): boolean {
  const match = LEGACY_SEEDED_EXPENSES[row.id];
  return Boolean(match && match.name === row.name && Number(row.amount) === match.amount);
}

export function getBudgetStorageKey(userId?: string | null): string {
  const cleanId = userId?.trim();
  return cleanId ? `vanvas:user:${cleanId}:budget:v3` : "vanvas:guest:budget:v3";
}

export function getChecklistStorageKey(userId?: string | null): string {
  const cleanId = userId?.trim();
  return cleanId ? `vanvas:user:${cleanId}:checklist:v3` : "vanvas:guest:checklist:v3";
}

export function createEmptyBudgetState(): BudgetStorageV3 {
  return {
    version: 3,
    mode: "scratch",
    travellersCount: null,
    participantsConfigured: false,
    participantsAmbiguous: false,
    allocationType: "equal",
    expenses: [],
  };
}

/**
 * Safely isolates legacy global keys into an unassigned legacy namespace
 * without ever auto-assigning them to whichever account signs in first.
 */
export function migrateLegacyGlobalDataOnce(): void {
  if (typeof window === "undefined") return;

  try {
    const rawBudget = window.localStorage.getItem(LEGACY_BUDGET_KEY);
    if (rawBudget) {
      const parsed = JSON.parse(rawBudget);
      const rawExpenses: ExpenseRow[] = Array.isArray(parsed?.expenses) ? parsed.expenses : [];
      const customExpenses = rawExpenses.filter((row) => !isExactLegacySeededExpense(row));

      if (customExpenses.length > 0) {
        const legacyAmbiguousCount =
          typeof parsed?.travellersCount === "number" && parsed.travellersCount > 0;
        const unassigned: BudgetStorageV3 = {
          version: 3,
          mode: "scratch",
          travellersCount: null,
          participantsConfigured: false,
          participantsAmbiguous: legacyAmbiguousCount,
          allocationType: customExpenses.some((e) => e.allocationType === "custom")
            ? "custom"
            : "equal",
          expenses: customExpenses,
        };
        window.localStorage.setItem(LEGACY_UNASSIGNED_BUDGET_KEY, JSON.stringify(unassigned));
      }
      window.localStorage.removeItem(LEGACY_BUDGET_KEY);
    }
  } catch {
    // Preserve raw state if unparseable
  }

  try {
    const rawChecklist = window.localStorage.getItem(LEGACY_CHECKLIST_KEY);
    if (rawChecklist) {
      const parsed = JSON.parse(rawChecklist);
      const rawItems: ChecklistItem[] = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.items)
          ? parsed.items
          : [];

      const isUntouchedLegacySeed =
        rawItems.length === SUGGESTED_CHECKLIST_ESSENTIALS.length &&
        rawItems.every((item, idx) => {
          const ref = SUGGESTED_CHECKLIST_ESSENTIALS[idx];
          return (
            item.id === ref.id &&
            item.text === ref.text &&
            item.isChecked === LEGACY_CHECKLIST_PRECHECKED_IDS.has(ref.id)
          );
        });

      if (!isUntouchedLegacySeed && rawItems.length > 0) {
        const unassigned: ChecklistStorageV3 = {
          version: 3,
          items: rawItems,
        };
        window.localStorage.setItem(LEGACY_UNASSIGNED_CHECKLIST_KEY, JSON.stringify(unassigned));
      }
      window.localStorage.removeItem(LEGACY_CHECKLIST_KEY);
    }
  } catch {
    // Ignore parse errors
  }
}

export function loadAccountBudget(userId?: string | null): BudgetStorageV3 {
  if (typeof window === "undefined") return createEmptyBudgetState();
  try {
    const raw = window.localStorage.getItem(getBudgetStorageKey(userId));
    if (!raw) return createEmptyBudgetState();
    const parsed = JSON.parse(raw);
    if (parsed && parsed.version === 3) {
      const hasExplicitCount =
        typeof parsed.travellersCount === "number" &&
        parsed.travellersCount > 0 &&
        parsed.participantsConfigured === true;
      return {
        version: 3,
        mode: parsed.mode === "trip" ? "trip" : "scratch",
        travellersCount: hasExplicitCount ? parsed.travellersCount : null,
        participantsConfigured: hasExplicitCount,
        participantsAmbiguous: Boolean(parsed.participantsAmbiguous),
        allocationType: parsed.allocationType === "custom" ? "custom" : "equal",
        expenses: Array.isArray(parsed.expenses) ? parsed.expenses : [],
      };
    }
  } catch {
    // Fall through
  }
  return createEmptyBudgetState();
}

export function saveAccountBudget(userId: string | null | undefined, state: BudgetStorageV3): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(getBudgetStorageKey(userId), JSON.stringify(state));
  } catch {
    // Ignore quota errors
  }
}

export function loadAccountChecklist(userId?: string | null): ChecklistItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(getChecklistStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (parsed && parsed.version === 3 && Array.isArray(parsed.items)) {
      return parsed.items;
    }
  } catch {
    // Fall through
  }
  return [];
}

export function saveAccountChecklist(userId: string | null | undefined, items: ChecklistItem[]): void {
  if (typeof window === "undefined") return;
  try {
    const payload: ChecklistStorageV3 = { version: 3, items };
    window.localStorage.setItem(getChecklistStorageKey(userId), JSON.stringify(payload));
  } catch {
    // Ignore quota errors
  }
}

export function hasLegacyUnassignedData(): { hasBudget: boolean; hasChecklist: boolean } {
  if (typeof window === "undefined") return { hasBudget: false, hasChecklist: false };
  try {
    return {
      hasBudget: Boolean(window.localStorage.getItem(LEGACY_UNASSIGNED_BUDGET_KEY)),
      hasChecklist: Boolean(window.localStorage.getItem(LEGACY_UNASSIGNED_CHECKLIST_KEY)),
    };
  } catch {
    return { hasBudget: false, hasChecklist: false };
  }
}

export function importLegacyUnassignedData(userId?: string | null): {
  budget?: BudgetStorageV3;
  checklist?: ChecklistItem[];
} {
  if (typeof window === "undefined") return {};
  const result: { budget?: BudgetStorageV3; checklist?: ChecklistItem[] } = {};
  try {
    const rawB = window.localStorage.getItem(LEGACY_UNASSIGNED_BUDGET_KEY);
    if (rawB) {
      const parsedB: BudgetStorageV3 = JSON.parse(rawB);
      const existingB = loadAccountBudget(userId);
      const merged: BudgetStorageV3 = {
        ...existingB,
        expenses: [...existingB.expenses, ...(parsedB.expenses || [])],
        participantsAmbiguous: existingB.participantsAmbiguous || parsedB.participantsAmbiguous,
        allocationType:
          existingB.allocationType === "custom" || parsedB.allocationType === "custom"
            ? "custom"
            : "equal",
      };
      saveAccountBudget(userId, merged);
      window.localStorage.removeItem(LEGACY_UNASSIGNED_BUDGET_KEY);
      result.budget = merged;
    }
  } catch {}

  try {
    const rawC = window.localStorage.getItem(LEGACY_UNASSIGNED_CHECKLIST_KEY);
    if (rawC) {
      const parsedC: ChecklistStorageV3 = JSON.parse(rawC);
      const existingC = loadAccountChecklist(userId);
      const existingTexts = new Set(existingC.map((i) => i.text.toLowerCase()));
      const additions = (parsedC.items || []).filter(
        (i) => !existingTexts.has(i.text.toLowerCase())
      );
      const mergedC = [...existingC, ...additions];
      saveAccountChecklist(userId, mergedC);
      window.localStorage.removeItem(LEGACY_UNASSIGNED_CHECKLIST_KEY);
      result.checklist = mergedC;
    }
  } catch {}

  return result;
}

export function dismissLegacyUnassignedData(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(LEGACY_UNASSIGNED_BUDGET_KEY);
    window.localStorage.removeItem(LEGACY_UNASSIGNED_CHECKLIST_KEY);
  } catch {}
}

/**
 * Permanent account deletion cleanup: removes ONLY the deleted account's
 * local namespaces, leaving all other accounts and public destination recents intact.
 */
export function purgeAccountLocalStorage(userId?: string | null): void {
  if (typeof window === "undefined" || !userId?.trim()) return;
  const cleanId = userId.trim();
  try {
    window.localStorage.removeItem(getBudgetStorageKey(cleanId));
    window.localStorage.removeItem(getChecklistStorageKey(cleanId));
  } catch {}
}

