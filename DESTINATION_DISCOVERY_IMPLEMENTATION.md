# VANVAS — Destination Discovery Architecture & Implementation

## 1. Architecture Overview

Destination discovery in VANVAS transforms raw travel data into actionable, geographically coherent trip intelligence. Rather than returning an undifferentiated list of places, the discovery engine organizes landmarks by travel feasibility, authentic travel distance, and traveler intent.

```
                    ┌────────────────────────────┐
                    │  User Search / Discovery   │
                    └─────────────┬──────────────┘
                                  │
                                  ▼
                    ┌────────────────────────────┐
                    │    Search Intent Router    │
                    │   (backend/intent_router)  │
                    └──────┬──────────────┬──────┘
                           │              │
          ┌────────────────┘              └────────────────┐
          ▼                                                ▼
  [Intent: Destination]                             [Intent: Place]
(e.g., "Spiti Valley", "Manali")             (e.g., "Key Monastery", "Hawa Mahal")
          │                                                │
          ▼                                                ▼
┌────────────────────────────┐                    ┌────────────────────────────┐
│   Destination Controller   │                    │ Route to Destination Page  │
│    (destinations.py)       │                    │    with Focused Place      │
└─────────────┬──────────────┘                    └────────────────────────────┘
              │
              ├───────────────────────────────────────────────┐
              ▼                                               ▼
    [ Canonical Seeded DB ]                         [ Unseeded Dynamic POI ]
  420 Curated Places, 26 Dests                   OpenStreetMap / Live Google Places
  Haversine Distance Clustering                   LiveHotelsProvider + LiveRentalsProvider
              │                                               │
              └───────────────────────┬───────────────────────┘
                                      ▼
                        ┌────────────────────────────┐
                        │   Geographical Clusters    │
                        │  - Immediate Town (0-5 km) │
                        │  - Nearby Circuit (5-25km) │
                        │  - Regional Trips (25-75km)│
                        └─────────────┬──────────────┘
                                      ▼
                        ┌────────────────────────────┐
                        │   Dual Platform UI Layer   │
                        │  Web: Next.js + Tailwind   │
                        │  Mobile: Expo + Reanimated │
                        └────────────────────────────┘
```

---

## 2. Search Intent Routing Engine (`intent_router.py`)

The intent router classifies queries into three distinct modalities:

1. **Direct Destination Intent:**
   - Queries matching canonical destination names or aliases (e.g., `Manali`, `Spiti Valley`, `Paris`, `Udaipur`).
   - Resolves directly to `{"intent": "destination", "destination": slug}`.
2. **Direct Landmark Intent:**
   - Queries matching famous attractions (e.g., `Key Monastery`, `Hawa Mahal`, `Taj Mahal`, `Hadimba Temple`, `Triund Trek`, `Pangong Tso`, `Chicham Bridge`).
   - Resolves to `{"intent": "place", "destination": target_slug, "place": landmark_name}`.
3. **Category & Location Intent:**
   - Queries combining categories and locations (e.g., `Cafes in Landour`, `Stays in Kasol`, `Treks in Manali`).
   - Resolves to `{"intent": "category_location", "destination": slug, "category": category}`.

Verified via automated test suite `backend/tests/test_search_intent_routing.py`.

---

## 3. Geographical Clustering & Haversine Distance Engine

To avoid presenting a 60 km remote glacial pass as if it were a short walk from town, the destination controller calculates exact Haversine distances from destination central coordinates:

```python
def compute_place_clusters(dest_lat: float, dest_lng: float, places: List[Dict[str, Any]]) -> Dict[str, Any]:
    clusters = {
        "Immediate Town (0-5 km)": [],
        "Nearby Circuit (5-25 km)": [],
        "Regional Day Trips (25-75+ km)": []
    }
    for p in places:
        plat, plng = p.get("lat"), p.get("lng")
        if plat is not None and plng is not None:
            dist = haversine_distance(dest_lat, dest_lng, plat, plng)
            p["distance_km"] = round(dist, 1)
            if dist <= 5.0:
                p["zone"] = "Immediate Town (0-5 km)"
                clusters["Immediate Town (0-5 km)"].append(p)
            elif dist <= 25.0:
                p["zone"] = "Nearby Circuit (5-25 km)"
                clusters["Nearby Circuit (5-25 km)"].append(p)
            else:
                p["zone"] = "Regional Day Trips (25-75+ km)"
                clusters["Regional Day Trips (25-75+ km)"].append(p)
    return clusters
```

Each destination detail endpoint returns:
- `clustering`: The grouped dictionary of places by zone.
- `coverage_summary`: e.g., `"16 places discovered across 3 geographic zones"`.

---

## 4. Dynamic Destination Fallback Pipeline

For destinations outside the 26 canonical seeds:
1. **Live Stays:** `LiveHotelsProvider.search_hotels(destination_name, lat, lng)` fetches authentic local properties.
2. **Live Mobility:** `LiveRentalsProvider.search_rentals(destination_name, lat, lng)` returns vehicle rental providers.
3. **Places Enrichment:** Overpass OpenStreetMap queries fetch top cultural and nature landmarks, compute distances, and assign categories.
4. **Resilience:** If the database contains a partial or outdated set of places for a canonical destination, the backend automatically supplements the missing places from `ADDITIONAL_PLACES_BY_DEST`.

---

## 5. Dual-Platform UI Integration

- **Web (`frontend/components/places/PlaceCard.tsx`):**
  - Displays `Verified Photo`, `Live Photo`, or `Editorial Art` badges.
  - Provides a one-click **"Plan"** action navigating directly to `/plan?destination=...&place=...` for itinerary creation.
- **Mobile Native (`mobile/src/components/PlaceCard.tsx`):**
  - Uses `resolveImageUrl` for static asset loading from Vercel domain.
  - Renders zone and distance pills (`Immediate Town • 2.4 km`).
  - Haptic feedback on tap and dedicated **"Plan"** action linking to native planning tabs.
