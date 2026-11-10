# VANVAS — Permanent Architectural & Product Decisions

> **Record of Core Decisions, Design Philosophies, and Engineering Invariants**  
> *Every decision records context, reasoning, and system consequences.*

---

## 1. Product Identity: Authentic Indian Travel Operating Layer
- **Decision:** VANVAS is built as an artisan Indian travel companion and Himalayan operating layer, not a generic enterprise SaaS dashboard or cookie-cutter booking tool.
- **Reasoning:** Travel in India—especially in high-altitude mountain regions like Himachal Pradesh, Ladakh, and Uttarakhand—is organic, unpredictable, and culturally rich. Travellers do not need rigid gantt charts; they need intuitive pacing, check-in window reasoning, luggage drop logic, mountain terrain transit estimations, and spontaneous replanning.
- **Consequences:** All UI copy, micro-interactions, empty states, and visual elements must embody warm hospitality, natural textures, and travel-journal aesthetics. Never reduce the experience to sterile enterprise grids.

---

## 2. Visual Identity: Bespoke Painterly Gouache Illustrations
- **Decision:** All destinations, places, stays, and vehicles must use bespoke full-frame painterly gouache travel-journal artwork. Flat vector clipart, abstract wavy geometric mountains, generic stock photography, and AI images with embedded typography or labels are strictly forbidden.
- **Reasoning:** Flat vectors strip the soul from ancient temples, high-altitude monasteries, and pine ridges. Furthermore, AI-generated images with embedded text or coordinates produce garbled, unreadable typography that destroys user trust.
- **Consequences:**
  - When generating new assets, strict negative prompts must prohibit words, letters, labels, watermarks, stamps, and coordinates.
  - If high-fidelity artwork is pending generation, the system must display an honest, transparent diagnostic fallback rather than substituting mismatched stock photography.

---

## 3. Dual-Platform Equivalence: Web & Native Mobile as Co-Equal Citizens
- **Decision:** The Next.js Web PWA (`frontend/`) and the Expo React Native App (`mobile/`) are equally important first-class platforms sharing domain contracts and design tokens via `@vanvas/shared`.
- **Reasoning:** Travellers research and plan trips on desktop browsers, but execute itineraries on the trail using smartphones where network connectivity is intermittent.
- **Consequences:**
  - Feature parity must be maintained across both platforms for core journeys (Explore, Plan, Trip Itinerary, "I'M HERE" arrival mode).
  - The native mobile app must be built with 100% native React Native components—never web views wrapped in mobile containers.

---

## 4. Discovery Experience: Universal Single-Row Touch Carousels
- **Decision:** All place, hotel, and rental discovery rails across both mobile and desktop viewports must be structured as strict, horizontal single-row touch carousels. Staggered two-row carousels and vertical grids are explicitly forbidden.
- **Reasoning:** Staggered two-row carousels create visual clutter, break eye tracking, and create clumsy swipe mechanics on mobile devices. Single-row horizontal carousels with native CSS/gesture snap provide a clean, predictable, magazine-style browsing rhythm.
- **Consequences:**
  - `HorizontalCarousel.tsx` and native `PlaceCard` rails must remain single-row.
  - Native gesture handling on mobile must preserve fluid flick-to-swipe physics without competing pointer events.

---

## 5. Mountain Mobility & Spiti Expedition Realism
- **Decision:** Transit times across mountainous terrains must include topography scaling factors (1.45x). For Spiti Valley motorcycle expeditions, the system must mandate valid Gateway Pickup Hubs (Shimla, Chandigarh, Manali) and display legal warnings regarding Kaza local commercial rental restrictions.
- **Reasoning:** Mountain roads cannot be traversed at highway speeds. Furthermore, the Spiti Valley commercial taxi and rental motorcycle union strictly prohibits outside commercial yellow-plate rental vehicles from operating within Spiti. Travellers renting outside must use private white-plate arrangements or switch to local Kaza rentals.
- **Consequences:**
  - Trip planning to Spiti via motorcycle must surface Gateway hub selection, Kunzum Pass seasonal advisories, and prominent rental restriction notices.
  - The destination ID for Spiti must never be overwritten by the pickup hub.

---

## 6. Core Experience Suite: High-Value Travel Capabilities
- **Decision:** The core feature suite—comprising **Ask VANVAS** (contextual AI copilot), **"I'M HERE"** (arrival micro-scheduler), **TripMap** (geographic clustering), **Travel Ledger** (expense tracking and bill split), **Nearby Radar** (live GPS POIs), and **Group Circles** (anonymous voting)—must be preserved and hardened.
- **Reasoning:** These features form the competitive differentiation of VANVAS over static guidebooks and generic OTAs.
- **Consequences:** Never remove or bypass these capabilities during refactoring or UI simplification tasks.

---

## 7. Data Honesty & Provenance
- **Decision:** The platform must never fabricate prices, reviews, phone numbers, or operational hours. Missing information must be presented truthfully as empty or pending.
- **Reasoning:** Fabricating travel data in remote Himalayan regions can leave travellers stranded without fuel, lodging, or transport.
- **Consequences:** Automated tests enforce that fallback states are clearly flagged, live OSM attributes are preserved without hallucination, and asset mappings match physical files.

---

## 8. Offline Resilience: Mobile Local Storage & Web Caching
- **Decision:** Native mobile must persist destinations, places, active trips, and theme settings locally via SQLite and SecureStore. The web app must leverage Service Workers and Capacitor network listeners.
- **Reasoning:** Network blackouts are common in mountain passes, deep valleys, and high-altitude trails. Travellers must be able to view their vouchers, daily itinerary, and emergency coordinates offline.
- **Consequences:**
  - `mobile/src/services/db.ts` caches full trip snapshots upon generation.
  - A persistent `ConnectionBanner` notifies users of offline state without blocking navigation.

---

## 9. Architectural Stability: No Unnecessary Rewrites
- **Decision:** The existing monorepo architecture (FastAPI + Next.js + Expo + Shared) is stable, well-typed, and functional. No broad rewrites or migration to other frameworks is permitted.
- **Reasoning:** Unnecessary rewrites destroy hard-won edge case fixes, regressions in API schemas, and mobile-native integration.
- **Consequences:** Development sessions must focus on additive improvements, bug resolution, and artwork completion rather than architectural restructuring.

---

## 10. Production Safety: Strict Verification Before Deployment
- **Decision:** No commit may be pushed to `main` without passing TypeScript typechecks (`tsc --noEmit` on both mobile and web), Expo Doctor diagnostic health checks, and relevant pytest invariant suites.
- **Reasoning:** Broken code on `main` immediately triggers automatic Vercel and Render deployments, which can cause production downtime for real users.
- **Consequences:** Always run local typechecks, expo doctor, and backend tests prior to staging and pushing commits.

---

## 11. Android Native Identity & Play Store Compliance
- **Decision:** Preserve `ai.vanvas.app` as the canonical Android package identity; modernize target SDK to 36 (Android 16+ ready) with compileSdkVersion 37 under Expo SDK 58 and React Native 0.88; enforce 100% native UI with zero WebViews.
- **Reasoning:** Changing established application IDs breaks existing keystore configurations and build integrity. Android 16 (API 36) alignment satisfies and exceeds Google Play store publishing guidelines while modern photo pickers eliminate obsolete broad storage permissions.
- **Consequences:** Keep `mobile/` standalone, dual-platform clean, and preserve all SQLite offline capabilities.

---

## 12. Account Deletion Governance: Standalone Portal & In-Memory Isolation
- **Decision:** To fulfill Google Play Data Safety account deletion requirements without modifying the frozen `frontend/` production web app, provide a dedicated standalone static portal at `account-deletion-site/` deployed independently. The portal operates strictly in-memory (zero localStorage, zero cookies) and calls the backend `/api/v1/auth/delete-account` endpoint with password confirmation.
- **Reasoning:** Google Play requires a publicly accessible web link where users can request full deletion of their account and associated data without installing the app. Modifying `frontend/` was forbidden by the strict freeze directive.
- **Consequences:**
  - `account-deletion-site/` is hosted independently or statically mapped.
  - Backend cascading deletion in `backend/app/api/v1/auth.py` and `backend/app/models/models.py` cascades to expense shares, settlements, trips, and clears stored avatar photos.
