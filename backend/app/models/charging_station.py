from sqlalchemy import Column, Integer, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class ChargingStation(Base):
    __tablename__ = "charging_stations"

    id = Column(Integer, primary_key=True, index=True)
    zone_id = Column(Integer, ForeignKey("zones.id"))
    capacity = Column(Float)  # kW
    current_load = Column(Float, default=0.0)  # kW
    price_per_kwh = Column(Float, default=0.25)  # $/kWh
    latitude = Column(Float)
    longitude = Column(Float)

    zone = relationship("Zone")