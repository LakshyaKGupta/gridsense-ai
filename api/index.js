const now = () => new Date().toISOString();

const zones = [
  { id: 1, name: 'Indiranagar', lat: 12.9784, lng: 77.6408, capacity: 1000, current_demand: 450, status: 'GREEN' },
  { id: 2, name: 'Koramangala', lat: 12.9279, lng: 77.6271, capacity: 1000, current_demand: 520, status: 'YELLOW' },
  { id: 3, name: 'Whitefield', lat: 12.9698, lng: 77.7499, capacity: 1000, current_demand: 680, status: 'RED' },
  { id: 4, name: 'Electronic City', lat: 12.8399, lng: 77.677, capacity: 1000, current_demand: 380, status: 'GREEN' },
  { id: 5, name: 'Jayanagar', lat: 12.9299, lng: 77.5826, capacity: 1000, current_demand: 420, status: 'GREEN' },
];

const stations = [
  { id: 1, name: 'Tata Power Indiranagar', lat: 12.9784, lng: 77.6408, load: 86, capacity: 160, status: 'GREEN', distance: 1.2, wait_time: 0, operator: 'Tata Power', source: 'vercel-api' },
  { id: 2, name: 'Ather Grid Koramangala', lat: 12.9279, lng: 77.6271, load: 140, capacity: 180, status: 'YELLOW', distance: 2.1, wait_time: 8, operator: 'Ather', source: 'vercel-api' },
  { id: 3, name: 'ChargeZone Whitefield', lat: 12.9698, lng: 77.7499, load: 168, capacity: 180, status: 'RED', distance: 3.5, wait_time: 18, operator: 'ChargeZone', source: 'vercel-api' },
  { id: 4, name: 'EESL Electronic City', lat: 12.8399, lng: 77.677, load: 92, capacity: 150, status: 'GREEN', distance: 5.2, wait_time: 0, operator: 'EESL', source: 'vercel-api' },
  { id: 5, name: 'ABB Jayanagar', lat: 12.9299, lng: 77.5826, load: 105, capacity: 160, status: 'GREEN', distance: 2.8, wait_time: 0, operator: 'ABB', source: 'vercel-api' },
  { id: 6, name: 'Hubject MG Road', lat: 12.9752, lng: 77.606, load: 124, capacity: 160, status: 'YELLOW', distance: 1.5, wait_time: 5, operator: 'Hubject', source: 'vercel-api' },
];

const state = () => ({
  zones,
  stations,
  total_demand: zones.reduce((sum, zone) => sum + zone.current_demand, 0),
  peak_load: Math.max(...zones.map((zone) => zone.current_demand)),
  optimized_peak: 2000,
  reduction_percent: 18,
  alerts: [
    {
      zone_id: 3,
      alert_type: 'Overload Warning',
      severity: 'High',
      message: 'Whitefield feeder is approaching overload. Shift flexible charging to 11 PM - 5 AM.',
      timestamp: now(),
    },
  ],
  timestamp: now(),
  current_hour: new Date().getHours(),
  scenario: 'competition-demo',
  data_source: 'fallback',
});

const forecast = (zoneId, hours = 24) => ({
  zone_id: zoneId,
  forecasts: Array.from({ length: hours }, (_, hour) => {
    const eveningPeak = hour >= 17 && hour <= 21 ? 1.35 : 1;
    const morningPeak = hour >= 7 && hour <= 9 ? 1.15 : 1;
    const base = 260 + Math.sin((hour / 24) * Math.PI) * 280;
    const predicted = Math.round(base * eveningPeak * morningPeak);
    return {
      hour,
      predicted_demand: predicted,
      confidence_lower: Math.round(predicted * 0.88),
      confidence_upper: Math.round(predicted * 1.12),
      error_range: [Math.round(predicted * 0.88), Math.round(predicted * 1.12)],
      confidence_tier: hour < 12 ? 'High' : 'Medium',
      baseline_demand: Math.round(base),
    };
  }),
  model_accuracy: 0.92,
  baseline_comparison: 'AI optimized plan lowers the evening feeder peak by 18-24% versus unmanaged charging.',
});

const optimization = (zoneId) => ({
  recommended_windows: [
    { station_id: 1, windows: [{ hour: 23, power: 46, percentage: 92 }, { hour: 0, power: 50, percentage: 100 }] },
    { station_id: 4, windows: [{ hour: 1, power: 42, percentage: 84 }, { hour: 2, power: 36, percentage: 72 }] },
  ],
  reason: `Zone ${zoneId}: shift flexible sessions away from 6-10 PM into low-load night windows while keeping driver preference constraints.`,
  confidence: 0.9,
});

function send(res, data, status = 200) {
  res.status(status).json({
    success: status < 400,
    timestamp: Date.now(),
    data,
    explanation: ['Dummy backend is active on Vercel for demo reliability.'],
  });
}

export default function handler(req, res) {
  const path = req.url.split('?')[0].replace(/^\/api/, '') || '/';
  const zoneMatch = path.match(/\/(?:demand|forecast|optimize|impact)\/(\d+)/);
  const zoneId = zoneMatch ? Number(zoneMatch[1]) : 1;

  if (path === '/' || path === '/health') return send(res, { message: 'GridSense demo API online' });
  if (path === '/ev/state') return send(res, state());
  if (path === '/ev/stations' || path === '/stations/nearby') return send(res, stations);
  if (path === '/dashboard/summary') return send(res, state());
  if (path === '/alerts' || path === '/alerts/') return send(res, state().alerts);
  if (path === '/realtime/demand') {
    return send(res, zones.map((zone) => ({ zone_id: zone.id, current_demand: zone.current_demand, trend: zone.status === 'RED' ? 'increasing' : 'stable', timestamp: now() })));
  }
  if (path.startsWith('/demand/')) return send(res, { demand: zones[zoneId - 1]?.current_demand ?? 420, confidence: 0.91, factors: ['Evening commute', 'Mall traffic', 'Transformer headroom'] });
  if (path.startsWith('/forecast/')) return send(res, forecast(zoneId));
  if (path.startsWith('/optimize/')) return send(res, optimization(zoneId));
  if (path.startsWith('/impact/')) return send(res, { before_peak: 890, after_peak: 680, reduction_percent: 23.6, zone_id: zoneId });
  if (path === '/locations/recommend') return send(res, zones.map((zone) => ({ zone_id: zone.id, zone_name: zone.name, score: 96 - zone.id * 5, justification: 'High EV growth, feeder headroom, and coverage gap.' })));
  if (path === '/locations/roi' || path === '/locations/roi/') return send(res, zones.slice(0, 3).map((zone) => ({ zone_id: zone.id, zone_name: zone.name, expected_utilization: 80 + zone.id, estimated_roi: 18 + zone.id * 2, payback_period_months: 16 + zone.id, justification: 'Strong utilization and avoided peak upgrade cost.' })));
  if (path === '/simulate/run') return send(res, { time_series: forecast(1).forecasts.map((point) => ({ hour: point.hour, demand: point.predicted_demand, active_sessions: Math.round(point.predicted_demand / 18) })), total_sessions: 1250, peak_demand: 890 });
  if (path === '/advanced/data/status') return send(res, { is_real_data: false });
  if (path === '/advanced/baselines/compare') return send(res, { no_optimization: { peak_load: 890, utilization: '96%', cost_efficiency: 'Low' }, ai_optimized: { peak_load: 680, utilization: '73%', cost_efficiency: 'High', improvement: '23.6% lower peak' } });
  if (path === '/advanced/model/metrics') return send(res, { mae: 42.3, rmse: 58.7, mape: 8.9, data_points: 17520, validation_note: 'Synthetic Bengaluru validation set.' });

  return send(res, { message: `No dummy route configured for ${path}` }, 404);
}
