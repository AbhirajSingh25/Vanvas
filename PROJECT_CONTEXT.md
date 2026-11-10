# VANVAS — Permanent Project Context & Architecture Master

> **Primary Source of Truth for Architecture, System Contracts, and Feature Status**  
> *Latest Verified Checkpoint:* Commit `a969a9f` | *Preceding Commits:* `5192108`, `df29183`, `6cebba3`, `7d81a79`, `d6bf4ba`, `bd54384`, `01a74ff`, `a840b75`, `6feee0f`, `e4822c5`, `1fd8f48` | *Branch:* `main` | *Date:* November 10, 2026

---

## 1. Product Identity & Vision

- **Product Name:** VANVAS (vanvasai)
- **Creator/Brand:** *The Sorted Club*
- **Motto:** *"Travel should feel spontaneous. The planning should not."*
- **Vision:** A production-grade travel operating layer and AI companion designed for spontaneous travellers across the Indian subcontinent. VANVAS bridges transit arrival hubs, hotel check-ins, luggage drop timing, local scooter/motorcycle mobility, curated culinary stops, geographic clustering, and real-time mountain journey dynamics (weather, fatigue, delays, budget constraints).
- **Aesthetic Direction:** Authentic Indian visual heritage + Himalayan pine forests + mist overlays + warm natural paper journals + brass & terracotta accents. Full-frame painterly gouache travel-journal artwork. **Zero flat-vector clip art, zero stock photo substitutions, zero embedded AI typography.**
- **Color Tokens:**
  - Deep Forest (`#17352C` / `#173B32`)
  - Pine Green (`#285447` / `#2D5A43`)
  - Mist Overlay (`#DCE3DD` / `#D8CED1`)
  - Warm Ivory / Parchment (`#FAF4E8` / `#F3EEE3`)
  - Natural Paper Subsurface (`#EFE5D2` / `#E9E1D1`)
  - Terracotta Accent (`#C85A32` / `#A9573B`)
  - Earth Bronze / Muted Brass (`#B89A63` / `#8A6547`)
  - Night Charcoal (`#0A100D` / `#111A16` / `#20211D`)

---

## 2. Complete Project Architecture

The VANVAS platform is a monorepo containing dual first-class clients (Web PWA + Native Mobile), a shared TypeScript contract package, and an asynchronous Python FastAPI backend.

```
VANVAS/
├── backend/                  # FastAPI 0.110 (Python 3.11 / 3.14)
│   ├── app/
│   │   ├── api/v1/          # Modular API Routers (21 domain routers)
│   │   ├── core/            # Security, JWT, CORS & Config
│   │   ├── database/        # SQLAlchemy Engine, SessionLocal & Schema Migrations
│   │   ├── itinerary/       # Clustering, Day Generator, Replanner, Arrival Optimizer
│   │   ├── models/          # SQLAlchemy Database Models (22 entity models)
│   │   ├── providers/       # Live & Curated Provider Adapters (OSM, Amadeus, Weather, Artwork)
│   │   ├── recommendation/  # Weighted Scoring & TSP Route Optimization
│   │   ├── schemas/         # Pydantic Schemas for Request/Response validation
│   │   ├── seed/            # Canonical Datasets (26 Destinations, Places, Stays, Rentals)
│   │   └── services/        # Mobility, Cache, Weather, Flight, Auth, and Email Services
│   ├── tests/               # Pytest Automated Test Suite (85+ test files)
│   └── requirements.txt
│
├── frontend/                 # Next.js 14+ App Router (TypeScript + Tailwind CSS)
│   ├── app/                 # Web Routes (SSR & Client Components)
│   ├── components/          # Brand Logo, Carousels, Drawers, Copilot, Mist Overlays
│   ├── context/             # AuthContext, ThemeContext
│   ├── lib/                 # API Client, placeVisualResolver, canonicalRegistryData
│   ├── public/              # Static Assets, WebP Illustrations, entity_art_manifest.json
│   └── types/               # TypeScript Data Contracts
│
├── mobile/                   # React Native Native App (Expo SDK 58 + Expo Router 58 + React Native 0.88)
│   ├── app/                 # File-based Navigation ((tabs), auth, destination, road-trip, treks)
│   ├── src/
│   │   ├── components/      # DestinationCard, PlaceCard, ReelsCarousel, ConnectionBanner
│   │   ├── context/         # AuthContext, ThemeContext (persistent dark/light & density)
│   │   ├── services/        # Native API client (resolveImageUrl), SQLite offline db, SecureStore
│   │   └── theme/           # Native Theme Tokens & Semantic Colors
│   └── app.json             # Expo App Manifest (ai.vanvas.app, v0.4.0, code 4, Target SDK 36)
│
├── account-deletion-site/   # Standalone Account & Data Deletion Portal (Google Play Compliant)
│   ├── index.html           # Accessible, standalone responsive portal (Zero cookies/localStorage)
│   ├── vercel.json          # Deployment configuration & security headers
│   └── README.md            # Architecture & Google Play compliance documentation
│
├── packages/
│   └── shared/              # Dual-Platform Shared Package (@vanvas/shared)
│       └── src/
│           ├── constants/   # Authoritative Artwork Lookup (729 entries) & universal resolver
│           ├── tokens/      # Typography, Spacing, Elevation tokens
│           └── types/       # Shared TypeScript domain contracts
│
├── .github/
│   └── workflows/           # CI Pipeline (ci.yml) & Android APK Release (android-apk.yml)
└── scripts/                 # Maintenance, validation, and audit scripts
```

---

## 3. Web Frontend Architecture & Critical Routes

- **Framework:** Next.js 14+ App Router, React 18, TypeScript, Tailwind CSS, Lucide React, Framer Motion.
- **Production URL:** `https://vanvasai.vercel.app`
- **Hosting:** Vercel (Auto-deployed from branch `main`).
- **Key Routes:**
  - `/`: Home discovery landing page, featured destination hero, quick actions, single-row category rails.
  - `/explore`: Grid of 26 canonical destinations with geographic, climate, and vibe filters.
  - `/explore/[slug]`: Rich destination hub featuring painterly hero artwork, synchronized single-row touch-carousels for Places, Stays (hotels & homestays), and Mobility (scooter & bike fleet), plus interactive audio reels and weather summary.
  - `/explore/[slug]/stays`: Full accommodation directory with authentic imagery and verified amenities.
  - `/plan`: 10-step interactive wizard calculating paced multi-day itineraries, transport gateway logic (flights, trains, buses, motorcycles), accommodation tiering, and activity clustering.
  - `/trips`: My Trips dashboard, active trip previews, saved itineraries.
  - `/trips/[id]`: Interactive day-by-day itinerary manager, real-time replanner ("I'm Late", "I'm Tired", "It's Raining"), interactive map markers, and day transit cards.
  - `/trips/[id]/im-here`: Dedicated arrival execution mode showing first 3-hour plan, nearest morning chai/breakfast, luggage drop logic, and check-in countdown.
  - `/trips/[id]/journal`: Memory journal, photo uploads, trip reflections.
  - `/nearby`: GPS-based Nearby Radar surfacing live places, fuel stations, and cafes along mountain corridors.
  - `/road-trip`: Curated Indian driving corridors (e.g., Delhi to Spiti, Manali to Leh) with waypoints, fuel checkpoints, and toll estimators.
  - `/treks`: Himalayan trekking routes (Tungnath, Chandrashila, Kheerganga, Triund) with difficulty ratings and trailheads.
  - `/solo`: Solo traveler circle matching and interest-based travel pods.
  - `/bookings`: Direct reservation pass-through and itinerary booking status.
  - `/admin`: Provider health console, latency trackers, and live API fallback toggles.

---

## 4. Native Mobile Architecture & Navigation (`mobile/`)

- **Framework:** 100% Native React Native via Expo SDK 58 (`expo ~58.0.23`), Expo Router 58, React Native 0.88.1, React 19.3.0, Node.js 22 LTS.
- **Application ID:** `ai.vanvas.app` (Android v0.4.0, versionCode 4, Target SDK 36, compileSdkVersion 37).
- **Navigation Structure:**
  - Tab Navigator (`(tabs)/_layout.tsx`):
    - `index.tsx` (Home): Personalized recommendations, active trip summary card, search trigger, offline banner.
    - `explore.tsx` (Explore): Destination discovery, video reels with AppState background pause and `usePathname()` screen focus handling, region filters.
    - `plan.tsx` (Plan): Full mobile trip planner with **Motorcycle Expedition Mode**, gateway hubs (Shimla, Chandigarh, Manali with seasonal Kunzum Pass advisory), Kaza commercial rental warning, and estimated daily rates.
    - `trips.tsx` (Trips): Offline-capable trip list, status filters (upcoming, active, completed).
    - `profile.tsx` (Profile): User profile, avatar management, theme switcher (Auto/Light/Dark), layout density toggle (Standard/Compact), Change Password modal, and Google Play compliant in-app Delete Account modal with mandatory password confirmation, irreversible data warning, and local SQLite/SecureStore private data cleanup (`purgeUserAccountData`).
  - Stack Screens:
    - `destination/[slug].tsx`: Native destination detail with authentic WebP artwork, single-row touch carousels for Places, Stays, and Fleet, with absolute URL resolution via `resolveImageUrl()`.
    - `trip/[id].tsx`: Day-by-day itinerary view with dynamic replanning triggers.
    - `trip/[id]/im-here.tsx`: Mobile arrival mode with one-tap directions and luggage logic.
    - `road-trip/index.tsx`: Mobile road trip corridor guide.
    - `treks/index.tsx`: Trailhead guides and elevation profiles.
    - `ask-vanvas.tsx`: Mobile travel assistant copilot.
    - `auth/login.tsx`, `auth/register.tsx`, `auth/verify-email.tsx`: Authentication flows with SecureStore token persistence.

---

## 5. Backend Architecture, APIs & Database

- **Framework:** FastAPI 0.110 on Python 3.11 / 3.14.
- **Production API URL:** `https://vanvas-api.onrender.com`
- **Hosting:** Render (Dockerized web service, auto-deploy from branch `main`).
- **Database:**
  - Development / Zero-Config: SQLite (`vanvas.db`).
  - Production: PostgreSQL via SQLAlchemy 2.0 async engine.
  - Migrations: Automated idempotent runtime schema migrations via `ensure_database_schema()` in `backend/app/database/session.py`.
- **API Domain Modules (`backend/app/api/v1/`):**
  - `auth.py`: Registration, login, JWT token issue/refresh, Brevo email OTP verification.
  - `destinations.py`: 26 canonical destinations, regional groupings, seasonal metadata.
  - `places.py`: POI listings, geographic clustering, place visual resolution.
  - `artwork.py`: Authoritative artwork manifest provider and visual resolution lookup.
  - `mobility.py`: Rental fleet directory (scooters, bullets, 4x4s), OSM Overpass integration, Spiti gateway advice.
  - `trips.py`: Multi-day itinerary generation, arrival optimizer, dynamic replanning.
  - `copilot.py`: Context-aware travel assistant (Ask VANVAS) with location and budget awareness.
  - `budget.py`: Expense logging, categorized tracking, shared group bill splitting.
  - `checklist.py`: Packing lists and trip preparation checklists.
  - `road_trip.py`: Multi-day driving routes, fuel checkpoints, and scenic waypoints.
  - `group.py` & `circles.py`: Group invite codes, member voting, solo traveler circles.
  - `memory.py` & `intelligence.py`: Traveler memories, contextual travel signals, and replan proposals.
  - `admin.py` & `app_info.py`: System health, runtime diagnostics, provider metrics.

---

## 6. Authentication & Authorization

- **Scheme:** Stateless JWT Bearer Authentication (`HS256`).
- **Token Expiry:** Configurable (default 10,080 minutes / 7 days).
- **Email Verification:** Transactional OTP delivery via Brevo REST API (10-minute expiry, 60s cooldown, 5 max attempts).
- **Guest / Demo Mode:** Seamless unauthenticated exploration with demo traveler session in local state.
- **Mobile Token Storage:** Hardware-backed encrypted storage via `expo-secure-store`.

---

## 7. Shared Package & Design Tokens (`@vanvas/shared`)

- **Package Path:** `packages/shared/` (builds to `dist/`).
- **Contents:**
  - `colors`: Semantic color constants (forest, terracotta, parchment, mist, night tokens).
  - `tokens`: Layout spacing, border radii, typography sizing.
  - `constants/artworkManifest.ts`: Authoritative runtime artwork lookup dictionary (`AUTHORITATIVE_ARTWORK_LOOKUP`) with 729 approved assets.
  - `constants/index.ts`: Unified export providing `resolveUniversalArtwork()`.

---

## 8. Third-Party Integrations & External Services

| Service | Provider / Protocol | Role in VANVAS | Fallback Strategy |
|---|---|---|---|
| **Rental Directory** | OpenStreetMap (Overpass API) | Live motorcycle & scooter rental shops | Curated canonical rental dataset |
| **Accommodations** | Amadeus API / Live Provider | Live hotel availability & rates | Curated canonical stay dataset |
| **Weather** | OpenWeatherMap API | Live mountain weather & rain alerts | Seasonal historical climate models |
| **Transactional Email** | Brevo HTTPS REST API | Verification OTPs & trip invites | Development mock logger |
| **Artwork Generation** | Imagen 3 / Gemini Image API | Travel-journal gouache art | High-fidelity WebP asset registry |

---

## 9. Deployment Architecture & Production URLs

- **Web Frontend:** `https://vanvasai.vercel.app` (Vercel, Node.js 20).
- **Backend API:** `https://vanvas-api.onrender.com` (Render, Python 3.11).
- **Android Builds:** GitHub Actions workflow `.github/workflows/android-apk.yml` produces release/debug APKs.

---

## 10. Core Product Features & Implementation Status

| Feature | Scope | Implementation Status | Notes |
|---|---|---|---|
| **26 Canonical Destinations** | Backend & Frontend | **VERIFIED COMPLETE** | All 26 destinations seeded with coordinates, hero artwork, and vibe tags. |
| **Universal Single-Row Carousels** | Web & Native | **VERIFIED COMPLETE** | Places, Stays, and Fleet render strictly as horizontal touch carousels. |
| **Spiti Motorcycle Expedition Mode** | Web & Native | **VERIFIED COMPLETE** | Gateway hubs (Shimla, Chandigarh, Manali), Kunzum Pass advisory, and Kaza rental restriction warnings wired into trip creation. |
| **Reconciled Artwork Manifest** | Shared, Web & Mobile | **VERIFIED COMPLETE** | 729 assets mapped with unique hashes; 14 stale entries cleared; 52 vehicles migrated to WebP. |
| **Artwork Runtime Invariants** | Backend Pytest | **VERIFIED COMPLETE** | 6/6 tests passing in `test_artwork_runtime_invariants.py`. |
| **Native Mobile App Core** | React Native / Expo | **VERIFIED COMPLETE** | Expo Doctor 18/18 checks passing, 0 TypeScript errors. Native navigation, theme switcher, reels pause on background. |
| **"I'M HERE" Arrival Mode** | Web & Native | **VERIFIED COMPLETE** | First 3-hour micro schedule, luggage drop logic, breakfast finder. 5/5 tests passing in `test_arrival_im_here.py`. |
| **Dynamic Replanner** | Web & Backend | **VERIFIED COMPLETE** | One-tap schedule adjustments ("I'm Late", "I'm Tired", "It's Raining"). |
| **Offline Persistence (Native)** | Mobile | **VERIFIED COMPLETE** | SQLite snapshot storage, SecureStore preferences, ConnectionBanner offline state indicator. |
| **10 Remaining Gouache Artworks** | Artwork Assets | **PARTIALLY IMPLEMENTED** | 10 place artworks (5 Dharamshala + 5 Kasol) pending image-generation quota reset (Nov 13, 2026). Currently using honest diagnostic fallback state. |
| **Mobility Directory Tests** | Backend Pytest | **NEEDS VERIFICATION** | 2 test assertions in `test_mobility_directory.py` need update from `.jpg` to `.webp`. |

---

## 11. Offline Functionality & Data Synchronization

- **Web (PWA):** Service worker caching static assets and destination manifests with Capacitor network listeners.
- **Mobile (React Native):**
  - `mobile/src/services/db.ts`: Local SQLite WAL database caching destinations, places, active trip itineraries, offline expenses, and pending mutation queues.
  - **Account-Scoped Offline Isolation & Privacy:** Additive schema migration introduces `user_id TEXT NOT NULL` on `expenses_cache` and `offline_mutation_queue`, composite `PRIMARY KEY (trip_id, user_id)` on `user_trips_cache` and `trip_details_cache`, and performance indexes. All private queries require verified `user_id` with zero `OR user_id IS NULL` leakage. Legacy unowned rows are safely quarantined.
  - **Single-Owner Deletion Teardown:** `AuthContext.deleteAccount` solely manages session teardown, private cache purging, and React state reset in `try/finally` blocks. Local SQLite cleanup failures fail open without reporting false server rejection.
  - **Mutation Replay Deduplication:** Interrupted expense sync reconciles via `offline_client_id` inside `receipt_data_json` before posting, preventing duplicate expenses on network reconnections.
  - **In-Memory Fallback Parity:** In-memory keys are strictly user-scoped (`trip_detail_${userId}_${tripId}`, `expenses_${userId}_${tripId}`, `user_trips_${userId}`) with fail-safe migration blocking on verification errors.
  - `mobile/src/services/storage.ts`: Encrypted storage for authentication tokens and user UI preferences via `expo-secure-store`.
  - `mobile/src/components/ConnectionBanner.tsx`: Top banner alerting users when offline while serving cached itinerary items seamlessly.

---

## 12. Testing Infrastructure & Verified Results

1. **Full Backend Pytest Regression:**
   - Command: `python -m pytest backend/tests`
   - Result: **748 passed, 1 skipped, 0 failed, 10 deselected (100% pass rate)**.
2. **Account Deletion Governance Suite:**
   - Command: `python -m pytest backend/tests/test_account_deletion_governance.py`
   - Result: **22 passed, 0 failed (100% pass rate)**.
3. **Mobile Offline Isolation & Reliability Suite:**
   - Command: `node scripts/test_offline_isolation_and_account_deletion.mjs`
   - Result: **20 passed, 0 failed (100% pass rate executing actual production `offlineDb` methods)**.
4. **Artwork Invariants Test Suite:**
   - Command: `python -m pytest backend/tests/test_artwork_runtime_invariants.py`
   - Result: **6 passed, 0 failed (100% pass rate)**.
5. **Mobile TypeScript Verification:**
   - Command: `cd mobile && npm run typecheck`
   - Result: **0 errors**.
6. **Mobile Expo Health & Configuration:**
   - Command: `cd mobile && npx expo config --type public`
   - Result: **Passed (code 0, SDK 58.0.23, targetSdk 36, compileSdk 37)**.
7. **Frontend State:**
   - Result: **100% frozen (0 lines modified)**.
8. **Shared Package Build:**
   - Command: `cd packages/shared && npm run build`
   - Result: **0 errors (clean compilation to dist/)**.

---

## 13. Current Git Branch, HEAD Commit & Checkpoint

- **Current Branch:** `main`
- **Remote Origin:** `https://github.com/AbhirajSingh25/Vanvas.git`
- **Starting Checkpoint:** `51880e9` (`docs(context): sync context files to commit a969a9f`)
- **Preceding Implementation Checkpoint:** `a969a9f` (`feat(mobile): single-owner account deletion teardown and account-scoped offline data isolation`)
- **Status:** Pristine working tree, perfectly synchronized with `origin/main`.

---

## 14. Known Issues, Technical Debt & Action Items

1. **Pending Artwork Batch (10 Entities):**
   - Generation model quota exhausted until **November 13, 2026**.
   - Pending entities:
     - Dharamshala (5): Gyuto Monastery, Dal Lake Dharamshala, Tibetan Butter Tea & Tingmo Bakery Lane, Masroor Rock-Cut Temples, Tashi Jong Buddhist Craft Community.
     - Kasol (5): Manikaran Sahib, Tosh Village, Moon Dance Café, Evergreen Café, Kheerganga Meadow.
   - Automation script prepared: `scripts/generate_pending_artwork_batch.py` with strict negative prompts (dry-run verified).
   - *Requirement on quota reset:* Generate clean painterly gouache illustrations with **ZERO embedded text, typography, coordinates, or watermarks**.
2. **Pydantic V2 Class-Based Config Warnings:**
   - Non-fatal deprecation warnings in `backend/app/schemas/schemas.py` (`PydanticDeprecatedSince20: Support for class-based config is deprecated, use ConfigDict instead`).

---

## 15. Important Directories & Critical Files

- `backend/app/seed/canonical_dataset.py`: Primary seed data for 26 destinations and places.
- `backend/app/seed/authoritative_artwork_manifest.json`: Single source of truth for backend artwork metadata.
- `packages/shared/src/constants/artworkManifest.ts`: Shared TypeScript artwork lookup.
- `frontend/lib/placeVisualResolver.ts`: Web artwork resolver and fallback governor.
- `mobile/src/services/api.ts`: Native API adapter and image URL resolver.
- `mobile/app/(tabs)/plan.tsx`: Native trip planner with motorcycle expedition logic.
- `mobile/app/destination/[slug].tsx`: Native destination detail screen.

---

## 16. Environment Variables (By Name Only — No Secrets)

- Core Settings: `PROJECT_NAME`, `VERSION`, `SECRET_KEY`, `ACCESS_TOKEN_EXPIRE_MINUTES`.
- Database: `DATABASE_URL`.
- Network & CORS: `BACKEND_CORS_ORIGINS`, `APP_PUBLIC_URL`, `NEXT_PUBLIC_API_URL`.
- Email & Auth: `EMAIL_PROVIDER`, `BREVO_API_KEY`, `EMAIL_FROM`, `EMAIL_FROM_NAME`, `EMAIL_OTP_EXPIRE_MINUTES`, `EMAIL_OTP_RESEND_COOLDOWN_SECONDS`, `EMAIL_OTP_MAX_ATTEMPTS`.
- External Providers: `MAPS_API_KEY`, `PLACES_API_KEY`, `WEATHER_API_KEY`, `TRANSPORT_API_KEY`, `HOTELS_API_KEY`.
- Image Provider: `IMAGE_PROVIDER`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, `IMAGE_OUTPUT_DIR`, `IMAGE_FORMAT`.

---

## 17. Non-Negotiable Product & Architectural Principles

1. **Travel Companion, Not SaaS:** Vanvas must feel like an artisan Indian travel journal and an intelligent Himalayan mountain companion, never a generic enterprise dashboard.
2. **Painterly Visual Integrity:** Destination and place imagery must use bespoke painterly gouache travel illustrations. **Never introduce flat vectors, geometric mountain clipart, or generic stock photography.**
3. **Dual-Platform Equality:** Web and Native Mobile are co-equal first-class experiences sharing identical data contracts, business rules, and design tokens.
4. **Universal Single-Row Discovery:** All place, stay, and rental discovery rails must remain strict horizontal single-row touch carousels across all viewport sizes.
5. **Mountain Mobility Realism:** High-altitude mountain routes must apply topographic transit factors (1.45x); Spiti motorcycle expeditions must surface Gateway hubs and respect Kaza commercial vehicle bylaws.
6. **Data Honesty & Transparent Fallbacks:** When exact artwork is pending, system must transparently label diagnostic fallback status rather than silently disguising mismatched stock images.
7. **Zero Paid Quota Overages:** Never incur cloud provider charges or purchase credits during image generation quota timeouts.
