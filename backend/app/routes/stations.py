from fastapi import APIRouter, Query
from typing import List, Dict
import math
import random

router = APIRouter()

# Haversine formula to calculate distance between two lat/lng points
def haversine(lat1, lon1, lat2, lon2):
    R = 6371.0 # Radius of earth in km
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = math.sin(dLat / 2) * math.sin(dLat / 2) + \
        math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * \
        math.sin(dLon / 2) * math.sin(dLon / 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

# Generate 20 synthetic stations around Bengaluru
def generate_synthetic_stations():
    base_lat, base_lng = 12.9716, 77.5946
    stations = []
    for i in range(1, 21):
        # random offset within ~15km
        lat_offset = random.uniform(-0.1, 0.1)
        lng_offset = random.uniform(-0.1, 0.1)
        
        load = random.uniform(10, 150)
        capacity = random.choice([50, 100, 150, 200])
        load_pct = load / capacity
        
        if load_pct > 0.8:
            status = 'RED'
        elif load_pct > 0.5:
            status = 'YELLOW'
        else:
            status = 'GREEN'
            
        stations.append({
            "id": i,
            "name": f"Station {i} Hub",
            "lat": base_lat + lat_offset,
            "lng": base_lng + lng_offset,
            "current_load": round(load, 1),
            "capacity": capacity,
            "status": status,
            "recommendation_flag": status == 'GREEN'
        })
    return stations

SYNTHETIC_STATIONS = generate_synthetic_stations()

@router.get("/nearby")
async def get_nearby_stations(lat: float = Query(...), lng: float = Query(...)):
    """Get top 5 nearest stations with load status."""
    
    # Calculate distances
    for station in SYNTHETIC_STATIONS:
        station["distance_km"] = round(haversine(lat, lng, station["lat"], station["lng"]), 2)
        
        # Simulate some dynamic load changes
        load_change = random.uniform(-5, 5)
        station["current_load"] = max(0, min(station["capacity"], round(station["current_load"] + load_change, 1)))
        
        load_pct = station["current_load"] / station["capacity"]
        if load_pct > 0.8:
            station["status"] = 'RED'
        elif load_pct > 0.5:
            station["status"] = 'YELLOW'
        else:
            station["status"] = 'GREEN'
            
        station["recommendation_flag"] = station["status"] == 'GREEN'

    # Sort by distance
    sorted_stations = sorted(SYNTHETIC_STATIONS, key=lambda x: x["distance_km"])
    
    return sorted_stations[:5]
