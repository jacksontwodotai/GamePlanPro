from sqlmodel import SQLModel, Field, Relationship, Index
from typing import Optional, List, TYPE_CHECKING
from datetime import datetime
import uuid
from enum import Enum
from sqlalchemy import Column, String, Text, DateTime, Boolean, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from pydantic import validator

if TYPE_CHECKING:
    from .event import Event
    from .team import Team

class NotificationType(str, Enum):
    """Enum for notification delivery types"""
    EMAIL = "Email"
    SMS = "SMS"
    IN_APP = "InApp"

class NotificationStatus(str, Enum):
    """Enum for notification delivery status"""
    SENT = "Sent"
    FAILED = "Failed"
    DELIVERED = "Delivered"
    READ = "Read"

class UserNotificationPreference(SQLModel, table=True):
    """
    User notification preferences for schedule communications.

    Stores how users want to receive notifications for events,
    with optional team-specific settings.
    """
    __tablename__ = "user_notification_preferences"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        sa_column=Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    )

    user_id: int = Field(
        sa_column=Column(Integer, ForeignKey("users.id"), nullable=False)
    )

    notification_type: NotificationType = Field(
        sa_column=Column(String(50), nullable=False)
    )

    event_change_notifications: bool = Field(
        default=True,
        sa_column=Column(Boolean, nullable=False, default=True)
    )

    team_id: Optional[int] = Field(
        default=None,
        sa_column=Column(Integer, ForeignKey("teams.id"), nullable=True)
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
    team: Optional["Team"] = Relationship(back_populates="notification_preferences")

    __table_args__ = (
        # Indexes for performance
        Index('ix_user_notification_preferences_user_id', 'user_id'),
        Index('ix_user_notification_preferences_team_id', 'team_id'),
        Index('ix_user_notification_preferences_notification_type', 'notification_type'),
        Index('ix_user_notification_preferences_user_team', 'user_id', 'team_id'),
        # Unique constraint to prevent duplicate preferences for same user/team/type
        Index('ix_user_notification_preferences_unique', 'user_id', 'team_id', 'notification_type', unique=True),
    )

class SentScheduleNotification(SQLModel, table=True):
    """
    Log of all schedule notifications sent to users.

    Maintains an audit trail of communications sent about schedule changes,
    including delivery status and content.
    """
    __tablename__ = "sent_schedule_notifications"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        sa_column=Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    )

    event_id: uuid.UUID = Field(
        sa_column=Column(UUID(as_uuid=True), ForeignKey("events.id"), nullable=False)
    )

    notification_template_id: Optional[uuid.UUID] = Field(
        default=None,
        sa_column=Column(UUID(as_uuid=True), nullable=True)
    )

    recipient_user_id: int = Field(
        sa_column=Column(Integer, ForeignKey("users.id"), nullable=False)
    )

    sent_at: datetime = Field(
        sa_column=Column(DateTime, nullable=False)
    )

    delivery_method: NotificationType = Field(
        sa_column=Column(String(50), nullable=False)
    )

    content_sent: str = Field(
        sa_column=Column(Text, nullable=False)
    )

    status: NotificationStatus = Field(
        default=NotificationStatus.SENT,
        sa_column=Column(String(50), nullable=False, default=NotificationStatus.SENT.value)
    )

    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column=Column(DateTime, nullable=False, default=datetime.utcnow)
    )

    # Relationships
    event: Optional["Event"] = Relationship(back_populates="sent_notifications")

    @validator('sent_at')
    def validate_sent_at_not_future(cls, v):
        if v > datetime.utcnow():
            raise ValueError('sent_at cannot be in the future')
        return v

    __table_args__ = (
        # Indexes for performance
        Index('ix_sent_schedule_notifications_event_id', 'event_id'),
        Index('ix_sent_schedule_notifications_recipient_user_id', 'recipient_user_id'),
        Index('ix_sent_schedule_notifications_delivery_method', 'delivery_method'),
        Index('ix_sent_schedule_notifications_status', 'status'),
        Index('ix_sent_schedule_notifications_sent_at', 'sent_at'),
        Index('ix_sent_schedule_notifications_created_at', 'created_at'),
        # Composite indexes for common queries
        Index('ix_sent_schedule_notifications_event_user', 'event_id', 'recipient_user_id'),
        Index('ix_sent_schedule_notifications_user_status', 'recipient_user_id', 'status'),
    )