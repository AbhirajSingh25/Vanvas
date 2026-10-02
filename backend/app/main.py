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
    transport_hotels_rentals, copilot, checklist, admin, search, artwork, reviews, bookings, mobility, circles, road_trip
)

import logging

logger = logging.getLogger("vanvas.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.startup_error = None
    # Ensure database schema is up-to-date and all tables/columns exist
    try:
        schema_ok = ensure_database_schema(engine)
        if not schema_ok:
            logger.warning("Database schema verification or connectivity check returned false.")
            app.state.startup_error = "Database schema initialization or connectivity check failed"
    except Exception as e:
        logger.critical(f"Database schema initialization failed: {e}")
        app.state.startup_error = f"Schema initialization error: {e}"

    # Seed database with authentic Indian mountain travel data
    if app.state.startup_error is None:
        try:
            seed_database()
        except Exception as e:
            logger.critical(f"Database seeding failed: {e}")
            app.state.startup_error = f"Seeding error: {e}"
    yield


app = FastAPI(
    title="VANVAS API - Travel Operating Layer",
    description="Backend API for VANVAS by The Sorted Club - Spontaneous AI Travel Companion",
    version=settings.VERSION,
    lifespan=lifespan
)

# Strict CORS origin configuration
cors_origins = settings.get_allowed_cors_origins()
allow_origin_regex = None if settings.is_production else r"https://.*\.vercel\.app"

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=allow_origin_regex,
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
app.include_router(road_trip.router, prefix=f"{settings.API_V1_STR}/road-trip", tags=["Road Trip Mode"])
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
        "version": settings.VERSION,
        "git_revision": settings.GIT_REVISION,
        "environment": settings.ENVIRONMENT
    }

@app.get("/health/ready", tags=["Health"])
@app.get(f"{settings.API_V1_STR}/health/ready", tags=["Health"])
def readiness_check(response: Response, db: Session = Depends(get_db)):
    """
    Readiness probe verifying essential runtime dependencies:
    - Database connectivity
    - No critical startup/seeding error
    - Canonical destination inventory valid (>=26 destinations, >=208 places, >=104 hotels, >=53 rentals)
    Returns HTTP 200 when ready, HTTP 503 if any requirement is unfulfilled.
    """
    startup_err = getattr(app.state, "startup_error", None)
    if startup_err is not None:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return {
            "status": "not_ready",
            "database": "startup_failed",
            "error": startup_err,
            "service": "vanvas-core-api",
            "version": settings.VERSION,
            "git_revision": settings.GIT_REVISION,
            "environment": settings.ENVIRONMENT
        }

    try:
        from app.models.models import Destination, Place, Hotel, RentalOption
        db.execute(text("SELECT 1"))
        
        dest_count = db.query(Destination).count()
        places_count = db.query(Place).count()
        hotels_count = db.query(Hotel).count()
        rentals_count = db.query(RentalOption).count()

        # Check canonical baseline
        if dest_count < 26 or places_count < 208 or hotels_count < 104 or rentals_count < 53:
            response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
            return {
                "status": "not_ready",
                "database": "inventory_incomplete",
                "inventory": {
                    "destinations": dest_count,
                    "places": places_count,
                    "hotels": hotels_count,
                    "rentals": rentals_count,
                    "expected": {"destinations": 26, "places": 208, "hotels": 104, "rentals": 53}
                },
                "service": "vanvas-core-api",
                "version": settings.VERSION,
                "git_revision": settings.GIT_REVISION,
                "environment": settings.ENVIRONMENT
            }

        return {
            "status": "ready",
            "database": "connected",
            "inventory": {
                "destinations": dest_count,
                "places": places_count,
                "hotels": hotels_count,
                "rentals": rentals_count
            },
            "service": "vanvas-core-api",
            "version": settings.VERSION,
            "git_revision": settings.GIT_REVISION,
            "environment": settings.ENVIRONMENT
        }
    except Exception as e:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e),
            "service": "vanvas-core-api",
            "version": settings.VERSION,
            "git_revision": settings.GIT_REVISION,
            "environment": settings.ENVIRONMENT
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
            "git_revision": settings.GIT_REVISION,
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
            "service": "vanvas-core-api",
            "version": settings.VERSION,
            "git_revision": settings.GIT_REVISION,
            "environment": settings.ENVIRONMENT
        }

