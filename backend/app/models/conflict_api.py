from sqlmodel import SQLModel, Field
from typing import Optional, TYPE_CHECKING
from datetime import datetime
import uuid
from enum import Enum
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID

if TYPE_CHECKING:
    from .event import Event
    from .venue import Venue
    from .team import Team


class ConflictType(str, Enum):
    """
    Enumeration of conflict types for scheduling conflicts.

    Values match the exact requirements from work order 103.
    """
    TIME_OVERLAP = "TimeOverlap"
    VENUE_CONFLICT = "VenueConflict"
    TEAM_CONFLICT = "TeamConflict"


class ConflictAPI(SQLModel, table=True):
    """
    Conflict API model for representing detected scheduling conflicts in API responses.

    This model provides a structured format for communicating conflict information
    to clients, enabling the conflict detection system to deliver detailed conflict
    data for resolution workflows.

    Model designed to match exact requirements from work order 103.
    """
    __tablename__ = "conflicts_api"

    # Unique identifier for each conflict instance
    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        sa_column=Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        description="UUID primary key that uniquely identifies each conflict instance"
    )

    # Type of scheduling conflict
    conflict_type: ConflictType = Field(
        sa_column=Column(String(50), nullable=False),
        description="ENUM categorizing the type of scheduling conflict"
    )

    # Human-readable explanation of the conflict
    description: str = Field(
        sa_column=Column(Text, nullable=False),
        description="Human-readable explanation of the conflict details"
    )

    # First event involved in the conflict
    conflicting_event_id_1: uuid.UUID = Field(
        sa_column=Column(UUID(as_uuid=True), ForeignKey("events.id", ondelete="CASCADE"), nullable=False),
        description="UUID foreign key to Event.id identifying the first event involved in the conflict"
    )

    # Second event when conflict involves two specific events (nullable)
    conflicting_event_id_2: Optional[uuid.UUID] = Field(
        default=None,
        sa_column=Column(UUID(as_uuid=True), ForeignKey("events.id", ondelete="CASCADE"), nullable=True),
        description="Nullable UUID foreign key to Event.id identifying the second event when conflict involves two specific events"
    )

    # Venue when conflict is venue-related (nullable)
    conflicting_venue_id: Optional[uuid.UUID] = Field(
        default=None,
        sa_column=Column(UUID(as_uuid=True), ForeignKey("venues.id", ondelete="SET NULL"), nullable=True),
        description="Nullable UUID foreign key to Venue.id identifying the venue when conflict is venue-related"
    )

    # Team when conflict is team-related (nullable)
    conflicting_team_id: Optional[int] = Field(
        default=None,
        sa_column=Column(Integer, ForeignKey("teams.id", ondelete="SET NULL"), nullable=True),
        description="Nullable foreign key to Team.id identifying the team when conflict is team-related"
    )

    # When the conflict period begins
    start_time: datetime = Field(
        sa_column=Column(DateTime, nullable=False),
        description="TIMESTAMP indicating when the conflict period begins"
    )

    # When the conflict period ends
    end_time: datetime = Field(
        sa_column=Column(DateTime, nullable=False),
        description="TIMESTAMP indicating when the conflict period ends"
    )

    def __repr__(self) -> str:
        return f"<ConflictAPI(id={self.id}, type={self.conflict_type}, start={self.start_time})>"

    class Config:
        """Pydantic configuration for the model."""
        use_enum_values = True
        validate_assignment = True
        arbitrary_types_allowed = True