// Frontend Phase 2A Autocomplete & Planner Navigation Flow Deterministic Verification
import assert from "node:assert";

// Verify frontend canonical destination alias resolution
import {
  resolveCanonicalDestination,
  findCanonicalDestination,
  getCanonicalHindiName,
  FRONTEND_DESTINATION_ALIASES,
  CANONICAL_DESTINATIONS,
} from "../lib/canonicalDestinations.ts";

console.log("=== RUNNING FRONTEND PHASE 2A CANONICAL & PLANNER TESTS ===");

// Test 1: Banaras alias resolution to canonical Varanasi
const banarasMatch = resolveCanonicalDestination("banaras");
assert(banarasMatch !== undefined, "Expected 'banaras' to resolve");
assert.strictEqual(banarasMatch.slug, "varanasi", "Expected slug 'varanasi'");
assert.strictEqual(banarasMatch.id, "dest-varanasi", "Expected id 'dest-varanasi'");
assert.strictEqual(banarasMatch.name, "Varanasi", "Expected name 'Varanasi'");
assert.strictEqual(getCanonicalHindiName("banaras"), "वाराणसी", "Expected Hindi name 'वाराणसी'");
console.log("✓ Test 1 Passed: 'banaras' -> Varanasi (वाराणसी)");

// Test 2: Direct Varanasi query
const varanasiMatch = resolveCanonicalDestination("Varanasi");
assert(varanasiMatch !== undefined, "Expected 'Varanasi' to resolve");
assert.strictEqual(varanasiMatch.slug, "varanasi");
console.log("✓ Test 2 Passed: 'Varanasi' -> Varanasi");

// Test 3: Kashi alias resolution
const kashiMatch = resolveCanonicalDestination("kashi");
assert(kashiMatch !== undefined, "Expected 'kashi' to resolve");
assert.strictEqual(kashiMatch.slug, "varanasi");
console.log("✓ Test 3 Passed: 'kashi' -> Varanasi");

// Test 4: Chopta alias resolution to Tungnath-Chandrashila
const choptaMatch = resolveCanonicalDestination("chopta");
assert(choptaMatch !== undefined, "Expected 'chopta' to resolve");
assert.strictEqual(choptaMatch.slug, "tungnath-chandrashila");
assert.strictEqual(choptaMatch.id, "dest-tungnath-chandrashila");
console.log("✓ Test 4 Passed: 'chopta' -> Tungnath–Chandrashila Trek");

// Test 5: Curated Himalayan & regional destination aliases
assert.strictEqual(resolveCanonicalDestination("mcleodganj")?.slug, "dharamshala");
assert.strictEqual(resolveCanonicalDestination("mcleod ganj")?.slug, "dharamshala");
assert.strictEqual(resolveCanonicalDestination("kainchi dham")?.slug, "kainchi-dham");
assert.strictEqual(resolveCanonicalDestination("kaza")?.slug, "spiti");
assert.strictEqual(resolveCanonicalDestination("ladakh")?.slug, "leh");
assert.strictEqual(resolveCanonicalDestination("tosh")?.slug, "kasol");
assert.strictEqual(resolveCanonicalDestination("chandrashila")?.slug, "tungnath-chandrashila");
console.log("✓ Test 5 Passed: Curated Himalayan & regional destination aliases verified");

// Test 6: Non-matching queries return undefined without hanging
assert.strictEqual(resolveCanonicalDestination("xyzzy_non_existent"), undefined);
assert.strictEqual(resolveCanonicalDestination(""), undefined);
assert.strictEqual(resolveCanonicalDestination(null), undefined);
console.log("✓ Test 6 Passed: Non-matching queries handle gracefully");

// Test 7: Verify Planner URL construction contract
const targetItem = {
  name: banarasMatch.name,
  slug: banarasMatch.slug,
  canonical_slug: banarasMatch.slug,
  id: banarasMatch.id,
};
const planUrlParams = new URLSearchParams({
  dest: targetItem.canonical_slug,
  destId: targetItem.id,
  destName: targetItem.name,
});
const constructedUrl = `/plan?${planUrlParams.toString()}`;
assert.strictEqual(constructedUrl, "/plan?dest=varanasi&destId=dest-varanasi&destName=Varanasi");
console.log("✓ Test 7 Passed: Planner route contract verified: " + constructedUrl);

// Test 8: Session Persistence Payload contract
const sessionPayload = {
  id: targetItem.id,
  slug: targetItem.canonical_slug,
  name: targetItem.name,
  hindi_name: getCanonicalHindiName(targetItem.canonical_slug),
  state: banarasMatch.state,
  region: banarasMatch.region,
  timestamp: Date.now(),
};
const serialized = JSON.stringify(sessionPayload);
const deserialized = JSON.parse(serialized);
assert.strictEqual(deserialized.slug, "varanasi");
assert.strictEqual(deserialized.hindi_name, "वाराणसी");
console.log("✓ Test 8 Passed: Session destination payload contract verified");

console.log("=== ALL 8 FRONTEND TESTS PASSED SUCCESSFULLY! ===");
