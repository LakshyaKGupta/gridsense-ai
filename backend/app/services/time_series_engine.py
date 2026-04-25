import math
import random
from datetime import datetime, timedelta
from typing import Dict, List, Optional

class TimeSeriesEngine:
    """
    Realistic time-series engine for EV grid demand forecasting.
    Generates smooth, believable demand patterns based on time of day.
    """
    
    # Base demand patterns (24 hours)
    BASE_PATTERN = [
        180,  # 12 AM - 1 AM: Night low
        160,  # 1-2 AM
        150,  # 2-3 AM  
        145,  # 3-4 AM: Night minimum
        150,  # 4-5 AM
        180,  # 5-6 AM: Pre-morning rise
        280,  # 6-7 AM: Morning commute start
        380,  # 7-8 AM
        450,  # 8-9 AM: Morning peak
        420,  # 9-10 AM
        380,  # 10-11 AM
        360,  # 11-12 PM
        380,  # 12-1 PM: Lunch demand
        370,  # 1-2 PM
        365,  # 2-3 PM
        380,  # 3-4 PM
        420,  # 4-5 PM: Pre-evening
        520,  # 5-6 PM: Evening rush
        650,  # 6-7 PM
        780,  # 7-8 PM: Peak evening
        820,  # 8-9 PM: Maximum peak
        750,  # 9-10 PM: Evening wind-down
        550,  # 10-11 PM
        350,  # 11-12 AM
        250,   # 12-1 AM
    ]
    
    # Confidence decay rates (per hour)
    DECAY_RATES = {
        'hourly': 0.02,      # 2% decay per hour
        'daily': 0.04,       # 4% decay per day
    }
    
    BASE_CONFIDENCE = 0.92
    
    def __init__(self, zone_count: int = 5, station_per_zone: int = 4):
        self.zone_count = zone_count
        self.station_per_zone = station_per_zone
        self.zones = self._initialize_zones()
        self.current_hour = datetime.now().hour
        self.scenario_modifiers = {
            'evening_peak': {'hours': [18, 19, 20, 21], 'multiplier': 1.3},
            'high_growth': {'multiplier': 1.5},
            'station_outage': {'affected_zones': [], 'multiplier': 2.0}
        }
        
    def _initialize_zones(self) -> List[Dict]:
        """Initialize zone data with time-series storage."""
        return [
            {
                'id': i + 1,
                'name': ['Indiranagar', 'Koramangala', 'Whitefield', 'Electronic City', 'Jayanagar'][i],
                'lat': [12.9784, 12.9279, 12.9698, 12.8399, 12.9299][i],
                'lng': [77.6408, 77.6271, 77.7499, 77.6770, 77.5826][i],
                'capacity': 1000,
                'base_demand_modifier': 0.8 + random.random() * 0.4,
                'time_series': self._generate_zone_time_series(),
            }
            for i in range(self.zone_count)
        ]
    
    def _generate_zone_time_series(self) -> Dict[str, List[float]]:
        """Generate realistic multi-day time series for a zone."""
        base = self.BASE_PATTERN.copy()
        
        # Add zone-specific noise (±5%)
        noise = [random.uniform(-0.05, 0.05) for _ in range(24)]
        
        # Generate 4 days of data
        time_series = {}
        for day_offset in range(4):
            day_data = []
            for hour in range(24):
                # Apply time-based variation
                base_value = base[hour]
                noise_value = noise[hour] * base_value
                day_variation = random.uniform(-0.08, 0.08) * base_value
                capacity_limit = (day_offset * 0.02)  # Slight day-to-day growth
                
                value = base_value + noise_value + day_variation + (capacity_limit * base_value)
                value = max(100, min(900, value))  # Clamp to realistic range
                day_data.append(value)
            
            day_key = f'day_{day_offset}' if day_offset > 0 else 'today'
            time_series[day_key] = day_data
        
        return time_series
    
    def get_current_demand(self, zone_id: int) -> float:
        """Get current demand for a zone with smooth interpolation."""
        zone = next((z for z in self.zones if z['id'] == zone_id), None)
        if not zone:
            return 0.0
        
        current_ts = zone['time_series']['today']
        hour = self.current_hour
        
        # Smooth interpolation between hours
        current = current_ts[hour]
        next_hour = current_ts[(hour + 1) % 24]
        minute_fraction = datetime.now().minute / 60
        value = current + (next_hour - current) * minute_fraction
        
        # Apply scenario modifiers
        if self.scenario_modifiers['evening_peak']['multiplier'] != 1.0:
            if hour in self.scenario_modifiers['evening_peak']['hours']:
                value *= self.scenario_modifiers['evening_peak']['multiplier']
        
        return max(50, value * zone['base_demand_modifier'])
    
    def get_predictions(self, zone_id: int, hours_ahead: int = 24) -> Dict:
        """
        Generate predictions with confidence decay.
        """
        zone = next((z for z in self.zones if z['id'] == zone_id), None)
        if not zone:
            return {'values': [], 'confidence': 0}
        
        predictions = []
        now = datetime.now()
        
        for h in range(1, hours_ahead + 1):
            future_hour = (self.current_hour + h) % 24
            future_day_offset = h // 24
            
            # Get appropriate day's data
            day_key = f'day_{future_day_offset}' if future_day_offset > 0 else 'today'
            ts_data = zone['time_series'].get(day_key, zone['time_series']['today'])
            
            # Get base value with smoothing
            base_value = ts_data[future_hour]
            
            # Apply smoothing (rolling average effect)
            if h > 1:
                prev = predictions[-1]['value']
                base_value = prev * 0.7 + base_value * 0.3
            
            # Apply scenario modifiers
            if h <= 6:  # Near-term predictions
                confidence = self.BASE_CONFIDENCE - (h * self.DECAY_RATES['hourly'])
            elif h <= 24:  # 6-24 hours
                confidence = self.BASE_CONFIDENCE - (6 * self.DECAY_RATES['hourly']) - ((h - 6) * self.DECAY_RATES['hourly'] * 0.5)
            else:  # Multi-day
                confidence = 0.75 - ((h - 24) * self.DECAY_RATES['daily'])
            
            confidence = max(0.4, min(0.95, confidence))
            
            predictions.append({
                'hour': h,
                'value': max(50, base_value * zone['base_demand_modifier']),
                'confidence': confidence,
                'datetime': (now + timedelta(hours=h)).isoformat()
            })
        
        return {
            'values': predictions,
            'summary': {
                'next_6h_avg': sum(p['value'] for p in predictions[:6]) / 6,
                'next_24h_avg': sum(p['value'] for p in predictions[:24]) / 24,
                'peak_value': max(p['value'] for p in predictions[:24]),
                'peak_hour': predictions[max(range(24), key=lambda i: predictions[i]['value'])]['hour'],
                'confidence_trend': 'stable' if abs(predictions[0]['confidence'] - predictions[-1]['confidence']) < 0.1 else 'decaying'
            }
        }
    
    def get_multi_day_forecast(self, zone_id: int) -> Dict:
        """Get multi-day forecast with day-by-day data."""
        zone = next((z for z in self.zones if z['id'] == zone_id), None)
        if not zone:
            return {}
        
        forecast = {}
        now = datetime.now()
        
        for day_offset in range(4):
            day_key = f'day_{day_offset}' if day_offset > 0 else 'today'
            ts_data = zone['time_series'].get(day_key, [])
            
            if ts_data:
                forecast[day_key] = {
                    'date': (now + timedelta(days=day_offset)).strftime('%Y-%m-%d'),
                    'label': 'Today' if day_offset == 0 else f'+{day_offset} Day' if day_offset == 1 else f'+{day_offset} Days',
                    'data': [
                        {'hour': h, 'value': max(50, v * zone['base_demand_modifier'])}
                        for h, v in enumerate(ts_data)
                    ],
                    'peak': max(v * zone['base_demand_modifier'] for v in ts_data),
                    'average': sum(v * zone['base_demand_modifier'] for v in ts_data) / 24
                }
        
        return forecast
    
    def get_recommendations(self, zone_id: int) -> List[Dict]:
        """
        Generate intelligent recommendations based on predictions.
        """
        predictions = self.get_predictions(zone_id, 24)
        
        if not predictions.get('values'):
            return []
        
        recommendations = []
        summary = predictions['summary']
        
        # Check for upcoming peaks
        if summary['peak_hour'] in [18, 19, 20, 21]:  # Evening peak hours
            recommendations.append({
                'type': 'peak_avoidance',
                'priority': 'high',
                'message': f"Peak demand expected at {summary['peak_hour']}:00. Consider charging before 5 PM.",
                'suggested_hour': 16,
                'savings': f"~{int((summary['peak_value'] - summary['next_24h_avg']) / summary['peak_value'] * 100)}%"
            })
        
        # Check current load vs predicted
        current = self.get_current_demand(zone_id)
        future_avg = summary['next_6h_avg']
        
        if current > future_avg * 1.2:
            recommendations.append({
                'type': 'current_high',
                'priority': 'medium',
                'message': f"Current demand ({int(current)} kW) is above average. Wait times may increase.",
                'suggested_hour': None,
                'savings': None
            })
        
        # Suggest optimal charging windows
        if predictions['values']:
            low_demand_hours = [
                p['hour'] for p in predictions['values'][:12] 
                if p['value'] < summary['next_24h_avg'] * 0.8
            ]
            if low_demand_hours:
                recommendations.append({
                    'type': 'optimal_window',
                    'priority': 'low',
                    'message': f"Best charging windows: {', '.join(map(str, low_demand_hours[:3]))}:00",
                    'suggested_hour': low_demand_hours[0],
                    'savings': '~15-25%'
                })
        
        return recommendations
    
    def get_system_state(self) -> Dict:
        """Get complete system state for frontend."""
        # Update current hour
        self.current_hour = datetime.now().hour
        
        zones_data = []
        total_demand = 0
        
        for zone in self.zones:
            current = self.get_current_demand(zone['id'])
            predictions = self.get_predictions(zone['id'], 24)
            recommendations = self.get_recommendations(zone['id'])
            
            total_demand += current
            
            # Determine status based on demand
            if current > zone['capacity'] * 0.85:
                status = 'RED'
            elif current > zone['capacity'] * 0.6:
                status = 'YELLOW'
            else:
                status = 'GREEN'
            
            zones_data.append({
                'id': zone['id'],
                'name': zone['name'],
                'lat': zone['lat'],
                'lng': zone['lng'],
                'capacity': zone['capacity'],
                'current_demand': current,
                'status': status,
                'predictions': predictions,
                'recommendations': recommendations
            })
        
        # Generate stations based on zone demand
        stations = []
        for zone in zones_data:
            zone_demand = zone['current_demand']
            station_count = self.station_per_zone
            
            for i in range(station_count):
                # Derive station load from zone demand
                base_load = zone_demand / station_count
                load_variation = base_load * random.uniform(-0.15, 0.15)
                station_load = max(20, min(zone['capacity'] // 2, base_load + load_variation))
                
                # Calculate distance from zone center
                distance = random.uniform(0.5, 4.0)
                wait_time = max(0, (station_load / 50) - 3) if station_load > 150 else 0
                
                stations.append({
                    'id': zone['id'] * 10 + i + 1,
                    'name': f"{zone['name']} Station {i+1}",
                    'lat': zone['lat'] + random.uniform(-0.02, 0.02),
                    'lng': zone['lng'] + random.uniform(-0.02, 0.02),
                    'load': station_load,
                    'capacity': zone['capacity'] // station_count,
                    'status': 'RED' if station_load > zone['capacity'] // station_count * 0.85 else 'YELLOW' if station_load > zone['capacity'] // station_count * 0.6 else 'GREEN',
                    'distance': distance,
                    'wait_time': round(wait_time, 1)
                })
        
        # Generate alerts based on demand
        alerts = []
        for zone in zones_data:
            if zone['current_demand'] > zone['capacity'] * 0.85:
                alerts.append({
                    'zone_id': zone['id'],
                    'alert_type': 'High Demand',
                    'severity': 'critical' if zone['current_demand'] > zone['capacity'] * 0.9 else 'warning',
                    'message': f"Zone {zone['id']} ({zone['name']}) approaching capacity at {int(zone['current_demand'])} kW",
                    'timestamp': datetime.now().isoformat()
                })
        
        return {
            'zones': zones_data,
            'stations': stations,
            'total_demand': total_demand,
            'peak_load': max(z['current_demand'] for z in zones_data),
            'optimized_peak': total_demand * 0.82,
            'reduction_percent': int((1 - 0.82) * 100),
            'alerts': alerts,
            'timestamp': datetime.now().isoformat(),
            'current_hour': self.current_hour,
            'scenario': self.get_active_scenario()
        }
    
    def get_active_scenario(self) -> Optional[str]:
        """Get currently active scenario."""
        if self.scenario_modifiers['evening_peak']['multiplier'] != 1.0:
            return 'evening_peak'
        if self.scenario_modifiers['high_growth']['multiplier'] != 1.0:
            return 'high_growth'
        if self.scenario_modifiers['station_outage']['affected_zones']:
            return 'station_outage'
        return None
    
    def set_scenario(self, scenario: str):
        """Activate a demo scenario."""
        # Reset all modifiers
        self.scenario_modifiers = {
            'evening_peak': {'hours': [18, 19, 20, 21], 'multiplier': 1.3 if scenario == 'evening_peak' else 1.0},
            'high_growth': {'multiplier': 1.5 if scenario == 'high_growth' else 1.0},
            'station_outage': {'affected_zones': [3] if scenario == 'station_outage' else [], 'multiplier': 2.0}
        }
        
        # Regenerate time series with new patterns
        for zone in self.zones:
            zone['time_series'] = self._generate_zone_time_series()


# Global time series engine instance
_engine = TimeSeriesEngine()


def get_system_state() -> Dict:
    """Get current system state."""
    return _engine.get_system_state()


def get_zone_predictions(zone_id: int) -> Dict:
    """Get predictions for a specific zone."""
    return _engine.get_predictions(zone_id)


def get_multi_day_forecast(zone_id: int) -> Dict:
    """Get multi-day forecast for a zone."""
    return _engine.get_multi_day_forecast(zone_id)


def get_recommendations(zone_id: int) -> List[Dict]:
    """Get recommendations for a zone."""
    return _engine.get_recommendations(zone_id)


def set_demo_scenario(scenario: str):
    """Activate a demo scenario."""
    _engine.set_scenario(scenario)