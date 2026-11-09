# VANVAS — Next Session Handoff & Action Plan

> **Actionable Briefing for the Next AI Coding Session**  
> *Current Checkpoint:* Commit `1fd8f48` | *Branch:* `main` | *Working Tree:* Clean

---

## 1. Context at a Glance
- **What You Are Working On:** VANVAS, a dual-platform Indian travel operating layer (Next.js web + React Native mobile + FastAPI backend).
- **Core Checkpoint:** Commit `1fd8f48` reconciled runtime artwork, migrated 52 vehicles to `.webp`, added native motorcycle expedition planning, theme persistence, and video focus handling.
- **Repository Health:** Mobile TypeScript (0 errors), Mobile Expo Doctor (18/18 checks passed), Web TypeScript (0 errors), Shared package builds cleanly, Invariants suite (6/6 passed).

---

## 2. Unresolved Issues & State
1. **Mobility Directory Test Assertion Mismatch:**
   - In `backend/tests/test_mobility_directory.py`, lines 171 and 212 still assert legacy `.jpg` extensions (`/images/vehicles/classic_bullet.jpg`) instead of the standardized `.webp` extension (`/images/vehicles/classic_bullet.webp`).
   - Updating these two assertions will bring `test_mobility_directory.py` to 13/13 passed.
2. **Pending Artwork Batch (10 Entities):**
   - Free Gemini image-generation quota is exhausted until **November 13, 2026**.
   - Do **NOT** attempt paid generation or incur cloud credits.
   - 10 entities are pending:
     - Dharamshala (5): Gyuto Monastery, Dal Lake Dharamshala, Tibetan Butter Tea & Tingmo Bakery Lane, Masroor Monolithic Rock-Cut Temples, Tashi Jong Buddhist Craft Community.
     - Kasol (5): Manikaran Sahib Gurudwara, Tosh Village, Moon Dance Café, Evergreen Café, Kheerganga Natural Sulphur Pool & Meadow.
   - When quota resets on Nov 13, generate clean painterly gouache illustrations with **ZERO embedded text, words, coordinates, or watermarks**.

---

## 3. Exact Tasks for the Next Session

### Task A (Immediate, 5 mins): Align Mobility Directory Test Assertions
1. Open `backend/tests/test_mobility_directory.py`.
2. Inspect line 171 (in `test_live_rentals_provider_osm_parsing`) and line 212 (in `test_vehicle_artwork_category_isolation`).
3. Update the expected list of image extensions from `.jpg` to `.webp` (or accept both `.webp` and `.jpg`).
4. Run `python -c "import sys; sys.path.insert(0, 'backend'); import pytest; sys.exit(pytest.main(['backend/tests/test_mobility_directory.py', '-v']))"` and verify all 13 tests pass.

### Task B: Automation Script for Quota Reset Batch (Preparation)
1. Prepare an automated generation script (e.g. `scripts/generate_pending_artwork_batch.py`) that reads the 10 pending entity prompts with strict negative prompts:
   ```
   NEGATIVE PROMPT: text, words, letters, typography, calligraphy, handwriting, labels, captions, watermarks, stamps, postmarks, logos, brand names, street signs, map coordinates, route markers, elevation numbers, borders, UI elements, split screen, photo collage.
   ```
2. Verify that this script does not execute until quota reset or when an authorized API key is provided.

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
