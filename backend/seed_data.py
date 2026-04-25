#!/usr/bin/env python3
"""
Data seeding script for EV Charging Optimization platform
"""

import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.models import User, Zone, ChargingStation, ChargingSession, DemandLog

def seed_data():
    """Seed the database with sample data"""
    db = SessionLocal()

    try:
        print("🌱 Seeding database...")

        # Create admin user (check if exists)
        existing_admin = db.query(User).filter(User.email == "admin@evcharging.com").first()
        if not existing_admin:
            admin = User(
                email="admin@evcharging.com",
                password_hash="$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewfBPj6fM9q7F6W",  # password: admin123
                role="admin"
            )
            db.add(admin)

        # Create demo user (check if exists)
        existing_demo = db.query(User).filter(User.email == "demo@example.com").first()
        if not existing_demo:
            from app.utils.auth import get_password_hash
            demo = User(
                email="demo@example.com",
                password_hash=get_password_hash("password123"),
                role="operator"
            )
            db.add(demo)

        # Create zones (check if they exist)
        existing_zones = db.query(Zone).count()
        if existing_zones == 0:
            zones_data = [
                {"name": "Downtown", "lat_center": 40.7128, "lng_center": -74.0060},
                {"name": "Midtown", "lat_center": 40.7589, "lng_center": -73.9851},
                {"name": "Brooklyn", "lat_center": 40.6782, "lng_center": -73.9442},
                {"name": "Queens", "lat_center": 40.7282, "lng_center": -73.7949},
                {"name": "Bronx", "lat_center": 40.8448, "lng_center": -73.8648},
            ]

            zones = []
            for zone_data in zones_data:
                zone = Zone(**zone_data)
                db.add(zone)
                zones.append(zone)

            db.commit()  # Commit to get IDs
        else:
            zones = db.query(Zone).all()

        # Create charging stations (check if they exist)
        existing_stations = db.query(ChargingStation).count()
        if existing_stations == 0:
            station_types = [
                {"capacity": 22, "price_per_kwh": 0.35},
                {"capacity": 11, "price_per_kwh": 0.30},
                {"capacity": 7.4, "price_per_kwh": 0.25},
                {"capacity": 3.7, "price_per_kwh": 0.20},
            ]

            stations = []
            for zone in zones:
                # 10-20 stations per zone
                num_stations = random.randint(10, 20)
                for i in range(num_stations):
                    station_type = random.choice(station_types)
                    station = ChargingStation(
                        zone_id=zone.id,
                        capacity=station_type["capacity"],
                        price_per_kwh=station_type["price_per_kwh"],
                        latitude=zone.lat_center + random.uniform(-0.01, 0.01),
                        longitude=zone.lng_center + random.uniform(-0.01, 0.01)
                    )
                    db.add(station)
                    stations.append(station)

            db.commit()  # Commit to get station IDs
        else:
            stations = db.query(ChargingStation).all()

        # Create historical charging sessions (last 30 days)
        print("📊 Creating historical charging sessions...")
        base_date = datetime.now() - timedelta(days=30)

        for day in range(30):
            current_date = base_date + timedelta(days=day)

            for station in stations:
                # 0-3 sessions per station per day
                num_sessions = random.randint(0, 3)

                for _ in range(num_sessions):
                    # Random start time during the day
                    start_hour = random.randint(6, 22)
                    start_time = current_date.replace(hour=start_hour, minute=random.randint(0, 59))

                    # Duration 1-6 hours
                    duration_hours = random.randint(1, 6)
                    end_time = start_time + timedelta(hours=duration_hours)

                    # Energy used (realistic for the duration and capacity)
                    max_energy = min(station.capacity * duration_hours, 50)  # Cap at 50 kWh
                    energy_used = random.uniform(max_energy * 0.5, max_energy)

                    session = ChargingSession(
                        station_id=station.id,
                        start_time=start_time,
                        end_time=end_time,
                        energy_used=energy_used,
                        cost=energy_used * station.price_per_kwh
                    )
                    db.add(session)

        # Create demand logs
        print("📈 Creating demand logs...")
        for zone in zones:
            for day in range(30):
                current_date = base_date + timedelta(days=day)

                for hour in range(24):
                    timestamp = current_date.replace(hour=hour)

                    # Generate realistic demand based on time of day
                    base_demand = 20  # Base demand
                    if 6 <= hour <= 10:  # Morning peak
                        base_demand += 30
                    elif 17 <= hour <= 21:  # Evening peak
                        base_demand += 50
                    elif hour >= 22 or hour <= 5:  # Night
                        base_demand = 10

                    # Add randomness
                    demand = base_demand + random.uniform(-10, 10)
                    demand = max(0, demand)

                    demand_log = DemandLog(
                        zone_id=zone.id,
                        timestamp=timestamp,
                        demand_value=demand
                    )
                    db.add(demand_log)

        db.commit()
        print("✅ Database seeded successfully!")
        print(f"   - {len(zones)} zones created")
        print(f"   - {len(stations)} charging stations created")
        print("   - Historical sessions and demand logs added")

    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    # Create tables
    Base.metadata.create_all(bind=engine)
    seed_data()