from pydantic import BaseModel, validator
from typing import List, Optional, Dict, Any
from datetime import datetime
from uuid import UUID
from decimal import Decimal

from app.models.event import EventType
from app.models.payment import PaymentMethod, PaymentStatus
from app.models.registration import RegistrationStatus

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

class VenueAmenityCreate(BaseModel):
    name: str
    description: Optional[str] = None

class VenueAmenityUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class VenueAmenityResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class VenueAmenityAssociationCreate(BaseModel):
    amenity_id: UUID
    quantity: Optional[int] = None
    notes: Optional[str] = None

class VenueAmenityAssociationUpdate(BaseModel):
    quantity: Optional[int] = None
    notes: Optional[str] = None

class VenueAmenityAssociationResponse(BaseModel):
    id: UUID
    venue_id: UUID
    amenity_id: UUID
    quantity: Optional[int]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    amenity: Optional[VenueAmenityResponse] = None

    class Config:
        from_attributes = True

class VenueAmenityAssociationListCreate(BaseModel):
    associations: List[VenueAmenityAssociationCreate]

class ErrorResponse(BaseModel):
    detail: str

# Registration schemas
class RegistrationCreate(BaseModel):
    participant_name: str
    participant_email: str
    participant_phone: Optional[str] = None
    participant_date_of_birth: Optional[datetime] = None
    program_name: str
    program_description: Optional[str] = None
    total_amount: Decimal
    due_date: Optional[datetime] = None
    notes: Optional[str] = None

class RegistrationUpdate(BaseModel):
    participant_name: Optional[str] = None
    participant_email: Optional[str] = None
    participant_phone: Optional[str] = None
    participant_date_of_birth: Optional[datetime] = None
    program_name: Optional[str] = None
    program_description: Optional[str] = None
    total_amount: Optional[Decimal] = None
    status: Optional[RegistrationStatus] = None
    due_date: Optional[datetime] = None
    notes: Optional[str] = None

class RegistrationResponse(BaseModel):
    id: UUID
    participant_name: str
    participant_email: str
    participant_phone: Optional[str]
    participant_date_of_birth: Optional[datetime]
    program_name: str
    program_description: Optional[str]
    total_amount: Decimal
    amount_paid: Decimal
    balance_due: Decimal
    status: RegistrationStatus
    registration_date: datetime
    due_date: Optional[datetime]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Payment schemas
class PaymentMethodDetails(BaseModel):
    """Flexible schema for payment method details"""
    card_last_four: Optional[str] = None
    card_type: Optional[str] = None
    bank_name: Optional[str] = None
    account_last_four: Optional[str] = None
    check_number: Optional[str] = None
    other_details: Optional[Dict[str, Any]] = None

class PaymentCreate(BaseModel):
    registration_id: UUID
    amount: Decimal
    payment_method: PaymentMethod
    payment_method_details: Optional[PaymentMethodDetails] = None
    notes: Optional[str] = None

    @validator('amount')
    def validate_amount_positive(cls, v):
        if v <= 0:
            raise ValueError('Amount must be positive')
        return v

class PaymentUpdate(BaseModel):
    status: Optional[PaymentStatus] = None
    transaction_id: Optional[str] = None
    gateway_transaction_id: Optional[str] = None
    gateway_response: Optional[str] = None
    gateway_fee: Optional[Decimal] = None
    failure_reason: Optional[str] = None
    notes: Optional[str] = None

class PaymentResponse(BaseModel):
    id: UUID
    registration_id: UUID
    amount: Decimal
    payment_method: PaymentMethod
    status: PaymentStatus
    transaction_id: Optional[str]
    gateway_transaction_id: Optional[str]
    processed_at: Optional[datetime]
    gateway_fee: Optional[Decimal]
    notes: Optional[str]
    failure_reason: Optional[str]
    created_at: datetime
    updated_at: datetime
    registration: Optional[RegistrationResponse] = None

    class Config:
        from_attributes = True

class PaymentListResponse(BaseModel):
    payments: List[PaymentResponse]
    total: int
    page: int
    per_page: int
    has_next: bool
    has_prev: bool