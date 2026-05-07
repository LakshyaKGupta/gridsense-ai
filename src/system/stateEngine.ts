// Central State Engine
// Operators: polls /ev/state every 3s (grid-wide intelligence)
// EV Owners:  polls /stations/nearby every 10s (battery-friendly)
const API_URL = import.meta.env.VITE_API_URL ?? '/api';

export type UserRole = 'operator' | 'user';

export type Zone = {
  id: number;
  name: string;
  lat: number;
  lng: number;
  capacity: number;
  current_demand: number;
  status: 'GREEN' | 'YELLOW' | 'RED';
};

export type Station = {
  id: number;
  name: string;
  lat: number;
  lng: number;
  load: number;
  capacity: number;
  status: 'GREEN' | 'YELLOW' | 'RED';
  distance: number;
  wait_time: number;
  operator?: string;
  source?: string;
};

export type Alert = {
  zone_id: number;
  alert_type: string;
  severity: string;
  message: string;
  timestamp: string;
};

export type SystemState = {
  zones: Zone[];
  stations: Station[];
  total_demand: number;
  peak_load: number;
  optimized_peak: number;
  reduction_percent: number;
  alerts: Alert[];
  timestamp: string;
  current_hour: number;
  scenario: string | null;
  data_source: 'real' | 'fallback';
};

// ─── Fallback stations (named real Bengaluru locations) ──────────────────────
const fallbackStations: Station[] = [
  { id: 1,  name: 'Tata Power Indiranagar 100ft Road',    lat: 12.9784, lng: 77.6408, load: 86,  capacity: 160, status: 'GREEN',  distance: 1.2, wait_time: 0,  operator: 'Tata Power',    source: 'fallback' },
  { id: 2,  name: 'Ather Grid Koramangala 5th Block',      lat: 12.9279, lng: 77.6271, load: 140, capacity: 180, status: 'YELLOW', distance: 2.1, wait_time: 8,  operator: 'Ather',         source: 'fallback' },
  { id: 3,  name: 'ChargeZone Whitefield ITPL',            lat: 12.9698, lng: 77.7499, load: 168, capacity: 180, status: 'RED',    distance: 3.5, wait_time: 18, operator: 'ChargeZone',    source: 'fallback' },
  { id: 4,  name: 'EESL Electronic City Phase 1',          lat: 12.8399, lng: 77.6770, load: 92,  capacity: 150, status: 'GREEN',  distance: 5.2, wait_time: 0,  operator: 'EESL',          source: 'fallback' },
  { id: 5,  name: 'ABB Jayanagar 4th Block',               lat: 12.9299, lng: 77.5826, load: 105, capacity: 160, status: 'GREEN',  distance: 2.8, wait_time: 0,  operator: 'ABB',           source: 'fallback' },
  { id: 6,  name: 'Hubject MG Road Metro',                 lat: 12.9752, lng: 77.6060, load: 124, capacity: 160, status: 'YELLOW', distance: 1.5, wait_time: 5,  operator: 'Hubject',       source: 'fallback' },
  { id: 7,  name: 'Tata Power Forum South Bengaluru',      lat: 12.9170, lng: 77.6250, load: 172, capacity: 200, status: 'YELLOW', distance: 3.2, wait_time: 10, operator: 'Tata Power',    source: 'fallback' },
  { id: 8,  name: 'Zeon Manyata Tech Park Gate 5',         lat: 13.0420, lng: 77.6200, load: 72,  capacity: 140, status: 'GREEN',  distance: 6.1, wait_time: 0,  operator: 'Zeon',          source: 'fallback' },
  { id: 9,  name: 'Ather Grid Yelahanka New Town',         lat: 13.1007, lng: 77.5963, load: 58,  capacity: 120, status: 'GREEN',  distance: 9.4, wait_time: 0,  operator: 'Ather',         source: 'fallback' },
  { id: 10, name: 'ChargeZone JP Nagar Central',           lat: 12.9063, lng: 77.5857, load: 116, capacity: 150, status: 'YELLOW', distance: 4.4, wait_time: 6,  operator: 'ChargeZone',    source: 'fallback' },
  { id: 11, name: 'Relux Hebbal Flyover Hub',              lat: 13.0358, lng: 77.5970, load: 132, capacity: 170, status: 'YELLOW', distance: 5.5, wait_time: 7,  operator: 'Relux',         source: 'fallback' },
  { id: 12, name: 'EESL Banashankari TTMC',                lat: 12.9255, lng: 77.5468, load: 64,  capacity: 130, status: 'GREEN',  distance: 5.0, wait_time: 0,  operator: 'EESL',          source: 'fallback' },
  { id: 13, name: 'Shell Recharge Bellandur ORR',          lat: 12.9352, lng: 77.6815, load: 186, capacity: 220, status: 'YELLOW', distance: 4.8, wait_time: 11, operator: 'Shell Recharge', source: 'fallback' },
  { id: 14, name: 'BluSmart Airport Corridor Devanahalli', lat: 13.1986, lng: 77.7066, load: 96,  capacity: 180, status: 'GREEN',  distance: 23.6,wait_time: 0,  operator: 'BluSmart',      source: 'fallback' },
  { id: 15, name: 'Bescom Fast Charge KR Puram',           lat: 13.0075, lng: 77.6959, load: 151, capacity: 170, status: 'RED',    distance: 7.3, wait_time: 15, operator: 'BESCOM',        source: 'fallback' },
];

const fallbackState: SystemState = {
  zones: [
    { id: 1,  name: 'Indiranagar',        lat: 12.9784, lng: 77.6408, capacity: 1000, current_demand: 450, status: 'GREEN'  },
    { id: 2,  name: 'Koramangala',        lat: 12.9279, lng: 77.6271, capacity: 1000, current_demand: 520, status: 'YELLOW' },
    { id: 3,  name: 'Whitefield',         lat: 12.9698, lng: 77.7499, capacity: 1000, current_demand: 680, status: 'RED'    },
    { id: 4,  name: 'Electronic City',    lat: 12.8399, lng: 77.6770, capacity: 1000, current_demand: 380, status: 'GREEN'  },
    { id: 5,  name: 'Jayanagar',          lat: 12.9299, lng: 77.5826, capacity: 1000, current_demand: 420, status: 'GREEN'  },
    { id: 6,  name: 'MG Road',            lat: 12.9752, lng: 77.6060, capacity: 900,  current_demand: 470, status: 'YELLOW' },
    { id: 7,  name: 'Manyata Tech Park',  lat: 13.0420, lng: 77.6200, capacity: 850,  current_demand: 610, status: 'YELLOW' },
    { id: 8,  name: 'Yelahanka',          lat: 13.1007, lng: 77.5963, capacity: 760,  current_demand: 310, status: 'GREEN'  },
    { id: 9,  name: 'JP Nagar',           lat: 12.9063, lng: 77.5857, capacity: 820,  current_demand: 390, status: 'GREEN'  },
    { id: 10, name: 'Hebbal',             lat: 13.0358, lng: 77.5970, capacity: 880,  current_demand: 560, status: 'YELLOW' },
    { id: 11, name: 'Banashankari',       lat: 12.9255, lng: 77.5468, capacity: 760,  current_demand: 340, status: 'GREEN'  },
    { id: 12, name: 'Airport Corridor',   lat: 13.1986, lng: 77.7066, capacity: 950,  current_demand: 520, status: 'YELLOW' },
  ],
  stations: fallbackStations,
  total_demand: 5630,
  peak_load: 680,
  optimized_peak: 4410,
  reduction_percent: 21.7,
  alerts: [],
  timestamp: new Date().toISOString(),
  current_hour: new Date().getHours(),
  scenario: 'normal',
  data_source: 'fallback',
};

// ─── State management ────────────────────────────────────────────────────────
let cachedState: SystemState = fallbackState;
let isFetching = false;

export async function fetchSystemState(role: UserRole = 'operator'): Promise<SystemState> {
  if (isFetching) return cachedState;
  isFetching = true;

  try {
    // Operators get the full grid state; EV owners get nearby station data only
    const endpoint = role === 'operator' ? '/ev/state' : '/stations/nearby?lat=12.97&lng=77.59';

    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(10000),
    });

    const contentType = response.headers.get('content-type') || '';
    if (!response.ok || !contentType.includes('application/json')) {
      return fallbackState;
    }

    const payload = await response.json();

    if (role === 'user') {
      // For EV owners: wrap nearby stations into a minimal SystemState shape
      const stationsRaw = payload?.data ?? payload ?? [];
      const stations: Station[] = Array.isArray(stationsRaw)
        ? stationsRaw.map((s: any) => ({
            id: s.id,
            name: s.name || 'EV Station',
            lat: s.lat,
            lng: s.lng,
            load: s.current_load ?? s.load ?? 0,
            capacity: s.capacity ?? 150,
            status: s.status ?? 'GREEN',
            distance: s.distance_km ?? s.distance ?? 0,
            wait_time: s.queue_time ?? s.wait_time ?? 0,
            operator: s.operator,
            source: 'api',
          }))
        : fallbackStations;

      cachedState = {
        ...fallbackState,
        stations,
        data_source: 'real',
        timestamp: new Date().toISOString(),
      };
    } else {
      cachedState = (payload?.data ?? payload) as SystemState;
    }

    return cachedState;
  } catch (error) {
    return fallbackState;
  } finally {
    isFetching = false;
  }
}

export function getCachedState(): SystemState {
  return cachedState;
}

// ─── Subscription system ─────────────────────────────────────────────────────
let listeners: ((state: SystemState) => void)[] = [];

export function subscribeSystemState(listener: (state: SystemState) => void): () => void {
  listeners.push(listener);
  listener(cachedState);

  return () => {
    const idx = listeners.indexOf(listener);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}

function emitState() {
  for (const listener of listeners) {
    listener(cachedState);
  }
}

// ─── Polling engine ──────────────────────────────────────────────────────────
let started = false;
let currentRole: UserRole = 'operator';
let pollInterval: ReturnType<typeof setInterval> | null = null;

export function startSystemEngine(role: UserRole = 'operator') {
  currentRole = role;

  // Initial fetch immediately
  fetchSystemState(role).then(emitState);

  if (started) {
    // Role changed — clear and restart interval at new cadence
    if (pollInterval) clearInterval(pollInterval);
  }
  started = true;

  // Operators: 3s real-time; EV owners: 10s battery-friendly
  const interval = role === 'operator' ? 3000 : 10000;

  pollInterval = setInterval(async () => {
    await fetchSystemState(currentRole);
    emitState();
  }, interval);
}

// ─── Debug helpers ───────────────────────────────────────────────────────────
export async function getRawData() {
  try {
    const response = await fetch(`${API_URL}/ev/stations`);
    if (response.ok) return await response.json();
  } catch {}
  return null;
}

export async function setDemoScenario(scenario: string) {
  try {
    await fetch(`${API_URL}/ev/scenario`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario }),
    });
    await fetchSystemState(currentRole);
  } catch {}
}

// ─── XGBoost forecast helper ─────────────────────────────────────────────────
export async function fetchZoneForecast(zoneId: number, hours = 24) {
  try {
    const response = await fetch(`${API_URL}/forecast/zone/${zoneId}?hours=${hours}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return null;
    const payload = await response.json();
    return payload?.data ?? payload;
  } catch {
    return null;
  }
}
