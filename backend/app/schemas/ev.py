from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class DemandPrediction(BaseModel):
    demand: float
    confidence: float
    factors: List[str]

class OptimizationResult(BaseModel):
    recommended_windows: List[dict]
    reason: str
    confidence: float

class LocationRecommendation(BaseModel):
    zone_id: int
    zone_name: str
    score: float
    justification: str

class SimulationResult(BaseModel):
    time_series: List[dict]
    total_sessions: int
    peak_demand: float

class RealtimeDemand(BaseModel):
    zone_id: int
    current_demand: float
    trend: str  # "increasing", "decreasing", "stable"
    timestamp: datetime

class ForecastData(BaseModel):
    hour: int
    predicted_demand: float
    confidence_lower: float
    confidence_upper: float
    baseline_demand: float

class DemandForecast(BaseModel):
    zone_id: int
    forecasts: List[ForecastData]
    model_accuracy: float
    baseline_comparison: str

class OptimizationImpact(BaseModel):
    before_peak: float
    after_peak: float
    reduction_percent: float
    zone_id: int

class Alert(BaseModel):
    zone_id: int
    alert_type: str  # "high_demand", "overload_risk"
    severity: str  # "low", "medium", "high"
    message: str
    timestamp: datetime

class ROIRecommendation(BaseModel):
    zone_id: int
    zone_name: str
    expected_utilization: float
    estimated_roi: float
    payback_period_months: int
    justification: str

class DashboardSummary(BaseModel):
    total_demand: float
    peak_load: float
    optimized_peak: float
    reduction_percent: float
    high_risk_zones: List[int]
    recommended_zones: List[int]
    realtime_snapshot: List[RealtimeDemand]
    timestamp: datetime

class APIResponse(BaseModel):
    success: bool
    data: Optional[dict] = None
    message: Optional[str] = None
    explanation: Optional[List[str]] = None