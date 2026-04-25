from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.routes import auth, demand, optimize, locations, simulate, realtime, forecast, impact, alerts, roi, dashboard, stations, demo, advanced
from app.database import engine, Base
from app.services.explainability_engine import ExplainabilityEngine
from app.services.simulation_engine import SimulationEngine
from app.routes.stations import simulate_stations
from starlette.responses import Response
import logging
import time
import asyncio
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="EV Charging Optimization API",
    version="2.0.0",
    description="Real-time AI decision system for EV charging infrastructure"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Explainability engine
explainability = ExplainabilityEngine()

# Background simulator instance (updates shared cache)
bg_simulator = SimulationEngine()


# Middleware for logging, response standardization and explainability
@app.middleware("http")
async def add_explainability_and_logging(request: Request, call_next):
    start_time = time.time()

    # Log request
    logger.info(f"Request: {request.method} {request.url}")

    try:
        response = await call_next(request)

        # Add processing time
        process_time = time.time() - start_time
        response.headers["X-Process-Time"] = str(process_time)

        # Only intercept JSON responses and wrap them in the standard API format
        content_type = response.headers.get("content-type", "")
        if "application/json" in content_type:
            # Read and collect body bytes
            body = b""
            async for chunk in response.body_iterator:
                body += chunk

            try:
                payload = json.loads(body.decode() or "null") if body else None
            except Exception:
                payload = None

            # Determine context for explainability
            path = request.url.path
            if path.startswith("/demand") or path.startswith("/forecast"):
                context_type = "demand_prediction"
            elif path.startswith("/optimize") or path.startswith("/impact"):
                context_type = "optimization"
            elif path.startswith("/locations"):
                context_type = "location_recommendation"
            elif path.startswith("/alerts"):
                context_type = "alert"
            elif path.startswith("/dashboard"):
                context_type = "dashboard"
            else:
                context_type = "general"

            explanation = explainability.generate_explanation({"type": context_type})

            # If payload already follows our standard format, just ensure explanation exists
            if isinstance(payload, dict) and payload.get("success") in (True, False):
                if "explanation" not in payload:
                    payload["explanation"] = explanation
                final_body = json.dumps(payload, default=str).encode()
            else:
                # Wrap under standard API response
                wrapped = {
                    "success": True,
                    "timestamp": time.time(),
                    "data": payload,
                    "explanation": explanation
                }
                final_body = json.dumps(wrapped, default=str).encode()

            headers = dict(response.headers)
            # Remove content-length to avoid mismatches with modified body
            if 'content-length' in headers:
                del headers['content-length']
            return Response(content=final_body, status_code=response.status_code, headers=headers, media_type="application/json")

        return response

    except Exception as e:
        logger.error(f"Error processing request: {e}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": "Internal server error",
                "explanation": ["System encountered an unexpected error", "Please try again later"]
            }
        )


# Start background simulation on app startup
@app.on_event("startup")
async def start_background_tasks():
    try:
        asyncio.create_task(bg_simulator.simulate_realtime_demand())
        asyncio.create_task(simulate_stations())
        logger.info("Started background realtime demand simulation")
    except Exception as e:
        logger.error(f"Failed to start background tasks: {e}")

# Standard response wrapper
def create_standard_response(success: bool, data=None, message=None, explanation=None):
    """Create standardized API response"""
    response = {
        "success": success,
        "timestamp": time.time()
    }

    if data is not None:
        response["data"] = data
    if message:
        response["message"] = message
    if explanation:
        response["explanation"] = explanation
    else:
        # Add default explanation if none provided
        context = {"type": "general"}
        response["explanation"] = explainability.generate_explanation(context)

    return response

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(demand.router, prefix="/demand", tags=["Demand Prediction"])
app.include_router(forecast.router, prefix="/forecast", tags=["Demand Forecasting"])
app.include_router(optimize.router, prefix="/optimize", tags=["Optimization"])
app.include_router(impact.router, prefix="/impact", tags=["Optimization Impact"])
app.include_router(locations.router, prefix="/locations", tags=["Location Recommendations"])
app.include_router(roi.router, prefix="/locations/roi", tags=["ROI Analysis"])
app.include_router(simulate.router, prefix="/simulate", tags=["Simulation"])
app.include_router(realtime.router, prefix="/realtime", tags=["Real-time Data"])
app.include_router(alerts.router, prefix="/alerts", tags=["System Alerts"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
app.include_router(stations.router, prefix="/stations", tags=["Nearby Stations"])
app.include_router(demo.router, prefix="/demo", tags=["Demo Scenarios"])
app.include_router(advanced.router, prefix="/advanced", tags=["Advanced Analytics"])

@app.get("/")
async def root():
    """API root endpoint"""
    return create_standard_response(
        success=True,
        message="EV Charging Optimization API v2.0",
        explanation=["Real-time AI decision system for EV infrastructure", "Provides demand forecasting and optimization", "Supports government dashboard integration"]
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)