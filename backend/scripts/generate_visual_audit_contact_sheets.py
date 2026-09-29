import json
import os
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
BACKEND_DIR = ROOT_DIR / "backend"
FRONTEND_DIR = ROOT_DIR / "frontend"
PUBLIC_DIR = FRONTEND_DIR / "public"
AUDIT_DIR = ROOT_DIR / "audit_contact_sheets"
AUDIT_DIR.mkdir(parents=True, exist_ok=True)

inv_file = BACKEND_DIR / "authoritative_entity_inventory.json"
inventory = json.loads(inv_file.read_text(encoding="utf-8"))

places = [x for x in inventory if x["entity_type"] == "place"]
hotels = [x for x in inventory if x["entity_type"] == "hotel"]
rentals = [x for x in inventory if x["entity_type"] == "rental"]

def create_contact_sheet(items, title, output_path, cols=4, thumb_w=360, thumb_h=240):
    rows = (len(items) + cols - 1) // cols
    header_h = 60
    card_margin = 10
    label_h = 50
    
    sheet_w = cols * thumb_w + (cols + 1) * card_margin
    sheet_h = rows * (thumb_h + label_h) + (rows + 1) * card_margin + header_h
    
    sheet = Image.new("RGB", (sheet_w, sheet_h), color=(24, 26, 32))
    draw = ImageDraw.Draw(sheet)
    
    # Title
    draw.text((card_margin + 10, 15), title, fill=(240, 240, 245))
    
    for idx, item in enumerate(items):
        r = idx // cols
        c = idx % cols
        
        x = card_margin + c * (thumb_w + card_margin)
        y = header_h + card_margin + r * (thumb_h + label_h + card_margin)
        
        # Load image
        art_path = item["artwork_path"].lstrip("/")
        full_p = PUBLIC_DIR / art_path
        
        thumb = None
        if full_p.exists():
            try:
                with Image.open(full_p) as im:
                    thumb = im.convert("RGB").resize((thumb_w, thumb_h), Image.Resampling.LANCZOS)
            except Exception as e:
                pass
        
        if thumb:
            sheet.paste(thumb, (x, y))
        else:
            draw.rectangle([x, y, x + thumb_w, y + thumb_h], fill=(50, 20, 20))
            draw.text((x + 10, y + 10), "MISSING FILE", fill=(255, 100, 100))
            
        # Draw frame
        draw.rectangle([x, y, x + thumb_w, y + thumb_h], outline=(60, 65, 80), width=1)
        
        # Draw label box
        label_y = y + thumb_h
        draw.rectangle([x, label_y, x + thumb_w, label_y + label_h], fill=(32, 35, 45))
        
        dest_str = item.get("destination", "").upper()
        name_str = item.get("entity_name", "")
        cat_str = item.get("category", "") or item.get("property_identity") or item.get("vehicle_model") or ""
        
        # Truncate strings if too long
        if len(name_str) > 38:
            name_str = name_str[:35] + "..."
            
        draw.text((x + 6, label_y + 4), f"[{dest_str}] {name_str}", fill=(255, 220, 150))
        draw.text((x + 6, label_y + 24), f"{cat_str} | {Path(art_path).name}", fill=(180, 190, 205))

    sheet.save(output_path, "JPEG", quality=90)
    print(f"Generated contact sheet: {output_path.name} ({len(items)} items, {sheet_w}x{sheet_h})")

# 1. Rentals sheets
create_contact_sheet(rentals[:27], "VANVAS RENTALS / VEHICLES - PART 1 (Items 1-27)", AUDIT_DIR / "rentals_part1.jpg", cols=3, thumb_w=400, thumb_h=260)
create_contact_sheet(rentals[27:], "VANVAS RENTALS / VEHICLES - PART 2 (Items 28-53)", AUDIT_DIR / "rentals_part2.jpg", cols=3, thumb_w=400, thumb_h=260)

# 2. Hotels sheets (4 sheets of 26)
for i in range(4):
    chunk = hotels[i*26:(i+1)*26]
    create_contact_sheet(chunk, f"VANVAS HOTELS / STAYS - PART {i+1} of 4", AUDIT_DIR / f"hotels_part{i+1}.jpg", cols=4, thumb_w=350, thumb_h=230)

# 3. Places sheets (8 sheets of 26)
for i in range(8):
    chunk = places[i*26:(i+1)*26]
    create_contact_sheet(chunk, f"VANVAS PLACES / LANDMARKS - PART {i+1} of 8", AUDIT_DIR / f"places_part{i+1}.jpg", cols=4, thumb_w=350, thumb_h=230)

print("\nAll contact sheets generated in audit_contact_sheets/")
