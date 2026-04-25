import { useState, useEffect, useRef } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ChevronRight,
  LogOut,
  Zap,
  TrendingUp,
  Navigation,
  Crosshair,
  MapPin,
  Globe,
  Target,
  Info
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
import { useAuth } from '../context/AuthContext';
import { useSystemState } from '../context/SystemStateContext';
import { Link } from 'react-router-dom';

import Map, { Marker, Source, Layer, NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import AssistantPanel from '../components/ui/AssistantPanel';

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

const BENGALURU_CENTER = { lat: 12.97, lng: 77.59 };

const INDIAN_CITIES = [
  { name: 'Bengaluru', lat: 12.97, lng: 77.59, state: 'Karnataka' },
  { name: 'Delhi', lat: 28.61, lng: 77.23, state: 'Delhi' },
  { name: 'Mumbai', lat: 19.08, lng: 72.88, state: 'Maharashtra' },
  { name: 'Hyderabad', lat: 17.39, lng: 78.49, state: 'Telangana' },
  { name: 'Chennai', lat: 13.08, lng: 80.27, state: 'Tamil Nadu' },
  { name: 'Kolkata', lat: 22.57, lng: 88.36, state: 'West Bengal' },
  { name: 'Pune', lat: 18.52, lng: 73.86, state: 'Maharashtra' },
  { name: 'Ahmedabad', lat: 23.03, lng: 72.58, state: 'Gujarat' },
];

const BENGALURU_ZONES = [
  { id: 1, name: 'Indiranagar', lat: 12.9784, lng: 77.6408 },
  { id: 2, name: 'Koramangala', lat: 12.9279, lng: 77.6271 },
  { id: 3, name: 'Whitefield', lat: 12.9698, lng: 77.7499 },
  { id: 4, name: 'Electronic City', lat: 12.8399, lng: 77.6770 },
  { id: 5, name: 'Jayanagar', lat: 12.9299, lng: 77.5826 },
];

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`,
      { headers: { 'User-Agent': 'GridSense/1.0' } }
    );
    const data = await response.json();
    const address = data.address;
    
    // Check for Indian cities
    if (address.city) return address.city;
    if (address.town) return address.town;
    if (address.village) return address.village;
    if (address.county) return address.county;
    if (address.state) return address.state;
    
    return data.display_name?.split(',')[0] || 'Unknown';
  } catch {
    // Fallback: find closest city
    let closestCity = 'Unknown';
    let minDist = Infinity;
    for (const city of INDIAN_CITIES) {
      const dist = haversineDistance(lat, lng, city.lat, city.lng);
      if (dist < minDist) {
        minDist = dist;
        closestCity = city.name;
      }
    }
    return minDist < 300 ? closestCity : 'India';
  }
}

function KPICard({ title, value, hint, trend, upIsGood = false }: any) {
  const isUp = trend > 0;
  const isGood = isUp === upIsGood;
  const trendColor = isGood ? 'text-emerald-400' : 'text-rose-400';
  
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-md transition-all hover:border-slate-700 hover:bg-slate-800/50 group">
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-cyan-500/5 blur-[40px]" />
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
  const { logout } = useAuth();
  const systemState = useSystemState();
  const mapRef = useRef<any>(null);
  
  const [selectedZoneId, setSelectedZoneId] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'insights'|'impact'|'planning'>('insights');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [detectedCity, setDetectedCity] = useState<string>('Detecting...');
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const [selectedStation, setSelectedStation] = useState<any>(null);
  const [routeGeometry, setRouteGeometry] = useState<any>(null);
  const [notification, setNotification] = useState<{message: string; type: 'info' | 'success'} | null>(null);
  const [viewState, setViewState] = useState({
    longitude: BENGALURU_CENTER.lng,
    latitude: BENGALURU_CENTER.lat,
    zoom: 11
  });

  const zones = systemState.zones;
  const stations = systemState.stations;
  const demand = systemState.demand;
  const alerts = systemState.alerts;

// Auto-detect location on mount
  useEffect(() => {
    const detectLocation = async () => {
      if (!navigator.geolocation) {
        setNotification({ message: 'Location unavailable. Showing Bengaluru Demo.', type: 'info' });
        setDetectedCity('Bengaluru');
        setUserLocation(BENGALURU_CENTER);
        setTimeout(() => setNotification(null), 5000);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setUserLocation({ lat, lng });
          
          try {
            const cityName = await reverseGeocode(lat, lng);
            const distToBengaluru = haversineDistance(lat, lng, BENGALURU_CENTER.lat, BENGALURU_CENTER.lng);
            const isInBengaluru = cityName.toLowerCase().includes('bengaluru') || cityName.toLowerCase().includes('bangalore') || distToBengaluru < 100;
            
            if (isInBengaluru) {
              setDetectedCity('Bengaluru');
              setIsDemoMode(false);
              setNotification({ message: `You're in ${cityName}. Showing local EV stations.`, type: 'success' });
              setViewState(prev => ({ ...prev, longitude: lng, latitude: lat, zoom: 13 }));
            } else {
              let closestCity = INDIAN_CITIES[0];
              let minDist = Infinity;
              for (const city of INDIAN_CITIES) {
                const dist = haversineDistance(lat, lng, city.lat, city.lng);
                if (dist < minDist) { minDist = dist; closestCity = city; }
              }
              setDetectedCity(closestCity.name);
              setIsDemoMode(true);
              setUserLocation({ lat: BENGALURU_CENTER.lat, lng: BENGALURU_CENTER.lng });
              setNotification({ message: `You're in ${cityName}. Showing Bengaluru EV Grid Demo.`, type: 'info' });
              if (mapRef.current) {
                mapRef.current.flyTo({ center: [BENGALURU_CENTER.lng, BENGALURU_CENTER.lat], zoom: 12, duration: 2000 });
              }
            }
            setTimeout(() => setNotification(null), 5000);
          } catch {
            setDetectedCity('Bengaluru');
            setIsDemoMode(true);
            setUserLocation(BENGALURU_CENTER);
            setNotification({ message: 'Location detected. Showing Bengaluru EV Grid Demo.', type: 'info' });
            setTimeout(() => setNotification(null), 5000);
          }
        },
        () => {
          setDetectedCity('Bengaluru');
          setIsDemoMode(true);
          setUserLocation(BENGALURU_CENTER);
          setNotification({ message: 'Location unavailable. Showing Bengaluru Demo.', type: 'info' });
          setTimeout(() => setNotification(null), 5000);
        }
      );
    };

    detectLocation();
  }, []);

  const handleExploreBengaluru = () => {
    setDetectedCity('Bengaluru');
    setIsDemoMode(false);
    setUserLocation(BENGALURU_CENTER);
    setShowLocationSelector(false);
    setNotification({ message: 'Exploring Bengaluru EV Grid.', type: 'success' });
    setTimeout(() => setNotification(null), 3000);
    
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [BENGALURU_CENTER.lng, BENGALURU_CENTER.lat],
        zoom: 12,
        duration: 2000
      });
    }
  };

  const handleSelectCity = (city: typeof INDIAN_CITIES[0]) => {
    setDetectedCity(city.name);
    setIsDemoMode(true);
    setUserLocation({ lat: city.lat, lng: city.lng });
    setShowLocationSelector(false);
    setNotification({ message: `Exploring ${city.name} EV Grid (Demo).`, type: 'info' });
    setTimeout(() => setNotification(null), 3000);
    
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [city.lng, city.lat],
        zoom: 12,
        duration: 2000
      });
    }
  };

  const totalDemand = demand.reduce((acc, d) => acc + d.demand, 0);
  const peakLoad = Math.max(...stations.map(s => s.load), 0);
  const optimizedPeak = Math.round(peakLoad * 0.85);
  const reductionPercent = Math.round(((peakLoad - optimizedPeak) / peakLoad) * 100);

  const selectedZoneData = BENGALURU_ZONES.find(z => z.id === selectedZoneId);
  const currentZoneDemand = demand.find(d => d.zone_id === selectedZoneId);

  const getZoneColor = (zoneId: number) => {
    const d = demand.find(x => x.zone_id === zoneId)?.demand ?? 0;
    if (d > 600) return '#ef4444';
    if (d > 300) return '#eab308';
    return '#10b981';
  };

  const handleStationClick = (station: any) => {
    setSelectedStation(station);
    
    if (userLocation && userLocation.lat !== BENGALURU_CENTER.lat) {
      const route = {
        type: 'LineString',
        coordinates: [
          [userLocation.lng, userLocation.lat],
          [station.lng, station.lat]
        ]
      };
      setRouteGeometry(route);
    }
  };

  const sortedStations = [...stations].sort((a, b) => a.distance - b.distance);
  const bestOption = sortedStations.find(s => s.status === 'GREEN') || sortedStations[0];

  const forecastData = Array.from({ length: 24 }).map((_, i) => {
    const base = 200 + Math.sin((i / 24) * Math.PI) * 400;
    return {
      hour: i,
      predicted_demand: base,
      baseline_demand: base * 1.2,
    };
  });

  return (
    <div className="flex min-h-screen flex-col bg-[#0B0F14] text-slate-200 font-sans">
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-white/5 bg-[#0B0F14]/80 px-6 backdrop-blur-xl">
        <div className="flex items-center gap-8">
          <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Zap size={18} fill="currentColor" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">GridSense</span>
          </a>
          
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            <button 
              onClick={() => setActiveTab('insights')}
              className={`rounded-md px-4 py-2 transition ${activeTab === 'insights' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Map
            </button>
            <button 
              onClick={() => setActiveTab('impact')}
              className={`rounded-md px-4 py-2 transition ${activeTab === 'impact' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Impact
            </button>
            <button 
              onClick={() => setActiveTab('planning')}
              className={`rounded-md px-4 py-2 transition ${activeTab === 'planning' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Planning
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-4 relative">
          <div className="relative">
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white transition-colors border border-slate-700 bg-slate-800/50 px-4 py-2 rounded-lg"
            >
              Menu
              <ChevronRight size={14} className={`transition-transform ${isProfileOpen ? 'rotate-90' : ''}`} />
            </button>
            
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-700 bg-slate-900 shadow-xl overflow-hidden py-1 z-50">
                <Link 
                  to="/profile"
                  className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors block"
                >
                  My Profile
                </Link>
                <Link 
                  to="/settings"
                  className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors block"
                >
                  Settings
                </Link>
                <div className="h-px bg-slate-800 my-1" />
                <button 
                  onClick={logout} 
                  className="w-full text-left px-4 py-2 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors flex items-center justify-between"
                >
                  Logout
                  <LogOut size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Auto-dismissing Notification */}
      {notification && (
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700 px-6 py-3 flex items-center justify-between animate-in slide-in-from-top">
          <div className="flex items-center gap-3">
            <Info size={16} className={notification.type === 'success' ? 'text-emerald-400' : 'text-cyan-400'} />
            <p className="text-sm text-slate-200">{notification.message}</p>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-500 hover:text-white">✕</button>
        </div>
      )}

      {/* Persistent Demo Mode Indicator */}
      {isDemoMode && (
        <div className="bg-cyan-500/10 border-b border-cyan-500/20 px-6 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Demo Mode</span>
              <span className="text-xs text-slate-400">|</span>
              <span className="text-xs text-slate-300">Bengaluru EV Grid</span>
            </div>
            <button 
              onClick={() => setShowLocationSelector(true)}
              className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300"
            >
              <Globe size={12} />
              Explore Other Cities
            </button>
          </div>
        </div>
      )}

      {/* User Location Indicator (when available) */}
      {!isDemoMode && userLocation && (
        <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-6 py-2 flex items-center gap-2">
          <MapPin size={14} className="text-emerald-400" />
          <span className="text-sm text-emerald-200">Your location: {detectedCity}</span>
        </div>
      )}

      {alerts.length > 0 && (
        <div className="bg-rose-500/10 border-b border-rose-500/20 px-6 py-3 flex items-center gap-3">
          <AlertTriangle className="text-rose-400" size={16} />
          <p className="text-sm font-medium text-rose-200">
            <span className="font-bold text-rose-100">Critical Alerts ({alerts.length}):</span> {alerts[0].message}
          </p>
        </div>
      )}

      <main className="flex-1 p-6 space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Total Network Demand"
            value={`${totalDemand.toFixed(1)} kW`}
            hint="Live aggregated load"
            trend={4.2}
            upIsGood={false}
          />
          <KPICard
            title="Current Peak Load"
            value={`${peakLoad.toFixed(1)} kW`}
            hint="Highest station load"
            trend={-2.1}
            upIsGood={false}
          />
          <KPICard
            title="Optimized Target"
            value={`${optimizedPeak.toFixed(1)} kW`}
            hint="Post-optimization"
            trend={0}
          />
          <KPICard
            title="Peak Reduction"
            value={`${reductionPercent.toFixed(1)}%`}
            hint="Efficiency gain"
            trend={12.4}
            upIsGood={true}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.8fr_1fr] h-[650px]">
          <div className="relative rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden shadow-2xl flex flex-col">
            <div className="absolute top-4 left-4 z-10 flex gap-2">
              <div className="rounded-lg bg-[#0B0F14]/90 backdrop-blur-md border border-cyan-500/30 p-2 shadow-lg flex items-center gap-2">
                <Zap size={14} className="text-cyan-400" />
                <span className="text-xs font-semibold text-white uppercase tracking-wider">
                  {isDemoMode ? 'Bengaluru Grid' : detectedCity}
                </span>
              </div>
            </div>

            <div className="absolute top-4 right-4 z-10">
              <div className="rounded-lg bg-[#0B0F14]/90 backdrop-blur-md border border-slate-700/50 p-3 shadow-lg flex flex-col gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-700/50 pb-1 mb-1">Status</span>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span> Available
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
                  <span className="h-2 w-2 rounded-full bg-amber-500"></span> Moderate
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
                  <span className="h-2 w-2 rounded-full bg-rose-500"></span> Busy
                </div>
              </div>
            </div>

            <div className="absolute bottom-4 left-4 z-10">
              {userLocation && (
                <button 
                  onClick={() => {
                    setViewState(prev => ({
                      ...prev,
                      longitude: userLocation.lng,
                      latitude: userLocation.lat,
                      zoom: 14
                    }));
                  }}
                  className="rounded-lg bg-[#0B0F14]/90 backdrop-blur-md border border-slate-700/50 p-2 shadow-lg flex items-center gap-2 text-xs text-slate-300 hover:text-white transition-colors"
                >
                  <Crosshair size={14} />
                  My Location
                </button>
              )}
            </div>
            
            <div className="flex-1 bg-black/50 w-full relative">
              <Map
                ref={mapRef}
                {...viewState}
                onMove={evt => setViewState(evt.viewState)}
                mapStyle={MAP_STYLE}
                attributionControl={false}
              >
                <NavigationControl position="bottom-right" />

                {/* User's real location marker */}
                {userLocation && !isDemoMode && (
                  <Marker longitude={userLocation.lng} latitude={userLocation.lat} anchor="center">
                    <div className="relative cursor-pointer">
                      <div className="absolute inset-0 h-4 w-4 bg-blue-500 rounded-full animate-ping opacity-50"></div>
                      <div className="relative h-3 w-3 bg-blue-500 rounded-full border-2 border-white shadow-lg"></div>
                    </div>
                  </Marker>
                )}

                {BENGALURU_ZONES.map(zone => {
                  const isActive = zone.id === selectedZoneId;
                  const color = getZoneColor(zone.id);
                  
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
                        className={`relative cursor-pointer transition-transform ${isActive ? 'scale-125' : 'scale-100'}`}
                      >
                        <MapPin size={24} className="text-slate-400" fill={color} />
                      </div>
                    </Marker>
                  );
                })}

                {stations.map(st => {
                  const color = st.status === 'RED' ? '#ef4444' : st.status === 'YELLOW' ? '#eab308' : '#10b981';
                  const isSelected = selectedStation?.id === st.id;
                  
                  return (
                    <Marker 
                      key={st.id} 
                      longitude={st.lng} 
                      latitude={st.lat} 
                      anchor="center"
                      onClick={(e) => {
                        e.originalEvent.stopPropagation();
                        handleStationClick(st);
                      }}
                    >
                      <div className={`relative cursor-pointer z-10 ${isSelected ? 'scale-125' : 'scale-100'}`}>
                        <div 
                          className="h-6 w-6 rounded-md border-2 border-white shadow-lg transition-transform hover:scale-110 flex items-center justify-center"
                          style={{ backgroundColor: color }}
                        >
                          <Zap size={12} className="text-white" />
                        </div>
                      </div>
                    </Marker>
                  );
                })}

                {routeGeometry && (
                  <Source
                    id="route"
                    type="geojson"
                    data={{
                      type: 'Feature',
                      properties: {},
                      geometry: routeGeometry
                    }}
                  >
                    <Layer
                      id="route-line"
                      type="line"
                      paint={{
                        'line-color': '#3b82f6',
                        'line-width': 4,
                        'line-opacity': 0.8,
                        'line-dasharray': [2, 1]
                      }}
                    />
                  </Source>
                )}
              </Map>

              {selectedStation && (
                <div className="absolute bottom-20 left-4 right-4 z-20">
                  <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-xl p-4 shadow-2xl">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-white">{selectedStation.name}</h3>
                        <p className="text-xs text-slate-400">
                          {userLocation ? `${haversineDistance(userLocation.lat, userLocation.lng, selectedStation.lat, selectedStation.lng).toFixed(1)} km away` : 'Distance unknown'}
                        </p>
                      </div>
                      <button 
                        onClick={() => {
                          setSelectedStation(null);
                          setRouteGeometry(null);
                        }}
                        className="text-slate-400 hover:text-white"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                      <div className="bg-slate-800 rounded p-2">
                        <p className="text-slate-500">Available Slots</p>
                        <p className="font-bold text-white">{Math.max(0, selectedStation.capacity - Math.round(selectedStation.load / 50))}</p>
                      </div>
                      <div className="bg-slate-800 rounded p-2">
                        <p className="text-slate-500">Wait Time</p>
                        <p className="font-bold text-white">{selectedStation.wait_time > 0 ? `${selectedStation.wait_time} min` : 'None'}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedStation.lat},${selectedStation.lng}`;
                        window.open(url, '_blank');
                      }}
                      className="w-full bg-cyan-500 hover:bg-cyan-400 text-[#0B0F14] font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Navigation size={14} /> Get Directions
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm flex flex-col overflow-hidden">
            <div className="p-5 border-b border-slate-800">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                {selectedZoneData?.name} Zone
              </h2>
              <div className="mt-1 flex items-center gap-2 text-sm text-slate-400">
                <span className="flex items-center gap-1"><Activity size={14}/> {currentZoneDemand?.demand.toFixed(1) || '0.0'} kW</span>
                <span className="w-1 h-1 rounded-full bg-slate-600"/>
                <span className="flex items-center gap-1"><TrendingUp size={14}/> Stable</span>
              </div>
            </div>

            <div className="flex border-b border-slate-800">
              {(['insights', 'impact', 'planning'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-3 px-4 text-xs font-bold uppercase tracking-wider transition-colors ${
                    activeTab === tab ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-500/5' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {activeTab === 'insights' && (
                <div className="space-y-4">
                  <div className="rounded-xl bg-slate-800/50 p-4 border border-slate-700/50">
                    <h4 className="text-sm font-semibold text-white mb-1">Nearby Stations</h4>
                    <p className="text-xs text-slate-400 mb-3">Sorted by distance • Best option highlighted</p>
                    <div className="space-y-2">
                      {sortedStations.map(st => (
                        <div 
                          key={st.id} 
                          onClick={() => handleStationClick(st)}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            st.id === bestOption?.id 
                              ? 'bg-emerald-500/10 border-emerald-500/30' 
                              : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm font-bold text-white flex items-center gap-2">
                                {st.name}
                                {st.id === bestOption?.id && (
                                  <span className="text-[9px] bg-emerald-500 px-1.5 py-0.5 rounded uppercase">Best</span>
                                )}
                              </p>
                              <p className="text-xs text-slate-400 mt-1">{st.distance.toFixed(1)} km • {st.wait_time > 0 ? `${st.wait_time}m wait` : 'No wait'}</p>
                            </div>
                            <div className="text-right">
                              <span className={`h-2 w-2 inline-block rounded-full mr-2 ${st.status === 'RED' ? 'bg-rose-500' : st.status === 'YELLOW' ? 'bg-amber-400' : 'bg-emerald-500'}`} />
                              <span className="text-sm font-bold text-slate-200">{Math.round(st.load)}</span>
                              <span className="text-xs text-slate-500">/{st.capacity}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'impact' && (
                <div className="flex flex-col h-full space-y-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <h4 className="text-sm font-semibold text-white">Peak Load Reduction</h4>
                      <div className="flex items-center gap-3 mt-1 text-xs">
                        <span className="text-emerald-400 font-medium">Target: {reductionPercent}%</span>
                        <span className="text-slate-500">|</span>
                        <span className="text-cyan-400 font-medium">Actual: {reductionPercent}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="min-h-[200px] w-full border border-slate-800 rounded-xl bg-slate-900/50 p-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={forecastData} margin={{top: 10, right: 0, left: -20, bottom: 0}}>
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
                        <Area type="monotone" name="Optimized" dataKey="predicted_demand" stroke="#10b981" fillOpacity={1} fill="url(#colorOpt)" strokeWidth={2} />
                        <Line type="monotone" name="Base" dataKey="baseline_demand" stroke="#ef4444" strokeWidth={2} dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {activeTab === 'planning' && (
                <div className="space-y-3">
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 mb-4">
                    <h4 className="text-sm font-semibold text-emerald-100 mb-1">Infrastructure Planning</h4>
                    <p className="text-[11px] text-emerald-200/70">Optimal placement based on demand patterns</p>
                  </div>
                  {zones.map((loc, i) => (
                    <div key={i} className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4 cursor-pointer hover:bg-slate-800/80 transition">
                      <div className="flex justify-between items-start">
                        <h4 className="text-sm font-bold text-white">{loc.name}</h4>
                        <div className="bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded text-[10px] font-bold">Score: {Math.round(70 + Math.random() * 25)}</div>
                      </div>
                      <p className="text-xs text-slate-400 mt-2">High demand density • Recommended for expansion</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <AssistantPanel nearbyStations={stations} selectedZone={selectedZoneId} />

      {/* Location Selector Modal */}
      {showLocationSelector && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Globe size={20} className="text-cyan-400" />
                Select Location
              </h2>
              <button 
                onClick={() => setShowLocationSelector(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <p className="text-sm text-slate-400 mb-4">
              Explore EV charging stations in different Indian cities:
            </p>

            <div className="grid grid-cols-2 gap-2 mb-4 max-h-64 overflow-y-auto">
              {INDIAN_CITIES.map((city) => (
                <button
                  key={city.name}
                  onClick={() => handleSelectCity(city)}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    detectedCity === city.name 
                      ? 'bg-cyan-500/20 border-cyan-500/50' 
                      : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <p className="font-medium text-white">{city.name}</p>
                  <p className="text-xs text-slate-500">{city.state}</p>
                </button>
              ))}
            </div>

            <button
              onClick={handleExploreBengaluru}
              className="w-full p-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <Target size={20} className="text-emerald-400" />
                <div>
                  <p className="font-medium text-emerald-100">Explore Bengaluru EV Stations</p>
                  <p className="text-xs text-emerald-200/70">See live station availability</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}