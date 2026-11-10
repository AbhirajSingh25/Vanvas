# VANVAS — Current Development State

> **Active Snapshot of Working Tree & Operational Readiness**  
> *Last Verified:* 2026-11-10T17:35:00+05:30

---

## 1. Git State & Checkpoint
- **Latest Verified Commit:** Commit `a969a9f` on `main`
- **Current Branch:** `main`
- **Native Version:** `0.4.0` (`versionCode 4`, package: `ai.vanvas.app`)
- **Runtime Stack:** Expo SDK 58.0.23, React Native 0.88.1, React 19.3.0, Node.js 22.14 LTS
- **Target Android SDK:** API 36 (Android 16+ ready), compileSdkVersion 37 via `expo-build-properties`
- **Account Deletion Portal:** `account-deletion-site/` standalone static portal with token in-memory isolation, fully Google Play Data Safety compliant. Backend erasure tested with 22/22 passing governance tests.

---

## 2. Production Status
- **Web Production:** https://vanvasai.vercel.app (Status: Healthy, completely untouched).
- **Backend API:** https://vanvas-api.onrender.com (Status: Healthy, Render web service).
- **Native Android App:** Standalone production-grade React Native app with API 36 target, offline SQLite ledger, Dynamic Replanner, and segregated APK/AAB CI pipeline.
- **Account Deletion Site:** Static client in `account-deletion-site/` ready for single-command deploy (`vercel --prod`) by repository owner. Backend CORS regex allows `https://vanvas[a-z0-9-]*\.vercel\.app`.

---

## 3. Build & Diagnostics Verification
- **Full Backend Pytest Regression:** 748 passed, 1 skipped, 0 failed, 10 deselected in 21m 28s across 85+ test files (100% clean).
- **Backend Account Deletion Governance:** `backend/tests/test_account_deletion_governance.py` ➔ **PASSED (22/22 tests green, 100%)**.
- **Backend Targeted Hardening:** 44/44 tests green across account deletion (22), profile (5), artwork governance (7), collision prevention (3), and product completeness (7).
- **Artwork Invariants:** `backend/tests/test_artwork_runtime_invariants.py` ➔ **PASSED (6/6 tests green, 100%)**.
- **Mobile Offline Isolation & Account Deletion:** `scripts/test_offline_isolation_and_account_deletion.mjs` ➔ **PASSED (6/6 tests green, 100%)**.
- **Mobile TypeScript:** `cd mobile && npm run typecheck` ➔ **PASSED (0 errors)**.
- **Expo Config:** `npx expo config --type public` ➔ **PASSED (Code 0, SDK 58.0.23, targetSdk 36, compileSdk 37)**.
- **Single-Owner Deletion Teardown:** `AuthContext` solely owns post-deletion session and cache clearing; `nativeApi.deleteAccount` strictly executes backend DELETE and returns response; local SQLite failures fail open without false server rejection.
- **Account-Scoped Offline Isolation:** Additive SQLite schema migration added `user_id TEXT` to `expenses_cache` and `offline_mutation_queue`; replay is strictly user-scoped; cross-account replay is blocked.
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
- **Mobile Offline Isolation & Teardown:** 6/6 tests green (100%).
- **Mobile Typecheck:** Clean compilation (0 errors).
- **Shared Contracts:** `@vanvas/shared` builds cleanly (0 errors).
- **Offline Reliability:** SQLite WAL cache layer with account-scoped `expenses_cache` and `offline_mutation_queue` verified.
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
- **Objective:** Final Stabilization & Owner Release Handoff: Single-Owner Deletion Teardown & Account-Scoped Offline Isolation.
- **Accomplishments:**
  - Removed duplicate account deletion cleanup: `nativeApi.deleteAccount` strictly executes backend deletion, and `AuthContext.deleteAccount` solely owns post-deletion session teardown, private cache purge, and React state reset.
  - Implemented robust `try/finally` error handling: if local SQLite cache cleanup encounters an issue after backend deletion succeeds, the user remains logged out, credentials and React state are cleared, and no false server rejection is reported.
  - Implemented additive SQLite schema migration adding `user_id TEXT` to `expenses_cache` and `offline_mutation_queue` with backward compatibility.
  - Scoped offline mutation replay strictly to the authenticated `currentUser.id`, completely preventing cross-account mutation execution.
  - Scoped `purgeUserAccountData(userId)` to delete only the specified user's trips, trip details, expenses, and mutations while keeping other accounts and public destination catalogues intact.
  - Updated `mobile/app/(tabs)/profile.tsx` with duplicate tap protection (`if (isDeletingAccount) return;`) and cancellation state clearing (`handleCancelDelete`).
  - Created automated test suite `scripts/test_offline_isolation_and_account_deletion.mjs` verifying all 6 isolation, migration, and teardown scenarios (100% passing).
  - Maintained 100% strict freeze on `frontend/` (0 files modified).

---

## 7. Next Recommended Task
1. Repository owner configures the 4 GitHub Actions secrets (`ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`) to enable signed production AAB generation.
2. Repository owner runs `cd account-deletion-site && vercel --prod` to deploy the public deletion portal to `https://vanvas-account-deletion.vercel.app`.
3. Sideload `VANVAS-Android-v0.4.0-code4-debug.apk` onto a physical Android device for field verification.
4. Run `python scripts/generate_pending_artwork_batch.py --execute --confirm-free-quota` on November 13, 2026 when free image-generation quota resets.
