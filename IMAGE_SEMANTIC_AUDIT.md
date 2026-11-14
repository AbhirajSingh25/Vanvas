# VANVAS — Image Semantic Integrity & Provenance Audit

## 1. Executive Summary

A core standard of the VANVAS design philosophy is **visual truth and honest provenance**. Travellers must never be misled by stock imagery masquerading as a specific Himalayan monastery, nor should a photograph from one city silently appear as another.

This audit details the systematic verification of all visual assets across the 420 seeded places and 26 canonical destinations, the elimination of cross-destination alias contamination, the dual-platform asset resolution mechanism, and the cloud storage persistence pipeline.

---

## 2. Visual Entity Registry & Asset Distribution

| Asset Classification Tier | Definition | Total Count in Registry | Provenance Badge Rendered |
| :--- | :--- | :---: | :--- |
| **Tier 1: Exact Place Real Photo** | Verified high-resolution photograph of the specific physical landmark | **342** | `Verified Photo` (Emerald Badge) |
| **Tier 2: Live Verified POI Photo** | Photo sourced dynamically via live Google Places / OSM provider | Dynamic | `Live Photo` (Teal Badge) |
| **Tier 3: Editorial Artwork** | Hand-crafted or AI-synthesized gouache/editorial travel illustration | **78** | `Editorial Illustration` (Antique Brass Badge) |
| **Tier 4: Destination Category Art** | Regionally and biome-specific illustration for generic dining/sight | Fallback | `Editorial Art` (Warm Ochre Badge) |
| **Tier 5: Universal Fallback** | Guaranteed safety asset adhering to `VANVAS_ART_BIBLE.md` palette | Safety | `Editorial Art` |

---

## 3. Cross-Destination Alias Contamination & Repairs

Prior to this audit, a script-based sync had inadvertently introduced cross-destination alias pollution:
- **City Palace Collision:** The entity "City Palace" (Udaipur) was mapped to a generic key that caused non-Udaipur searches or palace queries in other districts to inherit Lake Pichola imagery.
  - *Repair:* Synchronized `frontend/lib/placeVisualResolver.ts` and `backend/app/providers/artwork_provider.py` with destination-scoped keys. Verified 0 cross-destination alias contaminations via `find_cross_aliases.py`.
- **Himalayan Cafe & Common Names:** Generic names like "The Himalayan Cafe" or "German Bakery" existed in both Kasol, Old Manali, and McLeod Ganj.
  - *Repair:* Scoped each cafe and bakery to its respective destination folder (e.g., `/images/places/kasol/the-himalayan-village.webp` vs `/images/places/manali/cafe-1947.webp`).
- **Remote Monastery Distinction:** Key Monastery, Dhankar Monastery, Tabo Monastery, and Komic were assigned distinct verified WebP photographs reflecting their unique geological formations (Tabo's 996 CE mud architecture vs Key's tiered conical fortress).

---

## 4. Dual-Platform Asset Resolution Architecture

### The Problem
Next.js on Vercel serves static assets directly from `frontend/public/images/`. FastAPI on Render does not duplicate these static files. When the native mobile React Native app received relative image URLs like `/images/places/spiti-valley/key-monastery.webp`, Expo Image failed to resolve the URI.

### The Solution
Implemented `resolveImageUrl(url?: string)` in `mobile/src/services/api.ts`:
```typescript
export function resolveImageUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:")
  ) {
    return trimmed;
  }
  const cleanPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `https://vanvasai.vercel.app${cleanPath}`;
}
```
All mobile components (`PlaceCard`, `DestinationDetailScreen`, hero headers) wrap their image sources with `resolveImageUrl`, ensuring seamless high-resolution image rendering across both Web and Android/iOS.

---

## 5. Storage Service & Durable Media Pipeline

- **Storage Provider:** Supported across `Supabase Storage`, `Cloudinary`, and `AWS S3 / Cloudflare R2` via `StorageService`.
- **Integrity Validation:** When users upload profile photos or media, the backend converts formats to optimized WebP, sanitizes filenames to prevent path traversal, and returns absolute durable URLs.
- **Sidecar Metadata Retention:** For dynamically generated editorial artwork, sidecar `.generated.json` metadata records the exact model, prompt blueprint, terrain type, aspect ratio, and generation timestamp alongside the image asset.

---

## 6. Dharamshala Editorial Artwork Rebuild & Semantic Uniqueness Verification

In November 2026, the complete Dharamshala catalog underwent a comprehensive editorial artwork rebuild:
- **5 Seeded Places (Replaced Flat Vectors):**
  - `gyuto-monastery`: Gyuto Tantric Monastery & Karmapa Seat (1376x768 WebP & JPG)
  - `dal-lake-dharamshala`: Sacred Dal Lake & Deodar Groves (1376x768 WebP & JPG)
  - `tibetan-butter-tea`: Tibetan Butter Tea & Tingmo Bakery Lane (1376x768 WebP & JPG)
  - `masroor-rock-temples`: Masroor Monolithic Rock-Cut Temples (1376x768 WebP & JPG)
  - `tashi-jong-monastery`: Tashi Jong Buddhist Craft Community & Stupas (1376x768 WebP & JPG)
- **4 Unique Stays:**
  - `fortune-park-moksha`: Strawberry Hills luxury hillside resort (1376x768 WebP & JPG)
  - `chonor-house-tibetan-guesthouse`: Traditional Tibetan heritage guesthouse (1376x768 WebP & JPG)
  - `clouds-end-villa-heritage-estate`: Colonial hillside heritage villa (1376x768 WebP & JPG)
  - `zostel-dharamkot`: High-altitude backpacker mountain hostel (1376x768 WebP & JPG)
- **2 Unique Rental Vehicles:**
  - `dharamshala_mcleod_scooter`: Honda Activa 6G Cedar Ridge Edition (1376x768 WebP & JPG)
  - `dharamshala_dhauladhar_bullet`: Classic 350 Dhauladhar Cruiser (1376x768 WebP & JPG)
- **Uniqueness & Integrity Verification:**
  - Audit across all 16 places, 4 stays, and 2 rentals confirmed 22 unique asset hashes with **0 duplicate collisions**.
  - All 5 Dharamshala entries removed from `PENDING_ARTWORK_SET` in `frontend/lib/placeVisualResolver.ts`.
  - Browser visual QA automated via Puppeteer confirmed 100% successful asset delivery (HTTP 200, 0 failed network requests) across both desktop (1440x900) and mobile (390x844).

---

## 7. Kasol Complete Visual Rebuild, Hotel Image Uniqueness & Runtime Deduplication

Following runtime production audits on `https://vanvasai.vercel.app/explore/kasol`, the complete Kasol visual inventory was overhauled:
- **Four Distinct Hotel Artworks (P0 Requirement):**
  - Generated and integrated 4 bespoke full-bleed gouache illustrations (1376x768 WebP & JPG):
    - `the-himalayan-village`: Kathkuni timber-and-stone dry masonry chalets with carved balconies and slate roofs.
    - `parvati-kuteer-riverside-wood-cottages`: A-frame log cottages on the Parvati riverbank with lawn, hammocks, and boulders.
    - `kasol-heights-resort`: High-altitude modern resort on Suma Ropa ridge with panoramic sundeck.
    - `the-hosteller-kasol-riverside`: Backpacker hostel with fairy-lit wooden riverside cafe deck and twilight mountain atmosphere.
  - Pairwise visual variance across all 4 stays confirmed at **66.3 to 80.3**, eliminating generic valley repetitions.
- **16 Canonical Places Resolution:**
  - Generated bespoke illustrations for `pulga-fairy-forest`, `tulga-hamlet`, `rasol-trail`, `jim-morrison-cafe`, and `waichin-valley`.
  - All 16 Kasol places verified with unique SHA-256 hashes and minimum pairwise variance of 50.7.
- **Runtime Deduplication & API Protection (`explore/[slug]/page.tsx`):**
  - Canonical package preserved as authoritative baseline, eliminating duplicate Chalal, Manikaran, and Kheerganga entries caused by uncurated backend database rows.
  - Filtered out phantom `Parvati Woods Bohemian Alpine Lodge` and removed its alias in `placeVisualResolver.ts`.
  - Deduplicated Valley Mobility fleet to ensure the 2 distinct vehicles (TVS Jupiter 125 and Royal Enfield Classic 350) render cleanly.
- **Diagnostics:**
  - Added `generateDestinationVisualAuditReport` in `placeVisualResolver.ts`.
  - 100% of Kasol (22/22) and Dharamshala baseline (22/22) assets verified valid and on disk.



