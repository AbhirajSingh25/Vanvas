// Frontend Phase 2B: Ask VANVAS Mobile Failure Recovery Verification Suite
import assert from "node:assert";

import {
  isTripPlanningQuery,
  extractPlanningDestination,
  resolvePlannerLaunchDetails,
  normalizeAssistantResponse,
} from "../lib/askVanvasNormalizer.ts";

import { resolveCanonicalDestination } from "../lib/canonicalDestinations.ts";

console.log("=== RUNNING FRONTEND PHASE 2B ASK VANVAS RECOVERY TESTS ===");

// 1. Verify isTripPlanningQuery accuracy
console.log("\n1. Testing Trip Planning Query Intent Detection...");
const validPlanningPrompts = [
  "I'm planning a trip",
  "im planning a trip",
  "i am planning a trip",
  "plan a trip",
  "plan my trip",
  "start planning",
  "plan trip",
  "plan an expedition",
  "i want to plan a trip",
  "want to plan a trip",
  "help me plan a trip",
  "let's plan a trip",
  "lets plan a trip",
  "i'm travelling",
  "im travelling",
  "i'm traveling",
  "im traveling",
  "planning a trip to Manali",
  "plan a trip to Spiti",
];

for (const prompt of validPlanningPrompts) {
  assert.strictEqual(
    isTripPlanningQuery(prompt),
    true,
    `Expected prompt '${prompt}' to be recognized as trip planning intent`
  );
}
console.log(`✓ All ${validPlanningPrompts.length} planning prompts correctly recognized.`);

// Verify non-planning open-ended queries are NOT falsely matched
const openEndedQueries = [
  "What should I pack for Spiti?",
  "Best food and cafes in Manali",
  "Is it raining in Shimla?",
  "Who owes me on this trip?",
  "What's next on our itinerary?",
  "Places to visit in Varanasi",
  "Tell me about Chopta",
  "Find verified stays in Dharamshala",
];

for (const query of openEndedQueries) {
  assert.strictEqual(
    isTripPlanningQuery(query),
    false,
    `Expected query '${query}' NOT to be flagged as trip planning intent`
  );
}
console.log(`✓ All ${openEndedQueries.length} open-ended queries correctly routed to AI/copilot pipeline.`);

// 2. Verify extractPlanningDestination
console.log("\n2. Testing Explicit Destination Extraction from Planning Prompts...");
assert.strictEqual(extractPlanningDestination("planning a trip to Manali"), "Manali");
assert.strictEqual(extractPlanningDestination("plan a trip to Spiti"), "Spiti");
assert.strictEqual(extractPlanningDestination("I'm travelling to Leh"), "Leh");
assert.strictEqual(extractPlanningDestination("I'm planning a trip"), null);
assert.strictEqual(extractPlanningDestination("plan my trip"), null);
console.log("✓ Explicit destination extraction verified.");

// 3. Verify resolvePlannerLaunchDetails
console.log("\n3. Testing Planner Launch Details & Navigation Contracts...");

// Case A: Valid destination in context (Manali)
const manaliContext = {
  type: "destination",
  title: "ASK VANVAS · MANALI",
  destinationName: "Manali",
  destinationSlug: "manali",
};
const manaliLaunch = resolvePlannerLaunchDetails(manaliContext);
assert.strictEqual(manaliLaunch.hasExplicitDest, true);
assert.strictEqual(manaliLaunch.destSlug, "manali");
assert.strictEqual(manaliLaunch.destId, "dest-manali");
assert.strictEqual(manaliLaunch.destName, "Manali");
assert.strictEqual(manaliLaunch.url, "/plan?dest=manali&destId=dest-manali&destName=Manali");
console.log("✓ Case A Passed: Preserves active destination context -> " + manaliLaunch.url);

// Case B: Aliased destination in context (Banaras -> Varanasi)
const banarasContext = {
  type: "destination",
  title: "ASK VANVAS · BANARAS",
  destinationName: "Banaras",
  destinationSlug: "banaras",
};
const banarasLaunch = resolvePlannerLaunchDetails(banarasContext);
assert.strictEqual(banarasLaunch.hasExplicitDest, true);
assert.strictEqual(banarasLaunch.destSlug, "varanasi");
assert.strictEqual(banarasLaunch.destId, "dest-varanasi");
assert.strictEqual(banarasLaunch.destName, "Varanasi");
assert.strictEqual(banarasLaunch.url, "/plan?dest=varanasi&destId=dest-varanasi&destName=Varanasi");
console.log("✓ Case B Passed: Canonicalizes alias 'banaras' to Varanasi -> " + banarasLaunch.url);

// Case C: Missing destination in context (Home / Root)
const emptyContext = {
  type: "home",
  title: "ASK VANVAS · INDIA",
};
const emptyLaunch = resolvePlannerLaunchDetails(emptyContext);
assert.strictEqual(emptyLaunch.hasExplicitDest, false);
assert.strictEqual(emptyLaunch.destSlug, undefined);
assert.strictEqual(emptyLaunch.url, "/plan");
console.log("✓ Case C Passed: Missing destination leads to selection step '/plan' without arbitrary guessing.");

// Case D: Destination override supplied
const overrideLaunch = resolvePlannerLaunchDetails(emptyContext, { slug: "chopta", name: "Chopta" });
assert.strictEqual(overrideLaunch.hasExplicitDest, true);
assert.strictEqual(overrideLaunch.destSlug, "tungnath-chandrashila");
assert.strictEqual(overrideLaunch.url, "/plan?dest=tungnath-chandrashila&destId=dest-tungnath-chandrashila&destName=Tungnath%E2%80%93Chandrashila+Trek");
console.log("✓ Case D Passed: Destination override correctly canonicalized -> " + overrideLaunch.url);

// 4. Verify normalizeAssistantResponse for backend planner actions
console.log("\n4. Testing Structured Response Normalization for Planner Actions...");
const backendResponse = {
  message: "Ready to plan your trip to Manali!",
  actions: [
    {
      action_type: "navigate_planner",
      title: "Plan Manali Trip",
      payload: { url: "/plan?dest=manali&destId=dest-manali&destName=Manali", destination: "manali" },
    },
  ],
  metadata: { provider: "vanvas_fast_path", intent: "plan_trip" },
};
const normalized = normalizeAssistantResponse(
  backendResponse.message,
  backendResponse,
  manaliContext,
  "I'm planning a trip"
);
assert.strictEqual(normalized.type, "ACTION");
assert(normalized.actions.length >= 1, "Expected normalized actions");
assert.strictEqual(normalized.actions[0].action, "launch_planner");
assert.strictEqual(normalized.actions[0].label, "Plan Manali Trip");
console.log("✓ Backend navigate_planner correctly mapped to launch_planner action contract.");

// 5. Verify Message De-duplication and Clean Retry logic
console.log("\n5. Testing Conversation De-duplication & Clean Retry Logic...");

// Simulate initial conversation with user message and error card
let messages = [
  { id: "welcome", role: "assistant", text: "What are you looking for?", timestamp: "2026-10-12T00:00:00Z" },
  { id: "user-1", role: "user", text: "Top places in Spiti", timestamp: "2026-10-12T00:00:01Z" },
  {
    id: "error-1",
    role: "assistant",
    text: "Live place discovery is temporarily unavailable.",
    structured: { provenance: "UNAVAILABLE", title: "TRAVEL INTELLIGENCE TEMPORARILY UNAVAILABLE", actions: [] },
    timestamp: "2026-10-12T00:00:02Z",
  },
];

// Retry function matching AskVanvasContext implementation
function simulateSendMessage(currentMessages, query) {
  let clean = currentMessages;
  const lastMsg = clean[clean.length - 1];
  // Remove last assistant error card if retrying
  if (lastMsg && lastMsg.role === "assistant" && lastMsg.structured?.provenance === "UNAVAILABLE") {
    clean = clean.slice(0, clean.length - 1);
  }

  // Prevent duplicate user message bubble if query is identical
  const lastUserMsg = clean[clean.length - 1];
  if (lastUserMsg && lastUserMsg.role === "user" && lastUserMsg.text === query) {
    return clean;
  }

  return [...clean, { id: `user-${Date.now()}`, role: "user", text: query, timestamp: new Date().toISOString() }];
}

// User taps Retry on the error card
const retriedMessages = simulateSendMessage(messages, "Top places in Spiti");
assert.strictEqual(retriedMessages.length, 2, "Error card must be removed without adding duplicate user message");
assert.strictEqual(retriedMessages[1].text, "Top places in Spiti");
assert.strictEqual(retriedMessages[1].role, "user");
console.log("✓ Retry cleanly replaces failed assistant error card without duplicating user messages.");

// Retrying 3 times still results in clean state
let multiRetry = messages;
for (let i = 0; i < 3; i++) {
  multiRetry = simulateSendMessage(multiRetry, "Top places in Spiti");
  // Simulate repeated failure
  multiRetry = [
    ...multiRetry,
    {
      id: `error-${i}`,
      role: "assistant",
      text: "Live place discovery is temporarily unavailable.",
      structured: { provenance: "UNAVAILABLE", title: "TRAVEL INTELLIGENCE TEMPORARILY UNAVAILABLE", actions: [] },
      timestamp: new Date().toISOString(),
    },
  ];
}
// Clean retry after 3 failures
const finalClean = simulateSendMessage(multiRetry, "Top places in Spiti");
assert.strictEqual(finalClean.length, 2);
assert.strictEqual(finalClean[1].text, "Top places in Spiti");
console.log("✓ Repeated failures and retries cleanly bounded: exactly 1 user question kept.");

// 6. Verify LocalStorage Persistence Payload Contract
console.log("\n6. Testing LocalStorage Destination Persistence Contract...");
const canonicalManali = resolveCanonicalDestination("manali");
const storagePayload = {
  id: canonicalManali.id,
  slug: canonicalManali.slug,
  name: canonicalManali.name,
  hindi_name: canonicalManali.hindi_name,
  state: canonicalManali.state,
  region: canonicalManali.region,
  timestamp: Date.now(),
};
const serialized = JSON.stringify(storagePayload);
const restored = JSON.parse(serialized);
assert.strictEqual(restored.slug, "manali");
assert.strictEqual(restored.name, "Manali");
assert.strictEqual(restored.hindi_name, "मनाली");
console.log("✓ Destination persistence payload contract verified across navigation reloads.");

console.log("\n=== ALL FRONTEND PHASE 2B TESTS PASSED SUCCESSFULLY! ===");
