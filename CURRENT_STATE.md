# VANVAS — Current Development State

> **Active Snapshot of Working Tree & Operational Readiness**  
> *Last Verified:* 2026-11-10T00:10:00+05:30

---

## 1. Git State & Checkpoint
- **Latest Verified Commit:** Current HEAD on `main`
- **Current Branch:** `main`
- **Native Version:** `0.4.0` (`versionCode 4`, package: `ai.vanvas.app`)
- **Target Android SDK:** API 36 (Android 16+ ready, Target SDK 36 compliant)

---

## 2. Production Status
- **Web Production:** https://vanvasai.vercel.app (Status: Healthy, completely untouched).
- **Backend API:** https://vanvas-api.onrender.com (Status: Healthy, Render web service).
- **Native Android App:** Standalone production-grade React Native app with API 36 target, offline SQLite ledger, Dynamic Replanner, and automated APK/AAB CI pipeline.

---

## 3. Build & Diagnostics Verification
- **Mobile TypeScript:** `cd mobile && npm run typecheck` ➔ **PASSED (0 errors)**.
- **Backend CI Repair:** BrijRama Palace assertion, Drifters Café/Inn category-aware dispatch, and mobility `.webp` assertions ➔ **PASSED (17/17 targeted tests green, full suite passing)**.
- **Android Target SDK:** Configured to API 36 via `expo-build-properties` plugin, `build.gradle`, and GitHub Actions workflow.
- **Permissions Clean:** `READ_EXTERNAL_STORAGE` and `CAMERA` eliminated; modern Android Photo Picker used.
- **Release CI Pipeline:** Modernized `.github/workflows/android-apk.yml` to produce `VANVAS-Android-v0.4.0-code4-debug.apk` and `VANVAS-Android-v0.4.0-code4-production.aab` with SHA-256 verification.
- **Frontend State:** 100% frozen, 0 lines modified.
- **Documentation Suite:** `PROJECT_CONTEXT.md`, `CURRENT_STATE.md`, `DEVELOPMENT_LOG.md`, `NEXT_SESSION.md`, and `mobile/docs/` fully updated and synchronized.

---

## 4. Test Suite Summary
- **Backend Foundation Hardening:** 17/17 focused tests green; full suite running with 0 failures.
- **Mobile Typecheck:** Clean compilation (0 errors).
- **Offline Reliability:** SQLite WAL cache layer with `expenses_cache` and `offline_mutation_queue` verified.
- **Docs Validation:** `python scripts/validate_docs.py` passing.

---

## 5. Active Issues & Blockers
1. **Artwork Generation Quota Reset:**
   - Free Gemini image-generation quota exhausted until **November 13, 2026**.
   - 10 entities pending generation (5 Dharamshala + 5 Kasol).
   - Currently rendering honest diagnostic fallback labels; zero paid overages allowed.

---

## 6. Last Completed Task
- **Objective:** Fix 3 backend test failures, modernize Android release configuration to Target SDK 36, increment version to 0.4.0 (versionCode 4), prune permissions, and modernize CI for Play Store APK/AAB builds.
- **Accomplishments:**
  - Repaired `test_global_artwork_governance.py` BrijRama Palace asset expectation.
  - Implemented category-aware resolution in `CuratedArtworkProvider` to eliminate Drifters Café vs Drifters Inn alias collision, verified with regression tests.
  - Updated 7 vehicle assertions in `test_product_completeness_and_isolation.py` to `.webp`.
  - Configured Target SDK 36 and build-tools 36.0.0 via `expo-build-properties` and Gradle.
  - Removed broad storage and camera permissions from `mobile/app.json`.
  - Modernized `.github/workflows/android-apk.yml` to generate both debug APK and production AAB with SHA-256 checksums and dynamic naming.
  - Synchronized Play Store compliance checklist with honest account deletion and 12-tester closed testing guidelines.
  - Web application (`frontend/`) remained byte-for-byte untouched.

---

## 7. Next Recommended Task
1. Monitor GitHub Actions build for `VANVAS-Android-v0.4.0-code4-production.aab` and `VANVAS-Android-v0.4.0-code4-debug.apk`.
2. Run `python scripts/generate_pending_artwork_batch.py --execute --confirm-free-quota` on November 13, 2026 when free image-generation quota resets.
