import os
import argparse
import asyncio
import json
import logging
from typing import List, Dict, Any

from app.core.config import settings
from app.providers.place_artwork_generator import get_place_artwork_generator

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("vanvas.artwork.batch")

# Curated High-Value Landmarks for Offline Batch Production
PRIORITY_LANDMARKS: Dict[str, List[Dict[str, str]]] = {
    "mussoorie": [
        {"name": "Landour Bakehouse", "category": "Cafés & Bakery", "locality": "Landour, Sisters Bazaar"},
        {"name": "Lal Tibba", "category": "Nature & Trails", "locality": "Landour Ridge"},
        {"name": "Kempty Falls", "category": "Nature & Trails", "locality": "Kempty Road"},
        {"name": "Gun Hill", "category": "Culture & Heritage", "locality": "Mall Road Peak"},
        {"name": "Camel's Back Road", "category": "Nature & Trails", "locality": "Kulri Promenade"},
        {"name": "Mussoorie Mall Road", "category": "Culture & Heritage", "locality": "Town Center"},
        {"name": "Sir George Everest House", "category": "Nature & Trails", "locality": "Park Estate"},
        {"name": "Cloud's End", "category": "Culture & Heritage", "locality": "Hathipaon Forest"},
        {"name": "Landour", "category": "Culture & Heritage", "locality": "Upper Cantonment"}
    ],
    "manali": [
        {"name": "Hadimba Devi Temple", "category": "Culture & Heritage", "locality": "Dhungri Pine Forest"},
        {"name": "Solang Valley", "category": "Adventure & Sport", "locality": "Solang"},
        {"name": "Old Manali Village", "category": "Culture & Heritage", "locality": "Old Manali"},
        {"name": "Jogini Waterfall", "category": "Nature & Trails", "locality": "Vashisht Trail"}
    ],
    "rishikesh": [
        {"name": "Laxman Jhula", "category": "Culture & Heritage", "locality": "Tapovan Riverfront"},
        {"name": "Triveni Ghat", "category": "Spiritual & Heritage", "locality": "Mayakund"},
        {"name": "Beatles Ashram", "category": "Culture & Heritage", "locality": "Swarg Ashram"}
    ],
    "varanasi": [
        {"name": "Assi Ghat", "category": "Spiritual & Heritage", "locality": "Assi Riverfront"},
        {"name": "Dashashwamedh Ghat", "category": "Spiritual & Heritage", "locality": "Old Kashi"},
        {"name": "Manikarnika Ghat", "category": "Spiritual & Heritage", "locality": "Heritage Cremation Ghat"}
    ],
    "udaipur": [
        {"name": "City Palace Udaipur", "category": "Culture & Heritage", "locality": "Lake Pichola East"},
        {"name": "Lake Pichola", "category": "Nature & Trails", "locality": "Mewar Lakefront"},
        {"name": "Jag Mandir", "category": "Culture & Heritage", "locality": "Island Palace"}
    ]
}

async def run_batch(destination: str, validate_only: bool = False):
    generator = get_place_artwork_generator()
    logger.info(f"Starting artwork batch workflow for destination: {destination} (Provider: {settings.PLACE_ARTWORK_PROVIDER})")
    
    dests_to_process = list(PRIORITY_LANDMARKS.keys()) if destination == "all" else [destination.lower()]
    
    total_processed = 0
    total_persisted = 0
    total_unconfigured = 0
    
    for dest in dests_to_process:
        landmarks = PRIORITY_LANDMARKS.get(dest, [])
        logger.info(f"Processing {len(landmarks)} priority landmarks for {dest.upper()}...")
        
        for item in landmarks:
            total_processed += 1
            fact_sheet = generator.format_visual_fact_sheet(
                place_name=item["name"],
                destination_slug=dest,
                category=item["category"],
                locality=item.get("locality")
            )
            
            res = await generator.generate_place_artwork(
                place_name=item["name"],
                destination_slug=dest,
                category=item["category"],
                locality=item.get("locality")
            )
            
            if res.get("status") == "persisted":
                total_persisted += 1
                logger.info(f" [PERSISTED] {dest}/{item['name']} -> {res['image_url']}")
            else:
                total_unconfigured += 1
                logger.info(f" [UNCONFIGURED/DISABLED] {dest}/{item['name']}: {res.get('message')}")

    logger.info("=== BATCH RUN SUMMARY ===")
    logger.info(f"Total Landmarks Processed: {total_processed}")
    logger.info(f"Persisted Artwork Assets:  {total_persisted}")
    logger.info(f"Unconfigured / Disabled:   {total_unconfigured}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="VANVAS Offline Artwork Generation & Validation Batch CLI")
    parser.add_argument("--destination", type=str, default="mussoorie", help="Destination slug or 'all'")
    parser.add_argument("--validate-only", action="store_true", help="Only validate existing assets")
    args = parser.parse_args()
    
    asyncio.run(run_batch(args.destination, args.validate_only))
