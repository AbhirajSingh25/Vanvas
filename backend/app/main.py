from contextlib import asynccontextmanager
from fastapi import FastAPI, Response, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.config import settings
from app.database.session import engine, Base, get_db, ensure_database_schema
from app.seed.seed_data import seed_database
from app.api.v1 import (
    auth, destinations, trips, budget, group, places,
    transport_hotels_rentals, copilot, checklist, admin, search, artwork, reviews, bookings, mobility, circles
)

import logging

logger = logging.getLogger("vanvas.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database schema is up-to-date and all tables/columns exist
    try:
        ensure_database_schema(engine)
    except Exception as e:
        logger.warning(f"Database schema initialization deferred or encountered an error: {e}")

    # Seed database with authentic Indian mountain travel data
    try:
        seed_database()
    except Exception as e:
        logger.warning(f"Database seeding deferred or encountered an error: {e}")
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
app.include_router(mobility.router, prefix=f"{settings.API_V1_STR}/mobility", tags=["Mobility & Rentals Directory"])
app.include_router(copilot.router, prefix=f"{settings.API_V1_STR}/copilot", tags=["AI Copilot"])
app.include_router(copilot.router, prefix=f"{settings.API_V1_STR}/trips", tags=["AI Copilot"])
app.include_router(checklist.router, prefix=f"{settings.API_V1_STR}/trips", tags=["Checklist"])
app.include_router(search.router, prefix=f"{settings.API_V1_STR}/search", tags=["Search & Intent"])
app.include_router(artwork.router, prefix=f"{settings.API_V1_STR}/artwork", tags=["Artwork & Visual Intelligence"])
app.include_router(reviews.router, prefix=f"{settings.API_V1_STR}", tags=["Community Reviews & Moderation"])
app.include_router(bookings.router, prefix=f"{settings.API_V1_STR}", tags=["Travel Commerce & Bookings"])
app.include_router(circles.router, prefix=f"{settings.API_V1_STR}", tags=["Solo Traveler Circles & Notifications"])
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
@app.get(f"{settings.API_V1_STR}/health", tags=["Health"])
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
@app.get(f"{settings.API_V1_STR}/health/ready", tags=["Health"])
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

@app.get(f"{settings.API_V1_STR}/health/diagnostics", tags=["Health"])
def health_diagnostics(response: Response, db: Session = Depends(get_db)):
    """
    Production diagnostics endpoint verifying database connectivity,
    canonical destination count, tables status, map and provider config without exposing secrets.
    """
    try:
        from app.models.models import Destination, Place, Hotel, RentalOption, User
        db.execute(text("SELECT 1"))
        dest_count = db.query(Destination).count()
        places_count = db.query(Place).count()
        hotels_count = db.query(Hotel).count()
        rentals_count = db.query(RentalOption).count()
        users_count = db.query(User).count()

        return {
            "status": "operational",
            "environment": settings.ENVIRONMENT,
            "database": {
                "connected": True,
                "engine": "postgresql" if "postgresql" in settings.DATABASE_URL.lower() else "sqlite",
                "counts": {
                    "destinations": dest_count,
                    "places": places_count,
                    "hotels": hotels_count,
                    "rentals": rentals_count,
                    "users": users_count
                }
            },
            "map_configuration": {
                "provider": "OpenStreetMap",
                "requires_api_key": False,
                "keyless_production_ready": True
            },
            "auth_configuration": {
                "jwt_algorithm": "HS256",
                "token_expire_minutes": settings.ACCESS_TOKEN_EXPIRE_MINUTES
            },
            "service": "vanvas-core-api",
            "version": settings.VERSION
        }
    except Exception as exc:
        response.status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        return {
            "status": "degraded",
            "error": str(exc),
            "service": "vanvas-core-api"
        }

