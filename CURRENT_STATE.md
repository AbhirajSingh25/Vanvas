# VANVAS — Current Development State

> **Active Snapshot of Working Tree & Operational Readiness**  
> *Last Verified:* 2026-11-14T17:15:00+05:30

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
- **Dharamshala Editorial Artwork Rebuild & Uniqueness Audit:**
  - 11 new high-resolution (1376x768) editorial travel illustrations generated, optimized, and integrated:
    - 5 Places: Gyuto Monastery (`gyuto-monastery.webp`), Dal Lake Dharamshala (`dal-lake-dharamshala.webp`), Tibetan Butter Tea & Tingmo Bakery Lane (`tibetan-butter-tea.webp`), Masroor Monolithic Rock-Cut Temples (`masroor-rock-temples.webp`), Tashi Jong Buddhist Craft Community & Stupas (`tashi-jong-monastery.webp`).
    - 4 Stays: Fortune Park Moksha (`fortune-park-moksha.webp`), Chonor House Tibetan Guesthouse (`chonor-house-tibetan-guesthouse.webp`), Clouds End Villa Heritage Estate (`clouds-end-villa-heritage-estate.webp`), Zostel Dharamkot (`zostel-dharamkot.webp`).
    - 2 Rentals: Honda Activa 6G Cedar Ridge Edition (`dharamshala_mcleod_scooter.webp`), Classic 350 Dhauladhar Cruiser (`dharamshala_dhauladhar_bullet.webp`).
  - `PENDING_ARTWORK_SET` in `frontend/lib/placeVisualResolver.ts` updated (all 5 Dharamshala flat vectors removed and promoted to verified exact editorial artwork).
  - Uniqueness audit: 22 unique assets across 16 places, 4 stays, and 2 rentals with 0 duplicate collisions.
  - Production WebP (`quality=90, method=6`) and JPEG fallbacks generated with sidecar `.generated.json` metadata.
  - Automated Puppeteer visual QA passed on desktop (1440x900) and mobile (390x844), with 0 network request errors (HTTP 200 on all images).
- **Next.js Web Frontend Build:** `cd frontend && npx tsc --noEmit && npm run build` ➔ **PASSED (0 errors, 25/25 routes compiled cleanly)**.
- **Mobile React Native TypeScript & Expo Config:** `cd mobile && npx tsc --noEmit && npx expo config --type public` ➔ **PASSED (0 errors)**.
- **Shared Package Build:** `cd packages/shared && npm run build` ➔ **PASSED (0 errors)**.
- **Backend Solo Traveler Circles Suite:** `backend/tests/test_solo_traveler_circles.py` ➔ **11/11 PASSED (100% green)**.
- **Backend Collaborative Crew & Finance Suite:** `backend/tests/test_collaborative_crew_and_finance.py` ➔ **5/5 PASSED (100% green)**.
- **Backend Account Deletion Governance:** `backend/tests/test_account_deletion_governance.py` ➔ **22/22 PASSED (100% green)**.
- **Combined Backend Regression:** **38/38 PASSED (100% green)**.
- **Mobile Offline Isolation & Reliability (Real Code):** `scripts/test_offline_isolation_and_account_deletion.mjs` ➔ **31/31 PASSED (100% green)**.

---

## 4. Test Suite Summary
- **Backend Regression Suite:** 38/38 tests passed (100%).
- **Mobile Real Offline Suite:** 31/31 tests passed (100%).
- **Web Compilation:** 25/25 static routes and server routes compiled cleanly.
- **Mobile Compilation:** Clean compilation across Expo 58 with zero TypeScript errors.

---

## 5. Active Issues & Blockers
1. **Pending Artwork Batch (Kasol 5 Entities):**
   - Dharamshala batch completed (0 pending entities remaining for Dharamshala).
   - Kasol (5) flat vectors remain in `PENDING_ARTWORK_SET`: `pulga-fairy-forest`, `tulga-hamlet`, `rasol-trail`, `jim-morrison-cafe`, `waichin-valley`.
2. **Release Keystore Secrets Configuration (Owner Gate):**
   - Repository owner must add `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD` to GitHub Actions secrets to unlock production upload-signed AAB creation.

---

## 6. Last Completed Task
Dharamshala Editorial Artwork Rebuild, Duplicate Removal & Production Integration on `main`.

---

## 7. Next Recommended Task
Execute Task A: Generate and integrate the 5 remaining Kasol editorial artworks (`pulga-fairy-forest`, `tulga-hamlet`, `rasol-trail`, `jim-morrison-cafe`, `waichin-valley`) and remove them from `PENDING_ARTWORK_SET`.

