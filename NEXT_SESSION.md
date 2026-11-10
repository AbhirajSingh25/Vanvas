# VANVAS — Next Session Handoff & Action Plan

> **Actionable Briefing for the Next AI Coding Session**  
> *Current Checkpoint:* Commit `df29183` / Mobile Native 0.4.0 (Expo SDK 58 / RN 0.88) / Target SDK 36 / Play Store Ready | *Branch:* `main` | *Working Tree:* Clean

---

## 1. Context at a Glance
- **What You Are Working On:** VANVAS, a dual-platform Indian travel operating layer (Next.js web + React Native mobile + FastAPI backend).
- **Core Checkpoint:** 
  - Android Native App (`mobile/`) modernized to Expo SDK 58 (`expo ~58.0.23`), React Native 0.88.1, React 19.3.0, Node.js 22 LTS, and Target SDK 36 with compileSdkVersion 37.
  - Automated CI workflow `.github/workflows/android-apk.yml` segregated to build `VANVAS-Android-v0.4.0-code4-debug.apk` and `VANVAS-Android-v0.4.0-code4-validation.aab` by default, and `VANVAS-Android-v0.4.0-code4-production.aab` when release keystore secrets are present. Certificate is strictly verified with `keytool` (`CN!=Android Debug`).
  - Standalone Account & Data Deletion Portal created at `account-deletion-site/` satisfying Google Play Data Safety requirements with zero cookie/localStorage exposure, in-memory session isolation, and mandatory password verification. Ready for `vercel --prod` deployment.
  - Backend cascading deletion in `backend/app/api/v1/auth.py` and `backend/app/services/storage_service.py` cleans all related records, cascades expense shares/settlements, anonymizes circle chat messages, and deletes remote avatar assets from Cloudinary and AWS S3 with transactional rollback and fail-closed security. 22/22 automated governance tests verified passing. Full backend suite: 748 passed, 1 skipped, 0 failed.
  - Native in-app Delete Account and Change Password flows implemented in `mobile/app/(tabs)/profile.tsx` with modal confirmation, irreversible data warning, cancellation state reset, and duplicate tap protection.
  - Single-owner deletion teardown established in `AuthContext`: `nativeApi.deleteAccount` strictly executes backend deletion, while `AuthContext` guarantees credentials and React state are wiped in `try/finally` even if local disk operations encounter errors.
  - Account-scoped SQLite schema migration adding `user_id TEXT` to `expenses_cache` and `offline_mutation_queue`. Queue replay is strictly user-scoped to prevent cross-account mutation execution.
  - Automated mobile isolation suite (`scripts/test_offline_isolation_and_account_deletion.mjs`) verified 6/6 tests passing (100%).
  - Added `boto3>=1.34.0` to `backend/requirements.txt` ensuring backend CI dependency compliance.
  - Keystores strictly protected from Git commits via `.gitignore` (`*.jks`, `*.keystore`).
  - Frontend (`frontend/`) remains 100% frozen and untouched.
- **Repository Health:** Mobile TypeScript (0 errors), Backend targeted tests (44/44 passed 100%), Full backend suite (748 passed, 1 skipped, 0 failed), Artwork runtime invariants (6/6 passed 100%), Mobile offline isolation (6/6 passed 100%), Shared package builds cleanly.

---

## 2. Unresolved Issues & State
1. **Pending Artwork Batch (10 Entities):**
   - Free Gemini image-generation quota is exhausted until **November 13, 2026**.
   - Do **NOT** attempt paid generation or incur cloud credits.
   - 10 entities are pending:
     - Dharamshala (5): Gyuto Monastery, Dal Lake Dharamshala, Tibetan Butter Tea & Tingmo Bakery Lane, Masroor Monolithic Rock-Cut Temples, Tashi Jong Buddhist Craft Community.
     - Kasol (5): Manikaran Sahib Gurudwara, Tosh Village, Moon Dance Café, Evergreen Café, Kheerganga Natural Sulphur Pool & Meadow.
   - Script ready: `scripts/generate_pending_artwork_batch.py` with strict negative prompts (dry-run verified).
   - When quota resets on Nov 13, generate clean painterly gouache illustrations with **ZERO embedded text, words, coordinates, or watermarks**.
2. **Release Keystore Secrets Configuration (Owner Gate):**
   - Repository owner must add `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD` to GitHub Actions secrets to unlock production AAB signing.

---

## 3. Exact Tasks for the Next Session

### Task A: Play Store Production AAB & Physical Device Testing
1. Once GitHub Secrets are added, trigger the release workflow to assemble `VANVAS-Android-v0.4.0-code4-production.aab`.
2. Sideload `VANVAS-Android-v0.4.0-code4-debug.apk` onto a physical Android device to test offline SQLite caching, Nearby Radar GPS permission, and Spiti expedition creation.
3. Review `mobile/docs/PLAY_STORE_RELEASE_CHECKLIST.md` before final Play Store submission.

### Task B: Standalone Account Deletion Portal Deployment
1. Run `cd account-deletion-site && vercel --prod` to deploy to `https://vanvas-account-deletion.vercel.app`.
2. Verify live submission with test account against production backend.

### Task C: Execute Pending Artwork Generation Batch (Upon Quota Reset on Nov 13, 2026)
1. Confirm that the image generation quota has reset.
2. Run dry-run verification:
   `python scripts/generate_pending_artwork_batch.py`
3. Execute generation:
   `python scripts/generate_pending_artwork_batch.py --execute --confirm-free-quota`
4. Visually inspect all 10 generated images to verify:
   - Full-frame painterly gouache travel journal style.
   - Zero embedded letters, words, coordinates, borders, or watermarks.
5. Register newly generated assets in:
   - `backend/app/seed/authoritative_artwork_manifest.json`
   - `frontend/public/entity_art_manifest.json`
   - `packages/shared/src/constants/artworkManifest.ts`
6. Remove any pending diagnostic flags from `frontend/lib/placeVisualResolver.ts`.
7. Run `python -m pytest backend/tests/test_artwork_runtime_invariants.py -v` to ensure 6/6 tests pass.

---

## 4. Key Files to Inspect
- `.github/workflows/android-apk.yml` (release packaging & signing pipeline)
- `backend/app/api/v1/auth.py` (account deletion & cascading logic)
- `backend/app/services/storage_service.py` (Cloudinary/S3 remote asset deletion)
- `backend/tests/test_account_deletion_governance.py` (governance test suite)
- `account-deletion-site/` (standalone public deletion portal)
- `mobile/docs/ANDROID_RELEASE_GUIDE.md` (release guide & keystore instructions)
- `mobile/docs/PLAY_STORE_RELEASE_CHECKLIST.md` (compliance matrix & store checklist)

---

## 5. Verification Commands

```powershell
# 1. Run Account Deletion Governance Tests
python -c "import sys; sys.path.insert(0, 'backend'); import pytest; sys.exit(pytest.main(['backend/tests/test_account_deletion_governance.py', '-v']))"

# 2. Run Backend Invariants Test Suite
python -c "import sys; sys.path.insert(0, 'backend'); import pytest; sys.exit(pytest.main(['backend/tests/test_artwork_runtime_invariants.py', '-v']))"

# 3. Verify Mobile TypeScript
powershell -Command "cd mobile; npm run typecheck"

# 4. Run Mobile Expo Doctor
powershell -Command "cd mobile; npx expo-doctor"

# 5. Build Shared Package
powershell -Command "cd packages/shared; npm run build"

# 6. Validate Project Context Documentation
python scripts/validate_docs.py
```

---

## 6. Acceptance Criteria
- All 7 tests in `test_account_deletion_governance.py` pass cleanly.
- Invariant tests continue to pass (6/6).
- Mobile TypeScript check reports 0 errors.
- `frontend/` remains 100% untouched.
- `python scripts/validate_docs.py` passes with 0 errors.
- Working tree remains clean and properly documented.
