# VANVAS TRAVELLER MEMORY & PERSONALIZATION ENGINE (PHASE 5)

## 1. Overview & Core Mission
The **Traveller Memory & Personalization Engine** establishes a persistent, production-grade memory layer for VANVAS expeditions. It learns actionable travel rhythms (pacing, morning wake-up hours, stay styles, transport choices, activity categories) from voluntary explicit settings and meaningful travel decisions, using those memories to improve future trip recommendations, dynamic itineraries, stay rankings, and Copilot reasoning.

### Non-Negotiable Privacy Principle
> **VANVAS remembers how someone likes to travel, not who they are.**
> Profiling of sensitive personal attributes (religion, political opinions, race, caste, sexuality, or medical health status) is strictly prohibited, filtered out at API ingress, and never stored or inferred.

---

## 2. Memory Taxonomy & Supported Preference Types

| Memory Type | Description | Default Confidence | Source Event | Mutability |
| :--- | :--- | :--- | :--- | :--- |
| **`EXPLICIT`** | Voluntarily configured in Settings or explicitly commanded in Copilot. | `1.0` | `USER_EXPLICIT_SETTING` | Editable / Deletable |
| **`CONFIRMED`** | An `INFERRED` preference reviewed and approved by the traveller. | `1.0` | `USER_CONFIRMED_INFERENCE` | Editable / Deletable |
| **`INFERRED`** | Tentative preference derived from repeated, consistent observations across trips/events. | `0.65` - `0.90` | `REPEATED_OBSERVATIONS` | Editable / Confirmable / Rejectable / Deletable |
| **`TRIP_SPECIFIC`** | Temporary constraint or preference scoped to a single `trip_id`. | `1.0` | `TRIP_SPECIFIC_CONSTRAINT` | Trip-scoped |
| **`OBSERVED`** | Factual single-event logs (e.g., booked a homestay, voted LOVE on stargazing). | N/A | `STAY_SELECTED`, `ACTIVITY_SELECTED`, etc. | Ephemeral audit log |

---

## 3. Database Schema & Models

### `TravellerMemory` (`traveller_memories`)
Stores structured, durable user-scoped travel preferences.
```sql
CREATE TABLE traveller_memories (
    id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    trip_id VARCHAR(100) REFERENCES trips(id) ON DELETE SET NULL,
    category VARCHAR(50) NOT NULL, -- planning_style, timing, activities, accommodation, transport, budget_pace, practical
    preference_key VARCHAR(100) NOT NULL,
    preference_value VARCHAR(255) NOT NULL,
    memory_type VARCHAR(50) NOT NULL DEFAULT 'EXPLICIT', -- EXPLICIT, INFERRED, TRIP_SPECIFIC, OBSERVED
    source_event VARCHAR(100) NOT NULL,
    source_reference VARCHAR(255),
    confidence FLOAT NOT NULL DEFAULT 1.0,
    evidence_count INT NOT NULL DEFAULT 1,
    first_observed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_observed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_confirmed_at DATETIME,
    expires_at DATETIME,
    confirmation_status VARCHAR(50) NOT NULL DEFAULT 'UNCONFIRMED', -- UNCONFIRMED, CONFIRMED, REJECTED, CORRECTED
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, PAUSED, SUPERSEDED, DELETED
    provenance_summary TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ix_traveller_memories_user_status ON traveller_memories(user_id, status);
CREATE INDEX ix_traveller_memories_category ON traveller_memories(user_id, category);
```

### `MemoryObservation` (`memory_observations`)
Stores individual factual choices with idempotency protection.
```sql
CREATE TABLE memory_observations (
    id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    trip_id VARCHAR(100) REFERENCES trips(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    observed_key VARCHAR(100) NOT NULL,
    observed_value VARCHAR(255) NOT NULL,
    idempotency_key VARCHAR(100) UNIQUE,
    source_id VARCHAR(100),
    metadata_json TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ix_memory_observations_user ON memory_observations(user_id, category, observed_key);
```

---

## 4. Deterministic Evidence & Inference Rules

1. **Evidence Threshold**:
   - $\ge 2$ consistent observations across distinct events/trips are required before creating a tentative `INFERRED` preference.
   - A single choice records an observation event but **never** creates a durable long-term memory.
2. **Confidence Curve**:
   - Initial Inferred Confidence: `0.65`
   - Incremental Boost: $+0.10$ per additional consistent observation, capped at `0.90`.
   - `1.0` confidence is strictly reserved for `EXPLICIT` and `CONFIRMED` preferences.
3. **Contradictory Evidence Suppression**:
   - If contradictory choices exceed consistent choices for a given preference key, inference is suppressed or decayed.
4. **Lifecycle & Expiry**:
   - Inferred preferences automatically decay after 180 days if not reinforced or confirmed.

---

## 5. Conflict Resolution Precedence

When building personalization context or scoring candidate options, preferences are resolved with deterministic priority:
$$\text{TRIP\_SPECIFIC (for active trip)} > \text{EXPLICIT (user configured)} > \text{CONFIRMED} > \text{INFERRED } (\text{confidence} \ge 0.6) > \text{Neutral Default}$$

A temporary trip constraint (e.g. *"We need a packed itinerary for this 2-day sprint"*) never overwrites the traveller's persistent global preference (e.g. *"Relaxed pace"*).

---

## 6. Personalization Pipeline & Explainability

```
CANDIDATE OPTIONS
       │
       ▼
HARD CONSTRAINT VALIDATION (Dates, route feasibility, budget limits, availability)
       │
       ▼
MEMORY-AWARE RANKING (+25 to +35 score boosts for matching category/stay/tempo)
       │
       ▼
HONEST EXPLANATION ("Ranked higher because you selected Homestay as your preferred stay type.")
       │
       ▼
USER SELECTION / EDIT / CORRECTION
```

### Explanation Truthfulness
- Explanations reference exact stored evidence counts and preference values.
- If no memory applies, recommendations display neutral editorial reasons (e.g. *"Highly rated destination experience (4.8★)"*).

---

## 7. Granular User Controls (Explorer's Desk)

Integrated directly into `SettingsPage` (`/settings` > **Traveller Memory** tab):
- **Learning Master Toggle**: Instantly enable or disable preference learning.
- **Pause Learning**: Temporarily stop recording new observations without deleting saved data.
- **Review Inferred Preferences**: One-click **Confirm** or **Reject** badges.
- **Inline Editing**: Correct any stored preference value in-place.
- **Quick-Add Explicit**: Directly declare pace, start times, stay types, or dietary needs.
- **Reset Inferred**: Purge tentative learned inferences while preserving explicit settings.
- **Clear All**: Complete one-click purge of all memories and observation history.
- **Data Export**: Included in standardized one-click JSON data export bundle.

---

## 8. Group & Member Isolation

- **Vote Isolation**: When a member casts a `LOVE` vote on a place or circle activity, the observation is attributed solely to that voter.
- **Zero Cross-Attribution**: Group consensus decisions or companion additions never contaminate other members' individual memory profiles.

---

## 9. Ask VANVAS & Copilot Integration

Ask VANVAS natively reasons over active traveller memories:
- **Query**: *"What kind of trips do I usually prefer?"* $\rightarrow$ Summarizes verified active memories.
- **Command**: *"Forget my preference for hostels"* $\rightarrow$ Performs instant backend deletion and confirms.
- **Update**: *"I don't like early starts anymore"* $\rightarrow$ Persists explicit timing preference.
- **Context Injection**: Compactly included in `verified_facts["traveller_memories"]`.

---

## 10. Automated Test Verification Results

Full automated coverage across backend services, API routers, recommendation engines, and context generators:
- **17 Dedicated Memory Tests** (`tests/test_traveller_memory.py`):
  - `test_explicit_preference_create_and_fetch` (Passed)
  - `test_explicit_preference_update` (Passed)
  - `test_single_observation_does_not_create_inferred_preference` (Passed)
  - `test_repeated_observations_create_tentative_inference` (Passed)
  - `test_confirm_inferred_preference` (Passed)
  - `test_explicit_correction_overrides_inferred_preference` (Passed)
  - `test_trip_specific_preference_isolation` (Passed)
  - `test_disabled_learning_blocks_observations_and_inferences` (Passed)
  - `test_sensitive_trait_rejection` (Passed)
  - `test_cross_user_isolation` (Passed)
  - `test_group_vote_isolation` (Passed)
  - `test_individual_memory_deletion_and_clear_all` (Passed)
  - `test_data_export_includes_memories` (Passed)
  - `test_recommendation_scorer_memory_boost_and_explanation` (Passed)
  - `test_dynamic_itinerary_pace_and_timing` (Passed)
  - `test_copilot_context_engine_includes_memories` (Passed)
  - `test_copilot_memory_fast_path_ask_and_forget` (Passed)
- **Frontend Production Build**: Clean Next.js 16.3.5 Turbopack compilation across all 22 static and dynamic routes.
