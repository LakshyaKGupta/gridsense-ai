// Central State Engine - uses backend real EV stations API
const API_URL = import.meta.env.VITE_API_URL ?? '';

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

// Fallback EV stations for when backend is unavailable
const fallbackStations: Station[] = [
  { id: 1, name: 'Tesla Supercharger Indiranagar', lat: 12.9784, lng: 77.6408, load: 180, capacity: 300, status: 'YELLOW', distance: 1.2, wait_time: 0, operator: 'Tesla', source: 'fallback' },
  { id: 2, name: 'ABL Charging Koramangala', lat: 12.9279, lng: 77.6271, load: 220, capacity: 300, status: 'RED', distance: 2.1, wait_time: 1.4, operator: 'ABL', source: 'fallback' },
  { id: 3, name: 'ChargePoint Whitefield', lat: 12.9698, lng: 77.7499, load: 95, capacity: 300, status: 'GREEN', distance: 3.5, wait_time: 0, operator: 'ChargePoint', source: 'fallback' },
  { id: 4, name: 'EESL Station Electronic City', lat: 12.8399, lng: 77.6770, load: 145, capacity: 300, status: 'GREEN', distance: 5.2, wait_time: 0, operator: 'EESL', source: 'fallback' },
  { id: 5, name: 'ABB Charging Jayanagar', lat: 12.9299, lng: 77.5826, load: 165, capacity: 300, status: 'GREEN', distance: 2.8, wait_time: 0, operator: 'ABB', source: 'fallback' },
  { id: 6, name: 'Hubject Charging MG Road', lat: 12.9752, lng: 77.6060, load: 200, capacity: 300, status: 'YELLOW', distance: 1.5, wait_time: 0, operator: 'Hubject', source: 'fallback' },
  { id: 7, name: 'Tata Power Forum', lat: 12.9170, lng: 77.6250, load: 250, capacity: 300, status: 'RED', distance: 3.2, wait_time: 2.0, operator: 'Tata Power', source: 'fallback' },
  { id: 8, name: 'Volta Charging Manyata', lat: 13.0350, lng: 77.5990, load: 75, capacity: 300, status: 'GREEN', distance: 6.1, wait_time: 0, operator: 'Volta', source: 'fallback' },
];

// Fallback data
const fallbackState: SystemState = {
  zones: [
    { id: 1, name: 'Indiranagar', lat: 12.9784, lng: 77.6408, capacity: 1000, current_demand: 450, status: 'GREEN' },
    { id: 2, name: 'Koramangala', lat: 12.9279, lng: 77.6271, capacity: 1000, current_demand: 520, status: 'YELLOW' },
    { id: 3, name: 'Whitefield', lat: 12.9698, lng: 77.7499, capacity: 1000, current_demand: 680, status: 'RED' },
    { id: 4, name: 'Electronic City', lat: 12.8399, lng: 77.6770, capacity: 1000, current_demand: 380, status: 'GREEN' },
    { id: 5, name: 'Jayanagar', lat: 12.9299, lng: 77.5826, capacity: 1000, current_demand: 420, status: 'GREEN' },
  ],
  stations: fallbackStations,
  total_demand: 2450,
  peak_load: 680,
  optimized_peak: 2000,
  reduction_percent: 18,
  alerts: [],
  timestamp: new Date().toISOString(),
  current_hour: new Date().getHours(),
  scenario: 'normal',
  data_source: 'fallback'
};

// State management
let cachedState: SystemState = fallbackState;
let isFetching = false;

export async function fetchSystemState(): Promise<SystemState> {
  if (isFetching) return cachedState;
  
  isFetching = true;
  
  try {
    const response = await fetch(`${API_URL}/ev/state`, {
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(10000)
    });
    
    if (!response.ok) {
      console.warn('EV State API unavailable, using fallback');
      return fallbackState;
    }
    
    const data = await response.json();
    cachedState = data as SystemState;
    
    console.log('System State:', {
      zonesCount: cachedState.zones?.length || 0,
      stationsCount: cachedState.stations?.length || 0,
      dataSource: cachedState.data_source
    });
    
    return cachedState;
  } catch (error) {
    console.warn('System state fetch failed:', error);
    return fallbackState;
  } finally {
    isFetching = false;
  }
}

export function getCachedState(): SystemState {
  return cachedState;
}

// Subscription system
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

// Start polling engine
let started = false;

export function startSystemEngine() {
  if (started) return;
  started = true;
  
  // Initial fetch
  fetchSystemState().then(emitState);
  
  // Poll every 3 seconds
  setInterval(async () => {
    await fetchSystemState();
    emitState();
  }, 3000);
}

// Debug helpers
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
      body: JSON.stringify({ scenario })
    });
    // Refresh state after scenario change
    await fetchSystemState();
  } catch {}
}