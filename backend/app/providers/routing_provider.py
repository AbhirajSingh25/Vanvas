"""
Routing Provider Architecture for VANVAS Road Trip Engine.
Provides swappable, real road-network routing with truthful data provenance.
Supports keyless OpenStreetMap / OSRM routing and explicit unavailable status.
Never fabricates road geometry or presents straight-line approximations as real roads.
"""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, field
import urllib.request
import urllib.parse
import json
import logging
import math

logger = logging.getLogger("vanvas.routing")


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate great-circle distance between two points on the earth."""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2.0) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c


@dataclass
class RouteLeg:
    origin: str
    destination: str
    origin_lat: float
    origin_lng: float
    dest_lat: float
    dest_lng: float
    distance_km: float
    duration_minutes: float
    geometry: List[List[float]] = field(default_factory=list)  # [[lat, lng], ...]
    departure_time: str = "06:30"
    arrival_time: str = "12:00"
    route_source: str = "OSRM_OPENSTREETMAP"
    is_live: bool = True
    theme: str = ""
    summary: str = ""


@dataclass
class RouteResult:
    distance_km: float
    duration_minutes: float
    geometry: List[List[float]] = field(default_factory=list)  # [[lat, lng], ...]
    legs: List[RouteLeg] = field(default_factory=list)
    route_source: str = "OSRM_OPENSTREETMAP"  # OSRM_OPENSTREETMAP, LIVE_PROVIDER, ROUTING_PROVIDER_UNAVAILABLE
    is_live: bool = True
    status: str = "OK"  # OK, ROUTING_PROVIDER_UNAVAILABLE
    warning: Optional[str] = None


class BaseRoutingProvider(ABC):
    """Abstract base class for all road routing providers."""

    @abstractmethod
    def route(
        self,
        origin_coords: Tuple[float, float],
        destination_coords: Tuple[float, float],
        origin_name: str = "Origin",
        destination_name: str = "Destination",
        waypoints: Optional[List[Tuple[float, float]]] = None,
    ) -> RouteResult:
        """Calculate road route between origin, waypoints, and destination."""
        pass


class OSRMKeylessRoutingProvider(BaseRoutingProvider):
    """
    OpenStreetMap / OSRM Public Routing Provider (Keyless).
    Queries OSRM driving service to obtain actual highway geometry, legs, distance, and duration.
    """

    DEFAULT_BASE_URL = "https://router.project-osrm.org/route/v1/driving"

    def __init__(self, base_url: Optional[str] = None, timeout_seconds: float = 4.0):
        self.base_url = (base_url or self.DEFAULT_BASE_URL).rstrip("/")
        self.timeout_seconds = timeout_seconds

    def route(
        self,
        origin_coords: Tuple[float, float],
        destination_coords: Tuple[float, float],
        origin_name: str = "Origin",
        destination_name: str = "Destination",
        waypoints: Optional[List[Tuple[float, float]]] = None,
    ) -> RouteResult:
        """
        Request driving route from OSRM.
        Format: /driving/{lon1},{lat1};{lon2},{lat2}?overview=full&geometries=geojson&steps=true
        """
        o_lat, o_lng = origin_coords
        d_lat, d_lng = destination_coords

        coords_parts = [f"{o_lng:.6f},{o_lat:.6f}"]
        if waypoints:
            for w_lat, w_lng in waypoints:
                coords_parts.append(f"{w_lng:.6f},{w_lat:.6f}")
        coords_parts.append(f"{d_lng:.6f},{d_lat:.6f}")

        coords_str = ";".join(coords_parts)
        url = f"{self.base_url}/{coords_str}?overview=full&geometries=geojson&steps=true&annotations=distance,duration"

        try:
            req = urllib.request.Request(
                url,
                headers={
                    "User-Agent": "VANVAS-RoadTrip-Engine/1.0 (https://vanvas.in)",
                    "Accept": "application/json",
                },
            )
            with urllib.request.urlopen(req, timeout=self.timeout_seconds) as response:
                if response.status != 200:
                    raise ValueError(f"OSRM returned HTTP {response.status}")
                data = json.loads(response.read().decode("utf-8"))

            if data.get("code") != "Ok" or not data.get("routes"):
                raise ValueError(f"OSRM returned no route: {data.get('code')}")

            route_data = data["routes"][0]
            distance_meters = route_data.get("distance", 0.0)
            duration_seconds = route_data.get("duration", 0.0)
            distance_km = round(distance_meters / 1000.0, 1)
            duration_minutes = round(duration_seconds / 60.0, 1)

            # Convert GeoJSON [lng, lat] coordinates to [lat, lng]
            geojson_geom = route_data.get("geometry", {})
            raw_coords = geojson_geom.get("coordinates", [])
            lat_lng_geometry: List[List[float]] = []
            for pt in raw_coords:
                if len(pt) >= 2:
                    lat_lng_geometry.append([round(pt[1], 5), round(pt[0], 5)])

            # Build leg items
            osrm_legs = route_data.get("legs", [])
            legs_list: List[RouteLeg] = []
            
            if osrm_legs:
                for idx, leg_item in enumerate(osrm_legs):
                    leg_dist_km = round(leg_item.get("distance", 0.0) / 1000.0, 1)
                    leg_dur_mins = round(leg_item.get("duration", 0.0) / 60.0, 1)
                    leg_geom: List[List[float]] = []
                    
                    # Extract leg steps geometry if present
                    for step in leg_item.get("steps", []):
                        step_coords = step.get("geometry", {}).get("coordinates", [])
                        for pt in step_coords:
                            if len(pt) >= 2:
                                leg_geom.append([round(pt[1], 5), round(pt[0], 5)])
                    
                    if not leg_geom and lat_lng_geometry:
                        leg_geom = lat_lng_geometry

                    l_orig = origin_name if idx == 0 else f"Waypoint {idx}"
                    l_dest = destination_name if idx == len(osrm_legs) - 1 else f"Waypoint {idx + 1}"
                    
                    legs_list.append(
                        RouteLeg(
                            origin=l_orig,
                            destination=l_dest,
                            origin_lat=o_lat if idx == 0 else (waypoints[idx - 1][0] if waypoints else o_lat),
                            origin_lng=o_lng if idx == 0 else (waypoints[idx - 1][1] if waypoints else o_lng),
                            dest_lat=d_lat if idx == len(osrm_legs) - 1 else (waypoints[idx][0] if waypoints else d_lat),
                            dest_lng=d_lng if idx == len(osrm_legs) - 1 else (waypoints[idx][1] if waypoints else d_lng),
                            distance_km=leg_dist_km,
                            duration_minutes=leg_dur_mins,
                            geometry=leg_geom,
                            departure_time="06:30",
                            arrival_time="12:30",
                            route_source="OSRM_OPENSTREETMAP",
                            is_live=True,
                            summary=leg_item.get("summary", ""),
                        )
                    )
            else:
                legs_list.append(
                    RouteLeg(
                        origin=origin_name,
                        destination=destination_name,
                        origin_lat=o_lat,
                        origin_lng=o_lng,
                        dest_lat=d_lat,
                        dest_lng=d_lng,
                        distance_km=distance_km,
                        duration_minutes=duration_minutes,
                        geometry=lat_lng_geometry,
                        departure_time="06:30",
                        arrival_time="12:30",
                        route_source="OSRM_OPENSTREETMAP",
                        is_live=True,
                    )
                )

            return RouteResult(
                distance_km=distance_km,
                duration_minutes=duration_minutes,
                geometry=lat_lng_geometry,
                legs=legs_list,
                route_source="OSRM_OPENSTREETMAP",
                is_live=True,
                status="OK",
                warning=None,
            )

        except Exception as err:
            logger.warning(f"OSRM live routing call failed ({err}). Returning ROUTING_PROVIDER_UNAVAILABLE.")
            # Transparently handle failure without fabricating geometry or pretending haversine is a real road
            straight_dist = haversine_km(o_lat, o_lng, d_lat, d_lng)
            # Baseline estimation
            est_km = round(straight_dist * 1.25, 1)
            est_mins = round((est_km / 55.0) * 60.0, 1)

            fallback_leg = RouteLeg(
                origin=origin_name,
                destination=destination_name,
                origin_lat=o_lat,
                origin_lng=o_lng,
                dest_lat=d_lat,
                dest_lng=d_lng,
                distance_km=est_km,
                duration_minutes=est_mins,
                geometry=[],  # Empty geometry: NEVER fabricate false road lines
                departure_time="06:30",
                arrival_time="14:00",
                route_source="ROUTING_PROVIDER_UNAVAILABLE",
                is_live=False,
                summary="Straight-line distance baseline (Road routing provider unreachable)",
            )

            return RouteResult(
                distance_km=est_km,
                duration_minutes=est_mins,
                geometry=[],  # Empty geometry: NEVER fabricate false road lines
                legs=[fallback_leg],
                route_source="ROUTING_PROVIDER_UNAVAILABLE",
                is_live=False,
                status="ROUTING_PROVIDER_UNAVAILABLE",
                warning="Live road routing provider currently unavailable. Route geometry omitted to prevent false visualization.",
            )


class RoutingProviderDispatcher:
    """
    Factory / Dispatcher for acquiring the active routing provider.
    """

    _instance: Optional[BaseRoutingProvider] = None

    @classmethod
    def get_provider(cls) -> BaseRoutingProvider:
        if cls._instance is None:
            cls._instance = OSRMKeylessRoutingProvider()
        return cls._instance

    @classmethod
    def set_provider(cls, provider: BaseRoutingProvider) -> None:
        cls._instance = provider
