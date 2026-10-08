# VANVAS — Store-Ready Technical Metadata

This file contains verified store listing and technical metadata for Google Play Console & Apple App Store readiness.

---

## 1. Technical Application Metadata

- **Application Title:** VANVAS — Himalayan Expeditions & Mountain Travel Copilot
- **Short Name:** VANVAS
- **Package ID (Android):** `ai.vanvas.app`
- **Bundle ID (iOS / PWA scope):** `ai.vanvas.app`
- **Initial Store Version:** `0.1.0`
- **Version Code:** `1`
- **Primary Category:** Travel & Local (`TRAVEL_AND_LOCAL`)
- **Secondary Category:** Navigation / Outdoor Adventure
- **Content Rating Target:** Everyone / 3+ (No mature content, no user-generated open forums)

---

## 2. Production URL Architecture

- **Production Web & PWA Host:** `https://vanvasai.vercel.app`
- **Production API Gateway:** `https://vanvas-api.onrender.com`
- **Privacy Policy URL:** `https://vanvasai.vercel.app/privacy`
- **Terms of Service URL:** `https://vanvasai.vercel.app/terms`
- **Support & Diagnostics URL:** `https://vanvasai.vercel.app/support`
- **Android App Links Asset Verification:** `https://vanvasai.vercel.app/.well-known/assetlinks.json`

---

## 3. Verified Android App Links Configuration

The domain `vanvasai.vercel.app` publishes the standard Digital Asset Links file with SHA-256 certificate fingerprints matching the application's signature:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "ai.vanvas.app",
      "sha256_cert_fingerprints": [
        "BF:51:58:0F:F1:5A:37:22:BE:9E:50:A3:BC:FC:90:7D:BF:E9:05:B1:AC:4F:5C:BF:8F:5D:CC:5A:A4:51:B4:A5"
      ]
    }
  }
]
```

### Deep Link Test Vectors
- `https://vanvasai.vercel.app/trips/mock-trip-1` -> Opens exact trip detail view
- `https://vanvasai.vercel.app/explore/spiti-valley` -> Opens specific destination showcase
- `https://vanvasai.vercel.app/join/expedition-402` -> Opens group invite modal

---

## 4. Brand & Asset Verification

- **Emblem / App Icon:** Approved Explorer's Desk seal (`frontend/public/icon.png`, `frontend/public/icons/icon-512x512.png`, Android mipmap resources)
- **Splash Screen:** Approved Himalayan parchment & pine dawn branding (`@capacitor/splash-screen`)
- **Visual Identity:** Explorer's Desk warm parchment (`#FAF4E8`, `#173B32`, `#B49252`, `#B65E3C`)
