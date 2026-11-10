# VANVAS — Next Session Handoff & Action Plan

> **Actionable Briefing for the Next AI Coding Session**  
> *Current Checkpoint:* Mobile Native 0.4.0 (Expo SDK 58 / RN 0.88) / Target SDK 36 / Play Store Ready | *Branch:* `main` | *Working Tree:* Clean

---

## 1. Context at a Glance
- **What You Are Working On:** VANVAS, a dual-platform Indian travel operating layer (Next.js web + React Native mobile + FastAPI backend).
- **Core Checkpoint:** 
  - Android Native App (`mobile/`) modernized to Expo SDK 58 (`expo ~58.0.23`), React Native 0.88.1, React 19.3.0, Node.js 22 LTS, and Target SDK 36 with compileSdkVersion 37.
  - Automated CI workflow `.github/workflows/android-apk.yml` modernized to generate both Debug APK (`VANVAS-Android-v0.4.0-code4-debug.apk`) and Production AAB (`VANVAS-Android-v0.4.0-code4-production.aab`) with SHA-256 checksums, Android SDK 37/36 tools, release keystore injection, and graceful validation bundle fallback.
  - Standalone Account & Data Deletion Portal created at `account-deletion-site/` satisfying Google Play Data Safety requirements with zero cookie/localStorage exposure and in-memory session isolation.
  - Backend cascading deletion in `backend/app/api/v1/auth.py` and `backend/app/models/models.py` cleans expense shares, settlements, trips, and invokes `StorageService.delete_profile_photo`.
  - Frontend (`frontend/`) remains 100% frozen and untouched.
- **Repository Health:** Mobile TypeScript (0 errors), Backend targeted tests (22/22 passed 100%), Shared package builds cleanly, Invariants suite (6/6 passed).

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

---

## 3. Exact Tasks for the Next Session

### Task A: Android Preview APK / Production AAB Testing
1. Execute `eas build --platform android --profile preview` to generate sideloadable Android APK.
2. Install APK on a physical Android device to test offline SQLite caching, Nearby Radar GPS permission, and Spiti expedition creation.
3. Review `mobile/docs/PLAY_STORE_RELEASE_CHECKLIST.md` before final Play Store submission.

### Task B: Execute Pending Artwork Generation Batch (Upon Quota Reset on Nov 13, 2026)
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
- `backend/tests/test_mobility_directory.py` (lines 170-220)
- `backend/tests/test_artwork_runtime_invariants.py` (runtime invariant rules)
- `backend/app/seed/authoritative_artwork_manifest.json` (artwork registry)
- `packages/shared/src/constants/artworkManifest.ts` (shared artwork lookup)
- `frontend/lib/placeVisualResolver.ts` (web resolver & pending set)
- `mobile/app/(tabs)/plan.tsx` (native planner)

---

## 5. Verification Commands

```powershell
# 1. Run Backend Invariants Test Suite
python -c "import sys; sys.path.insert(0, 'backend'); import pytest; sys.exit(pytest.main(['backend/tests/test_artwork_runtime_invariants.py', '-v']))"

# 2. Run Mobility Directory Tests
python -c "import sys; sys.path.insert(0, 'backend'); import pytest; sys.exit(pytest.main(['backend/tests/test_mobility_directory.py', '-v']))"

# 3. Verify Mobile TypeScript
powershell -Command "cd mobile; npm run typecheck"

# 4. Run Mobile Expo Doctor
powershell -Command "cd mobile; npx expo-doctor"

# 5. Verify Frontend TypeScript
powershell -Command "cd frontend; npx tsc --noEmit"

# 6. Build Shared Package
powershell -Command "cd packages/shared; npm run build"
```

---

## 6. Acceptance Criteria
- All 13 tests in `test_mobility_directory.py` pass cleanly.
- Invariant tests continue to pass (6/6).
- Mobile and Web TypeScript checks report 0 errors.
- Working tree remains clean and properly documented.
