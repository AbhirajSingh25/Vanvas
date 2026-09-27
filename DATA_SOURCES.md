# VANVAS Data Sources & Provenance Model

## Overview
VANVAS maintains a strict provenance hierarchy to ensure all travel intelligence, points of interest, accommodations, and mobility providers represent verified real-world infrastructure without hallucinated or placeholder data.

---

## 1. Provenance Hierarchy

```
1. Official Tourism & Regional Authorities (UTDB, HPTDC, Goa Tourism, RTDC, KTDC)
   ↓
2. Verified Ground Partner Integrations & Open Data Sources (OpenStreetMap, Open-Meteo)
   ↓
3. VANVAS Curated & Editorial Ground Dossiers (High-resolution regional coordinates & terrain profiles)
   ↓
4. Live Research Pipeline (Dynamic geocoding & normalized factual aggregation)
   ↓
5. AI Synthesis (Summarization & multi-style ranking ONLY — NEVER business data invention)
```

---

## 2. Prohibited Content & Validation Invariants

- ❌ Fake Phone Numbers: Any number not verified from official or public operator directories must be omitted; UI displays "Rate upon inquiry" or "Contact Property".
- ❌ Placeholder Domains: `booking.vanvas.com`, `example.com`, `localhost` URLs are forbidden.
- ❌ Fabricated Reviews & Ratings: Only verified ratings or neutral indicators are permitted.
