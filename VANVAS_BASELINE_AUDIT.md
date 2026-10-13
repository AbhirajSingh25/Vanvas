# VANVAS BASELINE AUDIT & TRUTH REPORT
**Date:** 2026-10-10  
**Repository:** https://github.com/AbhirajSingh25/Vanvas.git  
**Target Branch:** `feat/app-shell-mobile-refactor`  
**Production Deployment:** https://vanvasai.vercel.app  
**Backend API (Render):** https://vanvas-api.onrender.com  

---

## 1. Git & Deployment Commit Baseline
- **Production Git Revision (deployed on Vercel & Render):**  
  `1379d69c47d3c107cf211a39f2019235d2449497` (HEAD of `main`)  
  *Verified via live `/api/v1/health` response.*
- **Feature Branch (`feat/app-shell-mobile-refactor`):**  
  `2d7e6f449b86124e65758364e01783dbd6d7949b`  
  *5 commits ahead of `main`.*
- **Working Tree State:**  
  Clean, no uncommitted user changes.

---

## 2. API Routing & Environment Configuration
1. **Defect in `frontend/next.config.ts`:**
   - Next.js rewrite fallback: `const rawApi = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";`
   - In any Vercel production or preview build where `NEXT_PUBLIC_API_URL` is omitted, requests to `/api/v1/:path*` are rewritten to `http://127.0.0.1:8000/api/v1/:path*` (Vercel serverless container localhost), causing 500/502/connection failure.
   - **Fix:** In production/Vercel (`process.env.VERCEL || process.env.NODE_ENV === "production"`), the safe documented fallback must be `https://vanvas-api.onrender.com/api/v1`.
2. **Defect in `frontend/lib/api.ts`:**
   - In production browser, if `NEXT_PUBLIC_API_URL` is absent, it returns relative `"/api/v1"`.
   - Vercel's proxy rewrite has a 10-15s execution timeout. When Render spins up from cold sleep (18-35s), Vercel proxies return 504 Gateway Timeout.
   - **Fix:** Normalize API base URL consistently with safe production fallback to `https://vanvas-api.onrender.com/api/v1`. Render already has CORS enabled for `https://vanvasai.vercel.app` and `https://vanvas*.vercel.app`.

---

## 3. Authentication & Session Persistence Root Cause
1. **Accidental Token Wiping on Network/Cold Start:**
   - In `frontend/context/AuthContext.tsx` (`refreshUser` / initial mount):
     When `api.getMe()` encounters a cold start or network timeout, `err.message` is `"Request timed out while connecting to VANVAS servers..."`.
     The error handler check:
     `const isNetworkError = ... || err?.message?.includes("Failed to fetch") || err?.message?.includes("Unable to connect");`
     evaluates to `false`!
     As a result, `storageAdapter.removeItem("vanvas_token")` and `setUser(null)` execute, **wiping the user's valid session**!
   - **Fix:** Strictly distinguish true 401 Unauthorized / Token Expired from timeouts, cold starts, and 5xx errors. Only clear credentials on verified 401 auth rejection.

---

## 4. Ask VANVAS (Copilot) Failure Root Cause
1. **401 Unauthorized Disguised as System Failure:**
   - The FastAPI `/api/v1/copilot/chat` endpoint requires authentication in production (`current_user: User = Depends(get_current_user)`).
   - When an unauthenticated visitor asks a question, Render responds with `401 {"detail":"Authentication required"}`.
   - `AskVanvasContext.tsx` catches the error and silently sets:
     `"Live place discovery is temporarily unavailable. You can still view your saved trip information."`
     The user is never told they need to sign in!
   - **Fix:**
     - Recognize 401 / unauthenticated state and present a clear, frictionless "Sign In to Ask VANVAS" action card with direct route to `/login`.
     - When authenticated, pass the bearer token cleanly.
     - Add iOS safe-area insets, dynamic viewport heights (`dvh`), and prevent duplicate query dispatching.

---

## 5. iPhone Installed PWA & Standalone Shell
1. **Installed PWA Presents Full Website:**
   - In standalone mode on iOS, the full website footer (`Footer.tsx`) with 100+ lines of marketing links is rendered.
   - The home page is a 640-line landing page with multi-section marketing scrolls rather than an app command center.
2. **Navigation & Safe Areas:**
   - Input fields in bottom sheets lack iOS safe-area bottom padding (`env(safe-area-inset-bottom)`), causing them to collide with the home bar or be hidden behind the iOS virtual keyboard.
3. **Service Worker:**
   - `sw.js` is at `vanvas-v1`. Does not perform proactive update notification or version refresh when new builds are published.
