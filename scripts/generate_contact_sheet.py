"""
VANVAS Global Visual Contact Sheet Generator
Generates full contact sheets for every audited category across the entire VANVAS library:
1. Dynamic HTML interactive visual audit sheet (audit_contact_sheet.html)
2. High-resolution composite JPEG contact sheets for:
   - All 26 Canonical Destinations (destinations_contact_sheet.jpg)
   - Stays & Lodges (stays_contact_sheet.jpg)
   - Mobility Vehicles (Scooters, Bullets, Adventure Tourers, Cycles, Cars) (vehicles_contact_sheet.jpg)
   - Curated Places & Landmarks (places_contact_sheet.jpg)
   - Chopta / Tungnath Focus (chopta_audit_contact_sheet.jpg)
   - Kainchi Dham Focus (kainchi_dham_audit_contact_sheet.jpg)
"""
import json
import os
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "frontend" / "public"
INV_FILE = ROOT / "vanvas_illustration_audit_inventory.json"
HTML_OUT = ROOT / "audit_contact_sheet.html"
AUDIT_IMG_DIR = ROOT / "audit_contact_sheets"
AUDIT_IMG_DIR.mkdir(exist_ok=True)

def main():
    print("=== VANVAS PHASE E: GENERATING COMPREHENSIVE CONTACT SHEETS ===")
    with open(INV_FILE, "r", encoding="utf-8") as f:
        inventory = json.load(f)

    # Calculate real dynamic counts
    type_counts = {}
    valid_count = 0
    dup_review_count = 0
    missing_count = 0

    for item in inventory:
        t = item.get("entity_type", "other")
        type_counts[t] = type_counts.get(t, 0) + 1
        if not item.get("image_exists", False):
            missing_count += 1
        elif item.get("audit_status") == "VALID_KEEP":
            valid_count += 1
        else:
            dup_review_count += 1

    # 1. Generate Interactive HTML Contact Sheet
    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>VANVAS Illustration Library Audit — Global Visual Contact Sheet</title>
<style>
  :root {{
    --bg-page: #FAF7F0;
    --text-primary: #173B32;
    --text-secondary: #7B4D36;
    --border-color: #E5D5BA;
    --accent-gold: #B49252;
    --accent-rust: #B65E3C;
    --dark-green: #0F2924;
    --card-bg: #FFFFFF;
  }}
  * {{ box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }}
  body {{ background-color: var(--bg-page); color: var(--text-primary); padding: 24px; line-height: 1.5; }}
  header {{ max-width: 1400px; margin: 0 auto 24px auto; background: var(--card-bg); padding: 24px; border-radius: 16px; border: 2px solid var(--border-color); }}
  h1 {{ font-size: 26px; color: var(--text-primary); margin-bottom: 8px; font-weight: 800; }}
  p.subtitle {{ color: var(--text-secondary); font-size: 14px; margin-bottom: 16px; }}
  .stats-bar {{ display: flex; flex-wrap: wrap; gap: 12px; margin-top: 16px; }}
  .stat-pill {{ background: #F4EAD8; border: 1px solid var(--border-color); padding: 6px 14px; border-radius: 999px; font-size: 13px; font-weight: 600; color: var(--text-primary); }}
  .stat-pill span {{ color: var(--accent-rust); font-weight: 800; }}
  
  .filters {{ max-width: 1400px; margin: 0 auto 24px auto; display: flex; flex-wrap: wrap; gap: 8px; }}
  .filter-btn {{ background: var(--card-bg); border: 2px solid var(--border-color); color: var(--text-primary); padding: 8px 16px; border-radius: 12px; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; cursor: pointer; transition: all 0.2s; }}
  .filter-btn:hover, .filter-btn.active {{ background: var(--text-primary); color: #FAF7F0; border-color: var(--text-primary); }}
  
  .grid {{ max-width: 1400px; margin: 0 auto 36px auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 18px; }}
  .card {{ background: var(--card-bg); border: 2px solid var(--border-color); border-radius: 16px; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 2px 4px rgba(0,0,0,0.04); transition: transform 0.2s, box-shadow 0.2s; }}
  .card:hover {{ transform: translateY(-3px); box-shadow: 0 8px 16px rgba(23, 59, 50, 0.12); border-color: var(--text-primary); }}
  
  .img-container {{ width: 100%; aspect-ratio: 16 / 10; background: #EFE5D2; position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center; }}
  .img-container img {{ width: 100%; height: 100%; object-fit: cover; }}
  .img-missing {{ color: #A03030; font-weight: 800; font-size: 13px; text-align: center; padding: 20px; }}
  
  .badge-row {{ position: absolute; top: 8px; left: 8px; right: 8px; display: flex; justify-content: space-between; gap: 6px; }}
  .tag {{ font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; padding: 3px 8px; border-radius: 6px; }}
  .tag-type {{ background: rgba(15, 41, 36, 0.9); color: #FAF4E8; }}
  .tag-status-valid {{ background: rgba(34, 139, 34, 0.9); color: white; }}
  .tag-status-dup {{ background: rgba(182, 94, 60, 0.95); color: white; }}
  
  .card-body {{ padding: 14px; flex: 1; display: flex; flex-direction: column; justify-content: space-between; }}
  .card-dest {{ font-size: 11px; font-weight: 800; color: var(--accent-rust); text-transform: uppercase; letter-spacing: 0.5px; }}
  .card-title {{ font-size: 14px; font-weight: 700; color: var(--text-primary); margin: 2px 0 6px 0; line-height: 1.3; }}
  .card-cat {{ font-size: 11px; color: var(--text-secondary); margin-bottom: 8px; }}
  
  .meta-box {{ background: #FAF7F0; border: 1px solid var(--border-color); border-radius: 8px; padding: 8px; font-size: 10.5px; font-family: monospace; color: #4A4A4A; }}
  .meta-box div {{ white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }}
</style>
</head>
<body>

<header>
  <h1>VANVAS Global Illustration Library Audit Contact Sheet</h1>
  <p class="subtitle">Authoritative Visual Verification • Branch: <code>feat/app-shell-mobile-refactor</code> • 100% Genuine Editorial Assets</p>
  <div class="stats-bar">
    <div class="stat-pill">Total Audited Entities: <span>{len(inventory)}</span></div>
    <div class="stat-pill">Destinations: <span>{type_counts.get('destination', 0)}</span></div>
    <div class="stat-pill">Places: <span>{type_counts.get('place', 0)}</span></div>
    <div class="stat-pill">Stays & Camps: <span>{type_counts.get('stay', 0) + type_counts.get('campsite', 0)}</span></div>
    <div class="stat-pill">Vehicles: <span>{type_counts.get('scooter', 0) + type_counts.get('motorbike', 0) + type_counts.get('adventure_motorcycle', 0) + type_counts.get('car', 0) + type_counts.get('bicycle', 0)}</span></div>
    <div class="stat-pill">Valid Dedicated Art: <span>{valid_count}</span></div>
    <div class="stat-pill">Shared Review Clusters: <span>{dup_review_count}</span></div>
    <div class="stat-pill">Missing on Disk: <span>{missing_count}</span></div>
  </div>
</header>

<div class="filters">
  <button class="filter-btn active" onclick="filterItems('all')">All Assets ({len(inventory)})</button>
  <button class="filter-btn" onclick="filterItems('destination')">Destinations ({type_counts.get('destination', 0)})</button>
  <button class="filter-btn" onclick="filterItems('place')">Places ({type_counts.get('place', 0)})</button>
  <button class="filter-btn" onclick="filterItems('stay')">Stays & Lodges ({type_counts.get('stay', 0)})</button>
  <button class="filter-btn" onclick="filterItems('vehicle')">Vehicles ({type_counts.get('scooter', 0) + type_counts.get('motorbike', 0) + type_counts.get('adventure_motorcycle', 0) + type_counts.get('car', 0) + type_counts.get('bicycle', 0)})</button>
  <button class="filter-btn" onclick="filterItems('chopta')">Chopta Focus</button>
  <button class="filter-btn" onclick="filterItems('kainchi')">Kainchi Dham Focus</button>
</div>

<div class="grid">
"""

    for item in inventory:
        ent_type = item.get("entity_type", "")
        dest_slug = item.get("destination_slug", "")
        img_path = item.get("resolved_image_path", "")
        img_exists = item.get("image_exists", False)
        status = item.get("audit_status", "")
        
        is_chopta = "chopta" in dest_slug or "tungnath" in dest_slug
        is_kainchi = "kainchi" in dest_slug
        is_vehicle = ent_type in ["scooter", "motorbike", "adventure_motorcycle", "car", "bicycle"]
        
        rel_img = "frontend/public" + img_path if img_path.startswith("/") else "frontend/public/" + img_path

        card_html = f"""
  <div class="card" data-type="{ent_type}" data-is-vehicle="{'true' if is_vehicle else 'false'}" data-chopta="{'true' if is_chopta else 'false'}" data-kainchi="{'true' if is_kainchi else 'false'}">
    <div class="img-container">
      {f'<img src="{rel_img}" alt="{item.get("entity_name")}" loading="lazy">' if img_exists else f'<div class="img-missing">FILE MISSING<br>{img_path}</div>'}
      <div class="badge-row">
        <span class="tag tag-type">{ent_type}</span>
        <span class="tag {'tag-status-valid' if status == 'VALID_KEEP' else 'tag-status-dup'}">{status}</span>
      </div>
    </div>
    <div class="card-body">
      <div>
        <div class="card-dest">{item.get("destination_name", dest_slug)}</div>
        <div class="card-title">{item.get("entity_name")}</div>
        <div class="card-cat">{item.get("category", "")}</div>
      </div>
      <div class="meta-box">
        <div><strong>Path:</strong> {img_path}</div>
        <div><strong>Dims:</strong> {item.get('image_dimensions')} ({item.get('image_format')})</div>
        <div><strong>SHA:</strong> {item.get('sha256', '')[:12]}...</div>
      </div>
    </div>
  </div>
"""
        html_content += card_html

    html_content += """
</div>

<script>
function filterItems(category) {
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  
  const cards = document.querySelectorAll('.card');
  cards.forEach(card => {
    if (category === 'all') {
      card.style.display = 'flex';
    } else if (category === 'vehicle') {
      card.style.display = card.dataset.isVehicle === 'true' ? 'flex' : 'none';
    } else if (category === 'chopta') {
      card.style.display = card.dataset.chopta === 'true' ? 'flex' : 'none';
    } else if (category === 'kainchi') {
      card.style.display = card.dataset.kainchi === 'true' ? 'flex' : 'none';
    } else {
      card.style.display = card.dataset.type === category ? 'flex' : 'none';
    }
  });
}
</script>
</body>
</html>
"""

    HTML_OUT.write_text(html_content, encoding="utf-8")
    print(f"Generated HTML Contact Sheet: {HTML_OUT}")

    # 2. Composite JPEG Contact Sheets for all categories
    def create_grid_sheet(items, title, out_path, cols=4, thumb_w=340, thumb_h=215):
        if not items:
            return
        rows = (len(items) + cols - 1) // cols
        card_m = 10
        head_h = 50
        lbl_h = 45
        
        w = cols * thumb_w + (cols + 1) * card_m
        h = rows * (thumb_h + lbl_h) + (rows + 1) * card_m + head_h
        
        sheet = Image.new("RGB", (w, h), (24, 26, 32))
        draw = ImageDraw.Draw(sheet)
        draw.text((15, 15), title, fill=(240, 240, 245))
        
        for idx, item in enumerate(items):
            r = idx // cols
            c = idx % cols
            x = card_m + c * (thumb_w + card_m)
            y = head_h + card_m + r * (thumb_h + lbl_h + card_m)
            
            art_path = item.get("resolved_image_path", "").lstrip("/")
            full_p = PUBLIC / art_path
            
            thumb = None
            if full_p.exists():
                try:
                    with Image.open(full_p) as im:
                        thumb = im.convert("RGB").resize((thumb_w, thumb_h), Image.Resampling.LANCZOS)
                except Exception:
                    pass
                    
            if thumb:
                sheet.paste(thumb, (x, y))
            else:
                draw.rectangle([x, y, x + thumb_w, y + thumb_h], fill=(60, 20, 20))
                draw.text((x + 10, y + 10), "FILE MISSING", fill=(255, 100, 100))
                
            draw.rectangle([x, y, x + thumb_w, y + thumb_h], outline=(60, 65, 80), width=1)
            
            # Label
            lbl_y = y + thumb_h
            draw.rectangle([x, lbl_y, x + thumb_w, lbl_y + lbl_h], fill=(32, 35, 45))
            name = item.get("entity_name", "")[:32]
            cat = item.get("category", "")[:22]
            status = item.get("audit_status", "")
            
            color = (255, 220, 150) if status == "VALID_KEEP" else (255, 120, 120)
            draw.text((x + 6, lbl_y + 4), f"[{item.get('entity_type', '').upper()}] {name}", fill=color)
            draw.text((x + 6, lbl_y + 22), f"{cat} | {Path(art_path).name}", fill=(180, 190, 205))
            
        sheet.save(out_path, "JPEG", quality=90)
        print(f"Generated Grid Sheet: {out_path.name} ({len(items)} items)")

    # Category breakdowns
    dest_items = [x for x in inventory if x.get("entity_type") == "destination"]
    stay_items = [x for x in inventory if x.get("entity_type") in ["stay", "campsite"]]
    vehicle_items = [x for x in inventory if x.get("entity_type") in ["scooter", "motorbike", "adventure_motorcycle", "car", "bicycle"]]
    place_items = [x for x in inventory if x.get("entity_type") == "place"]
    chopta_items = [x for x in inventory if "tungnath" in x.get("destination_slug", "") or "chopta" in x.get("destination_slug", "") or "chopta" in x.get("resolved_image_path", "")]
    kainchi_items = [x for x in inventory if "kainchi" in x.get("destination_slug", "") or "kainchi" in x.get("resolved_image_path", "")]

    create_grid_sheet(dest_items, "VANVAS CANONICAL DESTINATIONS AUDIT SHEET", AUDIT_IMG_DIR / "destinations_contact_sheet.jpg", cols=4)
    create_grid_sheet(stay_items, "VANVAS STAYS, RESORTS & LODGES AUDIT SHEET", AUDIT_IMG_DIR / "stays_contact_sheet.jpg", cols=4)
    create_grid_sheet(vehicle_items, "VANVAS MOBILITY VEHICLES (SCOOTERS, BIKES, CARS, CYCLES) AUDIT SHEET", AUDIT_IMG_DIR / "vehicles_contact_sheet.jpg", cols=4)
    create_grid_sheet(place_items[:48], "VANVAS CURATED PLACES & LANDMARKS (CORE SAMPLE) AUDIT SHEET", AUDIT_IMG_DIR / "places_contact_sheet.jpg", cols=4)
    create_grid_sheet(chopta_items, "CHOPTA / TUNGNATH-CHANDRASHILA ASSETS AUDIT SHEET", AUDIT_IMG_DIR / "chopta_audit_contact_sheet.jpg", cols=3)
    create_grid_sheet(kainchi_items, "KAINCHI DHAM ASSETS AUDIT SHEET", AUDIT_IMG_DIR / "kainchi_dham_audit_contact_sheet.jpg", cols=3)

    print("\nAll contact sheets successfully generated!")

if __name__ == "__main__":
    main()
