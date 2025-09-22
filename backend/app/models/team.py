from sqlmodel import SQLModel, Field, Relationship, Index
from typing import Optional, List, TYPE_CHECKING
from datetime import datetime
import uuid
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID

if TYPE_CHECKING:
    from .event_team import EventTeam

class Team(SQLModel, table=True):
    """
    Team model representing sports teams in the system.

    Teams can be associated with multiple events through the EventTeam
    association table, enabling many-to-many relationships.
    """
    __tablename__ = "teams"

    id: int = Field(
        sa_column=Column(Integer, primary_key=True, autoincrement=True)
    )

    name: str = Field(
        max_length=255,
        sa_column=Column(Text, nullable=False, unique=True)
    )

    organization: str = Field(
        sa_column=Column(Text, nullable=False)
    )

    division: Optional[str] = Field(
        default=None,
        sa_column=Column(Text, nullable=True)
    )

    age_group: Optional[str] = Field(
        default=None,
        sa_column=Column(Text, nullable=True)
    )

    skill_level: Optional[str] = Field(
        default=None,
        sa_column=Column(Text, nullable=True)
    )

    description: Optional[str] = Field(
        default=None,
        sa_column=Column(Text, nullable=True)
    )

    # UUID field for external references (existing in database)
    external_uuid: Optional[uuid.UUID] = Field(
        default_factory=uuid.uuid4,
        sa_column=Column(UUID(as_uuid=True), nullable=True, default=uuid.uuid4)
    )

    # Foreign key relationships to lookup tables
    division_id: Optional[uuid.UUID] = Field(
        default=None,
        sa_column=Column(UUID(as_uuid=True), ForeignKey("divisions.id"), nullable=True)
    )

    age_group_id: Optional[uuid.UUID] = Field(
        default=None,
        sa_column=Column(UUID(as_uuid=True), ForeignKey("age_groups.id"), nullable=True)
    )

    skill_level_id: Optional[uuid.UUID] = Field(
        default=None,
        sa_column=Column(UUID(as_uuid=True), ForeignKey("skill_levels.id"), nullable=True)
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
    event_teams: List["EventTeam"] = Relationship(back_populates="team")

    __table_args__ = (
        Index('ix_teams_name', 'name'),
        Index('ix_teams_organization', 'organization'),
        Index('ix_teams_division_id', 'division_id'),
        Index('ix_teams_age_group_id', 'age_group_id'),
        Index('ix_teams_skill_level_id', 'skill_level_id'),
        Index('ix_teams_created_at', 'created_at'),
    )

    def __repr__(self) -> str:
        return f"Team(id={self.id}, name='{self.name}', organization='{self.organization}')"