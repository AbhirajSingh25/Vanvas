# Destination Research Pipeline

## Overview
VANVAS implements a 12-step research pipeline capable of researching any destination in India on demand without requiring manual page creation.

---

## The 12-Step Research Pipeline

```
1. Input Query Geocoding  ==>  Resolve Latitude / Longitude & State
2. Canonical Resolution   ==>  Check if destination is already indexed / seeded
3. Destination Synthesis  ==>  Synthesize description, altitude, and region
4. Atmosphere / Terrain   ==>  Classify into Mountain / Coastal / Desert / Heritage / Spiritual / Forest
5. Seasonality & Weather  ==>  Synthesize best travel months and climate profile
6. Field Intelligence     ==>  Generate dynamic field notes: Packing, Etiquette, Transport, Safety
7. Emergency Contacts     ==>  Extract state and local verified helpline directories
8. Places & POIs          ==>  Discover real cafes, nature trails, viewpoints, heritage landmarks
9. Stays & Sanctuaries    ==>  Discover authentic hostels, homestays, boutique stays, camps
10. Mobility Providers    ==>  Discover scooter/bike rental operators, local taxi unions, buses
11. Persistence & Caching ==>  Persist to database (`destinations`, `places`, `hotels`, `rentals`)
12. Normalized Response   ==>  Return structured payload for instantaneous frontend rendering
```

---

## Data Truthfulness & Validation Principles

- **No Artificial Businesses:** Businesses, cafes, and hotels are never synthesized with fake contact details or imaginary addresses.
- **Truthful Fallbacks:** If a phone number or booking engine is unavailable, the UI explicitly renders truthful fallbacks: *"Rate upon inquiry"*, *"Contact Front Desk"*, or *"Get Directions"*.
- **No Invalid Booking Domains:** Dummy domains like `booking.vanvas.com` are strictly forbidden and blocked across all data models and resolvers.
