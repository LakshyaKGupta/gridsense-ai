from fastapi import APIRouter

router = APIRouter()

@router.get("/scenario")
async def get_demo_scenario():
    """Return a curated demo scenario showing the value of the optimization system."""
    return {
        "scenario_name": "Peak Evening Grid Stress (Bengaluru Zone 3)",
        "current_state": {
            "time": "19:00",
            "grid_load": 950.5,
            "status": "CRITICAL",
            "alerts": ["Transformer T-4 approaching thermal limit", "High concentration of commercial EV fleet charging"]
        },
        "optimized_state": {
            "grid_load": 740.0,
            "status": "STABLE",
            "actions_taken": [
                "Shifted 30% of commercial fleet charging to 23:00-04:00 window",
                "Routed 50 incoming public EVs to Zone 2 (Green Status) via dynamic pricing"
            ]
        },
        "impact": {
            "peak_reduction_percent": 22.14,
            "estimated_savings_inr": 145000,
            "blackout_risk_reduction": "High"
        }
    }
