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

with open(INV_FILE, "r", encoding="utf-8") as f:
    inventory = json.load(f)

# 1. Generate HTML Contact Sheet
html_content = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>VANVAS Illustration Library Audit — Visual Contact Sheet</title>
<style>
  :root {
    --bg-page: #FAF7F0;
    --text-primary: #173B32;
    --text-secondary: #7B4D36;
    --border-color: #E5D5BA;
    --accent-gold: #B49252;
    --accent-rust: #B65E3C;
    --dark-green: #0F2924;
    --card-bg: #FFFFFF;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  body { background-color: var(--bg-page); color: var(--text-primary); padding: 24px; line-height: 1.5; }
  header { max-width: 1400px; margin: 0 auto 24px auto; background: var(--card-bg); padding: 24px; border-radius: 16px; border: 2px solid var(--border-color); }
  h1 { font-size: 26px; color: var(--text-primary); margin-bottom: 8px; font-weight: 800; }
  p.subtitle { color: var(--text-secondary); font-size: 14px; margin-bottom: 16px; }
  .stats-bar { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 16px; }
  .stat-pill { background: #F4EAD8; border: 1px solid var(--border-color); padding: 6px 14px; border-radius: 999px; font-size: 13px; font-weight: 600; color: var(--text-primary); }
  .stat-pill span { color: var(--accent-rust); font-weight: 800; }
  
  .filters { max-width: 1400px; margin: 0 auto 24px auto; display: flex; flex-wrap: wrap; gap: 8px; }
  .filter-btn { background: var(--card-bg); border: 2px solid var(--border-color); color: var(--text-primary); padding: 8px 16px; border-radius: 12px; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; cursor: pointer; transition: all 0.2s; }
  .filter-btn:hover, .filter-btn.active { background: var(--text-primary); color: #FAF7F0; border-color: var(--text-primary); }
  
  .section-title { max-width: 1400px; margin: 24px auto 12px auto; font-size: 18px; font-weight: 800; color: var(--text-primary); text-transform: uppercase; letter-spacing: 1px; display: flex; align-items: center; gap: 8px; }
  
  .grid { max-width: 1400px; margin: 0 auto 36px auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 18px; }
  .card { background: var(--card-bg); border: 2px solid var(--border-color); border-radius: 16px; overflow: hidden; display: flex; flex-col: column; box-shadow: 0 2px 4px rgba(0,0,0,0.04); transition: transform 0.2s, box-shadow 0.2s; }
  .card:hover { transform: translateY(-3px); box-shadow: 0 8px 16px rgba(23, 59, 50, 0.12); border-color: var(--text-primary); }
  
  .img-container { width: 100%; aspect-ratio: 16 / 10; background: #EFE5D2; position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center; }
  .img-container img { width: 100%; height: 100%; object-fit: cover; }
  .img-missing { color: #A03030; font-weight: 800; font-size: 13px; text-align: center; padding: 20px; }
  
  .badge-row { position: absolute; top: 8px; left: 8px; right: 8px; display: flex; justify-content: space-between; gap: 6px; }
  .tag { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; padding: 3px 8px; border-radius: 6px; }
  .tag-type { background: rgba(15, 41, 36, 0.9); color: #FAF4E8; }
  .tag-status-valid { background: rgba(34, 139, 34, 0.9); color: white; }
  .tag-status-dup { background: rgba(182, 94, 60, 0.95); color: white; }
  .tag-status-broken { background: rgba(180, 20, 20, 0.95); color: white; }
  
  .card-body { padding: 14px; flex: 1; display: flex; flex-direction: column; justify-content: space-between; }
  .card-dest { font-size: 11px; font-weight: 800; color: var(--accent-rust); text-transform: uppercase; letter-spacing: 0.5px; }
  .card-title { font-size: 14px; font-weight: 700; color: var(--text-primary); margin: 2px 0 6px 0; line-height: 1.3; }
  .card-cat { font-size: 11px; color: var(--text-secondary); margin-bottom: 8px; }
  
  .meta-box { background: #FAF7F0; border: 1px solid var(--border-color); border-radius: 8px; padding: 8px; font-size: 10.5px; font-family: monospace; color: #4A4A4A; }
  .meta-box div { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .meta-warn { color: #A03030; font-weight: bold; margin-top: 4px; white-space: normal !important; }
</style>
</head>
<body>

<header>
  <h1>VANVAS Visual Library Audit Contact Sheet</h1>
  <p class="subtitle">Phase 1 Visual Verification • Branch: <code>feat/app-shell-mobile-refactor</code> • No generative calls made</p>
  <div class="stats-bar">
    <div class="stat-pill">Total Inventory Entities: <span>""" + str(len(inventory)) + """</span></div>
    <div class="stat-pill">Destinations: <span>26</span></div>
    <div class="stat-pill">Places: <span>208</span></div>
    <div class="stat-pill">Stays & Camps: <span>104</span></div>
    <div class="stat-pill">Vehicles: <span>53</span></div>
    <div class="stat-pill">Valid Keep: <span>204</span></div>
    <div class="stat-pill">Duplicates to Review: <span>176</span></div>
    <div class="stat-pill">Broken / Missing: <span>11</span></div>
  </div>
</header>

<div class="filters">
  <button class="filter-btn active" onclick="filterItems('all')">All Assets</button>
  <button class="filter-btn" onclick="filterItems('destination')">Destinations (26)</button>
  <button class="filter-btn" onclick="filterItems('place')">Places (208)</button>
  <button class="filter-btn" onclick="filterItems('stay')">Stays & Lodges (101)</button>
  <button class="filter-btn" onclick="filterItems('campsite')">Campsites (3)</button>
  <button class="filter-btn" onclick="filterItems('scooter')">Scooters (43)</button>
  <button class="filter-btn" onclick="filterItems('motorbike')">Motorbikes (10)</button>
  <button class="filter-btn" onclick="filterItems('chopta')">Chopta Focus</button>
  <button class="filter-btn" onclick="filterItems('kainchi')">Kainchi Dham Focus</button>
  <button class="filter-btn" onclick="filterItems('issue')">Issues & Duplicates</button>
</div>

<div class="grid" id="assetGrid">
"""

for item in inventory:
    ent_type = item["entity_type"]
    ent_id = item["entity_id"]
    name = item["entity_name"]
    dest = item.get("destination_slug", "")
    dest_name = item.get("destination_name", dest.title())
    cat = item.get("category", "")
    img_path = item.get("resolved_image_path", "")
    exists = item.get("image_exists", False)
    sha = item.get("sha256", "MISSING")[:8]
    status = item.get("audit_status", "VALID_KEEP")
    notes = item.get("audit_notes", "")
    dups_count = len(item.get("duplicate_copies", []))
    
    status_class = "tag-status-valid"
    if status == "DUPLICATE_REVIEW":
        status_class = "tag-status-dup"
    elif status in ["BROKEN_PATH", "GENUINELY_MISSING"]:
        status_class = "tag-status-broken"
        
    is_issue = status != "VALID_KEEP"
    is_chopta = "tungnath" in dest or "chopta" in dest or "chopta" in img_path
    is_kainchi = "kainchi" in dest or "kainchi" in img_path

    card_html = f"""
  <div class="card" data-type="{ent_type}" data-issue="{str(is_issue).lower()}" data-chopta="{str(is_chopta).lower()}" data-kainchi="{str(is_kainchi).lower()}">
    <div class="img-container">
      {f'<img src="frontend/public{img_path}" alt="{name}" loading="lazy" />' if exists else f'<div class="img-missing">❌ FILE MISSING<br>{img_path}</div>'}
      <div class="badge-row">
        <span class="tag tag-type">{ent_type.upper()}</span>
        <span class="tag {status_class}">{status.replace('_', ' ')}</span>
      </div>
    </div>
    <div class="card-body">
      <div>
        <div class="card-dest">[{dest_name}]</div>
        <h4 class="card-title">{name}</h4>
        <div class="card-cat">{cat}</div>
      </div>
      <div class="meta-box">
        <div><strong>Path:</strong> {img_path}</div>
        <div><strong>SHA:</strong> {sha} | <strong>Dups:</strong> {dups_count}</div>
        {f'<div class="meta-warn">⚠️ {notes}</div>' if notes and status != "VALID_KEEP" else ''}
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
    } else if (category === 'issue') {
      card.style.display = card.dataset.issue === 'true' ? 'flex' : 'none';
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

# 2. Also generate composite JPEG sheets for Chopta & Kainchi Dham specifically
def create_grid_sheet(items, title, out_path, cols=3, thumb_w=360, thumb_h=225):
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
        name = item.get("entity_name", "")[:35]
        cat = item.get("category", "")[:25]
        status = item.get("audit_status", "")
        
        color = (255, 220, 150) if status == "VALID_KEEP" else (255, 120, 120)
        draw.text((x + 6, lbl_y + 4), f"[{item.get('entity_type', '').upper()}] {name}", fill=color)
        draw.text((x + 6, lbl_y + 22), f"{cat} | {Path(art_path).name}", fill=(180, 190, 205))
        
    sheet.save(out_path, "JPEG", quality=90)
    print(f"Generated Grid Sheet: {out_path.name}")

chopta_items = [x for x in inventory if "tungnath" in x.get("destination_slug", "") or "chopta" in x.get("destination_slug", "") or "chopta" in x.get("resolved_image_path", "")]
kainchi_items = [x for x in inventory if "kainchi" in x.get("destination_slug", "") or "kainchi" in x.get("resolved_image_path", "")]

create_grid_sheet(chopta_items, "CHOPTA / TUNGNATH-CHANDRASHILA ASSETS AUDIT SHEET", AUDIT_IMG_DIR / "chopta_audit_contact_sheet.jpg")
create_grid_sheet(kainchi_items, "KAINCHI DHAM ASSETS AUDIT SHEET", AUDIT_IMG_DIR / "kainchi_dham_audit_contact_sheet.jpg")
