import os
import sys
import re
import json
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
ROOT_DIR = BACKEND_DIR.parent
sys.path.insert(0, str(BACKEND_DIR))

from app.database.session import SessionLocal
from app.models.models import Destination, Place, Hotel

RESOLVER_PATH = ROOT_DIR / "frontend" / "lib" / "placeVisualResolver.ts"

CANONICAL_SLUGS = [
    'manali', 'rishikesh', 'kasol', 'dharamshala', 'goa', 'jaipur', 
    'mussoorie', 'udaipur', 'munnar', 'varanasi', 'leh', 'spiti', 
    'tungnath-chandrashila', 'kainchi-dham', 'murthal', 'agra', 
    'mathura-vrindavan', 'neemrana', 'damdama-sohna', 'alwar-siliserh', 
    'sariska-bhangarh', 'dehradun', 'chandigarh', 'morni-hills', 
    'lansdowne', 'jaisalmer'
]

def slugify(s: str) -> str:
    s = s.lower().strip()
    s = re.sub(r"[^\w\s-]", "", s)
    s = re.sub(r"[\s_-]+", "-", s)
    return s.strip("-")

def get_theme_from_place(name: str, cat: str) -> str:
    n = name.lower()
    c = (cat or "").lower()
    if any(k in n for k in ["temple", "ashram", "mandir", "kund", "aarti", "ghat", "dham", "gurudwara", "math"]):
        return "spiritual"
    if any(k in n for k in ["monastery", "gompa", "stupa"]):
        return "monastery"
    if any(k in n for k in ["church", "cathedral", "basilica"]):
        return "church"
    if any(k in n for k in ["cafe", "café", "bakery", "coffee", "bistro", "roastery"]):
        return "cafe"
    if any(k in n for k in ["dhaba", "restaurant", "dining", "lassi", "sweets", "food", "kitchen"]):
        return "food"
    if any(k in n for k in ["fort", "palace", "haveli", "museum", "ruins", "memorial", "tomb", "archaeological"]):
        return "heritage"
    if any(k in n for k in ["waterfall", "falls"]):
        return "waterfall"
    if any(k in n for k in ["lake", "taal", "tso", "dam", "pichola"]):
        return "lake"
    if any(k in n for k in ["beach", "cove", "coast"]):
        return "beach"
    if any(k in n for k in ["viewpoint", "crest", "top", "sunset point", "peak", "summit", "pass"]):
        return "viewpoint"
    if any(k in n for k in ["trail", "meadow", "forest", "park", "garden", "wildlife", "safari", "sanctuary", "nature"]):
        return "nature"
    if any(k in n for k in ["market", "bazaar", "mall", "chowk", "plaza"]):
        return "shopping"
    return "nature"

def sync_resolver():
    db = SessionLocal()
    
    # 1. Build DESTINATION_CATEGORY_REGISTRY
    dest_cat_entries = []
    for slug in CANONICAL_SLUGS:
        d = db.query(Destination).filter(Destination.slug == slug).first()
        hero_img = d.hero_image if (d and d.hero_image) else f"/images/destinations/{slug}/hero.jpg"
        
        entry = f"""  "{slug}": {{
    generic: "{hero_img}",
    categories: {{
      stay: "/images/places/{slug}/categories/stay.webp",
      cafe: "/images/places/{slug}/categories/cafe.webp",
      food: "/images/places/{slug}/categories/food.webp",
      nature: "/images/places/{slug}/categories/nature.webp",
      trail: "/images/places/{slug}/categories/nature.webp",
      heritage: "/images/places/{slug}/categories/heritage.webp",
      spiritual: "/images/places/{slug}/categories/spiritual.webp",
      viewpoint: "/images/places/{slug}/categories/viewpoint.webp",
      waterfall: "/images/places/{slug}/categories/waterfall.webp",
      lake: "/images/places/{slug}/categories/lake.webp",
      monastery: "/images/places/{slug}/categories/monastery.webp",
      church: "/images/places/{slug}/categories/church.webp",
      beach: "/images/places/{slug}/categories/beach.webp",
      shopping: "/images/places/{slug}/categories/cafe.webp",
      transport: "/images/nearby/transport/transport.webp"
    }}
  }}"""
        dest_cat_entries.append(entry)
        
    dest_registry_code = "export const DESTINATION_CATEGORY_REGISTRY: Record<\n  string,\n  {\n    generic: string;\n    categories: Partial<Record<SemanticTheme, string>>;\n  }\n> = {\n" + ",\n".join(dest_cat_entries) + "\n};\n"
    
    # 2. Build EXACT_PLACE_REGISTRY with all 208 places
    exact_place_entries = []
    
    # Add manual landmark presets first
    preset_landmarks = [
        ('delhi:qutub-minar', '/images/places/delhi/qutub-minar.jpg', 'Qutub Minar 73m minaret in Mehrauli', 'Culture & Heritage', 'heritage', ['qutub-minar', 'qutub']),
        ('delhi:red-fort', '/images/places/delhi/red-fort.jpg', 'Historic red sandstone fortress in Old Delhi', 'Culture & Heritage', 'heritage', ['red-fort', 'lal-qila']),
        ('delhi:india-gate', '/images/places/delhi/india-gate.jpg', 'India Gate 42m war memorial arch', 'Culture & Heritage', 'heritage', ['india-gate']),
        ('delhi:lotus-temple', '/images/places/delhi/lotus-temple.jpg', 'Lotus Temple Bahai House of Worship', 'Culture & Heritage', 'spiritual', ['lotus-temple']),
        ('delhi:humayuns-tomb', '/images/places/delhi/humayuns-tomb.webp', "Humayun's Tomb Mughal architecture grand mausoleum", 'Culture & Heritage', 'heritage', ['humayuns-tomb']),
        ('delhi:akshardham', '/images/places/delhi/akshardham.webp', 'Akshardham Temple grand carved sandstone mandir', 'Culture & Heritage', 'spiritual', ['akshardham']),
        ('delhi:chandni-chowk', '/images/places/delhi/chandni-chowk.jpg', 'Chandni Chowk historic spice and food bazaar', 'Shops & Markets', 'shopping', ['chandni-chowk']),
        ('mumbai:gateway-of-india', '/images/places/mumbai/gateway-of-india.webp', 'Gateway of India basalt arch overlooking Arabian Sea', 'Culture & Heritage', 'heritage', ['gateway-of-india', 'gateway']),
        ('amritsar:golden-temple', '/images/places/amritsar/golden-temple.jpg', 'Harmandir Sahib Golden Temple in sacred Amrit Sarovar', 'Culture & Heritage', 'spiritual', ['golden-temple', 'harmandir-sahib']),
    ]
    
    for key, img, desc, cat, theme, aliases in preset_landmarks:
        alias_str = ",\n      ".join(f'"{a}"' for a in aliases)
        entry = f"""  "{key}": {{
    imageUrl: "{img}",
    visualDescription: "{desc}",
    category: "{cat}",
    semanticTheme: "{theme}",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      {alias_str}
    ]
  }}"""
        exact_place_entries.append(entry)

    # Now add all canonical places from DB
    for slug in CANONICAL_SLUGS:
        d = db.query(Destination).filter(Destination.slug == slug).first()
        if not d:
            continue
        places = db.query(Place).filter(Place.destination_id == d.id).all()
        for p in places:
            p_slug = slugify(p.slug or p.name)
            key = f"{slug}:{p_slug}"
            
            # Avoid duplicate key if already in preset
            if any(key in e for e in exact_place_entries):
                continue
                
            theme = get_theme_from_place(p.name, p.category)
            
            # Authoritative exact place asset
            if p.image_url and "/categories/" not in p.image_url and "/universal/" not in p.image_url:
                img_url = p.image_url
            else:
                jpg_cand = ROOT_DIR / "frontend" / "public" / "images" / "places" / slug / f"{p_slug}.jpg"
                if jpg_cand.exists():
                    img_url = f"/images/places/{slug}/{p_slug}.jpg"
                else:
                    img_url = f"/images/places/{slug}/{p_slug}.webp"
                    
            desc = p.description.replace('"', '\\"') if p.description else f"Curated visual of {p.name} in {d.name}."
            if len(desc) > 150:
                desc = desc[:147] + "..."
            
            aliases = [p_slug, slugify(p.name)]
            alias_str = ",\n      ".join(f'"{a}"' for a in set(aliases))
            
            entry = f"""  "{key}": {{
    imageUrl: "{img_url}",
    visualDescription: "{desc}",
    category: "{p.category or 'Curated Place'}",
    semanticTheme: "{theme}",
    sourceType: "editorial_artwork",
    source: "vanvas_curated",
    aliases: [
      {alias_str}
    ]
  }}"""
            exact_place_entries.append(entry)
            
    exact_registry_code = "export const EXACT_PLACE_REGISTRY: Record<string, CuratedLandmarkEntry> = {\n" + ",\n".join(exact_place_entries) + "\n};\n"
    
    # Read original resolver file
    content = RESOLVER_PATH.read_text(encoding="utf-8")
    
    exact_start_tok = "export const EXACT_PLACE_REGISTRY: Record<string, CuratedLandmarkEntry> = {"
    dest_start_tok = "export const DESTINATION_CATEGORY_REGISTRY: Record<"
    reg_start_tok = "export const REGIONAL_CATEGORY_REGISTRY: Record<"
    
    if exact_start_tok in content and dest_start_tok in content:
        idx1 = content.index(exact_start_tok)
        idx2 = content.index(dest_start_tok)
        
        # Keep comments right before dest_start_tok
        # Find the last '};\n' before idx2
        last_semi = content.rfind("};\n", idx1, idx2)
        if last_semi != -1:
            content = content[:idx1] + exact_registry_code.rstrip("\n") + content[last_semi + 2:]
            print("[OK] Replaced EXACT_PLACE_REGISTRY with all 208+ curated landmark entries.")
        else:
            print("[WARN] Could not find closing boundary for EXACT_PLACE_REGISTRY.")
            
    if dest_start_tok in content and reg_start_tok in content:
        idx1 = content.index(dest_start_tok)
        idx2 = content.index(reg_start_tok)
        last_semi = content.rfind("};\n", idx1, idx2)
        if last_semi != -1:
            content = content[:idx1] + dest_registry_code.rstrip("\n") + content[last_semi + 2:]
            print("[OK] Replaced DESTINATION_CATEGORY_REGISTRY with all 26 canonical destinations.")
        else:
            print("[WARN] Could not find closing boundary for DESTINATION_CATEGORY_REGISTRY.")
        
    RESOLVER_PATH.write_text(content, encoding="utf-8")
    print("[SUCCESS] placeVisualResolver.ts synchronized with authoritative 26-destination catalog.")

if __name__ == "__main__":
    sync_resolver()
