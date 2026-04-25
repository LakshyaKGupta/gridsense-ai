import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict
import random
import asyncio
from app.utils.cache import get_cache, set_cache, async_get_cache, async_set_cache
from app.database import SessionLocal
from app.models import DemandLog, Zone



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