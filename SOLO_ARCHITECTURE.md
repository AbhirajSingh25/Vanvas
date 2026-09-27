# VANVAS Solo Travel Platform — Architecture & Operating Model

## Overview
VANVAS Solo is a destination-agnostic, research-driven solo travel intelligence platform. Rather than presenting static pre-written content, VANVAS dynamically accepts **any destination across India** (both canonical seeded sanctuaries and arbitrary researched locations), classifies its terrain/atmosphere, discovers real points of interest (POIs), aggregates authentic accommodations and mobility providers, pairs compatible solo travellers, and delivers live field intelligence.

---

## 1. Core Architectural Pillars

```
+-------------------------------------------------------------------------------+
|                             VANVAS Solo Frontend                             |
|           (Next.js App Router, Tailwind CSS, Editorial Typography)             |
+-------------------------------------------------------------------------------+
                                      |
                                      v
+-------------------------------------------------------------------------------+
|                       VANVAS Backend API Layer (FastAPI)                      |
|                                                                               |
|  /api/v1/destinations/research     /api/v1/destinations/{id}/recommendations   |
|  /api/v1/destinations/{id}/solo    /api/v1/circles/solo/messages               |
+-------------------------------------------------------------------------------+
                                      |
                 +--------------------+--------------------+
                 |                                         |
                 v                                         v
+---------------------------------+       +---------------------------------+
|   Destination Research Engine   |       |   Solo Direct & Circle Chat     |
| - 12-Step Live Research Pipeline|       | - 1-on-1 Persistent Direct Chat |
| - Dynamic Geocoding & POI Query |       | - Realtime Circle Group Chat    |
| - Atmosphere & Terrain Classifier|      | - Block / Report / Mute Controls|
| - Dynamic Safety & Emergency Hub|       | - Unread Counters & Timestamps  |
+---------------------------------+       +---------------------------------+
                 |                                         |
                 +--------------------+--------------------+
                                      |
                                      v
+-------------------------------------------------------------------------------+
|                     Persistent Relational Storage (PostgreSQL)                 |
|  Destinations | Places | Stays | Rentals | Circles | Direct Messages | Jobs   |
+-------------------------------------------------------------------------------+
```

---

## 2. Universal Data Engine & Models

### A. Dynamic Atmosphere Classification
Destinations are automatically classified into 6 aesthetic terrain archetypes:
1. **Mountain / Valley** (`mountain`): High-altitude contours, alpine advisories, trail networks.
2. **Coastal / Island** (`coastal`): Tidal wave curves, ferry schedules, coastal warning flags.
3. **Desert / Arid** (`desert`): Dune contours, water hydration alerts, heat timing guides.
4. **Heritage / Old City** (`heritage`): Architectural line motifs, heritage walking loops.
5. **Spiritual / Riverfront** (`spiritual`): Sacred geometry, aarti schedules, temple decorum.
6. **Forest / Valley / Urban** (`forest` / `urban`): Organic topography, canopy guides.

### B. Multi-Select Travel Styles
Users can select multiple travel styles simultaneously (e.g., `Adventure & Trails` + `Cafes & Food` + `Backpacking`). The backend recommendation engine (`/api/v1/destinations/{id}/recommendations`) dynamically computes multi-tag relevance scores, ranking matching places, stays, and mobility options accordingly without requiring page reloads.

---

## 3. Social Discovery & Connected Travellers

1. **Traveller Matching:** Matches solo travellers based on destination overlap, travel dates, style compatibility, and shared interests.
2. **Safety by Design:** Exact location coordinates and sensitive details are never exposed. Travellers are identified only by approximate areas (e.g., "Exploring Old Manali").
3. **1-on-1 Direct Chat:** Connected travellers can immediately start a private conversation with persisted messages, timestamps, and active safety moderation (Block / Report).
4. **Circles & Group Chats:** Travellers can organize or join spontaneous micro-expeditions (e.g., "Jogini Falls Sunrise Hike", "Old Manali Cafe Crawl") with persistent group messaging.

---

## 4. Key Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/v1/destinations/search?q={query}` | GET | Fast autocomplete search across canonical and researched destinations. |
| `/api/v1/destinations/research` | POST | Triggers the 12-step automated research pipeline for arbitrary destinations. |
| `/api/v1/destinations/{id}/solo` | GET | Fetches dynamic field notes, emergency contacts, terrain type, and matching travellers. |
| `/api/v1/destinations/{id}/recommendations` | GET | Multi-style weighted recommendation ranking for places, stays, and mobility. |
| `/api/v1/circles/solo/messages` | POST | Sends a direct message between connected travellers. |
| `/api/v1/circles/solo/messages/{id}` | GET | Retrieves persisted 1-on-1 chat history between travellers. |
