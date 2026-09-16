import os
import io
import json
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from PIL import Image

from app.core.config import settings
from app.providers.provider_factory import ProviderFactory
from app.providers.creative_art_provider import CuratedCreativeArtProvider, OpenAICreativeArtProvider

@pytest.mark.asyncio
async def test_provider_factory_selection():
    # 1. Default / curated provider
    with patch.object(settings, "IMAGE_PROVIDER", "curated"):
        provider = ProviderFactory.get_creative_art_provider()
        assert isinstance(provider, CuratedCreativeArtProvider)

    # 2. OpenAI provider selection
    with patch.object(settings, "IMAGE_PROVIDER", "openai"):
        provider = ProviderFactory.get_creative_art_provider()
        assert isinstance(provider, OpenAICreativeArtProvider)

@pytest.mark.asyncio
async def test_curated_creative_art_provider():
    provider = CuratedCreativeArtProvider()
    
    # Test seeded destination (Manali)
    res_manali = await provider.generate_destination_art(
        destination_name="Manali",
        slug="manali",
        terrain_type="himalayan",
        visual_role="illustration",
        aspect_ratio="wide"
    )
    assert res_manali["success"] is True
    assert res_manali["is_curated"] is True
    assert "manali" in res_manali["asset_url"]
    assert "no text" in res_manali["prompt_blueprint"]

    # Test unseeded destination (Munnar)
    res_munnar = await provider.generate_destination_art(
        destination_name="Munnar",
        slug="munnar",
        terrain_type="valley",
        visual_role="illustration",
        aspect_ratio="wide"
    )
    assert res_munnar["success"] is True
    assert res_munnar["is_curated"] is False
    assert "valley" in res_munnar["asset_url"]

@pytest.mark.asyncio
async def test_openai_missing_api_key_graceful_fallback():
    # Provider with empty API key
    provider = OpenAICreativeArtProvider(api_key="")
    
    res = await provider.generate_destination_art(
        destination_name="Manali",
        slug="manali",
        terrain_type="himalayan",
        visual_role="illustration",
        aspect_ratio="wide"
    )
    
    assert res["success"] is False
    assert res["validation_status"] == "fallback"
    assert "OPENAI_API_KEY is not configured" in res["error"]
    assert "manali" in res["asset_url"]
    assert "no text" in res["prompt_blueprint"].lower()

def test_prompt_construction_seeded_and_unseeded():
    provider = OpenAICreativeArtProvider()
    
    # Seeded destination prompt
    manali_prompt = provider.construct_vanvas_prompt(
        destination_name="Manali",
        slug="manali",
        terrain_type="himalayan",
        visual_role="illustration",
        aspect_ratio="wide"
    )
    assert "Beas river valley" in manali_prompt
    assert "Kath-Kuni" in manali_prompt
    assert "no text" in manali_prompt.lower()
    assert "no watermark" in manali_prompt.lower()
    assert "Wide cinematic landscape vista" in manali_prompt

    # Unseeded destination prompt
    munnar_prompt = provider.construct_vanvas_prompt(
        destination_name="Munnar",
        slug="munnar",
        terrain_type="valley",
        visual_role="illustration",
        aspect_ratio="tall",
        state="Kerala",
        elevation_meters=1600
    )
    assert "Munnar in Kerala" in munnar_prompt
    assert "1600m elevation" in munnar_prompt
    assert "tea hills" in munnar_prompt.lower()
    assert "no text" in munnar_prompt.lower()
    assert "Tall vertical" in munnar_prompt

def test_slug_sanitization():
    provider = OpenAICreativeArtProvider()
    assert provider._sanitize_slug("manali") == "manali"
    assert provider._sanitize_slug("Spiti Valley") == "spiti-valley"
    assert provider._sanitize_slug("../../../etc/passwd") == "etcpasswd"
    assert provider._sanitize_slug("manali/../../dangerous") == "manalidangerous"
    assert provider._sanitize_slug("@!#$%^&*()") == "destination"

@pytest.mark.asyncio
async def test_openai_mock_generation(tmp_path):
    # Create a synthetic 100x100 RGB image for testing
    img = Image.new("RGB", (100, 100), color=(23, 59, 50))
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    raw_bytes = buffer.getvalue()

    # Mock OpenAI client response
    mock_data_item = MagicMock()
    mock_data_item.b64_json = None
    mock_data_item.url = "http://mock-openai/image.png"

    mock_response = MagicMock()
    mock_response.data = [mock_data_item]

    provider = OpenAICreativeArtProvider(
        api_key="sk-mock-key-for-unit-test",
        output_dir=str(tmp_path / "images" / "destinations"),
        image_format="webp"
    )

    with patch("openai.AsyncOpenAI") as mock_openai_cls, \
         patch("httpx.AsyncClient.get") as mock_http_get:
        
        mock_client_instance = AsyncMock()
        mock_client_instance.images.generate = AsyncMock(return_value=mock_response)
        mock_openai_cls.return_value = mock_client_instance

        mock_http_resp = MagicMock()
        mock_http_resp.content = raw_bytes
        mock_http_resp.raise_for_status = MagicMock()
        mock_http_get.return_value = mock_http_resp

        result = await provider.generate_destination_art(
            destination_name="Manali",
            slug="manali",
            terrain_type="himalayan",
            visual_role="illustration",
            aspect_ratio="wide",
            auto_promote=True
        )

        assert result["success"] is True
        assert result["validation_status"] == "verified"
        assert result["is_curated"] is False
        assert result["public_url"] == "/images/destinations/manali/illustration.generated.webp"
        
        # Verify file creation
        out_file = tmp_path / "images" / "destinations" / "manali" / "illustration.generated.webp"
        assert out_file.exists()

        # Verify auto-promotion file creation
        promo_file = tmp_path / "images" / "destinations" / "manali" / "illustration.webp"
        assert promo_file.exists()

        # Verify metadata sidecar JSON
        meta_file = tmp_path / "images" / "destinations" / "manali" / "illustration.generated.json"
        assert meta_file.exists()
        with open(meta_file, "r", encoding="utf-8") as f:
            meta = json.load(f)
            assert meta["destination"] == "Manali"
            assert meta["slug"] == "manali"
            assert meta["provider"] == "openai"
            assert meta["format"] == "webp"
            assert "prompt_used" in meta

@pytest.fixture
def test_app_client():
    from fastapi.testclient import TestClient
    from app.main import app
    from app.api.deps import get_current_user, get_current_admin
    from app.models.models import User

    mock_admin = User(
        id="admin-test-id",
        email="admin@vanvas.club",
        full_name="Vanvas Admin",
        role="admin"
    )

    app.dependency_overrides[get_current_user] = lambda: mock_admin
    app.dependency_overrides[get_current_admin] = lambda: mock_admin
    client = TestClient(app)
    yield client
    app.dependency_overrides.pop(get_current_user, None)
    app.dependency_overrides.pop(get_current_admin, None)

def test_admin_api_validation(test_app_client):
    client = test_app_client
    # 1. Test invalid visual role
    bad_role_payload = {
        "destination_name": "Manali",
        "slug": "manali",
        "terrain_type": "himalayan",
        "visual_role": "invalid_role",
        "aspect_ratio": "wide"
    }
    resp = client.post("/api/v1/admin/creative-art/generate", json=bad_role_payload)
    assert resp.status_code == 400
    assert "Invalid visual_role" in resp.json()["detail"]

    # 2. Test invalid terrain type
    bad_terrain_payload = {
        "destination_name": "Manali",
        "slug": "manali",
        "terrain_type": "volcano",
        "visual_role": "illustration",
        "aspect_ratio": "wide"
    }
    resp = client.post("/api/v1/admin/creative-art/generate", json=bad_terrain_payload)
    assert resp.status_code == 400
    assert "Invalid terrain_type" in resp.json()["detail"]

    # 3. Test path traversal attempt
    path_traversal_payload = {
        "destination_name": "Manali",
        "slug": "../../../secret",
        "terrain_type": "himalayan",
        "visual_role": "illustration",
        "aspect_ratio": "wide"
    }
    resp = client.post("/api/v1/admin/creative-art/generate", json=path_traversal_payload)
    assert resp.status_code == 400
    assert "Path traversal" in resp.json()["detail"]

    # 4. Test valid payload (curated fallback without API key)
    valid_payload = {
        "destination_name": "Manali",
        "slug": "manali",
        "terrain_type": "himalayan",
        "visual_role": "illustration",
        "aspect_ratio": "wide"
    }
    resp = client.post("/api/v1/admin/creative-art/generate", json=valid_payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["destination"] == "Manali"
    assert data["slug"] == "manali"
    assert "asset_url" in data

@pytest.mark.asyncio
async def test_real_openai_integration_opt_in():
    # Only run when explicitly opted in via RUN_IMAGE_PROVIDER_INTEGRATION=1 and OPENAI_API_KEY is set
    if os.getenv("RUN_IMAGE_PROVIDER_INTEGRATION") != "1" or not os.getenv("OPENAI_API_KEY"):
        pytest.skip("Skipping real OpenAI integration test (opt-in with RUN_IMAGE_PROVIDER_INTEGRATION=1 and OPENAI_API_KEY)")
    
    provider = ProviderFactory.get_creative_art_provider()
    res = await provider.generate_destination_art(
        destination_name="Manali",
        slug="manali",
        terrain_type="himalayan",
        visual_role="illustration",
        aspect_ratio="wide"
    )
    assert res["success"] is True
    assert res["output_path"] is not None
    assert os.path.exists(res["output_path"])
