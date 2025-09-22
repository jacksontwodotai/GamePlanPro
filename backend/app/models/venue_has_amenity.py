from sqlmodel import SQLModel, Field, Index, Relationship
from typing import Optional, TYPE_CHECKING
from datetime import datetime
import uuid
from sqlalchemy import Column, Text, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID

if TYPE_CHECKING:
    from .venue import Venue
    from .venue_amenity import VenueAmenity


class VenueHasAmenity(SQLModel, table=True):
    __tablename__ = "venue_has_amenities"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        sa_column=Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    )
    venue_id: uuid.UUID = Field(
        sa_column=Column(UUID(as_uuid=True), ForeignKey("venues.id"), nullable=False)
    )
    amenity_id: uuid.UUID = Field(
        sa_column=Column(UUID(as_uuid=True), ForeignKey("venue_amenities.id"), nullable=False)
    )
    quantity: Optional[int] = Field(
        default=None,
        sa_column=Column(Integer, nullable=True)
    )
    notes: Optional[str] = Field(
        default=None,
        sa_column=Column(Text, nullable=True)
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime, nullable=False, default=datetime.utcnow)
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    )

    # Relationships
    venue: Optional["Venue"] = Relationship(back_populates="amenities")
    amenity: Optional["VenueAmenity"] = Relationship()

    __table_args__ = (
        Index('ix_venue_has_amenities_venue_id', 'venue_id'),
        Index('ix_venue_has_amenities_amenity_id', 'amenity_id'),
        Index('ix_venue_has_amenities_unique', 'venue_id', 'amenity_id', unique=True),
    )