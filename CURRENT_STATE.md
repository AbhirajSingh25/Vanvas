# VANVAS — Current Development State

> **Active Snapshot of Working Tree & Operational Readiness**  
> *Last Verified:* 2026-11-11T19:00:00+05:30

---

## 1. Git State & Checkpoint
- **Latest Verified Base:** Branch `main`
- **Application ID:** `ai.vanvas.app`
- **Native Version:** `0.4.0` (`versionCode 4`)
- **Runtime Stack:** Next.js 16.3.5 (Turbopack), Expo SDK 58.0.23, React Native 0.88.1, React 19.3.0, FastAPI, PostgreSQL / SQLite
- **Target Android SDK:** API 36 (Android 16+ ready), compileSdkVersion 37 via `expo-build-properties`

---

## 2. Production Status
- **Web Production:** https://vanvasai.vercel.app (Next.js production build: 0 errors, 100% clean).
- **Backend API:** https://vanvas-api.onrender.com (FastAPI backend with 261 endpoints mounted).
- **Native Android App:** Expo SDK 58 React Native app (`mobile/`) with offline SQLite isolation and full feature parity (Typecheck: 0 errors).
- **Account Deletion Site:** `account-deletion-site/` standalone static portal with token in-memory isolation, Google Play compliant.

---

## 3. Build & Diagnostics Verification
- **Backend Collaborative Crew & Finance Suite:** `backend/tests/test_collaborative_crew_and_finance.py` ➔ **5/5 PASSED (100% green)**.
- **Backend Account Deletion Governance:** `backend/tests/test_account_deletion_governance.py` ➔ **22/22 PASSED (100% green)**.
- **Combined Backend Regression:** **27/27 PASSED (100% green in 39.8s)**.
- **Mobile Offline Isolation & Reliability (Real Code):** `scripts/test_offline_isolation_and_account_deletion.mjs` ➔ **31/31 PASSED (100% green)** executing real production `db.ts`, `api.ts`, and `authTeardown.ts`.
- **Next.js Web Frontend Build:** `cd frontend && npm run build` ➔ **PASSED (0 errors, 100% clean production build)**.
- **Mobile React Native TypeScript:** `cd mobile && npm run typecheck` ➔ **PASSED (0 errors)**.
- **Shared Package Build:** `cd packages/shared && npm run build` ➔ **PASSED (0 errors)**.
- **Schema Additive Migrations:** Idempotent database schema in `session.py` and `alembic/versions/0003_crew_circles_friends_finance.py`.

---

## 4. Test Suite Summary
- **Backend Regression Suite:** 27/27 tests passed (100%).
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
- **VANVAS — CREW CIRCLES, COLLABORATIVE TRAVEL & SMART EXPENSE ECOSYSTEM:**
  - Ambiguity-resistant permanent `vanvas_id` (`VNV-XXXX-XXXX`) and `allow_friend_requests_via_id` privacy toggle.
  - Friend Connection System (lookup, requests lifecycle, friend list, remove, block/unblock).
  - Private Crew Circles (मण्डली): Multi-trip workspaces, member management, suggestions with private consensus voting (`HELL_YEAH`, `YES`, `NO`), Ask VANVAS AI recommendations, activity chat feed.
  - Smart Finance 3-Layer Architecture: Layer 1 Budget Plans (zero debts), Layer 2 Group Ledger (integer paise precision, version locking, audit logging), Layer 3 Split Pods (isolated subgroup ledgers with zero debt leakage).
  - Add Budget Item bottom sheet / modal with live calculation previews across `FIXED`, `PER_PERSON`, and `QTY_UNIT` bases.
  - Full React Native parity with SQLite offline tables `user_circles_cache` and `user_friends_cache`.

---

## 7. Next Recommended Task
- **Physical Device Validation & Production Signing Handoff:**
  - Sideload `VANVAS-Android-v0.4.0-code4-debug.apk` onto physical hardware to test Crew Circles, Friends search by VANVAS ID, and Offline SQLite caching.
  - Repository owner configures GitHub Secrets to enable automatic Play Store upload-signed AAB compilation.
  - Deploy standalone account deletion site (`vercel --prod` from `account-deletion-site/`).
