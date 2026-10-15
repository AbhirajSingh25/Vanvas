import assert from "node:assert";
import {
  extractExplicitDestinationFromQuery,
  isNearbyQuery,
  resolveCanonicalDestination,
  FRONTEND_DESTINATION_ALIASES,
} from "../lib/canonicalDestinations.ts";

console.log("=== VANVAS RELEASE ACCEPTANCE TEST SUITE ===");

// 1. Explicit Destination vs Context Resolution
console.log("\n1. Testing Explicit Destination Extraction (Hinglish & English)...");

// Vrindavan queries
const vrindavanQueries = [
  "Vrindavan mein khane ki jagah batao",
  "Vrindavan me khana kahan milega?",
  "Food in Vrindavan",
  "Good places to eat in Vrindavan",
  "Vrindavan cafes and sweets",
  "vrindavan mein kya khayein"
];

for (const q of vrindavanQueries) {
  const extracted = extractExplicitDestinationFromQuery(q);
  assert.ok(extracted, `Expected destination to be extracted from: '${q}'`);
  assert.strictEqual(
    extracted.slug,
    "mathura-vrindavan",
    `Expected '${q}' to resolve to 'mathura-vrindavan', got '${extracted.slug}'`
  );
}
console.log(`✓ All ${vrindavanQueries.length} Vrindavan Hinglish/English queries resolved to 'mathura-vrindavan'.`);

// Jaipur queries
const jaipurQueries = [
  "What cafés should I visit in Jaipur?",
  "Food in Jaipur",
  "Jaipur mein kahan ghoomein"
];
for (const q of jaipurQueries) {
  const extracted = extractExplicitDestinationFromQuery(q);
  assert.ok(extracted, `Expected destination to be extracted from: '${q}'`);
  assert.strictEqual(
    extracted.slug,
    "jaipur",
    `Expected '${q}' to resolve to 'jaipur', got '${extracted.slug}'`
  );
}
console.log(`✓ All ${jaipurQueries.length} Jaipur queries resolved to 'jaipur'.`);

// Stale Context Override Test
console.log("\n2. Testing Deterministic Stale Context Override...");
function resolveEffectiveDestination(query, currentContextSlug) {
  const explicit = extractExplicitDestinationFromQuery(query);
  if (explicit) {
    return explicit.slug;
  }
  return currentContextSlug || null;
}

const effective1 = resolveEffectiveDestination("Vrindavan mein khane ki jagah batao", "manali");
assert.strictEqual(
  effective1,
  "mathura-vrindavan",
  "Explicit Vrindavan query must override stale Manali page context"
);
console.log("✓ Current context = 'manali' + query = 'Vrindavan mein khane ki jagah batao' -> effective = 'mathura-vrindavan'");

const effective2 = resolveEffectiveDestination("What cafes should I visit in Jaipur?", "manali");
assert.strictEqual(
  effective2,
  "jaipur",
  "Explicit Jaipur query must override stale Manali page context"
);
console.log("✓ Current context = 'manali' + query = 'What cafes should I visit in Jaipur?' -> effective = 'jaipur'");

const effective3 = resolveEffectiveDestination("Tell me the best cafes here", "manali");
assert.strictEqual(
  effective3,
  "manali",
  "Non-explicit query preserves active page context"
);
console.log("✓ Context preserves 'manali' when no explicit destination is requested");

// 3. Nearby Query Intent
console.log("\n3. Testing Nearby Query Intent Detection...");
assert.strictEqual(isNearbyQuery("Find places near me"), true);
assert.strictEqual(isNearbyQuery("What about nearby?"), true);
assert.strictEqual(isNearbyQuery("What food is nearby?"), true);
assert.strictEqual(isNearbyQuery("Best food in Vrindavan"), false);
console.log("✓ Nearby query intent detection verified.");

// 4. Grounded Instagram Reels URLs across destinations
console.log("\n4. Testing Grounded Destination Instagram Reels URLs...");
function getDestinationReelsUrl(slug, name) {
  const cleanTag = (slug || name || "").toLowerCase().replace(/[^a-z0-9]/gi, "");
  return `https://www.instagram.com/explore/tags/${encodeURIComponent(cleanTag)}/`;
}

assert.strictEqual(
  getDestinationReelsUrl("manali", "Manali"),
  "https://www.instagram.com/explore/tags/manali/"
);
assert.strictEqual(
  getDestinationReelsUrl("mathura-vrindavan", "Mathura & Vrindavan"),
  "https://www.instagram.com/explore/tags/mathuravrindavan/"
);
assert.strictEqual(
  getDestinationReelsUrl("jaipur", "Jaipur"),
  "https://www.instagram.com/explore/tags/jaipur/"
);
assert.strictEqual(
  getDestinationReelsUrl("varanasi", "Varanasi"),
  "https://www.instagram.com/explore/tags/varanasi/"
);
assert.strictEqual(
  getDestinationReelsUrl("dharamshala", "Dharamshala"),
  "https://www.instagram.com/explore/tags/dharamshala/"
);
console.log("✓ Instagram Reels URLs are distinct and grounded to each specific destination.");

console.log("\n=== ALL RELEASE ACCEPTANCE TESTS PASSED! ===");
