const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  detail?: string;
  message?: string;
};

export interface User {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface RealtimeSnapshot {
  zone_id: number;
  current_demand: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  timestamp: string;
}

export interface DashboardData {
  total_demand: number;
  peak_load: number;
  optimized_peak: number;
  reduction_percent: number;
  high_risk_zones: number[];
  recommended_zones: number[];
  realtime_snapshot: RealtimeSnapshot[];
  timestamp: string;
}

export interface ForecastPoint {
  hour: number;
  predicted_demand: number;
  confidence_lower: number;
  confidence_upper: number;
  error_range?: [number, number];
  confidence_tier?: "High" | "Medium" | "Low";
  baseline_demand: number;
}

export interface Forecast {
  zone_id: number;
  forecasts: ForecastPoint[];
  model_accuracy: number;
  baseline_comparison: string;
}

export interface DemandPrediction {
  demand: number;
  confidence: number;
  factors: string[];
}

export interface OptimizationWindow {
  hour: number;
  power: number;
  percentage: number;
}

export interface StationOptimizationWindow {
  station_id: number;
  windows: OptimizationWindow[];
}

export interface OptimizationResult {
  recommended_windows: StationOptimizationWindow[];
  reason: string;
  confidence: number;
}

export interface OptimizationImpact {
  before_peak: number;
  after_peak: number;
  reduction_percent: number;
  zone_id: number;
}

export interface ROI {
  zone_id: number;
  zone_name: string;
  expected_utilization: number;
  estimated_roi: number;
  payback_period_months: number;
  justification: string;
}

export interface Alert {
  zone_id: number;
  alert_type: string;
  severity: string;
  message: string;
  timestamp: string;
}

export interface Recommendation {
  zone_id: number;
  zone_name: string;
  score: number;
  justification: string;
}

export interface SimulationPoint {
  hour: number;
  demand: number;
  active_sessions: number;
}

export interface SimulationResult {
  time_series: SimulationPoint[];
  total_sessions: number;
  peak_demand: number;
}

export interface NearbyStation {
  id: number;
  name: string;
  lat: number;
  lng: number;
  current_load: number;
  capacity: number;
  status: 'GREEN' | 'YELLOW' | 'RED';
  recommendation_flag: boolean;
  distance_km: number;
}

export interface DemoScenario {
  scenario_name: string;
  current_state: any;
  optimized_state: any;
  impact: any;
}

export interface DataStatus {
  is_real_data: boolean;
}

export interface RealisticImpact {
  zone_id: number;
  ideal_peak_reduction: string;
  user_adoption_rate: string;
  realistic_peak_reduction: string;
  explanation: {
    demand_weight: number;
    time_factor: number;
    spillover: number;
  };
}

export interface AdvancedLocation {
  id: number;
  name: string;
  demand_growth: number;
  distance_gap: number;
  capacity_margin: number;
  final_score: number;
  justification: string;
}

export interface FailureScenario {
  scenario_type: string;
  impact: string;
  ai_response: string[];
  grid_stability_recovered_in: string;
}

export interface BaselineCompare {
  peak_load: number;
  utilization: string;
  cost_efficiency: string;
  improvement?: string;
}

export interface Baselines {
  no_optimization: BaselineCompare;
  random_allocation?: BaselineCompare;
  rule_based_night?: BaselineCompare;
  uniform_placement?: BaselineCompare;
  ai_optimized: BaselineCompare;
}

export interface ModelMetrics {
  mae: number;
  rmse: number;
  mape: number;
  data_points: number;
  validation_note: string;
}

export interface SensitivityPoint {
  uncertainty: string;
  adoption: string;
  peak_reduction: number;
}

export interface RobustnessPoint {
  missing_data: string;
  accuracy: number;
}

export interface ReverseGeocodeResponse {
  city: string;
  valid: boolean;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, init);
  const raw = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!response.ok) {
    const message =
      raw?.detail || raw?.message || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  if (raw && typeof raw === 'object' && 'data' in raw) {
    return raw.data as T;
  }

  return raw as T;
}

function withAuth(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

// Auth is handled by Firebase — see src/context/AuthContext.tsx

export const dashboardAPI = {
  getSummary: (token: string): Promise<DashboardData> =>
    request<DashboardData>('/dashboard/summary', {
      headers: withAuth(token),
    }),

  getAlerts: (token: string): Promise<Alert[]> =>
    request<Alert[]>('/alerts/', {
      headers: withAuth(token),
    }),

  getROI: (token: string): Promise<ROI[]> =>
    request<ROI[]>('/locations/roi/', {
      headers: withAuth(token),
    }),

  getRecommendations: (token: string): Promise<Recommendation[]> =>
    request<Recommendation[]>('/locations/recommend', {
      headers: withAuth(token),
    }),

  getRealtimeDemand: (token: string): Promise<RealtimeSnapshot[]> =>
    request<RealtimeSnapshot[]>('/realtime/demand', {
      headers: withAuth(token),
    }),

  getDemandPrediction: (token: string, zoneId: number): Promise<DemandPrediction> =>
    request<DemandPrediction>(`/demand/${zoneId}`, {
      headers: withAuth(token),
    }),

  getForecast: (token: string, zoneId: number): Promise<Forecast> =>
    request<Forecast>(`/forecast/${zoneId}`, {
      headers: withAuth(token),
    }),

  getOptimization: (token: string, zoneId: number): Promise<OptimizationResult> =>
    request<OptimizationResult>(`/optimize/${zoneId}`, {
      headers: withAuth(token),
    }),

  getImpact: (token: string, zoneId: number): Promise<OptimizationImpact> =>
    request<OptimizationImpact>(`/impact/${zoneId}`, {
      headers: withAuth(token),
    }),

  getSimulation: (token: string): Promise<SimulationResult> =>
    request<SimulationResult>('/simulate/run', {
      headers: withAuth(token),
    }),

  getNearbyStations: (token: string, lat: number, lng: number): Promise<NearbyStation[]> =>
    request<NearbyStation[]>(`/stations/nearby?lat=${lat}&lng=${lng}`, {
      headers: withAuth(token),
    }),

  getDemoScenario: (token: string): Promise<DemoScenario> =>
    request<DemoScenario>('/demo/scenario', {
      headers: withAuth(token),
    }),

  getDataStatus: (token: string): Promise<DataStatus> =>
    request<DataStatus>('/advanced/data/status', {
      headers: withAuth(token),
    }),

  getRealisticImpact: (token: string, zoneId: number, adoptionRate: number = 0.60): Promise<RealisticImpact> =>
    request<RealisticImpact>(`/advanced/impact/realistic?zone_id=${zoneId}&adoption_rate=${adoptionRate}`, {
      headers: withAuth(token),
    }),

  getAdvancedLocations: (token: string): Promise<AdvancedLocation[]> =>
    request<AdvancedLocation[]>('/advanced/locations/advanced', {
      headers: withAuth(token),
    }),

  getFailureScenario: (token: string): Promise<FailureScenario> =>
    request<FailureScenario>('/advanced/scenario/failure', {
      headers: withAuth(token),
    }),

  compareBaselines: (token: string): Promise<Baselines> =>
    request<Baselines>('/advanced/baselines/compare', {
      headers: withAuth(token),
    }),

  getModelMetrics: (token: string): Promise<ModelMetrics> =>
    request<ModelMetrics>('/advanced/model/metrics', {
      headers: withAuth(token),
    }),

  getSensitivityAnalysis: (token: string): Promise<SensitivityPoint[]> =>
    request<SensitivityPoint[]>('/advanced/analysis/sensitivity', {
      headers: withAuth(token),
    }),

  getRobustnessAnalysis: (token: string): Promise<RobustnessPoint[]> =>
    request<RobustnessPoint[]>('/advanced/analysis/robustness', {
      headers: withAuth(token),
    }),

  getReverseGeocode: (token: string, lat: number, lng: number): Promise<ReverseGeocodeResponse> =>
    request<ReverseGeocodeResponse>(`/stations/reverse-geocode?lat=${lat}&lng=${lng}`, {
      headers: withAuth(token),
    }),
};
