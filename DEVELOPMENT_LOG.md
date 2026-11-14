# VANVAS — Chronological Development Log

> **Audit Trail of Significant Engineering Milestones, Fixes, and Verification**  
> *Repository:* `AbhirajSingh25/Vanvas` | *Primary Branch:* `main`

---

### [2026-11-14] Dharamshala Editorial Artwork Rebuild, Duplicate Removal & Production Integration
- **Objective:** Generate bespoke, semantically accurate editorial travel artwork for Dharamshala, replace all flat vector placeholders in `PENDING_ARTWORK_SET`, eliminate duplicate/similar assets, provide unique property-specific artwork for 4 stays and 2 rentals, and verify rendering across viewports.
- **Root Cause & Diagnosis:**
  - 5 seeded Dharamshala places in `frontend/lib/placeVisualResolver.ts` were registered in `PENDING_ARTWORK_SET` awaiting quota (`gyuto-monastery`, `dal-lake-dharamshala`, `tibetan-butter-tea`, `masroor-rock-temples`, `tashi-jong-monastery`), resolving to flat vector SVG placeholders.
  - Stays in Dharamshala previously utilized generic mountain chalet artwork that did not capture the distinct cultural and architectural qualities of Fortune Park Moksha, Chonor House Tibetan Guesthouse, Clouds End Villa Heritage Estate, and Zostel Dharamkot.
  - Rentals in Dharamshala lacked property-specific vehicle illustrations matching the exact models (Honda Activa 6G and Royal Enfield Classic 350).
- **Changes Made:**
  - **Artwork Synthesis:** Generated 11 high-resolution (1376x768) standalone editorial travel illustrations with Imagen 3 / Antigravity `image-generator` adhering strictly to `VANVAS_ART_BIBLE.md` (rich gouache/watercolor on warm textured parchment, palette `#173B32`, `#B65E3C`, `#B49252`, `#D8DED5`, `#FAF7F0`, and zero text/typography/watermarks/frames).
  - **Places (5 Replaced Flat Vectors):**
    - Gyuto Tantric Monastery & Karmapa Seat (`gyuto-monastery.webp` & `.jpg`)
    - Dal Lake Dharamshala & Sacred Deodar Groves (`dal-lake-dharamshala.webp` & `.jpg`)
    - Tibetan Butter Tea & Tingmo Bakery Lane (`tibetan-butter-tea.webp` & `.jpg`)
    - Masroor Monolithic Rock-Cut Temples (`masroor-rock-temples.webp` & `.jpg`)
    - Tashi Jong Buddhist Craft Community & Stupas (`tashi-jong-monastery.webp` & `.jpg`)
  - **Stays (4 Unique Property Artworks):**
    - Fortune Park Moksha (`fortune-park-moksha.webp` & `.jpg`): Upscale contemporary Strawberry Hills mountain resort with infinity pool terrace.
    - Chonor House Tibetan Guesthouse (`chonor-house-tibetan-guesthouse.webp` & `.jpg`): Authentic Tibetan heritage guesthouse with carved dark deodar balconies and auspicious motifs.
    - Clouds End Villa Heritage Estate (`clouds-end-villa-heritage-estate.webp` & `.jpg`): 1850s Anglo-Indian colonial stone estate with wrap-around veranda and manicured lawns.
    - Zostel Dharamkot (`zostel-dharamkot.webp` & `.jpg`): Vibrant bohemian backpacker hostel with rooftop terrace and panoramic Dhauladhar ridge views.
  - **Rentals (2 Unique Vehicle Artworks):**
    - Honda Activa 6G Cedar Ridge Edition (`dharamshala_mcleod_scooter.webp` & `.jpg`): Matte graphite scooter on pine-lined mountain road.
    - Classic 350 Dhauladhar Cruiser (`dharamshala_dhauladhar_bullet.webp` & `.jpg`): Royal Enfield Classic 350 in forest green and chrome on high mountain pass.
  - **Production Optimization & Sidecars:** Converted all assets to optimized WebP (`quality=90, method=6`) and JPEG fallbacks, with sidecar `.generated.json` metadata for every asset.
  - **Resolver Promotion:** Removed all 5 Dharamshala entities from `PENDING_ARTWORK_SET` in `frontend/lib/placeVisualResolver.ts`.
- **Verification:**
  - **Uniqueness & Collision Audit:** Verified 22 unique assets across 16 places, 4 stays, and 2 rentals with 0 duplicate collisions.
  - **Visual QA:** Executed automated Puppeteer browser tests against `/explore/dharamshala` on desktop (1440x900) and mobile (390x844), confirming 0 failed network requests and HTTP 200 on all image requests.
  - **Build & Typecheck:** `cd frontend && npx tsc --noEmit && npm run build` passed with 0 errors (all 25 routes compiled cleanly).
- **Files Affected:**
  - `frontend/lib/placeVisualResolver.ts`
  - `frontend/public/images/places/dharamshala/gyuto-monastery.webp` + `.jpg` + `.generated.json`
  - `frontend/public/images/places/dharamshala/dal-lake-dharamshala.webp` + `.jpg` + `.generated.json`
  - `frontend/public/images/places/dharamshala/tibetan-butter-tea.webp` + `.jpg` + `.generated.json`
  - `frontend/public/images/places/dharamshala/masroor-rock-temples.webp` + `.jpg` + `.generated.json`
  - `frontend/public/images/places/dharamshala/tashi-jong-monastery.webp` + `.jpg` + `.generated.json`
  - `frontend/public/images/places/dharamshala/stays/fortune-park-moksha.webp` + `.jpg` + `.generated.json`
  - `frontend/public/images/places/dharamshala/stays/chonor-house-tibetan-guesthouse.webp` + `.jpg` + `.generated.json`
  - `frontend/public/images/places/dharamshala/stays/clouds-end-villa-heritage-estate.webp` + `.jpg` + `.generated.json`
  - `frontend/public/images/places/dharamshala/stays/zostel-dharamkot.webp` + `.jpg` + `.generated.json`
  - `frontend/public/images/vehicles/dharamshala_mcleod_scooter.webp` + `.jpg` + `.generated.json`
  - `frontend/public/images/vehicles/dhauladhar_bullet.webp` (maintained for backwards compat) / `dharamshala_dhauladhar_bullet.webp` + `.jpg` + `.generated.json`
  - `CURRENT_STATE.md`, `NEXT_SESSION.md`, `IMAGE_SEMANTIC_AUDIT.md`, `ARTWORK_GENERATION_GUIDE.md`

---

### [2026-11-12] P0 Live Navigation Recovery: Render-Loop Root Cause, SW Controller Transition, Chunk Auto-Recovery & Watchdog
- **Objective:** Diagnose and permanently resolve the live P0 navigation failure where clicking route links (`Explore`, `Trips`, `Circles`, etc.) on `vanvasai.vercel.app` left users stuck on `/`, while the local `Split a Budget` modal still opened.
- **Root Cause & Diagnosis:**
  - **Primary Runtime Root Cause (React Transition Starvation):** `AddBudgetItemModal.tsx` (mounted inside `TravelDesk.tsx` on `/`) used an unstable default parameter `splitPods = []` while `TravelDesk.tsx` passed an inline `Array.from(...)` for `members`. `AddBudgetItemModal`'s `useEffect([splitScope, selectedPodId, members, currentUserId, splitPods])` unconditionally called `setSelectedUserIds(members.map(...))`, creating an infinite re-render loop (`Maximum update depth exceeded`). Because Next.js `<Link>` / `router.push()` commits inside a React concurrent transition (`startTransition`), this continuous update loop starved Next.js route transitions on `/` even on fresh browser profiles with zero stale cache, whereas synchronous discrete state updates (`Split a Budget` modal open) bypassed transition scheduling.
  - **Secondary Lifecycle & Overlay Hardening:** `ServiceWorkerRegister.tsx` lacked `controllerchange` listener + in-memory per-document single-reload handling on existing installs; there was no automatic `ChunkLoadError` recovery or internal link watchdog; exiting `AnimatePresence` dialogs could briefly intercept pointer taps for ~200ms while fading; `AddBudgetItemModal` lacked an `Escape` key handler.
- **Changes Made:**
  - **Infinite Loop Fix:** Stabilized `AddBudgetItemModal.tsx` (`EMPTY_MEMBERS`/`EMPTY_PODS`, primitive ID signature keys, array equality guard, `Escape` handler, `role="dialog"`, `motion/react` import), memoized `budgetMembers` in `TravelDesk.tsx`, and hardened `ExpenseModal.tsx`.
  - **Service Worker v4 & Controller Transition:** Bumped `sw.js` to `vanvas-v4` (`CACHE_VERSION`), excluded RSC/private routes (`/trips`, `/circles`, `/friends`, `/profile`, `/settings`, `/bookings`, `/admin`, `/login`, `/api`) from public HTML caching, ensured zero 404 caching, and added `controllerchange` single-reload controller replacement (preserving first-install zero-reload and auth/URL continuity) in `ServiceWorkerRegister.tsx`.
  - **Global Chunk Recovery, Watchdog & Diagnostics:** Added `frontend/lib/navigationRecovery.ts` and `frontend/components/pwa/NavigationRecoveryProvider.tsx` (mounted in `app/layout.tsx`, integrated with `ErrorBoundary.tsx`), providing guarded single-reload chunk error recovery, repeatable-failure reload banner, same-origin route watchdog, and opt-in `?debugNavigation=1` diagnostics panel.
  - **Overlay & Scroll-Lock Integrity:** Updated `scrollLock.ts` (`reconcileOrphanedScrollLocks`) and `motion.ts` (`pointerEvents: "none"` on modal/sheet exit) plus `BottomSheet.tsx` / `VanvasAdaptiveModal.tsx` (`pointer-events-none` wrappers) so closed/closing modals never block navigation taps.
  - **Defensive Guards:** Added `Array.isArray` response guards on `app/circles/page.tsx` and `app/friends/page.tsx`.
- **Verification:**
  - Playwright E2E Suite (`scripts/e2e/navigation-runtime-recovery.spec.ts` against local `next start` production build): **6/6 PASSED (100% green)** covering Mobile `390x844`, Desktop `1440x900`, SW v3→v4 migration & session preservation (Scenarios A/B/F), Chunk recovery & repeat-failure banner (Scenarios C/D), Offline private-route protection (Scenario E), and iOS standalone + `?debugNavigation=1` (Scenario G).
  - PWA Acceptance Audit (`scripts/test_pwa_acceptance.mjs`): **64/64 PASSED (100% green)**.
  - Next.js TypeScript & Production Build (`cd frontend && npx tsc --noEmit && npm run build`): **PASSED (0 errors, 25/25 routes)**.
  - Mobile TypeScript (`cd mobile && npm run typecheck`): **PASSED (0 errors)**.
- **Files Affected:**
  - `frontend/components/finance/AddBudgetItemModal.tsx`
  - `frontend/components/home/TravelDesk.tsx`
  - `frontend/components/trip/ExpenseModal.tsx`
  - `frontend/public/sw.js`
  - `frontend/components/pwa/ServiceWorkerRegister.tsx`
  - `frontend/lib/navigationRecovery.ts`
  - `frontend/components/pwa/NavigationRecoveryProvider.tsx`
  - `frontend/components/monitoring/ErrorBoundary.tsx`
  - `frontend/app/layout.tsx`
  - `frontend/lib/scrollLock.ts`
  - `frontend/lib/motion.ts`
  - `frontend/components/ui/BottomSheet.tsx`
  - `frontend/components/ui/VanvasAdaptiveModal.tsx`
  - `frontend/components/layout/ChaloLauncherModal.tsx`
  - `frontend/app/circles/page.tsx`
  - `frontend/app/friends/page.tsx`
  - `scripts/e2e/playwright.config.ts`
  - `scripts/e2e/navigation-runtime-recovery.spec.ts`

---

### [2026-11-11] Navigation Recovery, Crew Circles Access & Backend CI Regression Fix
- **Objective:** Resolve P0 homepage navigation interception, expose Circles & Friends across desktop and mobile shells, bump service worker caching to eliminate stale client bundles, and fix CI 422 regression in backend travel circles tests.
- **Root Cause & Diagnosis:**
  - **CI 422 Regression:** Adding `AskVanvasCircleRequest` and `AskVanvasCircleResponse` in `backend/app/schemas/schemas.py` for Crew Circles had shadowed the existing schemas of the same name for public travel circles (`travel_circles.py`), breaking endpoint payload parsing in `test_ask_vanvas_planning_for_circle`.
  - **Navigation Stale Bundle Regression:** Next.js Turbopack client navigation was blocked due to outdated precached assets from `vanvas-v2` in `sw.js` without an automatic cache bump or `SKIP_WAITING` listener. Additionally, an ornamental backdrop overlay in `app/page.tsx` was missing `pointer-events-none`.
- **Changes Made:**
  - **Backend Schema Collision Resolved:** Renamed private crew circle schemas to `AskCrewCircleRequest` and `AskCrewCircleResponse` in `backend/app/schemas/schemas.py` and updated `backend/app/api/v1/crew_circles.py`. Public travel circle schemas remain untouched.
  - **Web Navigation Overhaul:**
    - Mobile bottom navigation (`MobileNav.tsx`): Replaced unused 5th tab with "Circles" (`/circles`, `Users` icon, "मण्डली"), active on both `/circles` and `/friends`.
    - Desktop header (`Header.tsx`): Added "Circles" and "Friends" to main nav links, profile popover dropdown, and mobile menu overlay with localized labels and icons.
    - Homepage command center (`MobileTravelCommandCenter.tsx`): Added prominent **"Your Crew · आपका समूह"** section displaying active Crew Circles and Friends cards, plus guest CTA ("Sign In to Join" with redirect).
    - Page overlay (`app/page.tsx`): Added `pointer-events-none` to prevent ambient gradient overlay from intercepting touch/mouse events.
  - **Service Worker Cache Invalidation:** Bumped `CACHE_VERSION` to `vanvas-v3` in `sw.js`, implemented purge for stale caches, and added `message` event handler for `SKIP_WAITING`.
  - **Native Android Navigation:** Created `mobile/app/(tabs)/circles.tsx`, wired tab navigation in `mobile/app/(tabs)/_layout.tsx`, and added Crew Circles quick-action in `mobile/app/(tabs)/index.tsx`.
- **Verification:**
  - Backend regression: `pytest tests/test_solo_traveler_circles.py tests/test_collaborative_crew_and_finance.py tests/test_account_deletion_governance.py` ➔ **38/38 PASSED (100% green, 0 errors)**.
  - Frontend production build: `cd frontend && npm run build` ➔ **PASSED (0 errors, 25/25 routes static/prerendered)**.
  - Mobile TypeScript: `cd mobile && npm run typecheck` ➔ **PASSED (0 errors)**.
- **Files Affected:**
  - `backend/app/schemas/schemas.py`
  - `backend/app/api/v1/crew_circles.py`
  - `frontend/public/sw.js`
  - `frontend/components/layout/MobileNav.tsx`
  - `frontend/components/layout/Header.tsx`
  - `frontend/components/home/MobileTravelCommandCenter.tsx`
  - `frontend/app/page.tsx`
  - `mobile/app/(tabs)/circles.tsx`
  - `mobile/app/(tabs)/_layout.tsx`
  - `mobile/app/(tabs)/index.tsx`

---

### [2026-11-11] Crew Circles, Collaborative Travel & Smart Expense Ecosystem Implementation
- **Objective:** Complete full-stack end-to-end implementation of Crew Circles (मण्डली), Friend Connections with permanent `vanvas_id`, and the 3-Layer Smart Finance System across Web, Mobile Native (Android API 36), Backend FastAPI, and PostgreSQL/SQLite database with complete offline isolation.
- **Changes Made:**
  - **Identity & Friends:** Added permanent `vanvas_id` (`VNV-XXXX-XXXX`) with ambiguity-resistant base32 charset and privacy toggle `allow_friend_requests_via_id`. Implemented lookup, friend requests lifecycle, friend lists, and blocking. Built web and native `VanvasIdentityCard` with copy, native share, and live QR code modal.
  - **Private Crew Circles:** Implemented multi-trip collaborative circles with member roles, private consensus voting on suggestions (`HELL_YEAH`, `YES`, `NO`), Ask VANVAS AI recommendations, and activity chat feeds.
  - **3-Layer Smart Finance:**
    - Layer 1: Trip Budget Plan (forecast only, zero debts).
    - Layer 2: Main Group Ledger with integer paise arithmetic, optimistic version locking, and full audit logging.
    - Layer 3: Split Pods (subgroup ledgers e.g. Smokers pod) with strict mathematical and query isolation ensuring zero debt leakage into non-pod members.
    - Add Budget Item bottom sheet / modal with live per-person calculation previews and multiple calculation bases (`FIXED`, `PER_PERSON`, `QTY_UNIT`).
  - **Native Parity & Offline Isolation:** Added SQLite tables `user_circles_cache` and `user_friends_cache` with authenticated `userId` isolation and purge teardown in `db.ts`, and full mobile screens in `mobile/app/friends/` and `mobile/app/circles/`.
  - **Automated Verification:** Verified 5/5 collaborative crew & finance tests, 22/22 account deletion governance tests (27/27 total green), 31/31 mobile offline isolation tests, 0 Next.js build errors, and 0 mobile TypeScript errors.
- **Files Affected:**
  - `backend/app/models/models.py`
  - `backend/app/schemas/schemas.py`
  - `backend/app/api/v1/auth.py`
  - `backend/app/api/v1/friends.py`
  - `backend/app/api/v1/crew_circles.py`
  - `backend/app/api/v1/split_pods.py`
  - `backend/app/api/v1/collaborative_finance.py`
  - `backend/app/services/finance_service.py`
  - `backend/app/database/session.py`
  - `backend/app/main.py`
  - `backend/alembic/versions/0003_crew_circles_friends_finance.py`
  - `backend/tests/test_collaborative_crew_and_finance.py`
  - `packages/shared/src/types/index.ts`
  - `frontend/types/index.ts`
  - `frontend/lib/api.ts`
  - `frontend/app/friends/page.tsx`
  - `frontend/app/circles/page.tsx`
  - `frontend/app/circles/[id]/page.tsx`
  - `frontend/app/profile/page.tsx`
  - `frontend/components/profile/VanvasIdentityCard.tsx`
  - `frontend/components/finance/AddBudgetItemModal.tsx`
  - `frontend/components/trip/VanvasSplitView.tsx`
  - `frontend/components/home/TravelDesk.tsx`
  - `mobile/src/services/api.ts`
  - `mobile/src/services/db.ts`
  - `mobile/src/components/VanvasIdentityCard.tsx`
  - `mobile/src/components/AddBudgetItemBottomSheet.tsx`
  - `mobile/app/friends/index.tsx`
  - `mobile/app/circles/index.tsx`
  - `mobile/app/circles/[id].tsx`
  - `mobile/app/(tabs)/profile.tsx`
  - `mobile/app/_layout.tsx`
  - `CURRENT_STATE.md`
  - `DEVELOPMENT_LOG.md`
  - `NEXT_SESSION.md`
  - `PROJECT_CONTEXT.md`
  - `DECISIONS.md`
- **Tests Executed:**
  - `pytest backend/tests/test_collaborative_crew_and_finance.py backend/tests/test_account_deletion_governance.py` ➔ 27/27 PASSED (100%)
  - `node scripts/test_offline_isolation_and_account_deletion.mjs` ➔ 31/31 PASSED (100%)
  - `cd frontend && npm run build` ➔ PASSED (0 errors, 100% clean production build)
  - `cd mobile && npm run typecheck` ➔ PASSED (0 errors)
  - `cd packages/shared && npm run build` ➔ PASSED (0 errors)
- **Commit:** `a969a9f`
- **Objective:** Eliminate duplicate post-deletion cleanup between `api.ts` and `AuthContext.tsx`, ensure robust fail-safe local error recovery where server success never falsely reports local SQLite errors, introduce additive SQLite schema migration adding `user_id` to `expenses_cache` and `offline_mutation_queue`, prevent cross-account offline mutation replay, ensure user-scoped cache erasure, and add automated regression test suite.
- **Changes Made:**
  - In `mobile/src/services/api.ts`: Refactored `deleteAccount` to strictly call the backend DELETE `/auth/account` endpoint and return the response, removing redundant SecureStore/SQLite cleanup. Scoped `getExpenses`, `addExpense`, `deleteExpense`, and `syncPendingOfflineActions` to `currentUser.id`.
  - In `mobile/src/context/AuthContext.tsx`: Established `AuthContext.deleteAccount` as the single owner of session teardown, private data purge, and React state reset. Wrapped SecureStore and React state clearing in `try/finally` so the user is always logged out upon confirmed server deletion, and encapsulated SQLite purge so local disk errors log a warning without reporting false server rejection.
  - In `mobile/src/services/db.ts`: Introduced additive schema migration in `initSchema` checking `PRAGMA table_info` and adding `user_id TEXT` to `expenses_cache` and `offline_mutation_queue`. Scoped `cacheTripExpenses`, `getCachedTripExpenses`, `saveOfflineExpense`, `deleteOfflineExpense`, `queueOfflineMutation`, and `getPendingMutations` to `userId`. Updated `purgeUserAccountData(userId)` to delete only the specified user's private records without dropping other accounts' data or public destination catalogues.
  - In `mobile/app/(tabs)/profile.tsx`: Added duplicate tap guard `if (isDeletingAccount) return;` and implemented `handleCancelDelete` to clear entered password, error banner, and confirmation checkbox on modal dismiss or cancel.
  - Created automated test suite `scripts/test_offline_isolation_and_account_deletion.mjs` verifying all 6 isolation, migration, and teardown scenarios (100% passing).
  - Maintained 100% strict freeze on `frontend/` (0 files modified).
- **Files Affected:**
  - `mobile/src/services/api.ts`
  - `mobile/src/context/AuthContext.tsx`
  - `mobile/src/services/db.ts`
  - `mobile/app/(tabs)/profile.tsx`
  - `scripts/test_offline_isolation_and_account_deletion.mjs`
  - `CURRENT_STATE.md`
  - `NEXT_SESSION.md`
  - `PROJECT_CONTEXT.md`
  - `DEVELOPMENT_LOG.md`
  - `mobile/docs/PLAY_STORE_RELEASE_CHECKLIST.md`
  - `mobile/docs/MOBILE_QA_REPORT.md`
- **Tests Executed:**
  - `scripts/test_offline_isolation_and_account_deletion.mjs`: 6/6 passed (100%).
  - `backend/tests/test_account_deletion_governance.py`: 22/22 passed (100%).
  - Full backend pytest suite: 748 passed, 1 skipped, 0 failed, 10 deselected (100%).
  - `cd mobile && npm run typecheck`: 0 errors.
  - `cd mobile && npx expo config --type public`: Exited code 0.
  - `cd packages/shared && npm run build`: 0 errors.
  - `git diff --name-only frontend/`: 0 files modified (100% frozen).
- **Remaining Issues:** 10 destination artwork entities await image-generation quota reset on November 13, 2026; production AAB signing and public portal deployment remain owner-blocked on credentials.

---

### [2026-11-10] Final Privacy, Backend CI, boto3 Dependency & Play Store Compliance Completion
- **Commit:** `df29183`
- **Objective:** Fix backend boto3 dependency failure in GitHub Actions CI, harden remote avatar deletion against false positives and unconfigured storage providers, enforce mandatory password verification on account deletion, build native Profile account deletion and password change UI modals with private SQLite cleanup, and ensure full Play Store compliance.
- **Changes Made:**
  - Added `boto3>=1.34.0` to `backend/requirements.txt` to resolve `ModuleNotFoundError: No module named 'boto3'` in GitHub Actions CI.
  - Hardened `_delete_cloudinary` in `backend/app/services/storage_service.py`: validated response JSON (`result in ("ok", "not found")`), fail closed with `StorageServiceException` if credentials are unconfigured or remote API returns error/non-JSON.
  - Hardened `_delete_s3` in `backend/app/services/storage_service.py`: handled botocore `ClientError` (404/NoSuchKey treated as idempotent success; AccessDenied and network errors propagated), fail closed on unconfigured AWS credentials.
  - Hardened `delete_profile_photo`: when `db` session is passed, staged blob deletion without committing, keeping transaction control with the request handler.
  - Made password confirmation mandatory in `AccountDeleteRequest` and `/api/v1/auth/account`: rejects empty or incorrect passwords with 422 or 400.
  - Expanded `backend/tests/test_account_deletion_governance.py` from 7 tests to 22 tests (100% passing) covering unauthenticated access, validation errors, bad passwords, successful cascades, message anonymization, replay protection, Cloudinary edge cases, S3 edge cases, and transaction rollback isolation.
  - Updated `mobile/src/services/api.ts` with `changePassword` and `deleteAccount` methods.
  - Added `purgeUserAccountData` in `mobile/src/services/db.ts` to wipe user trips, cached expenses, and offline mutation queue from SQLite on deletion without dropping destination catalogs.
  - Integrated `deleteAccount` and `changePassword` into `mobile/src/context/AuthContext.tsx`.
  - Built real native UI in `mobile/app/(tabs)/profile.tsx`: added Change Password modal and Delete Account Permanently modal with irreversible data warning, mandatory password re-entry, checkbox confirmation, and local SQLite/SecureStore private data purging.
  - Updated `account-deletion-site/index.html` with mandatory password validation before deletion.
  - Synchronized documentation in `mobile/docs/PLAY_STORE_RELEASE_CHECKLIST.md`, `mobile/docs/MOBILE_QA_REPORT.md`, `mobile/docs/MOBILE_NEXT_STEPS.md`, `CURRENT_STATE.md`, `NEXT_SESSION.md`, `PROJECT_CONTEXT.md`.
  - Preserved 100% strict freeze on `frontend/` (0 files modified).
- **Files Affected:**
  - `backend/requirements.txt`
  - `backend/app/schemas/schemas.py`
  - `backend/app/services/storage_service.py`
  - `backend/app/api/v1/auth.py`
  - `backend/tests/test_account_deletion_governance.py`
  - `mobile/src/services/api.ts`
  - `mobile/src/services/db.ts`
  - `mobile/src/context/AuthContext.tsx`
  - `mobile/app/(tabs)/profile.tsx`
  - `account-deletion-site/index.html`
  - `mobile/docs/PLAY_STORE_RELEASE_CHECKLIST.md`
  - `mobile/docs/MOBILE_QA_REPORT.md`
  - `mobile/docs/MOBILE_NEXT_STEPS.md`
  - `CURRENT_STATE.md`
  - `NEXT_SESSION.md`
  - `PROJECT_CONTEXT.md`
  - `DEVELOPMENT_LOG.md`
- **Tests Executed:**
  - `backend/tests/test_account_deletion_governance.py`: 22/22 passed (100%).
  - `backend/tests/test_profile_and_settings.py`: 5/5 passed (100%).
  - `cd mobile && npm run typecheck`: 0 errors.
  - `npx expo config --type public`: 0 errors.
  - `cd packages/shared && npm run build`: 0 errors.
  - `git diff --name-only frontend/`: 0 files modified (100% frozen).
- **Remaining Issues:** 10 destination artwork entities await image-generation quota reset on November 13, 2026.

---

### [2026-11-10] Final Release Gate Closure: Production Signing, Account Erasure Governance & Store Handoff
- **Commit:** `7d81a79`
- **Objective:** Complete Play Store production release requirements: implement real remote storage deletion (Cloudinary & S3), comprehensive cascading account erasure, strict release AAB vs validation AAB CI segregation with non-debug certificate verification, keystore git protection, and synchronize release documentation.
- **Changes Made:**
  - Implemented `_delete_cloudinary` (REST API destroy) and `_delete_s3` (boto3 delete_object) in `backend/app/services/storage_service.py` to eradicate orphaned cloud assets on account deletion.
  - Hardened `delete_account` in `backend/app/api/v1/auth.py`: validates password confirmation if provided, cascades or cleans all foreign-key dependencies (`ExpenseShare`, `SettlementPayment`, `SoloMatch`, `SoloDirectMessage`, `TravelerBlock`, `TravelerReport`, `ReviewReport`, `CircleActivityVote`, `CircleActivity`, `TravelCircle`, `PaymentTransaction`), nullifies `MobilityProvider.owner_user_id`, anonymizes `CircleMessage` (`user_id = None`) to preserve group chat context, and safely rolls back transaction on remote storage error (HTTP 502).
  - Authored comprehensive test suite `backend/tests/test_account_deletion_governance.py` with 7 passing tests (100%).
  - Added `*.jks` and `*.keystore` to root `.gitignore` to prevent accidental credential leakage.
  - Re-engineered `.github/workflows/android-apk.yml`: segregated `VANVAS-Android-v0.4.0-code4-validation.aab` from upload-signed `VANVAS-Android-v0.4.0-code4-production.aab`, enforced certificate inspection via `keytool -printcert -jarfile`, and blocked debug signatures.
  - Updated `mobile/docs/ANDROID_RELEASE_GUIDE.md`, `mobile/docs/PLAY_STORE_RELEASE_CHECKLIST.md`, and `mobile/docs/MOBILE_QA_REPORT.md` with exact keystore generation commands, PowerShell Base64 conversion, physical device testing instructions, and owner deployment instructions.
  - Maintained 100% strict freeze on `frontend/` (0 files modified).
- **Files Affected:**
  - `backend/app/services/storage_service.py`
  - `backend/app/api/v1/auth.py`
  - `backend/tests/test_account_deletion_governance.py`
  - `.gitignore`
  - `.github/workflows/android-apk.yml`
  - `mobile/docs/ANDROID_RELEASE_GUIDE.md`
  - `mobile/docs/PLAY_STORE_RELEASE_CHECKLIST.md`
  - `mobile/docs/MOBILE_QA_REPORT.md`
  - `CURRENT_STATE.md`
  - `NEXT_SESSION.md`
  - `DEVELOPMENT_LOG.md`
  - `PROJECT_CONTEXT.md`
- **Tests Executed:**
  - `backend/tests/test_account_deletion_governance.py`: 7/7 passed (100%).
  - `backend/tests/test_profile_and_settings.py`: 5/5 passed (100%).
  - Full backend targeted suite (29 tests): 29/29 passed (100%).
  - Artwork runtime invariants (`backend/tests/test_artwork_runtime_invariants.py`): 6/6 passed (100%).
  - `cd mobile && npm run typecheck`: 0 errors.
  - `git diff --name-only frontend/`: 0 files modified (100% frozen).
- **Remaining Issues:** 10 destination artwork entities await image-generation quota reset on November 13, 2026.

---

### [2026-11-10] Native Production Release, Expo SDK 58 Modernization & Standalone Deletion Portal
- **Commit:** `bd54384`
- **Objective:** Modernize native application to Expo SDK 58, React Native 0.88.1, and React 19.3.0, verify Android API 36 compilation with compileSdkVersion 37, bulletproof the release signing CI pipeline, cascade account deletion in backend, build standalone account deletion site, and maintain 100% frontend freeze.
- **Changes Made:**
  - Modernized `mobile/package.json` to authoritative Expo SDK 58 dependencies (`expo ~58.0.23`, `react-native 0.88.1`, `react 19.3.0`, `react-native-worklets 0.13.0`, `expo-build-properties ~58.0.12`).
  - Resolved all React Native 0.88 and TypeScript compatibility issues: replaced `StyleSheet.absoluteFillObject` with `StyleSheet.absoluteFill`, added local `ViewToken` compatibility interface in `ReelsCarousel.tsx`, replaced `@react-navigation/native` `useIsFocused` with `expo-router` `usePathname`, and removed unsupported `backgroundColor` prop from `<StatusBar>`.
  - Configured `expo-build-properties` for compileSdkVersion 37 and targetSdkVersion 36, verified via `npx expo config --type public` and prebuild.
  - Hardened backend cascading deletion in `backend/app/models/models.py` and `backend/app/api/v1/auth.py` by cascading expense shares, settlement payments, and invoking `StorageService.delete_profile_photo`.
  - Built standalone `account-deletion-site/` (HTML/CSS/JS + `vercel.json` + README) ensuring Google Play Data Safety compliance with zero cookie/localStorage storage and dedicated token isolation.
  - Modernized CI workflows (`.github/workflows/ci.yml` and `android-apk.yml`) to Node.js 22 runtime, Android SDK platform 37/36, release secret check before build, and graceful validation bundle fallback.
- **Files Affected:**
  - `mobile/package.json`
  - `mobile/package-lock.json`
  - `mobile/app.json`
  - `mobile/app/(tabs)/_layout.tsx`
  - `mobile/app/(tabs)/explore.tsx`
  - `mobile/app/(tabs)/profile.tsx`
  - `mobile/app/_layout.tsx`
  - `mobile/app/destination/[slug].tsx`
  - `mobile/app/treks/index.tsx`
  - `mobile/src/components/DestinationCard.tsx`
  - `mobile/src/components/ReelsCarousel.tsx`
  - `account-deletion-site/index.html`
  - `account-deletion-site/vercel.json`
  - `account-deletion-site/README.md`
  - `backend/app/models/models.py`
  - `backend/app/api/v1/auth.py`
  - `.github/workflows/ci.yml`
  - `.github/workflows/android-apk.yml`
  - `PROJECT_CONTEXT.md`
  - `CURRENT_STATE.md`
  - `DEVELOPMENT_LOG.md`
- **Tests Executed:**
  - `cd mobile && npm run typecheck`: 0 errors.
  - `npx expo config --type public`: Clean configuration (SDK 58.0.0, compileSdk 37, targetSdk 36).
  - `npx expo prebuild --platform android --clean --no-install`: Clean generation.
  - `cd backend && python -m pytest tests/test_profile_and_settings.py tests/test_global_artwork_governance.py tests/test_image_collision_system.py tests/test_product_completeness_and_isolation.py -v`: 22/22 passed (100%).
  - `cd packages/shared && npm run build`: 0 errors.
  - `git diff --name-only frontend/`: 0 files modified (100% frozen).
- **Remaining Issues:** 10 destination artwork entities await image-generation quota reset on November 13, 2026.

---

### [2026-11-10] Backend Test Suite Repair, Android Target SDK 36 Modernization & Dual APK/AAB Pipeline
- **Commit:** Pending
- **Objective:** Fix the 3 failing backend tests from commit `a840b75`, modernize Android configuration to Target SDK 36 (Android 16+), increment app version to `0.4.0` (versionCode `4`), prune permissions, and modernize CI to produce both debug APK and production AAB bundles.
- **Changes Made:**
  - Repaired `backend/tests/test_global_artwork_governance.py`: Updated BrijRama Palace assertion from legacy `brijrama-palace.webp` to canonical verified asset `/images/places/varanasi/stays/brijrama-palace-heritage-grand.webp` while maintaining negative guardrails.
  - Resolved Drifters Café / Drifters Inn collision in `backend/app/providers/artwork_provider.py`: Refactored lookup logic with category-aware discrimination (`is_food_or_cafe_query` prioritizes `PLACE_ARTWORK_REGISTRY`; `is_stay_query` prioritizes `HOTEL_ARTWORK_REGISTRY`). Added regression test cases in `backend/tests/test_image_collision_system.py`.
  - Repaired vehicle artwork assertions in `backend/tests/test_product_completeness_and_isolation.py`: Updated 7 `.jpg` assertions to canonical `.webp` paths.
  - Upgraded Android target SDK to 36 and build-tools to `36.0.0` in `mobile/android/build.gradle` and `mobile/app.json` via `expo-build-properties`.
  - Incremented version to `0.4.0` and `versionCode` to 4 across `mobile/app.json`, `mobile/package.json`, and Gradle.
  - Pruned `READ_EXTERNAL_STORAGE` and `CAMERA` permissions from `mobile/app.json` in accordance with modern Android Photo Picker compliance.
  - Modernized `.github/workflows/android-apk.yml`: Added `bundleRelease` step for production AAB, SHA-256 checksum generation, dynamic naming (`VANVAS-Android-v0.4.0-code4-debug.apk` and `VANVAS-Android-v0.4.0-code4-production.aab`), and Android SDK platform 36 installation.
  - Corrected `mobile/docs/PLAY_STORE_RELEASE_CHECKLIST.md` and `PROJECT_CONTEXT.md` to reflect `ai.vanvas.app`, Target SDK 36, honest account deletion documentation, and 12-tester closed testing rules.
- **Files Affected:**
  - `backend/app/providers/artwork_provider.py`
  - `backend/tests/test_global_artwork_governance.py`
  - `backend/tests/test_image_collision_system.py`
  - `backend/tests/test_product_completeness_and_isolation.py`
  - `mobile/app.json`
  - `mobile/package.json`
  - `mobile/android/build.gradle`
  - `mobile/android/app/build.gradle`
  - `.github/workflows/android-apk.yml`
  - `mobile/docs/PLAY_STORE_RELEASE_CHECKLIST.md`
  - `PROJECT_CONTEXT.md`
  - `CURRENT_STATE.md`
  - `NEXT_SESSION.md`
- **Tests Executed:**
  - Backend targeted test suite: 17/17 passed (100%).
  - Backend full test suite: In progress, 0 failures.
  - Mobile TypeScript: `npx tsc --noEmit` passed (0 errors).
  - Frontend Freeze: Verified 0 files modified in `frontend/`.
- **Remaining Issues:** 10 destination artwork entities await image-generation quota reset on November 13, 2026.

---

### [2026-11-09] Mobility Directory WebP Assertions & Quota-Safe Batch Preparation
- **Commit:** `e4822c5` & `6feee0f`
- **Objective:** Correct 10 outdated `.jpg` vehicle assertions in `backend/tests/test_mobility_directory.py`, ensure all vehicle assets physically exist as WebP on disk, execute full regression test suites across Web, Native, and Backend, and prepare the quota-safe pending artwork batch script.
- **Changes Made:**
  - Corrected all 10 outdated `.jpg` vehicle path expectations in `backend/tests/test_mobility_directory.py` across `test_live_rentals_provider_osm_parsing`, `test_provider_priority_hierarchy`, and `test_vehicle_artwork_category_isolation` to `.webp`.
  - Converted 20 fallback vehicle images in `frontend/public/images/vehicles/` from `.jpg` to `.webp` (preserving `.jpg`), eliminating missing physical asset 404 risks.
  - Created `scripts/generate_pending_artwork_batch.py` with strict negative prompts, dry-run mode, and quota safety halts for the 10 pending artwork entities.
- **Files Affected:** `backend/tests/test_mobility_directory.py`, `frontend/public/images/vehicles/*.webp`, `scripts/generate_pending_artwork_batch.py`.
- **Tests Executed:**
  - `pytest backend/tests/test_mobility_directory.py`: 7 passed, 0 failed (100%).
  - `pytest backend/tests/test_artwork_runtime_invariants.py`: 6 passed, 0 failed (100%).
  - Combined invariants + mobility directory: 13 passed, 0 failed (100%).
  - `pytest backend/tests/test_place_identity_engine.py backend/tests/test_arrival_im_here.py`: 21 passed, 0 failed (100%).
  - `pytest backend/tests/test_production_foundation_hardening.py`: 8 passed, 0 failed (100%).
  - `cd frontend && npm run build`: Passed with 0 errors (all 23 static routes compiled).
  - `cd mobile && npm run typecheck`: Passed with 0 errors.
  - `cd mobile && npx expo-doctor`: 18/18 checks passed.
  - `python scripts/validate_docs.py`: Passed (all context docs valid).
- **Remaining Issues:** 10 destination artwork entities await image-generation quota reset on November 13, 2026.

---

### [2026-11-09] Permanent Project Context & Session Continuity System
- **Commit:** `777246b`
- **Objective:** Establish a permanent, reliable project context system across 7 core documentation files and an automated validator so future AI sessions resume without losing architectural or domain knowledge.
- **Changes Made:** Created `PROJECT_CONTEXT.md`, `CURRENT_STATE.md`, `DEVELOPMENT_LOG.md`, `DECISIONS.md`, `NEXT_SESSION.md`, `AI_INSTRUCTIONS.md`, `NEW_CHAT_PROMPT.md`, and `scripts/validate_docs.py`.
- **Files Affected:** 8 documentation files.
- **Tests Executed:** `python scripts/validate_docs.py` (Passed 100%).
- **Remaining Issues:** 10 pending artworks for Nov 13 quota reset; `test_mobility_directory.py` test assertion update.

---

### [2026-11-09] Runtime Artwork Reconciliation & Native App Completion
- **Commit:** `1fd8f48`
- **Objective:** Fix generated artwork that exists but was suppressed at runtime, migrate 53 unreferenced vehicle/stay assets to WebP, enforce database schema alignment, build authoritative runtime artwork manifest, and complete native React Native mobile flows.
- **Changes Made:**
  - Removed 14 false-positive pending entries from `PENDING_ARTWORK_SET` in `frontend/lib/placeVisualResolver.ts` after verifying their on-disk presence, SHA256 hashes, and painterly gouache style.
  - Normalized 52 vehicle rentals and BrijRama Palace stay from `.jpg` to `.webp` across `backend/app/seed/canonical_dataset.py`, `seed_real_rentals.py`, `mobility_service.py`, `session.py`, `canonicalRegistryData.ts`, and `VehicleArtwork.tsx`.
  - Added idempotent SQLite/PostgreSQL schema migration updating legacy database rows.
  - Created `backend/app/seed/authoritative_artwork_manifest.json` and `packages/shared/src/constants/artworkManifest.ts` containing 729 validated entries and universal lookup.
  - Added native Motorcycle Expedition mode to `mobile/app/(tabs)/plan.tsx` with Gateway Hub picker (Shimla, Chandigarh, Manali), seasonal Kunzum Pass advisory, and Kaza commercial rental warning.
  - Added theme persistence (Light/Dark/Auto) and density settings to `mobile/src/context/ThemeContext.tsx` with accessible semantic tokens.
  - Added AppState background pause and `useIsFocused()` screen focus handling to `mobile/src/components/ReelsCarousel.tsx`.
- **Files Affected:** 24 files across `backend/`, `frontend/`, `mobile/`, and `packages/shared/`.
- **Tests Executed:**
  - `pytest backend/tests/test_artwork_runtime_invariants.py`: 6 passed, 0 failed.
  - `cd mobile && npm run typecheck`: 0 errors.
  - `cd mobile && npx expo-doctor`: 18/18 checks passed.
  - `cd frontend && npx tsc --noEmit`: 0 errors.
  - `cd packages/shared && npm run build`: Clean compilation.
- **Remaining Issues:** 10 place entities (5 Dharamshala, 5 Kasol) await image-generation quota reset on November 13, 2026. `test_mobility_directory.py` has 2 legacy `.jpg` assertion lines.

---

### [2026-11-09] Diagnostic Fallback State & Transparent Pending Registration
- **Commit:** `3c34fd8`
- **Objective:** Implement transparent honest fallback labels for unreplaced artwork without showing silent mismatches or broken images.
- **Changes Made:**
  - Registered unreplaced entities into `PENDING_ARTWORK_SET` within `frontend/lib/placeVisualResolver.ts`.
  - Added visual diagnostic badge indicating when an entity is awaiting high-fidelity gouache generation.
- **Files Affected:** `frontend/lib/placeVisualResolver.ts`, `frontend/components/ui/PlaceCard.tsx`.
- **Tests Executed:** Visual inspection on mobile and desktop viewports; fallback verification tests.
- **Test Outcomes:** Passed.

---

### [2026-11-09] Dharamshala Authentic Artwork Installation
- **Commit:** `5e0b801`
- **Objective:** Eliminate duplicate town landscape artwork and flat vectors for Dharamshala POIs.
- **Changes Made:**
  - Installed 8 authentic painterly gouache artworks in `frontend/public/images/places/dharamshala/`:
    - Tsuglagkhang Complex & Dalai Lama Temple
    - Bhagsu Waterfall & Shiva Café
    - Norbulingka Institute
    - Triund Alpine Ridge Trail
    - Illiterati Books & Coffee
    - St. John in the Wilderness Church
    - Tibet Kitchen McLeod Ganj
    - Dharamkot Yoga Village
    - Kangra Fort
  - Mapped canonical place IDs to bespoke WebP assets.
- **Files Affected:** `frontend/public/images/places/dharamshala/*`, `frontend/lib/placeVisualResolver.ts`.
- **Tests Executed:** Contact sheet audit and browser rendering inspection.
- **Test Outcomes:** Verified unique visual composition for all 8 entities.

---

### [2026-11-09] Carousel Layout Invariants Hardening
- **Commit:** `ee312c5`
- **Objective:** Prevent regression to two-row or grid layouts for places and discovery feeds.
- **Changes Made:**
  - Updated carousel layout invariant tests to enforce universal single-row horizontal touch carousels across mobile, tablet, and desktop viewports.
- **Files Affected:** `backend/tests/test_complete_experience_2_suite.py`.
- **Tests Executed:** `pytest backend/tests/test_complete_experience_2_suite.py`.
- **Test Outcomes:** Passed.

---

### [2026-11-09] Universal Single-Row Places Discovery & Native Swipe Restoration
- **Commit:** `a614913`
- **Objective:** Enforce single-row horizontal scroll on desktop and mobile, eliminate custom pointer conflicts with native touch scrolling, and deploy 9 new painterly assets.
- **Changes Made:**
  - Standardized all discovery rails to single-row CSS scroll snap.
  - Removed competing pointer drag handlers on mobile to restore fluid native iOS/Android flick and momentum swipe.
  - Deployed 9 high-res painterly artworks for Spiti and Himachal entities.
- **Files Affected:** `frontend/components/ui/HorizontalCarousel.tsx`, `frontend/app/explore/[slug]/page.tsx`, `frontend/lib/placeVisualResolver.ts`.
- **Tests Executed:** Mobile touch simulation and multi-viewport Playwright acceptance tests.
- **Test Outcomes:** Passed.

---

### [2026-11-08] Spiti Artwork Replacement & Mobile Carousel Swipe Fix
- **Commit:** `8993cf3`
- **Objective:** Replace flat vector artwork and duplicate mountain visuals for Spiti Valley cards; repair mobile carousel swipe index calculation.
- **Changes Made:**
  - Replaced vector assets with authentic gouache illustrations for Tashigang, Komic, Pin Valley, and Cafe Deyzor.
  - Fixed active slide counter and swipe tracking on mobile carousels.
- **Files Affected:** `frontend/public/images/places/spiti/*`, `frontend/components/ui/HorizontalCarousel.tsx`.
- **Tests Executed:** Mobile swipe gesture tests.
- **Test Outcomes:** Passed.

---

### [2026-11-08] Instant Canonical Pre-seeding & Backend Cold-Start Elimination
- **Commit:** `ee2c7d9`
- **Objective:** Eliminate "Himalayan Operating Layer Reconnecting..." cold-start screen on Render free tier wakeups.
- **Changes Made:**
  - Implemented instant client-side canonical dataset pre-seeding in `frontend/lib/canonicalRegistryData.ts`.
  - Added resilient timeout and progressive hydration: client serves instantaneous canonical destination data if backend API is cold-starting.
- **Files Affected:** `frontend/lib/api.ts`, `frontend/lib/canonicalRegistryData.ts`, `frontend/app/explore/page.tsx`.
- **Tests Executed:** Cold-start simulated timeout tests.
- **Test Outcomes:** Passed; destination pages open instantly without network blocking screens.

---

### [2026-11-06] Native React Native Mobile App & Shared Package
- **Commit:** `38b8999`
- **Objective:** Establish co-equal native mobile application under `mobile/` and monorepo shared contract package under `packages/shared/`.
- **Changes Made:**
  - Initialized Expo SDK 52 project with Expo Router 4 file-based routing.
  - Implemented core tabs (Home, Explore, Plan, Trips, Profile) and stacks (Destination, Trip, Treks, Road Trip).
  - Created `@vanvas/shared` monorepo package with design tokens and domain types.
- **Files Affected:** `mobile/**`, `packages/shared/**`, `package.json`.
- **Tests Executed:** Expo configuration and TypeScript compilation checks.
- **Test Outcomes:** Passed.

---

### [2026-11-09] Autonomous Android Native App Transformation & Play Store Readiness
- **Objective:** Complete native Android product engineering, Play Store readiness (Target SDK 35), offline SQLite ledger, Dynamic Replanner, Nearby Radar, and Group Circles while strictly freezing the web frontend.
- **Changes Made:**
  - Configured Android target SDK to 35 in `build.gradle` and bumped app version to `0.3.0` (versionCode `3`).
  - Created `mobile/app/nearby.tsx` (Nearby Mountain Radar) with foreground GPS detection, Haversine distance calculations, and offline Himalayan base fallbacks (Kaza, Manali, Dharamshala, Kasol, Leh).
  - Enhanced `mobile/app/trip/[id].tsx` with Dynamic Replanner ("Running Late", "Weather/Roadblock", "Rest Break", "Skip Stop"), Travel Ledger (offline receipt logging & split in SQLite), and Group Circle native share sheet.
  - Enhanced `mobile/src/services/db.ts` with `expenses_cache` and `offline_mutation_queue` tables and sync methods.
  - Linked Nearby Radar directly in Home header and Explore search bar.
  - Created complete Play Store release documentation suite in `mobile/docs/` (`NATIVE_APP_ARCHITECTURE.md`, `ANDROID_RELEASE_GUIDE.md`, `PLAY_STORE_RELEASE_CHECKLIST.md`, `MOBILE_QA_REPORT.md`, `MOBILE_API_CONTRACTS.md`, `MOBILE_NEXT_STEPS.md`).
  - Frontend (`frontend/`) strictly preserved and 100% untouched.
  - Zero artwork generation API calls executed (respecting quota limit).
- **Files Affected:** `mobile/app.json`, `mobile/package.json`, `mobile/app/(tabs)/index.tsx`, `mobile/app/(tabs)/explore.tsx`, `mobile/app/trip/[id].tsx`, `mobile/app/nearby.tsx`, `mobile/src/services/api.ts`, `mobile/src/services/db.ts`, `mobile/docs/*`.
- **Tests Executed:** `npm run typecheck` (0 errors), `npx expo-doctor` (18/18 passed), `python scripts/validate_docs.py` (passed).
- **Test Outcomes:** 100% Passed.

---

## November 12, 2026 — Authentic User Data, Unified Traveler Passport & Avatar Durability

- **Removed Fake/Seeded Personal & Budget Defaults:**
  - Removed `DEFAULT_EXPENSES` (₹12,000 / ₹3,500 ea), `travellersCount=4`, fake `traveller_1..4` roster, and pre-checked `DEFAULT_CHECKLIST` from `frontend/components/home/TravelDesk.tsx`. Added `version: 2` schema migration for `vanvas_local_budget_split` and `vanvas_general_checklist` preserving custom rows while stripping legacy sample rows, plus explicit `Scratch Budget` vs `Trip Budget` modes and opt-in suggested packing essentials.
  - Gated demo user seeding (`admin@vanvas.com`, `traveller@vanvas.com`) in `backend/app/seed/seed_data.py` behind non-production `SEED_DEMO_USERS=true` + `ENVIRONMENT != production`, while preserving canonical destinations, places, hotels, and rentals.
  - Removed automatic personal preference defaults and `"himalayan-explorer"` auto-preset from `User`, `UserPreference`, `UserPreferenceSchema`, `ensure_database_schema`, and added non-destructive Alembic migration `backend/alembic/versions/0004_remove_fake_personal_defaults.py`.
- **Unified Single Traveler Passport (Web & Native) & Accurate Identity Badges:**
  - Removed duplicate Profile Header Cards on `frontend/app/profile/page.tsx` and `mobile/app/(tabs)/profile.tsx` so one unified `VanvasIdentityCard` sits at the top without overlapping badges.
  - Replaced neon-green privacy pill with an accessible terracotta `role="switch"` synced to `UserPreference.allow_friend_requests_via_id` across Web, Native, and FastAPI (`UserProfileUpdateRequest` + `/preferences`), and added Regenerate ID confirmation modal.
  - Removed `VNV-VANV-ASAI`, `VNV-XXXX-XXXX`, `Himalayan Explorer`, `Mountain Explorer`, `Member since 2026`, and unconditional `Verified Traveler` claims across Web & Native.
- **Profile Photo Persistence Durability:**
  - Updated `StorageService._persist_to_database()` to raise `StorageServiceException("PROFILE_STORAGE_ERROR", ...)` on DB failure instead of swallowing exceptions, and moved old avatar cleanup in `upload_avatar()` to run only after `db.commit()` succeeds.
- **Verification:** `test_authentic_user_data_and_avatar_durability.py` (4/4), `test_profile_photo_upload.py` + `test_profile_and_settings.py` (24/24), `verify_authentic_passport_e2e.mjs` (Web/Mobile E2E), `tsc --noEmit`, `next build`, and `expo config --type public` all passed.

---

## November 12, 2026 (Follow-Up) — Account-Scoped Scratch Storage, Explicit Participants & Real Avatar Integration Verification

- **Account-Scoped Scratch Budget & Checklist (`frontend/lib/accountStorage.ts`, `TravelDesk.tsx`, `AuthContext.tsx`):**
  - Replaced global `vanvas_local_budget_split` and `vanvas_general_checklist` with account-scoped namespaces `vanvas:user:{userId}:budget:v3`, `vanvas:user:{userId}:checklist:v3`, `vanvas:guest:budget:v3`, and `vanvas:guest:checklist:v3`.
  - Legacy custom rows are isolated into `vanvas:legacy_unassigned:*:v3` with an explicit user-confirmed import banner (never auto-assigned to the next signed-in user).
  - Permanent account deletion (`deleteAccount`) purges only the deleted user's local namespaces via `purgeAccountLocalStorage(deletedUserId)` while leaving other accounts and public destination history intact.
- **Explicit Participant Count (`travellersCount: number | null`):**
  - Scratch Budget now initializes with `travellersCount: null` (`Travellers not configured`), showing `"Start Your Budget"` / `"Set Number of Travellers"` when empty and `"Set participants to calculate your share."` / `Pending` when expenses exist without configured participants.
  - Trip Budget mode fetches genuine trip members via `api.getGroupDetails(activeTrip.id)` without fabricated `traveller_1..4` placeholders or cross-mode merging.
- **Verification:** `54/54` backend tests passed (including `test_full_authenticated_session_and_avatar_recovery_integration`), `test_account_isolation_and_participants.mjs` passed, `verify_authentic_passport_e2e.mjs` passed, `next build` (0 errors), `mobile` `tsc --noEmit` & `expo config --type public` (0 errors).

---

## November 12, 2026 (Rebuild) — Crew Circles & Traveler Passport Functional Rebuild (`feat/crew-circles-passport-rebuild`)

- **Phase 1 — Traveler Passport Camera & Profile Separation (`VanvasIdentityCard.tsx`, `profile/page.tsx`):**
  - Mounted `directFileInputRef` unconditionally outside the conditional Avatar tab so the passport camera button opens the native file picker from any tab, runs format/5MB validation, opens `AvatarCropper`, uploads via `uploadAvatar`, and calls `refreshUser()` to update both passport and header navigation.
  - Removed the redundant `Profile Photo` action from the passport action bar, removed duplicate photo upload controls from Edit Profile modal (`handleSaveProfile` only updates identity fields), and fixed the concentric avatar ring (`showBorder={false}` inside single outer gold ring).
- **Phases 2, 3 & 5 — Crew Circles Workspace & Crew Chat (`frontend/app/circles/[id]/page.tsx`):**
  - Added Overview `Crew Conversation` preview card, removed duplicate `+ ` prefixes on `Plan Together` and `Propose Idea`, added empty expedition CTA, and improved mobile tab touch targets (`min-h-[40px]`).
  - Upgraded Crew Chat with chronological ordering, member avatars/timestamps, distinct system event pills (`activity_type !== "chat"`), 4.5s polling with in-flight guard & cleanup, offline/loading/empty/error states, optimistic send with rollback + `Retry`, and auto-scroll.
- **Phase 4 — Planner <-> Crew Circle Linking (`plan/page.tsx`, `backend/app/api/v1/crew_circles.py`):**
  - Circle `Plan Together` / `New Trip` links pass `circleId`, `circleName`, and `groupSize` to `/plan`, prefilling `travellersCount` and showing the crew planning banner.
  - Fixed `link_or_create_circle_trip` in FastAPI to accept JSON body `{"trip_id": ...}` via `Body(default=None)` alongside query params.
  - Added failure recovery in `/plan` so failed circle linking preserves the created trip and offers `Retry Linking to Circle` / `Open Trip Anyway` without creating duplicate trips.
- **Verification:** `60/60` backend tests passed, `tsc --noEmit` & `next build` (0 errors), `mobile` `tsc --noEmit` (0 errors), and all 3 Playwright E2E suites (`test_crew_circles_and_passport_rebuild_e2e.mjs`, `test_account_isolation_and_participants.mjs`, `verify_authentic_passport_e2e.mjs`) passed.

---

## November 12, 2026 (P0) — Full Viewport Loading Surface & Instant Session Restoration (`feat/crew-circles-passport-rebuild`)

- **Full-Viewport Opaque Loading Surface (`frontend/components/auth/ProtectedRoute.tsx`):**
  - Replaced partial `min-h-[70vh]` loader with fixed full-screen overlay: `position: fixed`, `inset: 0`, `width: 100%`, `minHeight: 100svh`, `zIndex: 10000`, solid `#FAF4E8` parchment background with zero transparency or backdrop gradients.
  - Added iOS safe-area inset padding (`env(safe-area-inset-top)` and `env(safe-area-inset-bottom)`) with understated compass spinner, editorial typography, and Hindi subtitle.
  - Obscures all root-level app shell elements (header, mobile navigation dock, footer, floating copilot) behind the opaque parchment surface, maintaining uniform parchment appearance across system light and dark modes.
- **Instant Stale-While-Revalidate Session Restoration (`frontend/context/AuthContext.tsx`):**
  - Stale-While-Revalidate (SWR) session initialization: when `vanvas_token` and a valid cached `vanvas_user_profile` are present in `localStorage`, immediately sets `user`, `token`, and unlocks UI with `setIsLoading(false)` to enable sub-50ms instant render without waiting for backend network response.
  - Asynchronously fires background revalidation against `/auth/me`; updates profile and cache upon success.
  - Preserves saved credentials and cached session on transient network timeouts, database cold-starts, or 5xx errors without forcing premature logout.
  - Explicit 401 unauthenticated / user deleted responses cleanly purge stored credentials and redirect to login.
- **Bounded Verification Latency (`frontend/lib/api.ts`):**
  - Added explicit default `timeoutMs: 7000` (7 seconds) to `api.getMe()` while allowing override via options, avoiding the 45-second default timeout during authentication handshakes.
- **No-Cache Recovery Flow (`frontend/components/auth/ProtectedRoute.tsx`):**
  - When token exists but profile cache is missing, shows full-viewport parchment loader with bounded verification; on failure, displays dedicated Connection Paused recovery screen with **Retry Connection** and **Sign Out & Return to Login** actions instead of silent redirects.
- **Verification & Automated Test Suite:**
  - Authored comprehensive Playwright test `frontend/scripts/test_instant_session_restoration.mjs` verifying 8 production scenarios: instant cached render under delayed network, seamless background update, 500 server error session preservation, explicit 401 purge, no-cache recovery + retry, and fixed `inset: 0`, `zIndex: 10000`, `#FAF4E8` geometry under dark mode on mobile iPhone viewport. **8/8 PASSED (100% green)**.
  - Ran `test_crew_circles_and_passport_rebuild_e2e.mjs` ➔ **PASSED (100% green)**.
  - Ran `test_account_isolation_and_participants.mjs` ➔ **PASSED (100% green)**.
  - Next.js production build (`npx tsc --noEmit && npm run build`) compiled 25/25 routes with zero errors.

---

## November 12, 2026 (P0 Hotfix) — Transformed Ancestor Containment Fix, Hardened Fullscreen Loader & Production Delivery (`feat/crew-circles-passport-rebuild`)

- **Root Cause Resolution (`frontend/app/template.tsx`):**
  - Confirmed root cause of partial loading screen on iPhone Safari / PWA: `<RootTemplate>` animated with `initial={{ opacity: 0, y: 6 }}` and `animate={{ opacity: 1, y: 0 }}`. Per CSS specifications, any element with a `transform` property creates a new containing block for all its descendants, including `position: fixed` elements. Consequently, `<ProtectedRoute>`'s fixed overlay was trapped inside the `<main>` container bounds below `<Header>` and above `<Footer>` / `<MobileNav>`, exposing split backgrounds and visible controls.
  - Removed Y-axis transform from `template.tsx`, transitioning solely on opacity (`initial={{ opacity: 0 }} animate={{ opacity: 1 }}`) while preserving route keys, exit behavior, and reduced-motion handling.
- **Hardened Fullscreen Loader & React Portal Escalation (`frontend/components/auth/ProtectedRoute.tsx`):**
  - Upgraded `<ProtectedRoute>` loading screen styles: `position: fixed`, `inset: 0`, `width: 100%`, `height: 100vh`, `minHeight: 100svh`, `zIndex: 2147483000`, `backgroundColor: "#FAF4E8"`, `overflow: hidden`, with `100dvh` support and iOS safe-area top/bottom padding.
  - Implemented client-side portal escalation (`createPortal(element, document.body)`) after mount. Rendering directly into `document.body` provides total immunity against any transformed or clipped parent containers anywhere in the application hierarchy.
  - Preserved SSR compatibility with zero hydration mismatch (mount check guards portal activation).
- **Automated Regression Suite (`frontend/scripts/test_fullscreen_loading_ancestor_regression.mjs`):**
  - Authored comprehensive Playwright test covering:
    - **Scenario A:** Transformed ancestor regression & stacking immunity (portaled to body, bounding box starts at 0,0, covers 390x844, z-index 2147483000, template has no transform matrix, header/nav click-through prevented).
    - **Scenario B:** Multiple mobile viewports: iPhone 12/13/14 (390x844), iPhone 14/15/16 Pro (393x852), iPhone 14/15/16 Pro Max (430x932), verifying zero horizontal overflow and solid `#FAF4E8` coverage.
    - **Scenario C:** SWR session restoration (instant render under held network, background verification update, 500 error session retention, explicit 401 purge, and no-cache Connection Paused + Retry recovery).
    - **Scenario D:** App navigation & route transitions (Header, Explore, Circles, Profile navigate smoothly with opacity-only transitions).
    - **Scenario E:** PWA manifest standalone mode and Service Worker `vanvas-v4` verification.
    - **Result:** **All 5 Scenarios PASSED (100% green)**.
- **Full-Stack Regression Verification:**
  - `test_fullscreen_loading_ancestor_regression.mjs` ➔ **PASSED (100%)**
  - `test_instant_session_restoration.mjs` ➔ **PASSED (100%)**
  - `test_crew_circles_and_passport_rebuild_e2e.mjs` ➔ **PASSED (100%)**
  - `test_account_isolation_and_participants.mjs` ➔ **PASSED (100%)**
  - `npx tsc --noEmit` & `npm run build` ➔ **PASSED (0 errors, 25/25 routes compiled cleanly)**.

---

### [2026-11-10] Final SQLite Privacy Isolation & Native Release Validation
- **Objective:** Eliminate legacy NULL user_id data leakage, enforce user-scoped trip detail caching, achieve in-memory fallback parity, establish migration fail-safe verification, add mutation deduplication guard, and execute 20/20 test cases against real production `offlineDb` methods.
- **Changes Made:**
  - **Zero NULL user_id Leakage (`mobile/src/services/db.ts`):** Mandatory `userId: string` on `cacheTripExpenses`, `getCachedTripExpenses`, `saveOfflineExpense`, `deleteOfflineExpense`, `queueOfflineMutation`, `getPendingMutations`. Removed all `OR user_id IS NULL` conditions. Private queries strictly use `WHERE user_id = ?`. Legacy unowned records remain quarantined.
  - **User-Scoped Trip Detail Caching (`mobile/src/services/db.ts`, `mobile/src/services/api.ts`):** Updated `getCachedTripDetail(userId, tripId)` to require both parameters and query `WHERE trip_id = ? AND user_id = ?`. Composite `PRIMARY KEY (trip_id, user_id)` added to `user_trips_cache` and `trip_details_cache` to prevent cross-account cache overwriting.
  - **In-Memory Fallback Parity (`mobile/src/services/db.ts`):** All private keys formatted as `trip_detail_${userId}_${tripId}`, `expenses_${userId}_${tripId}`, and `user_trips_${userId}`. Cleaned up on `clearUserSessionCache(userId)` and `purgeUserAccountData(userId)`.
  - **Additive Migration Verification & Fail-Safe Guard:** Post-migration column check verifies schema state; if migration fails, private cache queries block access with clear error. Added performance indexes: `idx_expenses_user_trip`, `idx_mutations_user_created`, `idx_trip_details_user_trip`, `idx_user_trips_user_updated`.
  - **Mutation Replay Deduplication Guard (`mobile/src/services/api.ts`):** Offline expenses embed `offline_client_id` inside `receipt_data_json`. Replay reconciles against existing server expenses before re-POSTing.
  - **Real Code Integration Test Suite (`scripts/test_offline_isolation_and_account_deletion.mjs`):** Upgraded test runner to dynamically transpile and execute actual production methods from `db.ts` and `api.ts` over a real in-memory SQLite engine, passing all 20/20 verification cases.
- **Files Affected:** `mobile/src/services/db.ts`, `mobile/src/services/api.ts`, `scripts/test_offline_isolation_and_account_deletion.mjs`, `CURRENT_STATE.md`, `PROJECT_CONTEXT.md`, `NEXT_SESSION.md`, `DEVELOPMENT_LOG.md`, `mobile/docs/*`.
- **Tests Executed:** `node scripts/test_offline_isolation_and_account_deletion.mjs` (20/20 passed), `mobile npm run typecheck` (0 errors), `backend pytest test_account_deletion_governance.py` (22/22 passed), `packages/shared npm run build` (0 errors), `git diff --name-only frontend/` (0 files).
- **Test Outcomes:** 100% Passed.

---

## November 12, 2026 — Authentic User Data, Unified Traveler Passport & Avatar Durability

- **Removed Fake/Seeded Personal & Budget Defaults:**
  - Removed `DEFAULT_EXPENSES` (₹12,000 / ₹3,500 ea), `travellersCount=4`, fake `traveller_1..4` roster, and pre-checked `DEFAULT_CHECKLIST` from `frontend/components/home/TravelDesk.tsx`. Added `version: 2` schema migration for `vanvas_local_budget_split` and `vanvas_general_checklist` preserving custom rows while stripping legacy sample rows, plus explicit `Scratch Budget` vs `Trip Budget` modes and opt-in suggested packing essentials.
  - Gated demo user seeding (`admin@vanvas.com`, `traveller@vanvas.com`) in `backend/app/seed/seed_data.py` behind non-production `SEED_DEMO_USERS=true` + `ENVIRONMENT != production`, while preserving canonical destinations, places, hotels, and rentals.
  - Removed automatic personal preference defaults and `"himalayan-explorer"` auto-preset from `User`, `UserPreference`, `UserPreferenceSchema`, `ensure_database_schema`, and added non-destructive Alembic migration `backend/alembic/versions/0004_remove_fake_personal_defaults.py`.
- **Unified Single Traveler Passport (Web & Native) & Accurate Identity Badges:**
  - Removed duplicate Profile Header Cards on `frontend/app/profile/page.tsx` and `mobile/app/(tabs)/profile.tsx` so one unified `VanvasIdentityCard` sits at the top without overlapping badges.
  - Replaced neon-green privacy pill with an accessible terracotta `role="switch"` synced to `UserPreference.allow_friend_requests_via_id` across Web, Native, and FastAPI (`UserProfileUpdateRequest` + `/preferences`), and added Regenerate ID confirmation modal.
  - Removed `VNV-VANV-ASAI`, `VNV-XXXX-XXXX`, `Himalayan Explorer`, `Mountain Explorer`, `Member since 2026`, and unconditional `Verified Traveler` claims across Web & Native.
- **Profile Photo Persistence Durability:**
  - Updated `StorageService._persist_to_database()` to raise `StorageServiceException("PROFILE_STORAGE_ERROR", ...)` on DB failure instead of swallowing exceptions, and moved old avatar cleanup in `upload_avatar()` to run only after `db.commit()` succeeds.
- **Verification:** `test_authentic_user_data_and_avatar_durability.py` (4/4), `test_profile_photo_upload.py` + `test_profile_and_settings.py` (24/24), `verify_authentic_passport_e2e.mjs` (Web/Mobile E2E), `tsc --noEmit`, `next build`, and `expo config --type public` all passed.

---

## November 12, 2026 (Follow-Up) — Account-Scoped Scratch Storage, Explicit Participants & Real Avatar Integration Verification

- **Account-Scoped Scratch Budget & Checklist (`frontend/lib/accountStorage.ts`, `TravelDesk.tsx`, `AuthContext.tsx`):**
  - Replaced global `vanvas_local_budget_split` and `vanvas_general_checklist` with account-scoped namespaces `vanvas:user:{userId}:budget:v3`, `vanvas:user:{userId}:checklist:v3`, `vanvas:guest:budget:v3`, and `vanvas:guest:checklist:v3`.
  - Legacy custom rows are isolated into `vanvas:legacy_unassigned:*:v3` with an explicit user-confirmed import banner (never auto-assigned to the next signed-in user).
  - Permanent account deletion (`deleteAccount`) purges only the deleted user's local namespaces via `purgeAccountLocalStorage(deletedUserId)` while leaving other accounts and public destination history intact.
- **Explicit Participant Count (`travellersCount: number | null`):**
  - Scratch Budget now initializes with `travellersCount: null` (`Travellers not configured`), showing `"Start Your Budget"` / `"Set Number of Travellers"` when empty and `"Set participants to calculate your share."` / `Pending` when expenses exist without configured participants.
  - Trip Budget mode fetches genuine trip members via `api.getGroupDetails(activeTrip.id)` without fabricated `traveller_1..4` placeholders or cross-mode merging.
- **Verification:** `54/54` backend tests passed (including `test_full_authenticated_session_and_avatar_recovery_integration`), `test_account_isolation_and_participants.mjs` passed, `verify_authentic_passport_e2e.mjs` passed, `next build` (0 errors), `mobile` `tsc --noEmit` & `expo config --type public` (0 errors).

---

## November 12, 2026 (Rebuild) — Crew Circles & Traveler Passport Functional Rebuild (`feat/crew-circles-passport-rebuild`)

- **Phase 1 — Traveler Passport Camera & Profile Separation (`VanvasIdentityCard.tsx`, `profile/page.tsx`):**
  - Mounted `directFileInputRef` unconditionally outside the conditional Avatar tab so the passport camera button opens the native file picker from any tab, runs format/5MB validation, opens `AvatarCropper`, uploads via `uploadAvatar`, and calls `refreshUser()` to update both passport and header navigation.
  - Removed the redundant `Profile Photo` action from the passport action bar, removed duplicate photo upload controls from Edit Profile modal (`handleSaveProfile` only updates identity fields), and fixed the concentric avatar ring (`showBorder={false}` inside single outer gold ring).
- **Phases 2, 3 & 5 — Crew Circles Workspace & Crew Chat (`frontend/app/circles/[id]/page.tsx`):**
  - Added Overview `Crew Conversation` preview card, removed duplicate `+ ` prefixes on `Plan Together` and `Propose Idea`, added empty expedition CTA, and improved mobile tab touch targets (`min-h-[40px]`).
  - Upgraded Crew Chat with chronological ordering, member avatars/timestamps, distinct system event pills (`activity_type !== "chat"`), 4.5s polling with in-flight guard & cleanup, offline/loading/empty/error states, optimistic send with rollback + `Retry`, and auto-scroll.
- **Phase 4 — Planner <-> Crew Circle Linking (`plan/page.tsx`, `backend/app/api/v1/crew_circles.py`):**
  - Circle `Plan Together` / `New Trip` links pass `circleId`, `circleName`, and `groupSize` to `/plan`, prefilling `travellersCount` and showing the crew planning banner.
  - Fixed `link_or_create_circle_trip` in FastAPI to accept JSON body `{"trip_id": ...}` via `Body(default=None)` alongside query params.
  - Added failure recovery in `/plan` so failed circle linking preserves the created trip and offers `Retry Linking to Circle` / `Open Trip Anyway` without creating duplicate trips.
- **Verification:** `60/60` backend tests passed, `tsc --noEmit` & `next build` (0 errors), `mobile` `tsc --noEmit` (0 errors), and all 3 Playwright E2E suites (`test_crew_circles_and_passport_rebuild_e2e.mjs`, `test_account_isolation_and_participants.mjs`, `verify_authentic_passport_e2e.mjs`) passed.

---

## November 12, 2026 (P0) — Full Viewport Loading Surface & Instant Session Restoration (`feat/crew-circles-passport-rebuild`)

- **Full-Viewport Opaque Loading Surface (`frontend/components/auth/ProtectedRoute.tsx`):**
  - Replaced partial `min-h-[70vh]` loader with fixed full-screen overlay: `position: fixed`, `inset: 0`, `width: 100%`, `minHeight: 100svh`, `zIndex: 10000`, solid `#FAF4E8` parchment background with zero transparency or backdrop gradients.
  - Added iOS safe-area inset padding (`env(safe-area-inset-top)` and `env(safe-area-inset-bottom)`) with understated compass spinner, editorial typography, and Hindi subtitle.
  - Obscures all root-level app shell elements (header, mobile navigation dock, footer, floating copilot) behind the opaque parchment surface, maintaining uniform parchment appearance across system light and dark modes.
- **Instant Stale-While-Revalidate Session Restoration (`frontend/context/AuthContext.tsx`):**
  - Stale-While-Revalidate (SWR) session initialization: when `vanvas_token` and a valid cached `vanvas_user_profile` are present in `localStorage`, immediately sets `user`, `token`, and unlocks UI with `setIsLoading(false)` to enable sub-50ms instant render without waiting for backend network response.
  - Asynchronously fires background revalidation against `/auth/me`; updates profile and cache upon success.
  - Preserves saved credentials and cached session on transient network timeouts, database cold-starts, or 5xx errors without forcing premature logout.
  - Explicit 401 unauthenticated / user deleted responses cleanly purge stored credentials and redirect to login.
- **Bounded Verification Latency (`frontend/lib/api.ts`):**
  - Added explicit default `timeoutMs: 7000` (7 seconds) to `api.getMe()` while allowing override via options, avoiding the 45-second default timeout during authentication handshakes.
- **No-Cache Recovery Flow (`frontend/components/auth/ProtectedRoute.tsx`):**
  - When token exists but profile cache is missing, shows full-viewport parchment loader with bounded verification; on failure, displays dedicated Connection Paused recovery screen with **Retry Connection** and **Sign Out & Return to Login** actions instead of silent redirects.
- **Verification & Automated Test Suite:**
  - Authored comprehensive Playwright test `frontend/scripts/test_instant_session_restoration.mjs` verifying 8 production scenarios: instant cached render under delayed network, seamless background update, 500 server error session preservation, explicit 401 purge, no-cache recovery + retry, and fixed `inset: 0`, `zIndex: 10000`, `#FAF4E8` geometry under dark mode on mobile iPhone viewport. **8/8 PASSED (100% green)**.
  - Ran `test_crew_circles_and_passport_rebuild_e2e.mjs` ➔ **PASSED (100% green)**.
  - Ran `test_account_isolation_and_participants.mjs` ➔ **PASSED (100% green)**.
  - Next.js production build (`npx tsc --noEmit && npm run build`) compiled 25/25 routes with zero errors.

---

## November 12, 2026 (P0 Hotfix) — Transformed Ancestor Containment Fix, Hardened Fullscreen Loader & Production Delivery (`feat/crew-circles-passport-rebuild`)

- **Root Cause Resolution (`frontend/app/template.tsx`):**
  - Confirmed root cause of partial loading screen on iPhone Safari / PWA: `<RootTemplate>` animated with `initial={{ opacity: 0, y: 6 }}` and `animate={{ opacity: 1, y: 0 }}`. Per CSS specifications, any element with a `transform` property creates a new containing block for all its descendants, including `position: fixed` elements. Consequently, `<ProtectedRoute>`'s fixed overlay was trapped inside the `<main>` container bounds below `<Header>` and above `<Footer>` / `<MobileNav>`, exposing split backgrounds and visible controls.
  - Removed Y-axis transform from `template.tsx`, transitioning solely on opacity (`initial={{ opacity: 0 }} animate={{ opacity: 1 }}`) while preserving route keys, exit behavior, and reduced-motion handling.
- **Hardened Fullscreen Loader & React Portal Escalation (`frontend/components/auth/ProtectedRoute.tsx`):**
  - Upgraded `<ProtectedRoute>` loading screen styles: `position: fixed`, `inset: 0`, `width: 100%`, `height: 100vh`, `minHeight: 100svh`, `zIndex: 2147483000`, `backgroundColor: "#FAF4E8"`, `overflow: hidden`, with `100dvh` support and iOS safe-area top/bottom padding.
  - Implemented client-side portal escalation (`createPortal(element, document.body)`) after mount. Rendering directly into `document.body` provides total immunity against any transformed or clipped parent containers anywhere in the application hierarchy.
  - Preserved SSR compatibility with zero hydration mismatch (mount check guards portal activation).
- **Automated Regression Suite (`frontend/scripts/test_fullscreen_loading_ancestor_regression.mjs`):**
  - Authored comprehensive Playwright test covering:
    - **Scenario A:** Transformed ancestor regression & stacking immunity (portaled to body, bounding box starts at 0,0, covers 390x844, z-index 2147483000, template has no transform matrix, header/nav click-through prevented).
    - **Scenario B:** Multiple mobile viewports: iPhone 12/13/14 (390x844), iPhone 14/15/16 Pro (393x852), iPhone 14/15/16 Pro Max (430x932), verifying zero horizontal overflow and solid `#FAF4E8` coverage.
    - **Scenario C:** SWR session restoration (instant render under held network, background verification update, 500 error session retention, explicit 401 purge, and no-cache Connection Paused + Retry recovery).
    - **Scenario D:** App navigation & route transitions (Header, Explore, Circles, Profile navigate smoothly with opacity-only transitions).
    - **Scenario E:** PWA manifest standalone mode and Service Worker `vanvas-v4` verification.
    - **Result:** **All 5 Scenarios PASSED (100% green)**.
- **Full-Stack Regression Verification:**
  - `test_fullscreen_loading_ancestor_regression.mjs` ➔ **PASSED (100%)**
  - `test_instant_session_restoration.mjs` ➔ **PASSED (100%)**
  - `test_crew_circles_and_passport_rebuild_e2e.mjs` ➔ **PASSED (100%)**
  - `test_account_isolation_and_participants.mjs` ➔ **PASSED (100%)**
  - `npx tsc --noEmit` & `npm run build` ➔ **PASSED (0 errors, 25/25 routes compiled cleanly)**.

---

### [2026-11-11] Existing-Install SQLite Migration & Offline Sync Integrity
- **Objective:** Complete idempotent composite-key database migration for existing installations, enforce validated user ownership across all private database methods, harden offline synchronization idempotency against duplicate expenses and unsynced deletions, and execute 31 production flow tests across real production code.
- **Changes Made:**
  - **Existing-Install SQLite Migration (`mobile/src/services/db.ts`):** Implemented `migrateTableToCompositePrimaryKey(db, tableName)` inspecting `PRAGMA table_info` for composite primary key `(trip_id, user_id)` on `user_trips_cache` and `trip_details_cache`. Automatically quarantines unowned legacy rows into `legacy_quarantine_*` tables, transfers valid rows to replacement tables with `PRIMARY KEY (trip_id, user_id)`, recreates performance indexes (`idx_user_trips_user_updated`, `idx_trip_details_user_trip`), and logs migration in `schema_migrations` table.
  - **Ownership Validation Across All Private Methods (`mobile/src/services/db.ts`):** Added `validateUserId(userId, methodName)` strictly rejecting null, undefined, empty, or whitespace-only IDs across all private cache and mutation methods.
  - **Scoped Mutation Removal & Cancellation (`mobile/src/services/db.ts`):** Scoped `removeMutation(userId, id)` to `WHERE id = ? AND user_id = ?`. Added `cancelOfflineExpenseMutation(userId, offlineId)` to cancel pending creations when an unsynced expense is deleted.
  - **Expense Synchronization Idempotency & Edge-Cases (`mobile/src/services/api.ts`):** Decoupled remote POST from local caching in `addExpense` so local cache failures do not enqueue duplicate mutations. Replay reconciliation GET failures safely preserve mutations and halt replay. Strengthened deduplication via `offline_client_id` in `receipt_data_json`. In `deleteExpense`, offline IDs trigger `cancelOfflineExpenseMutation` without queuing unnecessary server DELETE requests.
  - **Shared Account Deletion Teardown (`mobile/src/services/authTeardown.ts`):** Extracted `executeAccountDeletionTeardown` ensuring identical production teardown flow is shared between `AuthContext.tsx` and automated tests.
  - **Real Code Integration Test Suite (`scripts/test_offline_isolation_and_account_deletion.mjs`):** Expanded integration suite to 31 production scenarios covering migration, multi-account cache isolation, sync deduplication, network failures, session changes, and account purge, achieving 31/31 passed (100% success).
- **Files Affected:** `mobile/src/services/db.ts`, `mobile/src/services/api.ts`, `mobile/src/services/authTeardown.ts`, `mobile/src/context/AuthContext.tsx`, `scripts/test_offline_isolation_and_account_deletion.mjs`, `CURRENT_STATE.md`, `PROJECT_CONTEXT.md`, `NEXT_SESSION.md`, `DEVELOPMENT_LOG.md`, `mobile/docs/*`.
- **Tests Executed:** `node scripts/test_offline_isolation_and_account_deletion.mjs` (31/31 passed), `mobile npm run typecheck` (0 errors), `backend pytest test_account_deletion_governance.py` (22/22 passed), `mobile npx expo config --type public` (code 0), `packages/shared npm run build` (0 errors), `git diff --name-only frontend/` (0 files).
- **Test Outcomes:** 100% Passed.

---

## November 12, 2026 — Authentic User Data, Unified Traveler Passport & Avatar Durability

- **Removed Fake/Seeded Personal & Budget Defaults:**
  - Removed `DEFAULT_EXPENSES` (₹12,000 / ₹3,500 ea), `travellersCount=4`, fake `traveller_1..4` roster, and pre-checked `DEFAULT_CHECKLIST` from `frontend/components/home/TravelDesk.tsx`. Added `version: 2` schema migration for `vanvas_local_budget_split` and `vanvas_general_checklist` preserving custom rows while stripping legacy sample rows, plus explicit `Scratch Budget` vs `Trip Budget` modes and opt-in suggested packing essentials.
  - Gated demo user seeding (`admin@vanvas.com`, `traveller@vanvas.com`) in `backend/app/seed/seed_data.py` behind non-production `SEED_DEMO_USERS=true` + `ENVIRONMENT != production`, while preserving canonical destinations, places, hotels, and rentals.
  - Removed automatic personal preference defaults and `"himalayan-explorer"` auto-preset from `User`, `UserPreference`, `UserPreferenceSchema`, `ensure_database_schema`, and added non-destructive Alembic migration `backend/alembic/versions/0004_remove_fake_personal_defaults.py`.
- **Unified Single Traveler Passport (Web & Native) & Accurate Identity Badges:**
  - Removed duplicate Profile Header Cards on `frontend/app/profile/page.tsx` and `mobile/app/(tabs)/profile.tsx` so one unified `VanvasIdentityCard` sits at the top without overlapping badges.
  - Replaced neon-green privacy pill with an accessible terracotta `role="switch"` synced to `UserPreference.allow_friend_requests_via_id` across Web, Native, and FastAPI (`UserProfileUpdateRequest` + `/preferences`), and added Regenerate ID confirmation modal.
  - Removed `VNV-VANV-ASAI`, `VNV-XXXX-XXXX`, `Himalayan Explorer`, `Mountain Explorer`, `Member since 2026`, and unconditional `Verified Traveler` claims across Web & Native.
- **Profile Photo Persistence Durability:**
  - Updated `StorageService._persist_to_database()` to raise `StorageServiceException("PROFILE_STORAGE_ERROR", ...)` on DB failure instead of swallowing exceptions, and moved old avatar cleanup in `upload_avatar()` to run only after `db.commit()` succeeds.
- **Verification:** `test_authentic_user_data_and_avatar_durability.py` (4/4), `test_profile_photo_upload.py` + `test_profile_and_settings.py` (24/24), `verify_authentic_passport_e2e.mjs` (Web/Mobile E2E), `tsc --noEmit`, `next build`, and `expo config --type public` all passed.

---

## November 12, 2026 (Follow-Up) — Account-Scoped Scratch Storage, Explicit Participants & Real Avatar Integration Verification

- **Account-Scoped Scratch Budget & Checklist (`frontend/lib/accountStorage.ts`, `TravelDesk.tsx`, `AuthContext.tsx`):**
  - Replaced global `vanvas_local_budget_split` and `vanvas_general_checklist` with account-scoped namespaces `vanvas:user:{userId}:budget:v3`, `vanvas:user:{userId}:checklist:v3`, `vanvas:guest:budget:v3`, and `vanvas:guest:checklist:v3`.
  - Legacy custom rows are isolated into `vanvas:legacy_unassigned:*:v3` with an explicit user-confirmed import banner (never auto-assigned to the next signed-in user).
  - Permanent account deletion (`deleteAccount`) purges only the deleted user's local namespaces via `purgeAccountLocalStorage(deletedUserId)` while leaving other accounts and public destination history intact.
- **Explicit Participant Count (`travellersCount: number | null`):**
  - Scratch Budget now initializes with `travellersCount: null` (`Travellers not configured`), showing `"Start Your Budget"` / `"Set Number of Travellers"` when empty and `"Set participants to calculate your share."` / `Pending` when expenses exist without configured participants.
  - Trip Budget mode fetches genuine trip members via `api.getGroupDetails(activeTrip.id)` without fabricated `traveller_1..4` placeholders or cross-mode merging.
- **Verification:** `54/54` backend tests passed (including `test_full_authenticated_session_and_avatar_recovery_integration`), `test_account_isolation_and_participants.mjs` passed, `verify_authentic_passport_e2e.mjs` passed, `next build` (0 errors), `mobile` `tsc --noEmit` & `expo config --type public` (0 errors).

---

## November 12, 2026 (Rebuild) — Crew Circles & Traveler Passport Functional Rebuild (`feat/crew-circles-passport-rebuild`)

- **Phase 1 — Traveler Passport Camera & Profile Separation (`VanvasIdentityCard.tsx`, `profile/page.tsx`):**
  - Mounted `directFileInputRef` unconditionally outside the conditional Avatar tab so the passport camera button opens the native file picker from any tab, runs format/5MB validation, opens `AvatarCropper`, uploads via `uploadAvatar`, and calls `refreshUser()` to update both passport and header navigation.
  - Removed the redundant `Profile Photo` action from the passport action bar, removed duplicate photo upload controls from Edit Profile modal (`handleSaveProfile` only updates identity fields), and fixed the concentric avatar ring (`showBorder={false}` inside single outer gold ring).
- **Phases 2, 3 & 5 — Crew Circles Workspace & Crew Chat (`frontend/app/circles/[id]/page.tsx`):**
  - Added Overview `Crew Conversation` preview card, removed duplicate `+ ` prefixes on `Plan Together` and `Propose Idea`, added empty expedition CTA, and improved mobile tab touch targets (`min-h-[40px]`).
  - Upgraded Crew Chat with chronological ordering, member avatars/timestamps, distinct system event pills (`activity_type !== "chat"`), 4.5s polling with in-flight guard & cleanup, offline/loading/empty/error states, optimistic send with rollback + `Retry`, and auto-scroll.
- **Phase 4 — Planner <-> Crew Circle Linking (`plan/page.tsx`, `backend/app/api/v1/crew_circles.py`):**
  - Circle `Plan Together` / `New Trip` links pass `circleId`, `circleName`, and `groupSize` to `/plan`, prefilling `travellersCount` and showing the crew planning banner.
  - Fixed `link_or_create_circle_trip` in FastAPI to accept JSON body `{"trip_id": ...}` via `Body(default=None)` alongside query params.
  - Added failure recovery in `/plan` so failed circle linking preserves the created trip and offers `Retry Linking to Circle` / `Open Trip Anyway` without creating duplicate trips.
- **Verification:** `60/60` backend tests passed, `tsc --noEmit` & `next build` (0 errors), `mobile` `tsc --noEmit` (0 errors), and all 3 Playwright E2E suites (`test_crew_circles_and_passport_rebuild_e2e.mjs`, `test_account_isolation_and_participants.mjs`, `verify_authentic_passport_e2e.mjs`) passed.

---

## November 12, 2026 (P0) — Full Viewport Loading Surface & Instant Session Restoration (`feat/crew-circles-passport-rebuild`)

- **Full-Viewport Opaque Loading Surface (`frontend/components/auth/ProtectedRoute.tsx`):**
  - Replaced partial `min-h-[70vh]` loader with fixed full-screen overlay: `position: fixed`, `inset: 0`, `width: 100%`, `minHeight: 100svh`, `zIndex: 10000`, solid `#FAF4E8` parchment background with zero transparency or backdrop gradients.
  - Added iOS safe-area inset padding (`env(safe-area-inset-top)` and `env(safe-area-inset-bottom)`) with understated compass spinner, editorial typography, and Hindi subtitle.
  - Obscures all root-level app shell elements (header, mobile navigation dock, footer, floating copilot) behind the opaque parchment surface, maintaining uniform parchment appearance across system light and dark modes.
- **Instant Stale-While-Revalidate Session Restoration (`frontend/context/AuthContext.tsx`):**
  - Stale-While-Revalidate (SWR) session initialization: when `vanvas_token` and a valid cached `vanvas_user_profile` are present in `localStorage`, immediately sets `user`, `token`, and unlocks UI with `setIsLoading(false)` to enable sub-50ms instant render without waiting for backend network response.
  - Asynchronously fires background revalidation against `/auth/me`; updates profile and cache upon success.
  - Preserves saved credentials and cached session on transient network timeouts, database cold-starts, or 5xx errors without forcing premature logout.
  - Explicit 401 unauthenticated / user deleted responses cleanly purge stored credentials and redirect to login.
- **Bounded Verification Latency (`frontend/lib/api.ts`):**
  - Added explicit default `timeoutMs: 7000` (7 seconds) to `api.getMe()` while allowing override via options, avoiding the 45-second default timeout during authentication handshakes.
- **No-Cache Recovery Flow (`frontend/components/auth/ProtectedRoute.tsx`):**
  - When token exists but profile cache is missing, shows full-viewport parchment loader with bounded verification; on failure, displays dedicated Connection Paused recovery screen with **Retry Connection** and **Sign Out & Return to Login** actions instead of silent redirects.
- **Verification & Automated Test Suite:**
  - Authored comprehensive Playwright test `frontend/scripts/test_instant_session_restoration.mjs` verifying 8 production scenarios: instant cached render under delayed network, seamless background update, 500 server error session preservation, explicit 401 purge, no-cache recovery + retry, and fixed `inset: 0`, `zIndex: 10000`, `#FAF4E8` geometry under dark mode on mobile iPhone viewport. **8/8 PASSED (100% green)**.
  - Ran `test_crew_circles_and_passport_rebuild_e2e.mjs` ➔ **PASSED (100% green)**.
  - Ran `test_account_isolation_and_participants.mjs` ➔ **PASSED (100% green)**.
  - Next.js production build (`npx tsc --noEmit && npm run build`) compiled 25/25 routes with zero errors.

---

## November 12, 2026 (P0 Hotfix) — Transformed Ancestor Containment Fix, Hardened Fullscreen Loader & Production Delivery (`feat/crew-circles-passport-rebuild`)

- **Root Cause Resolution (`frontend/app/template.tsx`):**
  - Confirmed root cause of partial loading screen on iPhone Safari / PWA: `<RootTemplate>` animated with `initial={{ opacity: 0, y: 6 }}` and `animate={{ opacity: 1, y: 0 }}`. Per CSS specifications, any element with a `transform` property creates a new containing block for all its descendants, including `position: fixed` elements. Consequently, `<ProtectedRoute>`'s fixed overlay was trapped inside the `<main>` container bounds below `<Header>` and above `<Footer>` / `<MobileNav>`, exposing split backgrounds and visible controls.
  - Removed Y-axis transform from `template.tsx`, transitioning solely on opacity (`initial={{ opacity: 0 }} animate={{ opacity: 1 }}`) while preserving route keys, exit behavior, and reduced-motion handling.
- **Hardened Fullscreen Loader & React Portal Escalation (`frontend/components/auth/ProtectedRoute.tsx`):**
  - Upgraded `<ProtectedRoute>` loading screen styles: `position: fixed`, `inset: 0`, `width: 100%`, `height: 100vh`, `minHeight: 100svh`, `zIndex: 2147483000`, `backgroundColor: "#FAF4E8"`, `overflow: hidden`, with `100dvh` support and iOS safe-area top/bottom padding.
  - Implemented client-side portal escalation (`createPortal(element, document.body)`) after mount. Rendering directly into `document.body` provides total immunity against any transformed or clipped parent containers anywhere in the application hierarchy.
  - Preserved SSR compatibility with zero hydration mismatch (mount check guards portal activation).
- **Automated Regression Suite (`frontend/scripts/test_fullscreen_loading_ancestor_regression.mjs`):**
  - Authored comprehensive Playwright test covering:
    - **Scenario A:** Transformed ancestor regression & stacking immunity (portaled to body, bounding box starts at 0,0, covers 390x844, z-index 2147483000, template has no transform matrix, header/nav click-through prevented).
    - **Scenario B:** Multiple mobile viewports: iPhone 12/13/14 (390x844), iPhone 14/15/16 Pro (393x852), iPhone 14/15/16 Pro Max (430x932), verifying zero horizontal overflow and solid `#FAF4E8` coverage.
    - **Scenario C:** SWR session restoration (instant render under held network, background verification update, 500 error session retention, explicit 401 purge, and no-cache Connection Paused + Retry recovery).
    - **Scenario D:** App navigation & route transitions (Header, Explore, Circles, Profile navigate smoothly with opacity-only transitions).
    - **Scenario E:** PWA manifest standalone mode and Service Worker `vanvas-v4` verification.
    - **Result:** **All 5 Scenarios PASSED (100% green)**.
- **Full-Stack Regression Verification:**
  - `test_fullscreen_loading_ancestor_regression.mjs` ➔ **PASSED (100%)**
  - `test_instant_session_restoration.mjs` ➔ **PASSED (100%)**
  - `test_crew_circles_and_passport_rebuild_e2e.mjs` ➔ **PASSED (100%)**
  - `test_account_isolation_and_participants.mjs` ➔ **PASSED (100%)**
  - `npx tsc --noEmit` & `npm run build` ➔ **PASSED (0 errors, 25/25 routes compiled cleanly)**.


---

## Session: Dharamshala & Kasol Master Visual Rebuild, Service Worker v5 Upgrade & Integration Fixes
**Timestamp:** 2026-11-14T20:55:00+05:30  
**Branch:** `main`  
**Goal:** Diagnose and resolve root causes preventing newly generated Dharamshala illustrations and Kasol editorial artworks from rendering in production, eliminate flat vector placeholders, remove white border framing, and differentiate rental fleet.

### 1. Root Cause Diagnosis & Architectural Solutions
1. **Service Worker Cache-First Lockout (`frontend/public/sw.js`):**
   - Previous Service Worker `vanvas-v4` served images using a rigid Cache-First strategy without background network revalidation. Once flat vectors or category fallbacks were cached on a user's browser, fresh server deployments were never fetched.
   - **Fix:** Bumped cache version to `vanvas-v5` (`SCRIPT_VERSION: vanvas-pwa-v5.0.0`). Converted `/images/`, `/artworks/`, and `/avatars/` to Stale-While-Revalidate with automatic cache eviction on activate.
2. **Explore Page Backend API Overwrite (`frontend/app/explore/[slug]/page.tsx`):**
   - When the backend returned destinations, generic category images (e.g., `/images/places/kasol/categories/stay.webp`) were overriding curated frontend canonical entities.
   - **Fix:** Merged API response with `canonPkg.hotels` and `canonPkg.places`, preserving property-specific `/stays/` artwork paths and preventing fallback overwrites.
3. **Destination Slug Lookup Mismatch (`frontend/lib/placeVisualResolver.ts`):**
   - Registry keys are mapped with canonical slugs (`"kasol:..."`, `"dharamshala:..."`). Queries passing formatted display names like `"Kasol (Parvati Valley)"` resulted in keys like `"kasol-parvati-valley:..."`, causing lookups to fail and fall back to category images.
   - **Fix:** Implemented `normalizeCanonicalDestinationSlug` to map display names to canonical slugs across all 26 destinations. Added hotel aliases and destination-scoped fuzzy matching.

### 2. Asset Refinements & Editorial Alignments
1. **Kasol Border Removal:**
   - Identified cream/white border margins on `chojh-bridge`, `moon-dance-cafe`, and `evergreen-cafe`.
   - Autocropped borders cleanly and re-encoded to 1376x768 (`quality=90`) in WebP and JPEG format.
2. **Kasol Flat Vector Replacement:**
   - Replaced flat vector placeholders for `pulga-fairy-forest`, `tulga-hamlet`, `rasol-trail`, `jim-morrison-cafe`, and `waichin-valley` with high-resolution gouache illustrations.
   - Cleared `PENDING_ARTWORK_SET` in `placeVisualResolver.ts`.
3. **Vehicle Fleet Differentiation:**
   - Updated `kasol_parvati_bullet.webp` / `.jpg` with a distinct Royal Enfield Classic 350 motorcycle in deep pine forest, creating 60.3 visual variance from the scooter.

### 3. Build & Diagnostics Verification
- `cd frontend && npx tsc --noEmit`: 0 errors.
- `cd frontend && npm run build`: 25/25 routes compiled cleanly.
- `python scripts/validate_docs.py`: PASSED (0 errors).


---

## Session: Kasol Complete Visual Rebuild, Hotel Image Uniqueness, Runtime Deduplication & Production Fix
**Timestamp:** 2026-11-14T22:15:00+05:30  
**Branch:** `main`  
**Goal:** Deliver 100% authentic, bespoke editorial travel illustrations for all 4 Kasol hotels and 16 canonical places, eliminate duplicate entries and phantom stays, add destination diagnostic reporter, and protect Dharamshala baseline.

### 1. Root Cause Analysis of Live Production State
- **Duplicate Entities in Database:** The Render PostgreSQL DB returned 19 places (including duplicate Chalal, duplicate Manikaran, duplicate Kheerganga), 5 hotels (including phantom `Parvati Woods Bohemian Alpine Lodge`), and 3 rentals (with duplicate Classic 350).
- **Hotel Image Uniformity:** The 4 Kasol hotels previously had generic mountain valley paintings on disk that shared similar color palettes and compositions rather than property-specific architecture.
- **Rogue Alias Collision:** `HOTEL_ALIAS_MAP` mapped `parvati-woods` to `parvati-kuteer`, causing Parvati Kuteer to be rendered twice in the stays row.

### 2. Solutions & Deliveries
1. **Four Unique Hotel Artworks (P0 Requirement):**
   - Generated, optimized, and deployed 4 bespoke 1376x768 full-bleed gouache illustrations with sidecar `.generated.json` metadata:
     - `the-himalayan-village.webp`: Traditional Kathkuni stone-and-timber chalets with carved balconies and slate roofs.
     - `parvati-kuteer-riverside-wood-cottages.webp`: A-frame log cottages on the Parvati riverbank with lawn, hammocks, and boulders.
     - `kasol-heights-resort.webp`: High-altitude modern resort on Suma Ropa ridge with panoramic sundeck.
     - `the-hosteller-kasol-riverside.webp`: Backpacker hostel with fairy-lit wooden riverside cafe deck and twilight mountain atmosphere.
   - Pairwise visual variance between stays: **66.3 to 80.3**.
2. **16 Canonical Places Verification:**
   - Generated bespoke illustrations for `pulga-fairy-forest`, `tulga-hamlet`, `rasol-trail`, `jim-morrison-cafe`, and `waichin-valley`.
   - Verified all 16 places with unique SHA-256 hashes and minimum pairwise variance of 50.7.
3. **Runtime Deduplication & API Protection (`frontend/app/explore/[slug]/page.tsx`):**
   - Used `canonPkg.places` and `canonPkg.hotels` as the authoritative baseline, merging live metadata while eliminating duplicate entries.
   - Filtered out `Parvati Woods Bohemian Alpine Lodge` and removed its alias in `placeVisualResolver.ts`.
   - Deduplicated Valley Mobility fleet to 2 distinct vehicles.
4. **Runtime Diagnostics:**
   - Implemented `generateDestinationVisualAuditReport` in `frontend/lib/placeVisualResolver.ts`.
5. **Dharamshala Baseline:**
   - Zero modifications to Dharamshala assets or mappings; 100% green regression test pass.
