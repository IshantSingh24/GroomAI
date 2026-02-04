from sqlalchemy.orm import declarative_base
from sqlalchemy import Column, Integer, String, Float

Base = declarative_base()

class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)
    item_name = Column(String, index=True)
    item_price = Column(Float)
    reason = Column(String)
 