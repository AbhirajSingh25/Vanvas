import os
import sys
import json
import re
from pathlib import Path
from PIL import Image

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
BACKEND_DIR = ROOT_DIR / "backend"
FRONTEND_DIR = ROOT_DIR / "frontend"
PUBLIC_DIR = FRONTEND_DIR / "public"
BRAIN_DIR = Path(r"C:\Users\user\Desktop\..\..\..\Users\user\.gemini\antigravity-ide\brain").resolve()
if not BRAIN_DIR.exists():
    BRAIN_DIR = Path(r"C:\Users\user\.gemini\antigravity-ide\brain")

print(f"ROOT_DIR: {ROOT_DIR}")
print(f"BRAIN_DIR: {BRAIN_DIR} (exists: {BRAIN_DIR.exists()})")

# Read inventory
with open(BACKEND_DIR / "authoritative_entity_inventory.json", "r", encoding="utf-8") as f:
    inventory = json.load(f)

print(f"Loaded {len(inventory)} inventory records.")
