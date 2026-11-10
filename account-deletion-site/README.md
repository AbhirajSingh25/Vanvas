# VANVAS — Standalone Account Deletion Request Portal

> **Purpose:** Dedicated, accessible, external account and data deletion portal compliant with Google Play Store User Data and Account Deletion policy requirements.  
> **Backend Integration:** `https://vanvas-api.onrender.com/api/v1/auth/login` and `DELETE /api/v1/auth/account`.  
> **Deployment Architecture:** Independent static web application, completely separated from `frontend/` (which remains 100% frozen).

---

## 1. Compliance Architecture

- **Google Play Requirement:** Apps that allow account creation must provide an easily discoverable in-app path and an external web resource for users to request deletion of their account and associated personal data.
- **Data Erasure Scope:**
  - Authentication credentials, emails, and active sessions.
  - Custom trips, day schedules, and travel journals.
  - Dynamic Replanner records, road trip waypoints, and arrival statuses.
  - Travel Ledger entries, offline receipt records, split ledgers, and settlement payments.
  - Uploaded profile photos and avatar images (purged from database blobs / storage services).
  - Saved bookmarks, ratings, and travel circles.
- **Privacy & Security Standards:**
  - Zero storage in `localStorage`, `sessionStorage`, or cookies. Tokens exist strictly in-memory during active execution and are destroyed immediately upon completion or cancellation.
  - Password verification required to prevent unauthorized deletion.
  - Zero analytics, trackers, or third-party advertising scripts.
  - Secure HTTPS transport.

---

## 2. Standalone Deployment Instructions

### Vercel CLI (Recommended)
```bash
cd account-deletion-site
npx vercel --prod
```

### Static Hosting (Netlify, Cloudflare Pages, GitHub Pages)
This portal is a zero-dependency, self-contained single-page application (`index.html`). It can be dropped into any static hosting provider.
