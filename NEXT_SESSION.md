# VANVAS — Next Session Handoff & Action Plan

> **Actionable Briefing for the Next AI Coding Session**  
> *Current Checkpoint:* Master Visual Integrity Overhaul, Kasol 100% Borderless & Rental Repair, Kainchi Dham Initial Stays, SW `vanvas-v7` on `main` | *Working Tree:* Clean

---

## 1. Context at a Glance
- **What You Are Working On:** VANVAS, a dual-platform Indian travel operating layer (Next.js web + React Native mobile + FastAPI backend).
- **Core Checkpoint:**
  - **Kasol Complete Visual Integrity Overhaul (100% Bespoke, Borderless & Semantic):**
    - 16 canonical places are 100% borderless, full-bleed, bespoke gouache paintings with zero repetitive valley templates and zero text annotations.
    - 4 distinct hotel artworks: The Himalayan Village, Parvati Kuteer, Kasol Heights Resort, and The Hosteller Kasol. 100% unique architectural identities with 66.3 to 80.3 pairwise variance.
    - 2 distinct rentals: TVS Jupiter 125 Parvati Edition (dominant hero subject in 3/4 front view) and Classic 350 Parvati Mountain Cruiser (authentic Royal Enfield Classic 350 cruiser in halcyon green). Pairwise visual difference: 61.99.
  - **Kainchi Dham Stays Upgrade:**
    - Deployed bespoke illustrations for `Bara Bungalow Gethia (1898 Heritage)` and `The Hermitage Bhowali`.
  - **Cache Architecture:**
    - Service Worker bumped to `vanvas-v7` (`vanvas-pwa-v7.0.0`) with Network-First strategy for images.
    - URL cache buster `?v=v7` enforced in both `VanvasImage.tsx` and `VehicleArtwork.tsx`.
  - **Permanent VANVAS Identity & Friends System:** Ambiguity-resistant `VNV-XXXX-XXXX` permanent ID, public profile lookup, request lifecycle, user blocking, privacy toggle. Native & Web `VanvasIdentityCard` with QR code modal and native share sheet.
  - **Private Crew Circles (मण्डली):** Multi-trip workspaces, member management, private consensus voting (`HELL_YEAH`, `YES`, `NO`), Ask VANVAS AI recommendations, and real-time activity feed.
  - **Smart Finance 3-Layer Architecture:** Trip Plan Budget, Main Group Expense Ledger, and Split Pods with integer paise precision and optimistic version locking.

---

## 2. Unresolved Issues & State
1. **Model Quota Reset for Remaining Destinations (~4h):**
   - The image generation model `gemini-3.1-flash-image` hit a 429 quota exhaustion during Kainchi Dham remaining places. Once the quota resets, continue generating the remaining Kainchi Dham places/stays, followed by Manali, Goa, Udaipur, Jaipur, and Neemrana according to the audit contact sheets.
2. **Release Keystore Secrets Configuration (Owner Gate):**
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

# 2. Visual diagnostics test (all 44 places & stays)
python scripts/test_visual_diagnostics.py

# 3. Kasol place and stay uniqueness verification
python scripts/verify_all_16_places.py
python scripts/verify_kasol_stay_uniqueness.py

# 4. Mobile real SQLite offline isolation & teardown suite
node scripts/test_offline_isolation_and_account_deletion.mjs

# 5. Context validation
python scripts/validate_docs.py
```

---

## 5. Acceptance Criteria
- All 16 Kasol places and 16 Dharamshala places render authentic, bespoke editorial artworks matching `VANVAS_ART_BIBLE.md`.
- All 4 Kasol stays and 4 Dharamshala stays render distinct bespoke hotel artworks with zero identical landscape duplicates.
- Next.js production build (`npm run build`) and TypeScript (`tsc --noEmit`) pass with 0 errors.
- Service Worker runs `vanvas-v6` with Network-First strategy, and all `/images/` URLs have `?v=v6`.

