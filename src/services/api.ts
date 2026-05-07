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
  mockRobustness,
  mockROI,
  mockSensitivity,
  mockSimulation,
} from './mockData';
import { z } from 'zod';

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
  incidents: Array<{
    id: string;
    title: string;
    zone: string;
    severity: string;
    status: string;
    timeline_headline: string;
    reason: string;
    impact: string;
  }>;
  stations: Array<Station & {
    queue_trend: string;
    predicted_wait_growth: number;
    health_score: number;
    connector_availability: number;
    active_sessions: number;
    load_capacity_ratio: number;
    downtime_probability: number;
  }>;
  system_health: {
    backend_latency_ms: number;
    api_health: string;
    polling_health: string;
    forecast_engine_status: string;
    db_connectivity: string;
    model_drift_percent: number;
    memory_usage_mb: number;
    uptime_hours: number;
    cache_health: string;
    transport_status: string;
    heartbeat_at: string;
    selected_zone_observed_kw?: number | null;
    scenario: string;
  };
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
  route_planner: {
    destination: string;
    battery_percent: number;
    current_route: RoutePayload | null;
    selected_station_name: string | null;
    route_options: Array<{
      station_id: number;
      station_name: string;
      eta_minutes: number;
      queue_at_arrival_minutes: number;
      total_stop_minutes: number;
      headline: string;
      why: string;
    }>;
  };
  workspace_state: {
    history: Array<Record<string, any>>;
    saved: {
      stations: Array<Record<string, any>>;
      routes: Array<Record<string, any>>;
      windows: Array<Record<string, any>>;
    };
    alerts: Array<{
      id: string;
      title: string;
      message: string;
      severity: string;
      read: boolean;
      dismissed: boolean;
      created_at: string;
    }>;
    wallet: {
      balance_inr: number;
      monthly_savings_inr: number;
      transactions: Array<Record<string, any>>;
    };
    settings: {
      notification_enabled: boolean;
      queue_alerts: boolean;
      price_alerts: boolean;
      preferred_speed: string;
      privacy_mode: boolean;
    };
  };
}

// ─── Backend liveness flag (set by request()) ───
// true  = last request reached the real backend
// false = last request hit the frontend fallback
export let isBackendLive = false;

const operatorDashboardSchema = z.object({
  role: z.literal('operator'),
  scenario: z.string(),
  zone: z.object({ id: z.number(), name: z.string() }).passthrough(),
  grid_stress: z.object({ predicted_load: z.number(), capacity: z.number(), status: z.string() }).passthrough(),
  action_queue: z.array(z.any()),
  zone_rankings: z.array(z.any()),
  all_zones: z.array(z.any()),
}).passthrough();

const userDashboardSchema = z.object({
  role: z.literal('user'),
  effective_location: z.object({ lat: z.number(), lng: z.number() }).passthrough(),
  station_options: z.array(z.any()),
  decision_support: z.object({ target_energy_kwh: z.number(), public_cost_inr: z.number() }).passthrough(),
  workspace_state: z.object({
    history: z.array(z.any()),
    saved: z.object({
      stations: z.array(z.any()),
      routes: z.array(z.any()),
      windows: z.array(z.any()),
    }).passthrough(),
    alerts: z.array(z.any()),
    wallet: z.object({ balance_inr: z.number(), monthly_savings_inr: z.number(), transactions: z.array(z.any()) }).passthrough(),
    settings: z.object({
      notification_enabled: z.boolean(),
      queue_alerts: z.boolean(),
      price_alerts: z.boolean(),
      preferred_speed: z.string(),
      privacy_mode: z.boolean(),
    }).passthrough(),
  }).passthrough(),
}).passthrough();

const copilotMessageSchema = z.object({
  query: z.string(),
  answer: z.string(),
  source: z.enum(['risk_analysis', 'forecast', 'recommendation', 'optimization', 'unknown']),
  confidence: z.enum(['High', 'Medium', 'Low']),
  data_sources: z.array(z.string()),
  follow_up_suggestions: z.array(z.string()),
  reasoning: z.record(z.string(), z.any()),
});

// ─── Deterministic forecast curve ───
// Derives a 24-hour demand curve from a base capacity value.
// No randomness — same input always produces the same shape.
function generateForecastCurve(baseCapacity: number): ForecastPoint[] {
  const shape = [
    0.42, 0.40, 0.38, 0.37, 0.38, 0.42, // 00–05 night trough
    0.56, 0.68, 0.72, 0.70, 0.67, 0.65, // 06–11 morning ramp + midday
    0.64, 0.63, 0.64, 0.66, 0.72, 0.88, // 12–17 afternoon + pre-peak
    0.95, 0.98, 0.94, 0.84, 0.70, 0.58, // 18–23 evening peak + wind-down
  ];
  const now = new Date().toISOString();
  return shape.map((factor, hour) => {
    const demand = Math.round(baseCapacity * factor);
    const utilization = factor * 100;
    const status: ForecastPoint['status'] =
      utilization > 90 ? 'OVERLOAD RISK' : utilization > 75 ? 'CONSTRAINED' : 'STABLE';
    const tier: ForecastPoint['confidence_tier'] = utilization > 85 ? 'Medium' : 'High';
    return {
      hour,
      label: `${String(hour).padStart(2, '0')}:00`,
      predicted_demand: demand,
      confidence_lower: Math.round(demand * 0.92),
      confidence_upper: Math.round(demand * 1.08),
      confidence_tier: tier,
      baseline_demand: Math.round(baseCapacity * factor * 0.88),
      status,
      timestamp: now,
      explanation: {
        reason: hour >= 18 && hour <= 21 ? 'Evening EV charging peak driven by residential demand.' : 'Demand within normal operating range.',
        impact: status === 'STABLE' ? 'No action required.' : 'Monitor load closely.',
        confidence: tier === 'High' ? 'HIGH' : 'MEDIUM',
      },
    };
  });
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const fallback = getFallbackResponse<T>(path);
  const allowForcedLocalFallback =
    !path.startsWith('/portal/') &&
    !path.startsWith('/stations/nearby') &&
    path !== '/locations/recommend';

  if (fallback !== undefined && allowForcedLocalFallback && shouldUseLocalFallback(init?.headers)) {
    isBackendLive = false;
    return fallback;
  }

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
      isBackendLive = true;
      return raw.data as T;
    }

    isBackendLive = true;
    return raw as T;
  } catch (error) {
    if (path.startsWith('/ai/copilot')) {
      throw error;
    }
    if (fallback !== undefined) {
      isBackendLive = false;
      return fallback;
    }
    throw error;
  }
}

function withAuth(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

function shouldUseLocalFallback(headers?: HeadersInit): boolean {
  const authHeader =
    headers instanceof Headers
      ? headers.get('Authorization')
      : Array.isArray(headers)
        ? headers.find(([key]) => key.toLowerCase() === 'authorization')?.[1]
        : headers?.Authorization || headers?.authorization;
  const token = typeof authHeader === 'string' ? authHeader.replace(/^Bearer\s+/i, '') : '';
  const payload = token.split('.')[1];
  if (!payload) return false;

  try {
    const decoded = JSON.parse(atob(payload));
    return decoded?.auth_source === 'demo' || decoded?.is_demo === true;
  } catch {
    return false;
  }
}

function getFallbackResponse<T>(path: string): T | undefined {
  const zoneMatch = path.match(/\/(?:demand|forecast|optimize|impact)\/(\d+)/);
  const zoneId = zoneMatch ? Number(zoneMatch[1]) : 1;

  if (path.startsWith('/portal/workflow/')) {
    const now = new Date().toISOString();
    return {
      id: `local-workflow-${Date.now()}`,
      title: 'Local workflow action',
      status: path.includes('acknowledge') ? 'acknowledged' : 'updated',
      created_at: now,
      updated_at: now,
      history: [],
    } as T;
  }

  if (path.startsWith('/portal/operator')) {
    const params = new URLSearchParams(path.split('?')[1] ?? '');
    const requestedScenario = params.get('scenario') || 'normal';
    const requestedZone = params.get('zone') || 'Whitefield';
    const scenarioFactorById: Record<string, number> = {
      normal: 1,
      evening_peak: 1.18,
      high_growth: 1.32,
      station_outage: 1.22,
      festival_surge: 1.42,
    };
    const scenarioFactor = scenarioFactorById[requestedScenario] ?? 1;
    const scenarioDeltaKw = Math.round((scenarioFactor - 1) * 420);
    const zoneCatalog: Array<Zone & { type: string; base_load: number }> = [
      { id: 1, name: 'Whitefield', lat: 12.97, lng: 77.63, capacity: 1000, zone_type: 'commercial', type: 'commercial', base_load: 640 },
      { id: 2, name: 'Koramangala', lat: 12.93, lng: 77.62, capacity: 900, zone_type: 'commercial', type: 'commercial', base_load: 820 },
      { id: 3, name: 'Indiranagar', lat: 12.97, lng: 77.64, capacity: 750, zone_type: 'residential', type: 'residential', base_load: 510 },
      { id: 4, name: 'Electronic City', lat: 12.85, lng: 77.67, capacity: 1200, zone_type: 'industrial', type: 'industrial', base_load: 680 },
      { id: 5, name: 'HSR Layout', lat: 12.91, lng: 77.64, capacity: 800, zone_type: 'residential', type: 'residential', base_load: 560 },
    ];
    const activeFallbackZone = zoneCatalog.find((zone) => zone.name === requestedZone) ?? zoneCatalog[0];
    const cap = activeFallbackZone.capacity;
    const selectedLoad = Math.round(activeFallbackZone.base_load * scenarioFactor);
    const selectedUtilization = selectedLoad / cap;
    const selectedStatus: GridStress['status'] = selectedUtilization > 0.95 ? 'OVERLOAD RISK' : selectedUtilization > 0.78 ? 'CONSTRAINED' : 'STABLE';
    const selectedRiskBand: OperatorDashboardPayload['risk_engine']['risk_band'] =
      selectedStatus === 'OVERLOAD RISK' ? 'CRITICAL' : selectedStatus === 'CONSTRAINED' ? 'HIGH' : selectedUtilization > 0.68 ? 'MEDIUM' : 'LOW';
    const curve = generateForecastCurve(cap).map((point) => ({
      ...point,
      predicted_demand: Math.round(point.predicted_demand * scenarioFactor),
      confidence_lower: Math.round(point.confidence_lower * scenarioFactor),
      confidence_upper: Math.round(point.confidence_upper * scenarioFactor),
    }));
    const mockOperatorDashboard: OperatorDashboardPayload = {
      role: 'operator',
      scenario: requestedScenario,
      scenario_options: [
        { id: 'normal', label: 'Normal Operations', active: requestedScenario === 'normal' },
        { id: 'evening_peak', label: 'Evening Peak', active: requestedScenario === 'evening_peak' },
        { id: 'high_growth', label: 'High Growth', active: requestedScenario === 'high_growth' },
        { id: 'station_outage', label: 'Station Outage', active: requestedScenario === 'station_outage' },
        { id: 'festival_surge', label: 'Festival Surge', active: requestedScenario === 'festival_surge' },
      ],
      zone: activeFallbackZone,
      grid_stress: {
        status: selectedStatus,
        predicted_load: selectedLoad,
        capacity: cap,
        delta_kw: selectedLoad - cap,
        overload_percent: Math.round(selectedUtilization * 100),
        explanation: {
          reason: `${activeFallbackZone.name} is running the ${requestedScenario.replace(/_/g, ' ')} fallback scenario.`,
          impact: selectedStatus === 'STABLE' ? 'No immediate action required.' : 'Operator action is recommended before the evening peak.',
          confidence: selectedStatus === 'OVERLOAD RISK' ? 'MEDIUM' : 'HIGH',
        },
      },
      risk_engine: {
        zone: activeFallbackZone.name,
        overload_probability: Math.min(0.98, Math.max(0.08, selectedUtilization - 0.55)),
        risk_score: Math.min(100, Math.round(selectedUtilization * 100)),
        risk_band: selectedRiskBand,
        projected_peak_timing: '19:00',
        confidence_level: selectedStatus === 'OVERLOAD RISK' ? 'MEDIUM' : 'HIGH',
      },
      ops_summary: {
        urgency: selectedRiskBand,
        briefing: `${activeFallbackZone.name} is selected. The ${requestedScenario.replace(/_/g, ' ')} scenario changes projected demand by ${scenarioDeltaKw >= 0 ? '+' : ''}${scenarioDeltaKw} kW.`,
        signals: { scenario: requestedScenario, scenario_delta_kw: scenarioDeltaKw, peak_time: '19:00', predicted_peak_kw: selectedLoad, capacity_kw: cap, suggested_relief_zone: 'Electronic City' },
      },
      event_ticker: [
        { timestamp: new Date(Date.now() - 300000).toISOString(), type: 'station_online', severity: 'INFO', message: 'Charging station came online at Whitefield Plaza' },
        { timestamp: new Date(Date.now() - 600000).toISOString(), type: 'demand_spike', severity: 'MEDIUM', message: 'Demand spike detected in Koramangala zone' },
      ],
      top_risk_zones: [
        { zone: 'Koramangala', current_load: 820, predicted_peak: 950, overload_risk: 12.5, confidence: 'HIGH', recommended_action: 'Monitor load — approaching constrained threshold' },
        { zone: 'Indiranagar', current_load: 680, predicted_peak: 740, overload_risk: 4.2, confidence: 'MEDIUM', recommended_action: 'No action required' },
      ],
      forecast_center: {
        zone_id: activeFallbackZone.id,
        zone_name: activeFallbackZone.name,
        scenario: requestedScenario,
        horizons: {
          h6: { hours: 6, curve: curve.slice(12, 18), peak: { hour: 18, label: '18:00', predicted_demand: 580, confidence_lower: 540, confidence_upper: 620, confidence_tier: 'High', baseline_demand: 520, status: 'STABLE', timestamp: new Date().toISOString(), explanation: { reason: 'Normal evening ramp-up expected.', impact: 'Grid stable.', confidence: 'HIGH' } } },
          h24: { hours: 24, curve, peak: { hour: 19, label: '19:00', predicted_demand: 640, confidence_lower: 590, confidence_upper: 690, confidence_tier: 'High', baseline_demand: 580, status: 'STABLE', timestamp: new Date().toISOString(), explanation: { reason: 'Peak demand at evening hours driven by residential EV charging.', impact: 'Manageable within current capacity.', confidence: 'HIGH' } } },
          h72: { hours: 72, curve, peak: { hour: 19, label: '19:00', predicted_demand: 660, confidence_lower: 580, confidence_upper: 740, confidence_tier: 'Medium', baseline_demand: 580, status: 'STABLE', timestamp: new Date().toISOString(), explanation: { reason: 'Weekend pattern expected with slightly elevated demand.', impact: 'Monitor closely on Friday evening.', confidence: 'MEDIUM' } } },
        },
        baseline_comparison: {
          unmanaged: { label: 'Unmanaged', peak_kw: 700 },
          optimized: { label: 'Optimized', peak_kw: 580 },
          current: { label: 'Current', peak_kw: 640 },
          delta_vs_unmanaged_kw: -60,
          reduction_vs_unmanaged_percent: -8.6,
          curves: { unmanaged_24h: generateForecastCurve(700), optimized_24h: generateForecastCurve(580), current_24h: curve },
        },
        drift: { observed_kw: 612, drift_percent: 2.0, anomaly: false, reliability_score: 92 },
        generated_at: new Date().toISOString(),
      },
      forecast: { zone_id: activeFallbackZone.id, zone_name: activeFallbackZone.name, curve, peak: { label: '19:00', predicted_demand: selectedLoad, confidence_upper: Math.round(selectedLoad * 1.08) }, model: 'XGBoost' },
      network_summary: {
        total_zones: zoneCatalog.length,
        zones_at_risk: selectedStatus === 'STABLE' ? 1 : 2,
        constrained_zones: selectedStatus === 'STABLE' ? 1 : 2,
        peak_window: '18:00–20:00',
        highest_headroom_zone: 'Electronic City',
        scenario_delta_kw: scenarioDeltaKw,
      },
      action_queue: [
        { priority: 'MEDIUM', risk_color: 'yellow', title: 'Pre-position demand response for Koramangala', reason: 'Zone approaching 85% utilization threshold during evening peak.', actions: ['Notify fleet operators', 'Activate DR program'], impact: 'Expected to reduce peak load by 40–60 kW.', confidence: 'MEDIUM' },
      ],
      zone_rankings: zoneCatalog.map((zone) => {
        const predicted_load = Math.round(zone.base_load * scenarioFactor);
        const utilization_percent = Math.round((predicted_load / zone.capacity) * 100);
        return {
          ...zone,
          predicted_load,
          headroom_kw: zone.capacity - predicted_load,
          utilization_percent,
          status: utilization_percent > 95 ? 'OVERLOAD RISK' : utilization_percent > 78 ? 'CONSTRAINED' : 'STABLE',
          active: zone.id === activeFallbackZone.id,
        };
      }),
      planning_insights: [
        { headline: 'Expand charging infrastructure in Koramangala', reason: 'Zone is consistently operating above 85% utilization during peak hours, creating grid stress risk.', impact: 'Adding 2 fast-chargers would reduce average utilization to below 75%.', confidence: 'HIGH' },
        { headline: 'Demand response program for Whitefield residential', reason: 'Evening peak between 18:00–20:00 shows consistent 15% spike driven by home EV charging.', impact: 'Incentivised off-peak charging could shift 120 kW of demand to off-peak hours.', confidence: 'MEDIUM' },
      ],
      all_zones: zoneCatalog.map((zone) => ({ ...zone, active: zone.id === activeFallbackZone.id })),
      spatial: { heatmap_points: [], overload_zones: [], congestion_corridors: [] },
      workflow: { active_actions: [], recent_events: [] },
      incidents: [],
      stations: [
        { id: 1, name: 'Tata Power EV Hub — Whitefield', lat: 12.968, lng: 77.632, operator: 'Tata Power', status: 'GREEN', load: 42, capacity: 120, distance: 0.8, wait_time: 5, zone_name: 'Whitefield', utilization_percent: 35, queue_trend: 'stable', predicted_wait_growth: 2, health_score: 94, connector_availability: 7, active_sessions: 6, load_capacity_ratio: 0.35, downtime_probability: 0.04 },
        { id: 2, name: 'Ather Grid — Koramangala', lat: 12.932, lng: 77.622, operator: 'Ather Energy', status: 'YELLOW', load: 82, capacity: 100, distance: 1.4, wait_time: 18, zone_name: 'Koramangala', utilization_percent: 82, queue_trend: 'rising', predicted_wait_growth: 8, health_score: 78, connector_availability: 3, active_sessions: 12, load_capacity_ratio: 0.82, downtime_probability: 0.12 },
        { id: 3, name: 'ChargeZone — Electronic City', lat: 12.852, lng: 77.671, operator: 'ChargeZone', status: 'GREEN', load: 55, capacity: 200, distance: 2.1, wait_time: 0, zone_name: 'Electronic City', utilization_percent: 28, queue_trend: 'falling', predicted_wait_growth: 0, health_score: 97, connector_availability: 10, active_sessions: 5, load_capacity_ratio: 0.28, downtime_probability: 0.02 },
      ],
      system_health: {
        backend_latency_ms: 120,
        api_health: 'healthy',
        polling_health: 'healthy',
        forecast_engine_status: 'active',
        db_connectivity: 'connected',
        model_drift_percent: 2,
        memory_usage_mb: 184,
        uptime_hours: 24,
        cache_health: 'warm',
        transport_status: 'polling',
        heartbeat_at: new Date().toISOString(),
        selected_zone_observed_kw: 612,
        scenario: requestedScenario,
      },
    };
    return mockOperatorDashboard as T;
  }

  // User dashboard fallback — prevents 500 when backend is down
  if (path.startsWith('/portal/user')) {
    const mockUserDashboard: UserDashboardPayload = {
      role: 'user',
      zone: { id: 1, name: 'Whitefield', lat: 12.97, lng: 77.63, capacity: 1000, zone_type: 'commercial' },
      effective_location: { lat: 12.97, lng: 77.63 },
      profile_context: { vehicle_model: 'Tata Nexon EV', battery_capacity_kwh: 45, home_charging_access: true, typical_charging_time: 'Night' },
      service_area_notice: null,
      nearest_station: { id: 1, name: 'Tata Power EV Hub — Whitefield', lat: 12.968, lng: 77.632, operator: 'Tata Power', status: 'GREEN', load: 42, capacity: 120, distance: 0.8, wait_time: 5, zone_name: 'Whitefield', utilization_percent: 35, connector_types: ['CCS2', 'Type 2'], charging_speed: 'fast' },
      selected_station: null,
      route: null,
      station_options: [
        { id: 1, name: 'Tata Power EV Hub — Whitefield', lat: 12.968, lng: 77.632, operator: 'Tata Power', status: 'GREEN', load: 42, capacity: 120, distance: 0.8, wait_time: 5, zone_name: 'Whitefield', utilization_percent: 35, connector_types: ['CCS2', 'Type 2'], charging_speed: 'fast' },
        { id: 2, name: 'Ather Grid — Phoenix Marketcity', lat: 12.972, lng: 77.641, operator: 'Ather Energy', status: 'YELLOW', load: 88, capacity: 100, distance: 1.4, wait_time: 18, zone_name: 'Whitefield', utilization_percent: 88, connector_types: ['Ather'], charging_speed: 'fast' },
        { id: 3, name: 'ChargeZone — Prestige Tech Park', lat: 12.962, lng: 77.625, operator: 'ChargeZone', status: 'GREEN', load: 55, capacity: 200, distance: 2.1, wait_time: 0, zone_name: 'Whitefield', utilization_percent: 28, connector_types: ['CCS2', 'CHAdeMO'], charging_speed: 'rapid' },
      ],
      alternatives: [],
      decision_support: {
        target_energy_kwh: 22,
        estimated_session_minutes: 45,
        public_cost_inr: 285,
        home_cost_inr: null,
        savings_vs_home_inr: null,
        queue_time_savings_minutes: 13,
        route_provider: 'openroute',
        home_charge_recommended: false,
        congestion_reduction_percent: 35,
        best_time_benefit: 'Save ₹35–60 by charging after 23:00 during low-demand window.',
        recommended_action: { type: 'charge_now', headline: 'Charge now at Tata Power EV Hub', why: 'Grid load is low and your nearest station has short wait time. Off-peak rates apply until 18:00.', benefits: ['35% utilization — minimal queue', 'Off-peak rate saves ~₹40', 'Grid headroom sufficient for fast charging'], confidence: 'HIGH' },
        charge_now: {
          best_station_right_now: { station_id: 1, station_name: 'Tata Power EV Hub — Whitefield', station_lat: 12.968, station_lng: 77.632, distance_km: 0.8, wait_time_minutes: 5, utilization_percent: 35, estimated_total_minutes: 45, headline: 'Closest available station', why: 'Closest station with available capacity and off-peak rates.', confidence: 'HIGH' },
          wait_time_saved: { minutes: 18, why: 'Recommended station has 13 min less wait than the area average.' },
          cheapest_option: { type: 'station' as const, station_id: 3, station_name: 'ChargeZone — Prestige Tech Park', station_lat: 12.962, station_lng: 77.625, estimated_cost_inr: 240, why: 'Rapid charger at off-peak rate. Faster session reduces total cost.', confidence: 'HIGH' },
          fastest_option: { station_id: 3, station_name: 'ChargeZone — Prestige Tech Park', station_lat: 12.962, station_lng: 77.625, distance_km: 2.1, wait_time_minutes: 0, utilization_percent: 28, estimated_total_minutes: 32, headline: '150 kW rapid charger — no queue', why: 'Rapid 150 kW charger with no current queue.', confidence: 'HIGH' },
          lowest_congestion_option: { station_id: 3, station_name: 'ChargeZone — Prestige Tech Park', station_lat: 12.962, station_lng: 77.625, distance_km: 2.1, wait_time_minutes: 0, utilization_percent: 28, estimated_total_minutes: 32, headline: 'Lowest load in area', why: 'Lowest utilization in your area right now.', confidence: 'HIGH' },
        },
      },
      charging_recommendation: { time_label: '23:00', predicted_demand: 380, headline: 'Best charging window: 11 PM – 1 AM', reason: 'Demand drops 40% after 22:00 as commercial load clears. Off-peak rates apply.', impact: 'Save ₹35–60 vs peak charging cost.', confidence: 'HIGH' },
      load_context: { prediction: 600, confidence_lower: 550, confidence_upper: 650, status: 'STABLE', explanation: { reason: 'Demand within normal range.', impact: 'No grid constraints on charging.', confidence: 'HIGH' } },
      route_planner: {
        destination: 'Flexible charging stop',
        battery_percent: 38,
        current_route: null,
        selected_station_name: 'Tata Power EV Hub — Whitefield',
        route_options: [],
      },
      workspace_state: {
        history: [],
        saved: { stations: [], routes: [], windows: [] },
        alerts: [],
        wallet: { balance_inr: 1800, monthly_savings_inr: 0, transactions: [] },
        settings: {
          notification_enabled: true,
          queue_alerts: true,
          price_alerts: true,
          preferred_speed: 'fast',
          privacy_mode: false,
        },
      },
    };
    return mockUserDashboard as T;
  }

  if (path === '/dashboard/summary') return mockDashboardData as T;
  if (path === '/alerts/' || path === '/alerts') return mockAlerts as T;
  if (path === '/locations/roi/' || path === '/locations/roi') return mockROI as T;
  if (path === '/realtime/demand') return mockDashboardData.realtime_snapshot as T;
  if (path.startsWith('/demand/')) return getMockDemandPrediction(zoneId) as T;
  if (path.startsWith('/forecast/')) return getMockForecast(zoneId) as T;
  if (path.startsWith('/optimize/')) return getMockOptimization(zoneId) as T;
  if (path.startsWith('/impact/')) return getMockImpact(zoneId) as T;
  if (path === '/simulate/run') return mockSimulation as T;
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
    }).then((payload) => operatorDashboardSchema.parse(payload) as unknown as OperatorDashboardPayload);
  },

  getUserDashboard: (
    token: string,
    params: {
      lat: number;
      lng: number;
      selected_station_id?: number | null;
      vehicle_model?: string;
      battery_capacity_kwh?: number | null;
      battery_percent?: number | null;
      home_charging_access?: boolean | null;
      typical_charging_time?: string | null;
      destination?: string;
    }
  ): Promise<UserDashboardPayload> => {
    const query = new URLSearchParams({
      lat: String(params.lat),
      lng: String(params.lng),
    });
    if (params.selected_station_id != null) query.set('selected_station_id', String(params.selected_station_id));
    if (params.vehicle_model) query.set('vehicle_model', params.vehicle_model);
    if (params.battery_capacity_kwh != null) query.set('battery_capacity_kwh', String(params.battery_capacity_kwh));
    if (params.battery_percent != null) query.set('battery_percent', String(params.battery_percent));
    if (params.home_charging_access != null) query.set('home_charging_access', String(params.home_charging_access));
    if (params.typical_charging_time) query.set('typical_charging_time', params.typical_charging_time);
    if (params.destination) query.set('destination', params.destination);
    return request<UserDashboardPayload>(`/portal/user?${query.toString()}`, {
      headers: withAuth(token),
    }).then((payload) => userDashboardSchema.parse(payload) as unknown as UserDashboardPayload);
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

  saveUserStation: (token: string, stationId: number) =>
    request<UserDashboardPayload['workspace_state']>('/portal/user/save-station', {
      method: 'POST',
      headers: withAuth(token),
      body: JSON.stringify({ station_id: stationId }),
    }),

  unsaveUserStation: (token: string, stationId: number) =>
    request<UserDashboardPayload['workspace_state']>('/portal/user/unsave-station', {
      method: 'POST',
      headers: withAuth(token),
      body: JSON.stringify({ station_id: stationId }),
    }),

  saveUserRoute: (token: string, route: { station_id: number; station_name: string; distance_km: number; eta_minutes: number }) =>
    request<UserDashboardPayload['workspace_state']>('/portal/user/save-route', {
      method: 'POST',
      headers: withAuth(token),
      body: JSON.stringify(route),
    }),

  saveChargingWindow: (token: string, window: { time_label: string; predicted_demand: number; headline: string }) =>
    request<UserDashboardPayload['workspace_state']>('/portal/user/save-window', {
      method: 'POST',
      headers: withAuth(token),
      body: JSON.stringify(window),
    }),

  removeChargingWindow: (token: string, window: { time_label: string; predicted_demand: number; headline: string }) =>
    request<UserDashboardPayload['workspace_state']>('/portal/user/remove-window', {
      method: 'POST',
      headers: withAuth(token),
      body: JSON.stringify(window),
    }),

  scheduleUserCharge: (token: string, schedule: { station_name: string; time_label: string; estimated_cost_inr: number; energy_kwh: number }) =>
    request<UserDashboardPayload['workspace_state']>('/portal/user/schedule', {
      method: 'POST',
      headers: withAuth(token),
      body: JSON.stringify(schedule),
    }),

  recordUserNavigation: (token: string, trip: { station_id: number; station_name: string; distance_km: number; eta_minutes: number }) =>
    request<UserDashboardPayload['workspace_state']>('/portal/user/record-navigation', {
      method: 'POST',
      headers: withAuth(token),
      body: JSON.stringify(trip),
    }),

  updateUserAlert: (token: string, alert: { alert_id: string; read?: boolean; dismissed?: boolean }) =>
    request<UserDashboardPayload['workspace_state']>('/portal/user/alert', {
      method: 'POST',
      headers: withAuth(token),
      body: JSON.stringify(alert),
    }),

  rechargeUserWallet: (token: string, amount_inr: number) =>
    request<UserDashboardPayload['workspace_state']>('/portal/user/wallet/recharge', {
      method: 'POST',
      headers: withAuth(token),
      body: JSON.stringify({ amount_inr }),
    }),

  updateUserSettings: (token: string, patch: Partial<UserDashboardPayload['workspace_state']['settings']>) =>
    request<UserDashboardPayload['workspace_state']>('/portal/user/settings', {
      method: 'POST',
      headers: withAuth(token),
      body: JSON.stringify(patch),
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
    }).then((payload) => copilotMessageSchema.parse(payload) as CopilotMessage);
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
