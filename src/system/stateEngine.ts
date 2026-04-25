// Central State Engine - uses backend time-series API
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export type Zone = {
  id: number;
  name: string;
  lat: number;
  lng: number;
  capacity: number;
  current_demand: number;
  status: 'GREEN' | 'YELLOW' | 'RED';
  predictions?: any;
  recommendations?: any[];
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
};

export type DemandPoint = {
  zone_id: number;
  demand: number;
  timestamp: string;
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
};

// Fallback data for offline/error state
const fallbackState: SystemState = {
  zones: [
    { id: 1, name: 'Indiranagar', lat: 12.9784, lng: 77.6408, capacity: 1000, current_demand: 450, status: 'GREEN' },
    { id: 2, name: 'Koramangala', lat: 12.9279, lng: 77.6271, capacity: 1000, current_demand: 520, status: 'YELLOW' },
    { id: 3, name: 'Whitefield', lat: 12.9698, lng: 77.7499, capacity: 1000, current_demand: 680, status: 'RED' },
    { id: 4, name: 'Electronic City', lat: 12.8399, lng: 77.6770, capacity: 1000, current_demand: 380, status: 'GREEN' },
    { id: 5, name: 'Jayanagar', lat: 12.9299, lng: 77.5826, capacity: 1000, current_demand: 420, status: 'GREEN' },
  ],
  stations: [],
  total_demand: 2450,
  peak_load: 680,
  optimized_peak: 2000,
  reduction_percent: 18,
  alerts: [],
  timestamp: new Date().toISOString(),
  current_hour: new Date().getHours(),
  scenario: 'normal'
};

// Fetch from backend API
let cachedState: SystemState = fallbackState;

export async function fetchSystemState(): Promise<SystemState> {
  try {
    const response = await fetch(`${API_URL}/system/state`, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      console.warn('System API unavailable, using fallback data');
      return fallbackState;
    }
    
    const data = await response.json();
    cachedState = data as SystemState;
    return cachedState;
  } catch (error) {
    console.warn('System state fetch failed:', error);
    return fallbackState;
  }
}

export function getCachedState(): SystemState {
  return cachedState;
}

// Background fetch with caching
let started = false;
let listeners: ((state: SystemState) => void)[] = [];

export function subscribeSystemState(listener: (state: SystemState) => void): () => void {
  listeners.push(listener);
  listener(cachedState); // immediate callback with current state
  return () => {
    const i = listeners.indexOf(listener);
    if (i >= 0) listeners.splice(i, 1);
  };
}

export function emitState() {
  for (const listener of listeners) {
    listener(cachedState);
  }
}

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

// For debugging
export async function getRawData() {
  try {
    const response = await fetch(`${API_URL}/system/validation/raw`);
    if (response.ok) return await response.json();
  } catch {}
  return null;
}