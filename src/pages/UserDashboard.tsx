import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  BatteryCharging,
  Bell,
  Clock3,
  Coins,
  Download,
  Expand,
  Heart,
  Home,
  LogOut,
  MapPin,
  Navigation,
  Route,
  Wallet,
  Zap,
} from 'lucide-react';
import Map, { Layer, Marker, NavigationControl, Popup, Source, type MapRef } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Link } from 'react-router-dom';
import Papa from 'papaparse';
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { FeatureCollection, LineString } from 'geojson';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI, Forecast, UserDashboardPayload } from '../services/api';

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
const DEFAULT_LOCATION = { lat: 12.9716, lng: 77.5946 };

type Workspace = 'charge' | 'route' | 'smart' | 'history' | 'saved' | 'alerts' | 'wallet' | 'settings';

const WORKSPACES: Array<{ id: Workspace; label: string }> = [
  { id: 'charge', label: 'Charge Now' },
  { id: 'route', label: 'Route Planner' },
  { id: 'smart', label: 'Smart Charging' },
  { id: 'history', label: 'History' },
  { id: 'saved', label: 'Saved' },
  { id: 'alerts', label: 'Alerts' },
  { id: 'wallet', label: 'Wallet' },
  { id: 'settings', label: 'Settings' },
];

const MAP_WORKSPACES: Workspace[] = ['charge', 'route', 'smart'];

function buildDirectionsUrl(lat: number, lng: number, origin?: { lat: number; lng: number }): string {
  const params = new URLSearchParams({
    api: '1',
    destination: `${lat.toFixed(6)},${lng.toFixed(6)}`,
    travelmode: 'driving',
    dir_action: 'navigate',
  });
  if (origin) params.set('origin', `${origin.lat.toFixed(6)},${origin.lng.toFixed(6)}`);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  const csv = Papa.unparse(rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function statusTone(status: 'GREEN' | 'YELLOW' | 'RED') {
  if (status === 'GREEN') return 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200';
  if (status === 'YELLOW') return 'border-amber-400/20 bg-amber-400/10 text-amber-200';
  return 'border-rose-400/20 bg-rose-400/10 text-rose-200';
}

export default function UserDashboard() {
  const { token, logout, profile } = useAuth();
  const [workspace, setWorkspace] = useState<Workspace>('charge');
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [selectedStationId, setSelectedStationId] = useState<number | null>(null);
  const [batteryPercent, setBatteryPercent] = useState<number>(38);
  const [destination, setDestination] = useState('Flexible charging stop');
  const [data, setData] = useState<UserDashboardPayload | null>(null);
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState<string | null>(null);
  const [selectedPopupId, setSelectedPopupId] = useState<number | null>(null);
  const [viewState, setViewState] = useState({ longitude: DEFAULT_LOCATION.lng, latitude: DEFAULT_LOCATION.lat, zoom: 12.3 });
  const [workspaceState, setWorkspaceState] = useState<UserDashboardPayload['workspace_state'] | null>(null);
  const mapShellRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapRef | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
        setLocation(nextLocation);
        setViewState((current) => ({
          ...current,
          latitude: nextLocation.lat,
          longitude: nextLocation.lng,
          zoom: 13.1,
        }));
      },
      () => undefined,
      { enableHighAccuracy: true, timeout: 6000 },
    );
  }, []);

  const fetchDashboard = async (nextStationId: number | null = selectedStationId) => {
    if (!token) return;
    const userData = profile?.user_data;
    if (!data) setLoading(true);
    setError(null);
    try {
      const payload = await dashboardAPI.getUserDashboard(token, {
        lat: location.lat,
        lng: location.lng,
        selected_station_id: nextStationId,
        vehicle_model: userData?.vehicleModel,
        battery_capacity_kwh: userData?.batteryCapacityKwh,
        battery_percent: batteryPercent,
        home_charging_access: userData?.homeChargingAccess,
        typical_charging_time: userData?.typicalChargingTime,
        destination,
      });
      setData(payload);
      setWorkspaceState(payload.workspace_state);
      const resolvedStationId = nextStationId ?? payload.selected_station?.id ?? payload.nearest_station?.id ?? null;
      setSelectedStationId(resolvedStationId);
      if (payload.selected_station || payload.nearest_station) {
        const focus = payload.selected_station || payload.nearest_station;
        setViewState((current) => ({
          ...current,
          longitude: focus?.lng ?? current.longitude,
          latitude: focus?.lat ?? current.latitude,
          zoom: 13.3,
        }));
      }
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to load EV dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchDashboard();
  }, [token, location.lat, location.lng, profile]);

  useEffect(() => {
    if (selectedStationId !== null) {
      void fetchDashboard(selectedStationId);
    }
  }, [selectedStationId]);

  useEffect(() => {
    if (!token || !data?.zone?.id) return;
    dashboardAPI.getForecast(token, data.zone.id).then(setForecast).catch(() => undefined);
  }, [token, data?.zone?.id]);

  const selectedStation = useMemo(() => {
    if (!data) return null;
    return data.station_options.find((station) => station.id === selectedStationId) || data.selected_station || data.nearest_station;
  }, [data, selectedStationId]);

  useEffect(() => {
    const resizeMap = () => {
      window.requestAnimationFrame(() => mapRef.current?.resize());
    };

    resizeMap();
    const timeoutId = window.setTimeout(resizeMap, 240);
    window.addEventListener('resize', resizeMap);
    document.addEventListener('fullscreenchange', resizeMap);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener('resize', resizeMap);
      document.removeEventListener('fullscreenchange', resizeMap);
    };
  }, [workspace, data?.selected_station?.id, data?.nearest_station?.id]);

  const routeGeoJson = useMemo<FeatureCollection<LineString> | null>(() => {
    if (!data?.route?.geometry?.coordinates?.length) return null;
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: data.route.geometry.coordinates,
          },
        },
      ],
    };
  }, [data?.route]);

  const routeOrigin = data?.effective_location || location;
  const shouldShowMap = MAP_WORKSPACES.includes(workspace);

  const bestWindow = data?.charging_recommendation;
  const chargeNow = data?.decision_support.charge_now;
  const savedStations = workspaceState?.saved?.stations || [];
  const savedRoutes = workspaceState?.saved?.routes || [];
  const savedWindows = workspaceState?.saved?.windows || [];
  const activeAlerts = (workspaceState?.alerts || []).filter((alert) => !alert.dismissed);

  const performWorkspaceUpdate = async <T,>(label: string, task: () => Promise<T>, apply: (result: T) => void) => {
    setActionPending(label);
    try {
      const result = await task();
      apply(result);
    } catch (taskError) {
      setError(taskError instanceof Error ? taskError.message : 'Action failed');
    } finally {
      setActionPending(null);
    }
  };

  const toggleFullscreen = async () => {
    if (!mapShellRef.current) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      window.requestAnimationFrame(() => mapRef.current?.resize());
      return;
    }
    await mapShellRef.current.requestFullscreen();
    window.requestAnimationFrame(() => mapRef.current?.resize());
  };

  if (loading && !data) {
    return <div className="flex min-h-screen items-center justify-center bg-[#0B0F14] text-slate-100">Loading charging workspace...</div>;
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B0F14] p-6 text-slate-100">
        <div className="max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
          <AlertCircle className="mx-auto mb-4 text-rose-300" size={28} />
          <p className="text-lg font-semibold text-white">Dashboard unavailable</p>
          <p className="mt-2 text-sm text-slate-400">{error || 'The EV workspace could not be loaded.'}</p>
          <button
            onClick={() => void fetchDashboard()}
            className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F14] text-slate-100">
      <div
        className="pointer-events-none fixed inset-0 opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(circle at 12% 16%, rgba(56,189,248,0.14), transparent 28%), radial-gradient(circle at 82% 14%, rgba(16,185,129,0.12), transparent 22%), linear-gradient(180deg, rgba(148,163,184,0.05), transparent 58%)',
        }}
      />

      <header className="sticky top-0 z-40 border-b border-white/8 bg-[#0B0F14]/88 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-300/25 bg-cyan-300/10 text-cyan-200">
              <BatteryCharging size={18} />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.26em] text-cyan-200/70">EV Owner</p>
              <h1 className="text-lg font-semibold text-white">Charging Intelligence</h1>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">
              <Home size={14} />
              Home
            </Link>
            <button onClick={() => void logout()} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">
              <LogOut size={14} />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="border-b border-white/8 bg-white/[0.02]">
        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-2 sm:px-6">
          {WORKSPACES.map((item) => (
            <button
              key={item.id}
              onClick={() => setWorkspace(item.id)}
              className={`rounded-lg px-3 py-1.5 text-xs transition ${
                workspace === item.id
                  ? 'border border-cyan-400/30 bg-cyan-400/10 text-cyan-200'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-4 sm:px-6">
        <div className="grid items-start gap-4 lg:grid-cols-[1.18fr_0.82fr]">
          <section ref={mapShellRef} className="overflow-hidden rounded-[28px] border border-white/10 bg-white/5 backdrop-blur-xl">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/8 px-5 py-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.26em] text-slate-400">
                  {shouldShowMap ? 'Live Charging Map' : `${WORKSPACES.find((item) => item.id === workspace)?.label} Workspace`}
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  {shouldShowMap
                    ? selectedStation ? selectedStation.name : 'Best station nearby'
                    : workspace === 'history' ? 'Charging activity and exports'
                    : workspace === 'saved' ? 'Saved stations, routes, and windows'
                    : workspace === 'alerts' ? 'Queue, price, and grid alerts'
                    : workspace === 'wallet' ? 'Wallet balance and transactions'
                    : 'Charging preferences'}
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                  {shouldShowMap && data.route
                    ? `${data.route.distance_km.toFixed(1)} km route, ${data.route.duration_minutes} min drive, ${Math.round(selectedStation?.wait_time || 0)} min queue`
                    : shouldShowMap
                      ? 'Select a station to load route guidance'
                      : 'This tab uses focused controls instead of repeating the map.'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => void fetchDashboard()} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">
                  Refresh
                </button>
                {shouldShowMap && (
                  <button onClick={() => void toggleFullscreen()} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">
                    <Expand size={14} />
                    Fullscreen
                  </button>
                )}
              </div>
            </div>

            {shouldShowMap ? (
            <div className="relative h-[440px] lg:h-[500px] xl:h-[540px]">
              <Map
                ref={mapRef}
                {...viewState}
                onMove={(event) => setViewState(event.viewState)}
                mapStyle={MAP_STYLE}
                attributionControl={false}
                style={{ width: '100%', height: '100%' }}
              >
                <NavigationControl position="bottom-right" />
                <Marker longitude={routeOrigin.lng} latitude={routeOrigin.lat} anchor="center">
                  <div className="h-4 w-4 rounded-full border-2 border-white bg-cyan-300 shadow-[0_0_18px_rgba(56,189,248,0.45)]" />
                </Marker>

                {data.station_options.map((station) => (
                  <Marker key={station.id} longitude={station.lng} latitude={station.lat} anchor="center">
                    <button
                      onClick={() => {
                        setSelectedStationId(station.id);
                        setSelectedPopupId(station.id);
                        void fetchDashboard(station.id);
                      }}
                      className="h-5 w-5 rounded-full border-2 border-white shadow-lg transition hover:scale-110"
                      style={{ backgroundColor: station.status === 'GREEN' ? '#34d399' : station.status === 'YELLOW' ? '#f59e0b' : '#fb7185' }}
                      aria-label={`Select ${station.name}`}
                    />
                  </Marker>
                ))}

                {routeGeoJson && (
                  <Source id="route-line" type="geojson" data={routeGeoJson}>
                    <Layer
                      id="route-line-stroke"
                      type="line"
                      paint={{
                        'line-color': '#38bdf8',
                        'line-width': 4,
                        'line-opacity': 0.85,
                      }}
                    />
                  </Source>
                )}

                {selectedPopupId && selectedStation && (
                  <Popup
                    longitude={selectedStation.lng}
                    latitude={selectedStation.lat}
                    anchor="top"
                    closeButton={true}
                    closeOnClick={false}
                    onClose={() => setSelectedPopupId(null)}
                    offset={18}
                    className="[&_.maplibregl-popup-content]:rounded-2xl [&_.maplibregl-popup-content]:border [&_.maplibregl-popup-content]:border-white/10 [&_.maplibregl-popup-content]:bg-[#081019] [&_.maplibregl-popup-content]:px-0 [&_.maplibregl-popup-content]:py-0"
                  >
                    <div className="min-w-[260px]">
                      <div className="border-b border-white/8 px-4 py-3">
                        <p className="font-medium text-white">{selectedStation.name}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {selectedStation.distance.toFixed(1)} km • {Math.round(selectedStation.wait_time)} min queue
                        </p>
                      </div>
                      <div className="grid grid-cols-3 gap-0 divide-x divide-white/8 px-4 py-3 text-center text-xs">
                        <div>
                          <p className="text-slate-500">Load</p>
                          <p className="mt-1 font-semibold text-white">{Math.round(selectedStation.load)} kW</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Capacity</p>
                          <p className="mt-1 font-semibold text-white">{Math.round(selectedStation.capacity)} kW</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Status</p>
                          <p className="mt-1 font-semibold text-white">{selectedStation.status}</p>
                        </div>
                      </div>
                    </div>
                  </Popup>
                )}
              </Map>

              {data.service_area_notice && (
                <div className="absolute left-4 top-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100 backdrop-blur-md">
                  {data.service_area_notice}
                </div>
              )}

              {selectedStation && (
                <div className="absolute bottom-4 left-4 right-4 grid gap-3 lg:grid-cols-[1fr_auto]">
                  <div className="rounded-2xl border border-white/10 bg-[#071018]/90 px-4 py-3 backdrop-blur-md">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Current Recommendation</p>
                    <p className="mt-2 text-base font-semibold text-white">{selectedStation.name}</p>
                    <p className="mt-1 text-sm text-slate-400">
                      {data.route ? `${data.route.provider.toUpperCase()} route • ${data.route.duration_minutes} min drive` : 'Route unavailable'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        void performWorkspaceUpdate(
                          'save-station',
                          () => dashboardAPI.saveUserStation(token!, selectedStation.id),
                          setWorkspaceState,
                        )
                      }
                      className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200"
                    >
                      <Heart size={14} />
                      Save
                    </button>
                    <a
                      href={buildDirectionsUrl(selectedStation.lat, selectedStation.lng, routeOrigin)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() =>
                        void performWorkspaceUpdate(
                          'record-navigation',
                          () =>
                            dashboardAPI.recordUserNavigation(token!, {
                              station_id: selectedStation.id,
                              station_name: selectedStation.name,
                              distance_km: data.route?.distance_km || selectedStation.distance,
                              eta_minutes: data.route?.duration_minutes || Math.round(selectedStation.distance * 4),
                            }),
                          setWorkspaceState,
                        )
                      }
                      className="inline-flex items-center gap-2 rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-semibold text-[#081019]"
                    >
                      <Navigation size={14} />
                      Start navigation
                    </a>
                  </div>
                </div>
              )}
            </div>
            ) : (
              <div className="grid min-h-[460px] content-start gap-4 p-5">
                {workspace === 'history' && (
                  <>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl border border-white/8 bg-[#0D131A] p-4">
                        <p className="text-xs text-slate-500">History entries</p>
                        <p className="mt-2 text-2xl font-semibold text-white">{workspaceState?.history?.length || 0}</p>
                      </div>
                      <div className="rounded-2xl border border-white/8 bg-[#0D131A] p-4">
                        <p className="text-xs text-slate-500">Saved routes</p>
                        <p className="mt-2 text-2xl font-semibold text-white">{savedRoutes.length}</p>
                      </div>
                      <div className="rounded-2xl border border-white/8 bg-[#0D131A] p-4">
                        <p className="text-xs text-slate-500">Saved windows</p>
                        <p className="mt-2 text-2xl font-semibold text-white">{savedWindows.length}</p>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-[#0D131A] p-5">
                      <p className="text-sm font-medium text-white">Recent activity</p>
                      <div className="mt-4 space-y-3">
                        {(workspaceState?.history || []).slice(0, 5).map((entry: Record<string, any>) => (
                          <div key={entry.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3">
                            <div>
                              <p className="text-sm font-medium text-white">{entry.station_name || entry.type}</p>
                              <p className="mt-1 text-xs text-slate-500">{entry.created_at ? new Date(entry.created_at).toLocaleString() : 'Saved activity'}</p>
                            </div>
                            <span className="text-xs text-slate-400">{entry.time_label || `${entry.distance_km ?? 0} km`}</span>
                          </div>
                        ))}
                        {(workspaceState?.history || []).length === 0 && <p className="text-sm text-slate-500">No charging activity recorded yet.</p>}
                      </div>
                    </div>
                  </>
                )}

                {workspace === 'saved' && (
                  <div className="grid gap-4 md:grid-cols-3">
                    {[
                      { label: 'Stations', value: savedStations.length, detail: savedStations[0]?.name || 'No station saved yet', icon: MapPin },
                      { label: 'Routes', value: savedRoutes.length, detail: savedRoutes[0]?.station_name || 'No route saved yet', icon: Route },
                      { label: 'Windows', value: savedWindows.length, detail: savedWindows[0]?.time_label || 'No charging window saved yet', icon: Clock3 },
                    ].map((item) => (
                      <div key={item.label} className="rounded-2xl border border-white/8 bg-[#0D131A] p-5">
                        <item.icon size={18} className="text-cyan-300" />
                        <p className="mt-4 text-xs uppercase tracking-[0.18em] text-slate-500">{item.label}</p>
                        <p className="mt-2 text-3xl font-semibold text-white">{item.value}</p>
                        <p className="mt-3 text-sm leading-6 text-slate-400">{item.detail}</p>
                      </div>
                    ))}
                  </div>
                )}

                {workspace === 'alerts' && (
                  <div className="grid gap-4">
                    <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-5">
                      <div className="flex items-center gap-3">
                        <Bell size={18} className="text-amber-200" />
                        <p className="text-lg font-semibold text-white">{activeAlerts.length} active alerts</p>
                      </div>
                      <p className="mt-2 text-sm text-amber-100/80">Unread and dismissed states are managed from the controls on the right.</p>
                    </div>
                    <div className="grid gap-3">
                      {activeAlerts.slice(0, 4).map((alert) => (
                        <div key={alert.id} className="rounded-2xl border border-white/8 bg-[#0D131A] p-4">
                          <p className="font-medium text-white">{alert.title}</p>
                          <p className="mt-1 text-sm text-slate-400">{alert.message}</p>
                        </div>
                      ))}
                      {activeAlerts.length === 0 && <p className="rounded-2xl border border-white/8 bg-[#0D131A] p-4 text-sm text-slate-500">No active alerts.</p>}
                    </div>
                  </div>
                )}

                {workspace === 'wallet' && (
                  <div className="grid gap-4 md:grid-cols-[1fr_1.2fr]">
                    <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-5">
                      <Wallet size={20} className="text-emerald-200" />
                      <p className="mt-5 text-sm text-emerald-100/75">Available balance</p>
                      <p className="mt-2 text-4xl font-semibold text-white">₹{workspaceState?.wallet?.balance_inr?.toFixed(0) || '0'}</p>
                      <p className="mt-3 text-sm text-emerald-100/75">Monthly savings: ₹{workspaceState?.wallet?.monthly_savings_inr?.toFixed(0) || '0'}</p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-[#0D131A] p-5">
                      <p className="text-sm font-medium text-white">Recent transactions</p>
                      <div className="mt-4 space-y-3">
                        {(workspaceState?.wallet?.transactions || []).slice(0, 5).map((transaction: Record<string, any>) => (
                          <div key={transaction.id} className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm">
                            <span className="text-slate-200">{transaction.type}</span>
                            <span className="font-semibold text-white">₹{transaction.amount_inr}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {workspace === 'settings' && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-white/8 bg-[#0D131A] p-5">
                      <p className="text-sm font-medium text-white">Notification controls</p>
                      <p className="mt-2 text-sm leading-6 text-slate-400">Tune alert delivery, queue notices, and privacy mode from the settings panel.</p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-[#0D131A] p-5">
                      <p className="text-sm font-medium text-white">Preferred charging speed</p>
                      <p className="mt-2 text-2xl font-semibold text-cyan-200">{workspaceState?.settings?.preferred_speed || 'fast'}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          <aside className="space-y-4 lg:sticky lg:top-28">
            {workspace === 'charge' && (
              <>
                <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                  <p className="text-[11px] uppercase tracking-[0.26em] text-slate-400">Charge Now Engine</p>
                  <div className="mt-4 grid gap-3">
                    {[
                      chargeNow?.best_station_right_now && {
                        label: 'Best right now',
                        value: chargeNow.best_station_right_now.station_name,
                        detail: chargeNow.best_station_right_now.why,
                      },
                      chargeNow?.cheapest_option && {
                        label: 'Cheapest',
                        value:
                          chargeNow.cheapest_option.type === 'home'
                            ? 'Charge at home'
                            : chargeNow.cheapest_option.station_name,
                        detail: chargeNow.cheapest_option.why,
                      },
                      chargeNow?.fastest_option && {
                        label: 'Fastest',
                        value: `${chargeNow.fastest_option.station_name} • ${chargeNow.fastest_option.estimated_total_minutes} min`,
                        detail: chargeNow.fastest_option.why,
                      },
                      chargeNow?.lowest_congestion_option && {
                        label: 'Least congested',
                        value: chargeNow.lowest_congestion_option.station_name,
                        detail: chargeNow.lowest_congestion_option.why,
                      },
                    ]
                      .filter(Boolean)
                      .map((item) => (
                        <div key={item!.label} className="rounded-2xl border border-white/8 bg-[#0D131A] p-4">
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{item!.label}</p>
                          <p className="mt-2 font-semibold text-white">{item!.value}</p>
                          <p className="mt-2 text-sm leading-6 text-slate-400">{item!.detail}</p>
                        </div>
                      ))}
                  </div>
                </section>

                <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                  <p className="text-[11px] uppercase tracking-[0.26em] text-slate-400">Top Stations</p>
                  <div className="mt-4 grid gap-3">
                    {(data.alternatives || []).slice(0, 3).map((option) => (
                      <button
                        key={option.id}
                        onClick={() => {
                          setSelectedStationId(option.id);
                          void fetchDashboard(option.id);
                        }}
                        className={`rounded-3xl border p-4 text-left transition ${
                          selectedStationId === option.id
                            ? 'border-cyan-300/30 bg-cyan-300/10'
                            : 'border-white/8 bg-[#0D131A] hover:border-white/16'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-white">{option.name}</p>
                            <p className="mt-2 text-sm text-slate-400">{option.reason}</p>
                          </div>
                          <span className={`rounded-full border px-2 py-1 text-[11px] uppercase tracking-[0.18em] ${statusTone(option.status)}`}>
                            {option.status}
                          </span>
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                          <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2 text-slate-300">
                            <p className="text-slate-500">Distance</p>
                            <p className="mt-1 font-semibold text-white">{option.distance_km.toFixed(1)} km</p>
                          </div>
                          <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2 text-slate-300">
                            <p className="text-slate-500">Queue</p>
                            <p className="mt-1 font-semibold text-white">{option.wait_time_minutes} min</p>
                          </div>
                          <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2 text-slate-300">
                            <p className="text-slate-500">Total</p>
                            <p className="mt-1 font-semibold text-cyan-200">{option.estimated_total_minutes} min</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              </>
            )}

            {workspace === 'route' && (
              <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                <p className="text-[11px] uppercase tracking-[0.26em] text-slate-400">Route Planner</p>
                <div className="mt-4 grid gap-3">
                  <label className="text-sm text-slate-300">
                    Destination
                    <input
                      value={destination}
                      onChange={(event) => setDestination(event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-white/8 bg-[#0D131A] px-4 py-3 text-white outline-none"
                    />
                  </label>
                  <label className="text-sm text-slate-300">
                    Current battery %
                    <input
                      value={batteryPercent}
                      onChange={(event) => setBatteryPercent(Number(event.target.value))}
                      type="range"
                      min={10}
                      max={90}
                      className="mt-2 w-full"
                    />
                    <div className="mt-1 text-xs text-slate-500">{batteryPercent}% remaining</div>
                  </label>
                  <button
                    onClick={() => void fetchDashboard(null)}
                    className="rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-semibold text-[#081019]"
                  >
                    Recalculate route
                  </button>
                </div>

                <div className="mt-5 space-y-3">
                  {data.route_planner.route_options.map((option) => (
                    <div key={option.station_id} className="rounded-2xl border border-white/8 bg-[#0D131A] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium text-white">{option.station_name}</p>
                          <p className="mt-1 text-sm text-slate-400">{option.why}</p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedStationId(option.station_id);
                            void fetchDashboard(option.station_id);
                          }}
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200"
                        >
                          Focus
                        </button>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                        <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2">
                          <p className="text-slate-500">ETA</p>
                          <p className="mt-1 font-semibold text-white">{option.eta_minutes} min</p>
                        </div>
                        <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2">
                          <p className="text-slate-500">Queue at arrival</p>
                          <p className="mt-1 font-semibold text-white">{option.queue_at_arrival_minutes} min</p>
                        </div>
                        <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2">
                          <p className="text-slate-500">Stop total</p>
                          <p className="mt-1 font-semibold text-cyan-200">{option.total_stop_minutes} min</p>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          void performWorkspaceUpdate(
                            'save-route',
                            () =>
                              dashboardAPI.saveUserRoute(token!, {
                                station_id: option.station_id,
                                station_name: option.station_name,
                                distance_km: data.route?.distance_km || 0,
                                eta_minutes: option.eta_minutes,
                              }),
                            setWorkspaceState,
                          )
                        }
                        className="mt-3 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300"
                      >
                        <Route size={12} />
                        Save route
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {workspace === 'smart' && (
              <>
                <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                  <p className="text-[11px] uppercase tracking-[0.26em] text-slate-400">Smart Charging</p>
                  <div className="mt-4 rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                    <p className="text-base font-semibold text-white">{bestWindow?.headline || 'No optimal window found yet'}</p>
                    <p className="mt-2 text-sm text-emerald-100/85">{bestWindow?.reason}</p>
                    <p className="mt-2 text-sm text-emerald-100/75">{bestWindow?.impact}</p>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-white/8 bg-[#0D131A] p-4">
                      <p className="text-xs text-slate-500">Projected savings</p>
                      <p className="mt-2 text-lg font-semibold text-white">₹{Math.round(data.decision_support.public_cost_inr - (data.decision_support.home_cost_inr || data.decision_support.public_cost_inr - 40))}</p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-[#0D131A] p-4">
                      <p className="text-xs text-slate-500">Queue reduction</p>
                      <p className="mt-2 text-lg font-semibold text-white">{data.decision_support.queue_time_savings_minutes} min</p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-[#0D131A] p-4">
                      <p className="text-xs text-slate-500">Grid impact</p>
                      <p className="mt-2 text-lg font-semibold text-white">{data.decision_support.congestion_reduction_percent}% lower congestion</p>
                    </div>
                  </div>
                  {bestWindow && (
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() =>
                          void performWorkspaceUpdate(
                            'save-window',
                            () =>
                              dashboardAPI.saveChargingWindow(token!, {
                                time_label: bestWindow.time_label,
                                predicted_demand: bestWindow.predicted_demand,
                                headline: bestWindow.headline,
                              }),
                            setWorkspaceState,
                          )
                        }
                        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200"
                      >
                        <Heart size={14} />
                        Save window
                      </button>
                      <button
                        onClick={() =>
                          void performWorkspaceUpdate(
                            'schedule',
                            () =>
                              dashboardAPI.scheduleUserCharge(token!, {
                                station_name: selectedStation?.name || data.nearest_station?.name || 'Nearest station',
                                time_label: bestWindow.time_label,
                                estimated_cost_inr: data.decision_support.public_cost_inr,
                                energy_kwh: data.decision_support.target_energy_kwh,
                              }),
                            setWorkspaceState,
                          )
                        }
                        className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-sm font-semibold text-[#081019]"
                      >
                        <Clock3 size={14} />
                        Schedule charging
                      </button>
                    </div>
                  )}
                </section>

                {forecast && (
                  <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                    <p className="text-[11px] uppercase tracking-[0.26em] text-slate-400">Demand Window</p>
                    <div className="mt-4 h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={forecast.forecasts}>
                          <defs>
                            <linearGradient id="smartFill" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#34d399" stopOpacity={0.35} />
                              <stop offset="100%" stopColor="#34d399" stopOpacity={0.02} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid vertical={false} stroke="rgba(148,163,184,0.12)" />
                          <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                          <Tooltip
                            contentStyle={{ background: '#091019', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16 }}
                            formatter={(value: number) => [`${Math.round(value)} kW`, 'Predicted demand']}
                          />
                          {bestWindow && <ReferenceLine x={bestWindow.time_label.replace(' ', ':00 ')} stroke="#38bdf8" strokeDasharray="3 3" />}
                          <Area type="monotone" dataKey="predicted_demand" stroke="#34d399" strokeWidth={2.4} fill="url(#smartFill)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </section>
                )}
              </>
            )}

            {workspace === 'history' && (
              <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.26em] text-slate-400">Session History</p>
                    <h3 className="mt-2 text-lg font-semibold text-white">Your saved operational activity</h3>
                  </div>
                  <button
                    onClick={() => downloadCsv('gridsense-user-history.csv', workspaceState?.history || [])}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200"
                  >
                    <Download size={14} />
                    CSV
                  </button>
                </div>
                <div className="mt-4 space-y-3">
                  {(workspaceState?.history || []).length === 0 ? (
                    <div className="rounded-2xl border border-white/8 bg-[#0D131A] p-4 text-sm text-slate-400">
                      No saved charging activity yet. Use navigation, route save, or charging schedule actions to build real history.
                    </div>
                  ) : (
                    workspaceState?.history.map((entry: Record<string, any>) => (
                      <div key={entry.id} className="rounded-2xl border border-white/8 bg-[#0D131A] p-4">
                        <p className="font-medium text-white">{entry.station_name || entry.type}</p>
                        <p className="mt-1 text-sm text-slate-400">{entry.time_label || `${entry.distance_km ?? 0} km route`}</p>
                        <p className="mt-2 text-xs text-slate-500">{new Date(entry.created_at).toLocaleString()}</p>
                      </div>
                    ))
                  )}
                </div>
              </section>
            )}

            {workspace === 'saved' && (
              <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                <p className="text-[11px] uppercase tracking-[0.26em] text-slate-400">Saved Items</p>
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-sm font-medium text-white">Stations</p>
                    <div className="mt-2 space-y-2">
                      {savedStations.length === 0 ? (
                        <p className="text-sm text-slate-500">No saved stations yet.</p>
                      ) : (
                        savedStations.map((station) => (
                          <div key={station.id} className="rounded-2xl border border-white/8 bg-[#0D131A] p-4">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="font-medium text-white">{station.name}</p>
                                <p className="mt-1 text-sm text-slate-400">{station.operator}</p>
                              </div>
                              <button
                                onClick={() =>
                                  void performWorkspaceUpdate('unsave-station', () => dashboardAPI.unsaveUserStation(token!, station.id), setWorkspaceState)
                                }
                                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-white">Routes</p>
                    <div className="mt-2 space-y-2">
                      {savedRoutes.length === 0 ? <p className="text-sm text-slate-500">No saved routes yet.</p> : savedRoutes.map((route) => (
                        <div key={route.saved_at} className="rounded-2xl border border-white/8 bg-[#0D131A] p-4">
                          <p className="font-medium text-white">{route.station_name}</p>
                          <p className="mt-1 text-sm text-slate-400">{route.distance_km} km • {route.eta_minutes} min ETA</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-white">Favorite windows</p>
                    <div className="mt-2 space-y-2">
                      {savedWindows.length === 0 ? <p className="text-sm text-slate-500">No saved windows yet.</p> : savedWindows.map((window) => (
                        <div key={window.time_label} className="rounded-2xl border border-white/8 bg-[#0D131A] p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-medium text-white">{window.time_label}</p>
                              <p className="mt-1 text-sm text-slate-400">{window.headline}</p>
                            </div>
                            <button
                              onClick={() =>
                                void performWorkspaceUpdate(
                                  'remove-window',
                                  () => dashboardAPI.removeChargingWindow(token!, {
                                    time_label: String(window.time_label),
                                    predicted_demand: Number(window.predicted_demand || 0),
                                    headline: String(window.headline || ''),
                                  }),
                                  setWorkspaceState,
                                )
                              }
                              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {workspace === 'alerts' && (
              <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                <p className="text-[11px] uppercase tracking-[0.26em] text-slate-400">Alerts</p>
                <div className="mt-4 space-y-3">
                  {activeAlerts.map((alert) => (
                    <div key={alert.id} className="rounded-2xl border border-white/8 bg-[#0D131A] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-white">{alert.title}</p>
                          <p className="mt-1 text-sm text-slate-400">{alert.message}</p>
                          <p className="mt-2 text-xs text-slate-500">{new Date(alert.created_at).toLocaleString()}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              void performWorkspaceUpdate(
                                'read-alert',
                                () => dashboardAPI.updateUserAlert(token!, { alert_id: alert.id, read: true }),
                                setWorkspaceState,
                              )
                            }
                            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200"
                          >
                            Mark read
                          </button>
                          <button
                            onClick={() =>
                              void performWorkspaceUpdate(
                                'dismiss-alert',
                                () => dashboardAPI.updateUserAlert(token!, { alert_id: alert.id, dismissed: true }),
                                setWorkspaceState,
                              )
                            }
                            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {workspace === 'wallet' && (
              <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                <p className="text-[11px] uppercase tracking-[0.26em] text-slate-400">Wallet</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/8 bg-[#0D131A] p-4">
                    <p className="text-xs text-slate-500">Balance</p>
                    <p className="mt-2 text-2xl font-semibold text-white">₹{workspaceState?.wallet?.balance_inr?.toFixed(0) || '0'}</p>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-[#0D131A] p-4">
                    <p className="text-xs text-slate-500">Monthly savings</p>
                    <p className="mt-2 text-2xl font-semibold text-white">₹{workspaceState?.wallet?.monthly_savings_inr?.toFixed(0) || '0'}</p>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  {[250, 500, 1000].map((amount) => (
                    <button
                      key={amount}
                      onClick={() =>
                        void performWorkspaceUpdate('recharge-wallet', () => dashboardAPI.rechargeUserWallet(token!, amount), setWorkspaceState)
                      }
                      className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200"
                    >
                      <Coins size={14} />
                      Add ₹{amount}
                    </button>
                  ))}
                </div>
                <div className="mt-4 space-y-2">
                  {(workspaceState?.wallet?.transactions || []).map((transaction: Record<string, any>) => (
                    <div key={transaction.id} className="rounded-2xl border border-white/8 bg-[#0D131A] p-4">
                      <p className="font-medium text-white">{transaction.type}</p>
                      <p className="mt-1 text-sm text-slate-400">₹{transaction.amount_inr}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {workspace === 'settings' && workspaceState && (
              <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                <p className="text-[11px] uppercase tracking-[0.26em] text-slate-400">Settings</p>
                <div className="mt-4 space-y-3">
                  {[
                    { key: 'notification_enabled', label: 'Enable notifications' },
                    { key: 'queue_alerts', label: 'Queue alerts' },
                    { key: 'price_alerts', label: 'Price alerts' },
                    { key: 'privacy_mode', label: 'Privacy mode' },
                  ].map((item) => (
                    <label key={item.key} className="flex items-center justify-between rounded-2xl border border-white/8 bg-[#0D131A] px-4 py-3 text-sm text-slate-200">
                      <span>{item.label}</span>
                      <input
                        type="checkbox"
                        checked={Boolean(workspaceState?.settings?.[item.key as keyof typeof workspaceState.settings])}
                        onChange={(event) =>
                          void performWorkspaceUpdate(
                            'update-settings',
                            () => dashboardAPI.updateUserSettings(token!, { [item.key]: event.target.checked }),
                            setWorkspaceState,
                          )
                        }
                      />
                    </label>
                  ))}
                  <label className="block text-sm text-slate-300">
                    Preferred charging speed
                    <select
                      value={workspaceState.settings?.preferred_speed || 'fast'}
                      onChange={(event) =>
                        void performWorkspaceUpdate(
                          'update-settings',
                          () => dashboardAPI.updateUserSettings(token!, { preferred_speed: event.target.value }),
                          setWorkspaceState,
                        )
                      }
                      className="mt-2 w-full rounded-2xl border border-white/8 bg-[#0D131A] px-4 py-3 text-white"
                    >
                      <option value="slow">Slow</option>
                      <option value="fast">Fast</option>
                      <option value="rapid">Rapid</option>
                    </select>
                  </label>
                </div>
              </section>
            )}

            <section className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
              <p className="text-[11px] uppercase tracking-[0.26em] text-slate-400">Current Session</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/8 bg-[#0D131A] p-4">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Route size={15} className="text-cyan-300" />
                    <span className="text-sm">Route</span>
                  </div>
                  <p className="mt-2 text-xl font-semibold text-white">{data.route ? `${data.route.distance_km.toFixed(1)} km` : '--'}</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-[#0D131A] p-4">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Wallet size={15} className="text-emerald-300" />
                    <span className="text-sm">Cost</span>
                  </div>
                  <p className="mt-2 text-xl font-semibold text-white">₹{Math.round(data.decision_support.public_cost_inr)}</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-[#0D131A] p-4">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Zap size={15} className="text-cyan-300" />
                    <span className="text-sm">Energy</span>
                  </div>
                  <p className="mt-2 text-xl font-semibold text-white">{Math.round(data.decision_support.target_energy_kwh)} kWh</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-[#0D131A] p-4">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Bell size={15} className="text-emerald-300" />
                    <span className="text-sm">Confidence</span>
                  </div>
                  <p className="mt-2 text-xl font-semibold text-white">{data.load_context?.explanation?.confidence || 'N/A'}</p>
                </div>
              </div>
            </section>

            {(error || actionPending) && (
              <section className={`rounded-2xl border px-4 py-3 text-sm ${error ? 'border-rose-400/20 bg-rose-400/10 text-rose-100' : 'border-cyan-400/20 bg-cyan-400/10 text-cyan-100'}`}>
                {error || `Working on ${actionPending}...`}
              </section>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
