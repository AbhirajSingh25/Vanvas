# VANVAS — Next Session Handoff & Action Plan

> **Actionable Briefing for the Next AI Coding Session**  
> *Current Checkpoint:* Dharamshala Editorial Artwork Rebuild, Duplicate Removal & Production Integration Completed on `main` | *Working Tree:* Clean

---

## 1. Context at a Glance
- **What You Are Working On:** VANVAS, a dual-platform Indian travel operating layer (Next.js web + React Native mobile + FastAPI backend).
- **Core Checkpoint:**
  - **Dharamshala Editorial Artwork Rebuild:**
    - 11 new high-resolution (1376x768) editorial travel illustrations generated, converted to WebP (`quality=90, method=6`) and JPEG fallbacks, with sidecar `.generated.json` metadata.
    - 5 places: Gyuto Monastery, Dal Lake Dharamshala, Tibetan Butter Tea & Tingmo Bakery Lane, Masroor Monolithic Rock-Cut Temples, Tashi Jong Buddhist Craft Community.
    - 4 stays: Fortune Park Moksha, Chonor House Tibetan Guesthouse, Clouds End Villa Heritage Estate, Zostel Dharamkot.
    - 2 rentals: Honda Activa 6G Cedar Ridge Edition, Classic 350 Dhauladhar Cruiser.
    - Removed all 5 Dharamshala flat vectors from `PENDING_ARTWORK_SET` in `frontend/lib/placeVisualResolver.ts`.
    - Zero duplicate collisions: 22 unique assets across 16 places, 4 stays, and 2 rentals.
    - Visual QA verified on desktop (1440x900) and mobile (390x844) with 0 network request errors (HTTP 200 on all images).
  - **Permanent VANVAS Identity & Friends System:** Ambiguity-resistant `VNV-XXXX-XXXX` permanent ID, public profile lookup, request lifecycle, user blocking, privacy toggle. Native & Web `VanvasIdentityCard` with QR code modal and native share sheet.
  - **Private Crew Circles (मण्डली):** Multi-trip workspaces, member management, private consensus voting (`HELL_YEAH`, `YES`, `NO`), Ask VANVAS AI recommendations, and real-time activity feed.
  - **Smart Finance 3-Layer Architecture:** Trip Plan Budget, Main Group Expense Ledger, and Split Pods with integer paise precision and optimistic version locking.

---

## 2. Unresolved Issues & State
1. **Pending Artwork Batch (Kasol 5 Entities):**
   - 5 Kasol flat vectors remain in `PENDING_ARTWORK_SET`:
     - `/images/places/kasol/pulga-fairy-forest.webp`
     - `/images/places/kasol/tulga-hamlet.webp`
     - `/images/places/kasol/rasol-trail.webp`
     - `/images/places/kasol/jim-morrison-cafe.webp`
     - `/images/places/kasol/waichin-valley.webp`
   - Generate clean painterly gouache illustrations with **ZERO embedded text, words, coordinates, or watermarks** following `VANVAS_ART_BIBLE.md`.
2. **Release Keystore Secrets Configuration (Owner Gate):**
   - Repository owner must add `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD` to GitHub Actions secrets to unlock production AAB signing.

---

## 3. Exact Tasks for the Next Session

### Task A: Kasol Artwork Batch Generation & Integration
1. Generate bespoke editorial illustrations for the 5 Kasol entities: Pulga Fairy Forest, Tulga Hamlet, Rasol Trail, Jim Morrison Cafe, and Waichin Valley.
2. Convert to WebP and JPEG, save sidecar `.generated.json` metadata.
3. Remove Kasol entities from `PENDING_ARTWORK_SET` in `frontend/lib/placeVisualResolver.ts`.
4. Run visual QA across desktop and mobile on `/explore/kasol`.

### Task B: Play Store Production AAB & Physical Device Testing
1. Once GitHub Secrets are added, trigger the release workflow to assemble `VANVAS-Android-v0.4.0-code4-production.aab`.
2. Sideload `VANVAS-Android-v0.4.0-code4-debug.apk` onto a physical Android device to test offline SQLite caching, Nearby Radar GPS permission, and Spiti expedition creation.
3. Review `mobile/docs/PLAY_STORE_RELEASE_CHECKLIST.md` before final Play Store submission.

---

## 4. Verification Commands

Run the following commands to verify complete full-stack health:

```bash
# 1. Next.js Web production compilation & typecheck
cd frontend && npx tsc --noEmit && npm run build

# 2. Backend regression & governance tests (38 tests)
cd backend && python -m pytest tests/test_solo_traveler_circles.py tests/test_collaborative_crew_and_finance.py tests/test_account_deletion_governance.py

# 3. Mobile real SQLite offline isolation & teardown suite
node scripts/test_offline_isolation_and_account_deletion.mjs

# 4. Context validation
python scripts/validate_docs.py
```

---

## 5. Acceptance Criteria
- All 5 Kasol entities have bespoke editorial artworks matching `VANVAS_ART_BIBLE.md` with zero text, typography, or watermarks.
- `PENDING_ARTWORK_SET` in `frontend/lib/placeVisualResolver.ts` is empty.
- Next.js production build (`npm run build`) and TypeScript (`tsc --noEmit`) pass with 0 errors.
- Visual QA on `/explore/kasol` shows 100% loaded images with zero failed network requests.

