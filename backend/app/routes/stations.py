from fastapi import APIRouter, Query
from typing import List, Dict
import math
import random

router = APIRouter()

import asyncio
from datetime import datetime
from pydantic import BaseModel
import httpx

router = APIRouter()

# Haversine formula
def haversine(lat1, lon1, lat2, lon2):
    R = 6371.0
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = math.sin(dLat / 2) * math.sin(dLat / 2) + \
        math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * \
        math.sin(dLon / 2) * math.sin(dLon / 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

# Generate 20 synthetic stations
def generate_synthetic_stations():
    base_lat, base_lng = 12.9716, 77.5946
    stations = []
    for i in range(1, 21):
        lat_offset = random.uniform(-0.1, 0.1)
        lng_offset = random.uniform(-0.1, 0.1)
        capacity = random.choice([50, 100, 150, 200])
        stations.append({
            "id": i,
            "name": f"Station {chr(64 + (i % 26) + 1)}{i%9+1} Hub",
            "zone_id": (i % 5) + 1,
            "lat": base_lat + lat_offset,
            "lng": base_lng + lng_offset,
            "current_load": random.uniform(10, capacity * 0.4),
            "capacity": capacity,
            "queue_time": 0,
            "status": 'GREEN',
            "recommendation_flag": True
        })
    return stations

PERSISTENT_STATIONS = generate_synthetic_stations()

async def simulate_stations():
    """Background task to realistically fluctuate station demands every 5 seconds"""
    while True:
        try:
            hour = datetime.now().hour
            is_peak = 18 <= hour <= 22
            
            for station in PERSISTENT_STATIONS:
                # Fluctuate demand realistically
                change = random.uniform(-5, 8) if is_peak else random.uniform(-8, 5)
                new_load = max(0, min(station["capacity"], station["current_load"] + change))
                station["current_load"] = round(new_load, 1)
                
                # Compute Utilization
                load_pct = new_load / station["capacity"]
                if load_pct > 0.8:
                    station["status"] = 'RED'
                    station["queue_time"] = int((load_pct - 0.8) * 100) + random.randint(5, 15)
                elif load_pct > 0.5:
                    station["status"] = 'YELLOW'
                    station["queue_time"] = random.randint(1, 5)
                else:
                    station["status"] = 'GREEN'
                    station["queue_time"] = 0
                    
                station["available_slots"] = max(0, int((1 - load_pct) * (station["capacity"] / 10)))
                station["predicted_peak_time"] = "8:30 PM" if hour < 20 else "Tomorrow 9:00 AM"
                station["recommendation"] = "Avoid" if load_pct > 0.8 else "Optimal" if load_pct < 0.5 else "Acceptable"
                station["recommendation_flag"] = station["status"] == 'GREEN'

            await asyncio.sleep(5)
        except Exception as e:
            await asyncio.sleep(5)

class GeolocationRequest(BaseModel):
    lat: float
    lng: float

@router.get("/nearby")
async def get_nearby_stations(lat: float = Query(...), lng: float = Query(...)):
    """Get top 3 nearest stations with map intelligence."""
    
    # Calculate distances
    for station in PERSISTENT_STATIONS:
        station["distance_km"] = round(haversine(lat, lng, station["lat"], station["lng"]), 2)

    # Sort by distance
    sorted_stations = sorted(PERSISTENT_STATIONS, key=lambda x: x["distance_km"])
    top_3 = sorted_stations[:3]
    
    # Highlight best option
    best_option = min(top_3, key=lambda x: x["queue_time"])
    for s in top_3:
        if s["id"] == best_option["id"]:
            s["is_best_option"] = True
        else:
            s["is_best_option"] = False
            
    return top_3

@router.get("/reverse-geocode")
async def reverse_geocode(lat: float, lng: float):
    """Get city name from lat/lng. Validates if it's in India."""
    # Simple bounding box for India roughly: lat 8 to 37, lng 68 to 97
    if not (8 <= lat <= 37 and 68 <= lng <= 97):
        return {"city": "Unknown (Outside Region)", "valid": False}
        
    try:
        # Fallback to user-selected or open-source geocoding API
        # Using OpenStreetMap Nominatim API (free, no key needed for lightweight use)
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lng}&format=json",
                headers={"User-Agent": "GridSense-AI"}
            )
            data = resp.json()
            city = data.get("address", {}).get("city") or data.get("address", {}).get("town") or data.get("address", {}).get("state_district") or "Bengaluru"
            return {"city": city, "valid": True}
    except Exception:
        return {"city": "Bengaluru", "valid": True}
