import { useEffect, useState, useMemo } from 'react';
import { Navigation, AlertCircle, Zap, ChevronRight, Battery, Settings, Activity, Map as MapIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI, isBackendLive, UserDashboardPayload, Forecast } from '../services/api';
import Map, { Marker, Popup, NavigationControl, Source, Layer } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
const DEFAULT_LOCATION = { lat: 12.9716, lng: 77.5946 };
const BENGALURU_BOUNDS = { latMin: 12.82, latMax: 13.15, lngMin: 77.45, lngMax: 77.80 };

type UserWorkspace = 'charge' | 'route' | 'smart' | 'vehicle' | 'history' | 'saved' | 'insights' | 'notifications' | 'wallet' | 'settings';

const USER_WORKSPACES: { id: UserWorkspace; label: string }[] = [
  { id: 'charge', label: 'Charge Now' },
  { id: 'route', label: 'Route' },
  { id: 'smart', label: 'Smart' },
  { id: 'vehicle', label: 'Vehicle' },
  { id: 'history', label: 'History' },
  { id: 'saved', label: 'Saved' },
  { id: 'insights', label: 'Insights' },
  { id: 'notifications', label: 'Alerts' },
  { id: 'wallet', label: 'Wallet' },
  { id: 'settings', label: 'Settings' },
];

function isInBengaluru(lat: number, lng: number): boolean {
  return lat >= BENGALURU_BOUNDS.latMin && lat <= BENGALURU_BOUNDS.latMax && lng >= BENGALURU_BOUNDS.lngMin && lng <= BENGALURU_BOUNDS.lngMax;
}

function statusColor(status: 'GREEN' | 'YELLOW' | 'RED') {
  if (status === 'GREEN') return { bg: 'bg-emerald-400/10', text: 'text-emerald-300', border: 'border-emerald-400/20', dot: '#10b981', badge: 'Available' };
  if (status === 'YELLOW') return { bg: 'bg-amber-400/10', text: 'text-amber-300', border: 'border-amber-400/20', dot: '#eab308', badge: 'Moderate wait' };
  return { bg: 'bg-red-400/10', text: 'text-red-300', border: 'border-red-400/20', dot: '#ef4444', badge: 'Busy' };
}

function formatHour(hour: number): string {
  const date = new Date();
  date.setHours(hour, 0, 0, 0);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
}

function buildDirectionsUrl(lat: number, lng: number, origin?: { lat: number; lng: number }): string {
  const dest = `${lat.toFixed(6)},${lng.toFixed(6)}`;
  const params = new URLSearchParams({ api: '1', destination: dest, travelmode: 'driving', dir_action: 'navigate' });
  if (origin) params.set('origin', `${origin.lat.toFixed(6)},${origin.lng.toFixed(6)}`);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export default function UserDashboard() {
  const { token, logout, profile } = useAuth();
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [data, setData] = useState<UserDashboardPayload | null>(null);
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewState, setViewState] = useState({ longitude: DEFAULT_LOCATION.lng, latitude: DEFAULT_LOCATION.lat, zoom: 12 });
  const [selectedStation, setSelectedStation] = useState<UserDashboardPayload['station_options'][0] | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [workspace, setWorkspace] = useState<UserWorkspace>('charge');

  // Get user location with Bengaluru demo mode detection
  useEffect(() => {
    if (!navigator.geolocation) {
      setIsDemoMode(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        if (isInBengaluru(loc.lat, loc.lng)) {
          setLocation(loc);
          setViewState((prev) => ({ ...prev, longitude: loc.lng, latitude: loc.lat, zoom: 13 }));
        } else {
          setIsDemoMode(true);
        }
      },
      () => setIsDemoMode(true),
      { enableHighAccuracy: true, timeout: 6000 }
    );
  }, []);

  // Fetch dashboard data
  useEffect(() => {
    if (!token) return;
    const userData = profile?.user_data;
    setLoading(true);
    setError(null);

    dashboardAPI
      .getUserDashboard(token, {
        lat: location.lat,
        lng: location.lng,
        vehicle_model: userData?.vehicleModel,
        battery_capacity_kwh: userData?.batteryCapacityKwh,
        home_charging_access: userData?.homeChargingAccess,
        typical_charging_time: userData?.typicalChargingTime,
      })
      .then((payload) => {
        setData(payload);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token, location, profile]);

  // Fetch forecast data
  useEffect(() => {
    if (!token || !data?.zone) return;
    dashboardAPI
      .getForecast(token, data.zone.id)
      .then((forecastData) => setForecast(forecastData))
      .catch(() => undefined);
  }, [token, data?.zone?.id]);

  const recommendedStation = data?.nearest_station;
  const stationOptions = data?.station_options?.slice(0, 6) || [];
  const routeOrigin = data?.effective_location || location;
  const decision = data?.decision_support;
  const recommendation = decision?.recommended_action;
  const chargeNow = decision?.charge_now;

  const bestTimeWindow = useMemo(() => {
    if (!forecast?.forecasts) return null;
    const sorted = [...forecast.forecasts].sort((a, b) => a.predicted_demand - b.predicted_demand);
    return sorted[0];
  }, [forecast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F14] text-slate-100">
        <header className="sticky top-0 z-40 border-b border-white/8 bg-[#0B0F14]/88 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-white/5 animate-pulse" />
              <div>
                <div className="h-3 w-20 bg-white/5 rounded animate-pulse" />
                <div className="h-5 w-32 bg-white/5 rounded animate-pulse mt-2" />
              </div>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
            <div className="rounded-2xl border border-white/8 bg-white/[0.03]">
              <div className="h-[600px] bg-slate-900 animate-pulse rounded-2xl" />
            </div>
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
                <div className="h-3 w-32 bg-white/5 rounded animate-pulse" />
                <div className="h-6 w-48 bg-white/5 rounded animate-pulse mt-3" />
                <div className="space-y-2 mt-4">
                  {[1, 2, 3].map((i) => <div key={i} className="h-4 w-full bg-white/5 rounded animate-pulse" />)}
                </div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5">
                <div className="h-3 w-24 bg-white/5 rounded animate-pulse" />
                <div className="space-y-2 mt-4">
                  {[1, 2, 3, 4].map((i) => <div key={i} className="h-10 bg-white/5 rounded animate-pulse" />)}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0B0F14] flex items-center justify-center text-slate-100">
        <div className="text-center max-w-sm">
          <AlertCircle className="mx-auto mb-4 text-red-400" size={32} />
          <p className="text-red-200">{error || 'Unable to load dashboard'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F14] text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/8 bg-[#0B0F14]/88 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300">
              <Zap size={16} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">GridSense</p>
              <h1 className="text-sm font-semibold text-white">Charging Navigation</h1>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            {isDemoMode && (
              <span className="rounded-md bg-amber-400/10 px-2 py-1 text-[10px] font-medium text-amber-300 border border-amber-400/20">
                Demo: Bengaluru
              </span>
            )}
            {isBackendLive
              ? <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-emerald-300">● Live</span>
              : <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-amber-300">◎ Simulation</span>
            }
            <Link to="/" className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-400 hover:text-white transition">
              Home
            </Link>
            <button onClick={() => logout()} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-400 hover:text-white transition">
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* User Workspace Tabs */}
      <div className="w-full border-b border-white/8 bg-white/[0.02]">
        <div className="mx-auto flex max-w-7xl gap-1 px-4 py-2 overflow-x-auto">
          {USER_WORKSPACES.map((ws) => {
            const isActive = workspace === ws.id;
            return (
              <button
                key={ws.id}
                onClick={() => setWorkspace(ws.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition ${
                  isActive
                    ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {ws.label}
              </button>
            );
          })}
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
          {/* ===== MAP & MAIN WORKSPACE ===== */}
          <section className="rounded-2xl border border-white/8 bg-[#0B0F14] overflow-hidden flex flex-col h-[600px] shadow-2xl">
            {workspace === 'charge' && (
            <div className="relative w-full h-full bg-slate-900">
              <Map
                {...viewState}
                onMove={(evt) => setViewState(evt.viewState)}
                mapStyle={MAP_STYLE}
                attributionControl={false}
                style={{ width: '100%', height: '100%' }}
              >
                <NavigationControl position="bottom-right" />

                {/* User location */}
                <Marker longitude={routeOrigin.lng} latitude={routeOrigin.lat} anchor="center">
                  <div className="relative">
                    <div className="absolute inset-0 h-4 w-4 rounded-full bg-blue-400 animate-ping opacity-20" />
                    <div className="h-3 w-3 rounded-full bg-blue-400 border-2 border-white" />
                  </div>
                </Marker>

                {/* Stations */}
                {stationOptions.map((station) => {
                  const isRecommended = station.id === recommendedStation?.id;
                  const color = statusColor(station.status);
                  return (
                    <Marker key={station.id} longitude={station.lng} latitude={station.lat} anchor="center">
                      <div
                        className={`cursor-pointer transition-transform hover:scale-110 ${isRecommended ? 'h-7 w-7' : 'h-5 w-5'} rounded-full border-2 border-white shadow-lg`}
                        style={{ backgroundColor: color.dot }}
                        onClick={() => {
                          setSelectedStation(station);
                          setViewState((prev) => ({ ...prev, longitude: station.lng, latitude: station.lat, zoom: 14 }));
                        }}
                      />
                    </Marker>
                  );
                })}

                {/* Station popup */}
                {selectedStation && (
                  <Popup
                    longitude={selectedStation.lng}
                    latitude={selectedStation.lat}
                    anchor="bottom"
                    onClose={() => setSelectedStation(null)}
                    closeButton={true}
                    closeOnClick={false}
                    offset={15}
                    className="[&_.maplibregl-popup-content]:bg-[#0B0F14] [&_.maplibregl-popup-content]:border [&_.maplibregl-popup-content]:border-white/10 [&_.maplibregl-popup-content]:rounded-xl [&_.maplibregl-popup-content]:p-0 [&_.maplibregl-popup-close-button]:text-white"
                  >
                    <div className="min-w-[220px]">
                      <div className="p-3 border-b border-white/8">
                        <h4 className="font-medium text-white text-sm">{selectedStation.name}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">{selectedStation.distance.toFixed(1)} km · {Math.round(selectedStation.wait_time)} min wait</p>
                      </div>
                      <div className="p-3 grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <p className="text-slate-500">Load</p>
                          <p className="text-white font-medium">{Math.round(selectedStation.load)} kW</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Capacity</p>
                          <p className="text-white font-medium">{Math.round(selectedStation.capacity)} kW</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Status</p>
                          <p className={`text-white font-medium ${statusColor(selectedStation.status).text}`}>{selectedStation.status}</p>
                        </div>
                      </div>
                    </div>
                  </Popup>
                )}
              </Map>
            </div>
            )}
            
            {workspace === 'route' && (
            <div className="relative w-full h-full bg-slate-900">
              <Map
                {...viewState}
                onMove={(evt) => setViewState(evt.viewState)}
                mapStyle={MAP_STYLE}
                attributionControl={false}
                style={{ width: '100%', height: '100%' }}
              >
                <NavigationControl position="bottom-right" />
                <Marker longitude={routeOrigin.lng} latitude={routeOrigin.lat} anchor="center">
                  <div className="h-4 w-4 rounded-full bg-blue-500 border-2 border-white shadow-lg" />
                </Marker>
                {/* Mock destination marker */}
                <Marker longitude={77.62} latitude={12.93} anchor="center">
                  <div className="h-4 w-4 rounded-full bg-emerald-500 border-2 border-white shadow-lg" />
                </Marker>
                <Source id="route" type="geojson" data={{
                  type: 'Feature',
                  properties: {},
                  geometry: {
                    type: 'LineString',
                    coordinates: [[routeOrigin.lng, routeOrigin.lat], [77.595, 12.95], [77.61, 12.94], [77.62, 12.93]]
                  }
                }}>
                  <Layer id="route-line" type="line" paint={{ 'line-color': '#3b82f6', 'line-width': 4, 'line-opacity': 0.8 }} />
                </Source>
              </Map>
              <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md p-4 rounded-xl border border-white/10 w-72">
                <h3 className="text-white font-medium mb-3 flex items-center gap-2"><MapIcon size={16} className="text-blue-400"/> Active Route</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-slate-300"><span>Destination:</span> <span className="text-white">Koramangala</span></div>
                  <div className="flex justify-between text-slate-300"><span>Distance:</span> <span className="text-white">8.5 km</span></div>
                  <div className="flex justify-between text-slate-300"><span>Est. Arrival:</span> <span className="text-white">24 min</span></div>
                </div>
              </div>
            </div>
            )}

            {workspace === 'smart' && (
            <div className="relative w-full h-full bg-[#0B0F14] p-6 flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-emerald-500/10 rounded-lg"><Zap size={20} className="text-emerald-400"/></div>
                <div>
                  <h3 className="text-white font-medium text-lg">Smart Charging Optimization</h3>
                  <p className="text-slate-400 text-sm">Automated scheduling based on GridSense load forecasts</p>
                </div>
              </div>
              <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-xl p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[
                    { label: '00:00', predicted_demand: 40 }, { label: '04:00', predicted_demand: 38 },
                    { label: '08:00', predicted_demand: 65 }, { label: '12:00', predicted_demand: 62 },
                    { label: '16:00', predicted_demand: 68 }, { label: '20:00', predicted_demand: 92 },
                    { label: '24:00', predicted_demand: 50 }
                  ]}>
                      <defs>
                        <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                      <XAxis dataKey="label" stroke="#ffffff40" tick={{ fill: '#ffffff80', fontSize: 12 }} />
                      <YAxis stroke="#ffffff40" tick={{ fill: '#ffffff80', fontSize: 12 }} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Area type="monotone" dataKey="predicted_demand" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorDemand)" />
                      {/* Highlight optimal window 23:00 to 05:00 */}
                      <ReferenceLine x="23:00" stroke="#3b82f6" strokeDasharray="3 3" label={{ position: 'top', value: 'Optimal Start', fill: '#3b82f6', fontSize: 10 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            )}

            {workspace === 'vehicle' && (
            <div className="relative w-full h-full bg-[#0B0F14] p-8 flex flex-col items-center justify-center">
               <div className="w-full max-w-lg space-y-6">
                 <div className="text-center mb-8">
                   <h2 className="text-3xl font-bold text-white">{profile?.user_data?.vehicleModel || 'Tata Nexon EV'}</h2>
                   <p className="text-emerald-400 mt-2 font-medium">Connected & Online</p>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   <div className="bg-white/[0.03] border border-white/10 p-5 rounded-2xl flex items-center gap-4">
                     <div className="p-3 bg-blue-500/10 rounded-full"><Battery size={24} className="text-blue-400"/></div>
                     <div><p className="text-slate-400 text-sm">Battery Level</p><p className="text-2xl font-semibold text-white">42%</p></div>
                   </div>
                   <div className="bg-white/[0.03] border border-white/10 p-5 rounded-2xl flex items-center gap-4">
                     <div className="p-3 bg-emerald-500/10 rounded-full"><MapIcon size={24} className="text-emerald-400"/></div>
                     <div><p className="text-slate-400 text-sm">Est. Range</p><p className="text-2xl font-semibold text-white">128 km</p></div>
                   </div>
                   <div className="bg-white/[0.03] border border-white/10 p-5 rounded-2xl flex items-center gap-4">
                     <div className="p-3 bg-purple-500/10 rounded-full"><Activity size={24} className="text-purple-400"/></div>
                     <div><p className="text-slate-400 text-sm">Battery Health</p><p className="text-2xl font-semibold text-white">98%</p></div>
                   </div>
                   <div className="bg-white/[0.03] border border-white/10 p-5 rounded-2xl flex items-center gap-4">
                     <div className="p-3 bg-orange-500/10 rounded-full"><Settings size={24} className="text-orange-400"/></div>
                     <div><p className="text-slate-400 text-sm">Odometer</p><p className="text-2xl font-semibold text-white">12,450 km</p></div>
                   </div>
                 </div>
               </div>
            </div>
            )}

            {workspace === 'insights' && (
            <div className="relative w-full h-full bg-[#0B0F14] p-8 flex flex-col">
              <h3 className="text-white font-medium text-lg mb-6">Charging Analytics</h3>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-2xl">
                  <p className="text-emerald-400 text-sm font-medium">Smart Savings This Month</p>
                  <p className="text-3xl font-bold text-white mt-2">₹1,240</p>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 p-5 rounded-2xl">
                  <p className="text-blue-400 text-sm font-medium">Total Energy Added</p>
                  <p className="text-3xl font-bold text-white mt-2">142 kWh</p>
                </div>
              </div>
              <div className="flex-1 bg-white/[0.03] border border-white/10 rounded-2xl p-6 flex items-center justify-center text-slate-500 text-sm">
                Detailed session history graph will appear here after your next charge.
              </div>
            </div>
            )}

            {(workspace === 'history' || workspace === 'saved' || workspace === 'notifications' || workspace === 'wallet' || workspace === 'settings') && (
            <div className="relative w-full h-full bg-[#0B0F14] flex items-center justify-center">
              <div className="text-center bg-white/5 p-8 rounded-2xl border border-white/5">
                <AlertCircle size={32} className="mx-auto mb-3 text-slate-400 opacity-50" />
                <p className="text-slate-300 font-medium">{workspace.charAt(0).toUpperCase() + workspace.slice(1)}</p>
                <p className="text-slate-500 text-xs mt-2 max-w-[200px] mx-auto">This module is currently disabled in the live demo environment.</p>
              </div>
            </div>
            )}


          </section>

          {/* ===== RIGHT PANEL ===== */}
          <div className="space-y-4">
            {workspace === 'charge' && chargeNow?.best_station_right_now && (
              <section className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-medium">Best Station Right Now</p>
                <h3 className="mt-2 text-base font-semibold text-white">{chargeNow.best_station_right_now.station_name}</h3>
                <p className="mt-1.5 text-sm text-slate-400 leading-relaxed">{chargeNow.best_station_right_now.why}</p>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <div className="rounded-lg bg-white/5 p-2.5">
                    <p className="text-[10px] text-slate-500">Distance</p>
                    <p className="mt-0.5 text-sm font-semibold text-white">{chargeNow.best_station_right_now.distance_km.toFixed(1)} km</p>
                  </div>
                  <div className="rounded-lg bg-white/5 p-2.5">
                    <p className="text-[10px] text-slate-500">Queue</p>
                    <p className="mt-0.5 text-sm font-semibold text-white">{chargeNow.best_station_right_now.wait_time_minutes} min</p>
                  </div>
                  <div className="rounded-lg bg-white/5 p-2.5">
                    <p className="text-[10px] text-slate-500">Utilization</p>
                    <p className="mt-0.5 text-sm font-semibold text-white">{chargeNow.best_station_right_now.utilization_percent}%</p>
                  </div>
                </div>
                <a
                  href={buildDirectionsUrl(chargeNow.best_station_right_now.station_lat, chargeNow.best_station_right_now.station_lng, routeOrigin)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-400 py-2 text-sm font-semibold text-[#0B0F14] hover:bg-emerald-300 transition"
                >
                  <Navigation size={14} />
                  Navigate Now
                </a>
              </section>
            )}

            {workspace === 'charge' && chargeNow && (
              <section className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-medium">Charge Now Options</p>
                <div className="mt-3 grid gap-3">
                  <div className="rounded-xl border border-white/8 bg-white/5 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-white">Wait time saved</p>
                      <p className="text-sm font-semibold text-emerald-300">{chargeNow.wait_time_saved.minutes} min</p>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">{chargeNow.wait_time_saved.why}</p>
                  </div>

                  {chargeNow.cheapest_option && (
                    <div className="rounded-xl border border-white/8 bg-white/5 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-white">Cheapest option</p>
                        <p className="text-sm font-semibold text-slate-200">₹{Math.round(chargeNow.cheapest_option.estimated_cost_inr)}</p>
                      </div>
                      <p className="mt-1 text-xs text-slate-400">
                        {chargeNow.cheapest_option.type === 'home'
                          ? chargeNow.cheapest_option.why
                          : `${chargeNow.cheapest_option.station_name} • ${chargeNow.cheapest_option.why}`}
                      </p>
                      {chargeNow.cheapest_option.type === 'station' && (
                        <a
                          href={buildDirectionsUrl(chargeNow.cheapest_option.station_lat, chargeNow.cheapest_option.station_lng, routeOrigin)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 hover:bg-white/10 hover:text-white transition"
                        >
                          <Navigation size={12} />
                          Navigate
                        </a>
                      )}
                    </div>
                  )}

                  {chargeNow.fastest_option && (
                    <div className="rounded-xl border border-white/8 bg-white/5 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-white">Fastest option</p>
                        <p className="text-sm font-semibold text-cyan-200">{chargeNow.fastest_option.estimated_total_minutes} min</p>
                      </div>
                      <p className="mt-1 text-xs text-slate-400">{chargeNow.fastest_option.station_name} • {chargeNow.fastest_option.why}</p>
                      <a
                        href={buildDirectionsUrl(chargeNow.fastest_option.station_lat, chargeNow.fastest_option.station_lng, routeOrigin)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 hover:bg-white/10 hover:text-white transition"
                      >
                        <Navigation size={12} />
                        Navigate
                      </a>
                    </div>
                  )}

                  {chargeNow.lowest_congestion_option && (
                    <div className="rounded-xl border border-white/8 bg-white/5 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-white">Lowest congestion</p>
                        <p className="text-sm font-semibold text-amber-200">{chargeNow.lowest_congestion_option.utilization_percent}%</p>
                      </div>
                      <p className="mt-1 text-xs text-slate-400">{chargeNow.lowest_congestion_option.station_name} • {chargeNow.lowest_congestion_option.why}</p>
                      <a
                        href={buildDirectionsUrl(chargeNow.lowest_congestion_option.station_lat, chargeNow.lowest_congestion_option.station_lng, routeOrigin)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 hover:bg-white/10 hover:text-white transition"
                      >
                        <Navigation size={12} />
                        Navigate
                      </a>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Existing Decision Engine (kept for now for other tabs / fallback) */}
            {workspace !== 'charge' && recommendation && (
              <section className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-medium">Recommended Action</p>
                <h3 className="mt-2 text-base font-semibold text-white">{recommendation.headline}</h3>
                <p className="mt-1.5 text-sm text-slate-400 leading-relaxed">{recommendation.why}</p>
                {recommendation.benefits.length > 0 && (
                  <ul className="mt-3 space-y-1.5">
                    {recommendation.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-3 pt-3 border-t border-white/8 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">Confidence</span>
                  <span className="text-xs font-medium text-slate-300">{recommendation.confidence}</span>
                </div>
                {recommendedStation && recommendation.type !== 'home_charge' && (
                  <a
                    href={buildDirectionsUrl(recommendedStation.lat, recommendedStation.lng, routeOrigin)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-400 py-2 text-sm font-semibold text-[#0B0F14] hover:bg-emerald-300 transition"
                  >
                    <Navigation size={14} />
                    Navigate Now
                  </a>
                )}
              </section>
            )}

            {/* SESSION ESTIMATE */}
            {workspace === 'charge' && decision && (
              <section className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-medium">Session Estimate</p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-white/5 p-2.5">
                    <p className="text-[10px] text-slate-500">Total Time</p>
                    <p className="mt-0.5 text-sm font-semibold text-white">{decision.estimated_session_minutes} min</p>
                  </div>
                  <div className="rounded-lg bg-white/5 p-2.5">
                    <p className="text-[10px] text-slate-500">Cost</p>
                    <p className="mt-0.5 text-sm font-semibold text-white">₹{decision.public_cost_inr}</p>
                  </div>
                  {decision.savings_vs_home_inr && decision.savings_vs_home_inr > 0 && (
                    <div className="col-span-2 rounded-lg bg-emerald-400/8 p-2.5">
                      <p className="text-[10px] text-emerald-300/70">Save with home charging</p>
                      <p className="mt-0.5 text-sm font-semibold text-emerald-300">₹{decision.savings_vs_home_inr} less</p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* BEST CHARGING WINDOW */}
            {workspace === 'charge' && bestTimeWindow && (
              <section className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-medium">Best Charging Window</p>
                <div className="mt-3 flex items-baseline gap-2">
                  <p className="text-lg font-bold text-emerald-300">{formatHour(bestTimeWindow.hour)}</p>
                  <span className="text-xs text-slate-500">· {Math.round(bestTimeWindow.predicted_demand)} kW predicted</span>
                </div>
                <div className="mt-2 flex items-center gap-3 text-[10px] text-slate-500">
                  <span>Range: {Math.round(bestTimeWindow.confidence_lower)}–{Math.round(bestTimeWindow.confidence_upper)} kW</span>
                </div>
              </section>
            )}

            {/* STATION OPTIONS */}
            {workspace === 'charge' && stationOptions.length > 0 && (
              <section className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-medium">Nearby Stations</p>
                <div className="mt-3 space-y-2">
                  {stationOptions.map((station) => {
                    const color = statusColor(station.status);
                    const isRecommended = station.id === recommendedStation?.id;
                    return (
                      <button
                        key={station.id}
                        onClick={() => {
                          setSelectedStation(station);
                          setViewState((prev) => ({ ...prev, longitude: station.lng, latitude: station.lat, zoom: 14 }));
                        }}
                        className={`w-full text-left rounded-lg border p-2.5 transition ${
                          isRecommended
                            ? `${color.bg} ${color.border}`
                            : 'border-transparent bg-white/5 hover:bg-white/8'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: color.dot }} />
                            <span className="text-sm font-medium text-white truncate">{station.name}</span>
                          </div>
                          <ChevronRight size={14} className="text-slate-500 flex-shrink-0" />
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-500">
                          <span>{station.distance.toFixed(1)} km</span>
                          <span>{Math.round(station.wait_time)} min</span>
                          {isRecommended && <span className="text-emerald-400 font-medium">Best option</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
             )}

            {/* Route Planner Workspace */}
            {workspace === 'route' && (
              <>
                <section className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-medium">Route Planner</p>
                  <div className="mt-3 space-y-3">
                    <div className="rounded-lg bg-white/5 p-3">
                      <p className="text-xs text-slate-400 mb-2">Charging stops recommended</p>
                      <p className="text-2xl font-semibold text-white">2-3</p>
                      <p className="text-xs text-slate-500 mt-1">For optimal journey time</p>
                    </div>
                    <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-lg transition">Plan Route</button>
                  </div>
                </section>
              </>
            )}

            {/* Smart Charging Workspace */}
            {workspace === 'smart' && (
              <>
                <section className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-medium">Charging Schedule</p>
                  <div className="mt-3 space-y-3">
                    <div className="rounded-lg bg-emerald-400/10 border border-emerald-400/20 p-3">
                      <p className="text-xs text-emerald-300 font-medium">Best time to charge</p>
                      <p className="text-lg font-semibold text-white mt-1">11 PM - 2 AM</p>
                      <p className="text-xs text-slate-400 mt-1">Low grid load period</p>
                    </div>
                    <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2 rounded-lg transition">Schedule Charging</button>
                  </div>
                </section>
              </>
            )}

            {/* Vehicle Workspace */}
            {workspace === 'vehicle' && (
              <>
                <section className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-medium">Vehicle Profile</p>
                  <div className="mt-3 space-y-2">
                    <div className="rounded-lg bg-white/5 p-2.5">
                      <p className="text-xs text-slate-400">Model</p>
                      <p className="text-sm font-semibold text-white mt-0.5">{profile?.user_data?.vehicleModel || 'Tesla Model 3'}</p>
                    </div>
                    <div className="rounded-lg bg-white/5 p-2.5">
                      <p className="text-xs text-slate-400">Battery</p>
                      <p className="text-sm font-semibold text-white mt-0.5">{profile?.user_data?.batteryCapacityKwh || 75} kWh</p>
                    </div>
                  </div>
                </section>
              </>
            )}

            {/* History Workspace */}
            {workspace === 'history' && (
              <>
                <section className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-medium">Recent Sessions</p>
                  <div className="mt-3 space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="rounded-lg bg-white/5 p-2.5">
                        <div className="flex justify-between items-start">
                          <p className="text-sm font-semibold text-white">Charging Station {i}</p>
                          <span className="text-xs text-slate-400">2 days ago</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">42 kWh • ₹280</p>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}

            {/* Saved Workspace */}
            {workspace === 'saved' && (
              <>
                <section className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-medium">Saved Items</p>
                  <div className="mt-3 space-y-2">
                    <div className="rounded-lg bg-white/5 p-2.5">
                      <p className="text-sm font-semibold text-white">Whitefield Station</p>
                      <p className="text-xs text-slate-400 mt-1">5.2 km away</p>
                    </div>
                    <div className="rounded-lg bg-white/5 p-2.5">
                      <p className="text-sm font-semibold text-white">Work Commute Route</p>
                      <p className="text-xs text-slate-400 mt-1">15 km • 2 stops</p>
                    </div>
                  </div>
                </section>
              </>
            )}

            {/* Insights Workspace */}
            {workspace === 'insights' && (
              <>
                <section className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-medium">Your Insights</p>
                  <div className="mt-3 space-y-2">
                    <div className="rounded-lg bg-blue-400/10 border border-blue-400/20 p-2.5">
                      <p className="text-xs text-blue-300">Average charge time</p>
                      <p className="text-lg font-semibold text-white mt-0.5">52 min</p>
                    </div>
                    <div className="rounded-lg bg-green-400/10 border border-green-400/20 p-2.5">
                      <p className="text-xs text-green-300">Monthly savings</p>
                      <p className="text-lg font-semibold text-white mt-0.5">₹420</p>
                    </div>
                  </div>
                </section>
              </>
            )}

            {/* Notifications/Alerts Workspace */}
            {workspace === 'notifications' && (
              <>
                <section className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-medium">Notifications</p>
                  <div className="mt-3 space-y-2">
                    <div className="rounded-lg bg-amber-400/10 border border-amber-400/20 p-2.5">
                      <p className="text-xs font-medium text-amber-300">Station maintenance</p>
                      <p className="text-xs text-slate-400 mt-1">Whitefield station closing 2-4 PM</p>
                    </div>
                    <div className="rounded-lg bg-white/5 p-2.5">
                      <p className="text-xs text-slate-300">Promo: 20% off off-peak charging</p>
                      <p className="text-xs text-slate-500 mt-1">Available until Friday</p>
                    </div>
                  </div>
                </section>
              </>
            )}

            {/* Wallet Workspace */}
            {workspace === 'wallet' && (
              <>
                <section className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-medium">Wallet & Billing</p>
                  <div className="mt-3 space-y-2">
                    <div className="rounded-lg bg-white/5 p-2.5">
                      <p className="text-xs text-slate-400">Available Balance</p>
                      <p className="text-lg font-semibold text-emerald-300 mt-0.5">₹2,450</p>
                    </div>
                    <div className="rounded-lg bg-white/5 p-2.5">
                      <p className="text-xs text-slate-400">This month</p>
                      <p className="text-sm font-semibold text-white mt-0.5">₹1,820 spent</p>
                    </div>
                  </div>
                </section>
              </>
            )}

            {/* Settings Workspace */}
            {workspace === 'settings' && (
              <>
                <section className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-medium">Settings</p>
                  <div className="mt-3 space-y-3">
                    <button className="w-full text-left rounded-lg border border-white/8 bg-white/5 p-3 hover:bg-white/10 transition">
                      <p className="text-sm font-medium text-white">Account Settings</p>
                    </button>
                    <button className="w-full text-left rounded-lg border border-white/8 bg-white/5 p-3 hover:bg-white/10 transition">
                      <p className="text-sm font-medium text-white">Preferences</p>
                    </button>
                    <button className="w-full text-left rounded-lg border border-white/8 bg-white/5 p-3 hover:bg-white/10 transition">
                      <p className="text-sm font-medium text-white">Privacy & Security</p>
                    </button>
                  </div>
                </section>
              </>
            )}

            {/* DEMO MODE NOTICE */}
            {isDemoMode && (
              <div className="rounded-lg border border-amber-400/20 bg-amber-400/8 p-3">
                <p className="text-[11px] text-amber-200/80">
                  <span className="font-medium">Demo Mode:</span> Showing Bengaluru EV grid data. Real-time predictions use synthetic demand patterns.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
