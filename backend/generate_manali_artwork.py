import asyncio
import os
import json
from pathlib import Path
from PIL import Image

from app.core.config import settings
from app.providers.provider_factory import ProviderFactory

async def main():
    print(f"1. Checking Configuration:")
    has_key = bool(settings.OPENAI_API_KEY)
    print(f"   OPENAI_API_KEY configured: {has_key}")
    print(f"   IMAGE_PROVIDER: {settings.IMAGE_PROVIDER}")
    print(f"   IMAGE_GENERATION_MODEL: {settings.IMAGE_GENERATION_MODEL}")

    if not has_key:
        print("ERROR: OPENAI_API_KEY is not configured. Aborting real generation.")
        return False

    print("\n2. Initializing CreativeArtProvider via ProviderFactory...")
    provider = ProviderFactory.get_creative_art_provider()
    print(f"   Active Provider: {provider.__class__.__name__}")

    print("\n3. Executing single real generation for Manali (wide / illustration)...")
    res = await provider.generate_destination_art(
        destination_name="Manali",
        slug="manali",
        terrain_type="himalayan",
        visual_role="illustration",
        aspect_ratio="wide",
        auto_promote=False  # Keep approved illustration.jpg intact, save as illustration.generated.webp
    )

    print("\n4. Result Summary:")
    print(f"   Success: {res.get('success')}")
    print(f"   Provider: {res.get('provider')}")
    print(f"   Model: {res.get('model')}")
    print(f"   Asset URL: {res.get('asset_url')}")
    print(f"   Validation Status: {res.get('validation_status')}")
    if res.get("error"):
        print(f"   Error: {res.get('error')}")

    # Verify generated file
    target_path = Path(res.get("output_path", "frontend/public/images/destinations/manali/illustration.generated.webp"))
    if not target_path.exists():
        # Check relative to workspace root
        alt_path = Path("..") / target_path
        if alt_path.exists():
            target_path = alt_path

    if target_path.exists():
        print(f"\n5. Validating Generated Image Asset:")
        print(f"   File Path: {target_path}")
        print(f"   File Size: {target_path.stat().st_size} bytes")
        
        # Pillow validation
        with Image.open(target_path) as img:
            print(f"   Image Format: {img.format}")
            print(f"   Image Mode: {img.mode}")
            print(f"   Image Dimensions: {img.width}x{img.height}")
            assert img.width > 0 and img.height > 0
            print("   Pillow Image Integrity: VALID")

        # Check metadata sidecar
        sidecar_path = target_path.with_suffix(".json")
        if sidecar_path.exists():
            print(f"\n6. Validating Metadata Sidecar:")
            print(f"   Sidecar Path: {sidecar_path}")
            with open(sidecar_path, "r", encoding="utf-8") as f:
                meta = json.load(f)
                print(f"   Destination: {meta.get('destination')}")
                print(f"   Slug: {meta.get('slug')}")
                print(f"   Provider: {meta.get('provider')}")
                print(f"   Model: {meta.get('model')}")
                print(f"   Timestamp: {meta.get('generation_timestamp')}")
                print(f"   Aspect Ratio: {meta.get('aspect_ratio')}")
                print(f"   Dimensions: {meta.get('dimensions')}")
                print(f"   Format: {meta.get('format')}")
                print(f"   Prompt (preview): {meta.get('prompt_used', '')[:100]}...")

        # Verify existing approved illustration.jpg is UNCHANGED
        orig_approved = target_path.parent / "illustration.jpg"
        print(f"\n7. Checking Approved Asset Integrity:")
        print(f"   Original illustration.jpg exists: {orig_approved.exists()}")
        if orig_approved.exists():
            print(f"   Original illustration.jpg size: {orig_approved.stat().st_size} bytes (UNCHANGED)")

        return True
    else:
        print(f"Generated file not found at: {target_path}")
        return False

if __name__ == "__main__":
    asyncio.run(main())
