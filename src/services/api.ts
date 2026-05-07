// ═══════════════════════════════════════════════════════════
// GridSense AI — Canonical API Types
// Frontend types MUST match backend response structures exactly.
// All intelligence originates from backend services.
// Frontend VISUALIZES intelligence, backend GENERATES it.
// ═══════════════════════════════════════════════════════════

import {
  getMockDemandPrediction,
  getMockForecast,
  getMockImpact,
  getMockOptimization,
  getMockRealisticImpact,
  mockAlerts,
  mockBaselines,
  mockDashboardData,
  mockFailureScenario,
  mockModelMetrics,
  mockNearbyStations,
  mockRecommendations,
  mockRobustness,
  mockROI,
  mockSensitivity,
  mockSimulation,
} from './mockData';

const API_URL = import.meta.env.VITE_API_URL ?? '/api';

type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  detail?: string;
  message?: string;
};

// ─── CANONICAL: Station Schema (unified across all endpoints) ───
export interface Station {
  id: number;
  name: string;
  lat: number;
  lng: number;
  operator: string;
  status: 'GREEN' | 'YELLOW' | 'RED';
  load: number;          // Current load in kW
  capacity: number;      // Max capacity in kW
  distance: number;      // Distance from user in km
  wait_time: number;     // Estimated wait in minutes
  zone_name: string;
  utilization_percent: number;  // load / capacity * 100
  connector_types?: string[];
  charging_speed?: 'slow' | 'fast' | 'rapid';
}

// ─── CANONICAL: Zone Schema (unified) ───
export interface Zone {
  id: number;
  name: string;
  lat: number;
  lng: number;
  capacity: number;
  zone_type: 'residential' | 'commercial' | 'industrial' | 'mixed';
  ev_count?: number;
  type?: string;
  active?: boolean;
}

export interface ZoneWithActive extends Zone {
  active: boolean;
  type: string;
}

export interface ZoneRanking extends Zone {
  predicted_load: number;
  headroom_kw: number;
  utilization_percent: number;
  status: 'STABLE' | 'CONSTRAINED' | 'OVERLOAD RISK';
  active: boolean;
}

// ─── CANONICAL: Forecast Schema (unified) ───
export interface ForecastPoint {
  hour: number;
  label: string;           // e.g. "19:00"
  predicted_demand: number;
  confidence_lower: number;
  confidence_upper: number;
  confidence_tier: 'High' | 'Medium' | 'Low';
  baseline_demand: number;
  status: 'STABLE' | 'CONSTRAINED' | 'OVERLOAD RISK';
  timestamp: string;
  explanation: ExplainabilityPayload;
}

export interface Forecast {
  zone_id: number;
  zone_name: string;
  forecasts: ForecastPoint[];
  peak: {
    hour: number;
    label: string;
    predicted_demand: number;
    confidence_upper: number;
  };
  model: string;
  model_accuracy: number;
  baseline_comparison: string;
}

// ─── CANONICAL: Explainability (structured) ───
export interface ExplainabilityPayload {
  reason: string;
  impact: string;
  confidence: string;
  contributing_factors?: string[];
}

// ─── CANONICAL: Recommendation (unified decision output) ───
export interface Recommendation {
  type: string;            // 'station' | 'home_charge' | 'wait' | 'alternate'
  headline: string;
  why: string;
  benefits: string[];
  confidence: string;
  score?: number;          // Weighted multi-factor score 0-100
  zone_id?: number;
  zone_name?: string;
  justification?: string;
}

// ─── CANONICAL: Action Priority (operator decision) ───
export interface ActionItem {
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  risk_color: 'red' | 'orange' | 'yellow' | 'green';
  title: string;
  reason: string;
  actions: string[];
  impact: string;
  confidence: string;
  status?: 'pending' | 'acknowledged' | 'in-progress' | 'resolved';
  workflow_status?: 'pending' | 'acknowledged' | 'in-progress' | 'resolved' | 'escalated';
  workflow_id?: string | null;
  acknowledged_by?: string | null;
  acknowledged_at?: string | null;
}

export interface WorkflowEvent {
  id: string;
  action_title: string;
  event_type: string;
  operator: string;
  timestamp: string;
  details: string;
  old_status?: string;
  new_status?: string;
}

export interface WorkflowAction {
  id: string;
  title: string;
  status: string;
  priority?: string;
  acknowledged_by?: string;
  acknowledged_at?: string;
  created_at: string;
  updated_at?: string;
  history: WorkflowEvent[];
}

export interface WorkflowState {
  active_actions: WorkflowAction[];
  recent_events: WorkflowEvent[];
}

// ─── CANONICAL: Scenario ───
export interface Scenario {
  id: string;
  label: string;
  active: boolean;
}

// ─── CANONICAL: Alert ───
export interface Alert {
  zone_id: number;
  alert_type: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  message: string;
  timestamp: string;
  acknowledged?: boolean;
}

// ─── CANONICAL: Optimization Result ───
export interface OptimizationWindow {
  hour: number;
  power: number;
  percentage: number;
}

export interface OptimizationResult {
  recommended_windows: OptimizationWindow[];
  reason: string;
  confidence: number;
  reduction_percent: number;
  before_peak: number;
  after_peak: number;
}

// ─── CANONICAL: Route ───
export interface RoutePayload {
  provider: string;
  distance_km: number;
  duration_minutes: number;
  geometry: {
    type: string;
    coordinates: number[][];
  };
}

// ─── CANONICAL: Decision Support (user-facing) ───
export interface DecisionSupport {
  target_energy_kwh: number;
  estimated_session_minutes: number;
  public_cost_inr: number;
  home_cost_inr?: number | null;
  savings_vs_home_inr?: number | null;
  queue_time_savings_minutes: number;
  route_provider: string;
  home_charge_recommended: boolean;
  congestion_reduction_percent: number;
  best_time_benefit: string;
  recommended_action: Recommendation;
  charge_now: {
    best_station_right_now: {
      station_id: number;
      station_name: string;
      station_lat: number;
      station_lng: number;
      distance_km: number;
      wait_time_minutes: number;
      utilization_percent: number;
      estimated_total_minutes: number;
      headline: string;
      why: string;
      confidence: string;
    } | null;
    wait_time_saved: {
      minutes: number;
      why: string;
    };
    cheapest_option:
      | {
          type: 'home';
          headline: string;
          estimated_cost_inr: number;
          why: string;
          confidence: string;
        }
      | {
          type: 'station';
          station_id: number;
          station_name: string;
          station_lat: number;
          station_lng: number;
          estimated_cost_inr: number;
          why: string;
          confidence: string;
        }
      | null;
    fastest_option: {
      station_id: number;
      station_name: string;
      station_lat: number;
      station_lng: number;
      distance_km: number;
      wait_time_minutes: number;
      utilization_percent: number;
      estimated_total_minutes: number;
      headline: string;
      why: string;
      confidence: string;
    } | null;
    lowest_congestion_option: {
      station_id: number;
      station_name: string;
      station_lat: number;
      station_lng: number;
      distance_km: number;
      wait_time_minutes: number;
      utilization_percent: number;
      estimated_total_minutes: number;
      headline: string;
      why: string;
      confidence: string;
    } | null;
  };
}

// ─── CANONICAL: Spatial Data (map visualization) ───
export interface HeatmapPoint {
  id: number;
  name: string;
  lat: number;
  lng: number;
  intensity: number;
  predicted_load: number;
  capacity: number;
  utilization_percent: number;
  status: 'STABLE' | 'CONSTRAINED' | 'OVERLOAD RISK';
}

export interface OverloadZone {
  id: number;
  name: string;
  lat: number;
  lng: number;
  radius_km: number;
  status: 'CONSTRAINED' | 'OVERLOAD RISK';
  overload_percent: number;
}

export interface CongestionCorridor {
  from_zone_id: number;
  from_zone_name: string;
  to_zone_id: number;
  to_zone_name: string;
  distance_km: number;
  combined_load: number;
  severity: 'CRITICAL' | 'HIGH';
}

export interface SpatialData {
  heatmap_points: HeatmapPoint[];
  overload_zones: OverloadZone[];
  congestion_corridors: CongestionCorridor[];
}

// ─── CANONICAL: Grid Stress ───
export interface GridStress {
  predicted_load: number;
  capacity: number;
  status: 'STABLE' | 'CONSTRAINED' | 'OVERLOAD RISK';
  delta_kw: number;
  overload_percent: number;
  explanation: ExplainabilityPayload;
}

// ─── CANONICAL: Network Summary ───
export interface NetworkSummary {
  zones_at_risk: number;
  constrained_zones: number;
  peak_window: string;
  highest_headroom_zone: string;
  scenario_delta_kw: number;
  total_zones: number;
}

// ─── Legacy types for backward compatibility with older API endpoints ───
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
  predicted_demand?: number;
  active_sessions?: number;
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

export interface DemandPrediction {
  demand: number;
  confidence: number;
  factors: string[];
}

export interface StationOptimizationWindow {
  station_id: number;
  windows: OptimizationWindow[];
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

export interface RecommendationLegacy {
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
  queue_time?: number;
  predicted_peak_time?: string;
  recommendation?: string;
  is_best_option?: boolean;
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

// ═══════════════════════════════════════════════════════════
// OPERATOR DASHBOARD PAYLOAD
// ═══════════════════════════════════════════════════════════
export interface OperatorDashboardPayload {
  role: 'operator';
  scenario: string;
  scenario_options: Scenario[];
  zone: Zone;
  grid_stress: GridStress;
  risk_engine: {
    zone: string;
    overload_probability: number;
    risk_score: number;
    risk_band: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    projected_peak_timing: string;
    confidence_level: 'HIGH' | 'MEDIUM' | 'LOW';
  };
  ops_summary: {
    urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    briefing: string;
    signals: {
      scenario: string;
      scenario_delta_kw: number;
      peak_time: string;
      predicted_peak_kw: number;
      capacity_kw: number;
      suggested_relief_zone: string;
    };
  };
  event_ticker: Array<{
    timestamp: string;
    type: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
    message: string;
  }>;
  top_risk_zones: Array<{
    zone: string;
    current_load: number;
    predicted_peak: number;
    overload_risk: number;
    confidence: string;
    recommended_action: string;
  }>;
  forecast_center: {
    zone_id: number;
    zone_name: string;
    scenario: string;
    horizons: {
      h6: { hours: 6; curve: ForecastPoint[]; peak: ForecastPoint & { explanation?: ExplainabilityPayload } };
      h24: { hours: 24; curve: ForecastPoint[]; peak: ForecastPoint & { explanation?: ExplainabilityPayload } };
      h72: { hours: 72; curve: ForecastPoint[]; peak: ForecastPoint & { explanation?: ExplainabilityPayload } };
    };
    baseline_comparison: {
      unmanaged: { label: string; peak_kw: number };
      optimized: { label: string; peak_kw: number };
      current: { label: string; peak_kw: number };
      delta_vs_unmanaged_kw: number;
      reduction_vs_unmanaged_percent: number;
      curves: {
        unmanaged_24h: ForecastPoint[];
        optimized_24h: ForecastPoint[];
        current_24h: ForecastPoint[];
      };
    };
    drift: {
      observed_kw: number | null;
      drift_percent: number;
      anomaly: boolean;
      reliability_score: number;
    };
    generated_at: string;
  };
  forecast: {
    zone_id: number;
    zone_name: string;
    curve: ForecastPoint[];
    peak: { label: string; predicted_demand: number; confidence_upper: number };
    model: string;
  };
  network_summary: NetworkSummary;
  action_queue: ActionItem[];
  zone_rankings: ZoneRanking[];
  planning_insights: Array<{
    headline: string;
    reason: string;
    impact: string;
    confidence: string;
  }>;
  all_zones: Zone[];
  spatial: SpatialData;
  workflow: WorkflowState;
}

// ═══════════════════════════════════════════════════════════
// USER DASHBOARD PAYLOAD
// ═══════════════════════════════════════════════════════════
export interface UserDashboardPayload {
  role: 'user';
  zone: Zone;
  effective_location: { lat: number; lng: number };
  profile_context: {
    vehicle_model: string;
    battery_capacity_kwh?: number | null;
    home_charging_access?: boolean | null;
    typical_charging_time?: string | null;
  };
  service_area_notice?: string | null;
  nearest_station: Station | null;
  selected_station: Station | null;
  route: RoutePayload | null;
  station_options: Station[];
  alternatives: Array<{
    id: number;
    name: string;
    operator: string;
    status: 'GREEN' | 'YELLOW' | 'RED';
    distance_km: number;
    wait_time_minutes: number;
    estimated_total_minutes: number;
    score: number;
    reason: string;
    is_best: boolean;
  }>;
  decision_support: DecisionSupport;
  charging_recommendation: {
    time_label: string;
    predicted_demand: number;
    headline: string;
    reason: string;
    impact: string;
    confidence: string;
  } | null;
  load_context: {
    prediction: number;
    confidence_lower: number;
    confidence_upper: number;
    status: string;
    explanation: ExplainabilityPayload;
  };
}

// ═══════════════════════════════════════════════════════════
// API CLIENT
// ═══════════════════════════════════════════════════════════

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      signal: init?.signal ?? AbortSignal.timeout(8000),
    });
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
  } catch (error) {
    const fallback = getFallbackResponse<T>(path);
    if (fallback !== undefined) return fallback;
    throw error;
  }
}

function withAuth(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

function getFallbackResponse<T>(path: string): T | undefined {
  const zoneMatch = path.match(/\/(?:demand|forecast|optimize|impact)\/(\d+)/);
  const zoneId = zoneMatch ? Number(zoneMatch[1]) : 1;

  // Operator dashboard fallback
  if (path.startsWith('/portal/operator')) {
    const mockOperatorDashboard: OperatorDashboardPayload = {
      role: 'operator',
      scenario: 'normal',
      scenario_options: [
        { id: 'normal', label: 'Normal Operations', active: true },
        { id: 'evening_peak', label: 'Evening Peak', active: false },
        { id: 'high_growth', label: 'High Growth', active: false },
        { id: 'station_outage', label: 'Station Outage', active: false },
        { id: 'festival_surge', label: 'Festival Surge', active: false },
      ],
      zone: { id: 1, name: 'Whitefield', lat: 12.97, lng: 77.63, capacity: 1000, zone_type: 'commercial' },
      grid_stress: {
        status: 'STABLE',
        predicted_load: 600,
        capacity: 1000,
        delta_kw: -400,
        overload_percent: 60,
        explanation: { reason: 'Demand is within normal operating range.', impact: 'No immediate action required.', confidence: 'HIGH' },
      },
      risk_engine: { zone: 'Whitefield', overload_probability: 0.1, risk_score: 20, risk_band: 'LOW', projected_peak_timing: '18:00', confidence_level: 'HIGH' },
      ops_summary: { urgency: 'LOW', briefing: 'All systems operational. No critical events detected. Grid is stable across all monitored zones.', signals: { scenario: 'normal', scenario_delta_kw: 0, peak_time: '18:00', predicted_peak_kw: 600, capacity_kw: 1000, suggested_relief_zone: 'Koramangala' } },
      event_ticker: [
        { timestamp: new Date(Date.now() - 300000).toISOString(), type: 'station_online', severity: 'INFO', message: 'Charging station came online at Whitefield Plaza' },
        { timestamp: new Date(Date.now() - 600000).toISOString(), type: 'demand_spike', severity: 'MEDIUM', message: 'Demand spike detected in Koramangala zone' },
      ],
      top_risk_zones: [
        { zone: 'Koramangala', current_load: 820, predicted_peak: 950, overload_risk: 12.5, confidence: 'HIGH', recommended_action: 'Monitor load — approaching constrained threshold' },
        { zone: 'Indiranagar', current_load: 680, predicted_peak: 740, overload_risk: 4.2, confidence: 'MEDIUM', recommended_action: 'No action required' },
      ],
      forecast_center: {
        zone_id: 1,
        zone_name: 'Whitefield',
        scenario: 'normal',
        horizons: {
          h6: { hours: 6, curve: [], peak: { hour: 18, label: '18:00', predicted_demand: 580, confidence_lower: 540, confidence_upper: 620, confidence_tier: 'High', baseline_demand: 520, status: 'STABLE', timestamp: new Date().toISOString(), explanation: { reason: 'Normal evening ramp-up expected.', impact: 'Grid stable.', confidence: 'HIGH' } } },
          h24: { hours: 24, curve: [], peak: { hour: 19, label: '19:00', predicted_demand: 640, confidence_lower: 590, confidence_upper: 690, confidence_tier: 'High', baseline_demand: 580, status: 'STABLE', timestamp: new Date().toISOString(), explanation: { reason: 'Peak demand at evening hours driven by residential EV charging.', impact: 'Manageable within current capacity.', confidence: 'HIGH' } } },
          h72: { hours: 72, curve: [], peak: { hour: 19, label: '19:00', predicted_demand: 660, confidence_lower: 580, confidence_upper: 740, confidence_tier: 'Medium', baseline_demand: 580, status: 'STABLE', timestamp: new Date().toISOString(), explanation: { reason: 'Weekend pattern expected with slightly elevated demand.', impact: 'Monitor closely on Friday evening.', confidence: 'MEDIUM' } } },
        },
        baseline_comparison: {
          unmanaged: { label: 'Unmanaged', peak_kw: 700 },
          optimized: { label: 'Optimized', peak_kw: 580 },
          current: { label: 'Current', peak_kw: 640 },
          delta_vs_unmanaged_kw: -60,
          reduction_vs_unmanaged_percent: -8.6,
          curves: {
            unmanaged_24h: [],
            optimized_24h: [],
            current_24h: [],
          },
        },
        drift: { observed_kw: 612, drift_percent: 2.0, anomaly: false, reliability_score: 92 },
        generated_at: new Date().toISOString(),
      },
      forecast: { zone_id: 1, zone_name: 'Whitefield', curve: [], peak: { label: '19:00', predicted_demand: 640, confidence_upper: 690 }, model: 'XGBoost' },
      network_summary: {
        total_zones: 10,
        zones_at_risk: 1,
        constrained_zones: 1,
        peak_window: '18:00–20:00',
        highest_headroom_zone: 'Electronic City',
        scenario_delta_kw: 0,
      },
      action_queue: [
        { priority: 'MEDIUM', risk_color: 'yellow', title: 'Pre-position demand response for Koramangala', reason: 'Zone approaching 85% utilization threshold during evening peak.', actions: ['Notify fleet operators', 'Activate DR program'], impact: 'Expected to reduce peak load by 40–60 kW.', confidence: 'MEDIUM' },
      ],
      zone_rankings: [
        { id: 1, name: 'Whitefield', lat: 12.97, lng: 77.63, capacity: 1000, zone_type: 'commercial', predicted_load: 640, headroom_kw: 360, utilization_percent: 64, status: 'STABLE', active: true },
        { id: 2, name: 'Koramangala', lat: 12.93, lng: 77.62, capacity: 900, zone_type: 'commercial', predicted_load: 820, headroom_kw: 80, utilization_percent: 91, status: 'CONSTRAINED', active: false },
        { id: 3, name: 'Indiranagar', lat: 12.97, lng: 77.64, capacity: 750, zone_type: 'residential', predicted_load: 510, headroom_kw: 240, utilization_percent: 68, status: 'STABLE', active: false },
        { id: 4, name: 'Electronic City', lat: 12.85, lng: 77.67, capacity: 1200, zone_type: 'industrial', predicted_load: 680, headroom_kw: 520, utilization_percent: 57, status: 'STABLE', active: false },
      ],
      planning_insights: [
        { headline: 'Expand charging infrastructure in Koramangala', reason: 'Zone is consistently operating above 85% utilization during peak hours, creating grid stress risk.', impact: 'Adding 2 fast-chargers would reduce average utilization to below 75%.', confidence: 'HIGH' },
        { headline: 'Demand response program for Whitefield residential', reason: 'Evening peak between 18:00–20:00 shows consistent 15% spike driven by home EV charging.', impact: 'Incentivised off-peak charging could shift 120 kW of demand to off-peak hours.', confidence: 'MEDIUM' },
      ],
      all_zones: [
        { id: 1, name: 'Whitefield', lat: 12.97, lng: 77.63, capacity: 1000, zone_type: 'commercial', active: true, type: 'commercial' },
        { id: 2, name: 'Koramangala', lat: 12.93, lng: 77.62, capacity: 900, zone_type: 'commercial', active: false, type: 'commercial' },
        { id: 3, name: 'Indiranagar', lat: 12.97, lng: 77.64, capacity: 750, zone_type: 'residential', active: false, type: 'residential' },
        { id: 4, name: 'Electronic City', lat: 12.85, lng: 77.67, capacity: 1200, zone_type: 'industrial', active: false, type: 'industrial' },
        { id: 5, name: 'HSR Layout', lat: 12.91, lng: 77.64, capacity: 800, zone_type: 'residential', active: false, type: 'residential' },
      ],
      spatial: { heatmap_points: [], overload_zones: [], congestion_corridors: [] },
      workflow: { active_actions: [], recent_events: [] },
    };
    return mockOperatorDashboard as T;
  }

  if (path === '/dashboard/summary') return mockDashboardData as T;
  if (path === '/alerts/' || path === '/alerts') return mockAlerts as T;
  if (path === '/locations/roi/' || path === '/locations/roi') return mockROI as T;
  if (path === '/locations/recommend') return mockRecommendations as T;
  if (path === '/realtime/demand') return mockDashboardData.realtime_snapshot as T;
  if (path.startsWith('/demand/')) return getMockDemandPrediction(zoneId) as T;
  if (path.startsWith('/forecast/')) return getMockForecast(zoneId) as T;
  if (path.startsWith('/optimize/')) return getMockOptimization(zoneId) as T;
  if (path.startsWith('/impact/')) return getMockImpact(zoneId) as T;
  if (path === '/simulate/run') return mockSimulation as T;
  if (path.startsWith('/stations/nearby')) return mockNearbyStations as T;
  if (path === '/advanced/data/status') return { is_real_data: false } as T;
  if (path.startsWith('/advanced/impact/realistic')) return getMockRealisticImpact(zoneId) as T;
  if (path === '/advanced/baselines/compare') return mockBaselines as T;
  if (path === '/advanced/model/metrics') return mockModelMetrics as T;
  if (path === '/advanced/analysis/sensitivity') return mockSensitivity as T;
  if (path === '/advanced/analysis/robustness') return mockRobustness as T;
  if (path === '/advanced/scenario/failure') return mockFailureScenario as T;
  if (path.startsWith('/stations/reverse-geocode')) return { city: 'Bengaluru', valid: true } as T;

  return undefined;
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

  getRecommendations: (token: string): Promise<RecommendationLegacy[]> =>
    request<RecommendationLegacy[]>('/locations/recommend', {
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

  getOperatorDashboard: (token: string, zone?: string, scenario: string = 'normal'): Promise<OperatorDashboardPayload> => {
    const params = new URLSearchParams({ scenario });
    if (zone) params.set('zone', zone);
    return request<OperatorDashboardPayload>(`/portal/operator?${params.toString()}`, {
      headers: withAuth(token),
    });
  },

  getUserDashboard: (
    token: string,
    params: {
      lat: number;
      lng: number;
      selected_station_id?: number | null;
      vehicle_model?: string;
      battery_capacity_kwh?: number | null;
      home_charging_access?: boolean | null;
      typical_charging_time?: string | null;
    }
  ): Promise<UserDashboardPayload> => {
    const query = new URLSearchParams({
      lat: String(params.lat),
      lng: String(params.lng),
    });
    if (params.selected_station_id != null) query.set('selected_station_id', String(params.selected_station_id));
    if (params.vehicle_model) query.set('vehicle_model', params.vehicle_model);
    if (params.battery_capacity_kwh != null) query.set('battery_capacity_kwh', String(params.battery_capacity_kwh));
    if (params.home_charging_access != null) query.set('home_charging_access', String(params.home_charging_access));
    if (params.typical_charging_time) query.set('typical_charging_time', params.typical_charging_time);
    return request<UserDashboardPayload>(`/portal/user?${query.toString()}`, {
      headers: withAuth(token),
    });
  },

  acknowledgeAction: (token: string, actionTitle: string): Promise<WorkflowAction> =>
    request<WorkflowAction>('/portal/workflow/acknowledge', {
      method: 'POST',
      headers: withAuth(token),
      body: JSON.stringify({ action_title: actionTitle }),
    }),

  updateActionStatus: (token: string, actionTitle: string, newStatus: string, notes: string = ''): Promise<WorkflowAction> =>
    request<WorkflowAction>('/portal/workflow/update-status', {
      method: 'POST',
      headers: withAuth(token),
      body: JSON.stringify({ action_title: actionTitle, new_status: newStatus, notes }),
    }),

  getWorkflowTimeline: (token: string, limit: number = 50): Promise<{ events: WorkflowEvent[] }> =>
    request<{ events: WorkflowEvent[] }>(`/portal/workflow/timeline?limit=${limit}`, {
      headers: withAuth(token),
    }),
};

// ─── CANONICAL: Copilot Types ───
export interface CopilotMessage {
  query: string;
  answer: string;
  source: 'risk_analysis' | 'forecast' | 'recommendation' | 'optimization' | 'unknown';
  confidence: 'High' | 'Medium' | 'Low';
  data_sources: string[];
  follow_up_suggestions: string[];
  reasoning: Record<string, any>;
}

export interface CopilotHistoryItem {
  timestamp: string;
  query: string;
  answer?: string;
  source?: string;
  role: 'user' | 'assistant';
}

// ─── COPILOT API ───
export const copilotAPI = {
  ask: (
    token: string,
    params: {
      query: string;
      zone_name?: string;
      scenario?: string;
    }
  ): Promise<CopilotMessage> => {
    return request<CopilotMessage>('/ai/copilot/ask', {
      method: 'POST',
      headers: withAuth(token),
      body: JSON.stringify({
        query: params.query,
        zone_name: params.zone_name,
        scenario: params.scenario || 'normal',
      }),
    });
  },

  getHistory: (token: string, limit: number = 20): Promise<{ messages: CopilotHistoryItem[]; total_messages: number }> =>
    request<{ messages: CopilotHistoryItem[]; total_messages: number }>(`/ai/copilot/history?limit=${limit}`, {
      headers: withAuth(token),
    }),

  clearHistory: (token: string): Promise<{ status: string }> =>
    request<{ status: string }>('/ai/copilot/clear', {
      method: 'POST',
      headers: withAuth(token),
    }),
};
