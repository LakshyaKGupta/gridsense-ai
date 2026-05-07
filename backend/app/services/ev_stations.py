import math
import httpx
import os
import re
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from app.services.zone_catalog import nearest_zone
from app.services.simulation_engine import generate_states_for_stations, register_osm_stations

REAL_BACKUP_STATIONS = [
    {"id": 900001, "name": "Ather Charging Grid", "lat": 12.9756680, "lng": 77.6413089, "operator": "Ather Energy", "source": "backup_osm"},
    {"id": 900002, "name": "Ather Charging Station", "lat": 12.9311453, "lng": 77.6238461, "operator": "ChargePoint", "source": "backup_osm"},
    {"id": 900003, "name": "Battery Swap", "lat": 12.9285835, "lng": 77.6241904, "operator": "ChargePoint", "source": "backup_osm"},
    {"id": 900004, "name": "Battery Swapping Station", "lat": 12.8894274, "lng": 77.5563647, "operator": "Battery Swap", "source": "backup_osm"},
    {"id": 900005, "name": "Honda e:swap", "lat": 13.0000143, "lng": 77.5499059, "operator": "Honda e:swap", "source": "backup_osm"},
    {"id": 900006, "name": "Honda e:swap", "lat": 12.9781045, "lng": 77.6389105, "operator": "Honda e:swap", "source": "backup_osm"},
    {"id": 900007, "name": "Honda e:swap", "lat": 12.9383537, "lng": 77.5802162, "operator": "Honda e:swap", "source": "backup_osm"},
    {"id": 900008, "name": "Honda e:swap", "lat": 12.9217078, "lng": 77.5805052, "operator": "Honda e:swap", "source": "backup_osm"},
    {"id": 900009, "name": "Honda e:swap", "lat": 13.0330528, "lng": 77.5337570, "operator": "Honda e:swap", "source": "backup_osm"},
    {"id": 900010, "name": "Honda e:swap", "lat": 12.9934270, "lng": 77.7043141, "operator": "Honda e:swap", "source": "backup_osm"},
    {"id": 900011, "name": "Honda e:swap", "lat": 12.9861844, "lng": 77.6156891, "operator": "Honda e:swap", "source": "backup_osm"},
    {"id": 900012, "name": "Honda e:swap", "lat": 13.0235213, "lng": 77.5497316, "operator": "Honda e:swap", "source": "backup_osm"},
    {"id": 900013, "name": "Honda e:swap", "lat": 13.0235317, "lng": 77.5497115, "operator": "Honda e:swap", "source": "backup_osm"},
    {"id": 900014, "name": "inGO", "lat": 12.9712776, "lng": 77.6078832, "operator": "inGO", "source": "backup_osm"},
    {"id": 900015, "name": "Jio BP", "lat": 13.0878799, "lng": 77.6601841, "operator": "Jio BP", "source": "backup_osm"},
    {"id": 900016, "name": "Magenta ChargeGrid Charging Station", "lat": 12.9154635, "lng": 77.6158909, "operator": "Magenta", "source": "backup_osm"},
    {"id": 900017, "name": "Ola Hyper Charger", "lat": 12.9337755, "lng": 77.6236693, "operator": "Ola Electric", "source": "backup_osm"},
    {"id": 900018, "name": "Ola Hypercharger", "lat": 12.9322172, "lng": 77.6142725, "operator": "Ola Electric", "source": "backup_osm"},
    {"id": 900019, "name": "Pulse", "lat": 12.9805484, "lng": 77.5978893, "operator": "Pulse", "source": "backup_osm"},
]

class EVStationFetcher:
    """Fetches real EV charging stations from OpenStreetMap via Overpass API"""
    
    OVERPASS_URL = "https://overpass-api.de/api/interpreter"
    
    def __init__(self):
        self.cached_stations: List[Dict] = []
        self.last_fetch: Optional[datetime] = None

    def _normalize_station_name(self, name: str, operator: str, station_id: int) -> str:
        english_variant = name.strip()
        if re.search(r"[^\x00-\x7F]", english_variant):
            ascii_only = re.sub(r"[^\x00-\x7F]+", " ", english_variant)
            ascii_only = re.sub(r"\s+", " ", ascii_only).strip()
            if len(ascii_only) >= 6:
                english_variant = ascii_only
            else:
                english_variant = f"{operator or 'EV'} Charging Hub {station_id}"

        english_variant = re.sub(r"\s+", " ", english_variant).strip(" -")
        if not english_variant:
            english_variant = f"{operator or 'EV'} Charging Hub {station_id}"
        return english_variant
    
    async def fetch_bengaluru_stations(self) -> List[Dict]:
        """Fetch EV stations in Bengaluru area using Overpass API"""
        # Check cache first (60 min TTL)
        if self.cached_stations and self.last_fetch:
            age = (datetime.now() - self.last_fetch).total_seconds()
            if age < 3600:
                return self.cached_stations
        
        try:
            # Overpass query for EV charging stations in Bengaluru bbox
            query = """
            [out:json][timeout:25];
            (
              node["amenity"="charging_station"](12.8,77.4,13.2,77.9);
              way["amenity"="charging_station"](12.8,77.4,13.2,77.9);
            );
            out center;
            """
            
            async with httpx.AsyncClient(timeout=12.0) as client:
                response = await client.post(
                    self.OVERPASS_URL,
                    data={"data": query},
                    headers={"Content-Type": "application/x-www-form-urlencoded"}
                )
                
                if response.status_code == 200:
                    data = response.json()
                    stations = []
                    
                    for element in data.get("elements", []):
                        if element.get("type") == "node" or element.get("type") == "way":
                            lat = element.get("lat") or element.get("center", {}).get("lat")
                            lon = element.get("lon") or element.get("center", {}).get("lon")
                            
                            if lat and lon:
                                tags = element.get("tags", {})
                                name = tags.get("name:en") or tags.get("name") or tags.get("brand") or f"EV Station {element['id']}"
                                operator = tags.get("operator") or "Unknown"
                                
                                stations.append({
                                    "id": element["id"],
                                    "name": self._normalize_station_name(name, operator, element["id"]),
                                    "lat": lat,
                                    "lng": lon,
                                    "operator": operator,
                                    "source": "osm"
                                })
                    
                    if stations:
                        self.cached_stations = register_osm_stations(stations)
                        self.last_fetch = datetime.now()
                        return self.cached_stations
                    
        except Exception as e:
            print(f"Overpass API error: {e}")
        
        if not self.cached_stations:
            self.cached_stations = register_osm_stations(REAL_BACKUP_STATIONS)
            self.last_fetch = datetime.now()
        return self.cached_stations
    
    def get_stations_with_status(self, user_location: Optional[Dict] = None, limit: Optional[int] = None) -> List[Dict]:
        """Enrich registered OSM stations with deterministic synthetic live state."""
        stations = self.cached_stations or []
        if not stations:
            return []

        enriched = generate_states_for_stations(stations, datetime.now())
        result = []
        for station in enriched:
            # Calculate distance from user location if available
            distance = 1.5
            if user_location:
                distance = self._haversine_distance(
                    user_location["lat"], user_location["lng"],
                    station["lat"], station["lng"]
                )
            
            result.append({
                **station,
                "distance": round(distance, 1),
                "zone_name": station.get("zone_name") or nearest_zone(station["lat"], station["lng"])["name"],
                "utilization_percent": round((station["load"] / max(station["capacity"], 1)) * 100, 1),
                "connector_types": ["CCS2", "Type 2"] if station.get("zone_Commercial") else ["Type 2", "AC001"],
                "charging_speed": "rapid" if station["capacity"] >= 240 else "fast" if station["capacity"] >= 170 else "slow",
            })
        
        result.sort(key=lambda x: (x["distance"], -x["capacity"]))
        return result[:limit] if limit else result
    
    def _haversine_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        R = 6371
        dLat = (lat2 - lat1) * math.pi / 180
        dLon = (lon2 - lon1) * math.pi / 180
        a = math.sin(dLat/2)**2 + math.cos(lat1*math.pi/180) * math.cos(lat2*math.pi/180) * math.sin(dLon/2)**2
        return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))


# Global station fetcher
station_fetcher = EVStationFetcher()


async def get_real_stations(user_location: Optional[Dict] = None) -> List[Dict]:
    """Get real EV stations with status"""
    await station_fetcher.fetch_bengaluru_stations()
    return station_fetcher.get_stations_with_status(user_location, limit=16)


async def calculate_route(user_lat: float, user_lng: float, station_lat: float, station_lng: float) -> Dict:
    """Calculate a road route using Mapbox when configured, with OSRM fallback."""
    distance = station_fetcher._haversine_distance(user_lat, user_lng, station_lat, station_lng)

    mapbox_token = os.getenv("MAPBOX_ACCESS_TOKEN")
    if mapbox_token:
        mapbox_url = (
            "https://api.mapbox.com/directions/v5/mapbox/driving/"
            f"{user_lng},{user_lat};{station_lng},{station_lat}"
            f"?geometries=geojson&overview=full&access_token={mapbox_token}"
        )
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                response = await client.get(mapbox_url)
                response.raise_for_status()
                payload = response.json()
                route = payload["routes"][0]
                return {
                    "provider": "mapbox",
                    "distance_km": round(route["distance"] / 1000, 1),
                    "duration_minutes": round(route["duration"] / 60),
                    "geometry": route["geometry"],
                }
        except Exception:
            pass

    osrm_url = (
        "https://router.project-osrm.org/route/v1/driving/"
        f"{user_lng},{user_lat};{station_lng},{station_lat}?overview=full&geometries=geojson"
    )
    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.get(osrm_url)
            response.raise_for_status()
            payload = response.json()
            route = payload["routes"][0]
            return {
                "provider": "osrm",
                "distance_km": round(route["distance"] / 1000, 1),
                "duration_minutes": round(route["duration"] / 60),
                "geometry": route["geometry"],
            }
    except Exception:
        pass

    duration_minutes = round(distance * 2)
    return {
        "provider": "haversine",
        "distance_km": round(distance, 1),
        "duration_minutes": duration_minutes,
        "geometry": {
            "type": "LineString",
            "coordinates": [[user_lng, user_lat], [station_lng, station_lat]]
        }
    }


# Demand prediction based on time series
def predict_demand(hours_ahead: int = 6) -> Dict:
    """Predict demand for next N hours"""
    current_hour = datetime.now().hour
    
    predictions = []
    for h in range(hours_ahead):
        hour = (current_hour + h) % 24
        
        # Base pattern: low morning, peak evening
        base = 250
        if 7 <= hour <= 9:
            base = 350 + h * 20
        elif 10 <= hour <= 16:
            base = 300
        elif 17 <= hour <= 21:
            base = 500 + (hour - 17) * 80
        else:
            base = 150
        
        confidence = 0.92 - (h * 0.02)
        variability = math.sin((hour / 24) * math.pi * 2) * 14
        predicted_demand = max(80, base + variability)
        
        predictions.append({
            "hour": hour,
            "predicted_demand": round(predicted_demand, 1),
            "confidence": max(0.5, confidence),
            "timestamp": (datetime.now() + timedelta(hours=h)).isoformat()
        })
    
    return {
        "predictions": predictions,
        "summary": {
            "next_6h_avg": sum(p["predicted_demand"] for p in predictions[:6]) / 6,
            "peak_hour": max(predictions[:24], key=lambda x: x["predicted_demand"])["hour"],
            "peak_value": max(p["predicted_demand"] for p in predictions[:24])
        }
    }
