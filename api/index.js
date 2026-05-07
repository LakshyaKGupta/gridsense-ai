const now = () => new Date().toISOString();

const zones = [
  { id: 1, name: 'Indiranagar', lat: 12.9784, lng: 77.6408, capacity: 1000, current_demand: 450, status: 'GREEN' },
  { id: 2, name: 'Koramangala', lat: 12.9279, lng: 77.6271, capacity: 1000, current_demand: 520, status: 'YELLOW' },
  { id: 3, name: 'Whitefield', lat: 12.9698, lng: 77.7499, capacity: 1000, current_demand: 680, status: 'RED' },
  { id: 4, name: 'Electronic City', lat: 12.8399, lng: 77.6770, capacity: 1000, current_demand: 380, status: 'GREEN' },
  { id: 5, name: 'Jayanagar', lat: 12.9299, lng: 77.5826, capacity: 1000, current_demand: 420, status: 'GREEN' },
  { id: 6, name: 'MG Road', lat: 12.9752, lng: 77.6060, capacity: 900, current_demand: 470, status: 'YELLOW' },
  { id: 7, name: 'Manyata Tech Park', lat: 13.0420, lng: 77.6200, capacity: 850, current_demand: 610, status: 'YELLOW' },
  { id: 8, name: 'Yelahanka', lat: 13.1007, lng: 77.5963, capacity: 760, current_demand: 310, status: 'GREEN' },
  { id: 9, name: 'JP Nagar', lat: 12.9063, lng: 77.5857, capacity: 820, current_demand: 390, status: 'GREEN' },
  { id: 10, name: 'Hebbal', lat: 13.0358, lng: 77.5970, capacity: 880, current_demand: 560, status: 'YELLOW' },
  { id: 11, name: 'Banashankari', lat: 12.9255, lng: 77.5468, capacity: 760, current_demand: 340, status: 'GREEN' },
  { id: 12, name: 'Airport Corridor', lat: 13.1986, lng: 77.7066, capacity: 950, current_demand: 520, status: 'YELLOW' },
];

const DEFAULT_ACTION_TEMPLATES = [
  {
    priority: 'HIGH',
    risk_color: 'orange',
    title: 'Shift public charging away from 18:00–20:00',
    reason: 'Evening queue pressure is concentrated in Koramangala and MG Road.',
    actions: ['Broadcast off-peak pricing', 'Redirect low-SOC drivers to lower-load corridors', 'Track queue growth every 15 min'],
    impact: 'Reduces visible queue pressure during the highest congestion window.',
    confidence: 'HIGH',
  },
  {
    priority: 'MEDIUM',
    risk_color: 'yellow',
    title: 'Audit charger uptime in the airport corridor',
    reason: 'Airport-corridor stations are carrying spillover demand and need high availability.',
    actions: ['Verify connector health', 'Pre-stage maintenance crew', 'Keep one bay reserved for rapid turnover'],
    impact: 'Protects headroom on long-distance travel corridors.',
    confidence: 'MEDIUM',
  },
];

const userWorkspaceStore = new Map();
const operatorWorkflowStore = new Map();

const baseStations = [
  { id: 900001, name: 'Ather Charging Grid', lat: 12.9756680, lng: 77.6413089, operator: 'Ather Energy', zone_name: 'Indiranagar' },
  { id: 900002, name: 'Ather Charging Station', lat: 12.9311453, lng: 77.6238461, operator: 'ChargePoint', zone_name: 'Koramangala' },
  { id: 900003, name: 'Battery Swap', lat: 12.9285835, lng: 77.6241904, operator: 'ChargePoint', zone_name: 'Koramangala' },
  { id: 900004, name: 'Battery Swapping Station', lat: 12.8894274, lng: 77.5563647, operator: 'Battery Swap', zone_name: 'JP Nagar' },
  { id: 900005, name: 'Honda e:swap', lat: 13.0000143, lng: 77.5499059, operator: 'Honda e:swap', zone_name: 'Hebbal' },
  { id: 900006, name: 'Honda e:swap', lat: 12.9781045, lng: 77.6389105, operator: 'Honda e:swap', zone_name: 'Indiranagar' },
  { id: 900007, name: 'Honda e:swap', lat: 12.9383537, lng: 77.5802162, operator: 'Honda e:swap', zone_name: 'Jayanagar' },
  { id: 900008, name: 'Honda e:swap', lat: 12.9217078, lng: 77.5805052, operator: 'Honda e:swap', zone_name: 'Jayanagar' },
  { id: 900009, name: 'Honda e:swap', lat: 13.0330528, lng: 77.5337570, operator: 'Honda e:swap', zone_name: 'Hebbal' },
  { id: 900010, name: 'Honda e:swap', lat: 12.9934270, lng: 77.7043141, operator: 'Honda e:swap', zone_name: 'Whitefield' },
  { id: 900011, name: 'Honda e:swap', lat: 12.9861844, lng: 77.6156891, operator: 'Honda e:swap', zone_name: 'MG Road' },
  { id: 900012, name: 'Honda e:swap', lat: 13.0235213, lng: 77.5497316, operator: 'Honda e:swap', zone_name: 'Hebbal' },
  { id: 900013, name: 'Honda e:swap', lat: 13.0235317, lng: 77.5497115, operator: 'Honda e:swap', zone_name: 'Hebbal' },
  { id: 900014, name: 'inGO', lat: 12.9712776, lng: 77.6078832, operator: 'inGO', zone_name: 'MG Road' },
  { id: 900015, name: 'Jio BP', lat: 13.0878799, lng: 77.6601841, operator: 'Jio BP', zone_name: 'Yelahanka' },
  { id: 900016, name: 'Magenta ChargeGrid Charging Station', lat: 12.9154635, lng: 77.6158909, operator: 'Magenta', zone_name: 'Koramangala' },
  { id: 900017, name: 'Ola Hyper Charger', lat: 12.9337755, lng: 77.6236693, operator: 'Ola Electric', zone_name: 'Koramangala' },
  { id: 900018, name: 'Ola Hypercharger', lat: 12.9322172, lng: 77.6142725, operator: 'Ola Electric', zone_name: 'Koramangala' },
  { id: 900019, name: 'Pulse', lat: 12.9805484, lng: 77.5978893, operator: 'Pulse', zone_name: 'MG Road' },
  { id: 900020, name: 'BluSmart Charging Station', lat: 13.1776646, lng: 77.6630831, operator: 'BluSmart', zone_name: 'Airport Corridor' },
  { id: 900021, name: 'BluSmart Charging Station', lat: 13.1821565, lng: 77.6710546, operator: 'BluSmart', zone_name: 'Airport Corridor' },
  { id: 900022, name: 'GLIDA Charging Station', lat: 13.1831411, lng: 77.6760596, operator: 'GLIDA', zone_name: 'Airport Corridor' },
  { id: 900023, name: 'Ola Hypercharger Richmond Road', lat: 12.9654060, lng: 77.6002473, operator: 'Ola Electric', zone_name: 'MG Road' },
];

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function stationMetrics(station, idx, userLat = 12.9716, userLng = 77.5946) {
  const distance = haversine(userLat, userLng, station.lat, station.lng);
  const capacity = station.zone_name === 'Airport Corridor' ? 220 : station.zone_name === 'Koramangala' ? 200 : 160;
  const load = Math.min(capacity - 4, 68 + (idx % 7) * 14 + (station.zone_name === 'Koramangala' ? 28 : 0) + (station.zone_name === 'Airport Corridor' ? 12 : 0));
  const utilization = load / capacity;
  const status = utilization > 0.86 ? 'RED' : utilization > 0.62 ? 'YELLOW' : 'GREEN';
  const wait = status === 'RED' ? 14 + (idx % 4) * 3 : status === 'YELLOW' ? 5 + (idx % 3) * 2 : 0;
  return {
    ...station,
    load,
    current_load: load,
    capacity,
    status,
    distance: Number(distance.toFixed(1)),
    distance_km: Number(distance.toFixed(1)),
    wait_time: wait,
    queue_time: wait,
    utilization_percent: Number((utilization * 100).toFixed(1)),
    connector_types: capacity >= 200 ? ['CCS2', 'Type 2'] : ['Type 2', 'AC001'],
    charging_speed: capacity >= 200 ? 'rapid' : capacity >= 160 ? 'fast' : 'slow',
    source: 'vercel-api',
  };
}

function stationList(userLat = 12.9716, userLng = 77.5946) {
  return baseStations
    .map((station, idx) => stationMetrics(station, idx, userLat, userLng))
    .sort((a, b) => a.distance - b.distance);
}

function getSessionKey(req) {
  return req.headers?.authorization || req.headers?.Authorization || 'anonymous';
}

function ensureUserWorkspace(key) {
  if (!userWorkspaceStore.has(key)) {
    userWorkspaceStore.set(key, {
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
    });
  }
  return userWorkspaceStore.get(key);
}

function ensureWorkflowState(key) {
  if (!operatorWorkflowStore.has(key)) {
    operatorWorkflowStore.set(key, {
      statuses: {},
      active_actions: [],
      recent_events: [],
    });
  }
  return operatorWorkflowStore.get(key);
}

function buildActionQueue(key) {
  const workflow = ensureWorkflowState(key);
  return DEFAULT_ACTION_TEMPLATES.map((item, index) => {
    const saved = workflow.statuses[item.title] || {};
    return {
      ...item,
      status: saved.status || 'pending',
      workflow_status: saved.workflow_status || 'pending',
      workflow_id: saved.workflow_id || `wf-${index + 1}`,
      acknowledged_by: saved.acknowledged_by || null,
      acknowledged_at: saved.acknowledged_at || null,
    };
  });
}

function syncWorkflowActions(key) {
  const workflow = ensureWorkflowState(key);
  const actions = buildActionQueue(key).map((item) => ({
    id: item.workflow_id,
    title: item.title,
    status: item.workflow_status || 'pending',
    priority: item.priority,
    acknowledged_by: item.acknowledged_by || undefined,
    acknowledged_at: item.acknowledged_at || undefined,
    created_at: item.acknowledged_at || now(),
    updated_at: now(),
    history: workflow.recent_events.filter((event) => event.action_title === item.title),
  }));
  workflow.active_actions = actions;
  return workflow;
}

function pushHistory(workspace, entry) {
  workspace.history.unshift({ id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, created_at: now(), ...entry });
  workspace.history = workspace.history.slice(0, 20);
}

function parseMaybeBoolean(value) {
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return undefined;
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string' && req.body.trim()) {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return {};
}

function state() {
  const stations = stationList();
  return {
    zones,
    stations,
    total_demand: zones.reduce((sum, zone) => sum + zone.current_demand, 0),
    peak_load: Math.max(...zones.map((zone) => zone.current_demand)),
    optimized_peak: 4410,
    reduction_percent: 21.7,
    alerts: [
      {
        zone_id: 3,
        alert_type: 'Overload Warning',
        severity: 'High',
        message: 'Whitefield feeder is approaching overload. Shift flexible charging to 11 PM - 5 AM.',
        timestamp: now(),
      },
    ],
    timestamp: now(),
    current_hour: new Date().getHours(),
    scenario: 'competition-demo',
    data_source: 'real',
  };
}

function forecast(zoneId, hours = 24) {
  return {
    zone_id: zoneId,
    forecasts: Array.from({ length: hours }, (_, hour) => {
      const eveningPeak = hour >= 17 && hour <= 21 ? 1.35 : 1;
      const morningPeak = hour >= 7 && hour <= 9 ? 1.15 : 1;
      const base = 260 + Math.sin((hour / 24) * Math.PI) * 280;
      const predicted = Math.round(base * eveningPeak * morningPeak);
      return {
        hour,
        predicted_demand: predicted,
        confidence_lower: Math.round(predicted * 0.88),
        confidence_upper: Math.round(predicted * 1.12),
        error_range: [Math.round(predicted * 0.88), Math.round(predicted * 1.12)],
        confidence_tier: hour < 12 ? 'High' : 'Medium',
        baseline_demand: Math.round(base),
      };
    }),
    model_accuracy: 0.92,
    baseline_comparison: 'AI optimized plan lowers the evening feeder peak by 18-24% versus unmanaged charging.',
  };
}

function optimization(zoneId) {
  return {
    recommended_windows: [
      { station_id: 900001, windows: [{ hour: 23, power: 46, percentage: 92 }, { hour: 0, power: 50, percentage: 100 }] },
      { station_id: 900004, windows: [{ hour: 1, power: 42, percentage: 84 }, { hour: 2, power: 36, percentage: 72 }] },
    ],
    reason: `Zone ${zoneId}: shift flexible sessions away from 6-10 PM into low-load night windows while keeping driver preference constraints.`,
    confidence: 0.9,
  };
}

function buildUserPortal(query, key) {
  const lat = Number(query.lat || 12.9716);
  const lng = Number(query.lng || 77.5946);
  const stations = stationList(lat, lng);
  const nearest = stations[0] || null;
  const selected = nearest;
  const topAlternatives = stations.slice(0, 8).map((station, idx) => ({
    id: station.id,
    name: station.name,
    operator: station.operator,
    status: station.status,
    distance_km: station.distance_km,
    wait_time_minutes: station.wait_time,
    estimated_total_minutes: 24 + station.wait_time + Math.round(station.distance_km * 4),
    score: Number((100 - station.utilization_percent - station.distance_km * 4).toFixed(1)),
    reason: station.status === 'GREEN' ? 'Low queue and healthy grid headroom.' : station.status === 'YELLOW' ? 'Usable with moderate queue pressure.' : 'High queue pressure right now.',
    is_best: idx === 0,
  }));

  return {
    role: 'user',
    zone: { id: 6, name: 'MG Road', lat: 12.9752, lng: 77.6060, capacity: 900, zone_type: 'commercial' },
    effective_location: { lat, lng },
    profile_context: { vehicle_model: 'EV User', battery_capacity_kwh: 45, home_charging_access: false, typical_charging_time: 'flexible' },
    service_area_notice: null,
    nearest_station: nearest,
    selected_station: selected,
    route: null,
    station_options: stations,
    alternatives: topAlternatives,
    decision_support: {
      target_energy_kwh: 22,
      estimated_session_minutes: nearest ? 28 + nearest.wait_time : 40,
      public_cost_inr: 285,
      home_cost_inr: null,
      savings_vs_home_inr: null,
      queue_time_savings_minutes: nearest ? Math.max(0, 18 - nearest.wait_time) : 0,
      route_provider: 'haversine',
      home_charge_recommended: false,
      congestion_reduction_percent: nearest ? Math.max(0, 100 - nearest.utilization_percent) : 0,
      best_time_benefit: 'More than 20 nearby stations are available in this live Bengaluru set.',
      recommended_action: {
        type: 'station',
        headline: nearest ? `Charge at ${nearest.name}` : 'Charge at the nearest available station',
        why: 'Lowest travel time with live queue context.',
        benefits: ['Live wait estimates', 'Real Bengaluru coordinates', 'Queue-aware ranking'],
        confidence: 'HIGH',
      },
      charge_now: {
        best_station_right_now: nearest ? {
          station_id: nearest.id,
          station_name: nearest.name,
          station_lat: nearest.lat,
          station_lng: nearest.lng,
          distance_km: nearest.distance_km,
          wait_time_minutes: nearest.wait_time,
          utilization_percent: nearest.utilization_percent,
          estimated_total_minutes: 24 + nearest.wait_time,
          headline: 'Closest low-friction option',
          why: 'Best balance of distance and queue.',
          confidence: 'HIGH',
        } : null,
        wait_time_saved: { minutes: nearest ? Math.max(0, 12 - nearest.wait_time) : 0, why: 'Compared with the average nearby station queue.' },
        cheapest_option: nearest ? {
          type: 'station',
          station_id: nearest.id,
          station_name: nearest.name,
          station_lat: nearest.lat,
          station_lng: nearest.lng,
          estimated_cost_inr: 240,
          why: 'Closest low-queue station minimizes total stop cost.',
          confidence: 'HIGH',
        } : null,
        fastest_option: nearest ? {
          station_id: nearest.id,
          station_name: nearest.name,
          station_lat: nearest.lat,
          station_lng: nearest.lng,
          distance_km: nearest.distance_km,
          wait_time_minutes: nearest.wait_time,
          utilization_percent: nearest.utilization_percent,
          estimated_total_minutes: 24 + nearest.wait_time,
          headline: 'Fastest current option',
          why: 'Shortest combined drive plus queue time.',
          confidence: 'HIGH',
        } : null,
        lowest_congestion_option: stations[0] ? {
          station_id: stations[0].id,
          station_name: stations[0].name,
          station_lat: stations[0].lat,
          station_lng: stations[0].lng,
          distance_km: stations[0].distance_km,
          wait_time_minutes: stations[0].wait_time,
          utilization_percent: stations[0].utilization_percent,
          estimated_total_minutes: 24 + stations[0].wait_time,
          headline: 'Lowest congestion nearby',
          why: 'Lowest utilization in the nearby live set.',
          confidence: 'HIGH',
        } : null,
      },
    },
    charging_recommendation: {
      time_label: '23:00',
      predicted_demand: 380,
      headline: 'Best charging window: 11 PM – 1 AM',
      reason: 'Demand drops after 22:00 as commercial load clears.',
      impact: 'Lower queues and smoother feeder utilization.',
      confidence: 'HIGH',
    },
    load_context: {
      prediction: 600,
      confidence_lower: 550,
      confidence_upper: 650,
      status: 'STABLE',
      explanation: { reason: 'Demand within normal range.', impact: 'No grid constraints on charging.', confidence: 'HIGH' },
    },
    route_planner: {
      destination: query.destination || 'Flexible charging stop',
      battery_percent: Number(query.battery_percent || 38),
      current_route: null,
      selected_station_name: nearest ? nearest.name : null,
      route_options: topAlternatives.slice(0, 5).map((option) => ({
        station_id: option.id,
        station_name: option.name,
        eta_minutes: Math.round(option.distance_km * 4),
        queue_at_arrival_minutes: option.wait_time_minutes,
        total_stop_minutes: option.estimated_total_minutes,
        headline: option.is_best ? 'Best current route' : 'Alternate route',
        why: option.reason,
      })),
    },
    workspace_state: ensureUserWorkspace(key),
  };
}

function buildOperatorPortal(query, key) {
  const requestedZone = query.zone || 'Whitefield';
  const stations = stationList();
  const selectedZoneStations = stations.filter((station) => station.zone_name === requestedZone);
  const visibleStations = (selectedZoneStations.length ? selectedZoneStations : stations).slice(0, 23).map((station) => ({
    ...station,
    queue_trend: station.wait_time >= 10 ? 'rising' : station.wait_time >= 4 ? 'stable' : 'clearing',
    predicted_wait_growth: Math.max(0, Math.round(station.wait_time * 0.4)),
    health_score: Math.max(45, Math.round(100 - station.utilization_percent * 0.55)),
    connector_availability: Math.max(1, Math.round((station.capacity - station.load) / 25)),
    active_sessions: Math.max(1, Math.round(station.load / 22)),
    load_capacity_ratio: Number((station.load / station.capacity).toFixed(3)),
    downtime_probability: Number(Math.min(0.42, Math.max(0.04, station.utilization_percent / 180)).toFixed(3)),
  }));

  const workflow = syncWorkflowActions(key);
  return {
    role: 'operator',
    scenario: query.scenario || 'normal',
    scenario_options: [
      { id: 'normal', label: 'Normal Operations', active: !query.scenario || query.scenario === 'normal' },
      { id: 'evening_peak', label: 'Evening Peak', active: query.scenario === 'evening_peak' },
      { id: 'high_growth', label: 'High Growth', active: query.scenario === 'high_growth' },
    ],
    zone: zones.find((zone) => zone.name === requestedZone) || zones[2],
    grid_stress: {
      status: 'CONSTRAINED',
      predicted_load: 680,
      capacity: 1000,
      delta_kw: -320,
      overload_percent: 68,
      explanation: { reason: 'Evening peak pressure is concentrated in commercial corridors.', impact: 'Monitor queue spillover.', confidence: 'HIGH' },
    },
    risk_engine: { zone: requestedZone, overload_probability: 0.24, risk_score: 68, risk_band: 'MEDIUM', projected_peak_timing: '19:00', confidence_level: 'HIGH' },
    ops_summary: {
      urgency: 'MEDIUM',
      briefing: 'Live production demo is serving the expanded Bengaluru station set.',
      signals: { scenario: query.scenario || 'normal', scenario_delta_kw: 0, peak_time: '19:00', predicted_peak_kw: 680, capacity_kw: 1000, suggested_relief_zone: 'Electronic City' },
    },
    event_ticker: [],
    top_risk_zones: [],
    forecast_center: {
      zone_id: 3,
      zone_name: requestedZone,
      scenario: query.scenario || 'normal',
      horizons: { h6: { hours: 6, curve: [], peak: { hour: 19, label: '19:00', predicted_demand: 680, confidence_lower: 620, confidence_upper: 730, confidence_tier: 'High', baseline_demand: 590, status: 'CONSTRAINED', timestamp: now(), explanation: { reason: 'Evening peak.', impact: 'Monitor queue spillover.', confidence: 'HIGH' } } }, h24: { hours: 24, curve: [], peak: { hour: 19, label: '19:00', predicted_demand: 680, confidence_lower: 620, confidence_upper: 730, confidence_tier: 'High', baseline_demand: 590, status: 'CONSTRAINED', timestamp: now(), explanation: { reason: 'Evening peak.', impact: 'Monitor queue spillover.', confidence: 'HIGH' } } }, h72: { hours: 72, curve: [], peak: { hour: 19, label: '19:00', predicted_demand: 700, confidence_lower: 630, confidence_upper: 760, confidence_tier: 'Medium', baseline_demand: 600, status: 'CONSTRAINED', timestamp: now(), explanation: { reason: 'Weekend pressure.', impact: 'Keep an eye on airport corridor.', confidence: 'MEDIUM' } } } },
      baseline_comparison: { unmanaged: { label: 'Unmanaged', peak_kw: 760 }, optimized: { label: 'Optimized', peak_kw: 630 }, current: { label: 'Current', peak_kw: 680 }, delta_vs_unmanaged_kw: -80, reduction_vs_unmanaged_percent: -10.5, curves: { unmanaged_24h: [], optimized_24h: [], current_24h: [] } },
      drift: { observed_kw: 612, drift_percent: 2, anomaly: false, reliability_score: 92 },
      generated_at: now(),
    },
    forecast: { zone_id: 3, zone_name: requestedZone, curve: [], peak: { label: '19:00', predicted_demand: 680, confidence_upper: 730 }, model: 'XGBoost' },
    network_summary: { total_zones: zones.length, zones_at_risk: 2, constrained_zones: 3, peak_window: '18:00–20:00', highest_headroom_zone: 'Electronic City', scenario_delta_kw: 0 },
    action_queue: buildActionQueue(key),
    zone_rankings: zones.map((zone) => ({ ...zone, predicted_load: zone.current_demand, headroom_kw: zone.capacity - zone.current_demand, utilization_percent: Math.round((zone.current_demand / zone.capacity) * 100), status: zone.current_demand > 650 ? 'OVERLOAD RISK' : zone.current_demand > 500 ? 'CONSTRAINED' : 'STABLE', active: zone.name === requestedZone })),
    planning_insights: [
      { headline: `Track expansion around ${requestedZone}`, reason: 'High station density is now exposed in production.', impact: 'Better map coverage and queue visibility.', confidence: 'HIGH' },
    ],
    all_zones: zones.map((zone) => ({ ...zone, active: zone.name === requestedZone })),
    spatial: { heatmap_points: [], overload_zones: [], congestion_corridors: [] },
    workflow: { active_actions: workflow.active_actions, recent_events: workflow.recent_events },
    incidents: [],
    stations: visibleStations,
    system_health: { backend_latency_ms: 120, api_health: 'healthy', polling_health: 'healthy', forecast_engine_status: 'active', db_connectivity: 'connected', model_drift_percent: 2, memory_usage_mb: 184, uptime_hours: 24, cache_health: 'warm', transport_status: 'polling', heartbeat_at: now(), selected_zone_observed_kw: 612, scenario: query.scenario || 'normal' },
  };
}

function parseQuery(url) {
  const parsed = new URL(url, 'https://example.com');
  return Object.fromEntries(parsed.searchParams.entries());
}

function send(res, data, status = 200) {
  res.status(status).json({
    success: status < 400,
    timestamp: Date.now(),
    data,
    explanation: ['Vercel API is serving the expanded Bengaluru station set.'],
  });
}

export default async function handler(req, res) {
  const path = req.url.split('?')[0].replace(/^\/api/, '') || '/';
  const query = parseQuery(req.url);
  const body = await readBody(req);
  const sessionKey = getSessionKey(req);
  const zoneMatch = path.match(/\/(?:demand|forecast|optimize|impact)\/(\d+)/);
  const zoneId = zoneMatch ? Number(zoneMatch[1]) : 1;
  const lat = Number(query.lat || 12.9716);
  const lng = Number(query.lng || 77.5946);
  const stations = stationList(lat, lng);

  if (path === '/' || path === '/health') return send(res, { message: 'GridSense demo API online' });
  if (path === '/ev/state') return send(res, state());
  if (path === '/ev/stations' || path === '/stations/nearby') return send(res, stations);
  if (path === '/portal/user') return send(res, buildUserPortal(query, sessionKey));
  if (path === '/portal/operator') return send(res, buildOperatorPortal(query, sessionKey));
  if (path === '/portal/workflow/acknowledge' && req.method === 'POST') {
    const workflow = ensureWorkflowState(sessionKey);
    const title = body.action_title;
    const event = {
      id: `wf-event-${Date.now()}`,
      action_title: title,
      event_type: 'acknowledged',
      operator: 'Operator',
      timestamp: now(),
      details: `${title} acknowledged.`,
      new_status: 'acknowledged',
    };
    workflow.statuses[title] = {
      ...(workflow.statuses[title] || {}),
      workflow_status: 'acknowledged',
      status: 'acknowledged',
      workflow_id: workflow.statuses[title]?.workflow_id || `wf-${Object.keys(workflow.statuses).length + 1}`,
      acknowledged_by: 'Operator',
      acknowledged_at: event.timestamp,
    };
    workflow.recent_events.unshift(event);
    workflow.recent_events = workflow.recent_events.slice(0, 20);
    syncWorkflowActions(sessionKey);
    return send(res, workflow.active_actions.find((item) => item.title === title) || {});
  }
  if (path === '/portal/workflow/update-status' && req.method === 'POST') {
    const workflow = ensureWorkflowState(sessionKey);
    const title = body.action_title;
    const newStatus = body.new_status;
    const event = {
      id: `wf-event-${Date.now()}`,
      action_title: title,
      event_type: newStatus,
      operator: 'Operator',
      timestamp: now(),
      details: body.notes ? `${title} marked ${newStatus}. ${body.notes}` : `${title} marked ${newStatus}.`,
      new_status: newStatus,
    };
    workflow.statuses[title] = {
      ...(workflow.statuses[title] || {}),
      workflow_status: newStatus,
      status: newStatus,
      workflow_id: workflow.statuses[title]?.workflow_id || `wf-${Object.keys(workflow.statuses).length + 1}`,
      acknowledged_by: workflow.statuses[title]?.acknowledged_by || 'Operator',
      acknowledged_at: workflow.statuses[title]?.acknowledged_at || event.timestamp,
    };
    workflow.recent_events.unshift(event);
    workflow.recent_events = workflow.recent_events.slice(0, 20);
    syncWorkflowActions(sessionKey);
    return send(res, workflow.active_actions.find((item) => item.title === title) || {});
  }
  if (path === '/portal/workflow/timeline') {
    const workflow = syncWorkflowActions(sessionKey);
    return send(res, { events: workflow.recent_events });
  }
  if (path === '/portal/user/save-station' && req.method === 'POST') {
    const workspace = ensureUserWorkspace(sessionKey);
    const station = stations.find((item) => item.id === body.station_id);
    if (station) {
      workspace.saved.stations = [station, ...workspace.saved.stations.filter((item) => item.id !== station.id)].slice(0, 24);
      pushHistory(workspace, { type: 'station_saved', station_name: station.name, station_id: station.id });
    }
    return send(res, workspace);
  }
  if (path === '/portal/user/unsave-station' && req.method === 'POST') {
    const workspace = ensureUserWorkspace(sessionKey);
    workspace.saved.stations = workspace.saved.stations.filter((item) => item.id !== body.station_id);
    pushHistory(workspace, { type: 'station_removed', station_id: body.station_id });
    return send(res, workspace);
  }
  if (path === '/portal/user/save-route' && req.method === 'POST') {
    const workspace = ensureUserWorkspace(sessionKey);
    workspace.saved.routes = [{ id: `route-${Date.now()}`, created_at: now(), ...body }, ...workspace.saved.routes].slice(0, 24);
    pushHistory(workspace, { type: 'route_saved', station_name: body.station_name, distance_km: body.distance_km });
    return send(res, workspace);
  }
  if (path === '/portal/user/save-window' && req.method === 'POST') {
    const workspace = ensureUserWorkspace(sessionKey);
    workspace.saved.windows = [{ id: `window-${Date.now()}`, created_at: now(), ...body }, ...workspace.saved.windows.filter((item) => item.time_label !== body.time_label)].slice(0, 24);
    pushHistory(workspace, { type: 'window_saved', time_label: body.time_label, predicted_demand: body.predicted_demand });
    return send(res, workspace);
  }
  if (path === '/portal/user/remove-window' && req.method === 'POST') {
    const workspace = ensureUserWorkspace(sessionKey);
    workspace.saved.windows = workspace.saved.windows.filter((item) => item.time_label !== body.time_label);
    pushHistory(workspace, { type: 'window_removed', time_label: body.time_label });
    return send(res, workspace);
  }
  if (path === '/portal/user/schedule' && req.method === 'POST') {
    const workspace = ensureUserWorkspace(sessionKey);
    pushHistory(workspace, { type: 'schedule_created', station_name: body.station_name, time_label: body.time_label });
    workspace.alerts.unshift({
      id: `alert-${Date.now()}`,
      title: 'Charging schedule saved',
      message: `${body.station_name} scheduled for ${body.time_label}.`,
      severity: 'info',
      read: false,
      dismissed: false,
      created_at: now(),
    });
    workspace.alerts = workspace.alerts.slice(0, 20);
    return send(res, workspace);
  }
  if (path === '/portal/user/record-navigation' && req.method === 'POST') {
    const workspace = ensureUserWorkspace(sessionKey);
    pushHistory(workspace, { type: 'navigation_started', station_name: body.station_name, distance_km: body.distance_km });
    return send(res, workspace);
  }
  if (path === '/portal/user/alert' && req.method === 'POST') {
    const workspace = ensureUserWorkspace(sessionKey);
    workspace.alerts = workspace.alerts.map((alert) => alert.id === body.alert_id ? { ...alert, ...(body.read !== undefined ? { read: body.read } : {}), ...(body.dismissed !== undefined ? { dismissed: body.dismissed } : {}) } : alert);
    return send(res, workspace);
  }
  if (path === '/portal/user/wallet/recharge' && req.method === 'POST') {
    const workspace = ensureUserWorkspace(sessionKey);
    const amount = Number(body.amount_inr || 0);
    workspace.wallet.balance_inr += amount;
    workspace.wallet.transactions.unshift({ id: `txn-${Date.now()}`, type: 'Recharge', amount_inr: amount, created_at: now() });
    workspace.wallet.transactions = workspace.wallet.transactions.slice(0, 20);
    return send(res, workspace);
  }
  if (path === '/portal/user/settings' && req.method === 'POST') {
    const workspace = ensureUserWorkspace(sessionKey);
    workspace.settings = {
      ...workspace.settings,
      ...Object.fromEntries(Object.entries(body).map(([k, v]) => [k, typeof v === 'string' && (v === 'true' || v === 'false') ? parseMaybeBoolean(v) : v])),
    };
    return send(res, workspace);
  }
  if (path === '/dashboard/summary') return send(res, state());
  if (path === '/alerts' || path === '/alerts/') return send(res, state().alerts);
  if (path === '/realtime/demand') {
    return send(res, zones.map((zone) => ({ zone_id: zone.id, current_demand: zone.current_demand, trend: zone.status === 'RED' ? 'increasing' : 'stable', timestamp: now() })));
  }
  if (path.startsWith('/demand/')) return send(res, { demand: zones[zoneId - 1]?.current_demand ?? 420, confidence: 0.91, factors: ['Evening commute', 'Mall traffic', 'Transformer headroom'] });
  if (path.startsWith('/forecast/')) return send(res, forecast(zoneId));
  if (path.startsWith('/optimize/')) return send(res, optimization(zoneId));
  if (path.startsWith('/impact/')) return send(res, { before_peak: 890, after_peak: 680, reduction_percent: 23.6, zone_id: zoneId });
  if (path === '/locations/recommend') {
    return send(res, stations.map((station, idx) => ({
      station_id: station.id,
      zone_id: (idx % zones.length) + 1,
      zone_name: station.zone_name,
      name: station.name,
      lat: station.lat,
      lng: station.lng,
      score: Number((220 - station.distance_km * 4 - station.wait_time).toFixed(2)),
      grid_stress_score: Number((220 - station.distance_km * 4 - station.wait_time).toFixed(2)),
      predicted_demand: station.load,
      wait_time: station.wait_time,
      capacity: station.capacity,
      status: station.status,
      operator: station.operator,
      justification: 'Real Bengaluru coordinate with queue-aware stress scoring.',
    })));
  }
  if (path === '/locations/roi' || path === '/locations/roi/') return send(res, zones.slice(0, 3).map((zone) => ({ zone_id: zone.id, zone_name: zone.name, expected_utilization: 80 + zone.id, estimated_roi: 18 + zone.id * 2, payback_period_months: 16 + zone.id, justification: 'Strong utilization and avoided peak upgrade cost.' })));
  if (path === '/simulate/run') return send(res, { time_series: forecast(1).forecasts.map((point) => ({ hour: point.hour, demand: point.predicted_demand, active_sessions: Math.round(point.predicted_demand / 18) })), total_sessions: 1250, peak_demand: 890 });
  if (path === '/advanced/data/status') return send(res, { is_real_data: true });
  if (path === '/advanced/baselines/compare') return send(res, { no_optimization: { peak_load: 890, utilization: '96%', cost_efficiency: 'Low' }, ai_optimized: { peak_load: 680, utilization: '73%', cost_efficiency: 'High', improvement: '23.6% lower peak' } });
  if (path === '/advanced/model/metrics') return send(res, { mae: 42.3, rmse: 58.7, mape: 8.9, data_points: 17520, validation_note: 'Synthetic Bengaluru validation set.' });

  return send(res, { message: `No dummy route configured for ${path}` }, 404);
}
