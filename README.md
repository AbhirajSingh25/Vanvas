# VANVAS - AI-Powered Spontaneous Travel Operating Layer
### by The Sorted Club

> *"Travel should feel spontaneous. The planning should not."*

VANVAS is a production-grade travel operating layer and AI companion designed for spontaneous travellers. It bridges the gap between transportation arrival, luggage drop timings, hotel check-ins, local scooter mobility, curated dining along transit paths, geographic itinerary clustering, and real-time circumstances (late arrivals, rainy weather, fatigue, budget constraints).

---

## 🏔️ Brand & Visual Identity
- **Visual Feeling:** Indian visual heritage + Himalayan pine forests + mist overlays + warm natural paper journals + brass & terracotta accents.
- **Palette:** Deep Forest (`#17352C`), Pine (`#285447`), Mist (`#DCE3DD`), Warm Ivory (`#F3EEE3`), Natural Paper (`#E9E1D1`), Earth Bronze (`#8A6547`), Terracotta (`#A9573B`), Muted Brass (`#B89A63`).
- **Typography:** Inter / Outfit for clean UI hierarchy + Noto Serif Devanagari for authentic Indian heritage accents.
- **Bespoke Logo:** Custom vector wordmark with mountain ridge silhouette and Devanagari headline geometry + artisan signature *"by The Sorted Club"*.

---

## ⚡ Key Features

1. **10-Step "Plan My Trip" Wizard:**
   Progressive conversational experience calculating multi-day trips based on destination, dates, budget tiers, companion types, interests, travel style, wake-up times, and intensity.
2. **AI Recommendation & Geographic Clustering Engine:**
   Sequences places geographically using TSP heuristics to prevent zigzag travel, calculates realistic mountain road transit times (1.45x topography factor), and scores places dynamically using:
   $$\text{Score} = w_{\text{int}}\cdot \text{Interest} + w_{\text{bud}}\cdot \text{Budget} + w_{\text{loc}}\cdot \text{Location} + w_{\text{rat}}\cdot \text{Rating} + w_{\text{time}}\cdot \text{TimeFit} + w_{\text{grp}}\cdot \text{GroupVote} + w_{\text{pers}}\cdot \text{Personalization}$$
3. **"I'M HERE" Arrival Mode:**
   One-click real-time mode providing immediate 3-hour micro schedules, hotel check-in reasoning, luggage drops, and nearest morning food upon arriving at bus stands or transit hubs.
4. **Arrival Optimizer:**
   Compares bus/train/flight departure and arrival options against hotel check-in windows (11:00 AM) to recommend optimal arrival timings.
5. **Dynamic Real-Time Replanner:**
   One-click adaptations (*"I'm Late"*, *"I'm Tired"*, *"It's Raining"*, *"Less Money"*, *"More Adventure"*) that adjust upcoming schedules without destroying completed items.
6. **"I Have X Hours" Quick Plan:**
   Spontaneous micro-itinerary generator for 1, 2, 3, or 4-hour free windows.
7. **Private Group Travel Voting:**
   Shareable trip invite codes and anonymous private voting (`NO`, `LIKE`, `LOVE`) aggregating into a group compatibility percentage score.
8. **Live Budget & Expense Tracker:**
   Instant on-the-trail expense logger with categorized breakdowns and remaining balance gauges.
9. **Contextual AI Travel Copilot:**
   Context-aware assistant aware of trip location, budget left, dietary preferences, and active schedule.
10. **Admin & Provider Health Console:**
    Real-time monitoring of live and fallback demo providers, latency, and platform metrics.

---

## 🛠️ Architecture & Tech Stack

```
VANVAS/
├── backend/                  # FastAPI 0.110 (Python 3.14 / 3.11)
│   ├── app/
│   │   ├── api/v1/          # Modular API Routers (Auth, Destinations, Trips, Budget, Group, Places, Copilot, Admin)
│   │   ├── core/            # Config, Security & JWT
│   │   ├── database/        # SessionLocal & Base
│   │   ├── itinerary/       # Clustering, Generator, Replanner, Arrival Optimizer
│   │   ├── models/          # SQLAlchemy ORM Models
│   │   ├── providers/       # Provider Interface Pattern (Live & Demo Adapters)
│   │   ├── recommendation/  # Configurable Weighted Scorer
│   │   ├── schemas/         # Pydantic Validation Schemas
│   │   └── seed/            # Seed data for 8 Indian Destinations
│   ├── tests/               # Pytest Automated Test Suite
│   └── requirements.txt
│
├── frontend/                 # Next.js 14+ App Router (TypeScript + Tailwind CSS)
│   ├── app/                 # Routes: /, /explore, /explore/[slug], /plan, /trips, /trips/[id], /nearby, /admin
│   ├── components/          # Brand Logo, Layout, Mist Overlay, Trip Drawers, Copilot Modal, Place Cards
│   ├── context/             # AuthContext (JWT & Demo Traveller Session)
│   ├── lib/                 # API Client (typed methods & fallback adapters)
│   └── types/               # Full TypeScript Data Contracts
│
├── docker-compose.yml        # Full Stack Orchestration (PostgreSQL + FastAPI + Next.js)
└── .env.example
```

---

## 🚀 Running Locally

### 1. Backend Setup (FastAPI)
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```
- API Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)
- The backend automatically initializes and seeds all 8 destinations on startup!

### 2. Frontend Setup (Next.js)
```bash
cd frontend
npm install
npm run dev
```
- Web Application: [http://localhost:3000](http://localhost:3000)

### 3. Running Automated Backend Tests
```bash
cd backend
python -m pytest -v
```

---

## 🔑 Environment Variables & Provider Configuration

See `.env.example` for the complete list:
- `DATABASE_URL`: PostgreSQL connection string (defaults automatically to SQLite for zero-config local run).
- `SECRET_KEY`: JWT secret string.
- `WEATHER_API_KEY`: OpenWeatherMap API key (optional; demo provider active if empty).
- `MAPS_API_KEY`: Maps service key (optional; demo topography provider active if empty).
- `PLACES_API_KEY`: Places discovery key (optional; rich curated database active if empty).

---

## 📜 Seeded Indian Sanctuaries
- **Manali** (Himachal Pradesh - Alpine Trails & Old Village Cafés)
- **Rishikesh** (Uttarakhand - Ganges Rapids & Sunset Aartis)
- **Kasol** (Himachal Pradesh - Parvati Pine Forests & Bakeries)
- **Dharamshala & McLeod Ganj** (Himachal Pradesh - Dhauladhar Ridge & Monasteries)
- **Goa** (Goa - Coastal Villages & Shacks)
- **Jaipur** (Rajasthan - Royal Heritage & Bazaars)
- **Mussoorie** (Uttarakhand - Ridge Trails & Bakeries)
- **Udaipur** (Rajasthan - Lake Havelis & Sunsets)

---
© VANVAS by The Sorted Club. Crafted for Indian mountain trails.
