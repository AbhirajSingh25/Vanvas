# VANVAS — Next Session Handoff & Action Plan

> **Actionable Briefing for the Next AI Coding Session**  
> *Current Checkpoint:* Kasol Complete Visual Rebuild, Hotel Image Uniqueness, Runtime Deduplication & Production Fix on `main` | *Working Tree:* Clean

---

## 1. Context at a Glance
- **What You Are Working On:** VANVAS, a dual-platform Indian travel operating layer (Next.js web + React Native mobile + FastAPI backend).
- **Core Checkpoint:**
  - **Kasol Complete Visual Rebuild & Runtime Production Fix:**
    - 4 distinct hotel artworks generated and integrated: The Himalayan Village, Parvati Kuteer, Kasol Heights Resort, and The Hosteller Kasol. 100% unique architectural identities with 66.3 to 80.3 pairwise variance.
    - 16 canonical places verified with bespoke full-bleed gouache illustrations: Pulga Fairy Forest, Tulga Rustic Wooden Hamlet, Rasol Alpine Trail, Jim Morrison Cafe, and Waichin Valley resolved and borderless.
    - Runtime deduplication in `frontend/app/explore/[slug]/page.tsx`: Curated canonical package preserved as authoritative order, eliminating backend API duplicates (2 Chalal, 2 Manikaran, 2 Kheerganga, 1 duplicate Classic 350) and filtering out phantom `Parvati Woods` lodge.
    - Removed erroneous `parvati-woods` alias in `frontend/lib/placeVisualResolver.ts`.
    - Added `generateDestinationVisualAuditReport` in `frontend/lib/placeVisualResolver.ts`.
    - Dharamshala protected regression baseline passed 100% without modification.
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

