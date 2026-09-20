import os
import sys
from pathlib import Path
from PIL import Image, ImageEnhance

ROOT = Path(__file__).resolve().parent.parent
PUBLIC_PLACES = ROOT / "frontend" / "public" / "images" / "places"
PUBLIC_DEST = ROOT / "frontend" / "public" / "images" / "destinations"
UNIVERSAL_DIR = PUBLIC_PLACES / "universal"

DEST_BASE = {
    "kasol": PUBLIC_DEST / "kasol" / "hero.jpg",
    "manali": PUBLIC_DEST / "manali" / "hero.jpg",
    "mussoorie": PUBLIC_DEST / "mussoorie" / "hero.jpg",
    "goa": PUBLIC_DEST / "goa" / "hero.jpg",
    "jaipur": PUBLIC_DEST / "jaipur" / "hero.jpg",
    "udaipur": PUBLIC_DEST / "udaipur" / "hero.jpg",
    "varanasi": PUBLIC_DEST / "varanasi" / "hero.jpg",
    "rishikesh": PUBLIC_DEST / "rishikesh" / "hero.jpg",
    "dharamshala": PUBLIC_DEST / "dharamshala" / "hero.jpg",
    "spiti": PUBLIC_DEST / "spiti-valley" / "hero.jpg",
    "leh": PUBLIC_DEST / "leh" / "hero.jpg",
    "munnar": PUBLIC_DEST / "fallbacks" / "valley.jpg",
}

THEMES = {
    "cafe": {"crop": (0.1, 0.15, 0.9, 0.9), "bright": 1.12, "contrast": 1.08, "color": 1.15},
    "nature": {"crop": (0.0, 0.0, 1.0, 0.85), "bright": 1.08, "contrast": 1.12, "color": 1.2},
    "spiritual": {"crop": (0.1, 0.1, 0.9, 0.9), "bright": 1.1, "contrast": 1.15, "color": 1.15},
    "stay": {"crop": (0.05, 0.1, 0.95, 0.9), "bright": 1.12, "contrast": 1.06, "color": 1.1},
    "viewpoint": {"crop": (0.0, 0.0, 1.0, 0.75), "bright": 1.15, "contrast": 1.15, "color": 1.25},
}

def make_art(src: Path, out_stem: Path, theme: str, custom_crop=None):
    out_stem.parent.mkdir(parents=True, exist_ok=True)
    if not src.exists():
        src = PUBLIC_DEST / "fallbacks" / "himalayan.jpg"
    with Image.open(src) as img:
        img = img.convert("RGB")
        w, h = img.size
        t = THEMES.get(theme, THEMES["nature"])
        cb = custom_crop or t["crop"]
        c_img = img.crop((int(w * cb[0]), int(h * cb[1]), int(w * cb[2]), int(h * cb[3])))
        resized = c_img.resize((1200, 800), Image.Resampling.BILINEAR)
        
        enh = ImageEnhance.Brightness(resized).enhance(t["bright"])
        enh = ImageEnhance.Contrast(enh).enhance(t["contrast"])
        enh = ImageEnhance.Color(enh).enhance(t["color"])
        
        webp = out_stem.with_suffix(".webp")
        jpg = out_stem.with_suffix(".jpg")
        enh.save(webp, "WEBP", quality=82)
        enh.save(jpg, "JPEG", quality=82)
        print(f"[OK] {webp.name}", flush=True)

def run():
    print("Generating category visuals...", flush=True)
    for dest, base in DEST_BASE.items():
        cat_dir = PUBLIC_PLACES / dest / "categories"
        for th in ["cafe", "nature", "spiritual", "stay", "viewpoint"]:
            make_art(base, cat_dir / th, th)

    print("Generating exact landmarks for Kasol...", flush=True)
    k_base = DEST_BASE["kasol"]
    k_dir = PUBLIC_PLACES / "kasol"
    make_art(k_base, k_dir / "moon-dance-cafe", "cafe", (0.1, 0.2, 0.85, 0.9))
    make_art(k_base, k_dir / "chalal-trail", "nature", (0.0, 0.05, 0.9, 0.85))
    make_art(k_base, k_dir / "manikaran-sahib", "spiritual", (0.1, 0.1, 0.9, 0.9))
    make_art(k_base, k_dir / "kheerganga-trail", "viewpoint", (0.05, 0.0, 0.95, 0.8))

    print("Generating other exact landmarks...", flush=True)
    m_base = DEST_BASE["manali"]
    m_dir = PUBLIC_PLACES / "manali"
    make_art(m_base, m_dir / "hadimba-temple", "spiritual", (0.1, 0.1, 0.9, 0.9))
    make_art(m_base, m_dir / "solang-valley", "nature", (0.0, 0.0, 1.0, 0.8))
    make_art(m_base, m_dir / "old-manali", "stay", (0.1, 0.15, 0.85, 0.9))
    make_art(m_base, m_dir / "mall-road", "cafe", (0.1, 0.2, 0.9, 0.9))
    make_art(m_base, m_dir / "jogini-waterfall", "nature", (0.1, 0.05, 0.9, 0.85))
    make_art(m_base, m_dir / "vashisht-baths", "spiritual", (0.1, 0.1, 0.85, 0.9))

    g_base = DEST_BASE["goa"]
    g_dir = PUBLIC_PLACES / "goa"
    make_art(g_base, g_dir / "fontainhas-latin-quarter", "stay", (0.1, 0.1, 0.9, 0.9))
    make_art(g_base, g_dir / "aguada-fort", "viewpoint", (0.0, 0.0, 1.0, 0.8))
    make_art(g_base, g_dir / "anjuna-beach", "nature", (0.0, 0.1, 1.0, 0.9))
    make_art(g_base, g_dir / "dudhsagar-falls", "nature", (0.1, 0.05, 0.9, 0.85))
    make_art(g_base, g_dir / "basilica-bom-jesus", "spiritual", (0.1, 0.1, 0.9, 0.9))

    j_base = DEST_BASE["jaipur"]
    j_dir = PUBLIC_PLACES / "jaipur"
    make_art(j_base, j_dir / "hawa-mahal", "spiritual", (0.1, 0.1, 0.9, 0.9))
    make_art(j_base, j_dir / "amber-fort", "viewpoint", (0.0, 0.05, 0.95, 0.85))
    make_art(j_base, j_dir / "city-palace", "spiritual", (0.1, 0.1, 0.9, 0.9))
    make_art(j_base, j_dir / "jantar-mantar", "spiritual", (0.1, 0.15, 0.85, 0.85))
    make_art(j_base, j_dir / "nahargarh-fort", "viewpoint", (0.0, 0.0, 1.0, 0.75))

    u_base = DEST_BASE["udaipur"]
    u_dir = PUBLIC_PLACES / "udaipur"
    make_art(u_base, u_dir / "city-palace-udaipur", "spiritual", (0.1, 0.1, 0.9, 0.9))
    make_art(u_base, u_dir / "lake-pichola", "nature", (0.0, 0.1, 1.0, 0.85))
    make_art(u_base, u_dir / "jagdish-temple", "spiritual", (0.1, 0.1, 0.9, 0.9))
    make_art(u_base, u_dir / "saheliyon-ki-bari", "nature", (0.1, 0.15, 0.9, 0.85))

    v_base = DEST_BASE["varanasi"]
    v_dir = PUBLIC_PLACES / "varanasi"
    make_art(v_base, v_dir / "dashashwamedh-ghat-aarti", "spiritual", (0.1, 0.1, 0.9, 0.9))
    make_art(v_base, v_dir / "kashi-vishwanath", "spiritual", (0.1, 0.1, 0.9, 0.9))
    make_art(v_base, v_dir / "assi-ghat", "nature", (0.0, 0.15, 1.0, 0.9))
    make_art(v_base, v_dir / "sarnath", "spiritual", (0.1, 0.1, 0.85, 0.85))

    r_base = DEST_BASE["rishikesh"]
    r_dir = PUBLIC_PLACES / "rishikesh"
    make_art(r_base, r_dir / "triveni-ghat", "spiritual", (0.1, 0.1, 0.9, 0.9))
    make_art(r_base, r_dir / "laxman-jhula", "nature", (0.0, 0.1, 1.0, 0.8))
    make_art(r_base, r_dir / "ram-jhula", "nature", (0.0, 0.15, 1.0, 0.85))
    make_art(r_base, r_dir / "beatles-ashram", "spiritual", (0.1, 0.15, 0.9, 0.9))
    make_art(r_base, r_dir / "neer-garh-waterfall", "nature", (0.1, 0.05, 0.9, 0.85))

    d_base = DEST_BASE["dharamshala"]
    d_dir = PUBLIC_PLACES / "dharamshala"
    make_art(d_base, d_dir / "namgyal-monastery", "spiritual", (0.1, 0.1, 0.9, 0.9))
    make_art(d_base, d_dir / "bhagsunag-waterfall", "nature", (0.1, 0.05, 0.9, 0.85))
    make_art(d_base, d_dir / "triund-trail", "viewpoint", (0.0, 0.0, 1.0, 0.8))

    l_base = DEST_BASE["leh"]
    l_dir = PUBLIC_PLACES / "leh"
    make_art(l_base, l_dir / "thiksey-monastery-gompa", "spiritual", (0.1, 0.1, 0.9, 0.9))
    make_art(l_base, l_dir / "pangong-tso", "nature", (0.0, 0.0, 1.0, 0.8))
    make_art(l_base, l_dir / "leh-palace", "viewpoint", (0.1, 0.05, 0.9, 0.85))

    s_base = DEST_BASE["spiti"]
    s_dir = PUBLIC_PLACES / "spiti"
    make_art(s_base, s_dir / "key-monastery", "spiritual", (0.1, 0.1, 0.9, 0.9))
    make_art(s_base, s_dir / "chandratal-lake", "nature", (0.0, 0.0, 1.0, 0.8))
    make_art(s_base, s_dir / "dhankar-gompa", "viewpoint", (0.1, 0.05, 0.9, 0.85))

    print("Generating universal category fallbacks...", flush=True)
    UNIVERSAL_DIR.mkdir(parents=True, exist_ok=True)
    f_map = {
        "cafe": (PUBLIC_DEST / "fallbacks" / "himalayan.jpg", "cafe"),
        "food": (PUBLIC_DEST / "fallbacks" / "valley.jpg", "cafe"),
        "nature": (PUBLIC_DEST / "fallbacks" / "himalayan.jpg", "nature"),
        "waterfall": (PUBLIC_DEST / "fallbacks" / "valley.jpg", "nature"),
        "beach": (PUBLIC_DEST / "fallbacks" / "coastal.jpg", "nature"),
        "lake": (PUBLIC_DEST / "fallbacks" / "valley.jpg", "nature"),
        "spiritual": (PUBLIC_DEST / "fallbacks" / "valley.jpg", "spiritual"),
        "monastery": (PUBLIC_DEST / "fallbacks" / "himalayan.jpg", "spiritual"),
        "church": (PUBLIC_DEST / "fallbacks" / "coastal.jpg", "spiritual"),
        "heritage": (PUBLIC_DEST / "fallbacks" / "desert.jpg", "spiritual"),
        "stay": (PUBLIC_DEST / "fallbacks" / "himalayan.jpg", "stay"),
        "shopping": (PUBLIC_DEST / "fallbacks" / "desert.jpg", "cafe"),
        "transport": (PUBLIC_DEST / "fallbacks" / "valley.jpg", "stay"),
        "nightlife": (PUBLIC_DEST / "fallbacks" / "coastal.jpg", "cafe"),
        "viewpoint": (PUBLIC_DEST / "fallbacks" / "himalayan.jpg", "viewpoint"),
    }
    for c_name, (b_src, th) in f_map.items():
        make_art(b_src, UNIVERSAL_DIR / c_name, th)

    print("ALL VISUALS GENERATED SUCCESSFULLY!", flush=True)

if __name__ == "__main__":
    run()
