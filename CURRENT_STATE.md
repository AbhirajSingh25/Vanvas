# VANVAS — Current Development State

> **Active Snapshot of Working Tree & Operational Readiness**  
> *Last Verified:* 2026-11-16T01:10:00+05:30

---

## 1. Git State & Checkpoint
- **Active Branch:** `main`
- **Application ID:** `ai.vanvas.app`
- **Native Version:** `0.4.0` (`versionCode 4`)
- **Runtime Stack:** Next.js 16.3.5 (Turbopack), Expo SDK 58.0.23, React Native 0.88.1, React 19.3.0, FastAPI, PostgreSQL / SQLite
- **Target Android SDK:** API 36 (Android 16+ ready), compileSdkVersion 37 via `expo-build-properties`

---

## 2. Production Status
- **Production URL:** https://vanvasai.vercel.app (mapped to `main`).
- **Backend API:** https://vanvas-api.onrender.com (FastAPI backend with 261 endpoints mounted).
- **Service Worker:** `vanvas-v8` / `vanvas-pwa-v8.0.0` with active eviction of older cache tiers.
- **Native Android App:** Expo SDK 58 React Native app (`mobile/`) with offline SQLite isolation and full feature parity (Typecheck: 0 errors).
- **Account Deletion Site:** `account-deletion-site/` standalone static portal with token in-memory isolation, Google Play compliant.

---

## 3. Build & Diagnostics Verification
- **Global Vehicle Image Optimizer Repair (`VehicleArtwork.tsx`):**
  - Removed query string mutation `?v=v7` on local static paths, eliminating Next.js Image Optimizer `HTTP 400 Bad Request` across vehicle rental cards globally (confirmed working in production for TVS Jupiter, Classic 350, Himalayan 450).
- **Manali Artwork Rebuild (100% Unique, Full-Bleed 1376×768):**
  - Replaced 5 flat vector artworks with authentic editorial illustrations:
    1. `beas-river-park.webp` (deodar river sanctuary & turquoise boulders)
    2. `lazy-dog-lounge.webp` (Old Manali timber deck & lantern glow)
    3. `dylans-cafe.webp` (cozy timber coffee house, copper espresso machine)
    4. `gulaba-meadows.webp` (alpine wildflower meadow plateau at 3,000m)
    5. `chopsticks-manali.webp` (traditional Tibetan carved dining room & momos)
  - Regenerated and differentiated 3 duplicate cafes with distinct architectures:
    6. `cafe-1947.webp` (stone-and-timber masonry directly over glacier rapids)
    7. `drifters-cafe.webp` (bohemian acoustic loft with Tibetan rugs & guitar)
    8. `johnsons-cafe.webp` (British-era stone cottage, apple orchards & trout grill)
- **Goa Complete Visual Rebuild (100% Unique, Full-Bleed 1376×768):**
  - Rebuilt all 4 Goa stays as bespoke property-specific illustrations:
    1. `ahilya-by-the-sea.webp` (Dolphin Bay hand-carved stone villas & oceanfront plunge pool)
    2. `the-postcard-velha.webp` (modernist architectural pavilions atop Old Goa forest hills)
    3. `casa-da-graca-heritage-homestay.webp` (19th-century Fontainhas indigo townhouse, oyster-shell windows)
    4. `jungle-by-the-hosteller.webp` (two-story bamboo & teak jungle lodge with illuminated pool)
  - Replaced 4 flat vector places with editorial artworks:
    5. `arambol-sweet-lake.webp` (Sweet Water Lagoon & sacred banyan tree)
    6. `reis-magos-fort.webp` (16th-century laterite fort & Mandovi estuary)
    7. `baba-au-rhum-cafe.webp` (Anjuna bamboo grove garden cafe & wood-fired oven)
    8. `gunpowder-assagao.webp` (heritage Assagao courtyard dining & coastal curries)
  - Unbordered `chapora-fort.webp` and `dudhsagar-falls.webp` to true 1376×768 full bleed.
- **Invariants & Build Gate:**
  - `backend/tests/test_artwork_runtime_invariants.py`: 6/6 tests passing (0 regressions).
  - Frontend typecheck (`npx tsc --noEmit`): 0 errors.
  - Frontend production build (`npm run build`): 25/25 static pages generated successfully. margin removed, 1376x768 full bleed).
  - Manali landmarks (`naggar-castle.webp`, `atal-tunnel-sissu.webp`, `sethan-igloo-village.webp`) unbordered, elevation text removed, 1376x768 full bleed.
  - Goa fleet unbordered (`goa_beach_scooter.webp`, `goa_coastal_bullet.webp`, `goa_coastal_car.webp`).
- **Cache Eviction (`sw.js` & `VanvasImage.tsx`):**
  - Upgraded to `vanvas-v8` / `?v=v8` to force browser and PWA service workers to refresh cached vector fallbacks with live high-res paintings.
- **CI Test Invariants & Build Verification:**
  - `pytest backend/tests/test_artwork_runtime_invariants.py`: 6 passed, 0 failures.
  - `npx tsc --noEmit`: 0 errors.
  - `npm run build`: 25/25 pages successfully built.
  - **Repaired Repetitive Valley Templates:**
    - `Chalal Riverside Pine Trail` (`chalal-pine-trail.webp`): Regenerated as an authentic deodar pine trail right along the churning turquoise Parvati River with wooden footbridge over river boulders.
    - `Kasol Nature Park Pine Walk` (`nature-park-kasol.webp`): Regenerated as an authentic landscaped forest walking path under towering pines with a rustic wooden park bench and mossy stones.
    - `Grahan Village Heritage Trek` (`grahan-village-trek.webp`): Regenerated with a hiker crossing a wooden bridge over a rushing brook, red rhododendrons, and Kathkuni houses on mountain terraces.
    - `Malana Village Ancient Approach Trail` (`malana-village-gate.webp`): Regenerated with the multi-tiered ancient Kathkuni village perched on the cliff plateau with carved balconies and temples.
  - **Eliminated Postcard Margins and Embedded Text:**
    - `Kalga Village & Terraced Apple Orchards` (`kalga-village.webp`): Completely regenerated as a borderless full-bleed painting of red apple orchards and grazing sheep in wildflower meadows.
    - `Chojh Riverside Pebble Beach & Suspension Bridge` (`chojh-bridge.webp`): Completely regenerated as a borderless full-bleed painting of the granite pebble beach and swaying iron suspension bridge.
  - **Dedicated Vehicle Artwork Resolution:**
    - `TVS Jupiter 125 Parvati Edition` (`kasol_valley_scooter.webp`): TVS Jupiter 125 is now the dominant hero subject in 3/4 front view in dusk navy/slate blue with dual-tone seat and alloy wheels overlooking the pine valley.
    - `Classic 350 Parvati Mountain Cruiser` (`kasol_parvati_bullet.webp`): Replaced the adventure bike with an authentic Royal Enfield Classic 350 cruiser in halcyon green and chrome with round headlamp, teardrop tank, and vintage split saddle.
  - **4 Unique Kasol Stays:**
    - All 4 properties (The Himalayan Village, Parvati Kuteer, Kasol Heights Resort, The Hosteller Kasol) confirmed 100% unique, architectural, and borderless.
- **Kainchi Dham Stays Upgrade:**
  - Deployed bespoke illustrations for `Bara Bungalow Gethia (1898 Heritage)` and `The Hermitage Bhowali` to break the 4-hotel duplicate temple image collision.
- **Cache Invalidation & SW Version Bump:**
  - Bumped Service Worker to `vanvas-v7` (`vanvas-pwa-v7.0.0`) with Network-First strategy.
  - Updated cache-busting version `?v=v7` in both `VanvasImage.tsx` and `VehicleArtwork.tsx`.
- **Next.js Web Frontend Build:** `cd frontend && npx tsc --noEmit && npm run build` ➔ **PASSED (0 errors, 25/25 routes compiled cleanly)**.
- **Diagnostics Audit:** `python scripts/test_visual_diagnostics.py` passed 100% across all 44 entities.
- **Kasol Place Uniqueness:** All 16 Kasol places verified with unique SHA-256 hashes (minimum pairwise variance: 50.7).
- **Rental Uniqueness:** 61.99 pairwise visual difference between Kasol scooter and motorcycle.
- **Next.js Web Frontend Build:** `cd frontend && npx tsc --noEmit && npm run build` ➔ **PASSED (0 errors, 25/25 routes compiled cleanly)**.
- **Mobile React Native TypeScript & Expo Config:** `cd mobile && npx tsc --noEmit && npx expo config --type public` ➔ **PASSED (0 errors)**.
- **Shared Package Build:** `cd packages/shared && npm run build` ➔ **PASSED (0 errors)**.
- **Backend Combined Regression:** **38/38 PASSED (100% green)**.

---

## 4. Test Suite Summary
- **Backend Regression Suite:** 38/38 tests passed (100%).
- **Visual Diagnostics Suite:** 44/44 entities verified (Kasol: 22/22, Dharamshala: 22/22).
- **Web Compilation:** 25/25 static routes and server routes compiled cleanly.
- **Mobile Compilation:** Clean compilation across Expo 58 with zero TypeScript errors.

---

## 5. Active Issues & Blockers
1. **Release Keystore Secrets Configuration (Owner Gate):**
   - Repository owner must add `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD` to GitHub Actions secrets to unlock production upload-signed AAB creation.

---

## 6. Last Completed Task
Production Visual Cache Lock Fix (SW vanvas-v6 Network-First + URL Cache Busting + Category Fallback Vector Elimination) and Kasol Complete Visual Rebuild on `main`.

---

## 7. Next Recommended Task
Play Store Production AAB release workflow once GitHub Actions secrets are configured by the repository owner.

