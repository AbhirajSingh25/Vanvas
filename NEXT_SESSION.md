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

### Task A: Execute Pending Artwork Generation Batch (Upon Quota Reset)
1. Confirm that the image generation quota has reset on November 13, 2026.
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
