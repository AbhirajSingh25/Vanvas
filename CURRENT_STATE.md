# VANVAS — Current Development State

> **Active Snapshot of Working Tree & Operational Readiness**  
> *Last Verified:* 2026-11-10T17:35:00+05:30

---

## 1. Git State & Checkpoint
- **Latest Verified Commit:** Commit `df29183` on `main`
- **Current Branch:** `main`
- **Native Version:** `0.4.0` (`versionCode 4`, package: `ai.vanvas.app`)
- **Runtime Stack:** Expo SDK 58.0.23, React Native 0.88.1, React 19.3.0, Node.js 22.14 LTS
- **Target Android SDK:** API 36 (Android 16+ ready), compileSdkVersion 37 via `expo-build-properties`
- **Account Deletion Portal:** `account-deletion-site/` standalone static portal with token in-memory isolation, fully Google Play Data Safety compliant. Backend erasure tested with 7/7 passing governance tests.

---

## 2. Production Status
- **Web Production:** https://vanvasai.vercel.app (Status: Healthy, completely untouched).
- **Backend API:** https://vanvas-api.onrender.com (Status: Healthy, Render web service).
- **Native Android App:** Standalone production-grade React Native app with API 36 target, offline SQLite ledger, Dynamic Replanner, and segregated APK/AAB CI pipeline.
- **Account Deletion Site:** Static client in `account-deletion-site/` ready for single-command deploy (`vercel --prod`) by repository owner. Backend CORS regex allows `https://vanvas[a-z0-9-]*\.vercel\.app`.

---

## 3. Build & Diagnostics Verification
- **Mobile TypeScript:** `cd mobile && npm run typecheck` ➔ **PASSED (0 errors)**.
- **Backend Account Deletion Governance:** `backend/tests/test_account_deletion_governance.py` ➔ **PASSED (22/22 tests green, 100%)**.
- **Backend Targeted Hardening:** 44/44 tests green across account deletion (22), profile (5), artwork governance (7), collision prevention (3), and product completeness (7).
- **Artwork Invariants:** `backend/tests/test_artwork_runtime_invariants.py` ➔ **PASSED (6/6 tests green, 100%)**.
- **Native In-App Deletion & Security UI:** `mobile/app/(tabs)/profile.tsx` with password change modal, permanent account erasure modal, mandatory password confirmation, and local SQLite/SecureStore private data cleanup (`purgeUserAccountData`).
- **Backend Storage Erasure Hardening:** `boto3>=1.34.0` added to `requirements.txt`; `_delete_cloudinary` validates response and fails closed on unconfigured credentials; `_delete_s3` handles `ClientError` (404 idempotent, AccessDenied propagated); database session commit isolation enforced.
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
- **Backend Account Deletion Governance:** 22/22 tests green (100%).
- **Backend Foundation Hardening:** 44/44 focused tests green (100%).
- **Artwork Invariants:** 6/6 tests green (100%).
- **Mobile Typecheck:** Clean compilation (0 errors).
- **Offline Reliability:** SQLite WAL cache layer with `expenses_cache` and `offline_mutation_queue` verified.
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
- **Objective:** Final Privacy, Backend CI, boto3 Dependency & Play Store Compliance Completion.
- **Accomplishments:**
  - Added `boto3>=1.34.0` to `backend/requirements.txt` to eliminate GitHub Actions CI missing dependency errors.
  - Hardened remote storage erasure in `backend/app/services/storage_service.py`: validated Cloudinary response (`ok` or `not found`), fail closed on missing credentials, handled S3 `ClientError` (404 idempotent, AccessDenied propagated), and isolated database session commits so the outer request handler owns the transaction.
  - Enforced mandatory non-empty password verification for account deletion in `AccountDeleteRequest` and `/api/v1/auth/account`.
  - Expanded `backend/tests/test_account_deletion_governance.py` from 7 tests to 22 tests (100% passing) verifying all auth, password validation, replay, cascade, commit isolation, Cloudinary error, and S3 error cases.
  - Implemented real native UI in `mobile/app/(tabs)/profile.tsx`: "Change Password" modal and "Delete Account Permanently" modal with irreversible data warning, mandatory password re-entry, and local SQLite/SecureStore private data cleanup (`purgeUserAccountData`).
  - Updated `account-deletion-site/index.html` to require password confirmation before dispatching deletion requests.
  - Maintained 100% strict freeze on `frontend/` (0 files modified).

---

## 7. Next Recommended Task
1. Repository owner configures the 4 GitHub Actions secrets (`ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`) to enable signed production AAB generation.
2. Repository owner runs `cd account-deletion-site && vercel --prod` to deploy the public deletion portal to `https://vanvas-account-deletion.vercel.app`.
3. Sideload `VANVAS-Android-v0.4.0-code4-debug.apk` onto a physical Android device for field verification.
4. Run `python scripts/generate_pending_artwork_batch.py --execute --confirm-free-quota` on November 13, 2026 when free image-generation quota resets.
