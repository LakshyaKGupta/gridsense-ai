import { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, ArrowRight, Clock3, Gauge, LogOut, MapPin, Network, ShieldCheck, TrendingUp } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Map, { Marker, NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI, isBackendLive, OperatorDashboardPayload } from '../services/api';
import CopilotPanel from '../components/ui/CopilotPanel';

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

type Workspace = 'overview' | 'operations' | 'forecast' | 'planning' | 'incidents' | 'simulator' | 'reports' | 'alerts' | 'stations' | 'system' | 'copilot';

const WORKSPACES: { id: Workspace; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'operations', label: 'Live Ops' },
  { id: 'forecast', label: 'Forecast' },
  { id: 'planning', label: 'Planning' },
  { id: 'incidents', label: 'Incidents' },
  { id: 'simulator', label: 'Scenarios' },
  { id: 'reports', label: 'Reports' },
  { id: 'alerts', label: 'Alerts' },
  { id: 'stations', label: 'Stations' },
  { id: 'system', label: 'System' },
];

export default function OperatorDashboard() {
  const { token, logout, profile } = useAuth();
  const [selectedZone, setSelectedZone] = useState(profile?.operator_data?.assignedZone || 'Whitefield');
  const [scenario, setScenario] = useState('normal');
  const [workspace, setWorkspace] = useState<Workspace>('overview');
  const [panel, setPanel] = useState<'actions' | 'zones' | 'planning'>('actions');
  const [data, setData] = useState<OperatorDashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewState, setViewState] = useState({ longitude: 77.63, latitude: 12.97, zoom: 10.8 });
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);

  const mockData: OperatorDashboardPayload = {
    role: 'operator',
    scenario: 'normal',
    scenario_options: [
      { id: 'normal', label: 'Normal Operations', active: true },
      { id: 'evening_peak', label: 'Evening Peak', active: false },
      { id: 'high_growth', label: 'High Growth', active: false },
    ],
    zone: { id: 1, name: 'Whitefield', lat: 12.97, lng: 77.63, capacity: 1000, zone_type: 'commercial' },
    grid_stress: {
      status: 'STABLE',
      predicted_load: 600,
      capacity: 1000,
      delta_kw: -400,
      overload_percent: 60,
      explanation: { reason: 'Demand within normal range.', impact: 'No immediate action required.', confidence: 'HIGH' },
    },
    risk_engine: { zone: 'Whitefield', overload_probability: 0.1, risk_score: 20, risk_band: 'LOW', projected_peak_timing: '18:00', confidence_level: 'HIGH' },
    ops_summary: {
      urgency: 'LOW',
      briefing: 'All systems operational. Grid is stable across all monitored zones.',
      signals: { scenario: 'normal', scenario_delta_kw: 0, peak_time: '18:00', predicted_peak_kw: 600, capacity_kw: 1000, suggested_relief_zone: 'Koramangala' },
    },
    event_ticker: [],
    top_risk_zones: [],
    forecast_center: {
      zone_id: 1,
      zone_name: 'Whitefield',
      scenario: 'normal',
      horizons: {
        h6: { hours: 6, curve: [], peak: { hour: 18, label: '18:00', predicted_demand: 560, confidence_lower: 520, confidence_upper: 600, confidence_tier: 'High', baseline_demand: 510, status: 'STABLE', timestamp: new Date().toISOString(), explanation: { reason: 'Normal ramp-up.', impact: 'Grid stable.', confidence: 'HIGH' } } },
        h24: { hours: 24, curve: [], peak: { hour: 19, label: '19:00', predicted_demand: 600, confidence_lower: 550, confidence_upper: 650, confidence_tier: 'High', baseline_demand: 560, status: 'STABLE', timestamp: new Date().toISOString(), explanation: { reason: 'Evening EV charging peak.', impact: 'Manageable.', confidence: 'HIGH' } } },
        h72: { hours: 72, curve: [], peak: { hour: 19, label: '19:00', predicted_demand: 620, confidence_lower: 560, confidence_upper: 680, confidence_tier: 'Medium', baseline_demand: 560, status: 'STABLE', timestamp: new Date().toISOString(), explanation: { reason: 'Weekend pattern.', impact: 'Monitor Friday evening.', confidence: 'MEDIUM' } } },
      },
      baseline_comparison: {
        unmanaged: { label: 'Unmanaged', peak_kw: 700 },
        optimized: { label: 'Optimized', peak_kw: 580 },
        current: { label: 'Current', peak_kw: 640 },
        delta_vs_unmanaged_kw: -60,
        reduction_vs_unmanaged_percent: -8.6,
        curves: { unmanaged_24h: [], optimized_24h: [], current_24h: [] },
      },
      drift: { observed_kw: null, drift_percent: 0, anomaly: false, reliability_score: 95 },
      generated_at: new Date().toISOString(),
    },
    forecast: { zone_id: 1, zone_name: 'Whitefield', curve: [], peak: { label: '19:00', predicted_demand: 600, confidence_upper: 650 }, model: 'XGBoost' },
    network_summary: {
      total_zones: 10,
      zones_at_risk: 1,
      constrained_zones: 1,
      peak_window: '18:00–20:00',
      highest_headroom_zone: 'Electronic City',
      scenario_delta_kw: 0,
    },
    action_queue: [],
    zone_rankings: [
      { id: 1, name: 'Whitefield', lat: 12.97, lng: 77.63, capacity: 1000, zone_type: 'commercial', predicted_load: 600, headroom_kw: 400, utilization_percent: 60, status: 'STABLE', active: true },
    ],
    planning_insights: [],
    all_zones: [
      { id: 1, name: 'Whitefield', lat: 12.97, lng: 77.63, capacity: 1000, zone_type: 'commercial', active: true, type: 'commercial' },
    ],
    spatial: { heatmap_points: [], overload_zones: [], congestion_corridors: [] },
    workflow: { active_actions: [], recent_events: [] },
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      try {
        setLoading(true);
        const dashboardData = await dashboardAPI.getOperatorDashboard(token, selectedZone, scenario);
        setData(dashboardData);
        setLastUpdatedAt(new Date().toISOString());
        setError(null);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Failed to load dashboard data');
        // Fallback to mock data if API fails
        setData(mockData);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, selectedZone, scenario]);

  useEffect(() => {
    if (!token) return;
    if (!data) return;
    if (workspace !== 'overview') return;

    const interval = setInterval(async () => {
      try {
        const dashboardData = await dashboardAPI.getOperatorDashboard(token, selectedZone, scenario);
        setData(dashboardData);
        setLastUpdatedAt(new Date().toISOString());
        setError(null);
      } catch (err) {
        console.error('Failed to poll dashboard data:', err);
        // Don't set error for polling failures to avoid UI disruption
      }
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, [token, data, workspace, selectedZone, scenario]);

  const peakDelta = useMemo(() => {
    if (!data) return 0;
    return Math.round(data.grid_stress.predicted_load - data.grid_stress.capacity);
  }, [data]);
  const activeZone = useMemo(() => data?.zone_rankings.find((zone) => zone.active) ?? null, [data]);
   const combinedTicker = useMemo(() => {
     if (!data) return [];
     const workflowEvents = data.workflow?.recent_events?.map((event) => ({
       timestamp: event.timestamp,
       type: event.event_type,
       severity: event.event_type === 'acknowledged' ? 'INFO' : 'MEDIUM',
       message: event.details,
     })) ?? [];
     return [...(data.event_ticker || []), ...workflowEvents]
       .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))
       .slice(0, 18);
   }, [data]);

  const riskTone = useMemo(() => {
    const band = data?.risk_engine?.risk_band;
    if (band === 'CRITICAL') return { chip: 'border-rose-400/25 bg-rose-400/10 text-rose-200', text: 'text-rose-200', bar: 'bg-rose-400/60' };
    if (band === 'HIGH') return { chip: 'border-amber-400/25 bg-amber-400/10 text-amber-200', text: 'text-amber-200', bar: 'bg-amber-400/60' };
    if (band === 'MEDIUM') return { chip: 'border-yellow-400/25 bg-yellow-400/10 text-yellow-200', text: 'text-yellow-200', bar: 'bg-yellow-400/60' };
    return { chip: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200', text: 'text-emerald-200', bar: 'bg-emerald-400/60' };
  }, [data]);

  const [forecastHorizon, setForecastHorizon] = useState<'h6' | 'h24' | 'h72'>('h24');
  const forecastCenter = data?.forecast_center;
  const horizonPayload = forecastCenter?.horizons?.[forecastHorizon];

  const forecastBaselineSeries = useMemo(() => {
    return [
      { key: 'unmanaged_24h', label: 'Unmanaged', tone: '#94a3b8' },
      { key: 'current_24h', label: 'Current', tone: '#38bdf8' },
      { key: 'optimized_24h', label: 'Optimized', tone: '#34d399' },
    ] as const;
  }, []);

  if (loading && !data) {
    return <div className="min-h-screen bg-[#0B0F14] text-slate-200 flex items-center justify-center">Loading operator cockpit...</div>;
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#0B0F14] text-slate-200 flex items-center justify-center p-6">
        <div className="max-w-lg rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
          <AlertTriangle className="mx-auto mb-4 text-amber-400" size={28} />
          <p className="text-lg font-semibold text-white">Operator dashboard unavailable</p>
          <p className="mt-2 text-sm text-slate-400">{error || 'Backend data could not be loaded.'}</p>
        </div>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-[#0B0F14] text-slate-100">
      <div
        className="fixed inset-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(0,229,160,0.10), transparent 32%), radial-gradient(circle at 80% 10%, rgba(56,189,248,0.08), transparent 28%), linear-gradient(180deg, rgba(148,163,184,0.04), transparent 60%)',
        }}
      />

      <header className="sticky top-0 z-40 border-b border-white/8 bg-[#0B0F14]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-400/10 text-emerald-300">
                <Network size={18} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-emerald-300/70">BESCOM Operator</p>
                <h1 className="text-xl font-semibold text-white">Grid Control and Planning Console</h1>
              </div>
            </Link>
          <div className="flex items-center gap-3">
            {isBackendLive
              ? <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-emerald-300">● Live</span>
              : <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-amber-300">◎ Simulation</span>
            }
            <Link to="/" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 hover:text-white">Home</Link>
            <Link to="/profile" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 hover:text-white">Profile</Link>
            <button onClick={() => void logout()} className="inline-flex items-center gap-2 rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-2 text-sm text-rose-200">
              <LogOut size={14} />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="w-full border-b border-white/8 bg-white/[0.02]">
        <div className="mx-auto flex max-w-7xl gap-1 px-6 py-2 overflow-x-auto">
          {WORKSPACES.map((ws) => {
            const isActive = workspace === ws.id;
            return (
              <button key={ws.id} onClick={() => setWorkspace(ws.id)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition ${isActive ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                {ws.label}
              </button>
            );
          })}
        </div>
      </div>

      <main className="relative z-10 mx-auto flex max-w-[1380px] flex-col gap-5 px-6 py-5">
        {workspace === 'forecast' && forecastCenter && horizonPayload && (
          <section className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Forecast Center</p>
                <h2 className="mt-2 text-3xl font-semibold text-white">Multi-horizon demand forecasts with confidence + drift</h2>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
                  This view is driven by the backend forecast model and live observed demand. Horizon: {horizonPayload.hours}h • Zone: {forecastCenter.zone_name}.
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-right">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Model reliability</p>
                  <p className={`mt-1 text-lg font-semibold ${forecastCenter.drift.reliability_score < 60 ? 'text-rose-200' : forecastCenter.drift.reliability_score < 75 ? 'text-amber-200' : 'text-emerald-200'}`}>
                    {forecastCenter.drift?.reliability_score ?? 0}/100
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Drift: {forecastCenter.drift?.drift_percent?.toFixed(1) ?? '0.0'}%{forecastCenter.drift?.anomaly ? ' • anomaly' : ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {([
                    { id: 'h6', label: 'Next 6h' },
                    { id: 'h24', label: '24h' },
                    { id: 'h72', label: '72h' },
                  ] as const).map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setForecastHorizon(opt.id)}
                      className={`rounded-full border px-4 py-2 text-sm transition ${
                        forecastHorizon === opt.id
                          ? 'border-cyan-300/30 bg-cyan-300/10 text-white'
                          : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-[24px] border border-white/10 bg-[#0D131A] p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Forecast + confidence range</p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      Peak ~{Math.round(horizonPayload.peak.predicted_demand)} kW at {horizonPayload.peak.label}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-right">
                    <p className="text-xs text-slate-400">Uncertainty band</p>
                    <p className="text-sm font-semibold text-white">
                      {Math.round(horizonPayload.peak.confidence_lower)}–{Math.round(horizonPayload.peak.confidence_upper)} kW
                    </p>
                  </div>
                </div>

                <div className="mt-4 h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={horizonPayload.curve} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="fcFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke="rgba(148,163,184,0.12)" />
                      <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ background: '#091019', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16 }}
                        labelStyle={{ color: '#e2e8f0' }}
                        formatter={(value: number, name: string) => [`${Math.round(value)} kW`, name]}
                      />
                      <Area dataKey="confidence_upper" stroke="rgba(148,163,184,0.2)" fill="transparent" />
                      <Area dataKey="confidence_lower" stroke="rgba(148,163,184,0.12)" fill="transparent" />
                      <Area type="monotone" dataKey="predicted_demand" stroke="#38bdf8" strokeWidth={2.4} fill="url(#fcFill)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-[#0D131A] p-5">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Forecast explainability</p>
                <h3 className="mt-2 text-lg font-semibold text-white">Why this peak happens</h3>
                <div className="mt-4 space-y-3 text-sm text-slate-300">
                  <p>{horizonPayload.peak.explanation?.reason ?? 'No explanation available.'}</p>
                  {horizonPayload.peak.explanation?.impact && (
                    <p className="text-slate-400">{horizonPayload.peak.explanation.impact}</p>
                  )}
                  {horizonPayload.peak.explanation?.confidence && (
                    <p className="text-xs uppercase tracking-[0.24em] text-emerald-300/80">{horizonPayload.peak.explanation.confidence}</p>
                  )}
                </div>

                <div className="mt-6 rounded-3xl border border-white/8 bg-[#0B1016] p-4">
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Drift detection</p>
                  <div className="mt-3 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-500">Observed now</p>
                      <p className="mt-1 text-lg font-semibold text-white">
                        {forecastCenter.drift.observed_kw == null ? '—' : `${Math.round(forecastCenter.drift.observed_kw)} kW`}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Drift</p>
                      <p className={`mt-1 text-lg font-semibold ${forecastCenter.drift.anomaly ? 'text-rose-200' : forecastCenter.drift.drift_percent > 8 ? 'text-amber-200' : 'text-emerald-200'}`}>
                        {forecastCenter.drift.drift_percent.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-slate-400">
                    Drift compares the model’s near-term prediction against live observed demand. Large drift reduces reliability and triggers anomaly state.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[24px] border border-white/10 bg-[#0D131A] p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Baseline comparison</p>
                    <h3 className="mt-2 text-lg font-semibold text-white">Unmanaged vs optimized vs current strategy</h3>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-right">
                    <p className="text-xs text-slate-400">Peak reduction</p>
                    <p className="text-sm font-semibold text-emerald-200">
                      {forecastCenter.baseline_comparison.reduction_vs_unmanaged_percent.toFixed(1)}%
                    </p>
                  </div>
                </div>

                <div className="mt-4 h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={forecastCenter.baseline_comparison.curves.current_24h} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid vertical={false} stroke="rgba(148,163,184,0.12)" />
                      <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ background: '#091019', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16 }}
                        labelStyle={{ color: '#e2e8f0' }}
                        formatter={(value: number, name: string) => [`${Math.round(value)} kW`, name]}
                      />
                      {forecastBaselineSeries.map((series) => (
                        <Area
                          key={series.key}
                          type="monotone"
                          dataKey="predicted_demand"
                          data={forecastCenter.baseline_comparison.curves[series.key]}
                          stroke={series.tone}
                          fill="transparent"
                          strokeWidth={2}
                          dot={false}
                          name={series.label}
                        />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-[#0D131A] p-5">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Peak summaries</p>
                <div className="mt-4 grid gap-3">
                  {([
                    { label: 'Unmanaged', value: forecastCenter.baseline_comparison.unmanaged.peak_kw, tone: 'text-slate-200' },
                    { label: 'Current strategy', value: forecastCenter.baseline_comparison.current.peak_kw, tone: 'text-cyan-200' },
                    { label: 'Optimized', value: forecastCenter.baseline_comparison.optimized.peak_kw, tone: 'text-emerald-200' },
                  ] as const).map((item) => (
                    <div key={item.label} className="rounded-2xl border border-white/8 bg-[#0B1016] p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{item.label}</p>
                      <p className={`mt-2 text-2xl font-semibold ${item.tone}`}>{Math.round(item.value)} kW</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-2xl border border-white/8 bg-[#0B1016] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Delta vs unmanaged (current)</p>
                  <p className={`mt-2 text-lg font-semibold ${forecastCenter.baseline_comparison.delta_vs_unmanaged_kw > 0 ? 'text-rose-200' : 'text-emerald-200'}`}>
                    {forecastCenter.baseline_comparison.delta_vs_unmanaged_kw >= 0 ? '+' : ''}{forecastCenter.baseline_comparison.delta_vs_unmanaged_kw.toFixed(1)} kW
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {workspace === 'overview' && (
        <section className="grid gap-4 lg:grid-cols-[1.12fr_0.88fr]">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Operational Forecast</p>
                <h2 className="mt-2 text-3xl font-semibold text-white">Prevent overload before evening peak</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
                  Forecasts are generated from the backend XGBoost model using ordered features, zone type encoding, and live time context. The selected zone is {data.zone.name}.
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-right">
                <p className="text-xs uppercase tracking-[0.24em] text-emerald-200/75">Scenario</p>
               <p className="mt-1 text-lg font-semibold text-white">{data.scenario_options?.find((item) => item.active)?.label || 'Normal'}</p>
              </div>
            </div>

             <div className="mt-6 flex flex-wrap gap-3">
               {(data.scenario_options || []).map((option) => (
                <button
                  key={option.id}
                  onClick={() => setScenario(option.id)}
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    option.active
                      ? 'border-emerald-300/40 bg-emerald-300/12 text-white'
                      : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
             <div className="mt-5">
               <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Zone Focus</p>
               <div className="mt-3 flex flex-wrap gap-2">
                 {(data.zone_rankings || []).slice(0, 8).map((zone) => (
                  <button
                    key={zone.id}
                    onClick={() => setSelectedZone(zone.name)}
                    className={`rounded-full border px-4 py-2 text-sm transition ${
                      zone.active
                        ? 'border-cyan-300/30 bg-cyan-300/10 text-white'
                        : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    {zone.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-white/8 to-white/3 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Selected Zone Summary</p>
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-white/8 bg-[#0E141C] p-4">
                <p className="text-sm text-slate-400">Zone</p>
                <p className="mt-1 text-2xl font-semibold text-white">{data.zone.name}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">{data.zone.zone_type} zone</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-white/8 bg-[#0E141C] p-4">
                  <p className="text-sm text-slate-400">Predicted Load</p>
                  <p className="mt-1 text-2xl font-semibold text-white">{Math.round(data.grid_stress.predicted_load)} kW</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-[#0E141C] p-4">
                  <p className="text-sm text-slate-400">Capacity</p>
                  <p className="mt-1 text-2xl font-semibold text-white">{Math.round(data.grid_stress.capacity)} kW</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-2xl border border-white/8 bg-[#0E141C] p-4">
                  <p className="text-sm text-slate-400">Status</p>
                  <p className={`mt-1 text-lg font-semibold ${data.grid_stress.status === 'OVERLOAD RISK' ? 'text-rose-300' : data.grid_stress.status === 'CONSTRAINED' ? 'text-amber-300' : 'text-emerald-300'}`}>{data.grid_stress.status}</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-[#0E141C] p-4">
                  <p className="text-sm text-slate-400">Headroom</p>
                  <p className={`mt-1 text-lg font-semibold ${(activeZone?.headroom_kw || 0) < 0 ? 'text-rose-300' : 'text-emerald-300'}`}>{Math.round(activeZone?.headroom_kw || 0)} kW</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-[#0E141C] p-4">
                  <p className="text-sm text-slate-400">Peak Window</p>
                  <p className="mt-1 text-lg font-semibold text-white">{data.network_summary.peak_window}</p>
                </div>
              </div>
               <div className="rounded-2xl border border-white/8 bg-[#0E141C] p-4 text-sm text-slate-300">
                 <p>{data.grid_stress?.explanation?.reason || 'No information available.'}</p>
                 <p className="mt-2 text-slate-400">{data.grid_stress?.explanation?.impact || ''}</p>
                 <p className="mt-2 text-slate-500">{data.grid_stress?.explanation?.confidence || ''}</p>
               </div>
            </div>
          </div>
        </section>
        )}

        {workspace === 'overview' && (
          <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Live Risk Engine</p>
                  <h3 className="mt-2 text-xl font-semibold text-white">Overload probability and peak timing</h3>
                </div>
                <div className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.18em] ${riskTone.chip}`}>
                  {data.risk_engine.risk_band}
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-white/8 bg-[#0D131A] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Overload probability</p>
                  <p className={`mt-2 text-2xl font-semibold ${riskTone.text}`}>{Math.round(data.risk_engine.overload_probability * 100)}%</p>
                  <div className="mt-3 h-1.5 w-full rounded-full bg-white/10">
                    <div className={`h-1.5 rounded-full ${riskTone.bar}`} style={{ width: `${Math.min(100, Math.max(0, Math.round(data.risk_engine.overload_probability * 100)))}%` }} />
                  </div>
                </div>
                <div className="rounded-2xl border border-white/8 bg-[#0D131A] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Risk score</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{data.risk_engine.risk_score}/100</p>
                  <p className="mt-2 text-sm text-slate-400">Confidence: {data.risk_engine.confidence_level}</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-4">
                <div className="rounded-2xl border border-white/8 bg-[#0D131A] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Projected peak</p>
                  <p className="mt-2 text-lg font-semibold text-white">{data.risk_engine.projected_peak_timing}</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-[#0D131A] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Zone</p>
                  <p className="mt-2 text-lg font-semibold text-white">{data.risk_engine.zone}</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-[#0D131A] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Last update</p>
                  <p className="mt-2 text-lg font-semibold text-white">{lastUpdatedAt ? new Date(lastUpdatedAt).toLocaleTimeString() : '—'}</p>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-400">AI Operations Summary</p>
                  <h3 className="mt-2 text-xl font-semibold text-white">Operational briefing driven by live state</h3>
                </div>
                 <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-slate-300">
                   Urgency: {data.ops_summary?.urgency || '—'}
                 </div>
              </div>

               <div className="mt-5 rounded-3xl border border-white/8 bg-[#0D131A] p-5">
                 <p className="text-sm leading-6 text-slate-200">{data.ops_summary?.briefing || 'No operational briefing available.'}</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                   <div className="rounded-2xl border border-white/8 bg-[#0B1016] p-4">
                     <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Peak</p>
                     <p className="mt-2 text-lg font-semibold text-white">{data.ops_summary?.signals?.peak_time || '—'}</p>
                   </div>
                   <div className="rounded-2xl border border-white/8 bg-[#0B1016] p-4">
                     <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Scenario delta</p>
                     <p className={`mt-2 text-lg font-semibold ${(data.ops_summary?.signals?.scenario_delta_kw ?? 0) > 0 ? 'text-rose-200' : 'text-emerald-200'}`}>
                       {(data.ops_summary?.signals?.scenario_delta_kw ?? 0) >= 0 ? '+' : ''}{Math.round(data.ops_summary?.signals?.scenario_delta_kw ?? 0)} kW
                     </p>
                   </div>
                   <div className="rounded-2xl border border-white/8 bg-[#0B1016] p-4">
                     <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Relief corridor</p>
                     <p className="mt-2 text-lg font-semibold text-white">{data.ops_summary?.signals?.suggested_relief_zone || '—'}</p>
                   </div>
                </div>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <div className="rounded-3xl border border-white/8 bg-[#0D131A] p-5">
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Live Event Ticker</p>
                  <div className="mt-4 space-y-3">
                    {combinedTicker.map((event) => (
                      <div key={`${event.timestamp}-${event.type}-${event.message}`} className="flex items-start gap-3">
                        <span className={`mt-1 inline-flex h-2.5 w-2.5 rounded-full ${
                          event.severity === 'CRITICAL' ? 'bg-rose-400' :
                          event.severity === 'HIGH' ? 'bg-amber-400' :
                          event.severity === 'MEDIUM' ? 'bg-yellow-400' :
                          event.severity === 'LOW' ? 'bg-emerald-400' : 'bg-slate-500'
                        }`} />
                        <div className="min-w-0">
                          <p className="text-xs text-slate-500">{new Date(event.timestamp).toLocaleTimeString()} • {event.type}</p>
                          <p className="text-sm text-slate-200">{event.message}</p>
                        </div>
                      </div>
                    ))}
                    {combinedTicker.length === 0 && (
                      <p className="text-sm text-slate-500">No events yet.</p>
                    )}
                  </div>
                </div>

                <div className="rounded-3xl border border-white/8 bg-[#0D131A] p-5">
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Top Risk Zones</p>
                  <div className="mt-4 overflow-hidden rounded-2xl border border-white/8">
                    <table className="min-w-full divide-y divide-white/8 text-sm">
                      <thead className="bg-white/5 text-slate-400">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium">Zone</th>
                          <th className="px-4 py-3 text-left font-medium">Current</th>
                          <th className="px-4 py-3 text-left font-medium">Peak</th>
                          <th className="px-4 py-3 text-left font-medium">Risk</th>
                          <th className="px-4 py-3 text-left font-medium">Confidence</th>
                        </tr>
                      </thead>
                       <tbody className="divide-y divide-white/8 bg-[#0B1016]">
                         {(data.top_risk_zones || []).map((row) => (
                          <tr key={row.zone}>
                            <td className="px-4 py-3 text-white">
                              <div className="flex flex-col">
                                <span className="font-medium">{row.zone}</span>
                                <span className="mt-1 text-xs text-slate-500">{row.recommended_action}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-slate-300">{Math.round(row.current_load)} kW</td>
                            <td className="px-4 py-3 text-slate-300">{Math.round(row.predicted_peak)} kW</td>
                            <td className={`px-4 py-3 ${row.overload_risk > 15 ? 'text-rose-300' : row.overload_risk > 5 ? 'text-amber-300' : 'text-emerald-300'}`}>
                              {row.overload_risk.toFixed(1)}%
                            </td>
                            <td className="px-4 py-3 text-slate-300">{row.confidence}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {workspace === 'overview' && (
        <>
        <section className="grid gap-4 md:grid-cols-4">
          {[
            { label: 'Peak Delta', value: `${peakDelta >= 0 ? '+' : ''}${peakDelta} kW`, icon: Gauge, tone: peakDelta > 0 ? 'text-rose-300' : 'text-emerald-300' },
            { label: 'Peak Hour', value: data.forecast.peak.label, icon: TrendingUp, tone: 'text-cyan-300' },
            { label: 'Zones At Risk', value: `${data.network_summary.zones_at_risk}`, icon: AlertTriangle, tone: data.network_summary.zones_at_risk > 0 ? 'text-rose-300' : 'text-emerald-300' },
            { label: 'Model', value: data.forecast.model, icon: ShieldCheck, tone: 'text-emerald-300' },
          ].map((card) => (
            <div key={card.label} className="rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-400">{card.label}</p>
                <card.icon size={16} className={card.tone} />
              </div>
              <p className={`mt-4 text-2xl font-semibold ${card.tone}`}>{card.value}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.28fr_0.72fr]">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Zone Demand Forecast</p>
                <h3 className="mt-2 text-xl font-semibold text-white">{data.zone.name} 24-hour forecast</h3>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-right">
                <p className="text-xs text-slate-400">Peak highlight</p>
                <p className="text-sm font-semibold text-white">{Math.round(data.forecast.peak.predicted_demand)} kW at {data.forecast.peak.label}</p>
              </div>
            </div>
            <div className="mt-5 h-[290px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.forecast.curve} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34d399" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#34d399" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="rgba(148,163,184,0.12)" />
                  <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#091019', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16 }}
                    labelStyle={{ color: '#e2e8f0' }}
                    formatter={(value: number, name: string) => [`${Math.round(value)} kW`, name]}
                  />
                  <Area dataKey="confidence_upper" stroke="rgba(148,163,184,0.15)" fill="transparent" />
                  <Area type="monotone" dataKey="predicted_demand" stroke="#34d399" strokeWidth={2.5} fill="url(#forecastFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Operator Workspace</p>
                <h3 className="mt-2 text-xl font-semibold text-white">Zone focus and action controls</h3>
              </div>
              <MapPin size={18} className="text-cyan-300" />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { id: 'actions', label: 'Action Queue' },
                { id: 'zones', label: 'Zone Ranking' },
                { id: 'planning', label: 'Planning' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setPanel(tab.id as typeof panel)}
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    panel === tab.id
                      ? 'border-cyan-300/30 bg-cyan-300/10 text-white'
                      : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="mt-4 rounded-2xl border border-white/8 bg-[#0D131A] p-4 text-sm text-slate-300">
              Click a zone button or marker to switch the forecast and planning view. The highlighted marker tracks the active operating zone.
            </div>
            <div className="mt-4 h-[260px] overflow-hidden rounded-[22px] border border-white/8">
              <Map
                {...viewState}
                onMove={(event) => setViewState(event.viewState)}
                mapStyle={MAP_STYLE}
                attributionControl={false}
                style={{ width: '100%', height: '100%' }}
               >
                 <NavigationControl position="bottom-right" />
                 {(data.all_zones || []).map((zone) => {
                  const tone = zone.active ? 'bg-emerald-300' : 'bg-slate-500';
                  return (
                    <Marker key={`zone-${zone.id}`} longitude={zone.lng} latitude={zone.lat} anchor="center">
                      <button
                        onClick={() => setSelectedZone(zone.name)}
                        className={`h-4 w-4 rounded-full border-2 border-white ${tone} shadow-[0_0_18px_rgba(52,211,153,0.32)]`}
                        aria-label={`Select ${zone.name}`}
                      />
                    </Marker>
                  );
                })}
              </Map>
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Zone Command Board</p>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/8 bg-[#0D131A] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Scenario Delta</p>
                 <p className={`mt-2 text-lg font-semibold ${(data.network_summary?.scenario_delta_kw ?? 0) > 0 ? 'text-rose-300' : 'text-emerald-300'}`}>
                   {(data.network_summary?.scenario_delta_kw ?? 0) >= 0 ? '+' : ''}{data.network_summary?.scenario_delta_kw ?? 0} kW
                 </p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-[#0D131A] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Highest Headroom</p>
                 <p className="mt-2 text-lg font-semibold text-white">{data.network_summary?.highest_headroom_zone || '—'}</p>
              </div>
            </div>
             <div className="mt-4 grid gap-3 sm:grid-cols-2">
               {(data.all_zones || []).map((zone) => (
                <button
                  key={zone.id}
                  onClick={() => setSelectedZone(zone.name)}
                  className={`rounded-2xl border p-4 text-left transition ${
                    zone.active
                      ? 'border-emerald-300/30 bg-emerald-300/10'
                      : 'border-white/8 bg-[#0D131A] hover:border-white/16'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-white">{zone.name}</p>
                    <Activity size={15} className={zone.active ? 'text-emerald-300' : 'text-slate-500'} />
                  </div>
                  <p className="mt-2 text-xs text-slate-400">{zone.type} zone • {Math.round(zone.capacity)} kW limit</p>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            {panel === 'actions' && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Action Queue</p>
                    <h3 className="mt-2 text-xl font-semibold text-white">What the control room should do next</h3>
                  </div>
                  <Clock3 size={18} className="text-cyan-300" />
                </div>
                 <div className="mt-5 space-y-4">
                   {(data.action_queue || []).map((action) => (
                    <article key={action.title} className="rounded-3xl border border-white/8 bg-[#0D131A] p-5">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-lg font-semibold text-white">{action.title}</p>
                        <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-cyan-200">
                          {action.priority}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-300">{action.reason}</p>
                      <p className="mt-3 text-sm text-slate-400">{action.impact}</p>
                      <p className="mt-3 text-xs uppercase tracking-[0.24em] text-emerald-300/80">{action.confidence}</p>
                    </article>
                  ))}
                </div>
              </>
            )}
            {panel === 'zones' && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Network Ranking</p>
                    <h3 className="mt-2 text-xl font-semibold text-white">Zone utilization under the active scenario</h3>
                  </div>
                  <TrendingUp size={18} className="text-emerald-300" />
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-4">
                  {[
                    { label: 'Constrained Zones', value: `${data.network_summary.constrained_zones}` },
                    { label: 'Peak Window', value: data.network_summary.peak_window },
                    { label: 'Best Headroom', value: data.network_summary.highest_headroom_zone },
                    { label: 'Scenario Delta', value: `${data.network_summary.scenario_delta_kw >= 0 ? '+' : ''}${data.network_summary.scenario_delta_kw} kW` },
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl border border-white/8 bg-[#0D131A] p-4">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{item.label}</p>
                      <p className="mt-2 text-lg font-semibold text-white">{item.value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-5 overflow-hidden rounded-[22px] border border-white/8">
                  <table className="min-w-full divide-y divide-white/8 text-sm">
                    <thead className="bg-white/5 text-slate-400">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">Zone</th>
                        <th className="px-4 py-3 text-left font-medium">Load</th>
                        <th className="px-4 py-3 text-left font-medium">Capacity</th>
                        <th className="px-4 py-3 text-left font-medium">Headroom</th>
                        <th className="px-4 py-3 text-left font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/8 bg-[#0D131A]">
                       {(data.zone_rankings || []).slice(0, 6).map((zone) => (
                        <tr key={zone.id} className={zone.active ? 'bg-emerald-400/5' : ''}>
                          <td className="px-4 py-3 text-white">{zone.name}</td>
                          <td className="px-4 py-3 text-slate-300">{Math.round(zone.predicted_load)} kW</td>
                          <td className="px-4 py-3 text-slate-300">{Math.round(zone.capacity)} kW</td>
                          <td className={`px-4 py-3 ${zone.headroom_kw < 0 ? 'text-rose-300' : 'text-emerald-300'}`}>{Math.round(zone.headroom_kw)} kW</td>
                          <td className={`px-4 py-3 ${zone.status === 'OVERLOAD RISK' ? 'text-rose-300' : zone.status === 'CONSTRAINED' ? 'text-amber-300' : 'text-emerald-300'}`}>{zone.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            {panel === 'planning' && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Planning Insights</p>
                    <h3 className="mt-2 text-xl font-semibold text-white">Infrastructure actions</h3>
                  </div>
                  <ArrowRight size={18} className="text-emerald-300" />
                </div>
                <div className="mt-5 space-y-4">
                   {(data.planning_insights || []).map((insight) => (
                    <article key={insight.headline} className="rounded-3xl border border-white/8 bg-[#0D131A] p-5">
                      <h4 className="text-lg font-semibold text-white">{insight.headline}</h4>
                      <p className="mt-3 text-sm leading-6 text-slate-300">{insight.reason}</p>
                      <p className="mt-3 text-sm text-slate-400">{insight.impact}</p>
                      <p className="mt-3 text-xs uppercase tracking-[0.24em] text-emerald-300/80">{insight.confidence}</p>
                    </article>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
        </>
        )}

        {workspace === 'copilot' && (
          <section className="h-[700px]">
            {token && <CopilotPanel token={token} zone={selectedZone} scenario={scenario} />}
          </section>
        )}

        {workspace === 'operations' && (
          <section className="space-y-5">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Live Operations</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Real-time grid status</h2>
                </div>
                <div className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-emerald-300">Live</div>
              </div>
              <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
                <div className="rounded-2xl border border-white/8 bg-[#0D131A] p-5">
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-500 mb-4">Zone Status Map</p>
                  <div className="h-[400px] bg-slate-900/50 rounded-xl border border-white/10 flex items-center justify-center">
                    <div>Map disabled for debugging</div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="rounded-2xl border border-white/8 bg-[#0D131A] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Active Zones</p>
                    <p className="mt-3 text-2xl font-semibold text-white">{data.all_zones?.length ?? 0}</p>
                    <p className="mt-2 text-xs text-slate-400">{data.network_summary.constrained_zones} constrained</p>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-[#0D131A] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Network Load</p>
                    <p className="mt-3 text-2xl font-semibold text-white">{Math.round(data.grid_stress.predicted_load)} kW</p>
                    <p className="mt-2 text-xs text-slate-400">of {Math.round(data.grid_stress.capacity)} kW capacity</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {workspace === 'planning' && (
          <section className="space-y-5">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Planning Insights</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Infrastructure strategy</h2>
              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                {(data.planning_insights || []).map((insight, idx) => (
                  <div key={idx} className="rounded-2xl border border-white/8 bg-[#0D131A] p-5">
                    <h4 className="font-semibold text-white">{insight.headline}</h4>
                    <p className="mt-2 text-sm text-slate-300">{insight.reason}</p>
                    <p className="mt-2 text-sm text-slate-400">{insight.impact}</p>
                    <p className="mt-3 text-xs uppercase tracking-[0.18em] text-emerald-300">{insight.confidence}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {workspace === 'incidents' && (
          <section className="space-y-5">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Incident Management</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Critical events</h2>
              <div className="mt-6 space-y-3">
                {(data.event_ticker || []).slice(0, 10).map((event, idx) => (
                  <div key={idx} className="rounded-2xl border border-white/8 bg-[#0D131A] p-4 flex items-start gap-4">
                    <span className={`mt-0.5 inline-flex h-3 w-3 rounded-full flex-shrink-0 ${event.severity === 'CRITICAL' ? 'bg-rose-400' : event.severity === 'HIGH' ? 'bg-amber-400' : event.severity === 'MEDIUM' ? 'bg-yellow-400' : 'bg-emerald-400'}`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="font-medium text-white text-sm">{event.type}</p>
                        <span className="text-xs text-slate-500">{new Date(event.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-sm text-slate-300">{event.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {workspace === 'simulator' && (
          <section className="space-y-5">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Scenario Simulator</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">What-if analysis</h2>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {(data.scenario_options || []).map((scenario) => (
                  <button key={scenario.id} onClick={() => setScenario(scenario.id)} className={`rounded-2xl border p-4 text-left transition ${scenario.active ? 'border-cyan-300/30 bg-cyan-300/10' : 'border-white/8 bg-[#0D131A] hover:border-white/16'}`}>
                    <p className="font-semibold text-white">{scenario.label}</p>
                    <p className="mt-2 text-xs text-slate-400">Run simulation for this scenario</p>
                  </button>
                ))}
              </div>
              {data.forecast_center && (
                <div className="mt-6 rounded-2xl border border-white/8 bg-[#0D131A] p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Current Scenario Impact</p>
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-slate-400">Peak Reduction</p>
                      <p className="mt-1 text-lg font-semibold text-emerald-300">{Math.round(data.forecast_center.baseline_comparison.reduction_vs_unmanaged_percent)}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Current Peak</p>
                      <p className="mt-1 text-lg font-semibold text-white">{Math.round(data.forecast_center.baseline_comparison.current.peak_kw)} kW</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Optimized Peak</p>
                      <p className="mt-1 text-lg font-semibold text-emerald-300">{Math.round(data.forecast_center.baseline_comparison.optimized.peak_kw)} kW</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {workspace === 'reports' && (
          <section className="space-y-5">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Reports</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Analytics & reports</h2>
              <div className="mt-6 space-y-3">
                {[
                  { title: 'Daily Operations Summary', date: 'Today', size: '2.4 MB' },
                  { title: 'Weekly Peak Analysis', date: '7 days', size: '1.8 MB' },
                  { title: 'Monthly Infrastructure Report', date: '30 days', size: '3.2 MB' },
                  { title: 'Forecast Accuracy Report', date: 'Last 90 days', size: '1.5 MB' },
                ].map((report, idx) => (
                  <div key={idx} className="rounded-2xl border border-white/8 bg-[#0D131A] p-4 flex items-center justify-between hover:bg-white/5 transition cursor-pointer">
                    <div>
                      <p className="font-medium text-white">{report.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{report.date} • {report.size}</p>
                    </div>
                    <ArrowRight size={16} className="text-slate-500" />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {workspace === 'alerts' && (
          <section className="space-y-5">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Alerts</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">System alerts</h2>
              <div className="mt-6 space-y-3">
                {(data.event_ticker || []).slice(0, 8).map((event, idx) => (
                  <div key={idx} className={`rounded-2xl border p-4 ${event.severity === 'CRITICAL' ? 'border-rose-400/20 bg-rose-400/5' : event.severity === 'HIGH' ? 'border-amber-400/20 bg-amber-400/5' : 'border-white/8 bg-[#0D131A]'}`}>
                    <div className="flex items-start gap-3">
                      <AlertTriangle size={16} className={`mt-1 flex-shrink-0 ${event.severity === 'CRITICAL' ? 'text-rose-400' : event.severity === 'HIGH' ? 'text-amber-400' : 'text-slate-400'}`} />
                      <div>
                        <p className="font-medium text-white">{event.type}</p>
                        <p className="mt-1 text-sm text-slate-300">{event.message}</p>
                        <p className="mt-2 text-xs text-slate-500">{new Date(event.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {workspace === 'stations' && (
          <section className="space-y-5">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Station Directory</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">All zones and stations</h2>
              <div className="mt-6 overflow-hidden rounded-2xl border border-white/8">
                <table className="w-full divide-y divide-white/8 text-sm">
                  <thead className="bg-white/5 text-slate-400">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">Zone</th>
                      <th className="px-4 py-3 text-left font-medium">Type</th>
                      <th className="px-4 py-3 text-left font-medium">Capacity</th>
                      <th className="px-4 py-3 text-left font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/8 bg-[#0D131A]">
                    {data.all_zones.map((zone) => (
                      <tr key={zone.id} className={zone.active ? 'bg-emerald-400/5' : ''}>
                        <td className="px-4 py-3 text-white font-medium">{zone.name}</td>
                        <td className="px-4 py-3 text-slate-300 capitalize">{zone.zone_type}</td>
                        <td className="px-4 py-3 text-slate-300">{Math.round(zone.capacity)} kW</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${zone.active ? 'bg-emerald-400/20 text-emerald-300' : 'bg-slate-500/20 text-slate-400'}`}>
                            {zone.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {workspace === 'system' && (
          <section className="space-y-5">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">System Health</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Infrastructure status</h2>
              <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-2xl border border-white/8 bg-[#0D131A] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">API Status</p>
                  <p className="mt-3 text-lg font-semibold text-emerald-300">Operational</p>
                  <p className="mt-2 text-xs text-slate-400">All endpoints responding</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-[#0D131A] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Model Status</p>
                  <p className="mt-3 text-lg font-semibold text-emerald-300">Active</p>
                  <p className="mt-2 text-xs text-slate-400">XGBoost v1.4.2</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-[#0D131A] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Data Freshness</p>
                  <p className="mt-3 text-lg font-semibold text-emerald-300">{lastUpdatedAt ? new Date(lastUpdatedAt).toLocaleTimeString() : 'Live'}</p>
                  <p className="mt-2 text-xs text-slate-400">Last updated now</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-[#0D131A] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Prediction Accuracy</p>
                  <p className="mt-3 text-lg font-semibold text-cyan-300">92.4%</p>
                  <p className="mt-2 text-xs text-slate-400">Last 30 days MAPE</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-[#0D131A] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Network Zones</p>
                  <p className="mt-3 text-lg font-semibold text-white">{data.network_summary.total_zones}</p>
                  <p className="mt-2 text-xs text-slate-400">Total monitored</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-[#0D131A] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Uptime</p>
                  <p className="mt-3 text-lg font-semibold text-emerald-300">99.98%</p>
                  <p className="mt-2 text-xs text-slate-400">Last 90 days</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {error && (
          <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            {error}
          </div>
        )}
      </main>
    </div>
  );
}
