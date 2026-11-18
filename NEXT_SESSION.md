# VANVAS — Next Session Handoff & Action Plan

> **Actionable Briefing for the Next AI Coding Session**  
> *Current Checkpoint:* Destination Hero Reimagination (Manali, Kasol, Dharamshala, Goa) & Chapora Fort Rebuilt, SW `vanvas-v8` on `main` | *Working Tree:* Clean

---

## 1. Context at a Glance
- **What You Are Working On:** VANVAS, a dual-platform Indian travel operating layer (Next.js web + React Native mobile + FastAPI backend).
- **Core Checkpoint:**
  - **Destination Hero Reimagination (100% Unique, Full-Bleed 1376×768):**
    - **Manali Hero:** Hadimba Devi wooden pagoda temple nestled in the ancient Dhungri deodar cedar grove with morning crepuscular light rays and mossy forest path.
    - **Kasol Hero:** Low-angle riverside perspective along the rushing glacial turquoise Parvati River with granite boulders, rapids, suspension footbridge, and rustic timber guesthouses.
    - **Dharamshala Hero:** Layered hillside architectural panorama of Tsuglagkhang Buddhist monastery with gilded pagoda roofs, golden Dharma wheel, prayer flags, and the sheer snow-clad Dhauladhar wall.
    - **Goa Hero:** Portuguese colonial heritage villas with red Mangalore tile roofs, bougainvillea, palms, and traditional wooden canoa on a calm coastal estuary meeting the sunset sea.
  - **Goa Places Update:**
    - `chapora-fort.webp` & `.jpg`: Rebuilt with authentic weathered red laterite fort walls on cliff headland overlooking Vagator crescent beach and the Arabian Sea.
  - **Vehicle Rental Optimizer Fix (`VehicleArtwork.tsx`):**
    - Query strings removed from Next.js Image component to prevent HTTP 400 optimizer errors. Confirmed working in production.
  - **Cache Architecture:**
    - Service Worker bumped to `vanvas-v8` (`vanvas-pwa-v8.0.0`) with Network-First strategy for images.
    - URL cache buster `?v=v8` enforced in `VanvasImage.tsx`.

---

## 2. Unresolved Issues & State
1. **Model Quota Reset for Remaining Goa Places (~76h):**
   - The image generation model `gemini-3.1-flash-image` hit `HTTP 429 RESOURCE_EXHAUSTED` (`QUOTA_EXHAUSTED`, resets `2026-11-21T11:16:07Z`).
   - The remaining 7 Goa place artworks queued for generation upon quota reset are:
     1. `divar-island.webp` & `.jpg` (Mandovi River backwaters & Goan passenger ferry)
     2. `ashwem-beach.webp` & `.jpg` (Broad quiet sandy beach, coastal casuarina pines)
     3. `anjuna-flea-market.webp` & `.jpg` (Open-air flea market under palm canopy)
     4. `dudhsagar-falls.webp` & `.jpg` (Multi-tiered waterfall cascading down Western Ghats)
     5. `artjuna-cafe.webp` & `.jpg` (Open-air bohemian lifestyle garden cafe in Anjuna)
     6. `vinayak-family-restaurant.webp` & `.jpg` (Goan dining institution overlooking Assagao paddy fields)
     7. `basilica-bom-jesus.webp` & `.jpg` (Historic UNESCO Baroque church in Old Goa)
2. **Release Keystore Secrets Configuration (Owner Gate):**
   - Repository owner must add `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD` to GitHub Actions secrets to unlock production AAB signing.

---

## 3. Exact Tasks for the Next Session

### Task A: Generate Remaining 7 Goa Place Artworks (Once Quota Resets)
1. Generate the 7 Goa place artworks according to the prompts documented in `IMAGE_SEMANTIC_AUDIT.md`.
2. Convert all to 1376×768 WebP + JPEG full-bleed (zero borders, zero text).
3. Update contact sheets and verify 0 duplicates remain across all 16 Goa place entities.

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

# 2. Backend runtime invariants test
$env:PYTHONPATH="backend"; python -m pytest backend/tests/test_artwork_runtime_invariants.py
```
