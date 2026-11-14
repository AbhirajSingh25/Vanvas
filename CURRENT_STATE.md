# VANVAS — Current Development State

> **Active Snapshot of Working Tree & Operational Readiness**  
> *Last Verified:* 2026-11-14T23:25:00+05:30

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
- **Native Android App:** Expo SDK 58 React Native app (`mobile/`) with offline SQLite isolation and full feature parity (Typecheck: 0 errors).
- **Account Deletion Site:** `account-deletion-site/` standalone static portal with token in-memory isolation, Google Play compliant.

---

## 3. Build & Diagnostics Verification
- **Production Visual Cache Lock & Flat Vector Elimination (P0 Fix):**
  - **Root Cause Permanently Resolved:** In commit `8fcfeb8`, Service Worker `vanvas-v5` deployed with Stale-While-Revalidate caching for images. When initial fallback vector placeholders were fetched, they became locked in the user's browser `vanvas-static-vanvas-v5` cache.
  - **Service Worker Upgrade (`frontend/public/sw.js`):** Bumped to `vanvas-v6` (`vanvas-pwa-v6.0.0`). Upgraded image caching strategy from Stale-While-Revalidate to **Network-First with cache fallback**. On activation, automatically purges all legacy `vanvas-` caches.
  - **URL Version Cache Busting (`frontend/components/ui/VanvasImage.tsx`):** Automatically appends `?v=v6` to all `/images/` paths, breaking browser HTTP disk caches and CDN edge locks.
  - **Category Fallback Elimination:** Physically replaced all legacy flat vector placeholder SVGs/WebPs across `frontend/public/images/places/{kasol,dharamshala}/categories/` with verified high-resolution (1376x768) rich gouache paintings. Zero flat vectors exist in the codebase.
- **Kasol Complete Visual Rebuild & Runtime Production Fix:**
  - **4 Stays Completely Differentiated (P0 Requirement):**
    - The Himalayan Village (`the-himalayan-village.webp`): Hand-hewn Kathkuni timber-and-stone dry masonry chalets with carved balconies and slate roofs.
    - Parvati Kuteer Riverside Wood Cottages (`parvati-kuteer-riverside-wood-cottages.webp`): Independent log cabins on the Parvati riverbank with hammocks and boulders.
    - Kasol Heights Resort (`kasol-heights-resort.webp`): High-altitude modern mountain resort perched on Suma Ropa ridge with panoramic sundeck.
    - The Hosteller Kasol Riverside (`the-hosteller-kasol-riverside.webp`): Vibrant backpacker hostel with fairy-lit wooden riverside cafe terrace.
    - Pairwise visual variance between stays: **66.3 to 80.3 difference** (100% unique property identities).
  - **16 Canonical Places Fully Resolved:**
    - Replaced generic/vector placeholders for `pulga-fairy-forest`, `tulga-hamlet`, `rasol-trail`, `jim-morrison-cafe`, and `waichin-valley` with bespoke 1376x768 full-bleed gouache illustrations.
    - All 16 Kasol places verified with unique SHA-256 hashes (minimum pairwise variance: 50.7).
  - **Runtime Deduplication & API Preservation (`frontend/app/explore/[slug]/page.tsx`):**
    - Authoritative canonical 16 places and 4 stays preserved as baseline order.
    - Eliminated duplicate Chalal, duplicate Manikaran, and duplicate Kheerganga entries caused by uncurated backend database rows.
    - Filtered out phantom backend lodge `Parvati Woods Bohemian Alpine Lodge` and removed invalid alias in `placeVisualResolver.ts`.
    - Deduplicated Valley Mobility fleet to ensure the 2 distinct vehicles (TVS Jupiter 125 and Royal Enfield Classic 350) render cleanly without duplicate motorcycle cards.
  - **Destination Diagnostics:**
    - Implemented `generateDestinationVisualAuditReport` in `frontend/lib/placeVisualResolver.ts`.
    - Automated diagnostics verified 100% of Kasol (22/22) and Dharamshala (22/22) assets valid and on disk.
  - **Dharamshala Regression Baseline:**
    - Zero modifications to Dharamshala artwork, paths, or visual mappings. 100% green regression test pass.
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

