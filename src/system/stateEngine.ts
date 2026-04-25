// Central State Engine (Client-side Simulation)
// This module implements a tiny global state machine that acts as the single source of truth
// for the frontend. It updates every 3-5 seconds and notifies subscribers.

export type Zone = {
  id: number;
  name: string;
  lat: number;
  lng: number;
  capacity?: number;
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

export type PredictionPoint = {
  zone_id: number;
  predicted_demand: number;
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
  demand: DemandPoint[];
  predictions: PredictionPoint[];
  alerts: Alert[];
  timestamp: string;
};

// Initialize with a Bengaluru-like layout (demo-friendly data)
const initialZones: Zone[] = [
  { id: 1, name: 'Indiranagar', lat: 12.97, lng: 77.64, capacity: 1000 },
  { id: 2, name: 'Koramangala', lat: 12.92, lng: 77.63, capacity: 1000 },
  { id: 3, name: 'Whitefield', lat: 12.97, lng: 77.75, capacity: 1000 },
  { id: 4, name: 'Electronic City', lat: 12.83, lng: 77.67, capacity: 1000 },
  { id: 5, name: 'Jayanagar', lat: 12.93, lng: 77.58, capacity: 1000 },
];

const initialStations: Station[] = [
  { id: 1, name: 'Station A', lat: 12.97, lng: 77.64, load: 120, capacity: 300, status: 'GREEN', distance: 2.0, wait_time: 0 },
  { id: 2, name: 'Station B', lat: 12.96, lng: 77.63, load: 180, capacity: 400, status: 'YELLOW', distance: 3.5, wait_time: 2 },
  { id: 3, name: 'Station C', lat: 12.95, lng: 77.65, load: 260, capacity: 500, status: 'GREEN', distance: 4.2, wait_time: 1 },
  { id: 4, name: 'Station D', lat: 12.98, lng: 77.66, load: 80, capacity: 250, status: 'GREEN', distance: 1.8, wait_time: 0 },
];

export const system_state: SystemState = {
  zones: initialZones,
  stations: initialStations,
  demand: [],
  predictions: [],
  alerts: [],
  timestamp: new Date().toISOString(),
};

type Listener = (state: SystemState) => void;
const listeners: Listener[] = [];

let started = false;

function emit() {
  const snapshot = getSystemState();
  for (const l of listeners) l(snapshot);
}

function getSystemState(): SystemState {
  // return a deep-ish copy to avoid accidental mutation by consumers
  return JSON.parse(JSON.stringify(system_state)) as SystemState;
}

export function subscribeSystemState(listener: Listener): () => void {
  listeners.push(listener);
  // immediately notify new subscriber with current state
  listener(getSystemState());
  return () => {
    const i = listeners.indexOf(listener);
    if (i >= 0) listeners.splice(i, 1);
  };
}

export function startSystemEngine() {
  if (started) return;
  started = true;

  function updateSystemState() {
    // Update station loads with small random deltas
    for (const s of system_state.stations) {
      const delta = (Math.random() - 0.5) * 40; // +/- 20
      s.load = Math.max(0, Math.min(s.capacity, s.load + delta));
      // Update status based on load ratio
      const ratio = s.load / s.capacity;
      s.status = ratio > 0.85 ? 'RED' : ratio > 0.6 ? 'YELLOW' : 'GREEN';
      // Simple distance jitter to simulate proximity changes
      s.distance = Math.max(0.5, s.distance + (Math.random() - 0.5) * 0.2);
      // Wait times fluctuate a bit
      s.wait_time = Math.max(0, Math.round((s.wait_time + (Math.random() - 0.5) * 1.5) * 10) / 10);
    }

    // Update zone demand values
    // Ensure each zone has a current demand point
    for (const z of system_state.zones) {
      const factor = 0.9 + Math.random() * 0.3; // 0.9 - 1.2
      const current = system_state.demand.find(d => d.zone_id === z.id)?.demand ?? 300;
      const updated = Math.max(0, current * factor + (Math.random() - 0.5) * 40);
      const dp: DemandPoint = { zone_id: z.id, demand: updated, timestamp: new Date().toISOString() } as DemandPoint;
      // replace or push
      const existing = system_state.demand.find(d => d.zone_id === z.id);
      if (existing) {
        existing.demand = updated;
        existing.timestamp = dp.timestamp;
      } else {
        system_state.demand.push(dp);
      }
    }

    // Update predictions from current demand
    system_state.predictions = system_state.zones.map(z => {
      const current = system_state.demand.find(d => d.zone_id === z.id)?.demand ?? 300;
      const predicted = current * (0.95 + Math.random() * 0.1);
      return { zone_id: z.id, predicted_demand: predicted, timestamp: new Date().toISOString() } as PredictionPoint;
    });

    // Generate simple alerts if heavy demand
    const alerts: Alert[] = [];
    for (const z of system_state.zones) {
      const current = system_state.demand.find(d => d.zone_id === z.id)?.demand ?? 0;
      const threshold = (z.capacity ?? 1000) * 0.9;
      if (current > threshold) {
        alerts.push({ zone_id: z.id, alert_type: 'Overload', severity: 'High', message: `Zone ${z.name} overload (${current.toFixed(0)}).`, timestamp: new Date().toISOString() });
      }
    }
    system_state.alerts = alerts;

    system_state.timestamp = new Date().toISOString();
    emit();
  }

  // Seed initial update and then run on a 3-5s interval (randomized a bit)
  updateSystemState();
  setInterval(() => {
    updateSystemState();
  }, 3500);
}

export default startSystemEngine;
