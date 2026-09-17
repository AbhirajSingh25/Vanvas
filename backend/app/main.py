from contextlib import asynccontextmanager
from fastapi import FastAPI, Response, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.config import settings
from app.database.session import engine, Base, get_db
from app.seed.seed_data import seed_database
from app.api.v1 import (
    auth, destinations, trips, budget, group, places,
    transport_hotels_rentals, copilot, checklist, admin, search, artwork
)

def _ensure_sqlite_schema():
    from sqlalchemy import text
    try:
        with engine.connect() as conn:
            result = conn.execute(text("PRAGMA table_info(user_preferences)"))
            existing_cols = {row[1] for row in result.fetchall()}
            if existing_cols:
                if "accommodation_preference" not in existing_cols:
                    conn.execute(text("ALTER TABLE user_preferences ADD COLUMN accommodation_preference VARCHAR(100) DEFAULT 'Riverside & Forest Stays'"))
                if "transport_preference" not in existing_cols:
                    conn.execute(text("ALTER TABLE user_preferences ADD COLUMN transport_preference VARCHAR(100) DEFAULT 'Volvo Bus'"))
                if "companion_style" not in existing_cols:
                    conn.execute(text("ALTER TABLE user_preferences ADD COLUMN companion_style VARCHAR(50) DEFAULT 'Solo'"))
                conn.commit()
    except Exception:
        pass

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    Base.metadata.create_all(bind=engine)
    # Ensure SQLite columns exist for UserPreference
    _ensure_sqlite_schema()
    # Seed database with authentic Indian mountain travel data
    seed_database()
    yield

app = FastAPI(
    title="VANVAS API - Travel Operating Layer",
    description="Backend API for VANVAS by The Sorted Club - Spontaneous AI Travel Companion",
    version=settings.VERSION,
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Auth"])
app.include_router(destinations.router, prefix=f"{settings.API_V1_STR}/destinations", tags=["Destinations"])
app.include_router(trips.router, prefix=f"{settings.API_V1_STR}/trips", tags=["Trips & Itinerary"])
app.include_router(budget.router, prefix=f"{settings.API_V1_STR}/trips", tags=["Budget & Expenses"])
app.include_router(group.router, prefix=f"{settings.API_V1_STR}/trips", tags=["Group Travel & Voting"])
app.include_router(places.router, prefix=f"{settings.API_V1_STR}/places", tags=["Places & Nearby"])
app.include_router(transport_hotels_rentals.router, prefix=f"{settings.API_V1_STR}", tags=["Transport, Hotels & Rentals"])
app.include_router(copilot.router, prefix=f"{settings.API_V1_STR}/copilot", tags=["AI Copilot"])
app.include_router(copilot.router, prefix=f"{settings.API_V1_STR}/trips", tags=["AI Copilot"])
app.include_router(checklist.router, prefix=f"{settings.API_V1_STR}/trips", tags=["Checklist"])
app.include_router(search.router, prefix=f"{settings.API_V1_STR}/search", tags=["Search & Intent"])
app.include_router(artwork.router, prefix=f"{settings.API_V1_STR}/artwork", tags=["Artwork & Visual Intelligence"])
app.include_router(admin.router, prefix=f"{settings.API_V1_STR}/admin", tags=["Admin & System Health"])

@app.get("/")
def root():
    return {
        "brand": "VANVAS by The Sorted Club",
        "philosophy": "Travel should feel spontaneous. The planning should not.",
        "status": "operational",
        "version": settings.VERSION,
        "docs_url": "/docs"
    }

@app.get("/health", tags=["Health"])
def health_check():
    """
    Liveness probe indicating the API process is alive.
    """
    return {
        "status": "healthy",
        "service": "vanvas-core-api",
        "version": settings.VERSION
    }

@app.get("/health/ready", tags=["Health"])
def readiness_check(response: Response, db: Session = Depends(get_db)):
    """
    Readiness probe verifying essential runtime dependencies (database connectivity).
    Returns HTTP 200 when ready, HTTP 503 if database is unreachable.
    """
    try:
        db.execute(text("SELECT 1"))
        return {
            "status": "ready",
            "database": "connected",
            "service": "vanvas-core-api"
        }
    except Exception:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "service": "vanvas-core-api"
        }
