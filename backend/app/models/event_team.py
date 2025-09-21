from sqlmodel import SQLModel, Field, Relationship, Index
from typing import Optional, TYPE_CHECKING
from datetime import datetime
import uuid
from sqlalchemy import Column, Integer, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID

if TYPE_CHECKING:
    from .event import Event
    from .team import Team

class EventTeam(SQLModel, table=True):
    """
    Association table for many-to-many relationship between Events and Teams.

    This table tracks which teams are participating in scheduled events,
    enabling queries for events by team and teams by event.
    """
    __tablename__ = "event_teams"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        sa_column=Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    )

    event_id: uuid.UUID = Field(
        foreign_key="events.id",
        sa_column=Column(UUID(as_uuid=True), ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    )

    team_id: int = Field(
        foreign_key="teams.id",
        sa_column=Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    )

    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime, nullable=False, default=datetime.utcnow)
    )

    # Relationships to parent tables
    event: Optional["Event"] = Relationship(back_populates="event_teams")
    team: Optional["Team"] = Relationship(back_populates="event_teams")

    __table_args__ = (
        # Prevent duplicate team assignments to the same event
        Index('ix_event_teams_unique_event_team', 'event_id', 'team_id', unique=True),
        # Optimize queries by event
        Index('ix_event_teams_event_id', 'event_id'),
        # Optimize queries by team
        Index('ix_event_teams_team_id', 'team_id'),
        # Optimize queries by creation date
        Index('ix_event_teams_created_at', 'created_at'),
    )

    def __repr__(self) -> str:
        return f"EventTeam(id={self.id}, event_id={self.event_id}, team_id={self.team_id})"