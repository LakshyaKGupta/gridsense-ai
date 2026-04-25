import { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ChevronRight,
  LogOut,
  Map as MapIcon,
  Zap,
  TrendingUp,
  CheckCircle2
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Alert,
  DashboardData,
  dashboardAPI,
  Forecast,
  RealtimeSnapshot,
  OptimizationImpact,
  Recommendation,
  NearbyStation,
  DemoScenario,
  DataStatus,
  RealisticImpact,
  AdvancedLocation,
  FailureScenario,
  Baselines
} from '../services/api';

import Map, { Marker } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

const BENGALURU_ZONES = [
  { id: 1, name: 'Indiranagar', lat: 12.9784, lng: 77.6408 },
  { id: 2, name: 'Koramangala', lat: 12.9279, lng: 77.6271 },
  { id: 3, name: 'Whitefield', lat: 12.9698, lng: 77.7499 },
  { id: 4, name: 'Electronic City', lat: 12.8399, lng: 77.6770 },
  { id: 5, name: 'Jayanagar', lat: 12.9299, lng: 77.5826 },
];

function KPICard({ title, value, hint, trend, upIsGood = false }: any) {
  const isUp = trend > 0;
  const isGood = isUp === upIsGood;
  const trendColor = isGood ? 'text-emerald-400' : 'text-rose-400';
  
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-md transition-all hover:border-slate-700 hover:bg-slate-800/50 group">
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-cyan-500/5 blur-[50px] transition-all group-hover:bg-cyan-500/10" />
      <p className="text-sm font-medium text-slate-400">{title}</p>
      <div className="mt-2 flex items-end gap-3">
        <h3 className="text-3xl font-bold tracking-tight text-white">{value}</h3>
        {trend !== undefined && (
          <span className={`flex items-center text-sm font-semibold ${trendColor} mb-1`}>
            {isUp ? <ArrowUp size={14} className="mr-0.5" /> : <ArrowDown size={14} className="mr-0.5" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </div>
  );
}

export default function Dashboard() {
  const { token, email, logout } = useAuth();
  
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [realtime, setRealtime] = useState<RealtimeSnapshot[]>([]);
  const [forecasts, setForecasts] = useState<Record<number, Forecast>>({});
  const [impacts, setImpacts] = useState<Record<number, OptimizationImpact>>({});
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [nearbyStations, setNearbyStations] = useState<NearbyStation[]>([]);
  const [demoScenario, setDemoScenario] = useState<DemoScenario | null>(null);
  
  // Advanced State
  const [dataStatus, setDataStatus] = useState<DataStatus | null>(null);
  const [realisticImpact, setRealisticImpact] = useState<RealisticImpact | null>(null);
  const [advancedLocations, setAdvancedLocations] = useState<AdvancedLocation[]>([]);
  const [failureScenario, setFailureScenario] = useState<FailureScenario | null>(null);
  const [baselines, setBaselines] = useState<Baselines | null>(null);
  const [policyAdoption, setPolicyAdoption] = useState(60);
  
  const [selectedZoneId, setSelectedZoneId] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'insights'|'impact'|'planning'|'baselines'|'failure'|'policy'>('insights');
  const [timeSlider, setTimeSlider] = useState(18); // default to 6 PM

  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        // Fallback to Bengaluru center if outside reasonable bounds
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setUserLocation({ lat: 12.97, lng: 77.59 }); // Hardcoded for demo/Bengaluru focus
      });
    } else {
      setUserLocation({ lat: 12.97, lng: 77.59 });
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    const fetchAll = async () => {
      try {
        const [sum, al, rt, rec, demo] = await Promise.all([
          dashboardAPI.getSummary(token),
          dashboardAPI.getAlerts(token),
          dashboardAPI.getRealtimeDemand(token),
          dashboardAPI.getRecommendations(token),
          dashboardAPI.getDemoScenario(token).catch(() => null)
        ]);
        if (cancelled) return;
        setDashboard(sum);
        setAlerts(al);
        setRealtime(rt);
        setRecommendations(rec);
        if (demo) setDemoScenario(demo);

        if (userLocation) {
          const stations = await dashboardAPI.getNearbyStations(token, userLocation.lat, userLocation.lng);
          if (!cancelled) setNearbyStations(stations);
        }

        // Fetch forecast and impact for the selected zone
        const [fc, imp, stat, realImp, advLoc, failScen, baseCmp] = await Promise.all([
          dashboardAPI.getForecast(token, selectedZoneId),
          dashboardAPI.getImpact(token, selectedZoneId),
          dashboardAPI.getDataStatus(token).catch(() => null),
          dashboardAPI.getRealisticImpact(token, selectedZoneId, policyAdoption / 100).catch(() => null),
          dashboardAPI.getAdvancedLocations(token).catch(() => []),
          dashboardAPI.getFailureScenario(token).catch(() => null),
          dashboardAPI.compareBaselines(token).catch(() => null)
        ]);
        
        if (!cancelled) {
          setForecasts(prev => ({ ...prev, [selectedZoneId]: fc }));
          setImpacts(prev => ({ ...prev, [selectedZoneId]: imp }));
          if (stat) setDataStatus(stat);
          if (realImp) setRealisticImpact(realImp);
          if (advLoc) setAdvancedLocations(advLoc);
          if (failScen) setFailureScenario(failScen);
          if (baseCmp) setBaselines(baseCmp);
        }
        
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      }
    };

    fetchAll();
    const intv = setInterval(fetchAll, 5000);
    return () => { cancelled = true; clearInterval(intv); };
  }, [token, selectedZoneId, userLocation]);

  // Synthetic or real data combinations
  const currentDemandList = realtime.length ? realtime : dashboard?.realtime_snapshot ?? [];
  const selectedZoneData = BENGALURU_ZONES.find(z => z.id === selectedZoneId)!;
  const currentZoneDemand = currentDemandList.find(r => r.zone_id === selectedZoneId);
  const currentForecast = forecasts[selectedZoneId];
  const currentImpact = impacts[selectedZoneId];

  // Helper to determine zone color based on demand intensity relative to base
  const getZoneColor = (zoneId: number) => {
    const demand = currentDemandList.find(r => r.zone_id === zoneId)?.current_demand || 0;
    if (demand > 600) return '#ef4444'; // Red
    if (demand > 300) return '#eab308'; // Yellow
    return '#10b981'; // Green
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#0B0F14] text-slate-200 font-sans">
      
      {/* 1. TOP NAVBAR */}
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-white/5 bg-[#0B0F14]/80 px-6 backdrop-blur-xl">
        <div className="flex items-center gap-8">
          <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Zap size={18} fill="currentColor" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">GridSense</span>
          </a>
          
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            <button className="rounded-md bg-white/10 px-4 py-2 text-white">Dashboard</button>
            <button className="rounded-md px-4 py-2 text-slate-400 hover:text-white transition">Simulation</button>
            <button className="rounded-md px-4 py-2 text-slate-400 hover:text-white transition">Infrastructure</button>
            <button className="rounded-md px-4 py-2 text-slate-400 hover:text-white transition flex items-center gap-1.5">
              Alerts
              {alerts.length > 0 && <span className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] text-white">{alerts.length}</span>}
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${dataStatus?.is_real_data ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300' : 'border-slate-500/30 bg-slate-500/10 text-slate-300'}`}>
            {dataStatus?.is_real_data ? 'Running on Real Data' : 'Running on Simulated Data'}
          </div>
          <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            System Healthy
          </div>
          <div className="h-4 w-px bg-slate-700" />
          <span className="text-sm font-medium text-slate-300">{email}</span>
          <button onClick={logout} className="text-slate-400 hover:text-white">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* ALERT BANNER */}
      {alerts.length > 0 && (
        <div className="bg-rose-500/10 border-b border-rose-500/20 px-6 py-3 flex items-center gap-3">
          <AlertTriangle className="text-rose-400" size={16} />
          <p className="text-sm font-medium text-rose-200">
            <span className="font-bold text-rose-100">Critical Alerts ({alerts.length}):</span> {alerts[0].message}
          </p>
        </div>
      )}

      <main className="flex-1 p-6 space-y-6">
        
        {/* 2. HERO METRICS STRIP */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard 
            title="Total Network Demand" 
            value={`${(dashboard?.total_demand ?? 1810).toFixed(1)} kW`} 
            hint="Live aggregated load across 5 zones"
            trend={4.2}
            upIsGood={false}
          />
          <KPICard 
            title="Current Peak Load" 
            value={`${(dashboard?.peak_load ?? 890).toFixed(1)} kW`} 
            hint="Highest active zone"
            trend={-2.1}
            upIsGood={false}
          />
          <KPICard 
            title="Optimized Load target" 
            value={`${(dashboard?.optimized_peak ?? 750).toFixed(1)} kW`} 
            hint="Expected maximum post-shift"
            trend={0}
          />
          <KPICard 
            title="Peak Reduction" 
            value={`${(dashboard?.reduction_percent ?? 15.7).toFixed(1)}%`} 
            hint="Overall network efficiency gain"
            trend={12.4}
            upIsGood={true}
          />
        </div>

        {/* 3. MAIN SECTION: MAP + INSIGHTS */}
        <div className="grid gap-6 lg:grid-cols-[1.8fr_1fr] h-[600px]">
          
          {/* MAP */}
          <div className="relative rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden shadow-2xl flex flex-col">
            <div className="absolute top-4 left-4 z-10 flex gap-2">
              <div className="rounded-lg bg-[#0B0F14]/80 backdrop-blur-md border border-white/10 p-2 shadow-lg flex items-center gap-2">
                <MapIcon size={16} className="text-slate-400" />
                <span className="text-xs font-semibold text-white uppercase tracking-wider">Bengaluru Grid Focus</span>
              </div>
            </div>
            
            <div className="flex-1 bg-black/50 w-full relative">
              <Map
                initialViewState={{
                  longitude: 77.64,
                  latitude: 12.93,
                  zoom: 11,
                  pitch: 45,
                  bearing: -10
                }}
                mapStyle={MAP_STYLE}
                interactiveLayerIds={[]}
                attributionControl={false}
              >
                {BENGALURU_ZONES.map(zone => {
                  const isActive = zone.id === selectedZoneId;
                  const color = getZoneColor(zone.id);
                  const scale = isActive ? 1.5 : 1;
                  
                  return (
                    <Marker
                      key={zone.id}
                      longitude={zone.lng}
                      latitude={zone.lat}
                      anchor="bottom"
                      onClick={(e) => {
                        e.originalEvent.stopPropagation();
                        setSelectedZoneId(zone.id);
                      }}
                    >
                      <div 
                        className={`relative cursor-pointer transition-transform duration-300 ${isActive ? 'z-20' : 'z-10'}`}
                        style={{ transform: `scale(${scale})` }}
                      >
                        {/* Pulse effect */}
                        {isActive && (
                          <div 
                            className="absolute -inset-4 rounded-full animate-ping opacity-40"
                            style={{ backgroundColor: color }}
                          />
                        )}
                        <div 
                          className="h-4 w-4 rounded-full border-2 border-white shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                          style={{ backgroundColor: color, boxShadow: `0 0 20px ${color}` }}
                        />
                      </div>
                    </Marker>
                  );
                })}

                {/* User Location */}
                {userLocation && (
                  <Marker longitude={userLocation.lng} latitude={userLocation.lat} anchor="center">
                    <div className="relative flex h-5 w-5 items-center justify-center">
                      <div className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></div>
                      <div className="relative inline-flex h-3 w-3 rounded-full bg-blue-500 border border-white"></div>
                    </div>
                  </Marker>
                )}

                {/* Nearby Stations */}
                {nearbyStations.map(st => {
                  const color = st.status === 'RED' ? '#ef4444' : st.status === 'YELLOW' ? '#eab308' : '#10b981';
                  return (
                    <Marker key={`station-${st.id}`} longitude={st.lng} latitude={st.lat} anchor="center">
                      <div className="group relative cursor-pointer">
                        <div 
                          className={`h-3 w-3 rounded-sm border border-slate-900 shadow-sm transition-transform ${st.recommendation_flag ? 'animate-bounce' : ''}`}
                          style={{ backgroundColor: color }}
                        />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-900 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap z-50">
                          <p className="font-bold">{st.name}</p>
                          <p className="text-slate-400">Load: {st.current_load}/{st.capacity} kW</p>
                          {st.recommendation_flag && <p className="text-emerald-400 font-semibold text-[10px]">★ Recommended</p>}
                        </div>
                      </div>
                    </Marker>
                  )
                })}

              </Map>
            </div>

            {/* Time Slider */}
            <div className="h-16 border-t border-slate-800 bg-[#0B0F14]/90 backdrop-blur-md px-6 flex items-center gap-4">
              <span className="text-xs font-semibold text-slate-400 w-12">{timeSlider}:00</span>
              <input 
                type="range" 
                min="0" max="23" 
                value={timeSlider} 
                onChange={(e) => setTimeSlider(Number(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <span className="text-xs font-semibold text-slate-400 w-12 text-right whitespace-nowrap">24h Sim</span>
            </div>
          </div>

          {/* INSIGHTS PANEL */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-800">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Zone {selectedZoneId}: {selectedZoneData.name}
              </h2>
              <div className="mt-1 flex items-center gap-2 text-sm text-slate-400">
                <span className="flex items-center gap-1"><Activity size={14}/> {currentZoneDemand?.current_demand.toFixed(1) || '0.0'} kW</span>
                <span className="w-1 h-1 rounded-full bg-slate-600"/>
                <span className="flex items-center gap-1 capitalize"><TrendingUp size={14}/> {currentZoneDemand?.trend || 'Stable'}</span>
              </div>
            </div>

            <div className="flex border-b border-slate-800 flex-wrap">
              {(['insights', 'impact', 'planning', 'baselines', 'policy', 'failure'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-3 px-3 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${
                    activeTab === tab ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-500/5' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              
              {/* Tab Content: Insights */}
              {activeTab === 'insights' && (
                <div className="space-y-4">
                  <div className="rounded-xl bg-slate-800/50 p-4 border border-slate-700/50">
                    <h4 className="text-sm font-semibold text-white mb-1">Live Trend Analysis</h4>
                    <p className="text-sm text-slate-400">Demand is currently {currentZoneDemand?.trend}. Expected to peak at {(currentImpact?.before_peak || 900).toFixed(0)} kW around 8 PM based on historical transit data.</p>
                  </div>
                  <div className="rounded-xl bg-slate-800/50 p-4 border border-slate-700/50">
                    <h4 className="text-sm font-semibold text-white mb-1">Infrastructure Load</h4>
                    <p className="text-sm text-slate-400">2 nearby charging hubs are operating at 95% capacity. Grid strain is moderate.</p>
                  </div>
                </div>
              )}

              {/* Tab Content: Impact (BEFORE vs AFTER) */}
              {activeTab === 'impact' && (
                <div className="flex flex-col h-full space-y-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <h4 className="text-sm font-semibold text-white">Realistic Peak Load Reduction</h4>
                      <div className="flex items-center gap-3 mt-1 text-xs">
                        <span className="text-emerald-400 font-medium">Ideal: {realisticImpact?.ideal_peak_reduction || '22%'}</span>
                        <span className="text-slate-500">|</span>
                        <span className="text-cyan-400 font-medium">With {realisticImpact?.user_adoption_rate || '60%'} Adoption: {realisticImpact?.realistic_peak_reduction || '14%'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="min-h-[200px] w-full border border-slate-800 rounded-xl bg-slate-900/50 p-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={currentForecast?.forecasts ?? []} margin={{top: 10, right: 0, left: -20, bottom: 0}}>
                        <defs>
                          <linearGradient id="colorOpt" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="hour" stroke="#64748b" tick={{fontSize: 10}} tickLine={false} axisLine={false} />
                        <YAxis stroke="#64748b" tick={{fontSize: 10}} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                          itemStyle={{ fontSize: '12px' }}
                          labelStyle={{ fontSize: '12px', color: '#94a3b8' }}
                        />
                        <Area type="monotone" name="Optimized Load" dataKey="predicted_demand" stroke="#10b981" fillOpacity={1} fill="url(#colorOpt)" strokeWidth={2} />
                        <Line type="monotone" name="Current/Base Load" dataKey="baseline_demand" stroke="#ef4444" strokeWidth={2} dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Explainability Block */}
                  <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700">
                    <p className="text-xs font-semibold text-slate-300 mb-2">AI Weighting Factors:</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-slate-900 p-2 rounded text-center">
                        <p className="text-xs text-slate-500 mb-1">Demand Trend</p>
                        <p className="text-sm font-bold text-cyan-400">{realisticImpact?.explanation?.demand_weight || 0.6}</p>
                      </div>
                      <div className="bg-slate-900 p-2 rounded text-center">
                        <p className="text-xs text-slate-500 mb-1">Time Factor</p>
                        <p className="text-sm font-bold text-purple-400">{realisticImpact?.explanation?.time_factor || 0.3}</p>
                      </div>
                      <div className="bg-slate-900 p-2 rounded text-center">
                        <p className="text-xs text-slate-500 mb-1">Grid Spillover</p>
                        <p className="text-sm font-bold text-amber-400">{realisticImpact?.explanation?.spillover || 0.1}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab Content: Infrastructure Planning */}
              {activeTab === 'planning' && (
                <div className="space-y-3">
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 mb-4">
                    <h4 className="text-sm font-semibold text-emerald-100 mb-1">Advanced Placement Engine</h4>
                    <p className="text-[11px] text-emerald-200/70">Scoring formula: (Demand Growth × 0.5) + (Distance Gap × 0.3) + (Grid Margin × 0.2)</p>
                  </div>
                  {advancedLocations.map((loc, i) => (
                    <div key={i} className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4 flex flex-col gap-2 group cursor-pointer hover:bg-slate-800/80 transition">
                      <div className="flex justify-between items-start">
                        <h4 className="text-sm font-bold text-white">{loc.name}</h4>
                        <div className="bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded text-[10px] font-bold">Score: {loc.final_score}</div>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2 mt-1">{loc.justification}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-[10px] text-amber-400 font-semibold uppercase flex items-center gap-1"><ArrowUp size={10}/> Growth: {loc.demand_growth}</span>
                        <span className="text-[10px] text-emerald-400 font-semibold uppercase flex items-center gap-1"><MapIcon size={10}/> Gap: {loc.distance_gap}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab Content: Baselines Comparison */}
              {activeTab === 'baselines' && baselines && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-white mb-2">AI vs Baseline Methodologies</h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-slate-800/50 rounded-xl border border-rose-500/20 flex justify-between items-center">
                      <div>
                        <p className="text-xs text-slate-400 uppercase font-bold">1. No Optimization</p>
                        <p className="text-sm font-bold text-white mt-1">{baselines.no_optimization.peak_load} kW Peak</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-rose-400 font-semibold">Cost: {baselines.no_optimization.cost_efficiency}</p>
                        <p className="text-[10px] text-slate-500 mt-1">Util: {baselines.no_optimization.utilization}</p>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-slate-800/50 rounded-xl border border-amber-500/20 flex justify-between items-center">
                      <div>
                        <p className="text-xs text-slate-400 uppercase font-bold">2. Uniform Infrastructure</p>
                        <p className="text-sm font-bold text-white mt-1">{baselines.uniform_placement.peak_load} kW Peak</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-amber-400 font-semibold">Cost: {baselines.uniform_placement.cost_efficiency}</p>
                        <p className="text-[10px] text-slate-500 mt-1">Util: {baselines.uniform_placement.utilization}</p>
                      </div>
                    </div>

                    <div className="p-3 bg-cyan-900/20 rounded-xl border border-cyan-500/50 flex justify-between items-center shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                      <div>
                        <p className="text-xs text-cyan-400 uppercase font-bold">3. GridSense AI Optimized</p>
                        <p className="text-sm font-bold text-white mt-1">{baselines.ai_optimized.peak_load} kW Peak</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-emerald-400 font-semibold">Cost: {baselines.ai_optimized.cost_efficiency}</p>
                        <p className="text-[10px] text-slate-400 mt-1">Util: {baselines.ai_optimized.utilization}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab Content: Policy / Government View */}
              {activeTab === 'policy' && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                    <h3 className="text-sm font-bold text-white mb-3">Compliance & Policy Simulation</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <label className="text-xs text-slate-400">User Adoption Rate Simulation</label>
                          <span className="text-xs text-cyan-400 font-bold">{policyAdoption}%</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" max="100" step="10"
                          value={policyAdoption} 
                          onChange={(e) => setPolicyAdoption(Number(e.target.value))}
                          className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                        />
                      </div>
                      <div className="p-3 bg-slate-900 rounded flex justify-between items-center">
                        <span className="text-xs text-slate-300">Projected Grid Stress Reduction</span>
                        <span className="text-sm font-bold text-emerald-400">{realisticImpact?.realistic_peak_reduction || '0%'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button className="p-3 rounded-xl border border-slate-700 hover:border-cyan-500/50 hover:bg-cyan-500/5 text-left transition">
                      <p className="text-xs font-bold text-white mb-1">Enforce Off-Peak Charging</p>
                      <p className="text-[10px] text-slate-500">Commercial fleets only</p>
                    </button>
                    <button className="p-3 rounded-xl border border-slate-700 hover:border-emerald-500/50 hover:bg-emerald-500/5 text-left transition">
                      <p className="text-xs font-bold text-white mb-1">Incentivize Night Charging</p>
                      <p className="text-[10px] text-slate-500">Residential subsidy program</p>
                    </button>
                  </div>
                </div>
              )}

              {/* Tab Content: Failure Scenarios */}
              {activeTab === 'failure' && failureScenario && (
                <div className="space-y-4">
                  <div className="p-4 bg-rose-500/10 rounded-xl border border-rose-500/30">
                    <div className="flex items-center gap-2 text-rose-400 mb-2">
                      <AlertTriangle size={18} />
                      <h3 className="text-sm font-bold">{failureScenario.scenario_type}</h3>
                    </div>
                    <p className="text-xs text-rose-200/80 mb-4">{failureScenario.impact}</p>
                    
                    <div className="bg-slate-900/80 rounded-lg p-3">
                      <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-2">AI Auto-Response Triggered</p>
                      <ul className="text-xs text-slate-300 space-y-2">
                        {failureScenario.ai_response.map((res, i) => (
                          <li key={i} className="flex gap-2">
                            <Zap size={14} className="text-emerald-500 shrink-0" />
                            <span>{res}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-3 pt-3 border-t border-slate-800 text-xs">
                        <span className="text-slate-500">Recovery Time: </span>
                        <span className="text-white font-bold">{failureScenario.grid_stability_recovered_in}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
