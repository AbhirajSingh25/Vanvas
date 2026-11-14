import json, os

with open('frontend/lib/canonicalRegistryData.ts', 'r', encoding='utf-8') as f:
    text = f.read()

def extract_section(dest_slug, section_name):
    d_idx = text.find(f'"{dest_slug}": {{')
    if d_idx == -1: return []
    sec_idx = text.find(f'"{section_name}": [', d_idx)
    if sec_idx == -1: return []
    # find matching bracket
    count = 0
    end_idx = sec_idx
    for i in range(sec_idx + len(f'"{section_name}": [') - 1, len(text)):
        if text[i] == '[': count += 1
        elif text[i] == ']':
            count -= 1
            if count == 0:
                end_idx = i + 1
                break
    sub = text[sec_idx + len(f'"{section_name}":'):end_idx]
    # Clean trailing commas for json parse
    import re
    cleaned = re.sub(r',\s*([\]}])', r'\1', sub)
    try:
        return json.loads(cleaned)
    except Exception as e:
        print(f"JSON parse error in {dest_slug} {section_name}: {e}")
        return []

print("=== RUNNING INDEPENDENT PYTHON DIAGNOSTIC AUDIT ===")

for dest, title in [("kasol", "Kasol (Parvati Valley)"), ("dharamshala", "Dharamshala (McLeod Ganj)")]:
    places = extract_section(dest, "places")
    hotels = extract_section(dest, "hotels")
    rentals = extract_section(dest, "rentals")
    print(f"\n--- {title.upper()} ---")
    print(f"Places: {len(places)}, Hotels: {len(hotels)}, Rentals: {len(rentals)}")

    flagged = 0
    # Audit Places
    for p in places:
        img = p.get('image_url', '')
        p_path = os.path.join('frontend/public', img.lstrip('/'))
        exists = os.path.exists(p_path)
        is_cat = '/categories/' in img or 'generic_' in img
        is_vec = img.endswith('.svg') or 'placeholder' in img
        ok = exists and not is_cat and not is_vec
        status = '✅' if ok else '❌'
        if not ok: flagged += 1
        print(f"  {status} PLACE: {p.get('name')} -> {img} (exists={exists})")

    # Audit Hotels
    for h in hotels:
        img = h.get('image_url', '')
        h_path = os.path.join('frontend/public', img.lstrip('/'))
        exists = os.path.exists(h_path)
        is_stay = '/stays/' in img
        ok = exists and is_stay
        status = '✅' if ok else '❌'
        if not ok: flagged += 1
        print(f"  {status} HOTEL: {h.get('name')} -> {img} (exists={exists})")

    # Audit Rentals
    for r in rentals:
        img = r.get('image_url', '')
        r_path = os.path.join('frontend/public', img.lstrip('/'))
        exists = os.path.exists(r_path)
        is_veh = '/vehicles/' in img
        ok = exists and is_veh
        status = '✅' if ok else '❌'
        if not ok: flagged += 1
        print(f"  {status} RENTAL: {r.get('vehicle_name', r.get('vehicle_type'))} -> {img} (exists={exists})")

    if flagged == 0:
        print(f"PASSED: 100% of {dest} visual assets verified valid and on disk!")
    else:
        print(f"FAILED: {flagged} assets flagged for {dest}!")
