from sqlmodel import SQLModel, Field, Relationship
from uuid import UUID, uuid4
from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from enum import Enum

class RegistrationStatus(str, Enum):
    PENDING = "Pending"
    PARTIAL = "Partial"
    COMPLETE = "Complete"
    CANCELLED = "Cancelled"

class Registration(SQLModel, table=True):
    __tablename__ = "registrations"

    id: UUID = Field(default_factory=uuid4, primary_key=True)

    # Registration details
    participant_name: str = Field(max_length=255)
    participant_email: str = Field(max_length=255)
    participant_phone: Optional[str] = Field(max_length=50, default=None)
    participant_date_of_birth: Optional[datetime] = Field(default=None)

    # Program/Event information
    program_name: str = Field(max_length=255)
    program_description: Optional[str] = Field(default=None)

    # Financial information
    total_amount: Decimal = Field(decimal_places=2, max_digits=10)
    amount_paid: Decimal = Field(decimal_places=2, max_digits=10, default=Decimal('0.00'))
    balance_due: Decimal = Field(decimal_places=2, max_digits=10, default=Decimal('0.00'))

    # Status and timestamps
    status: RegistrationStatus = Field(default=RegistrationStatus.PENDING)
    registration_date: datetime = Field(default_factory=datetime.utcnow)
    due_date: Optional[datetime] = Field(default=None)

    # Metadata
    notes: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    payments: List["Payment"] = Relationship(back_populates="registration")

    def update_payment_status(self):
        """Update registration status based on payment amounts"""
        self.balance_due = self.total_amount - self.amount_paid

        if self.amount_paid >= self.total_amount:
            self.status = RegistrationStatus.COMPLETE
        elif self.amount_paid > 0:
            self.status = RegistrationStatus.PARTIAL
        else:
            self.status = RegistrationStatus.PENDING

        self.updated_at = datetime.utcnow()