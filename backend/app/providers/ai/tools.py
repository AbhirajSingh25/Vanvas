"""
VANVAS AI Tool Specifications
Function definitions adhering to standard OpenAPI / JSON Schema format for tool-augmented generation.
These ensure deterministic systems remain strictly deterministic.
"""
from typing import List, Dict, Any

VANVAS_COPILOT_TOOLS: List[Dict[str, Any]] = [
    {
        "name": "get_destination_info",
        "description": "Fetch verified editorial overview, altitude, region, climate, best time to visit, and curated highlights for a destination.",
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
        "name": "get_place",
        "description": "Get verified details for a specific canonical place by its ID or slug.",
        "parameters": {
            "type": "object",
            "properties": {
                "place_id": {
                    "type": "string",
                    "description": "Canonical place ID or slug (e.g. 'mussoorie_landour_bakehouse', 'manali_hadimba_temple')."
                }
            },
            "required": ["place_id"]
        }
    },
    {
        "name": "search_places",
        "description": "Search verified curated places across destinations or within a specific destination by query and category.",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Search query or keyword (e.g. 'bakery', 'waterfall', 'viewpoint', 'temple', 'trail')."
                },
                "destination_slug": {
                    "type": "string",
                    "description": "Optional destination slug to filter search within (e.g. 'mussoorie')."
                },
                "category": {
                    "type": "string",
                    "description": "Optional category filter ('Café', 'Nature', 'Culture', 'Food', 'Attraction', 'Essential')."
                }
            },
            "required": ["query"]
        }
    },
    {
        "name": "get_nearby_places",
        "description": "Retrieve verified landmarks and points of interest near specific coordinates.",
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
                },
                "radius_km": {
                    "type": "number",
                    "description": "Search radius in kilometers (default 15.0)",
                    "default": 15.0
                },
                "category": {
                    "type": "string",
                    "description": "Optional category filter ('cafes', 'nature', 'spiritual', 'food', 'stay', 'viewpoint')."
                }
            },
            "required": ["latitude", "longitude"]
        }
    },
    {
        "name": "get_weather_forecast",
        "description": "Fetch live meteorological forecast, mountain advisory, temperature, and rain status for coordinates from Open-Meteo.",
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
        "name": "calculate_route",
        "description": "Calculate distance and travel time between two coordinates including mountain winding factor.",
        "parameters": {
            "type": "object",
            "properties": {
                "origin_lat": {"type": "number", "description": "Origin latitude"},
                "origin_lng": {"type": "number", "description": "Origin longitude"},
                "dest_lat": {"type": "number", "description": "Destination latitude"},
                "dest_lng": {"type": "number", "description": "Destination longitude"}
            },
            "required": ["origin_lat", "origin_lng", "dest_lat", "dest_lng"]
        }
    },
    {
        "name": "get_quick_plan",
        "description": "Generate a spontaneous time-boxed micro-itinerary for available free hours.",
        "parameters": {
            "type": "object",
            "properties": {
                "trip_id": {
                    "type": "string",
                    "description": "The active trip ID"
                },
                "hours_available": {
                    "type": "number",
                    "description": "Available free time window in hours (1.0, 2.0, 3.0, 4.0)",
                    "default": 3.0
                },
                "variation": {
                    "type": "integer",
                    "description": "Optional variation counter for alternate route selections",
                    "default": 0
                }
            },
            "required": ["trip_id"]
        }
    },
    {
        "name": "get_trip",
        "description": "Get verified summary of the user's active trip including destination, dates, and itinerary days.",
        "parameters": {
            "type": "object",
            "properties": {
                "trip_id": {
                    "type": "string",
                    "description": "The unique trip ID"
                }
            },
            "required": ["trip_id"]
        }
    },
    {
        "name": "get_user_preferences",
        "description": "Retrieve user travel style, wake up time, activity intensity, and dietary preferences.",
        "parameters": {
            "type": "object",
            "properties": {
                "user_id": {
                    "type": "string",
                    "description": "Optional user ID (defaults to current authenticated user)"
                }
            }
        }
    },
    {
        "name": "get_budget_summary",
        "description": "Fetch verified trip budget total, amount spent, remaining balance, and expense breakdown by category.",
        "parameters": {
            "type": "object",
            "properties": {
                "trip_id": {
                    "type": "string",
                    "description": "The trip ID to calculate budget for"
                }
            },
            "required": ["trip_id"]
        }
    },
    {
        "name": "save_place",
        "description": "Save a verified canonical place to the authenticated user's travel collection.",
        "parameters": {
            "type": "object",
            "properties": {
                "place_id": {
                    "type": "string",
                    "description": "The canonical place ID or slug (e.g. 'mussoorie_landour_bakehouse', 'manali_hadimba_temple')."
                }
            },
            "required": ["place_id"]
        }
    },
    {
        "name": "add_place_to_itinerary",
        "description": "Add a verified canonical place to a specific day of the user's active authorized trip itinerary.",
        "parameters": {
            "type": "object",
            "properties": {
                "trip_id": {
                    "type": "string",
                    "description": "The active authorized trip ID."
                },
                "place_id": {
                    "type": "string",
                    "description": "The canonical place ID or slug to add."
                },
                "day": {
                    "type": "integer",
                    "description": "The day number in the itinerary (e.g. 1, 2, 3)."
                }
            },
            "required": ["trip_id", "place_id", "day"]
        }
    },
    {
        "name": "remove_place_from_itinerary",
        "description": "Remove an activity, spot, or place from the user's active trip itinerary schedule.",
        "parameters": {
            "type": "object",
            "properties": {
                "trip_id": {
                    "type": "string",
                    "description": "The active authorized trip ID."
                },
                "place_name": {
                    "type": "string",
                    "description": "Name or title of the place to remove (e.g. 'Hadimba Temple', 'Cafe 1947')."
                },
                "place_id": {
                    "type": "string",
                    "description": "Optional canonical place ID to remove."
                }
            },
            "required": ["trip_id"]
        }
    },
    {
        "name": "adjust_trip_pace_or_budget",
        "description": "Adjust trip pacing (Relaxed/Slow vs Packed/Fast), travel style (Budget vs Luxury), or total budget.",
        "parameters": {
            "type": "object",
            "properties": {
                "trip_id": {
                    "type": "string",
                    "description": "The active authorized trip ID."
                },
                "activity_intensity": {
                    "type": "string",
                    "description": "Pace or intensity: 'Relaxed', 'Balanced', 'Packed'."
                },
                "travel_style": {
                    "type": "string",
                    "description": "Style: 'Budget', 'Balanced', 'Comfort', 'Premium', 'Luxury'."
                },
                "budget": {
                    "type": "number",
                    "description": "New total trip budget in INR."
                }
            },
            "required": ["trip_id"]
        }
    },
    {
        "name": "change_trip_dates",
        "description": "Adjust total days or duration of the active authorized trip.",
        "parameters": {
            "type": "object",
            "properties": {
                "trip_id": {
                    "type": "string",
                    "description": "The active authorized trip ID."
                },
                "num_days": {
                    "type": "integer",
                    "description": "New trip duration in days (e.g. 1 for one-day, 2 for weekend, 3, 5)."
                }
            },
            "required": ["trip_id", "num_days"]
        }
    },
    {
        "name": "search_stays",
        "description": "Search verified curated and live accommodations in a destination with truthful pricing and provenance status.",
        "parameters": {
            "type": "object",
            "properties": {
                "destination": {
                    "type": "string",
                    "description": "Destination name or slug (e.g. 'manali', 'landour', 'dharamshala', 'goa')."
                },
                "max_price": {
                    "type": "number",
                    "description": "Optional maximum budget per night in INR."
                },
                "style": {
                    "type": "string",
                    "description": "Optional accommodation style ('Hostel', 'Homestay', 'Boutique', 'Heritage', 'Luxury', 'Camp')."
                }
            },
            "required": ["destination"]
        }
    },
    {
        "name": "search_transport",
        "description": "Retrieve verified curated mountain transit routes and bus/train schedules for an origin and destination.",
        "parameters": {
            "type": "object",
            "properties": {
                "destination": {
                    "type": "string",
                    "description": "Destination name or slug (e.g. 'manali', 'rishikesh', 'kasol')."
                },
                "origin_city": {
                    "type": "string",
                    "description": "Origin departure city (e.g. 'Delhi', 'Chandigarh').",
                    "default": "Delhi"
                },
                "transport_type": {
                    "type": "string",
                    "description": "Optional transport filter ('Bus', 'Volvo', 'Train', 'Taxi')."
                }
            },
            "required": ["destination"]
        }
    },
    {
        "name": "search_rentals",
        "description": "Search verified valley mobility, scooter, motorcycle, and bicycle rental options for a destination.",
        "parameters": {
            "type": "object",
            "properties": {
                "destination": {
                    "type": "string",
                    "description": "Destination name or slug (e.g. 'manali', 'leh', 'udaipur', 'goa')."
                },
                "vehicle_type": {
                    "type": "string",
                    "description": "Optional vehicle type ('Scooter', 'Royal Enfield', 'Himalayan Bike', 'Bicycle', 'Car')."
                }
            },
            "required": ["destination"]
        }
    },
    {
        "name": "get_place_reviews",
        "description": "Retrieve authentic published community reviews and rating aggregates written by real VANVAS travellers for a place.",
        "parameters": {
            "type": "object",
            "properties": {
                "place_id": {
                    "type": "string",
                    "description": "Canonical place ID (e.g. 'manali_hadimba_temple', 'mussoorie_landour_bakehouse', or 'osm-12345')."
                }
            },
            "required": ["place_id"]
        }
    },
    {
        "name": "search_commerce_offers",
        "description": "Search verified provider offers and travel options with explicit booking capabilities (DISCOVERY_ONLY, EXTERNAL_CHECKOUT, IN_APP_BOOKING, UNAVAILABLE). Preserves unknown prices/availability.",
        "parameters": {
            "type": "object",
            "properties": {
                "destination": {
                    "type": "string",
                    "description": "Destination name or slug (e.g. 'manali', 'mussoorie', 'rishikesh')."
                },
                "product_type": {
                    "type": "string",
                    "description": "Optional product filter ('stay', 'transport', 'rental', 'activity', 'place')."
                }
            },
            "required": ["destination"]
        }
    },
    {
        "name": "get_user_bookings",
        "description": "Fetch verified booking history and confirmation records for the current authenticated user. Never fabricate booking confirmations.",
        "parameters": {
            "type": "object",
            "properties": {
                "booking_id": {
                    "type": "string",
                    "description": "Optional specific booking ID or confirmation reference to check."
                }
            }
        }
    }
]

