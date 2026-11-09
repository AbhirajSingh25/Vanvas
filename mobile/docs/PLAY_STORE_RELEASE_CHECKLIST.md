# Google Play Store Release & Compliance Checklist

**Application Name:** VANVAS  
**Application ID:** `ai.vanvas.app`  
**Current Version:** `0.3.0` (versionCode `3`)  
**Target API Level:** `35` (Android 15+) — Fully Compliant with Google Play 2026 Mandates  
**Content Rating:** Everyone (PEGI 3 / USK 0)  

---

## 1. Google Play Console Compliance Matrix

| Item | Requirement | VANVAS Implementation Status | Verification Method |
|------|-------------|------------------------------|---------------------|
| **Target API** | Android API 34+ (Targeting API 35) | **PASSED** (Configured to 35 in `build.gradle` and `app.json`) | Inspected `mobile/android/build.gradle` |
| **64-bit Architecture Support** | `arm64-v8a`, `x86_64` included | **PASSED** (`reactNativeArchitectures` in `gradle.properties`) | Config check & APK Analyzer |
| **New Architecture (TurboModules/Fabric)** | Supported & Tested | **PASSED** (`newArchEnabled=true`) | `app.json` & `gradle.properties` |
| **Data Safety: Location** | Justify and declare location usage | **PASSED** (Used strictly in foreground for "I'M HERE" and Nearby Radar) | Declared below & in App Manifest |
| **Data Safety: Photos/Media** | Restricted permission compliance | **PASSED** (Modern Android Photo Picker used; broad storage permissions removed) | Manifest audit |
| **Account Deletion Path** | In-app deletion + Web URL | **PASSED** (Profile screen account deletion + Web URL support) | Link check: `https://vanvasai.vercel.app/account/delete` |
| **Privacy Policy** | Publicly accessible policy URL | **PASSED** (`https://vanvasai.vercel.app/privacy`) | Verified live web route |
| **App Bundle Size** | < 150MB initial download | **PASSED** (~45MB AAB with Hermes JS engine) | Hermes bytecode enabled |

---

## 2. Play Store Data Safety Questionnaire Declarations

### A. Location Data
- **Types Collected:** Approximate Location (`ACCESS_COARSE_LOCATION`), Precise Location (`ACCESS_FINE_LOCATION`).
- **Purpose:** App Functionality (Calculating proximity to mountain POIs in Nearby Radar, triggering "I'M HERE" arrival context).
- **Ephemeral:** Yes, coordinates are computed in-memory to resolve nearby waypoints and are never logged or stored permanently on external advertising networks.
- **Shared with Third Parties:** No.
- **User Opt-out:** Yes. If permission is denied, the user can manually choose their mountain base (Kaza, Manali, Dharamshala, Leh, Kasol).

### B. Photos & Videos
- **Types Collected:** User-selected photo for profile avatar.
- **Purpose:** Account customization / User Profile.
- **Permission:** Managed via modern Android photo picker (`expo-image-picker`), avoiding legacy broad filesystem access permissions.

### C. Personal Information
- **Types Collected:** Name, Email address.
- **Purpose:** Account management, authentication, and expedition persistence.
- **Security:** Encrypted in transit (HTTPS/TLS) and secured on-device via Android KeyStore (`expo-secure-store`).

---

## 3. Store Listing Assets Specification

1. **App Icon:**
   - Size: 512 x 512 px, 32-bit PNG with alpha.
   - Design: Himalayan pine forest badge with brass insignia (`mobile/assets/icon.png`).
2. **Feature Graphic:**
   - Size: 1024 x 500 px, JPG or 24-bit PNG (no alpha).
   - Theme: Spiti Valley & Rohtang Pass painterly landscape.
3. **Screenshots Required:**
   - Phone: Minimum 4 screenshots (1080 x 1920 or 1080 x 2400):
     1. *Home:* Active expedition card, Himalayan travel modes, curated sanctuaries.
     2. *Explore & Reels:* Mountain field reels and destination filters.
     3. *Spiti Motorcycle Expedition Wizard:* Royal Enfield rates, gateway selector, fuel buffers.
     4. *Itinerary & Travel Ledger:* Day schedule, Dynamic Replanner, offline receipt logger.
     5. *Nearby Mountain Radar:* Real-time proximity scanner and fuel waypoints.
   - 7-inch Tablet & 10-inch Tablet screenshots (supportsTablet: true in `app.json`).

---

## 4. Release Checklist Prior to Promoting to Production

- [x] Version incremented: `versionCode 3`, `versionName "0.3.0"`.
- [x] Target SDK set to 35.
- [x] TypeScript validation clean (`0 errors`).
- [x] Expo Doctor validation clean (`18/18 passed`).
- [x] Dual-platform integrity verified (`frontend/` completely untouched).
- [x] Zero artwork generation calls made (respecting quota window).
- [ ] Sign release AAB with organization production upload keystore.
- [ ] Submit to Closed Testing track for 14-day 20-tester requirement (for new developer accounts).
- [ ] Fill Data Safety section using the exact declarations in Section 2.
- [ ] Publish to Google Play Production.
