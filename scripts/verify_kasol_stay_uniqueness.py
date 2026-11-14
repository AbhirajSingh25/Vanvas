from PIL import Image
import numpy as np

stay_dir = 'frontend/public/images/places/kasol/stays'
files = [
    'the-himalayan-village.webp',
    'parvati-kuteer-riverside-wood-cottages.webp',
    'kasol-heights-resort.webp',
    'the-hosteller-kasol-riverside.webp'
]

print("=== VERIFYING KASOL HOTEL ASSET UNIQUENESS ===")
imgs = {}
for f in files:
    path = f"{stay_dir}/{f}"
    img = Image.open(path).convert('RGB')
    imgs[f] = np.array(img).astype(float)
    print(f"Loaded {f}: dimensions = {img.size}")

for i in range(len(files)):
    for j in range(i + 1, len(files)):
        f1, f2 = files[i], files[j]
        diff = np.mean(np.abs(imgs[f1] - imgs[f2]))
        print(f"Visual difference between '{f1}' and '{f2}': {diff:.2f}")
