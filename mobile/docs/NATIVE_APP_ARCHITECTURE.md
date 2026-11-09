# VANVAS Native Android App Architecture

**Version:** 0.3.0 (`versionCode 3`)  
**Package Name:** `ai.vanvas.app`  
**Platform Framework:** React Native 0.76.9 + Expo SDK 52 + Expo Router 4.0.17 (New Architecture enabled)

---

## 1. Architectural Philosophy

VANVAS Mobile is a **100% native Android and iOS mobile application**, engineered from the ground up using React Native, Expo Router, and native device primitives. It is **not** a website wrapped in a WebView.

### Dual-Platform Separation & Parity
- **Web Application (`frontend/`):** Next.js 14 responsive web platform hosted at `https://vanvasai.vercel.app`.
- **Native Mobile Application (`mobile/`):** React Native Expo application built for Google Play Store and physical device installation.
- **Shared Contracts (`packages/shared/`):** Shared domain models, TypeScript interfaces, and design tokens (Himalayan color palette, typography).
- **Backend (`vanvas-api.onrender.com`):** Unified FastAPI backend providing authentication, itineraries, destinations, copilot, and travel ledgers.

---

## 2. Navigation & Routing Architecture

Navigation is governed by **Expo Router 4** using file-based routing with native transitions:

```
mobile/app/
├── _layout.tsx                     # Root Stack layout, ThemeProvider, ConnectionBanner, Session Guard
├── (tabs)/
│   ├── _layout.tsx                 # Native bottom tab bar (Forest Dark / Parchment)
│   ├── index.tsx                   # Home: Active expedition card, quick modes, curated sanctuaries
│   ├── explore.tsx                 # Explore: Search bar, region filters, reels carousel, destination cards
│   ├── plan.tsx                    # 10-step Expedition Wizard (Spiti Motorcycle mode, gateways, rates)
│   ├── trips.tsx                   # Trips: User expedition dossiers with offline fallback
│   └── profile.tsx                 # Profile: Avatar picker, Dark/Light/Auto theme, Layout density
├── destination/
│   └── [slug].tsx                  # Destination detail: Places, Stays, Fleet single-row carousels
├── trip/
│   ├── [id].tsx                    # Itinerary timeline, Travel Ledger, Dynamic Replan, Group Circle
│   └── [id]/im-here.tsx            # I'M HERE arrival mode: real-time location, check-in, next stops
├── nearby.tsx                      # Nearby Radar: GPS proximity, mountain waypoints, fuel pumps
├── ask-vanvas.tsx                  # Ask VANVAS AI Copilot: Contextual Himalayan assistant
├── road-trip/
│   └── index.tsx                   # Scenic driving corridors
├── treks/
│   └── index.tsx                   # Himalayan trailhead guides, altitudes & difficulty
└── auth/
    ├── login.tsx                   # Native auth login
    ├── register.tsx                # Account creation
    └── verify-email.tsx            # Verification loop
```

---

## 3. State Management & Storage Strategy

### Persistent Secure Authentication
- **Engine:** `expo-secure-store`
- **Stored Data:** JWT access tokens, refresh tokens, user identity snapshot.
- **Hardware Encryption:** KeyStore on Android, Keychain on iOS.

### Local SQLite Database (`vanvas_offline.db`)
- **Engine:** `expo-sqlite` (WAL journal mode)
- **Tables:**
  - `destinations_cache`: Full destination catalog snapshot for zero-connectivity discovery.
  - `destination_details_cache`: Places, stays, and rental fleets cached per slug.
  - `user_trips_cache`: Trip summaries for instant home & trips rendering.
  - `trip_details_cache`: Deep itinerary days, schedule items, and waypoint notes.
  - `expenses_cache`: Travel ledger receipts, amounts, categories, and sync flags.
  - `offline_mutation_queue`: FIFO queue of offline operations (e.g. expenses logged during mountain passes) synced when connection is restored.

---

## 4. Visual Identity & Brand Execution

- **Palette:**
  - Forest Dark: `#17352C`
  - Pine Green: `#2D5A4C`
  - Terracotta: `#C45C3B`
  - Brass / Ochre: `#C5A059`
  - Mountain Mist: `#9BB0A6`
  - Parchment: `#FAF6F0`
- **Image Resolution:** 
  - Verified painterly gouache travel-journal artwork.
  - Bundled local assets with fallback to production CDN.
  - Edge-to-edge layout with Android translucent status bar and immersive navigation.

