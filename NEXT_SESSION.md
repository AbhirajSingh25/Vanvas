# VANVAS — Next Session Handoff & Action Plan

> **Actionable Briefing for the Next AI Coding Session**  
> *Current Checkpoint:* Dharamshala & Kasol Master Visual Rebuild, Service Worker v5 Upgrade & Integration Fixes Completed on `main` | *Working Tree:* Clean

---

## 1. Context at a Glance
- **What You Are Working On:** VANVAS, a dual-platform Indian travel operating layer (Next.js web + React Native mobile + FastAPI backend).
- **Core Checkpoint:**
  - **Dharamshala & Kasol Master Visual Rebuild & Integration:**
    - Root cause diagnosis and complete fix: PWA Service Worker cache lock, API response entity overwrite, and destination slug lookup normalization.
    - Upgraded `sw.js` to `vanvas-v5` with Stale-While-Revalidate and background purging.
    - Preserved exact curated canonical stays and places in `frontend/app/explore/[slug]/page.tsx` against backend fallback overrides.
    - Kasol border removal: Cropped white paper borders from `chojh-bridge`, `moon-dance-cafe`, and `evergreen-cafe`.
    - Kasol flat vector replacement: Replaced `pulga-fairy-forest`, `tulga-hamlet`, `rasol-trail`, `jim-morrison-cafe`, and `waichin-valley` with gouache artwork.
    - Kasol rental vehicle differentiation: Updated `kasol_parvati_bullet.webp` with distinct pine forest Enfield Classic 350.
    - Cleared `PENDING_ARTWORK_SET` in `placeVisualResolver.ts` (0 pending entities).
  - **Permanent VANVAS Identity & Friends System:** Ambiguity-resistant `VNV-XXXX-XXXX` permanent ID, public profile lookup, request lifecycle, user blocking, privacy toggle. Native & Web `VanvasIdentityCard` with QR code modal and native share sheet.
  - **Private Crew Circles (मण्डली):** Multi-trip workspaces, member management, private consensus voting (`HELL_YEAH`, `YES`, `NO`), Ask VANVAS AI recommendations, and real-time activity feed.
  - **Smart Finance 3-Layer Architecture:** Trip Plan Budget, Main Group Expense Ledger, and Split Pods with integer paise precision and optimistic version locking.

---

## 2. Unresolved Issues & State
1. **Release Keystore Secrets Configuration (Owner Gate):**
   - Repository owner must add `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD` to GitHub Actions secrets to unlock production AAB signing.

---

## 3. Exact Tasks for the Next Session

### Task A: Play Store Production AAB & Physical Device Testing
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

