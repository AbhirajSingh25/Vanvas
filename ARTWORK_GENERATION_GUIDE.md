# VANVAS — Editorial Artwork Generation & Visual Bible Guide

## 1. Design Philosophy & VANVAS Art Bible Standards

VANVAS editorial artwork is governed strictly by `VANVAS_ART_BIBLE.md`. The visual identity reflects:
- **Style:** Contemporary Indian editorial travel illustration, evocative gouache, screen-print layered textures, and atmospheric depth.
- **Color Palette:** Deep Forest Green (`#173B32`), Warm Ivory/Parchment (`#FAF7F0`), Antique Brass (`#B49252`), Muted Terracotta (`#B65E3C`), and Mist Slate (`#D8DED5`).
- **Strict Negative Constraints:** Zero text, zero typography, zero watermarks, zero logos, zero passport stamps, zero generic cartoon/anime graphics, zero clichés (backpacks, floating planes, fake handwriting).

---

## 2. Configuration & Environment Variables

| Variable | Description | Default | Allowed Values |
| :--- | :--- | :---: | :--- |
| `OPENAI_API_KEY` | OpenAI API key for programmatic illustration synthesis | `""` | Valid OpenAI API Key |
| `IMAGE_GENERATION_MODEL` | Synthesis model engine | `gpt-image-2` | `gpt-image-2`, `dall-e-3` |
| `IMAGE_OUTPUT_DIR` | Local disk output directory | `frontend/public/images/destinations` | File system path |
| `IMAGE_FORMAT` | Generated image format | `webp` | `webp`, `jpeg`, `png` |
| `STORAGE_PROVIDER` | Durable cloud media persistence provider | `auto` | `supabase`, `cloudinary`, `s3`, `local` |
| `STORAGE_UPLOAD_DIR` | Fallback local durable storage directory | `data/uploads` | File system path |

---

## 3. Architecture & Provider Hierarchy

### 3.1 CuratedCreativeArtProvider
The primary offline/deterministic provider. When OpenAI credentials are not provided or a destination is already curated:
- Maps canonical destinations to pre-approved high-resolution illustrations (`SEEDED_ART_MAPPINGS`).
- Maps unknown terrains to verified terrain fallbacks (`himalayan`, `coastal`, `desert`, `valley`).
- Marks assets with `"visual_kind": "editorial_illustration"`, `"is_illustrative": True`.

### 3.2 OpenAICreativeArtProvider
The programmatic synthesis provider:
1. **Prompt Construction:** Builds structured blueprints specifying topography, vegetation, regional architecture, atmospheric mood, and palette tokens:
   ```python
   prompt = (
       f"Contemporary Indian editorial travel illustration of {destination_name}, {state_str}. "
       f"Topography: {profile['topography']}. Vegetation: {profile['vegetation']}. "
       f"Architecture: {profile['architecture']}. Atmosphere: {profile['atmosphere']}. "
       f"Color palette: {profile['palette']}. "
       f"{NEGATIVE_CONSTRAINTS}"
   )
   ```
2. **Generation & Optimization:** Downloads raw bytes, resizes/converts to high-quality WebP using Pillow (`quality=90, method=6`).
3. **Sidecar Metadata Retention:** Saves `{visual_role}.generated.json` recording the exact generation parameters, prompt, timestamp, dimensions, and model.
4. **Auto-Promotion:** When `auto_promote=True` is passed, the generated asset is simultaneously promoted to the primary production asset path.

---

## 4. Triggering Artwork Generation

### Via Python Script / Internal Service
```python
from app.providers.creative_art_provider import OpenAICreativeArtProvider

provider = OpenAICreativeArtProvider()
result = await provider.generate_destination_art(
    destination_name="Spiti Valley",
    slug="spiti-valley",
    terrain_type="high_desert",
    visual_role="illustration",
    aspect_ratio="wide",
    auto_promote=False
)

print(result["public_url"])      # e.g., /images/destinations/spiti-valley/illustration.generated.webp
print(result["metadata_path"])   # e.g., .../illustration.generated.json
```

### Via API Endpoint
The administrative artwork generation endpoint allows privileged generation:
- `POST /api/v1/destinations/{slug}/generate-art`
- Body:
  ```json
  {
    "terrain_type": "high_desert",
    "aspect_ratio": "wide",
    "auto_promote": true
  }
  ```

---

## 5. Visual Provenance Transparency
Every asset served through the VANVAS API and UI includes its provenance badge:
- **Verified Photo:** Real photograph of the physical landmark.
- **Editorial Illustration:** Hand-crafted or synthesized editorial travel illustration.
- **Live Photo:** Retrieved dynamically from live verified POI providers.
- **Editorial Art:** Category or regional visual backdrop.
No synthetic or generic image is ever presented as a verified photograph.
