from sqlmodel import SQLModel, Field, Relationship, Index
from typing import Optional
from datetime import datetime
import uuid
from enum import Enum
from sqlalchemy import Column, String, Text, DateTime, Boolean, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from pydantic import validator

class EventType(str, Enum):
    PRACTICE = "Practice"
    GAME = "Game"
    MEETING = "Meeting"
    TOURNAMENT = "Tournament"
    OTHER = "Other"

class Event(SQLModel, table=True):
    __tablename__ = "events"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        sa_column=Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    )
    name: str = Field(
        max_length=255,
        sa_column=Column(String(255), nullable=False)
    )
    description: Optional[str] = Field(
        default=None,
        sa_column=Column(Text, nullable=True)
    )
    event_type: EventType = Field(
        sa_column=Column(String(50), nullable=False)
    )
    start_time: datetime = Field(
        sa_column=Column(DateTime, nullable=False)
    )
    end_time: datetime = Field(
        sa_column=Column(DateTime, nullable=False)
    )
    venue_id: Optional[uuid.UUID] = Field(
        default=None,
        foreign_key="venues.id",
        sa_column=Column(UUID(as_uuid=True), ForeignKey("venues.id", ondelete="SET NULL"), nullable=True)
    )
    created_by_user_id: uuid.UUID = Field(
        sa_column=Column(UUID(as_uuid=True), nullable=False)
    )
    is_recurring: bool = Field(
        default=False,
        sa_column=Column(Boolean, nullable=False, default=False)
    )
    recurrence_rule: Optional[str] = Field(
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

    # Relationship to venue
    venue: Optional["Venue"] = Relationship(back_populates="events")

    @validator('end_time')
    def validate_end_time_after_start(cls, v, values):
        if 'start_time' in values and v <= values['start_time']:
            raise ValueError('end_time must be after start_time')
        return v

    __table_args__ = (
        CheckConstraint('start_time < end_time', name='check_start_before_end'),
        Index('ix_events_start_time', 'start_time'),
        Index('ix_events_end_time', 'end_time'),
        Index('ix_events_event_type', 'event_type'),
        Index('ix_events_venue_id', 'venue_id'),
        Index('ix_events_created_by_user_id', 'created_by_user_id'),
        Index('ix_events_is_recurring', 'is_recurring'),
    )