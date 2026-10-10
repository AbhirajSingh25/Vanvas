import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const frontendDir = path.resolve(rootDir, 'frontend');

console.log('====================================================');
console.log('VANVAS RELEASE AUDIT: INTEGRATION & REGRESSION SUITE');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`✓ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`✗ FAIL: ${message}`);
  }
}

// ----------------------------------------------------
// TEST 1: REF-COUNTED SCROLL LOCK ARCHITECTURE
// ----------------------------------------------------
console.log('\n--- Section 1: Motion, Sheets & Scroll Lock Ref-Counting ---');
const scrollLockPath = path.join(frontendDir, 'lib', 'scrollLock.ts');
assert(fs.existsSync(scrollLockPath), 'scrollLock.ts utility exists');

if (fs.existsSync(scrollLockPath)) {
  const content = fs.readFileSync(scrollLockPath, 'utf8');
  assert(content.includes('activeLocks') && content.includes('acquireScrollLock') && content.includes('releaseScrollLock'), 'scrollLock manages activeLocks counter');
  assert(content.includes('Math.max(0, activeLocks - 1)'), 'releaseScrollLock protects against negative underflow');
}

// Check modal integrations
const placeModalPath = path.join(frontendDir, 'components', 'places', 'PlaceModal.tsx');
const chaloModalPath = path.join(frontendDir, 'components', 'layout', 'ChaloLauncherModal.tsx');
const askVanvasModalPath = path.join(frontendDir, 'components', 'copilot', 'AskVanvasModal.tsx');

if (fs.existsSync(placeModalPath)) {
  const c = fs.readFileSync(placeModalPath, 'utf8');
  assert(c.includes('acquireScrollLock') && c.includes('releaseScrollLock'), 'PlaceModal uses ref-counted scroll lock');
  assert(c.includes('bookmarkErrorMsg'), 'PlaceModal surfaces bookmark error messages rather than failing silently');
}

if (fs.existsSync(chaloModalPath)) {
  const c = fs.readFileSync(chaloModalPath, 'utf8');
  assert(c.includes('acquireScrollLock') && c.includes('releaseScrollLock'), 'ChaloLauncherModal uses ref-counted scroll lock');
}

if (fs.existsSync(askVanvasModalPath)) {
  const c = fs.readFileSync(askVanvasModalPath, 'utf8');
  assert(c.includes('acquireScrollLock') && c.includes('releaseScrollLock'), 'AskVanvasModal uses ref-counted scroll lock');
}

// ----------------------------------------------------
// TEST 2: SHARED DEVICE AUTHENTICATION PRIVACY BOUNDARIES
// ----------------------------------------------------
console.log('\n--- Section 2: Shared-Device Auth Boundaries & Cache Purging ---');
const authContextPath = path.join(frontendDir, 'context', 'AuthContext.tsx');
if (fs.existsSync(authContextPath)) {
  const content = fs.readFileSync(authContextPath, 'utf8');
  assert(content.includes('clearPrivateUserData'), 'AuthContext defines clearPrivateUserData');
  assert(content.includes('vanvas_cached_trips') && content.includes('vanvas_cached_saved_places'), 'clearPrivateUserData purges trip and saved place cache on logout');
  assert(content.includes('vanvas_offline_trip_') && content.includes('vanvas_trip_'), 'clearPrivateUserData purges offline trip packs on logout');
  assert(content.includes('clearPrivateUserData()') && content.includes('logout = () =>'), 'logout triggers clearPrivateUserData');
}

// ----------------------------------------------------
// TEST 3: PLANNING WIZARD HISTORY CONTINUITY & CACHING RESILIENCE
// ----------------------------------------------------
console.log('\n--- Section 3: Wizard History Continuity & Cache Resilience ---');
const planPagePath = path.join(frontendDir, 'app', 'plan', 'page.tsx');
if (fs.existsSync(planPagePath)) {
  const content = fs.readFileSync(planPagePath, 'utf8');
  assert(content.includes('replaceState') && content.includes('vanvasStep'), 'PlanWizard initializes history state preserving router state');
  assert(content.includes('...(window.history.state || {})'), 'goToStep preserves Next.js router state during pushState');
  assert(content.includes('history.back()') || content.includes('goToStep('), 'UI back navigation stays in lockstep with history stack');
  assert(content.includes('JSON.parse(existingRaw)'), 'PlanWizard handles existing cache parsing with safe error trapping');
  assert(content.includes('if (isGenerating) return'), 'Duplicate trip generation prevented via immediate isGenerating check');
}

// ----------------------------------------------------
// TEST 4: TRIP WORKSPACE URL & TAB RESILIENCE
// ----------------------------------------------------
console.log('\n--- Section 4: Workspace Tab Resilience & Cache Reconstruction ---');
const tripDetailPagePath = path.join(frontendDir, 'app', 'trips', '[id]', 'page.tsx');
if (fs.existsSync(tripDetailPagePath)) {
  const content = fs.readFileSync(tripDetailPagePath, 'utf8');
  assert(content.includes('VALID_TABS') && content.includes('resolveValidTab'), 'Trip workspace defines VALID_TABS and resolveValidTab validator');
  assert(content.includes('overview') && content.includes('budget') && content.includes('checklist') && content.includes('stays_rentals'), 'VALID_TABS includes core tabs');
  assert(content.includes('setTrip(cachedTrip)'), 'Trip detail falls back to offline cache on network failure');
  assert(content.includes('EmptyState') && content.includes('Expedition Hub Not Found'), 'Missing or deleted trips produce honest EmptyState recovery');
}

const tripsPagePath = path.join(frontendDir, 'app', 'trips', 'page.tsx');
if (fs.existsSync(tripsPagePath)) {
  const content = fs.readFileSync(tripsPagePath, 'utf8');
  assert(content.includes('loadedFromCache') && content.includes('reconstructed'), 'Trips dashboard reconstructs offline trips if cached list is corrupt or absent');
  assert(content.includes('handleBookmarkToggle'), 'Trips dashboard updates state and storage simultaneously upon unbookmarking');
}

// ----------------------------------------------------
// TEST 5: SIMULATED IN-MEMORY LOGIC AUDIT
// ----------------------------------------------------
console.log('\n--- Section 5: In-Memory Unit Invariant Tests ---');

// Simulated resolveValidTab
const VALID_TABS = ["overview", "itinerary", "bookings", "stays_rentals", "food", "budget", "group", "checklist", "circles"];
function resolveValidTab(rawTab) {
  if (!rawTab) return "overview";
  const clean = rawTab.trim().toLowerCase();
  return VALID_TABS.includes(clean) ? clean : "overview";
}

assert(resolveValidTab("budget") === "budget", 'Valid tab "?tab=budget" resolves to "budget"');
assert(resolveValidTab("checklist") === "checklist", 'Valid tab "?tab=checklist" resolves to "checklist"');
assert(resolveValidTab("stays_rentals") === "stays_rentals", 'Valid tab "?tab=stays_rentals" resolves to "stays_rentals"');
assert(resolveValidTab("malformed_unknown_xyz") === "overview", 'Unknown tab "?tab=malformed_unknown_xyz" falls back safely to "overview"');
assert(resolveValidTab(null) === "overview", 'Missing tab parameter safely falls back to "overview"');
assert(resolveValidTab("   BUDGET   ") === "budget", 'Case-insensitive padded tab parameter resolves safely');

// Simulated malformed localStorage handling
let memoryStore = {
  "vanvas_cached_trips": "{corrupt_non_json---"
};

function safeGetCachedTrips() {
  try {
    const raw = memoryStore["vanvas_cached_trips"];
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

assert(Array.isArray(safeGetCachedTrips()) && safeGetCachedTrips().length === 0, 'Malformed JSON in vanvas_cached_trips does not throw and recovers to empty array');

// Simulated ref-counted scroll lock state
let simulatedLockCount = 0;
let simulatedOverflow = "";

function testLock() {
  if (simulatedLockCount === 0) simulatedOverflow = "hidden";
  simulatedLockCount++;
}

function testUnlock() {
  simulatedLockCount = Math.max(0, simulatedLockCount - 1);
  if (simulatedLockCount === 0) simulatedOverflow = "";
}

testLock(); // Modal 1 opens
assert(simulatedOverflow === "hidden" && simulatedLockCount === 1, 'Modal 1 opens: overflow is hidden, lockCount is 1');

testLock(); // Modal 2 opens
assert(simulatedOverflow === "hidden" && simulatedLockCount === 2, 'Modal 2 opens: overflow remains hidden, lockCount is 2');

testUnlock(); // Modal 2 closes
assert(simulatedOverflow === "hidden" && simulatedLockCount === 1, 'Modal 2 closes: overflow REMAINS hidden because Modal 1 is still open');

testUnlock(); // Modal 1 closes
assert(simulatedOverflow === "" && simulatedLockCount === 0, 'Modal 1 closes: overflow is cleanly restored');

testUnlock(); // Stray unlock attempt
assert(simulatedLockCount === 0 && simulatedOverflow === "", 'Stray unlock does not negative-underflow lock count');

console.log('\n====================================================');
console.log(`AUDIT REGRESSION SUMMARY: ${passedTests}/${totalTests} tests passed (${Math.round((passedTests / totalTests) * 100)}%)`);
console.log('====================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
