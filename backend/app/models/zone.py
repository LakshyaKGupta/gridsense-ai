from sqlalchemy import Column, Integer, String, Float
from app.database import Base

class Zone(Base):
    __tablename__ = "zones"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    lat_center = Column(Float)
    lng_center = Column(Float)