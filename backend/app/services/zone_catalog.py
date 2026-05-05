from typing import Dict, List, Optional

ZONE_CATALOG: List[Dict[str, object]] = [
    {"id": 1, "name": "Indiranagar", "lat": 12.9784, "lng": 77.6408, "capacity": 600.0, "zone_type": "residential", "ev_count": 850},
    {"id": 2, "name": "Koramangala", "lat": 12.9279, "lng": 77.6271, "capacity": 680.0, "zone_type": "commercial", "ev_count": 1200},
    {"id": 3, "name": "Whitefield", "lat": 12.9698, "lng": 77.7499, "capacity": 600.0, "zone_type": "industrial", "ev_count": 1500},
    {"id": 4, "name": "Electronic City", "lat": 12.8399, "lng": 77.6770, "capacity": 720.0, "zone_type": "industrial", "ev_count": 1100},
    {"id": 5, "name": "Jayanagar", "lat": 12.9299, "lng": 77.5826, "capacity": 560.0, "zone_type": "residential", "ev_count": 700},
    {"id": 6, "name": "MG Road", "lat": 12.9752, "lng": 77.6060, "capacity": 640.0, "zone_type": "commercial", "ev_count": 950},
    {"id": 7, "name": "Manyata Tech Park", "lat": 13.0420, "lng": 77.6200, "capacity": 700.0, "zone_type": "industrial", "ev_count": 1300},
    {"id": 8, "name": "Yelahanka", "lat": 13.1007, "lng": 77.5963, "capacity": 520.0, "zone_type": "residential", "ev_count": 450},
    {"id": 9, "name": "JP Nagar", "lat": 12.9063, "lng": 77.5857, "capacity": 540.0, "zone_type": "residential", "ev_count": 600},
    {"id": 10, "name": "Hebbal", "lat": 13.0358, "lng": 77.5970, "capacity": 620.0, "zone_type": "commercial", "ev_count": 800},
    {"id": 11, "name": "Banashankari", "lat": 12.9255, "lng": 77.5468, "capacity": 500.0, "zone_type": "residential", "ev_count": 550},
    {"id": 12, "name": "Airport Corridor", "lat": 13.1986, "lng": 77.7066, "capacity": 760.0, "zone_type": "commercial", "ev_count": 900},
]

ZONE_BY_ID: Dict[int, Dict[str, object]] = {int(zone["id"]): zone for zone in ZONE_CATALOG}


def get_zone(zone_id: int) -> Dict[str, object]:
    return ZONE_BY_ID.get(zone_id, ZONE_BY_ID[1])


def get_zone_capacity(zone_id: int) -> float:
    return float(get_zone(zone_id)["capacity"])


def get_zone_type(zone_id: int) -> str:
    return str(get_zone(zone_id)["zone_type"])


def get_zone_ev_count(zone_id: int) -> int:
    return int(get_zone(zone_id)["ev_count"])


def nearest_zone(lat: float, lng: float) -> Dict[str, object]:
    def distance_sq(zone: Dict[str, object]) -> float:
        return (float(zone["lat"]) - lat) ** 2 + (float(zone["lng"]) - lng) ** 2

    return min(ZONE_CATALOG, key=distance_sq)


def zone_names() -> List[str]:
    return [str(zone["name"]) for zone in ZONE_CATALOG]


def get_zone_by_name(name: Optional[str]) -> Dict[str, object]:
    if not name:
        return ZONE_BY_ID[1]
    lowered = name.strip().lower()
    for zone in ZONE_CATALOG:
        if str(zone["name"]).lower() == lowered:
            return zone
    return ZONE_BY_ID[1]
