"""
VANVAS AI Tool Specifications
Function definitions adhering to standard OpenAPI / JSON Schema format for tool-augmented generation.
These ensure deterministic systems remain strictly deterministic.
"""
from typing import List, Dict, Any

VANVAS_COPILOT_TOOLS: List[Dict[str, Any]] = [
    {
        "name": "get_destination_info",
        "description": "Fetch verified editorial and geographic sanctuary details for a curated Himalayan or Indian destination.",
        "parameters": {
            "type": "object",
            "properties": {
                "destination_slug": {
                    "type": "string",
                    "description": "Slug of the destination (e.g. 'mussoorie', 'manali', 'rishikesh', 'kasol', 'udaipur', 'leh')."
                }
            },
            "required": ["destination_slug"]
        }
    },
    {
        "name": "get_nearby_places",
        "description": "Retrieve live verified POIs and landmarks near specific geographic coordinates.",
        "parameters": {
            "type": "object",
            "properties": {
                "latitude": {
                    "type": "number",
                    "description": "Latitude coordinate of search center"
                },
                "longitude": {
                    "type": "number",
                    "description": "Longitude coordinate of search center"
                },
                "radius_km": {
                    "type": "number",
                    "description": "Search radius in kilometers (default 15.0)",
                    "default": 15.0
                },
                "category": {
                    "type": "string",
                    "description": "Optional category filter ('cafes', 'nature', 'spiritual', 'food', 'stay', 'viewpoint')",
                }
            },
            "required": ["latitude", "longitude"]
        }
    },
    {
        "name": "get_weather_forecast",
        "description": "Fetch live meteorological forecast, mountain advisory, and temperature for a given coordinate.",
        "parameters": {
            "type": "object",
            "properties": {
                "latitude": {
                    "type": "number",
                    "description": "Latitude coordinate"
                },
                "longitude": {
                    "type": "number",
                    "description": "Longitude coordinate"
                }
            },
            "required": ["latitude", "longitude"]
        }
    },
    {
        "name": "get_quick_plan",
        "description": "Generate a spontaneous time-boxed micro-itinerary for free hours in a valley.",
        "parameters": {
            "type": "object",
            "properties": {
                "trip_id": {
                    "type": "string",
                    "description": "The active trip ID"
                },
                "hours_available": {
                    "type": "number",
                    "description": "Available free time window in hours (1.0, 2.0, 3.0, 4.0)"
                }
            },
            "required": ["trip_id", "hours_available"]
        }
    }
]
