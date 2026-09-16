import math
from typing import List, Dict, Any

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi/2.0)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2.0)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(r * c, 2)

def cluster_places_by_day(places: List[Any], num_days: int) -> List[List[Any]]:
    if not places or num_days <= 0:
        return [[] for _ in range(num_days)]
    
    # Sort places by geographic proximity (e.g. angle or k-means approximation)
    if len(places) <= num_days:
        return [[p] for p in places] + [[] for _ in range(num_days - len(places))]

    # Group by polar angle from geographic centroid
    avg_lat = sum(p.latitude for p in places) / len(places)
    avg_lng = sum(p.longitude for p in places) / len(places)

    def angle_from_centroid(p):
        return math.atan2(p.latitude - avg_lat, p.longitude - avg_lng)

    sorted_places = sorted(places, key=angle_from_centroid)
    
    # Partition into num_days clusters
    clusters: List[List[Any]] = [[] for _ in range(num_days)]
    chunk_size = math.ceil(len(sorted_places) / num_days)
    
    for i, p in enumerate(sorted_places):
        day_idx = min(i // chunk_size, num_days - 1)
        clusters[day_idx].append(p)
    
    return clusters

def order_route_nearest_neighbor(start_lat: float, start_lng: float, places: List[Any]) -> List[Any]:
    if not places:
        return []
    
    unvisited = list(places)
    ordered = []
    curr_lat, curr_lng = start_lat, start_lng

    while unvisited:
        # Find nearest unvisited place
        nearest_idx = 0
        min_dist = float('inf')
        for i, p in enumerate(unvisited):
            d = haversine_distance_km(curr_lat, curr_lng, p.latitude, p.longitude)
            if d < min_dist:
                min_dist = d
                nearest_idx = i
        
        chosen = unvisited.pop(nearest_idx)
        ordered.append(chosen)
        curr_lat, curr_lng = chosen.latitude, chosen.longitude

    return ordered
