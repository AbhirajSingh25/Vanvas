from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.models import MobilityProvider, MobilityVehicle, Destination
from app.schemas.schemas import (
    MobilityListingResponse, MobilityProviderResponse, MobilityVehicleResponse,
    MobilityProviderCreate, MobilityProviderClaim, MobilityVehicleCreate,
    ActionLink, RentalOptionResponse
)
from app.services.mobility_service import MobilityService
from app.services.action_link_generator import ActionLinkGenerator

router = APIRouter()

@router.get("/near", response_model=List[RentalOptionResponse])
async def get_mobility_near(
    destination_id: Optional[str] = Query(None, description="Destination slug or ID"),
    lat: Optional[float] = Query(None, description="Latitude"),
    lng: Optional[float] = Query(None, description="Longitude"),
    radius_km: float = Query(15.0, description="Search radius in km"),
    vehicle_type: Optional[str] = Query(None, description="Filter by vehicle type"),
    db: Session = Depends(get_db)
):
    """
    Get verified and discovered mobility listings near a destination or coordinates.
    Follows strict 5-tier data priority and real-data verification rules.
    """
    listings = await MobilityService.get_mobility_listings(
        db=db,
        destination_slug_or_id=destination_id,
        lat=lat,
        lng=lng,
        radius_km=radius_km,
        vehicle_type=vehicle_type,
    )
    return listings

@router.get("/providers/{provider_id}", response_model=MobilityProviderResponse)
def get_provider_details(
    provider_id: str,
    db: Session = Depends(get_db)
):
    """Get verified mobility provider profile and fleet."""
    prov = db.query(MobilityProvider).filter(MobilityProvider.id == provider_id).first()
    if not prov:
        raise HTTPException(status_code=404, detail="Mobility provider not found")
    return prov

@router.get("/providers/{provider_id}/vehicles", response_model=List[MobilityVehicleResponse])
def get_provider_vehicles(
    provider_id: str,
    db: Session = Depends(get_db)
):
    """Get active vehicles for a mobility provider."""
    prov = db.query(MobilityProvider).filter(MobilityProvider.id == provider_id).first()
    if not prov:
        raise HTTPException(status_code=404, detail="Mobility provider not found")
    return [v for v in prov.vehicles if v.active]

@router.get("/providers/{provider_id}/actions", response_model=List[ActionLink])
def get_provider_actions(
    provider_id: str,
    db: Session = Depends(get_db)
):
    """Get real, verified action links for a mobility provider."""
    prov = db.query(MobilityProvider).filter(MobilityProvider.id == provider_id).first()
    if not prov:
        raise HTTPException(status_code=404, detail="Mobility provider not found")
    links = ActionLinkGenerator.generate_rental_action_links(
        provider_name=prov.business_name,
        latitude=prov.latitude,
        longitude=prov.longitude,
        website=prov.website,
        phone=prov.phone,
        whatsapp=prov.whatsapp,
    )
    return [ActionLink(**l) for l in links]

@router.post("/providers", response_model=MobilityProviderResponse)
def register_provider(
    payload: MobilityProviderCreate,
    db: Session = Depends(get_db)
):
    """Register a new mobility provider foundation."""
    return MobilityService.create_provider(db, payload)

@router.post("/providers/{provider_id}/claim", response_model=MobilityProviderResponse)
def claim_provider(
    provider_id: str,
    payload: MobilityProviderClaim,
    db: Session = Depends(get_db)
):
    """Provider claim listing foundation."""
    return MobilityService.claim_provider(db, provider_id, payload)

@router.post("/providers/{provider_id}/vehicles", response_model=MobilityVehicleResponse)
def add_provider_vehicle(
    provider_id: str,
    payload: MobilityVehicleCreate,
    db: Session = Depends(get_db)
):
    """Add a vehicle to provider fleet."""
    prov = db.query(MobilityProvider).filter(MobilityProvider.id == provider_id).first()
    if not prov:
        raise HTTPException(status_code=404, detail="Mobility provider not found")
    return MobilityService.add_vehicle(db, provider_id, payload)
