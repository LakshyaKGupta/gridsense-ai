import { useEffect, useMemo, useState, startTransition } from 'react';
import { BatteryCharging, Clock3, IndianRupee, LogOut, MapPin, Navigation, Route, ShieldCheck, Zap } from 'lucide-react';
import Map, { Layer, Marker, NavigationControl, Source } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Link } from 'react-router-dom';
import type { FeatureCollection, LineString } from 'geojson';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI, UserDashboardPayload } from '../services/api';

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
const DEFAULT_LOCATION = { lat: 12.9716, lng: 77.5946 };

function statusTone(status: 'GREEN' | 'YELLOW' | 'RED') {
  if (status === 'RED') return 'text-rose-300';
  if (status === 'YELLOW') return 'text-amber-300';
  return 'text-emerald-300';
}

function statusBadge(status: 'GREEN' | 'YELLOW' | 'RED') {
  if (status === 'RED') return 'border-rose-400/20 bg-rose-400/10 text-rose-200';
  if (status === 'YELLOW') return 'border-amber-400/20 bg-amber-400/10 text-amber-200';
  return 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200';
}

export default function UserDashboard() {
  const { token, logout, profile } = useAuth();
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [panel, setPanel] = useState<'stations' | 'strategy' | 'compare'>('stations');
  const [data, setData] = useState<UserDashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStationId, setSelectedStationId] = useState<number | null>(null);
  const [viewState, setViewState] = useState({ longitude: DEFAULT_LOCATION.lng, latitude: DEFAULT_LOCATION.lat, zoom: 11.5 });

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        startTransition(() => {
          setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
          setViewState((current) => ({
            ...current,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            zoom: 12.2,
          }));
        });
      },
      () => undefined,
      { enableHighAccuracy: true, timeout: 6000 },
    );
  }, []);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    const userData = profile?.user_data;

    setLoading(true);
    setError(null);
    dashboardAPI.getUserDashboard(token, {
      lat: location.lat,
      lng: location.lng,
      selected_station_id: selectedStationId,
      vehicle_model: userData?.vehicleModel,
      battery_capacity_kwh: userData?.batteryCapacityKwh,
      home_charging_access: userData?.homeChargingAccess,
      typical_charging_time: userData?.typicalChargingTime,
    })
      .then((payload) => {
        if (cancelled) return;
        startTransition(() => {
          const nearestStation = payload.nearest_station;
          const focusStation = payload.selected_station || nearestStation;
          setData(payload);
          setSelectedStationId((current) => current ?? nearestStation?.id ?? null);
          if (focusStation) {
            setViewState((current) => ({
              ...current,
              latitude: focusStation.lat,
              longitude: focusStation.lng,
            }));
          }
        });
      })
      .catch((fetchError) => {
        if (cancelled) return;
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to load EV dashboard.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token, profile, location.lat, location.lng, selectedStationId]);

  const selectedStation = useMemo(() => {
    if (!data) return null;
    return data.station_options.find((station) => station.id === selectedStationId) || data.selected_station || data.nearest_station;
  }, [data, selectedStationId]);

  if (loading && !data) {
    return <div className="min-h-screen bg-[#0B0F14] text-slate-200 flex items-center justify-center">Loading EV utility workspace...</div>;
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#0B0F14] text-slate-200 flex items-center justify-center p-6">
        <div className="max-w-lg rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
          <MapPin className="mx-auto mb-4 text-cyan-300" size={28} />
          <p className="text-lg font-semibold text-white">EV dashboard unavailable</p>
          <p className="mt-2 text-sm text-slate-400">{error || 'Backend route and station data could not be loaded.'}</p>
        </div>
      </div>
    );
  }

  const routeGeoJson: FeatureCollection<LineString> | null = data.route ? {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: data.route.geometry.coordinates,
      },
      properties: {},
    }],
  } : null;
  const routeOrigin = data.effective_location || location;

  return (
    <div className="min-h-screen bg-[#0B0F14] text-slate-100">
      <div
        className="fixed inset-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 18% 16%, rgba(56,189,248,0.14), transparent 30%), radial-gradient(circle at 82% 14%, rgba(16,185,129,0.12), transparent 24%), linear-gradient(180deg, rgba(148,163,184,0.05), transparent 62%)',
        }}
      />

      <header className="sticky top-0 z-40 border-b border-white/8 bg-[#0B0F14]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-300/30 bg-cyan-300/10 text-cyan-200">
              <BatteryCharging size={18} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/70">EV Owner</p>
              <h1 className="text-xl font-semibold text-white">Charging Navigation and Timing Console</h1>
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
        <section className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Decision Guidance</p>
                <h2 className="mt-2 text-3xl font-semibold text-white">Pick the lowest-friction charger and move the session out of peak load.</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
                  Recommendations are generated from backend station status, route distance, queue pressure, and the XGBoost demand forecast for your current zone.
                </p>
              </div>
              <div className={`rounded-2xl border px-4 py-3 text-right ${selectedStation ? statusBadge(selectedStation.status) : 'border-white/10 bg-white/5 text-slate-300'}`}>
                <p className="text-xs uppercase tracking-[0.24em]">Selected Station</p>
                <p className="mt-1 text-lg font-semibold text-white">{selectedStation?.name || 'Unavailable'}</p>
              </div>
            </div>

            {data.charging_recommendation && (
              <div className="mt-6 rounded-[24px] border border-cyan-300/20 bg-cyan-300/10 p-5">
                <p className="text-sm font-semibold text-white">{data.charging_recommendation.headline}</p>
                <p className="mt-3 text-sm text-slate-200">{data.charging_recommendation.reason}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.24em] text-cyan-200/80">
                  <span>{data.charging_recommendation.confidence}</span>
                  <span className="text-slate-400">{data.charging_recommendation.impact}</span>
                </div>
              </div>
            )}

            {data.service_area_notice && (
              <div className="mt-4 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
                {data.service_area_notice}
              </div>
            )}
          </div>

          <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-white/8 to-white/3 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Session Economics</p>
            <div className="mt-6 grid gap-4">
              <div className="rounded-2xl border border-white/8 bg-[#0E141C] p-4">
                <p className="text-sm text-slate-400">Target Energy</p>
                <p className="mt-1 text-3xl font-semibold text-white">{data.decision_support.target_energy_kwh} kWh</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-white/8 bg-[#0E141C] p-4">
                  <p className="text-sm text-slate-400">Public Cost</p>
                  <p className="mt-1 text-2xl font-semibold text-cyan-300">INR {data.decision_support.public_cost_inr}</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-[#0E141C] p-4">
                  <p className="text-sm text-slate-400">Session Time</p>
                  <p className="mt-1 text-2xl font-semibold text-emerald-300">{data.decision_support.estimated_session_minutes} min</p>
                </div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-[#0E141C] p-4 text-sm text-slate-300">
                <p>{data.load_context.explanation.reason}</p>
                <p className="mt-2 text-slate-400">{data.load_context.explanation.impact}</p>
                <p className="mt-2 text-slate-500">{data.load_context.explanation.confidence}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          {[
            { label: 'Best Time to Charge', value: data.charging_recommendation?.time_label || 'N/A', icon: Clock3, tone: 'text-cyan-300' },
            { label: 'Route Duration', value: data.route ? `${data.route.duration_minutes} min` : 'N/A', icon: Route, tone: 'text-emerald-300' },
            { label: 'Wait Saved', value: `${data.decision_support.queue_time_savings_minutes} min`, icon: ShieldCheck, tone: 'text-cyan-300' },
            { label: 'Public vs Home', value: data.decision_support.savings_vs_home_inr != null ? `+INR ${data.decision_support.savings_vs_home_inr}` : 'No home charger', icon: IndianRupee, tone: 'text-emerald-300' },
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

        <section className="grid gap-5 xl:grid-cols-[1.22fr_0.78fr]">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Station Map</p>
                <h3 className="mt-2 text-xl font-semibold text-white">Live route and station availability</h3>
              </div>
              <Navigation size={18} className="text-cyan-300" />
            </div>
            <div className="mt-4 rounded-2xl border border-white/8 bg-[#0D131A] p-4 text-sm text-slate-300">
              The highlighted route always reflects the active station choice. Use the comparison list to switch between the fastest and the most cost-efficient stop.
            </div>
            <div className="mt-4 h-[420px] overflow-hidden rounded-[22px] border border-white/8">
              <Map
                {...viewState}
                onMove={(event) => setViewState(event.viewState)}
                mapStyle={MAP_STYLE}
                attributionControl={false}
                style={{ width: '100%', height: '100%' }}
              >
                <NavigationControl position="bottom-right" />
                <Marker longitude={routeOrigin.lng} latitude={routeOrigin.lat} anchor="center">
                  <div className="h-4 w-4 rounded-full border-2 border-white bg-cyan-300 shadow-[0_0_16px_rgba(56,189,248,0.45)]" />
                </Marker>
                {data.station_options.map((station) => {
                  const tone = station.status === 'RED' ? '#fb7185' : station.status === 'YELLOW' ? '#fbbf24' : '#34d399';
                  return (
                    <Marker key={station.id} longitude={station.lng} latitude={station.lat} anchor="center">
                      <button
                        onClick={() => setSelectedStationId(station.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-xl border-2 border-white text-white"
                        style={{ backgroundColor: tone, transform: selectedStationId === station.id ? 'scale(1.08)' : 'scale(1)' }}
                        aria-label={`Select ${station.name}`}
                      >
                        <Zap size={13} />
                      </button>
                    </Marker>
                  );
                })}
                {routeGeoJson && (
                  <Source id="route" type="geojson" data={routeGeoJson}>
                    <Layer
                      id="route-line"
                      type="line"
                      paint={{
                        'line-color': '#38bdf8',
                        'line-width': 4,
                        'line-opacity': 0.75,
                      }}
                    />
                  </Source>
                )}
              </Map>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-slate-400">User Workspace</p>
                <h3 className="mt-2 text-xl font-semibold text-white">Station choice and charging decisions</h3>
              </div>
              <MapPin size={18} className="text-emerald-300" />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { id: 'stations', label: 'Top 3 Stations' },
                { id: 'strategy', label: 'Charge Strategy' },
                { id: 'compare', label: 'Comparison' },
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

            {panel === 'stations' && (
              <div className="mt-5 space-y-3">
                {data.alternatives.slice(0, 3).map((station, index) => (
                  <button
                    key={station.id}
                    onClick={() => setSelectedStationId(station.id)}
                    className={`w-full rounded-3xl border p-4 text-left transition ${
                      selectedStationId === station.id
                        ? 'border-cyan-300/30 bg-cyan-300/10'
                        : 'border-white/8 bg-[#0D131A] hover:border-white/16'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs font-semibold text-slate-300">{index + 1}</span>
                          <p className="font-medium text-white">{station.name}</p>
                          {station.is_best && (
                            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-[11px] uppercase tracking-[0.18em] text-emerald-200">
                              Best Fit
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-sm text-slate-400">{station.operator} • {station.reason}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-cyan-300">{station.distance_km.toFixed(1)} km</p>
                        <p className="mt-2 text-xs text-slate-500">{station.estimated_total_minutes} min total</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {selectedStation && panel === 'stations' && (
              <div className="mt-5 rounded-[24px] border border-white/8 bg-[#0D131A] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-white">{selectedStation.name}</p>
                    <p className="mt-2 text-sm text-slate-400">{selectedStation.zone_name} • {selectedStation.operator || 'EV Operator'}</p>
                  </div>
                  <div className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.18em] ${statusBadge(selectedStation.status)}`}>
                    {selectedStation.status}
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl border border-white/8 bg-white/5 p-3">
                    <p className="text-slate-400">Current Load</p>
                    <p className={`mt-1 font-semibold ${statusTone(selectedStation.status)}`}>{Math.round(selectedStation.load)} / {selectedStation.capacity} kW</p>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-white/5 p-3">
                    <p className="text-slate-400">Queue</p>
                    <p className="mt-1 font-semibold text-white">{Math.round(selectedStation.wait_time)} min</p>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-white/5 p-3">
                    <p className="text-slate-400">Route Provider</p>
                    <p className="mt-1 font-semibold text-white uppercase">{data.decision_support.route_provider}</p>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-white/5 p-3">
                    <p className="text-slate-400">Battery Profile</p>
                    <p className="mt-1 font-semibold text-white">{profile?.user_data?.batteryCapacityKwh ? `${profile.user_data.batteryCapacityKwh} kWh` : 'Not set'}</p>
                  </div>
                </div>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&origin=${routeOrigin.lat},${routeOrigin.lng}&destination=${selectedStation.lat},${selectedStation.lng}&travelmode=driving&dir_action=navigate`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-semibold text-[#081019]"
                >
                  <Navigation size={14} />
                  Open turn-by-turn directions
                </a>
              </div>
            )}

            {panel === 'strategy' && (
              <div className="mt-5 grid gap-4">
                <div className="rounded-2xl border border-white/8 bg-[#0D131A] p-4">
                  <p className="text-sm text-slate-400">Recommended Window</p>
                  <p className="mt-1 text-2xl font-semibold text-white">{data.charging_recommendation?.time_label || 'Unavailable'}</p>
                  <p className="mt-2 text-sm text-slate-400">{data.charging_recommendation?.impact}</p>
                </div>
                <div className="rounded-2xl border border-white/8 bg-[#0D131A] p-4">
                  <p className="text-sm text-slate-400">Home Charging Guidance</p>
                  <p className="mt-1 text-base font-semibold text-white">
                    {data.decision_support.home_charge_recommended ? 'Use home charging for routine top-ups and keep public charging for urgent sessions.' : 'Public charging remains reasonable for this trip profile.'}
                  </p>
                  <p className="mt-2 text-sm text-slate-400">
                    {data.decision_support.home_cost_inr != null
                      ? `Home session estimate: INR ${data.decision_support.home_cost_inr}.`
                      : 'No home charging access saved in your profile.'}
                  </p>
                </div>
              </div>
            )}

            {panel === 'compare' && (
              <div className="mt-5 overflow-hidden rounded-[22px] border border-white/8">
                <table className="min-w-full divide-y divide-white/8 text-sm">
                  <thead className="bg-white/5 text-slate-400">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">Station</th>
                      <th className="px-4 py-3 text-left font-medium">Distance</th>
                      <th className="px-4 py-3 text-left font-medium">Wait</th>
                      <th className="px-4 py-3 text-left font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/8 bg-[#0D131A]">
                    {data.alternatives.slice(0, 3).map((option) => (
                      <tr key={option.id} className={option.is_best ? 'bg-emerald-400/5' : ''}>
                        <td className="px-4 py-3 text-white">{option.name}</td>
                        <td className="px-4 py-3 text-slate-300">{option.distance_km.toFixed(1)} km</td>
                        <td className="px-4 py-3 text-slate-300">{option.wait_time_minutes} min</td>
                        <td className="px-4 py-3 text-slate-300">{option.estimated_total_minutes} min</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
