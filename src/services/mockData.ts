import type {
  Alert,
  Baselines,
  DashboardData,
  DemandPrediction,
  FailureScenario,
  Forecast,
  ModelMetrics,
  NearbyStation,
  OptimizationImpact,
  OptimizationResult,
  RealisticImpact,
  RealtimeSnapshot,
  Recommendation,
  RobustnessPoint,
  ROI,
  SensitivityPoint,
  SimulationResult,
} from './api';

const NOW = new Date().toISOString();

export const mockRealtime: RealtimeSnapshot[] = [
  { zone_id: 1, current_demand: 450.5, trend: 'increasing', timestamp: NOW },
  { zone_id: 2, current_demand: 320.1, trend: 'stable', timestamp: NOW },
  { zone_id: 3, current_demand: 890.2, trend: 'decreasing', timestamp: NOW },
  { zone_id: 4, current_demand: 150.0, trend: 'stable', timestamp: NOW },
];

export const mockDashboardData: DashboardData = {
  total_demand: 1810.8,
  peak_load: 890.2,
  optimized_peak: 750.0,
  reduction_percent: 15.7,
  high_risk_zones: [3],
  recommended_zones: [4],
  realtime_snapshot: mockRealtime,
  timestamp: NOW,
};

export const mockAlerts: Alert[] = [
  {
    zone_id: 3,
    alert_type: 'Overload Warning',
    severity: 'High',
    message: 'Zone 3 approaching maximum capacity. Optimization recommended.',
    timestamp: NOW,
  },
  {
    zone_id: 1,
    alert_type: 'Demand Surge',
    severity: 'Medium',
    message: 'Rapid demand increase detected in Zone 1.',
    timestamp: NOW,
  },
];

export const mockROI: ROI[] = [
  {
    zone_id: 4,
    zone_name: 'Tech Park South',
    expected_utilization: 85,
    estimated_roi: 24.5,
    payback_period_months: 18,
    justification: 'High density of new commercial developments and lack of existing infrastructure.',
  },
  {
    zone_id: 5,
    zone_name: 'Highway 99 Junction',
    expected_utilization: 60,
    estimated_roi: 15.2,
    payback_period_months: 24,
    justification: 'Strategic transit corridor with increasing EV traffic.',
  },
];

export const mockRecommendations: Recommendation[] = [
  {
    zone_id: 4,
    zone_name: 'Tech Park South',
    score: 92,
    justification: 'Optimal balance of high expected demand and low installation costs.',
  },
  {
    zone_id: 5,
    zone_name: 'Highway 99 Junction',
    score: 78,
    justification: 'Crucial for network coverage, moderate ROI expected.',
  },
];

export const mockSimulation: SimulationResult = {
  time_series: Array.from({ length: 24 }).map((_, i) => ({
    hour: i,
    demand: 300 + Math.sin((i / 24) * Math.PI) * 500 + Math.random() * 100,
    active_sessions: Math.floor(20 + Math.sin((i / 24) * Math.PI) * 50 + Math.random() * 10),
  })),
  total_sessions: 1250,
  peak_demand: 890.2,
};

export const mockNearbyStations: NearbyStation[] = [
  {
    id: 1,
    name: 'Tata Power Indiranagar',
    lat: 12.9784,
    lng: 77.6408,
    current_load: 86,
    capacity: 160,
    status: 'GREEN',
    recommendation_flag: true,
    distance_km: 1.2,
    queue_time: 0,
    predicted_peak_time: '20:00',
    recommendation: 'Best immediate option: low load and no queue.',
    is_best_option: true,
  },
  {
    id: 2,
    name: 'Ather Grid Koramangala',
    lat: 12.9279,
    lng: 77.6271,
    current_load: 140,
    capacity: 180,
    status: 'YELLOW',
    recommendation_flag: false,
    distance_km: 2.1,
    queue_time: 8,
    predicted_peak_time: '19:30',
  },
  {
    id: 3,
    name: 'ChargeZone Whitefield',
    lat: 12.9698,
    lng: 77.7499,
    current_load: 168,
    capacity: 180,
    status: 'RED',
    recommendation_flag: false,
    distance_km: 3.5,
    queue_time: 18,
    predicted_peak_time: '18:45',
  },
];

export const getMockDemandPrediction = (zoneId: number): DemandPrediction => ({
  demand: zoneId === 3 ? 950.0 : 400.0 + Math.random() * 100,
  confidence: 0.85 + Math.random() * 0.1,
  factors: ['Weather: Clear', 'Time: Peak Commute', 'Local Event: None'],
});

export const getMockForecast = (zoneId: number): Forecast => ({
  zone_id: zoneId,
  forecasts: Array.from({ length: 24 }).map((_, i) => {
    const base = 200 + Math.sin((i / 24) * Math.PI) * 400;
    return {
      hour: i,
      predicted_demand: base + Math.random() * 50,
      confidence_lower: base - 50,
      confidence_upper: base + 100,
      baseline_demand: base,
    };
  }),
  model_accuracy: 0.92,
  baseline_comparison: 'Predicted demand is 5% higher than baseline historical average.',
});

export const getMockOptimization = (zoneId: number): OptimizationResult => ({
  recommended_windows: [
    {
      station_id: 1,
      windows: [
        { hour: 10, power: 45.0, percentage: 80 },
        { hour: 11, power: 50.0, percentage: 100 },
      ],
    },
    {
      station_id: 2,
      windows: [
        { hour: 14, power: 30.0, percentage: 60 },
        { hour: 15, power: 30.0, percentage: 60 },
      ],
    },
  ],
  reason: `Shifted 150kWh from peak hours to off-peak for Zone ${zoneId}.`,
  confidence: 0.88,
});

export const getMockImpact = (zoneId: number): OptimizationImpact => ({
  before_peak: 890.2,
  after_peak: 750.0,
  reduction_percent: 15.7,
  zone_id: zoneId,
});

export const getMockRealisticImpact = (zoneId: number, adoptionRate = 0.6): RealisticImpact => ({
  zone_id: zoneId,
  ideal_peak_reduction: '22.4%',
  user_adoption_rate: `${Math.round(adoptionRate * 100)}%`,
  realistic_peak_reduction: `${(22.4 * adoptionRate).toFixed(1)}%`,
  explanation: {
    demand_weight: 0.74,
    time_factor: 0.81,
    spillover: 0.12,
  },
});

export const mockBaselines: Baselines = {
  no_optimization: { peak_load: 890, utilization: '96%', cost_efficiency: 'Low' },
  random_allocation: { peak_load: 810, utilization: '88%', cost_efficiency: 'Medium' },
  rule_based_night: { peak_load: 760, utilization: '82%', cost_efficiency: 'Medium' },
  uniform_placement: { peak_load: 795, utilization: '86%', cost_efficiency: 'Medium' },
  ai_optimized: { peak_load: 680, utilization: '73%', cost_efficiency: 'High', improvement: '23.6% lower peak load' },
};

export const mockModelMetrics: ModelMetrics = {
  mae: 42.3,
  rmse: 58.7,
  mape: 8.9,
  data_points: 17520,
  validation_note: 'Validated with synthetic Bengaluru feeder profiles and EV session patterns.',
};

export const mockSensitivity: SensitivityPoint[] = [
  { uncertainty: 'Low', adoption: '40%', peak_reduction: 10.4 },
  { uncertainty: 'Medium', adoption: '60%', peak_reduction: 15.7 },
  { uncertainty: 'High', adoption: '80%', peak_reduction: 20.1 },
];

export const mockRobustness: RobustnessPoint[] = [
  { missing_data: '0%', accuracy: 92 },
  { missing_data: '10%', accuracy: 89 },
  { missing_data: '25%', accuracy: 84 },
];

export const mockFailureScenario: FailureScenario = {
  scenario_type: 'Whitefield feeder overload',
  impact: 'Predicted 18-minute local queue and 94% transformer utilization.',
  ai_response: [
    'Divert 32% of flexible sessions to Indiranagar and Jayanagar.',
    'Move non-urgent charging from 7 PM to 11 PM.',
    'Reserve emergency capacity for buses and fleet depots.',
  ],
  grid_stability_recovered_in: '11 minutes',
};
