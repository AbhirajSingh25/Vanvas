import pytest
import os
import hashlib
from app.providers.artwork_provider import CuratedArtworkProvider
from app.seed.seed_data import seed_database
from app.database.session import SessionLocal
from app.models.models import Destination, Place, Hotel

@pytest.fixture(scope="module")
def provider():
    return CuratedArtworkProvider()

@pytest.fixture(scope="module")
def db_session():
    seed_database()
    db = SessionLocal()
    yield db
    db.close()

@pytest.mark.asyncio
async def test_kasol_semantic_isolation(provider):
    """
    KASOL: Moon Dance Cafe != Chalal Trail visual,
    Moon Dance Cafe -> cafe,
    Chalal Trail -> trail.
    """
    moon_dance = await provider.resolve_place_artwork(
        place_name="Moon Dance Café & German Bakery",
        destination_name="Kasol",
        category="Cafés & Bakery"
    )
    chalal = await provider.resolve_place_artwork(
        place_name="Chalal Pine Riverside Trail",
        destination_name="Kasol",
        category="Nature & Trails"
    )
    
    assert moon_dance["url"] != chalal["url"], "Moon Dance Cafe and Chalal Trail MUST NOT share artwork!"
    assert moon_dance["semantic_category"] == "cafe"
    assert chalal["semantic_category"] == "trail"
    assert "cafe" in moon_dance["url"] or "bakery" in moon_dance["url"]
    assert "trail" in chalal["url"] or "nature" in chalal["url"]
    assert moon_dance["badge_label"] == "VANVAS PLACE ARTWORK"
    assert chalal["badge_label"] == "VANVAS PLACE ARTWORK"

@pytest.mark.asyncio
async def test_spiti_semantic_isolation(provider):
    """
    SPITI: Key Monastery -> monastery,
    Spiti stay -> stay / accommodation (NEVER monastery, fort, or hero),
    Spiti food -> food,
    Spiti trail -> trail / lake.
    """
    key_monastery = await provider.resolve_place_artwork(
        place_name="Key Monastery (Kye Gompa)",
        destination_name="Spiti Valley",
        category="Culture & Heritage"
    )
    stay = await provider.resolve_place_artwork(
        place_name="Spiti Valley Homestay Sanctuary",
        destination_name="Spiti Valley",
        category="Stays & Sanctuaries"
    )
    food = await provider.resolve_place_artwork(
        place_name="Taste of Spiti Local Dhaba",
        destination_name="Spiti Valley",
        category="Local Food"
    )
    chandratal = await provider.resolve_place_artwork(
        place_name="Chandratal (Moon Lake) Glacial Sanctuary",
        destination_name="Spiti Valley",
        category="Nature & Trails"
    )

    assert key_monastery["url"] != stay["url"], "Key Monastery and Stay MUST NOT share artwork!"
    assert key_monastery["url"] != food["url"]
    assert stay["url"] != food["url"]
    assert chandratal["url"] != key_monastery["url"]

    assert key_monastery["semantic_category"] == "monastery"
    assert stay["semantic_category"] == "stay"
    assert food["semantic_category"] == "food"
    assert chandratal["semantic_category"] == "lake"

    # Verify stay never receives landmark or hero artwork
    assert "monastery" not in stay["url"]
    assert "fort" not in stay["url"]
    assert "hero.jpg" not in stay["url"]
    assert "stay" in stay["url"]

@pytest.mark.asyncio
async def test_manali_semantic_isolation(provider):
    """
    MANALI: temple -> spiritual, cafe -> cafe, stay -> stay, trail -> waterfall/nature
    """
    temple = await provider.resolve_place_artwork("Hadimba Devi Cedar Forest Temple", "Manali", "Culture & Heritage")
    cafe = await provider.resolve_place_artwork("Café 1947", "Manali", "Cafés & Bakery")
    stay = await provider.resolve_place_artwork("The Himalayan Woods Boutique Retreat", "Manali", "Stays & Sanctuaries")
    trail = await provider.resolve_place_artwork("Jogini Waterfall Pine Trail", "Manali", "Nature & Trails")

    assert temple["url"] != cafe["url"]
    assert temple["url"] != stay["url"]
    assert cafe["url"] != stay["url"]
    assert trail["url"] != temple["url"]

    assert temple["semantic_category"] == "spiritual"
    assert cafe["semantic_category"] == "cafe"
    assert stay["semantic_category"] == "stay"
    assert trail["semantic_category"] == "waterfall"

@pytest.mark.asyncio
async def test_goa_semantic_isolation(provider):
    """
    GOA: beach -> beach, cafe -> cafe, stay -> stay, fort -> heritage
    """
    beach = await provider.resolve_place_artwork("Anjuna Beach Coastline", "Goa", "Nature & Trails")
    stay = await provider.resolve_place_artwork("Fontainhas Heritage Boutique Villa", "Goa", "Stays & Sanctuaries")
    fort = await provider.resolve_place_artwork("Fort Aguada & Lighthouse", "Goa", "Culture & Heritage")

    assert beach["url"] != stay["url"]
    assert beach["url"] != fort["url"]
    assert stay["url"] != fort["url"]

    assert beach["semantic_category"] == "beach"
    assert stay["semantic_category"] == "stay"
    assert fort["semantic_category"] == "heritage"

@pytest.mark.asyncio
async def test_jaipur_semantic_isolation(provider):
    """
    JAIPUR: palace -> heritage, fort -> heritage, stay -> stay, food -> food
    """
    hawa_mahal = await provider.resolve_place_artwork("Hawa Mahal Palace of Winds", "Jaipur", "Culture & Heritage")
    stay = await provider.resolve_place_artwork("Samode Haveli Royal Residence", "Jaipur", "Stays & Sanctuaries")
    food = await provider.resolve_place_artwork("Rawat Mishthan Bhandar Kachori", "Jaipur", "Local Food")

    assert hawa_mahal["url"] != stay["url"]
    assert hawa_mahal["url"] != food["url"]
    assert stay["url"] != food["url"]

    assert hawa_mahal["semantic_category"] == "heritage"
    assert stay["semantic_category"] == "stay"
    assert food["semantic_category"] == "food"

@pytest.mark.asyncio
async def test_varanasi_semantic_isolation(provider):
    """
    VARANASI: ghat -> spiritual, temple -> spiritual, stay -> stay, food -> food
    """
    ghat = await provider.resolve_place_artwork("Dashashwamedh Ghat Evening Maha Aarti", "Varanasi", "Culture & Heritage")
    temple = await provider.resolve_place_artwork("Kashi Vishwanath Golden Temple Corridor", "Varanasi", "Culture & Heritage")
    stay = await provider.resolve_place_artwork("BrijRama Palace River Heritage", "Varanasi", "Stays & Sanctuaries")
    food = await provider.resolve_place_artwork("Blue Lassi Traditional Shop", "Varanasi", "Local Food")

    assert ghat["url"] != temple["url"], "Dashashwamedh Ghat and Kashi Vishwanath must have distinct artwork!"
    assert ghat["url"] != stay["url"]
    assert temple["url"] != stay["url"]
    assert food["url"] != ghat["url"]

    assert stay["semantic_category"] == "stay"
    assert food["semantic_category"] == "food"

@pytest.mark.asyncio
async def test_all_curated_places_reverse_index_collisions(provider, db_session):
    """
    Reverse-index collision test across all curated places in the database.
    Fails if any two unrelated curated places share the same destination-specific asset.
    """
    places = db_session.query(Place).all()
    hotels = db_session.query(Hotel).all()
    
    asset_to_places = {}

    for p in places:
        dest_name = p.destination.name if p.destination else "India"
        cat = p.category or "Place"
        res = await provider.resolve_place_artwork(
            place_name=p.name,
            destination_name=dest_name,
            category=cat,
            existing_image_url=p.image_url
        )
        url = res["url"]
        ident = f"{dest_name}:{p.name} ({cat})"
        if url not in asset_to_places:
            asset_to_places[url] = []
        asset_to_places[url].append(ident)

    for h in hotels:
        dest_name = h.destination.name if h.destination else "India"
        res = await provider.resolve_place_artwork(
            place_name=h.name,
            destination_name=dest_name,
            category="Stays & Sanctuaries",
            existing_image_url=h.image_url
        )
        url = res["url"]
        ident = f"{dest_name}:{h.name} (Hotel)"
        if url not in asset_to_places:
            asset_to_places[url] = []
        asset_to_places[url].append(ident)

    collisions = []
    for url, items in asset_to_places.items():
        if len(items) > 1:
            # Check if this is an allowed category sharing or forbidden collision
            if "/places/universal/" in url:
                continue
            if "/categories/" in url:
                # Same category in same destination is permitted for fallback places
                continue
            collisions.append(f"Collision on exact asset {url}: {items}")

    assert len(collisions) == 0, f"Found exact asset collisions:\n" + "\n".join(collisions)

def test_all_registry_assets_exist_on_disk(provider):
    """
    Asserts every image asset referenced in EXACT_PLACE_REGISTRY and DESTINATION_CATEGORY_REGISTRY
    physically exists on disk under frontend/public/.
    """
    frontend_public = os.path.abspath(r"C:\Users\user\Desktop\Vanvas\frontend\public")

    # Check exact places
    for key, item in provider.PLACE_ARTWORK_REGISTRY.items():
        img_rel = item["image_url"].lstrip("/")
        full_path = os.path.join(frontend_public, img_rel)
        assert os.path.isfile(full_path), f"Asset for {key} missing on disk: {full_path}"
        assert os.path.getsize(full_path) > 500, f"Asset for {key} is empty or corrupted: {full_path}"

    # Check destination categories
    for dest, config in provider.DESTINATION_CATEGORY_REGISTRY.items():
        for theme, cat_url in config["categories"].items():
            img_rel = cat_url.lstrip("/")
            full_path = os.path.join(frontend_public, img_rel)
            assert os.path.isfile(full_path), f"Category asset {dest}:{theme} missing on disk: {full_path}"
            assert os.path.getsize(full_path) > 500, f"Category asset {dest}:{theme} is empty: {full_path}"

def test_no_exact_asset_hash_duplicates(provider):
    """
    Asserts all exact landmark assets have distinct SHA-256 hashes on disk.
    """
    frontend_public = os.path.abspath(r"C:\Users\user\Desktop\Vanvas\frontend\public")
    hash_to_keys = {}

    for key, item in provider.PLACE_ARTWORK_REGISTRY.items():
        img_rel = item["image_url"].lstrip("/")
        full_path = os.path.join(frontend_public, img_rel)
        with open(full_path, "rb") as f:
            h = hashlib.sha256(f.read()).hexdigest()
        if h not in hash_to_keys:
            hash_to_keys[h] = []
        hash_to_keys[h].append(key)

    duplicates = [f"Hash {h[:8]} shared by {keys}" for h, keys in hash_to_keys.items() if len(keys) > 1]
    assert len(duplicates) == 0, f"Exact place asset duplicate hashes found:\n" + "\n".join(duplicates)
