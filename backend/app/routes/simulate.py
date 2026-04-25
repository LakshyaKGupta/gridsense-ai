from fastapi import APIRouter
from app.services.simulation_engine import SimulationEngine
from app.schemas.ev import SimulationResult

router = APIRouter()
simulator = SimulationEngine()

@router.get("/run", response_model=SimulationResult)
async def run_simulation(num_agents: int = 100):
    """Run EV behavior simulation"""
    result = simulator.simulate_ev_behavior(num_agents)
    return SimulationResult(**result)