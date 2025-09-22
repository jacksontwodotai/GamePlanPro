from sqlmodel import SQLModel, Field, Index
from typing import Optional, TYPE_CHECKING
from datetime import datetime
import uuid
from enum import Enum
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID

if TYPE_CHECKING:
    from .event import Event


class ConflictType(str, Enum):
    VENUE_DOUBLE_BOOKING = "venue_double_booking"
    TEAM_OVERLAP = "team_overlap"
    TIME_OVERLAP = "time_overlap"


class Conflict(SQLModel, table=True):
    """
    Model for tracking scheduling conflicts between events.

    This table stores detected conflicts for audit purposes and
    to enable conflict resolution workflows.
    """
    __tablename__ = "conflicts"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        sa_column=Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    )

    # Primary event that has the conflict
    event_id: uuid.UUID = Field(
        sa_column=Column(UUID(as_uuid=True), ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    )

    # Conflicting event
    conflicting_event_id: uuid.UUID = Field(
        sa_column=Column(UUID(as_uuid=True), ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    )

    # Type of conflict detected
    conflict_type: ConflictType = Field(
        sa_column=Column(String(50), nullable=False)
    )

    # Human-readable description of the conflict
    description: str = Field(
        sa_column=Column(Text, nullable=False)
    )

    # Resource that caused the conflict (venue_id, team_id, etc.)
    resource_type: str = Field(
        sa_column=Column(String(50), nullable=False)
    )

    resource_id: str = Field(
        sa_column=Column(String(255), nullable=False)
    )

    # Severity level (1-10, 10 being critical)
    severity: int = Field(
        default=5,
        sa_column=Column(nullable=False)
    )

    # Whether this conflict has been resolved
    is_resolved: bool = Field(
        default=False,
        sa_column=Column(nullable=False, default=False)
    )

    # When the conflict was resolved
    resolved_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(DateTime, nullable=True)
    )

    # Who detected this conflict (system, user_id, etc.)
    detected_by: str = Field(
        default="system",
        sa_column=Column(String(255), nullable=False, default="system")
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
        Index('ix_conflicts_event_id', 'event_id'),
        Index('ix_conflicts_conflicting_event_id', 'conflicting_event_id'),
        Index('ix_conflicts_conflict_type', 'conflict_type'),
        Index('ix_conflicts_resource', 'resource_type', 'resource_id'),
        Index('ix_conflicts_is_resolved', 'is_resolved'),
        Index('ix_conflicts_created_at', 'created_at'),
    )