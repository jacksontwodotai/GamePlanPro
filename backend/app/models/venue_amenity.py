from sqlmodel import SQLModel, Field, Index
from typing import Optional
from datetime import datetime
import uuid
from sqlalchemy import Column, String, Text, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID


class VenueAmenity(SQLModel, table=True):
    __tablename__ = "venue_amenities"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        sa_column=Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    )
    name: str = Field(
        max_length=255,
        sa_column=Column(String(255), unique=True, nullable=False)
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

    __table_args__ = (
        Index('ix_venue_amenities_name', 'name'),
        Index('ix_venue_amenities_is_active', 'is_active'),
    )