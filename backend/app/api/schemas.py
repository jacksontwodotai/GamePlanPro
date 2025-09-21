from pydantic import BaseModel, validator
from typing import List, Optional
from datetime import datetime
from uuid import UUID

from app.models.event import EventType

class EventCreate(BaseModel):
    name: str
    description: Optional[str] = None
    event_type: EventType
    start_time: datetime
    end_time: datetime
    venue_id: Optional[UUID] = None
    is_recurring: bool = False
    recurrence_rule: Optional[str] = None
    team_ids: Optional[List[int]] = []

    @validator('end_time')
    def validate_end_time_after_start(cls, v, values):
        if 'start_time' in values and v <= values['start_time']:
            raise ValueError('end_time must be after start_time')
        return v

class EventUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    event_type: Optional[EventType] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    venue_id: Optional[UUID] = None
    is_recurring: Optional[bool] = None
    recurrence_rule: Optional[str] = None
    team_ids: Optional[List[int]] = None

    @validator('end_time')
    def validate_end_time_after_start(cls, v, values):
        if 'start_time' in values and v and values['start_time'] and v <= values['start_time']:
            raise ValueError('end_time must be after start_time')
        return v

class VenueCreate(BaseModel):
    name: str
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    capacity: Optional[int] = None
    description: Optional[str] = None
    is_active: bool = True

class VenueUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    capacity: Optional[int] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class VenueResponse(BaseModel):
    id: UUID
    name: str
    address: Optional[str]
    city: Optional[str]
    state: Optional[str]
    zip_code: Optional[str]
    capacity: Optional[int]
    description: Optional[str]
    is_active: bool

    class Config:
        from_attributes = True

class EventResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    event_type: EventType
    start_time: datetime
    end_time: datetime
    venue_id: Optional[UUID]
    venue: Optional[VenueResponse]
    is_recurring: bool
    recurrence_rule: Optional[str]
    created_by_user_id: int
    created_at: datetime
    updated_at: datetime
    team_ids: List[int] = []

    class Config:
        from_attributes = True

class TeamAssociation(BaseModel):
    team_ids: List[int]

class ErrorResponse(BaseModel):
    detail: str