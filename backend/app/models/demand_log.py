from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base

class DemandLog(Base):
    __tablename__ = "demand_logs"

    id = Column(Integer, primary_key=True, index=True)
    zone_id = Column(Integer, ForeignKey("zones.id"), index=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    demand_value = Column(Float, nullable=False)