# VANVAS — Current Development State

> **Active Snapshot of Working Tree & Operational Readiness**  
> *Last Verified:* 2026-11-10T22:10:00+05:30

---

## 1. Git State & Checkpoint
- **Latest Verified Commit:** Commit `51880e9` on `main` (active implementation checkpoint: `a969a9f`)
- **Current Branch:** `main`
- **Native Version:** `0.4.0` (`versionCode 4`, package: `ai.vanvas.app`)
- **Runtime Stack:** Expo SDK 58.0.23, React Native 0.88.1, React 19.3.0, Node.js 22.14 LTS
- **Target Android SDK:** API 36 (Android 16+ ready), compileSdkVersion 37 via `expo-build-properties`
- **Account Deletion Portal:** `account-deletion-site/` standalone static portal with token in-memory isolation, fully Google Play Data Safety compliant. Backend erasure tested with 22/22 passing governance tests.

---

## 2. Production Status
- **Web Production:** https://vanvasai.vercel.app (Status: Healthy, completely untouched).
- **Backend API:** https://vanvas-api.onrender.com (Status: Healthy, Render web service).
- **Native Android App:** Standalone production-grade React Native app with API 36 target, account-isolated offline SQLite ledger, Dynamic Replanner, and segregated APK/AAB CI pipeline.
- **Account Deletion Site:** Static client in `account-deletion-site/` ready for single-command deploy (`vercel --prod`) by repository owner. Backend CORS regex allows `https://vanvas[a-z0-9-]*\.vercel\.app`.

---

## 3. Build & Diagnostics Verification
- **Full Backend Pytest Regression:** 748 passed, 1 skipped, 0 failed, 10 deselected in 21m 28s across 85+ test files (100% clean).
- **Backend Account Deletion Governance:** `backend/tests/test_account_deletion_governance.py` ➔ **PASSED (22/22 tests green, 100%)**.
- **Backend Targeted Hardening:** 44/44 tests green across account deletion (22), profile (5), artwork governance (7), collision prevention (3), and product completeness (7).
- **Artwork Invariants:** `backend/tests/test_artwork_runtime_invariants.py` ➔ **PASSED (6/6 tests green, 100%)**.
- **Mobile Offline Isolation & Reliability (Real Code):** `scripts/test_offline_isolation_and_account_deletion.mjs` ➔ **PASSED (20/20 tests green, 100% executing actual production `offlineDb` methods)**.
- **Mobile TypeScript:** `cd mobile && npm run typecheck` ➔ **PASSED (0 errors)**.
- **Expo Config:** `npx expo config --type public` ➔ **PASSED (Code 0, SDK 58.0.23, targetSdk 36, compileSdk 37)**.
- **Zero Legacy NULL user_id Leakage:** All private SQLite expense queries and mutation queries require an authenticated `userId` and use exact `WHERE user_id = ?`. Queries never include `OR user_id IS NULL`. Legacy records with unverified ownership are safely quarantined.
- **User-Scoped Trip Detail Cache:** `getCachedTripDetail(userId, tripId)` requires both parameters and queries `WHERE trip_id = ? AND user_id = ?`. Composite `PRIMARY KEY (trip_id, user_id)` on `trip_details_cache` and `user_trips_cache` prevents multi-account cache overwrites.
- **In-Memory Fallback Parity:** All private in-memory fallback keys are strictly account-scoped (`trip_detail_${userId}_${tripId}`, `expenses_${userId}_${tripId}`, `user_trips_${userId}`). Session clear removes only that user's session cache.
- **Fail-Safe Migration Verification:** Schema migration checks existing columns transactionally. If verification fails, private operations throw and block access to prevent unauthenticated data leaks.
- **Mutation Replay Deduplication:** Interrupted expense sync checks existing server expenses via `offline_client_id` inside `receipt_data_json` before re-posting, preventing duplicate creations.
- **Single-Owner Deletion Teardown:** `AuthContext` solely owns post-deletion session and cache clearing; `nativeApi.deleteAccount` strictly executes backend DELETE and returns response; local SQLite failures fail open without false server rejection.
- **Native In-App Deletion & Security UI:** `mobile/app/(tabs)/profile.tsx` with password change modal, permanent account erasure modal, mandatory password confirmation, cancellation state clearing, and duplicate tap prevention.
- **Backend Storage Erasure Hardening:** `boto3>=1.34.0` in `requirements.txt`; `_delete_cloudinary` validates response and fails closed on unconfigured credentials; `_delete_s3` handles `ClientError` (404 idempotent, AccessDenied propagated); database session commit isolation enforced.
- **Android Target SDK:** Configured to API 36 via `expo-build-properties` plugin, `build.gradle`, and GitHub Actions workflow.
- **Permissions Clean:** `READ_EXTERNAL_STORAGE` and `CAMERA` eliminated; modern Android Photo Picker used.
- **Release CI Pipeline:** Segregated `.github/workflows/android-apk.yml` to produce:
  - `VANVAS-Android-v0.4.0-code4-debug.apk` (Always built, for sideloading/testing).
  - `VANVAS-Android-v0.4.0-code4-validation.aab` (Built when release secrets absent; summary marked `🟡 OWNER BLOCKED`).
  - `VANVAS-Android-v0.4.0-code4-production.aab` (Built when secrets present, verified non-debug with keytool; summary marked `🟢 UPLOAD-SIGNED`).
- **Frontend State:** 100% frozen, 0 lines modified.
- **Documentation Suite:** `PROJECT_CONTEXT.md`, `CURRENT_STATE.md`, `DEVELOPMENT_LOG.md`, `NEXT_SESSION.md`, and `mobile/docs/` fully updated and synchronized.

---

## 4. Test Suite Summary
- **Backend Comprehensive Regression:** 748 passed, 1 skipped, 0 failed, 10 deselected (100%).
- **Backend Account Deletion Governance:** 22/22 tests green (100%).
- **Backend Foundation Hardening:** 44/44 focused tests green (100%).
- **Artwork Invariants:** 6/6 tests green (100%).
- **Mobile Offline Isolation & Reliability:** 20/20 tests green (100% across real production `offlineDb` methods).
- **Mobile Typecheck:** Clean compilation (0 errors).
- **Shared Contracts:** `@vanvas/shared` builds cleanly (0 errors).
- **Offline Reliability:** SQLite WAL cache layer with account-scoped `expenses_cache`, `offline_mutation_queue`, composite keys, and performance indexes verified.
- **Docs Validation:** `python scripts/validate_docs.py` passing.

---

## 5. Active Issues & Blockers
1. **Artwork Generation Quota Reset:**
   - Free Gemini image-generation quota exhausted until **November 13, 2026**.
   - 10 entities pending generation (5 Dharamshala + 5 Kasol).
   - Currently rendering honest diagnostic fallback labels; zero paid overages allowed.
2. **Release Keystore Secrets (Owner Blocked):**
   - CI produces validation bundle until repository owner adds the 4 GitHub Secrets (`ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`).

---

## 6. Last Completed Task
- **Objective:** Final SQLite Privacy Isolation & Native Release Validation.
- **Accomplishments:**
  - Eliminated legacy NULL user_id leakage: all private expense and mutation methods require verified `userId: string` with exact `WHERE user_id = ?` query clauses.
  - Implemented user-scoped trip detail caching: `getCachedTripDetail(userId, tripId)` requires both parameters, queries `WHERE trip_id = ? AND user_id = ?`, and caches under `trip_detail_${userId}_${tripId}` in memory.
  - Resolved cache collision risk by establishing composite `PRIMARY KEY (trip_id, user_id)` for `user_trips_cache` and `trip_details_cache`.
  - Added performance indexes: `idx_expenses_user_trip`, `idx_mutations_user_created`, `idx_trip_details_user_trip`, `idx_user_trips_user_updated`.
  - Enforced fail-safe migration initialization with post-migration column verification; if verification fails, private cache queries block access with clear descriptive errors.
  - Implemented deduplication guard in `syncPendingOfflineActions` matching `offline_client_id` inside `receipt_data_json` before re-posting offline expenses.
  - Upgraded test harness in `scripts/test_offline_isolation_and_account_deletion.mjs` to execute actual production code from `mobile/src/services/db.ts` and `mobile/src/services/api.ts` on a real SQLite in-memory engine, achieving 20/20 passing tests (100%).
  - Maintained 100% strict freeze on `frontend/` (0 files modified).

---

## 7. Next Recommended Task
1. Repository owner configures the 4 GitHub Actions secrets (`ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`) to enable signed production AAB generation.
2. Repository owner runs `cd account-deletion-site && vercel --prod` to deploy the public deletion portal to `https://vanvas-account-deletion.vercel.app`.
3. Sideload `VANVAS-Android-v0.4.0-code4-debug.apk` onto a physical Android device for field verification.
4. Run `python scripts/generate_pending_artwork_batch.py --execute --confirm-free-quota` on November 13, 2026 when free image-generation quota resets.
