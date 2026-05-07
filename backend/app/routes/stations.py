import asyncio

from fastapi import APIRouter, Query
import httpx

from app.services.ev_stations import get_real_stations

router = APIRouter()


async def simulate_stations():
    """
    Keep the OSM station cache warm in the background so dashboard loads do not
    wait on Overpass for every request.
    """
    while True:
        try:
            await get_real_stations()
            await asyncio.sleep(1800)
        except Exception:
            await asyncio.sleep(120)


@router.get("/nearby")
async def get_nearby_stations(
    lat: float = Query(...),
    lng: float = Query(...),
    limit: int = Query(default=16, ge=10, le=24),
):
    """Return 10-24 real OSM stations near the requested Bengaluru location."""
    stations = await get_real_stations({"lat": lat, "lng": lng})
    nearby = stations[:limit]

    best_option = None
    if nearby:
        best_option = min(
            nearby,
            key=lambda station: station["wait_time"] + (station["distance"] * 3.5),
        )["id"]

    payload = []
    for station in nearby:
        payload.append(
            {
                "id": station["id"],
                "name": station["name"],
                "lat": station["lat"],
                "lng": station["lng"],
                "current_load": station["load"],
                "capacity": station["capacity"],
                "status": station["status"],
                "recommendation_flag": station["status"] != "RED",
                "distance_km": station["distance"],
                "queue_time": station["wait_time"],
                "predicted_peak_time": "19:00",
                "recommendation": (
                    "High priority expansion candidate"
                    if station["status"] == "RED"
                    else "Best immediate charging option"
                    if station["id"] == best_option
                    else "Usable fallback station"
                ),
                "is_best_option": station["id"] == best_option,
            }
        )

    return payload


@router.get("/reverse-geocode")
async def reverse_geocode(lat: float, lng: float):
    """Get city name from lat/lng. Validates if it's in India."""
    if not (8 <= lat <= 37 and 68 <= lng <= 97):
        return {"city": "Unknown (Outside Region)", "valid": False}

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lng}&format=json",
                headers={"User-Agent": "GridSense-AI"},
            )
            data = resp.json()
            city = (
                data.get("address", {}).get("city")
                or data.get("address", {}).get("town")
                or data.get("address", {}).get("state_district")
                or "Bengaluru"
            )
            return {"city": city, "valid": True}
    except Exception:
        return {"city": "Bengaluru", "valid": True}
