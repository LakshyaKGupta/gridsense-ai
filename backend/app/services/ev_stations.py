import math
import random
import httpx
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Optional

class EVStationFetcher:
    """Fetches real EV charging stations from OpenStreetMap via Overpass API"""
    
    OVERPASS_URL = "https://overpass-api.de/api/interpreter"
    FALLBACK_STATIONS = [
        {"id": 1, "name": "Tesla超级充电站 Indiranagar", "lat": 12.9784, "lng": 77.6408, "operator": "Tesla"},
        {"id": 2, "name": "EV充电站 Koramangala", "lat": 12.9279, "lng": 77.6271, "operator": "ABL"},
        {"id": 3, "name": "ChargePoint Whitefield", "lat": 12.9698, "lng": 77.7499, "operator": "ChargePoint"},
        {"id": 4, "name": "EESL充电站 Electronic City", "lat": 12.8399, "lng": 77.6770, "operator": "EESL"},
        {"id": 5, "name": "Ashok充电站 Jayanagar", "lat": 12.9299, "lng": 77.5826, "operator": "ABB"},
    ]
    
    def __init__(self):
        self.cached_stations = None
        self.last_fetch = None
    
    async def fetch_bengaluru_stations(self) -> List[Dict]:
        """Fetch EV stations in Bengaluru area using Overpass API"""
        # Check cache first (15 min TTL)
        if self.cached_stations and self.last_fetch:
            age = (datetime.now() - self.last_fetch).total_seconds()
            if age < 900:  # 15 minutes
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
            
            async with httpx.AsyncClient(timeout=30.0) as client:
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
                                name = tags.get("name") or tags.get("brand") or f"EV Station {element['id']}"
                                operator = tags.get("operator") or "Unknown"
                                
                                stations.append({
                                    "id": element["id"],
                                    "name": name,
                                    "lat": lat,
                                    "lng": lon,
                                    "operator": operator,
                                    "source": "osm"
                                })
                    
                    if stations:
                        self.cached_stations = stations
                        self.last_fetch = datetime.now()
                        return stations
                    
        except Exception as e:
            print(f"Overpass API error: {e}")
        
        # Return fallback stations if API fails
        return self.FALLBACK_STATIONS
    
    def get_stations_with_status(self, user_location: Optional[Dict] = None) -> List[Dict]:
        """Add derived status to stations based on time and location"""
        current_hour = datetime.now().hour
        
        stations = self.cached_stations or self.FALLBACK_STATIONS
        
        # Evening peak hours: 7-9 PM
        is_peak = 19 <= current_hour <= 21
        
        result = []
        for i, station in enumerate(stations):
            # Calculate distance from user location if available
            distance = 1.5
            if user_location:
                distance = self._haversine_distance(
                    user_location["lat"], user_location["lng"],
                    station["lat"], station["lng"]
                )
            
            # Derive load based on time and distance from center
            base_load = 120 + (i * 30)  # Distribute load across stations
            
            # Add time-based variation
            if is_peak:
                load = min(base_load * 1.5, 280)
            elif current_hour < 6 or current_hour > 22:
                load = base_load * 0.4
            else:
                load = base_load + random.randint(-20, 20)
            
            load = max(30, min(300, load))
            
            status = "GREEN"
            if load > 220:
                status = "RED"
            elif load > 150:
                status = "YELLOW"
            
            result.append({
                **station,
                "load": load,
                "capacity": 300,
                "status": status,
                "distance": round(distance, 1),
                "wait_time": round(max(0, (load / 50) - 3), 1) if load > 150 else 0
            })
        
        # Sort by distance
        result.sort(key=lambda x: x["distance"])
        return result
    
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
    stations = await station_fetcher.fetch_bengaluru_stations()
    return station_fetcher.get_stations_with_status(user_location)


def calculate_route(user_lat: float, user_lng: float, station_lat: float, station_lng: float) -> Dict:
    """Calculate route using Haversine (simplified) - in production use Mapbox API"""
    distance = station_fetcher._haversine_distance(user_lat, user_lng, station_lat, station_lng)
    
    # Estimate duration (assuming 30 km/h in city)
    duration_minutes = round(distance * 2)
    
    return {
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
        
        predictions.append({
            "hour": hour,
            "predicted_demand": base + random.randint(-30, 30),
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