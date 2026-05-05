import { useEffect, useMemo, useState, startTransition } from 'react';
import { Activity, AlertTriangle, ArrowRight, Clock3, Gauge, LogOut, MapPin, Network, ShieldCheck, TrendingUp } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Map, { Marker, NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI, OperatorDashboardPayload } from '../services/api';

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

export default function OperatorDashboard() {
  const { token, logout, profile } = useAuth();
  const [selectedZone, setSelectedZone] = useState(profile?.operator_data?.assignedZone || 'Whitefield');
  const [scenario, setScenario] = useState('normal');
  const [panel, setPanel] = useState<'actions' | 'zones' | 'planning'>('actions');
  const [data, setData] = useState<OperatorDashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewState, setViewState] = useState({ longitude: 77.63, latitude: 12.97, zoom: 10.8 });

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    dashboardAPI.getOperatorDashboard(token, selectedZone, scenario)
      .then((payload) => {
        if (cancelled) return;
        startTransition(() => {
          setData(payload);
          setViewState((current) => ({
            ...current,
            longitude: payload.zone.lng,
            latitude: payload.zone.lat,
          }));
        });
      })
      .catch((fetchError) => {
        if (cancelled) return;
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to load operator cockpit.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token, selectedZone, scenario]);

  const peakDelta = useMemo(() => {
    if (!data) return 0;
    return Math.round(data.grid_stress.predicted_load - data.grid_stress.capacity);
  }, [data]);
  const activeZone = useMemo(() => data?.zone_rankings.find((zone) => zone.active) ?? null, [data]);

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
            <Link to="/" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 hover:text-white">Home</Link>
            <Link to="/profile" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 hover:text-white">Profile</Link>
            <button onClick={() => void logout()} className="inline-flex items-center gap-2 rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-2 text-sm text-rose-200">
              <LogOut size={14} />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex max-w-[1380px] flex-col gap-5 px-6 py-5">
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
                <p className="mt-1 text-lg font-semibold text-white">{data.scenario_options.find((item) => item.active)?.label}</p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {data.scenario_options.map((option) => (
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
                {data.zone_rankings.slice(0, 8).map((zone) => (
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
                <p>{data.grid_stress.explanation.reason}</p>
                <p className="mt-2 text-slate-400">{data.grid_stress.explanation.impact}</p>
                <p className="mt-2 text-slate-500">{data.grid_stress.explanation.confidence}</p>
              </div>
            </div>
          </div>
        </section>

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
                {data.all_zones.map((zone) => {
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
                <p className={`mt-2 text-lg font-semibold ${data.network_summary.scenario_delta_kw > 0 ? 'text-rose-300' : 'text-emerald-300'}`}>
                  {data.network_summary.scenario_delta_kw >= 0 ? '+' : ''}{data.network_summary.scenario_delta_kw} kW
                </p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-[#0D131A] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Highest Headroom</p>
                <p className="mt-2 text-lg font-semibold text-white">{data.network_summary.highest_headroom_zone}</p>
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {data.all_zones.map((zone) => (
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
                  {data.action_queue.map((action) => (
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
                      {data.zone_rankings.slice(0, 6).map((zone) => (
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
                  {data.planning_insights.map((insight) => (
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

        {error && (
          <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            {error}
          </div>
        )}
      </main>
    </div>
  );
}
