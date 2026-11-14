# VANVAS — Current Development State

> **Active Snapshot of Working Tree & Operational Readiness**  
> *Last Verified:* 2026-11-14T20:55:00+05:30

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
- **Dharamshala & Kasol Master Visual Rebuild & Integration Fixes:**
  - Diagnosed and resolved the 3 root causes preventing fresh illustrations from rendering in production:
    1. **Service Worker Cache-First Lockout (`frontend/public/sw.js`):** Bumped to `vanvas-v5` (`SCRIPT_VERSION: vanvas-pwa-v5.0.0`), converted `/images/`, `/artworks/`, `/avatars/` to Stale-While-Revalidate, purging stale `vanvas-v4` cache.
    2. **Backend API Fallback Overwrite (`frontend/app/explore/[slug]/page.tsx`):** Guaranteed that curated canonical package stays (`canonPkg.hotels`) and exact place paths `/stays/` take precedence over backend API generic category fallbacks (`/categories/stay.webp`).
    3. **Destination Slug Key Mismatch (`frontend/lib/placeVisualResolver.ts`):** Added `normalizeCanonicalDestinationSlug` to map titles like `"Kasol (Parvati Valley)"` and `"Dharamshala (McLeod Ganj)"` to their canonical slugs (`"kasol"`, `"dharamshala"`), restoring exact Priority 1 stay/place lookups and destination-scoped fuzzy matching.
  - **Kasol Border Removal:** Cropped white paper borders from `chojh-bridge`, `moon-dance-cafe`, and `evergreen-cafe` to 1376x768 full-bleed gouache.
  - **Kasol Flat Vector Elimination:** Replaced flat vectors for `pulga-fairy-forest`, `tulga-hamlet`, `rasol-trail`, `jim-morrison-cafe`, `waichin-valley` with high-resolution gouache illustrations; `PENDING_ARTWORK_SET` cleared (0 pending).
  - **Kasol Vehicle Differentiation:** Updated `kasol_parvati_bullet.webp` / `.jpg` to high-resolution Royal Enfield Classic 350 motorcycle in pine forest, establishing 60.3 visual variance from the scooter.
- **Next.js Web Frontend Build:** `cd frontend && npx tsc --noEmit && npm run build` ➔ **PASSED (0 errors, 25/25 routes compiled cleanly)**.
- **Mobile React Native TypeScript & Expo Config:** `cd mobile && npx tsc --noEmit && npx expo config --type public` ➔ **PASSED (0 errors)**.
- **Shared Package Build:** `cd packages/shared && npm run build` ➔ **PASSED (0 errors)**.
- **Backend Combined Regression:** **38/38 PASSED (100% green)**.
- **Mobile Offline Isolation & Reliability (Real Code):** `scripts/test_offline_isolation_and_account_deletion.mjs` ➔ **31/31 PASSED (100% green)**.

---

## 4. Test Suite Summary
- **Backend Regression Suite:** 38/38 tests passed (100%).
- **Mobile Real Offline Suite:** 31/31 tests passed (100%).
- **Web Compilation:** 25/25 static routes and server routes compiled cleanly.
- **Mobile Compilation:** Clean compilation across Expo 58 with zero TypeScript errors.

---

## 5. Active Issues & Blockers
1. **Release Keystore Secrets Configuration (Owner Gate):**
   - Repository owner must add `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD` to GitHub Actions secrets to unlock production upload-signed AAB creation.

---

## 6. Last Completed Task
Dharamshala Editorial Artwork Rebuild, Duplicate Removal & Production Integration on `main`.

---

## 7. Next Recommended Task
Execute Task A: Generate and integrate the 5 remaining Kasol editorial artworks (`pulga-fairy-forest`, `tulga-hamlet`, `rasol-trail`, `jim-morrison-cafe`, `waichin-valley`) and remove them from `PENDING_ARTWORK_SET`.

