from sqlalchemy import Column, Integer, DateTime, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class ChargingSession(Base):
    __tablename__ = "charging_sessions"

    id = Column(Integer, primary_key=True, index=True)
    station_id = Column(Integer, ForeignKey("charging_stations.id"))
    start_time = Column(DateTime)
    end_time = Column(DateTime, nullable=True)
    energy_used = Column(Float, default=0.0)  # kWh
    cost = Column(Float, default=0.0)  # Total cost in $

    station = relationship("ChargingStation")