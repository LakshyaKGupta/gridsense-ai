from fastapi import APIRouter, BackgroundTasks
from app.services.simulation_engine import SimulationEngine
from app.schemas.ev import RealtimeDemand
from datetime import datetime
from app.database import SessionLocal
from app.models import Zone
from typing import List

router = APIRouter()
simulator = SimulationEngine()

@router.post("/start_simulation")
async def start_realtime_simulation(background_tasks: BackgroundTasks):
    """Start the real-time demand simulation"""
    background_tasks.add_task(simulator.simulate_realtime_demand)
    return {"message": "Real-time simulation started"}


@router.get("/demand", response_model=List[RealtimeDemand])
async def get_all_realtime_demand():
    """Get real-time demand snapshot for all zones"""
    db = SessionLocal()
    try:
        zones = db.query(Zone).all()
        zone_ids = [z.id for z in zones]
    finally:
        db.close()

    results = []
    for zid in zone_ids:
        try:
            data = await simulator.get_realtime_demand(zid)
            results.append(data)
        except Exception:
            # fallback empty
            results.append({"zone_id": zid, "current_demand": 0.0, "trend": "stable", "timestamp": datetime.now()})

    return results


@router.get("/{zone_id}", response_model=RealtimeDemand)
async def get_realtime_demand(zone_id: int):
    """Get real-time demand for a zone"""
    result = await simulator.get_realtime_demand(zone_id)
    return RealtimeDemand(**result)