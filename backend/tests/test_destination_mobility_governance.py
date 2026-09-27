import pytest
from app.services.mobility_service import MobilityService
from app.database.session import SessionLocal
from app.models.models import MobilityProvider, MobilityVehicle, Destination

def test_resolve_category_artwork_destination_isolation():
    """
    Ensure strict destination-specific artwork isolation:
    - Goa must not receive Jaipur or Manali artwork
    - Jaipur must receive Pink City / Amer artwork
    - Udaipur must receive Lake Pichola / Mewar artwork
    - Varanasi must receive Ghat / BHU artwork
    - Leh / Spiti must receive Trans-Himalayan high-altitude artwork
    """
    # 1. Goa isolation
    goa_scooter = MobilityService._resolve_category_artwork("Scooter", "Honda Activa 6G", "Goa", "Goa")
    goa_car = MobilityService._resolve_category_artwork("Car", "Hyundai Creta", "Goa", "Goa")
    goa_bike = MobilityService._resolve_category_artwork("Motorcycle", "Classic 350", "Goa", "Goa")
    assert "goa_beach_scooter" in goa_scooter or "coastal" in goa_scooter
    assert "goa_coastal_car" in goa_car
    assert "goa_coastal_bullet" in goa_bike
    assert "jaipur" not in goa_scooter
    assert "spiti" not in goa_bike

    # 2. Jaipur isolation
    jaipur_scooter = MobilityService._resolve_category_artwork("Scooter", "Honda Activa", "Jaipur", "Rajasthan")
    jaipur_car = MobilityService._resolve_category_artwork("Car", "Swift Dzire", "Jaipur", "Rajasthan")
    jaipur_bike = MobilityService._resolve_category_artwork("Motorcycle", "Royal Enfield Classic 350", "Jaipur", "Rajasthan")
    assert "jaipur_hawa_mahal_scooter" in jaipur_scooter
    assert "jaipur_amer_car" in jaipur_car
    assert "jaipur_pinkcity_bullet" in jaipur_bike
    assert "goa" not in jaipur_scooter
    assert "udaipur" not in jaipur_car

    # 3. Udaipur isolation
    udaipur_scooter = MobilityService._resolve_category_artwork("Scooter", "TVS Jupiter", "Udaipur", "Rajasthan")
    udaipur_car = MobilityService._resolve_category_artwork("Car", "Maruti Baleno", "Udaipur", "Rajasthan")
    udaipur_bike = MobilityService._resolve_category_artwork("Motorcycle", "Classic 350", "Udaipur", "Rajasthan")
    assert "udaipur_pichola_scooter" in udaipur_scooter
    assert "udaipur_lakeside_car" in udaipur_car
    assert "udaipur_oldcity_bullet" in udaipur_bike
    assert "jaipur" not in udaipur_scooter

    # 4. Varanasi isolation
    varanasi_scooter = MobilityService._resolve_category_artwork("Scooter", "Honda Activa 6G", "Varanasi", "Uttar Pradesh")
    varanasi_bike = MobilityService._resolve_category_artwork("Motorcycle", "Royal Enfield Classic 350", "Varanasi", "Uttar Pradesh")
    varanasi_car = MobilityService._resolve_category_artwork("Car", "Innova Crysta", "Varanasi", "Uttar Pradesh")
    assert "varanasi_assi_scooter" in varanasi_scooter or "varanasi_oldcity" in varanasi_scooter
    assert "varanasi_bhu_bullet" in varanasi_bike
    assert "varanasi_ghat_car" in varanasi_car
    assert "himachal" not in varanasi_scooter

    # 5. Leh and Spiti high-altitude isolation
    leh_bike = MobilityService._resolve_category_artwork("Motorcycle", "Himalayan 450", "Leh", "Ladakh")
    spiti_bike = MobilityService._resolve_category_artwork("Motorcycle", "Himalayan 411", "Spiti Valley", "Himachal Pradesh")
    assert "leh_high_altitude_motorcycle" in leh_bike or "leh_palace_bullet" in leh_bike
    assert "spiti_arid_adventure_bike" in spiti_bike
    assert "goa" not in leh_bike
    assert "jaipur" not in spiti_bike

def test_database_mobility_provider_data_integrity():
    """
    Verify all seeded mobility providers and vehicles:
    - Real business names
    - Valid phone numbers (contain at least 10 digits, no placeholder patterns like 98765 XXXXX)
    - Positive daily prices and deposits (no negative numbers)
    - Valid destinations
    """
    db = SessionLocal()
    try:
        providers = db.query(MobilityProvider).all()
        assert len(providers) >= 20, "At least 20 verified providers must be present in database"

        for p in providers:
            assert p.business_name, "Business name cannot be empty"
            assert p.city, f"Provider {p.business_name} must have a city"
            if p.phone:
                digits_only = "".join(c for c in p.phone if c.isdigit())
                assert len(digits_only) >= 10, f"Provider {p.business_name} has invalid phone {p.phone}"
                assert "9876543210" not in digits_only, f"Provider {p.business_name} uses placeholder phone"

            for v in p.vehicles:
                if v.daily_price is not None:
                    assert v.daily_price > 0, f"Vehicle {v.model} in {p.business_name} has non-positive daily price"
                if v.deposit is not None:
                    assert v.deposit >= 0, f"Vehicle {v.model} in {p.business_name} has negative deposit"
                valid_types = [
                    "Scooter", "Motorcycle", "Adventure Motorcycle", "Touring Motorcycle",
                    "Car", "Self-Drive Car", "SUV", "Bicycle", "Mountain Bike", "Bike", "Electric Scooter"
                ]
                assert any(vt.lower() in v.vehicle_type.lower() or v.vehicle_type.lower() in vt.lower() for vt in valid_types), f"Invalid vehicle type {v.vehicle_type}"
    finally:
        db.close()
