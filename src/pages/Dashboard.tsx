import { useState, useEffect, useRef } from 'react';
import {
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
  Info,
  Activity,
  Clock
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useSystemState } from '../context/SystemStateContext';
import { Link } from 'react-router-dom';

import Map, { Marker, NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import AssistantPanel from '../components/ui/AssistantPanel';

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

const BENGALURU_CENTER = { lat: 12.97, lng: 77.59 };
const BENGALURU_DEMO_NOTICE = 'You are outside Bengaluru or location is unavailable. Showing Bengaluru live demo data.';

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
  { id: 6, name: 'MG Road', lat: 12.9752, lng: 77.6060 },
  { id: 7, name: 'Manyata Tech Park', lat: 13.0420, lng: 77.6200 },
  { id: 8, name: 'Yelahanka', lat: 13.1007, lng: 77.5963 },
  { id: 9, name: 'JP Nagar', lat: 12.9063, lng: 77.5857 },
  { id: 10, name: 'Hebbal', lat: 13.0358, lng: 77.5970 },
  { id: 11, name: 'Banashankari', lat: 12.9255, lng: 77.5468 },
  { id: 12, name: 'Airport Corridor', lat: 13.1986, lng: 77.7066 },
];

type Coordinate = { lat: number; lng: number };
type StationLike = Coordinate & { name?: string };

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
    if (address.city) return address.city;
    if (address.town) return address.town;
    if (address.county) return address.county;
    if (address.state) return address.state;
    return data.display_name?.split(',')[0] || 'Unknown';
  } catch {
    return 'Unknown';
  }
}

function buildDirectionsUrl(station: StationLike, origin?: Coordinate | null): string {
  const params = new URLSearchParams({
    api: '1',
    destination: `${station.lat},${station.lng}`,
    travelmode: 'driving',
  });

  if (origin) {
    params.set('origin', `${origin.lat},${origin.lng}`);
  }

  return `https://www.google.com/maps/dir/?${params.toString()}`;
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
  const [activeTab, setActiveTab] = useState<'insights' | 'impact' | 'planning'>('insights');
  const [predictionTab, setPredictionTab] = useState<'now' | '24h' | '3days'>('now');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);
  const [detectedCity, setDetectedCity] = useState<string>('Detecting...');
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [directionOrigin, setDirectionOrigin] = useState<Coordinate | null>(null);
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const [selectedStation, setSelectedStation] = useState<any>(null);
  const [notification, setNotification] = useState<{message: string; type: 'info' | 'success'} | null>(null);
  const [mapError, setMapError] = useState(false);
  const [viewState, setViewState] = useState({
    longitude: BENGALURU_CENTER.lng,
    latitude: BENGALURU_CENTER.lat,
    zoom: 11
  });

  // Extract data from system state
  const zones = systemState.zones || [];
  const stations = systemState.stations || [];
  const alerts = systemState.alerts || [];
  const totalDemand = systemState.total_demand || 0;
  const peakLoad = systemState.peak_load || 0;
  const optimizedPeak = systemState.optimized_peak || 0;
  const reductionPercent = systemState.reduction_percent || 0;

  // Auto-detect location
  useEffect(() => {
    const detectLocation = async () => {
      if (!navigator.geolocation) {
        setNotification({ message: BENGALURU_DEMO_NOTICE, type: 'info' });
        setDetectedCity('Bengaluru');
        setUserLocation(BENGALURU_CENTER);
        setDirectionOrigin(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const detectedLocation = { lat, lng };
          setDirectionOrigin(detectedLocation);
          
          try {
            const cityName = await reverseGeocode(lat, lng);
            const distToBengaluru = haversineDistance(lat, lng, BENGALURU_CENTER.lat, BENGALURU_CENTER.lng);
            const isInBengaluru = cityName.toLowerCase().includes('bengaluru') || cityName.toLowerCase().includes('bangalore') || distToBengaluru < 45;
            
            if (isInBengaluru) {
              setDetectedCity('Bengaluru');
              setIsDemoMode(false);
              setUserLocation(detectedLocation);
              setNotification({ message: `You're in ${cityName}. Showing local EV stations.`, type: 'success' });
            } else {
              let closestCity = INDIAN_CITIES[0];
              let minDist = Infinity;
              for (const city of INDIAN_CITIES) {
                const dist = haversineDistance(lat, lng, city.lat, city.lng);
                if (dist < minDist) { minDist = dist; closestCity = city; }
              }
              setDetectedCity(closestCity.name);
              setIsDemoMode(true);
              setUserLocation(BENGALURU_CENTER);
              setNotification({ message: `${BENGALURU_DEMO_NOTICE} Detected location: ${cityName}.`, type: 'info' });
            }
            setTimeout(() => setNotification(null), 5000);
          } catch {
            setDetectedCity('Bengaluru');
            setIsDemoMode(true);
            setUserLocation(BENGALURU_CENTER);
            setNotification({ message: BENGALURU_DEMO_NOTICE, type: 'info' });
            setTimeout(() => setNotification(null), 5000);
          }
        },
        () => {
          setDetectedCity('Bengaluru');
          setIsDemoMode(true);
          setUserLocation(BENGALURU_CENTER);
          setDirectionOrigin(null);
          setNotification({ message: BENGALURU_DEMO_NOTICE, type: 'info' });
          setTimeout(() => setNotification(null), 5000);
        }
      );
    };

    detectLocation();
  }, []);

  // Map center sync
  useEffect(() => {
    if (mapRef.current) {
      const center = isDemoMode ? BENGALURU_CENTER : (userLocation || BENGALURU_CENTER);
      mapRef.current.flyTo({
        center: [center.lng, center.lat],
        zoom: isDemoMode ? 12 : 13,
        duration: 2000
      });
    }
  }, [isDemoMode, userLocation]);

  // Zone color based on demand
  const getZoneColor = (zoneId: number) => {
    const zone = zones.find(z => z.id === zoneId);
    const d = zone?.current_demand || 0;
    if (d > 600) return '#ef4444';
    if (d > 300) return '#eab308';
    return '#10b981';
  };

  // Station click handler
  const handleStationClick = (station: any) => {
    setSelectedStation(station);
    setViewState(prev => ({ ...prev, longitude: station.lng, latitude: station.lat, zoom: Math.max(prev.zoom, 13) }));
  };

  // Sort stations by distance
  const sortedStations = [...stations].sort((a, b) => a.distance - b.distance);
  const bestOption = sortedStations.find(s => s.status === 'GREEN') || sortedStations[0];

  // Generate prediction graph data from real zone demand
  const predictionHours = predictionTab === 'now' ? 12 : predictionTab === '24h' ? 24 : 72;
  const selectedZoneForPrediction = zones.find(zone => zone.id === selectedZoneId) || zones[0];
  const predictionData = selectedZoneForPrediction ? Array.from({ length: predictionHours }, (_, i) => {
    const now = new Date();
    const hour = (now.getHours() + i) % 24;
    const baseDemand = selectedZoneForPrediction.current_demand || 400;
    const eveningPeak = (hour >= 17 && hour <= 21) ? 1.32 : 1;
    const morningPeak = (hour >= 7 && hour <= 9) ? 1.12 : 1;
    const overnightRelief = (hour >= 0 && hour <= 5) ? 0.72 : 1;
    const demand = baseDemand * eveningPeak * morningPeak * overnightRelief + Math.sin(i * 0.55) * 38;
    return {
      hour: i,
      time: predictionTab === '3days' ? `D${Math.floor(i / 24) + 1} ${hour}:00` : `${hour}:00`,
      demand: Math.max(100, demand),
      confidence: Math.max(0.6, 0.92 - (i * 0.02))
    };
  }) : [];

  const planningRecommendations = zones
    .map((zone) => {
      const loadRatio = zone.current_demand / Math.max(zone.capacity, 1);
      const nearbyCount = stations.filter(station => haversineDistance(zone.lat, zone.lng, station.lat, station.lng) < 3).length;
      const nearbyStations = stations.filter(station => haversineDistance(zone.lat, zone.lng, station.lat, station.lng) < 4);
      const avgQueue = nearbyStations.length
        ? nearbyStations.reduce((sum, station) => sum + (station.wait_time || 0), 0) / nearbyStations.length
        : 12;
      const coverageGap = Math.max(0, 4 - nearbyCount);
      const demandPressure = Math.min(35, loadRatio * 38);
      const queuePressure = Math.min(18, avgQueue * 1.4);
      const score = Math.min(98, Math.round(36 + demandPressure + coverageGap * 8 + queuePressure));
      const recommendedPorts = Math.max(4, Math.round(score / 12));
      const reasons = [
        loadRatio > 0.65 ? 'high demand' : 'moderate demand',
        coverageGap > 1 ? 'low station density' : 'adequate station coverage',
        avgQueue > 8 ? 'queue pressure' : 'manageable queues',
      ];
      const action = score >= 82
        ? 'Add fast ports and route flexible charging to late-night slots.'
        : score >= 68
          ? 'Increase charger utilization monitoring and prepare one expansion site.'
          : 'Maintain coverage and promote off-peak charging.';
      return { ...zone, score, nearbyCount, recommendedPorts, reason: reasons.join(' + '), action };
    })
    .sort((a, b) => b.score - a.score);

  // Current zone data
  const selectedZone = zones.find(z => z.id === selectedZoneId);
  const selectedZoneData = selectedZone || BENGALURU_ZONES.find(z => z.id === selectedZoneId);

  const handleExploreBengaluru = () => {
    setDetectedCity('Bengaluru');
    setIsDemoMode(false);
    setUserLocation(BENGALURU_CENTER);
    setDirectionOrigin(BENGALURU_CENTER);
    setShowLocationSelector(false);
    setNotification({ message: 'Exploring Bengaluru EV Grid.', type: 'success' });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSelectCity = (city: typeof INDIAN_CITIES[0]) => {
    setDetectedCity(city.name);
    setIsDemoMode(true);
    setUserLocation({ lat: city.lat, lng: city.lng });
    setDirectionOrigin({ lat: city.lat, lng: city.lng });
    setShowLocationSelector(false);
    setNotification({ message: `Exploring ${city.name} EV Grid (Demo).`, type: 'info' });
    setTimeout(() => setNotification(null), 3000);
  };

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
            <button onClick={() => setActiveTab('insights')} className={`rounded-md px-4 py-2 transition ${activeTab === 'insights' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}>
              Map
            </button>
            <button onClick={() => setActiveTab('impact')} className={`rounded-md px-4 py-2 transition ${activeTab === 'impact' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}>
              Predictions
            </button>
            <button onClick={() => setActiveTab('planning')} className={`rounded-md px-4 py-2 transition ${activeTab === 'planning' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}>
              Planning
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white transition-colors border border-slate-700 bg-slate-800/50 px-4 py-2 rounded-lg">
              Menu
              <ChevronRight size={14} className={`transition-transform ${isProfileOpen ? 'rotate-90' : ''}`} />
            </button>
            
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-700 bg-slate-900 shadow-xl overflow-hidden py-1 z-50">
                <Link to="/profile" className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors block">My Profile</Link>
                <Link to="/settings" className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors block">Settings</Link>
                <div className="h-px bg-slate-800 my-1" />
                <button onClick={logout} className="w-full text-left px-4 py-2 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors flex items-center justify-between">
                  Logout
                  <LogOut size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Notification */}
      {notification && (
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700 px-6 py-3 flex items-center justify-between animate-in slide-in-from-top">
          <div className="flex items-center gap-3">
            <Info size={16} className={notification.type === 'success' ? 'text-emerald-400' : 'text-cyan-400'} />
            <p className="text-sm text-slate-200">{notification.message}</p>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-500 hover:text-white">✕</button>
        </div>
      )}

      {/* Demo Mode Banner */}
      {isDemoMode && (
        <div className="bg-cyan-500/10 border-b border-cyan-500/20 px-6 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Demo Mode</span>
              <span className="text-xs text-slate-400">|</span>
              <span className="text-xs text-slate-300">Bengaluru EV Grid</span>
            </div>
            <button onClick={() => setShowLocationSelector(true)} className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300">
              <Globe size={12} />
              Explore Other Cities
            </button>
          </div>
        </div>
      )}

      {/* User Location */}
      {!isDemoMode && userLocation && (
        <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-6 py-2 flex items-center gap-2">
          <MapPin size={14} className="text-emerald-400" />
          <span className="text-sm text-emerald-200">Your location: {detectedCity}</span>
        </div>
      )}

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="bg-rose-500/10 border-b border-rose-500/20 px-6 py-3 flex items-center gap-3">
          <AlertTriangle className="text-rose-400" size={16} />
          <p className="text-sm font-medium text-rose-200">
            <span className="font-bold text-rose-100">Alerts ({alerts.length}):</span> {alerts[0]?.message}
          </p>
        </div>
      )}

      <main className="flex-1 p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard title="Total Network Demand" value={`${totalDemand.toFixed(0)} kW`} hint="Live aggregated load" trend={4.2} upIsGood={false} />
          <KPICard title="Current Peak Load" value={`${peakLoad.toFixed(0)} kW`} hint="Highest zone load" trend={-2.1} upIsGood={false} />
          <KPICard title="Optimized Target" value={`${optimizedPeak.toFixed(0)} kW`} hint="Post-optimization" trend={0} />
          <KPICard title="Peak Reduction" value={`${reductionPercent.toFixed(0)}%`} hint="Efficiency gain" trend={12.4} upIsGood={true} />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.8fr_1fr] lg:h-[650px]">
          {/* Map */}
          <div className="relative min-h-[430px] rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden shadow-2xl flex flex-col lg:min-h-0">
            <div className="absolute top-4 left-4 z-10 flex gap-2">
              <div className="rounded-lg bg-[#0B0F14]/90 backdrop-blur-md border border-cyan-500/30 p-2 shadow-lg flex items-center gap-2">
                <Zap size={14} className="text-cyan-400" />
                <span className="text-xs font-semibold text-white uppercase tracking-wider">
                  {isDemoMode ? 'Bengaluru Grid' : detectedCity}
                </span>
              </div>
            </div>

            <div className="absolute top-4 right-4 z-10">
              <div className="rounded-lg bg-[#0B0F14]/90 backdrop-blur-md border border-slate-700/50 p-3 shadow-lg">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stations</span>
                <p className="text-lg font-bold text-white">{stations.length}</p>
              </div>
            </div>

            <div className="absolute bottom-4 left-4 z-10">
              {userLocation && (
                <button onClick={() => setViewState(prev => ({ ...prev, longitude: userLocation.lng, latitude: userLocation.lat, zoom: 14 }))} className="rounded-lg bg-[#0B0F14]/90 backdrop-blur-md border border-slate-700/50 p-2 shadow-lg flex items-center gap-2 text-xs text-slate-300 hover:text-white">
                  <Crosshair size={14} /> {isDemoMode ? 'Bengaluru View' : 'My Location'}
                </button>
              )}
            </div>
            
            <div className="flex-1 bg-black/50 w-full min-h-[430px] relative lg:min-h-0">
              {mapError ? (
                <div className="flex-1 flex items-center justify-center bg-slate-900/80">
                  <div className="text-center p-6">
                    <MapPin size={48} className="text-slate-600 mx-auto mb-3" />
                    <p className="text-sm text-slate-400 mb-2">Map unavailable</p>
                    <p className="text-xs text-slate-500">Loading map tiles...</p>
                  </div>
                </div>
              ) : (
                <Map ref={mapRef} {...viewState} onMove={evt => setViewState(evt.viewState)} mapStyle={MAP_STYLE} attributionControl={false} onError={() => setMapError(true)} style={{ width: '100%', height: '100%' }}>
                  <NavigationControl position="bottom-right" />

                  {/* User Location */}
                  {userLocation && !isDemoMode && (
                    <Marker longitude={userLocation.lng} latitude={userLocation.lat} anchor="center">
                      <div className="relative">
                        <div className="absolute inset-0 h-4 w-4 bg-blue-500 rounded-full animate-ping opacity-50"></div>
                        <div className="relative h-3 w-3 bg-blue-500 rounded-full border-2 border-white shadow-lg"></div>
                      </div>
                    </Marker>
                  )}

                  {/* Zone Markers */}
                  {zones.map(zone => {
                    const isActive = zone.id === selectedZoneId;
                    return (
                      <Marker key={zone.id} longitude={zone.lng} latitude={zone.lat} anchor="bottom" onClick={(e) => { e.originalEvent.stopPropagation(); setSelectedZoneId(zone.id); }}>
                        <div className={`relative cursor-pointer ${isActive ? 'scale-125' : 'scale-100'}`}>
                          <MapPin size={24} fill={getZoneColor(zone.id)} className="text-slate-400" />
                        </div>
                      </Marker>
                    );
                  })}

                  {/* Station Markers */}
                  {stations.map(station => {
                    const color = station.status === 'RED' ? '#ef4444' : station.status === 'YELLOW' ? '#eab308' : '#10b981';
                    return (
                      <Marker key={station.id} longitude={station.lng} latitude={station.lat} anchor="center" onClick={(e) => { e.originalEvent.stopPropagation(); handleStationClick(station); }}>
                        <div className={`relative cursor-pointer z-10 ${selectedStation?.id === station.id ? 'scale-125' : 'scale-100'}`}>
                          <div className="h-6 w-6 rounded-md border-2 border-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform" style={{ backgroundColor: color }}>
                            <Zap size={12} className="text-white" />
                          </div>
                        </div>
                      </Marker>
                    );
                  })}
                </Map>
              )}
              
              {/* Station Popup - show when map loaded */}
              {selectedStation && !mapError && (
                <div className="absolute bottom-20 left-4 right-4 z-20">
                  <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-xl p-4 shadow-2xl">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-white">{selectedStation.name}</h3>
                        <p className="text-xs text-slate-400">{selectedStation.distance?.toFixed(1)} km away</p>
                      </div>
                      <button onClick={() => setSelectedStation(null)} className="text-slate-400 hover:text-white">✕</button>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                      <div className="bg-slate-800 rounded p-2">
                        <p className="text-slate-500">Load</p>
                        <p className="font-bold text-white">{Math.round(selectedStation.load)} / {selectedStation.capacity}</p>
                      </div>
                      <div className="bg-slate-800 rounded p-2">
                        <p className="text-slate-500">Wait Time</p>
                        <p className="font-bold text-white">{selectedStation.wait_time > 0 ? `${selectedStation.wait_time} min` : 'None'}</p>
                      </div>
                    </div>
                    <a
                      href={buildDirectionsUrl(selectedStation, directionOrigin)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-cyan-500 hover:bg-cyan-400 text-[#0B0F14] font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                      aria-label={`Open Google Maps directions to ${selectedStation.name}`}
                    >
                      <Navigation size={14} /> Get Directions
                    </a>
                    <p className="mt-2 text-center text-[10px] text-slate-500">Directions open in Google Maps</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Side Panel */}
          <div className="min-h-[520px] rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm flex flex-col overflow-hidden lg:min-h-0">
            <div className="p-5 border-b border-slate-800">
              <h2 className="text-xl font-bold text-white">{selectedZoneData?.name} Zone</h2>
              <div className="mt-1 flex items-center gap-2 text-sm text-slate-400">
                <span className="flex items-center gap-1"><Activity size={14}/> {selectedZone?.current_demand?.toFixed(0) || '0'} kW</span>
                <span className="w-1 h-1 rounded-full bg-slate-600"/>
                <span className="flex items-center gap-1"><TrendingUp size={14}/> {selectedZone?.status || 'Unknown'}</span>
              </div>
            </div>

            <div className="flex border-b border-slate-800">
              {(['insights', 'impact', 'planning'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`py-3 px-4 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === tab ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-500/5' : 'text-slate-500 hover:text-slate-300'}`}>
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
                      {sortedStations.slice(0, 8).map(st => (
                        <div key={st.id} onClick={() => handleStationClick(st)} className={`p-3 rounded-lg border cursor-pointer transition-colors ${st.id === bestOption?.id ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'}`}>
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm font-bold text-white flex items-center gap-2">
                                {st.name}
                                {st.id === bestOption?.id && <span className="text-[9px] bg-emerald-500 px-1.5 py-0.5 rounded uppercase">Best</span>}
                              </p>
                              <p className="text-xs text-slate-400 mt-1">{st.distance?.toFixed(1)} km • {st.wait_time > 0 ? `${st.wait_time}m wait` : 'No wait'}</p>
                            </div>
                            <div className="text-right">
                              <span className={`h-2 w-2 inline-block rounded-full mr-2 ${st.status === 'RED' ? 'bg-rose-500' : st.status === 'YELLOW' ? 'bg-amber-400' : 'bg-emerald-500'}`} />
                              <span className="text-sm font-bold text-slate-200">{Math.round(st.load)}</span>
                              <span className="text-xs text-slate-500">/{st.capacity}</span>
                            </div>
                          </div>
                          <a
                            href={buildDirectionsUrl(st, directionOrigin)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(event) => event.stopPropagation()}
                            className="mt-3 w-full rounded-lg border border-cyan-500/30 bg-cyan-500/10 py-2 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/20 flex items-center justify-center gap-2"
                            aria-label={`Open Google Maps directions to ${st.name}`}
                          >
                            <Navigation size={13} /> Directions
                          </a>
                          <p className="mt-1 text-center text-[10px] text-slate-500">Directions open in Google Maps</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'impact' && (
                <div className="space-y-4">
                  {/* Prediction Tabs */}
                  <div className="flex gap-2 mb-4">
                    {(['now', '24h', '3days'] as const).map(tab => (
                      <button key={tab} onClick={() => setPredictionTab(tab)} className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors ${predictionTab === tab ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                        {tab === 'now' ? 'Now' : tab === '24h' ? '24 Hours' : '3 Days'}
                      </button>
                    ))}
                  </div>

                  {/* Prediction Graph */}
                  <div className="h-48 border border-slate-800 rounded-xl bg-slate-900/50 p-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={predictionData} margin={{top: 10, right: 0, left: -20, bottom: 0}}>
                        <defs>
                          <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="time" stroke="#64748b" tick={{fontSize: 8}} tickLine={false} axisLine={false} />
                        <YAxis stroke="#64748b" tick={{fontSize: 8}} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }} itemStyle={{ fontSize: '10px' }} labelStyle={{ fontSize: '10px', color: '#94a3b8' }} />
                        <Area type="monotone" dataKey="demand" stroke="#10b981" fillOpacity={1} fill="url(#colorDemand)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Recommendations from predictions */}
                  <div className="rounded-xl bg-slate-800/50 p-4 border border-slate-700/50">
                    <h4 className="text-sm font-semibold text-white mb-2">Smart Recommendations</h4>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2 p-2 bg-slate-900 rounded-lg">
                        <Zap size={14} className="text-amber-400 mt-0.5" />
                        <div>
                          <p className="text-xs text-white font-medium">Peak at 8-9 PM</p>
                          <p className="text-[10px] text-slate-400">Consider charging before 5 PM to avoid peak</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 p-2 bg-slate-900 rounded-lg">
                        <Clock size={14} className="text-emerald-400 mt-0.5" />
                        <div>
                          <p className="text-xs text-white font-medium">Optimal: 11 PM - 5 AM</p>
                          <p className="text-[10px] text-slate-400">Lowest rates and availability</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'planning' && (
                <div className="space-y-3">
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 mb-4">
                    <h4 className="text-sm font-semibold text-emerald-100 mb-1">Infrastructure Planning</h4>
                    <p className="text-[11px] text-emerald-200/70">AI-powered placement recommendations</p>
                  </div>
                  {planningRecommendations.map((zone) => (
                    <div key={zone.id} onClick={() => setSelectedZoneId(zone.id)} className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4 cursor-pointer hover:bg-slate-800/80 transition">
                      <div className="flex justify-between items-start">
                        <h4 className="text-sm font-bold text-white">{zone.name}</h4>
                        <div className="bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded text-[10px] font-bold">Score: {zone.score}</div>
                      </div>
                      <p className="text-xs text-slate-400 mt-2">Current demand: {zone.current_demand?.toFixed(0) || 0} kW • Capacity: {zone.capacity}</p>
                      <p className="text-xs text-slate-400 mt-2">Reason: {zone.reason}</p>
                      <p className="text-xs text-emerald-300/80 mt-2">Plan: add {zone.recommendedPorts} fast ports near underserved feeders • {zone.nearbyCount} stations within 3 km</p>
                      <p className="text-[11px] text-cyan-200/80 mt-2">{zone.action}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <AssistantPanel nearbyStations={stations} selectedZone={selectedZoneId} />

      {/* Location Selector */}
      {showLocationSelector && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Globe size={20} className="text-cyan-400" />
                Select Location
              </h2>
              <button onClick={() => setShowLocationSelector(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4 max-h-64 overflow-y-auto">
              {INDIAN_CITIES.map(city => (
                <button key={city.name} onClick={() => handleSelectCity(city)} className={`p-3 rounded-lg border text-left transition-colors ${detectedCity === city.name ? 'bg-cyan-500/20 border-cyan-500/50' : 'bg-slate-800 border-slate-700 hover:border-slate-600'}`}>
                  <p className="font-medium text-white">{city.name}</p>
                  <p className="text-xs text-slate-500">{city.state}</p>
                </button>
              ))}
            </div>
            <button onClick={handleExploreBengaluru} className="w-full p-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors text-left">
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
