const now = () => new Date().toISOString();

const zones = [
  { id: 1, name: 'Indiranagar', lat: 12.9784, lng: 77.6408, capacity: 1000, current_demand: 450, status: 'GREEN' },
  { id: 2, name: 'Koramangala', lat: 12.9279, lng: 77.6271, capacity: 1000, current_demand: 520, status: 'YELLOW' },
  { id: 3, name: 'Whitefield', lat: 12.9698, lng: 77.7499, capacity: 1000, current_demand: 680, status: 'RED' },
  { id: 4, name: 'Electronic City', lat: 12.8399, lng: 77.677, capacity: 1000, current_demand: 380, status: 'GREEN' },
  { id: 5, name: 'Jayanagar', lat: 12.9299, lng: 77.5826, capacity: 1000, current_demand: 420, status: 'GREEN' },
  { id: 6, name: 'MG Road', lat: 12.9752, lng: 77.606, capacity: 900, current_demand: 470, status: 'YELLOW' },
  { id: 7, name: 'Manyata Tech Park', lat: 13.042, lng: 77.62, capacity: 850, current_demand: 610, status: 'YELLOW' },
  { id: 8, name: 'Yelahanka', lat: 13.1007, lng: 77.5963, capacity: 760, current_demand: 310, status: 'GREEN' },
  { id: 9, name: 'JP Nagar', lat: 12.9063, lng: 77.5857, capacity: 820, current_demand: 390, status: 'GREEN' },
  { id: 10, name: 'Hebbal', lat: 13.0358, lng: 77.597, capacity: 880, current_demand: 560, status: 'YELLOW' },
  { id: 11, name: 'Banashankari', lat: 12.9255, lng: 77.5468, capacity: 760, current_demand: 340, status: 'GREEN' },
  { id: 12, name: 'Airport Corridor', lat: 13.1986, lng: 77.7066, capacity: 950, current_demand: 520, status: 'YELLOW' },
];

const stations = [
  { id: 1, name: 'Tata Power Indiranagar 100ft Road', lat: 12.9784, lng: 77.6408, load: 86, capacity: 160, status: 'GREEN', distance: 1.2, wait_time: 0, operator: 'Tata Power', source: 'vercel-api' },
  { id: 2, name: 'Ather Grid Koramangala 5th Block', lat: 12.9279, lng: 77.6271, load: 140, capacity: 180, status: 'YELLOW', distance: 2.1, wait_time: 8, operator: 'Ather', source: 'vercel-api' },
  { id: 3, name: 'ChargeZone Whitefield ITPL', lat: 12.9698, lng: 77.7499, load: 168, capacity: 180, status: 'RED', distance: 3.5, wait_time: 18, operator: 'ChargeZone', source: 'vercel-api' },
  { id: 4, name: 'EESL Electronic City Phase 1', lat: 12.8399, lng: 77.677, load: 92, capacity: 150, status: 'GREEN', distance: 5.2, wait_time: 0, operator: 'EESL', source: 'vercel-api' },
  { id: 5, name: 'ABB Jayanagar 4th Block', lat: 12.9299, lng: 77.5826, load: 105, capacity: 160, status: 'GREEN', distance: 2.8, wait_time: 0, operator: 'ABB', source: 'vercel-api' },
  { id: 6, name: 'Hubject MG Road Metro', lat: 12.9752, lng: 77.606, load: 124, capacity: 160, status: 'YELLOW', distance: 1.5, wait_time: 5, operator: 'Hubject', source: 'vercel-api' },
  { id: 7, name: 'Tata Power Forum South Bengaluru', lat: 12.917, lng: 77.625, load: 172, capacity: 200, status: 'YELLOW', distance: 3.2, wait_time: 10, operator: 'Tata Power', source: 'vercel-api' },
  { id: 8, name: 'Zeon Manyata Tech Park Gate 5', lat: 13.042, lng: 77.62, load: 72, capacity: 140, status: 'GREEN', distance: 6.1, wait_time: 0, operator: 'Zeon', source: 'vercel-api' },
  { id: 9, name: 'Ather Grid Yelahanka New Town', lat: 13.1007, lng: 77.5963, load: 58, capacity: 120, status: 'GREEN', distance: 9.4, wait_time: 0, operator: 'Ather', source: 'vercel-api' },
  { id: 10, name: 'ChargeZone JP Nagar Central', lat: 12.9063, lng: 77.5857, load: 116, capacity: 150, status: 'YELLOW', distance: 4.4, wait_time: 6, operator: 'ChargeZone', source: 'vercel-api' },
  { id: 11, name: 'Relux Hebbal Flyover Hub', lat: 13.0358, lng: 77.597, load: 132, capacity: 170, status: 'YELLOW', distance: 5.5, wait_time: 7, operator: 'Relux', source: 'vercel-api' },
  { id: 12, name: 'EESL Banashankari TTMC', lat: 12.9255, lng: 77.5468, load: 64, capacity: 130, status: 'GREEN', distance: 5, wait_time: 0, operator: 'EESL', source: 'vercel-api' },
  { id: 13, name: 'Shell Recharge Bellandur ORR', lat: 12.9352, lng: 77.6815, load: 186, capacity: 220, status: 'YELLOW', distance: 4.8, wait_time: 11, operator: 'Shell Recharge', source: 'vercel-api' },
  { id: 14, name: 'BluSmart Airport Corridor Devanahalli', lat: 13.1986, lng: 77.7066, load: 96, capacity: 180, status: 'GREEN', distance: 23.6, wait_time: 0, operator: 'BluSmart', source: 'vercel-api' },
  { id: 15, name: 'Bescom Fast Charge KR Puram', lat: 13.0075, lng: 77.6959, load: 151, capacity: 170, status: 'RED', distance: 7.3, wait_time: 15, operator: 'BESCOM', source: 'vercel-api' },
];

const state = () => ({
  zones,
  stations,
  total_demand: zones.reduce((sum, zone) => sum + zone.current_demand, 0),
  peak_load: Math.max(...zones.map((zone) => zone.current_demand)),
  optimized_peak: 4410,
  reduction_percent: 21.7,
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
