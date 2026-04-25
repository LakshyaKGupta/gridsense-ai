from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import extract
from app.database import SessionLocal
from app.models import ChargingSession, Zone, DemandLog
from app.utils.cache import get_cache, set_cache
from typing import Tuple, List, Dict
import asyncio

class DemandPredictor:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.trained = False

    def train_model(self, zone_id: int):
        """Train model on historical data for a zone"""
        db = SessionLocal()
        try:
            # Get last 30 days of data
            end_date = datetime.now()
            start_date = end_date - timedelta(days=30)

            sessions = db.query(ChargingSession).join(ChargingSession.station).filter(
                ChargingSession.start_time >= start_date,
                ChargingSession.station.has(zone_id=zone_id)
            ).all()

            if len(sessions) < 10:
                return False  # Not enough data

            # Aggregate by hour
            hourly_data = {}
            for session in sessions:
                hour = session.start_time.replace(minute=0, second=0, microsecond=0)
                if hour not in hourly_data:
                    hourly_data[hour] = 0
                hourly_data[hour] += session.energy_used or 0

            # Create features
            X = []
            y = []
            for hour, demand in hourly_data.items():
                features = [
                    hour.hour,  # hour of day
                    hour.weekday(),  # day of week
                    1 if hour.weekday() >= 5 else 0,  # weekend
                    demand  # previous demand (for now, use current)
                ]
                X.append(features)
                y.append(demand)

            if len(X) < 5:
                return False

            X = np.array(X)
            y = np.array(y)

            self.scaler.fit(X)
            X_scaled = self.scaler.transform(X)

            self.model = LinearRegression()
            self.model.fit(X_scaled, y)
            self.trained = True
            return True

        finally:
            db.close()

    def predict_demand(self, zone_id: int, target_datetime: datetime) -> Tuple[float, float, List[str]]:
        """Predict demand with confidence and factors"""
        cache_key = f"demand_{zone_id}_{target_datetime.isoformat()}"
        cached = get_cache(cache_key)
        if cached:
            return cached['demand'], cached['confidence'], cached['factors']

        # Try to train model if not trained
        if not self.trained:
            self.train_model(zone_id)

        if self.trained:
            # Use model
            features = np.array([[
                target_datetime.hour,
                target_datetime.weekday(),
                1 if target_datetime.weekday() >= 5 else 0,
                50  # fallback previous demand
            ]])

            features_scaled = self.scaler.transform(features)
            prediction = max(0, self.model.predict(features_scaled)[0])
            confidence = 0.75  # Simplified
            factors = ["ML model prediction", "historical patterns"]
        else:
            # Heuristic fallback
            base_demand = 30
            hour_factor = 1 + 0.5 * (1 if 18 <= target_datetime.hour <= 22 else 0)  # evening peak
            weekday_factor = 1.2 if target_datetime.weekday() < 5 else 0.8
            prediction = base_demand * hour_factor * weekday_factor
            confidence = 0.5
            factors = ["heuristic estimation", "evening peak" if hour_factor > 1 else "off-peak"]

        result = {
            'demand': float(prediction),
            'confidence': confidence,
            'factors': factors
        }
        set_cache(cache_key, result, 1800)  # Cache for 30 min

        # Log the prediction
        asyncio.create_task(self._log_demand(zone_id, prediction))

        return prediction, confidence, factors

    async def forecast_demand(self, zone_id: int, hours: int = 24) -> Dict:
        """Generate hourly forecast with confidence intervals"""
        forecasts = []
        base_time = datetime.now()

        for h in range(hours):
            target_time = base_time + timedelta(hours=h)

            # Get prediction
            demand, confidence, factors = self.predict_demand(zone_id, target_time)

            # Calculate confidence interval (simplified)
            std_dev = demand * (1 - confidence) * 0.5
            confidence_lower = max(0, demand - 1.96 * std_dev)
            confidence_upper = demand + 1.96 * std_dev

            # Calculate moving average baseline
            baseline = self._calculate_moving_average_baseline(zone_id, target_time)

            forecasts.append({
                'hour': h,
                'predicted_demand': demand,
                'confidence_lower': confidence_lower,
                'confidence_upper': confidence_upper,
                'baseline_demand': baseline
            })

        # Calculate model accuracy (simplified)
        model_accuracy = confidence if self.trained else 0.5

        # Compare with baseline
        avg_predicted = np.mean([f['predicted_demand'] for f in forecasts])
        avg_baseline = np.mean([f['baseline_demand'] for f in forecasts])

        if avg_predicted > avg_baseline * 1.1:
            comparison = "Model predicts higher demand than baseline"
        elif avg_predicted < avg_baseline * 0.9:
            comparison = "Model predicts lower demand than baseline"
        else:
            comparison = "Model aligns with baseline"

        # Convert numpy types to native Python types for JSON serialization
        def _to_native(x):
            try:
                return float(x)
            except:
                return x

        for f in forecasts:
            f['predicted_demand'] = _to_native(f['predicted_demand'])
            f['confidence_lower'] = _to_native(f['confidence_lower'])
            f['confidence_upper'] = _to_native(f['confidence_upper'])
            f['baseline_demand'] = _to_native(f['baseline_demand'])

        return {
            'zone_id': int(zone_id),
            'forecasts': forecasts,
            'model_accuracy': float(model_accuracy),
            'baseline_comparison': comparison
        }

    def _calculate_moving_average_baseline(self, zone_id: int, target_time: datetime) -> float:
        """Calculate 7-day moving average baseline"""
        db = SessionLocal()
        try:
            # Get data from same hour over last 7 days
            start_date = target_time - timedelta(days=7)
            end_date = target_time

            logs = db.query(DemandLog).filter(
                DemandLog.zone_id == zone_id,
                DemandLog.timestamp >= start_date,
                DemandLog.timestamp <= end_date,
                extract("hour", DemandLog.timestamp) == target_time.hour
            ).all()

            if logs:
                return np.mean([log.demand_value for log in logs])
            else:
                # Fallback to heuristic
                return 30 * (1.5 if 18 <= target_time.hour <= 22 else 1.0)

        finally:
            db.close()

    async def _log_demand(self, zone_id: int, demand_value: float):
        """Log demand value to database"""
        try:
            db = SessionLocal()
            log_entry = DemandLog(
                zone_id=zone_id,
                demand_value=demand_value
            )
            db.add(log_entry)
            db.commit()
        except Exception as e:
            print(f"Error logging demand: {e}")
        finally:
            db.close()