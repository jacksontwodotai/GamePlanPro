from sqlmodel import SQLModel, Field, Index, Relationship
from typing import Optional, List, TYPE_CHECKING
from datetime import datetime
import uuid
from sqlalchemy import Column, String, Text, Integer, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID

if TYPE_CHECKING:
    from .event import Event
    from .venue_has_amenity import VenueHasAmenity

class Venue(SQLModel, table=True):
    __tablename__ = "venues"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        sa_column=Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    )
    name: str = Field(
        max_length=255,
        sa_column=Column(String(255), unique=True, nullable=False)
    )
    address: Optional[str] = Field(
        default=None,
        sa_column=Column(Text, nullable=True)
    )
    city: Optional[str] = Field(
        default=None,
        max_length=100,
        sa_column=Column(String(100), nullable=True)
    )
    state: Optional[str] = Field(
        default=None,
        max_length=100,
        sa_column=Column(String(100), nullable=True)
    )
    zip_code: Optional[str] = Field(
        default=None,
        max_length=20,
        sa_column=Column(String(20), nullable=True)
    )
    capacity: Optional[int] = Field(
        default=None,
        sa_column=Column(Integer, nullable=True)
    )
    description: Optional[str] = Field(
        default=None,
        sa_column=Column(Text, nullable=True)
    )
    is_active: bool = Field(
        default=True,
        sa_column=Column(Boolean, nullable=False, default=True)
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime, nullable=False, default=datetime.utcnow)
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    )

    # Relationship to events
    events: List["Event"] = Relationship(back_populates="venue")

    # Relationship to amenities
    amenities: List["VenueHasAmenity"] = Relationship(back_populates="venue")

    __table_args__ = (
        Index('ix_venues_name', 'name'),
        Index('ix_venues_city', 'city'),
        Index('ix_venues_is_active', 'is_active'),
    )