# VANVAS — Current Development State

> **Active Snapshot of Working Tree & Operational Readiness**  
> *Last Verified:* 2026-11-12T22:15:00+05:30

---

## 1. Git State & Checkpoint
- **Active Branch:** `feat/crew-circles-passport-rebuild`
- **Application ID:** `ai.vanvas.app`
- **Native Version:** `0.4.0` (`versionCode 4`)
- **Runtime Stack:** Next.js 16.3.5 (Turbopack), Expo SDK 58.0.23, React Native 0.88.1, React 19.3.0, FastAPI, PostgreSQL / SQLite
- **Target Android SDK:** API 36 (Android 16+ ready), compileSdkVersion 37 via `expo-build-properties`

---

## 2. Production Status
- **Production URL:** https://vanvasai.vercel.app (currently mapped to verified base commit on `main`).
- **Preview Deployment:** Vercel Preview generated per commit on `feat/crew-circles-passport-rebuild`.
- **Backend API:** https://vanvas-api.onrender.com (FastAPI backend with 261 endpoints mounted).
- **Native Android App:** Expo SDK 58 React Native app (`mobile/`) with offline SQLite isolation and full feature parity (Typecheck: 0 errors).
- **Account Deletion Site:** `account-deletion-site/` standalone static portal with token in-memory isolation, Google Play compliant.

---

## 3. Build & Diagnostics Verification
- **Playwright Fullscreen Loader & Ancestor Containment Suite:** `frontend/scripts/test_fullscreen_loading_ancestor_regression.mjs` ➔ **5/5 SCENARIOS PASSED (100% green)**:
  - Scenario A: Transformed ancestor containment immunity (portaled to body, bounding box 0,0,390,844, z-index 2147483000, zero template transform matrix, header/nav click-through prevented).
  - Scenario B: Modern mobile viewports: iPhone 12/13/14 (390x844), iPhone 14/15/16 Pro (393x852), iPhone 14/15/16 Pro Max (430x932) with solid `#FAF4E8` parchment and zero horizontal overflow.
  - Scenario C: SWR session restoration (instant render under held network, background verification update, 500 error session retention, explicit 401 purge, and no-cache Connection Paused + Retry recovery).
  - Scenario D: App navigation & route transitions (Header, Explore, Circles, Profile navigate smoothly with opacity-only transitions).
  - Scenario E: PWA manifest standalone mode and Service Worker `vanvas-v4` verification.
- **Playwright Instant Session Restoration & Full Viewport Loader:** `frontend/scripts/test_instant_session_restoration.mjs` ➔ **8/8 PASSED (100% green)**.
- **Backend Solo Traveler Circles Suite:** `backend/tests/test_solo_traveler_circles.py` ➔ **11/11 PASSED (100% green)**.
- **Backend Collaborative Crew & Finance Suite:** `backend/tests/test_collaborative_crew_and_finance.py` ➔ **5/5 PASSED (100% green)**.
- **Backend Account Deletion Governance:** `backend/tests/test_account_deletion_governance.py` ➔ **22/22 PASSED (100% green)**.
- **Combined Backend Regression:** **38/38 PASSED (100% green)**.
- **Mobile Offline Isolation & Reliability (Real Code):** `scripts/test_offline_isolation_and_account_deletion.mjs` ➔ **31/31 PASSED (100% green)** executing real production `db.ts`, `api.ts`, and `authTeardown.ts`.
- **Playwright Live Navigation & SW Recovery Suite:** `scripts/e2e/navigation-runtime-recovery.spec.ts` ➔ **6/6 PASSED (100% green)**.
- **PWA Acceptance & Integrity Audit:** `scripts/test_pwa_acceptance.mjs` ➔ **64/64 PASSED (100% green)**.
- **Backend Crew Circles, Passport & Avatar Durability Suites:** `test_crew_circles_and_planner_linking.py` + `test_collaborative_crew_and_finance.py` + `test_authentic_user_data_and_avatar_durability.py` + `test_profile_photo_upload.py` + `test_profile_and_settings.py` + `test_auth.py` + `test_account_deletion_governance.py` ➔ **60/60 PASSED (100% green)**.
- **Playwright Crew Circles & Passport Rebuild E2E:** `frontend/scripts/test_crew_circles_and_passport_rebuild_e2e.mjs` ➔ **PASSED (100% green)**.
- **Account Isolation & Explicit Participants Browser Suite:** `frontend/scripts/test_account_isolation_and_participants.mjs` ➔ **PASSED (100% green)**.
- **Next.js Web Frontend Build:** `cd frontend && npx tsc --noEmit && npm run build` ➔ **PASSED (0 errors, 25/25 routes compiled cleanly)**.
- **Mobile React Native TypeScript & Expo Config:** `cd mobile && npx tsc --noEmit && npx expo config --type public` ➔ **PASSED (0 errors)**.
- **Shared Package Build:** `cd packages/shared && npm run build` ➔ **PASSED (0 errors)**.

---

## 4. Test Suite Summary
- **Backend Regression Suite:** 38/38 tests passed (100%).
- **Mobile Real Offline Suite:** 31/31 tests passed (100%).
- **Web Compilation:** 25/25 static routes and server routes compiled cleanly.
- **Mobile Compilation:** Clean compilation across Expo 58 with zero TypeScript errors.

---

## 5. Active Issues & Blockers
1. **Pending Artwork Batch (10 Entities):**
   - Free Gemini image-generation quota is exhausted until **November 13, 2026**.
   - Do **NOT** attempt paid generation or incur cloud credits.
   - 10 entities are pending:
     - Dharamshala (5): Gyuto Monastery, Dal Lake Dharamshala, Tibetan Butter Tea & Tingmo Bakery Lane, Masroor Monolithic Rock-Cut Temples, Tashi Jong Buddhist Craft Community.
     - Kasol (5): Manikaran Sahib Gurudwara, Tosh Village, Moon Dance Café, Evergreen Café, Kheerganga Natural Sulphur Pool & Meadow.
2. **Release Keystore Secrets Configuration (Owner Gate):**
   - Repository owner must add `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD` to GitHub Actions secrets to unlock production upload-signed AAB creation.

---

## 6. Last Completed Task
- **VANVAS — P0 LIVE NAVIGATION RECOVERY, SW CONTROLLER TRANSITION & CHUNK AUTO-RECOVERY:**
  - Identified and fixed root-cause `Maximum update depth exceeded` infinite render loop in `AddBudgetItemModal.tsx` (`splitPods = []` default reference + `TravelDesk.tsx` inline array) that starved React concurrent transitions (`startTransition`) used by Next.js routing.
  - Upgraded `sw.js` (`vanvas-v4`) with strict RSC/private-route exclusion and `ServiceWorkerRegister.tsx` with in-memory-guarded single-reload `controllerchange` transition.
  - Added global Next.js chunk error auto-recovery + repeat-failure banner, internal route failure watchdog, scroll-lock reconciliation, and opt-in `?debugNavigation=1` diagnostics overlay (`navigationRecovery.ts` & `NavigationRecoveryProvider.tsx`).
  - Verified all Mobile (`390x844`), Desktop (`1440x900`), SW migration, chunk recovery, offline fallback, and iOS standalone scenarios via real Playwright tests (`6/6 PASSED`).

---

## 7. Next Recommended Task
- **Physical Device Validation & Production Signing Handoff:**
  - Sideload `VANVAS-Android-v0.4.0-code4-debug.apk` onto physical hardware to test Crew Circles, Friends search by VANVAS ID, and Offline SQLite caching.
  - Repository owner configures GitHub Secrets to enable automatic Play Store upload-signed AAB compilation.
  - Deploy standalone account deletion site (`vercel --prod` from `account-deletion-site/`).
