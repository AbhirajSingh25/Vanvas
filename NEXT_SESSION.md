# VANVAS — Next Session Handoff & Action Plan

> **Actionable Briefing for the Next AI Coding Session**  
> *Current Checkpoint:* Authentic User Data, Unified Traveler Passport & Avatar Durability Completed | *Branch:* `main` | *Working Tree:* Clean

---

## 1. Context at a Glance
- **What You Are Working On:** VANVAS, a dual-platform Indian travel operating layer (Next.js web + React Native mobile + FastAPI backend).
- **Core Checkpoint:**
  - **Permanent VANVAS Identity & Friends System:** Ambiguity-resistant `VNV-XXXX-XXXX` permanent ID, public profile lookup, request lifecycle (send, accept, decline, cancel), user blocking, privacy toggle `allow_friend_requests_via_id`. Native & Web `VanvasIdentityCard` with QR code modal and native share sheet.
  - **Private Crew Circles (मण्डली):** Multi-trip workspaces, member management (owner, admin, member), suggestions with private consensus voting (`HELL_YEAH`, `YES`, `NO`), Ask VANVAS AI recommendations, and real-time activity feed.
  - **Smart Finance 3-Layer Architecture:**
    - Layer 1: Trip Plan Budget (forecast only, zero debts).
    - Layer 2: Main Group Expense Ledger (collaborative expenses, payers, split methods, integer paise precision, optimistic version locking, audit logging).
    - Layer 3: Split Pods (independent subgroup ledgers e.g. Smokers pod, zero debt leakage into main group ledger).
    - Add Budget Item bottom sheet / modal with live per-person calculation previews in ₹ with 2 decimals.
  - **Mobile Parity & Offline SQLite Isolation:** User-scoped caching for crew circles and friends in `db.ts` (`user_circles_cache`, `user_friends_cache`) ensuring complete privacy isolation and single-owner account deletion purge.

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
4. Visually inspect all 10 generated images.

---

## 4. Verification Commands

Run the following commands to verify complete full-stack health:

```bash
# 1. Backend regression & governance tests (38 tests)
cd backend && python -m pytest tests/test_solo_traveler_circles.py tests/test_collaborative_crew_and_finance.py tests/test_account_deletion_governance.py

# 2. Mobile real SQLite offline isolation & teardown suite
node scripts/test_offline_isolation_and_account_deletion.mjs

# 3. Next.js Web production compilation
cd frontend && npm run build

# 4. Mobile React Native TypeScript check
cd mobile && npm run typecheck

# 5. Dual-platform shared package build
cd packages/shared && npm run build

# 6. Documentation and context validation
python scripts/validate_docs.py
```

---

## 5. Acceptance Criteria

- All 38 backend regression and governance tests must pass with 0 failures and 0 errors.
- All 31 mobile offline isolation tests must pass with 100% success.
- Next.js Web application must compile with 0 TypeScript or build errors.
- Mobile React Native application must pass `tsc --noEmit` with 0 errors.
- Zero debt leakage: Subgroup expenses inside Split Pods must strictly be excluded from the main circle ledger.
- Zero floating-point accumulation drift: All finance mathematics must use integer paise arithmetic.
- Zero secrets or private keys leaked in commits or documentation.
