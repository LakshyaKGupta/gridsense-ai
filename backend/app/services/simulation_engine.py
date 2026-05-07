import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import random
import asyncio
import math
from app.utils.cache import get_cache, set_cache, async_get_cache, async_set_cache
from app.database import SessionLocal
from app.models import DemandLog, Zone
from app.services.zone_catalog import nearest_zone


COMMERCIAL_KEYWORDS = (
    "tech", "park", "mall", "metro", "airport", "hub", "plaza", "office",
    "business", "itpl", "station", "city", "road", "market", "center",
)
INDUSTRIAL_KEYWORDS = (
    "industrial", "factory", "plant", "logistics", "warehouse", "electronic city",
    "phase", "manufacturing", "fleet", "depot",
)
RESIDENTIAL_KEYWORDS = (
    "layout", "nagar", "colony", "residency", "homes", "apartment", "block",
    "enclave", "garden", "villa",
)

STATION_REGISTRY: Dict[int, Dict] = {}
STATION_STATE_CACHE: Dict[str, Dict] = {}


def _station_rng_seed(station_id: int, timestamp: datetime, salt: int = 0) -> int:
    hour_bucket = timestamp.year * 1000000 + timestamp.month * 10000 + timestamp.day * 100 + timestamp.hour
    return (int(station_id) * 1315423911 + hour_bucket + salt) & 0xFFFFFFFF


def _canonical_station(station: Dict) -> Dict:
    lat = float(station.get("lat", station.get("latitude", 0.0)))
    lng = float(station.get("lng", station.get("lon", station.get("longitude", 0.0))))
    return {
        "id": int(station["id"]),
        "name": str(station.get("name") or f"EV Station {station['id']}"),
        "lat": lat,
        "lng": lng,
        "operator": str(station.get("operator") or "Unknown"),
        "source": str(station.get("source") or "osm"),
    }


def assign_station_zone(station: Dict) -> Dict[str, int]:
    normalized = _canonical_station(station)
    lowered = normalized["name"].lower()

    if any(keyword in lowered for keyword in COMMERCIAL_KEYWORDS):
        zone_type = "commercial"
    elif any(keyword in lowered for keyword in INDUSTRIAL_KEYWORDS):
        zone_type = "industrial"
    elif any(keyword in lowered for keyword in RESIDENTIAL_KEYWORDS):
        zone_type = "residential"
    else:
        zone_meta = nearest_zone(normalized["lat"], normalized["lng"])
        zone_type = str(zone_meta.get("zone_type", "residential"))

    return {
        "zone_Commercial": 1 if zone_type == "commercial" else 0,
        "zone_Industrial": 1 if zone_type == "industrial" else 0,
        "zone_Residential": 1 if zone_type == "residential" else 0,
    }


def _station_capacity(zone_flags: Dict[str, int], station_name: str) -> float:
    name = station_name.lower()
    if zone_flags["zone_Industrial"]:
        base = 260.0
    elif zone_flags["zone_Commercial"]:
        base = 200.0
    else:
        base = 140.0

    if "airport" in name or "fleet" in name:
        base += 60.0
    elif "mall" in name or "tech park" in name:
        base += 40.0

    return base


def _peak_curve(hour: int, peak_hours: List[float], width: float = 2.2) -> float:
    score = 0.0
    for peak in peak_hours:
        distance = min(abs(hour - peak), 24 - abs(hour - peak))
        score += math.exp(-((distance ** 2) / (2 * (width ** 2))))
    return score


def register_osm_stations(stations: List[Dict]) -> List[Dict]:
    normalized = []
    for station in stations:
        canonical = _canonical_station(station)
        zone_flags = assign_station_zone(canonical)
        zone_meta = nearest_zone(canonical["lat"], canonical["lng"])
        canonical.update(
            {
                **zone_flags,
                "zone_type": (
                    "commercial" if zone_flags["zone_Commercial"]
                    else "industrial" if zone_flags["zone_Industrial"]
                    else "residential"
                ),
                "zone_name": str(zone_meta["name"]),
                "zone_id": int(zone_meta["id"]),
                "capacity": round(_station_capacity(zone_flags, canonical["name"]), 1),
            }
        )
        STATION_REGISTRY[canonical["id"]] = canonical
        normalized.append(canonical)
    return normalized


def get_registered_stations() -> List[Dict]:
    return list(STATION_REGISTRY.values())


def generate_current_state(station: Dict, timestamp: Optional[datetime] = None) -> Dict:
    ts = timestamp or datetime.now()
    canonical = STATION_REGISTRY.get(int(station["id"])) or register_osm_stations([station])[0]
    cache_key = f"{canonical['id']}:{ts.strftime('%Y%m%d%H')}"
    cached = STATION_STATE_CACHE.get(cache_key)
    if cached:
        return dict(cached)

    zone_flags = {
        "zone_Commercial": canonical["zone_Commercial"],
        "zone_Industrial": canonical["zone_Industrial"],
        "zone_Residential": canonical["zone_Residential"],
    }
    capacity = float(canonical["capacity"])
    weekday = ts.weekday() < 5
    is_weekend = 0 if weekday else 1
    hour = ts.hour
    seed = _station_rng_seed(canonical["id"], ts)
    rng = random.Random(seed)

    if zone_flags["zone_Commercial"]:
        peak_strength = _peak_curve(hour, [9.0, 18.0], width=2.0)
        base_ev = 4.0 if weekday else 3.0
        peak_ev = (10.0 if weekday else 7.0) * peak_strength
    elif zone_flags["zone_Industrial"]:
        peak_strength = _peak_curve(hour, [8.0, 17.0], width=2.3)
        base_ev = 5.0 if weekday else 2.5
        peak_ev = (9.0 if weekday else 4.5) * peak_strength
    else:
        peak_strength = _peak_curve(hour, [21.0, 1.0, 5.0], width=2.5)
        base_ev = 3.0 if weekday else 4.5
        peak_ev = (8.0 if weekday else 9.0) * peak_strength

    if zone_flags["zone_Commercial"] and not weekday:
        peak_ev *= 0.85
    if zone_flags["zone_Residential"] and not weekday:
        peak_ev *= 1.12

    ev_count = max(1, int(round(base_ev + peak_ev + rng.uniform(0.0, 2.4))))
    connector_mix_kw = 12.0 if zone_flags["zone_Residential"] else 18.0 if zone_flags["zone_Commercial"] else 24.0
    load_noise = rng.uniform(0.94, 1.08)
    raw_load = ev_count * connector_mix_kw * load_noise
    load = round(min(capacity * 0.98, max(capacity * 0.08, raw_load)), 2)

    history_peak = 0.78 if zone_flags["zone_Residential"] else 0.72 if zone_flags["zone_Commercial"] else 0.76
    history_curve = _peak_curve((hour - 1) % 24, [20.0, 8.0] if zone_flags["zone_Residential"] else [9.0, 18.0], width=2.7)
    past_demand = round(min(capacity, max(capacity * 0.06, load * (0.84 + history_curve * 0.12) * history_peak)), 2)

    utilization_percent = round((load / max(capacity, 1.0)) * 100, 1)
    if utilization_percent >= 86:
        status = "RED"
    elif utilization_percent >= 62:
        status = "YELLOW"
    else:
        status = "GREEN"

    wait_multiplier = 0.0 if utilization_percent < 55 else (utilization_percent - 55) / 4.5
    wait_time = round(max(0.0, wait_multiplier * (1.5 if zone_flags["zone_Commercial"] else 1.2)), 1)

    state = {
        **canonical,
        "hour": hour,
        "day_of_week": ts.weekday(),
        "is_weekend": is_weekend,
        "ev_count": ev_count,
        "past_demand": past_demand,
        "load": load,
        "current_load": load,
        "wait_time": wait_time,
        "utilization_percent": utilization_percent,
        "status": status,
        "timestamp": ts.isoformat(),
    }
    STATION_STATE_CACHE[cache_key] = state
    return dict(state)


def generate_states_for_stations(stations: List[Dict], timestamp: Optional[datetime] = None) -> List[Dict]:
    register_osm_stations(stations)
    return [generate_current_state(station, timestamp) for station in stations]


def get_station_state(station_id: int, timestamp: Optional[datetime] = None) -> Optional[Dict]:
    station = STATION_REGISTRY.get(int(station_id))
    if not station:
        return None
    return generate_current_state(station, timestamp)


class SimulationEngine:
    def __init__(self):
        self.active_sessions = {}  # zone_id -> list of active sessions
        self.current_demand = {}   # zone_id -> current demand
        self.last_update = datetime.now()
        self.num_agents = 200
        self.agents = {}  # agent_id -> agent info (zone, preferences)
        self.zones = []
        self._init_agents()

    def _init_agents(self):
        """Initialize synthetic agents and zone list from DB (fallback to defaults)."""
        try:
            db = SessionLocal()
            zones = db.query(Zone).all()
            self.zones = [z.id for z in zones] if zones else [1, 2, 3, 4, 5]
        except Exception:
            self.zones = [1, 2, 3, 4, 5]
        finally:
            try:
                db.close()
            except Exception:
                pass

        for i in range(self.num_agents):
            zone_choice = random.choice(self.zones)
            self.agents[i] = {
                'zone_id': zone_choice,
                'home_time': random.choice([18, 19, 20, 21, 22]),
                'duration': random.randint(2, 6),
                'power': random.choice([3.7, 7.4, 11, 22]),
                'flexibility': random.randint(1, 3)
            }

    def _log_demand_to_db(self, zone_id: int, demand_value: float, ts: datetime = None):
        """Synchronous helper to persist a DemandLog row."""
        try:
            db = SessionLocal()
            if ts is None:
                ts = datetime.now()
            log_entry = DemandLog(zone_id=zone_id, demand_value=demand_value, timestamp=ts)
            db.add(log_entry)
            db.commit()
        except Exception as e:
            print(f"Error logging demand to DB: {e}")
        finally:
            try:
                db.close()
            except Exception:
                pass

    def simulate_ev_behavior(self, num_agents: int) -> Dict:
        """Simulate EV charging behavior over 24 hours"""
        # Generate synthetic EV agents
        agents = []
        for i in range(num_agents):
            # Random home charging preference
            home_time = random.choice([18, 19, 20, 21, 22])  # Evening hours
            duration = random.randint(2, 6)  # 2-6 hours
            power = random.choice([3.7, 7.4, 11, 22])  # Common EV charger powers

            agents.append({
                'id': i,
                'home_time': home_time,
                'duration': duration,
                'power': power,
                'flexibility': random.randint(1, 3)  # Hours of flexibility
            })

        # Simulate over 24 hours
        time_series = []
        total_sessions = 0

        for hour in range(24):
            hour_demand = 0
            active_sessions = 0

            for agent in agents:
                # Check if agent starts charging around their preferred time
                start_window = range(agent['home_time'] - agent['flexibility'],
                                   agent['home_time'] + agent['flexibility'] + 1)

                if hour in start_window:
                    # Agent starts charging
                    end_hour = min(hour + agent['duration'], 24)
                    for h in range(hour, end_hour):
                        if h == hour:  # First hour
                            hour_demand += agent['power']
                            active_sessions += 1
                            total_sessions += 1

            time_series.append({
                'hour': hour,
                'demand': hour_demand,
                'active_sessions': active_sessions
            })

        peak_demand = max(ts['demand'] for ts in time_series)

        return {
            'time_series': time_series,
            'total_sessions': total_sessions,
            'peak_demand': peak_demand
        }

    async def simulate_realtime_demand(self):
        """Background task to update demand every 5-10 seconds"""
        while True:
            try:

                # Ensure zones list is current
                if not self.zones:
                    try:
                        db = SessionLocal()
                        zones = db.query(Zone).all()
                        self.zones = [z.id for z in zones] if zones else [1, 2, 3, 4, 5]
                    except Exception:
                        self.zones = [1, 2, 3, 4, 5]
                    finally:
                        try:
                            db.close()
                        except Exception:
                            pass

                # Move a small fraction of agents between zones to simulate mobility
                for agent in self.agents.values():
                    if random.random() < 0.05:  # 5% chance to move
                        agent['zone_id'] = random.choice(self.zones)

                for zone_id in self.zones:
                    # Get current demand from cache
                    current = await async_get_cache(f"demand:{zone_id}", 0.0)
                    previous = await async_get_cache(f"demand:prev:{zone_id}", current)

                    # Simulate realistic demand fluctuations
                    hour = datetime.now().hour
                    base_demand = self._get_base_demand_for_hour(hour)

                    # Add some randomness and trends
                    noise = np.random.normal(0, base_demand * 0.1)
                    trend_factor = self._calculate_trend_factor(zone_id)

                    new_demand = max(0, base_demand + noise + trend_factor)

                    # Calculate active sessions from agents present in the zone
                    agents_here = [a for a in self.agents.values() if a['zone_id'] == zone_id]
                    active_sessions = 0
                    for a in agents_here:
                        start_window = range(a['home_time'] - a['flexibility'], a['home_time'] + a['flexibility'] + 1)
                        if hour in start_window and random.random() < 0.6:
                            active_sessions += 1

                    # Update cache values
                    await async_set_cache(f"demand:prev:{zone_id}", current)
                    await async_set_cache(f"demand:{zone_id}", new_demand)
                    await async_set_cache(f"demand:timestamp:{zone_id}", datetime.now())
                    await async_set_cache(f"demand:trend:{zone_id}", "increasing" if new_demand > current * 1.05 else ("decreasing" if new_demand < current * 0.95 else "stable"))
                    await async_set_cache(f"active_sessions:{zone_id}", active_sessions)

                    # Persist demand log asynchronously (do not block event loop)
                    try:
                        await asyncio.to_thread(self._log_demand_to_db, zone_id, float(new_demand), datetime.now())
                    except Exception as e:
                        print(f"Error scheduling DB log: {e}")

                # Wait 5-10 seconds
                await asyncio.sleep(random.uniform(5, 10))

            except Exception as e:
                print(f"Error in realtime simulation: {e}")
                await asyncio.sleep(10)

    def _get_base_demand_for_hour(self, hour: int) -> float:
        """Get base demand pattern for hour of day"""
        # Peak in evening, low at night
        if 18 <= hour <= 22:
            return 150 + (hour - 18) * 50  # Rising to peak
        elif 6 <= hour <= 10:
            return 50 + (hour - 6) * 20  # Morning increase
        elif 11 <= hour <= 17:
            return 80  # Steady daytime
        else:
            return 20  # Night low

    def _calculate_trend_factor(self, zone_id: int) -> float:
        """Calculate trend factor based on zone characteristics"""
        # Simple trend simulation - could be enhanced with ML
        return random.uniform(-10, 10)

    async def get_realtime_demand(self, zone_id: int) -> Dict:
        """Get current demand for a zone"""
        demand = await async_get_cache(f"demand:{zone_id}", 0.0)
        trend = await async_get_cache(f"demand:trend:{zone_id}", "stable")
        timestamp = await async_get_cache(f"demand:timestamp:{zone_id}", datetime.now())

        return {
            "zone_id": zone_id,
            "current_demand": demand,
            "trend": trend,
            "timestamp": timestamp
        }
