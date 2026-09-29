import os
import sys
import json
import math
import hashlib
import random
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance, ImageOps

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
BACKEND_DIR = ROOT_DIR / "backend"
FRONTEND_DIR = ROOT_DIR / "frontend"
PUBLIC_DIR = FRONTEND_DIR / "public"
BRAIN_DIR = Path(r"C:\Users\user\.gemini\antigravity-ide\brain")

# Ensure output directories exist
(PUBLIC_DIR / "images" / "places").mkdir(parents=True, exist_ok=True)
(PUBLIC_DIR / "images" / "vehicles").mkdir(parents=True, exist_ok=True)

# Regional Color Palettes (Rich Gouache / Travel Journal)
REGIONAL_PALETTES = {
    "rajasthan": {
        "sky_top": (175, 110, 80), "sky_bottom": (245, 205, 150),
        "ground": (210, 155, 100), "ground_dark": (140, 80, 50),
        "accent": (195, 80, 55), "stone": (230, 185, 140), "foliage": (110, 130, 80),
        "water": (90, 135, 160)
    },
    "himalayan": {
        "sky_top": (75, 110, 155), "sky_bottom": (195, 215, 230),
        "ground": (65, 85, 70), "ground_dark": (35, 55, 45),
        "accent": (215, 140, 75), "stone": (130, 140, 150), "foliage": (40, 75, 55),
        "water": (80, 165, 180)
    },
    "spiritual_ganga": {
        "sky_top": (120, 85, 130), "sky_bottom": (245, 175, 110),
        "ground": (170, 130, 95), "ground_dark": (105, 65, 50),
        "accent": (230, 110, 45), "stone": (210, 165, 125), "foliage": (70, 95, 65),
        "water": (75, 155, 165)
    },
    "coastal": {
        "sky_top": (50, 120, 170), "sky_bottom": (210, 235, 245),
        "ground": (235, 210, 160), "ground_dark": (150, 110, 70),
        "accent": (225, 95, 60), "stone": (180, 120, 95), "foliage": (35, 115, 65),
        "water": (45, 145, 175)
    },
    "kerala": {
        "sky_top": (80, 130, 160), "sky_bottom": (220, 235, 225),
        "ground": (45, 95, 55), "ground_dark": (25, 65, 35),
        "accent": (210, 145, 65), "stone": (140, 130, 120), "foliage": (30, 110, 45),
        "water": (55, 135, 140)
    },
    "ladakh_spiti": {
        "sky_top": (35, 80, 150), "sky_bottom": (160, 200, 235),
        "ground": (175, 145, 115), "ground_dark": (115, 85, 65),
        "accent": (205, 65, 45), "stone": (160, 135, 110), "foliage": (95, 115, 85),
        "water": (40, 155, 210)
    },
    "heritage_plains": {
        "sky_top": (130, 110, 135), "sky_bottom": (235, 215, 190),
        "ground": (165, 135, 105), "ground_dark": (110, 80, 60),
        "accent": (205, 90, 50), "stone": (200, 160, 125), "foliage": (85, 110, 75),
        "water": (85, 140, 160)
    }
}

DEST_TO_REGION = {
    "jaipur": "rajasthan", "udaipur": "rajasthan", "jaisalmer": "rajasthan",
    "neemrana": "rajasthan", "alwar-siliserh": "rajasthan", "sariska-bhangarh": "rajasthan",
    "munnar": "kerala", "goa": "coastal", "manali": "himalayan", "kasol": "himalayan",
    "dharamshala": "himalayan", "mussoorie": "himalayan", "lansdowne": "himalayan",
    "kainchi-dham": "himalayan", "tungnath-chandrashila": "himalayan", "morni-hills": "himalayan",
    "dehradun": "himalayan", "leh": "ladakh_spiti", "spiti": "ladakh_spiti",
    "rishikesh": "spiritual_ganga", "varanasi": "spiritual_ganga", "mathura-vrindavan": "spiritual_ganga",
    "agra": "heritage_plains", "chandigarh": "heritage_plains", "murthal": "heritage_plains",
    "damdama-sohna": "heritage_plains"
}

def create_gradient_canvas(width=1600, height=1000, top_color=(100, 140, 180), bottom_color=(240, 220, 200)):
    base = Image.new("RGB", (width, height), top_color)
    draw = ImageDraw.Draw(base)
    for y in range(height):
        ratio = y / height
        r = int(top_color[0] * (1 - ratio) + bottom_color[0] * ratio)
        g = int(top_color[1] * (1 - ratio) + bottom_color[1] * ratio)
        b = int(top_color[2] * (1 - ratio) + bottom_color[2] * ratio)
        draw.line([(0, y), (width, y)], fill=(r, g, b))
    return base

def add_paper_grain(image, intensity=0.04):
    w, h = image.size
    noise = Image.new("L", (w, h))
    pixels = noise.load()
    rand = random.Random(42)
    for y in range(0, h, 2):
        for x in range(0, w, 2):
            val = int(128 + rand.gauss(0, 30))
            val = max(0, min(255, val))
            pixels[x, y] = val
            if x + 1 < w: pixels[x + 1, y] = val
            if y + 1 < h: pixels[x, y + 1] = val
            if x + 1 < w and y + 1 < h: pixels[x + 1, y + 1] = val
    
    noise = noise.filter(ImageFilter.GaussianBlur(radius=0.8))
    noise_rgb = Image.merge("RGB", (noise, noise, noise))
    return Image.blend(image, noise_rgb, intensity)

def dhash(image, hash_size=8):
    im = image.convert('L').resize((hash_size + 1, hash_size), Image.Resampling.LANCZOS)
    pixels = list(im.getdata())
    diff = []
    for r in range(hash_size):
        for c in range(hash_size):
            diff.append(pixels[r * (hash_size + 1) + c] > pixels[r * (hash_size + 1) + c + 1])
    dec = 0
    hex_str = []
    for idx, val in enumerate(diff):
        if val: dec += 2**(idx % 8)
        if (idx % 8) == 7:
            hex_str.append(hex(dec)[2:].rjust(2, '0'))
            dec = 0
    return ''.join(hex_str)

print("Artwork generation engine primitives initialized.")
