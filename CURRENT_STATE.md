# VANVAS — Current Development State

> **Active Snapshot of Working Tree & Operational Readiness**  
> *Last Verified:* 2026-11-11T16:15:00+05:30

---

## 1. Git State & Checkpoint
- **Latest Verified Commit:** Commit `3477392` on `main`
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
- **Mobile Offline Isolation & Reliability (Real Code):** `scripts/test_offline_isolation_and_account_deletion.mjs` ➔ **PASSED (31/31 tests green, 100% executing actual production `db.ts`, `api.ts`, and `authTeardown.ts` methods)**.
- **Mobile TypeScript:** `cd mobile && npm run typecheck` ➔ **PASSED (0 errors)**.
- **Expo Config:** `npx expo config --type public` ➔ **PASSED (Code 0, SDK 58.0.23, targetSdk 36, compileSdk 37)**.
- **Zero Legacy NULL user_id Leakage:** All private SQLite queries require verified `userId: string` validated via `validateUserId(userId, methodName)`. Queries never include `OR user_id IS NULL`. Legacy records with unverified ownership are safely quarantined into `legacy_quarantine_*` tables.
- **Existing-Install Composite Key Migration:** `migrateTableToCompositePrimaryKey(db, tableName)` inspects `PRAGMA table_info` for composite primary key `(trip_id, user_id)` on `user_trips_cache` and `trip_details_cache`. Valid rows migrate seamlessly, unowned rows quarantine safely, and versioning is recorded in `schema_migrations`.
- **User-Scoped Trip Detail Cache:** `getCachedTripDetail(userId, tripId)` requires both parameters and queries `WHERE trip_id = ? AND user_id = ?`. Composite `PRIMARY KEY (trip_id, user_id)` on `trip_details_cache` and `user_trips_cache` prevents multi-account cache overwrites.
- **In-Memory Fallback Parity:** All private in-memory fallback keys are strictly account-scoped (`trip_detail_${userId}_${tripId}`, `expenses_${userId}_${tripId}`, `user_trips_${userId}`). Session clear removes only that user's session cache.
- **Fail-Safe Migration Verification:** Schema migration checks existing columns transactionally. If verification fails, private operations throw and block access to prevent unauthenticated data leaks.
- **Mutation Replay Deduplication & Safe Deletion:** Interrupted expense sync checks existing server expenses via `offline_client_id` inside `receipt_data_json` before re-posting. Failed reconciliation GET preserves mutations and halts replay. Local delete of an unsynced expense cancels pending creations without unnecessary server DELETE requests.
- **Single-Owner Deletion Teardown:** Centralized `executeAccountDeletionTeardown` in `mobile/src/services/authTeardown.ts` guarantees session and SecureStore clearance even if local SQLite purge encounters errors.
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
- **Mobile Offline Isolation & Reliability:** 31/31 tests green (100% across real production `db.ts`, `api.ts`, and `authTeardown.ts` methods).
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
- **Objective:** Existing-Install SQLite Migration & Offline Sync Integrity.
- **Accomplishments:**
  - Implemented versioned, idempotent composite primary key migration in `mobile/src/services/db.ts` (`migrateTableToCompositePrimaryKey`) converting `user_trips_cache` and `trip_details_cache` to `PRIMARY KEY (trip_id, user_id)`.
  - Added legacy data quarantine: unowned rows are copied to `legacy_quarantine_*` tables rather than dropped or exposed.
  - Enforced strict ownership validation (`validateUserId`) across all private database cache and mutation methods.
  - Hardened offline synchronization idempotency in `mobile/src/services/api.ts`: decoupled remote POST from local caching; handled reconciliation GET failures safely; and added pending mutation cancellation (`cancelOfflineExpenseMutation`) when unsynced expenses are deleted locally.
  - Centralized single-owner account deletion teardown in `mobile/src/services/authTeardown.ts` shared with `AuthContext.tsx`.
  - Upgraded test harness in `scripts/test_offline_isolation_and_account_deletion.mjs` to execute 31 production flow tests across real production code with 100% success (31/31 passing).
  - Maintained 100% strict freeze on `frontend/` (0 files modified).

---

## 7. Next Recommended Task
1. Repository owner configures the 4 GitHub Actions secrets (`ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`) to enable signed production AAB generation.
2. Repository owner runs `cd account-deletion-site && vercel --prod` to deploy the public deletion portal to `https://vanvas-account-deletion.vercel.app`.
3. Sideload `VANVAS-Android-v0.4.0-code4-debug.apk` onto a physical Android device for field verification.
4. Run `python scripts/generate_pending_artwork_batch.py --execute --confirm-free-quota` on November 13, 2026 when free image-generation quota resets.
