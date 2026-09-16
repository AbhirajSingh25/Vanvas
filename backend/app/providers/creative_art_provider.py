import io
import os
import re
import json
import base64
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, Optional

from app.providers.base import CreativeArtProvider

logger = logging.getLogger(__name__)

class CuratedCreativeArtProvider(CreativeArtProvider):
    """
    VANVAS Art System Provider implementing the specifications of VANVAS_ART_BIBLE.md.
    Provides structured prompt blueprints and curated asset resolution for travel intelligence.
    """

    SEEDED_ART_MAPPINGS: Dict[str, str] = {
        "manali": "/images/destinations/manali/illustration.jpg",
        "rishikesh": "/images/destinations/rishikesh/illustration.jpg",
        "kasol": "/images/destinations/kasol/illustration.jpg",
        "dharamshala": "/images/destinations/dharamshala/illustration.jpg",
        "mcleodganj": "/images/destinations/dharamshala/illustration.jpg",
        "goa": "/images/destinations/goa/illustration.jpg",
        "jaipur": "/images/destinations/jaipur/illustration.jpg",
        "udaipur": "/images/destinations/udaipur/illustration.jpg",
        "mussoorie": "/images/destinations/mussoorie/illustration.jpg",
        "spiti-valley": "/images/destinations/spiti-valley/illustration.jpg",
        "leh": "/images/destinations/leh/illustration.jpg",
        "varanasi": "/images/destinations/varanasi/illustration.jpg",
    }

    TERRAIN_FALLBACKS: Dict[str, str] = {
        "himalayan": "/images/destinations/fallbacks/himalayan.jpg",
        "high_desert": "/images/destinations/fallbacks/desert.jpg",
        "coastal": "/images/destinations/fallbacks/coastal.jpg",
        "desert": "/images/destinations/fallbacks/desert.jpg",
        "valley": "/images/destinations/fallbacks/valley.jpg",
        "river_ghat": "/images/destinations/fallbacks/valley.jpg",
        "tropical": "/images/destinations/fallbacks/coastal.jpg",
        "general": "/images/destinations/fallbacks/himalayan.jpg",
    }

    async def generate_destination_art(
        self,
        destination_name: str,
        slug: str,
        terrain_type: str,
        visual_role: str = "illustration",
        aspect_ratio: str = "wide",
        state: Optional[str] = None,
        elevation_meters: Optional[int] = None,
        auto_promote: bool = False
    ) -> Dict[str, Any]:
        norm_slug = slug.lower().replace("_", "-")
        is_curated = norm_slug in self.SEEDED_ART_MAPPINGS

        asset_url = self.SEEDED_ART_MAPPINGS.get(
            norm_slug,
            self.TERRAIN_FALLBACKS.get(terrain_type, self.TERRAIN_FALLBACKS["general"])
        )

        prompt_blueprint = (
            f"Premium contemporary Indian editorial travel illustration of {destination_name}, "
            f"terrain {terrain_type}, layered landscape composition, regional architecture silhouette, "
            f"atmospheric depth, sophisticated gouache and screen-print texture, elegant and mature, no text, no watermark."
        )

        return {
            "success": True,
            "provider": "curated",
            "model": "curated-vanvas-blueprint-v1",
            "destination": destination_name,
            "slug": norm_slug,
            "asset_url": asset_url,
            "public_url": asset_url,
            "is_curated": is_curated,
            "visual_role": visual_role,
            "terrain_type": terrain_type,
            "aspect_ratio": aspect_ratio,
            "prompt_blueprint": prompt_blueprint,
            "prompt_used": prompt_blueprint,
            "validation_status": "verified"
        }


class OpenAICreativeArtProvider(CreativeArtProvider):
    """
    OpenAI-backed VANVAS Creative Art Provider for programmatic destination illustration synthesis.
    Implements VANVAS_ART_BIBLE.md specifications:
    - Contemporary Indian editorial travel illustration
    - Destination-specific visual profiles and palettes
    - Strict negative constraints (zero text, zero watermarks, zero cliches)
    - Safe generation into reviewable sidecar assets (.generated.webp + .generated.json)
    - Multi-tier graceful fallback when unconfigured or failing
    """

    SEEDED_DESTINATION_PROFILES: Dict[str, Dict[str, Any]] = {
        "manali": {
            "topography": "Steep U-shaped Beas river valley, high snow-dusted Himalayan peaks in distant background",
            "vegetation": "Dense pine and deodar forests along valley slopes",
            "architecture": "Subtle Kath-Kuni wooden houses with slate roofs, stone bridge over river",
            "atmosphere": "Cool morning mist weaving between pine tiers, mountain road winding upward",
            "palette": "Deep forest green (#173B32), slate blue (#273D52), warm earth terracotta (#B65E3C), cool white mist (#D8DED5)"
        },
        "rishikesh": {
            "topography": "Emerald-turquoise Ganga cutting through low forested Himalayan foothills",
            "vegetation": "Lush subtropical foothill forests, cliffside greenery",
            "architecture": "Silhouette of suspension bridge (Ram Jhula style), riverside ghat stone steps",
            "atmosphere": "Early morning river stillness, serene water currents, soft mist over foothills",
            "palette": "River turquoise, deep foothill green (#0F2924), warm stone ochre, sunrise amber (#B49252)"
        },
        "kasol": {
            "topography": "Dramatic narrow river gorge, sheer vertical mountain walls, boulder-strewn Parvati river",
            "vegetation": "Towering deodar cedar canopies, riverside wild growth",
            "architecture": "Compact wooden mountain cabins nestled against forested slopes",
            "atmosphere": "Adventurous, moody, misty pine air, white-water river spray",
            "palette": "Slate grey, moss green (#173B32), cedar bark brown (#3F4F42), emerald water tint"
        },
        "dharamshala": {
            "topography": "Dramatic rising wall of the Dhauladhar range towering immediately above the ridge",
            "vegetation": "Cedar and rhododendron slopes",
            "architecture": "Tibetan-influenced multi-tiered monastery roofs, hillside settlement silhouette",
            "atmosphere": "Moody alpine clouds drifting across rocky crags, serene mountain elevation",
            "palette": "Dark pine green (#1B352E), slate blue, burgundy/crimson accents (#422828), snowy grey"
        },
        "mcleodganj": {
            "topography": "Hillside ridge settlement overlooking Kangra valley, rocky crags backdrop",
            "vegetation": "Himalayan cedar and pine forest",
            "architecture": "Tibetan monastery architecture, tiered slate roofs, hillside paths",
            "atmosphere": "Moody alpine clouds, tranquil mountain settlement",
            "palette": "Dark pine green (#1B352E), burgundy (#422828), brass gold (#B49252), mist slate"
        },
        "goa": {
            "topography": "Coastal curves, gentle laterite headlands, tidal river inlets, Arabian Sea horizon",
            "vegetation": "Natural coconut palm groves, dense coastal scrub, mangroves",
            "architecture": "Portuguese-influenced laterite stone villas, arched windows, quiet coastal roads",
            "atmosphere": "Warm tropical dusk, long golden sea shadows, laid-back coastal rhythm",
            "palette": "Terracotta red (#7B4D36), deep palm green (#173B32), warm ochre gold (#B49252), ocean navy"
        },
        "jaipur": {
            "topography": "Aravalli rocky ridge lines, arid plains, dry scrub terrain",
            "vegetation": "Sparse desert acacia, date palms in courtyards",
            "architecture": "Pink-sandstone fort ramparts, palace jharokha geometry, tiered battlements",
            "atmosphere": "Golden late-afternoon desert haze, strong architectural geometric shadows",
            "palette": "Muted terracotta pink (#7B4D36), desert sand (#9E4D2E), mustard gold (#B49252), dusty slate"
        },
        "udaipur": {
            "topography": "Shimmering Lake Pichola surrounded by rolling Aravalli hill silhouettes",
            "vegetation": "Lakeside palms, bougainvillea, lakeside gardens",
            "architecture": "Whitewashed marble and sandstone palace facades rising directly from the water, domed chhatris",
            "atmosphere": "Evening lake reflections, calm water ripples, regal quiet",
            "palette": "Ivory stone, lake blue (#273D52), sunset apricot, hill charcoal"
        },
        "mussoorie": {
            "topography": "High east-west mountain ridge overlooking the Doon Valley on one side and snow peaks on the other",
            "vegetation": "Oak, pine, and deodar forest ridge walks",
            "architecture": "Sloping colonial-era metal roofs, winding hill cart roads, ridge viewpoints",
            "atmosphere": "Famous winterline sunset glow, rolling monsoon clouds across valleys",
            "palette": "Deep hill green (#173B32), winterline amber-purple (#3F324D), misty navy, warm wood brown"
        },
        "spiti-valley": {
            "topography": "High-altitude stark cold desert, carved canyon walls, braided Spiti River basin",
            "vegetation": "Extreme sparse alpine scrub, barren geological strata",
            "architecture": "Whitewashed mud-and-timber monastery (Key Gompa style) perched atop rocky promontory",
            "atmosphere": "Vast crystalline high-altitude sky, extreme spatial scale, stark raw beauty",
            "palette": "Ochre clay (#4A3B32), stark grey (#273D52), sky cobalt, snow white, deep umber"
        },
        "leh": {
            "topography": "High plateau desert, dramatic barren mountain passes, snow-capped Karakoram and Zanskar ridges",
            "vegetation": "Willows and poplars in river oasis valleys only",
            "architecture": "Multi-tiered Tibetan royal palace silhouette (Leh Palace style), stupas along mountain ridges",
            "atmosphere": "High UV clear blue sky, sharp mountain silhouettes, sweeping high-altitude valley roads",
            "palette": "Sandstone gold (#3F3228), barren mountain brown (#1F3B52), intense sky blue, stark snow caps"
        },
        "varanasi": {
            "topography": "Sweeping crescent bend of the sacred Ganges River",
            "vegetation": "Distant green opposite bank, urban river edge",
            "architecture": "Dense historic stone ghat steps, multi-layered temple spires, old stone havelis",
            "atmosphere": "Dawn river mist, soft reflections of brass oil lamps, timeless river stillness",
            "palette": "River ochre (#0F2924), temple stone red (#7B4D36), dawn saffron (#B49252), river blue-grey"
        }
    }

    TERRAIN_DESCRIPTIONS: Dict[str, Dict[str, str]] = {
        "himalayan": {
            "landscape": "Layered Himalayan mountain ranges, steep pine-covered valley slopes, mountain stream",
            "architecture": "Traditional wooden and slate mountain homes, winding valley road",
            "palette": "Deep forest green, cool mist grey, mountain slate, warm wood accents"
        },
        "high_desert": {
            "landscape": "Stark high-altitude cold desert plateau, jagged barren peaks, braided river valley",
            "architecture": "Mud-brick monastery outpost, ancient stone chortens",
            "palette": "Ochre clay, raw umber, crystalline cobalt sky, snow white highlights"
        },
        "coastal": {
            "landscape": "Tropical coastline, tidal backwaters, natural coconut palm groves, sea horizon",
            "architecture": "Coastal terracotta-roofed villas, winding village road",
            "palette": "Warm terracotta, lush palm green, ocean blue, warm golden dusk"
        },
        "desert": {
            "landscape": "Arid desert landscape, rocky hill ridges, golden sand terrain",
            "architecture": "Sandstone fort battlements, arched jharokha balconies",
            "palette": "Terracotta sandstone, desert mustard gold, warm ochre, dusty evening sky"
        },
        "valley": {
            "landscape": "Rolling green tea hills and mist-laden valley slopes, lush plateau ridges",
            "architecture": "Colonial-style hill estate cottages, winding mountain pathway",
            "palette": "Emerald valley green, tea-leaf tones, soft morning mist, earthy terracotta"
        },
        "river_ghat": {
            "landscape": "Serene river corridor, ancient riverbank bend, tranquil waters",
            "architecture": "Stone riverside steps, temple silhouettes, historic stone dwellings",
            "palette": "River turquoise and blue-grey, warm sandstone ochre, dawn amber"
        },
        "tropical": {
            "landscape": "Lush tropical rainforest canopy, winding river inlet, coastal palms",
            "architecture": "Wooden verandas, coastal tile roofs",
            "palette": "Deep jungle green, monsoon cloud slate, laterite red, warm sunlight"
        },
        "general": {
            "landscape": "Layered scenic Indian landscape with expansive terrain depth and regional character",
            "architecture": "Subtle authentic regional architectural silhouettes",
            "palette": "Deep forest green, slate blue, terracotta earth, warm paper mist"
        }
    }

    ASPECT_RATIO_SIZES: Dict[str, str] = {
        "square": "1024x1024",
        "tall": "1024x1792",
        "wide": "1792x1024",
        "hero": "1792x1024"
    }

    NEGATIVE_CONSTRAINTS: str = (
        "Strict negative constraints: no text, no words, no letters, no numbers, no typography, "
        "no watermark, no logo, no fake signs or billboards, no captions, no slogans, no inspirational quotes, "
        "no passport stamps, no decorative travel icons, no generic map pins, no generic backpacks, "
        "no generic airplanes, no parchment borders, no fake handwritten notes, no tourist brochure aesthetic, "
        "no children's book style, no cartoon style, no anime style, no generic vector art, "
        "no geometric blobs, no hyper-saturated neon fantasy landscapes, no inaccurate fantasy architecture, "
        "no meaningless cultural stereotypes."
    )

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: str = "gpt-image-2",
        output_dir: str = "frontend/public/images/destinations",
        image_format: str = "webp"
    ):
        self.api_key = api_key or os.getenv("OPENAI_API_KEY", "")
        self.model = model or os.getenv("IMAGE_GENERATION_MODEL", "gpt-image-2")
        self.output_dir = output_dir or os.getenv("IMAGE_OUTPUT_DIR", "frontend/public/images/destinations")
        self.image_format = (image_format or os.getenv("IMAGE_FORMAT", "webp")).lower()
        self._curated_provider = CuratedCreativeArtProvider()

    def _resolve_output_directory(self) -> Path:
        """
        Safely resolves the destinations output directory across various working directory setups.
        """
        raw_path = Path(self.output_dir)
        if raw_path.is_absolute() and raw_path.exists():
            return raw_path
        
        # Check relative to cwd
        if raw_path.exists():
            return raw_path.resolve()

        # Check relative to workspace parent (e.g. cwd is backend)
        parent_dir = Path.cwd().parent / self.output_dir
        if parent_dir.exists():
            return parent_dir.resolve()

        # Check relative to repo root based on file structure
        repo_root = Path(__file__).resolve().parent.parent.parent.parent
        repo_dir = repo_root / self.output_dir
        if repo_dir.exists():
            return repo_dir.resolve()

        # Default: create relative to workspace parent or cwd
        target = parent_dir if Path.cwd().name == "backend" else Path.cwd() / self.output_dir
        target.mkdir(parents=True, exist_ok=True)
        return target.resolve()

    def _sanitize_slug(self, slug: str) -> str:
        """
        Sanitizes slug string to prevent path traversal and malformed filenames.
        """
        if not slug:
            return "destination"
        clean = re.sub(r"[^a-zA-Z0-9_-]", "", slug.lower().replace(" ", "-")).strip("-")
        return clean if clean else "destination"

    def construct_vanvas_prompt(
        self,
        destination_name: str,
        slug: str,
        terrain_type: str,
        visual_role: str = "illustration",
        aspect_ratio: str = "wide",
        state: Optional[str] = None,
        elevation_meters: Optional[int] = None
    ) -> str:
        """
        Constructs rich, contemporary Indian editorial travel illustration prompts strictly conforming to VANVAS_ART_BIBLE.md.
        """
        norm_slug = self._sanitize_slug(slug)
        profile = self.SEEDED_DESTINATION_PROFILES.get(norm_slug)

        aspect_guidance = {
            "wide": "Wide cinematic landscape vista, horizontal editorial magazine double-page spread composition.",
            "hero": "Sweeping cinematic panoramic vista, expansive atmospheric horizon.",
            "tall": "Tall vertical travel journal poster framing, soaring vertical perspective.",
            "square": "Balanced square editorial card framing, harmonious central focus."
        }.get(aspect_ratio, "Wide cinematic landscape vista.")

        if profile:
            dest_context = (
                f"{destination_name} in India. "
                f"Topography: {profile['topography']}. "
                f"Vegetation: {profile['vegetation']}. "
                f"Architecture: {profile['architecture']}. "
                f"Atmosphere: {profile['atmosphere']}. "
                f"Color palette: {profile['palette']}."
            )
        else:
            t_desc = self.TERRAIN_DESCRIPTIONS.get(terrain_type, self.TERRAIN_DESCRIPTIONS["general"])
            state_info = f" in {state}" if state else " in India"
            elev_info = f" at {elevation_meters}m elevation" if elevation_meters else ""
            dest_context = (
                f"{destination_name}{state_info}{elev_info}, terrain character {terrain_type}. "
                f"Landscape: {t_desc['landscape']}. "
                f"Architecture: {t_desc['architecture']}. "
                f"Color palette: {t_desc['palette']}."
            )

        prompt = (
            f"Contemporary Indian editorial travel illustration of {dest_context} "
            f"Art Direction: High-end travel publication art direction in the tradition of sophisticated printmaking and vintage railway posters. "
            f"Layered environmental landscape composition with mature spatial depth, tactile paper grain texture, subtle gouache and screen-print layering, "
            f"crisp clean ink edges, elegant negative space, calm atmospheric lighting. {aspect_guidance} {self.NEGATIVE_CONSTRAINTS}"
        )
        return prompt

    async def generate_destination_art(
        self,
        destination_name: str,
        slug: str,
        terrain_type: str,
        visual_role: str = "illustration",
        aspect_ratio: str = "wide",
        state: Optional[str] = None,
        elevation_meters: Optional[int] = None,
        auto_promote: bool = False
    ) -> Dict[str, Any]:
        """
        Generates destination artwork using OpenAI Image Generation API.
        If unconfigured or API call fails, falls back gracefully to curated assets without crashing.
        """
        safe_slug = self._sanitize_slug(slug)
        curated_info = await self._curated_provider.generate_destination_art(
            destination_name=destination_name,
            slug=safe_slug,
            terrain_type=terrain_type,
            visual_role=visual_role,
            aspect_ratio=aspect_ratio,
            state=state,
            elevation_meters=elevation_meters,
            auto_promote=auto_promote
        )
        fallback_url = curated_info.get("asset_url", "/images/destinations/fallbacks/himalayan.jpg")

        prompt = self.construct_vanvas_prompt(
            destination_name=destination_name,
            slug=safe_slug,
            terrain_type=terrain_type,
            visual_role=visual_role,
            aspect_ratio=aspect_ratio,
            state=state,
            elevation_meters=elevation_meters
        )

        # 1. Graceful check for API key
        if not self.api_key or not self.api_key.strip():
            logger.warning("OPENAI_API_KEY is not configured. Falling back to curated asset.")
            return {
                "success": False,
                "provider": "openai",
                "model": self.model,
                "destination": destination_name,
                "slug": safe_slug,
                "visual_role": visual_role,
                "terrain_type": terrain_type,
                "asset_url": fallback_url,
                "public_url": fallback_url,
                "error": "OPENAI_API_KEY is not configured",
                "validation_status": "fallback",
                "is_curated": curated_info.get("is_curated", False),
                "aspect_ratio": aspect_ratio,
                "prompt_blueprint": prompt,
                "prompt_used": prompt
            }

        # 2. Call OpenAI Images API
        size = self.ASPECT_RATIO_SIZES.get(aspect_ratio, "1792x1024")
        try:
            from openai import AsyncOpenAI
            from PIL import Image

            client = AsyncOpenAI(api_key=self.api_key)
            
            logger.info(f"Invoking OpenAI Image Generation for {destination_name} (slug: {safe_slug}, model: {self.model}, size: {size})...")
            
            # Request image generation
            try:
                response = await client.images.generate(
                    model=self.model,
                    prompt=prompt,
                    n=1,
                    size=size,
                    quality="standard"
                )
            except Exception as req_err:
                # If quality parameter is rejected by specific model, retry with size and model only
                if "quality" in str(req_err).lower() or isinstance(req_err, TypeError):
                    response = await client.images.generate(
                        model=self.model,
                        prompt=prompt,
                        n=1,
                        size=size
                    )
                else:
                    raise req_err

            if not response or not response.data or len(response.data) == 0:
                raise ValueError("Empty image data returned from OpenAI API")

            image_item = response.data[0]
            raw_image_bytes = None

            if hasattr(image_item, "b64_json") and image_item.b64_json:
                raw_image_bytes = base64.b64decode(image_item.b64_json)
            elif hasattr(image_item, "url") and image_item.url:
                import httpx
                async with httpx.AsyncClient(timeout=30.0) as http_client:
                    img_resp = await http_client.get(image_item.url)
                    img_resp.raise_for_status()
                    raw_image_bytes = img_resp.content

            if not raw_image_bytes:
                raise ValueError("Could not extract image bytes from OpenAI API response")

            # 3. Image validation & format conversion with Pillow
            img = Image.open(io.BytesIO(raw_image_bytes))
            img_format = self.image_format.lower()
            
            # Save target directories
            dest_dir = self._resolve_output_directory() / safe_slug
            dest_dir.mkdir(parents=True, exist_ok=True)

            out_filename = f"{visual_role}.generated.{img_format}"
            out_file_path = dest_dir / out_filename

            # Save processed image
            if img_format == "webp":
                if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
                    img.save(out_file_path, format="WEBP", quality=90, method=6)
                else:
                    img.convert("RGB").save(out_file_path, format="WEBP", quality=90, method=6)
            elif img_format in ("jpg", "jpeg"):
                img.convert("RGB").save(out_file_path, format="JPEG", quality=92)
            else:
                img.save(out_file_path)

            # If auto_promote is enabled, also copy to primary production path
            if auto_promote:
                promo_filename = f"{visual_role}.{img_format}"
                promo_path = dest_dir / promo_filename
                if img_format == "webp":
                    img.convert("RGB").save(promo_path, format="WEBP", quality=90)
                else:
                    img.convert("RGB").save(promo_path, format="JPEG", quality=92)
                logger.info(f"Artwork auto-promoted to primary asset: {promo_path}")

            # 4. Save JSON metadata sidecar
            meta_filename = f"{visual_role}.generated.json"
            meta_file_path = dest_dir / meta_filename
            metadata = {
                "destination": destination_name,
                "slug": safe_slug,
                "provider": "openai",
                "model": self.model,
                "generation_timestamp": datetime.now(timezone.utc).isoformat(),
                "visual_role": visual_role,
                "terrain_type": terrain_type,
                "aspect_ratio": aspect_ratio,
                "dimensions": [img.width, img.height],
                "format": img_format,
                "output_filename": out_filename,
                "public_url": f"/images/destinations/{safe_slug}/{out_filename}",
                "prompt_version": "1.0",
                "prompt_used": prompt
            }
            with open(meta_file_path, "w", encoding="utf-8") as f:
                json.dump(metadata, f, indent=2)

            public_url = f"/images/destinations/{safe_slug}/{out_filename}"

            logger.info(f"Successfully generated VANVAS artwork for {destination_name}: {out_file_path}")

            return {
                "success": True,
                "provider": "openai",
                "model": self.model,
                "destination": destination_name,
                "slug": safe_slug,
                "visual_role": visual_role,
                "terrain_type": terrain_type,
                "output_path": str(out_file_path),
                "public_url": public_url,
                "asset_url": public_url,
                "metadata_path": str(meta_file_path),
                "prompt_used": prompt,
                "aspect_ratio": aspect_ratio,
                "validation_status": "verified",
                "is_curated": False
            }

        except Exception as e:
            logger.error(f"OpenAI CreativeArtProvider error for {destination_name}: {str(e)}", exc_info=True)
            return {
                "success": False,
                "provider": "openai",
                "model": self.model,
                "destination": destination_name,
                "slug": safe_slug,
                "visual_role": visual_role,
                "terrain_type": terrain_type,
                "asset_url": fallback_url,
                "public_url": fallback_url,
                "error": str(e),
                "validation_status": "fallback",
                "is_curated": curated_info.get("is_curated", False),
                "aspect_ratio": aspect_ratio,
                "prompt_blueprint": prompt,
                "prompt_used": prompt
            }
