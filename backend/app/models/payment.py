from sqlmodel import SQLModel, Field, Relationship
from uuid import UUID, uuid4
from datetime import datetime
from decimal import Decimal
from typing import Optional, Dict, Any
from enum import Enum
import json

class PaymentStatus(str, Enum):
    PENDING = "Pending"
    PROCESSING = "Processing"
    COMPLETED = "Completed"
    FAILED = "Failed"
    CANCELLED = "Cancelled"
    REFUNDED = "Refunded"

class PaymentMethod(str, Enum):
    CREDIT_CARD = "Credit Card"
    DEBIT_CARD = "Debit Card"
    BANK_TRANSFER = "Bank Transfer"
    CASH = "Cash"
    CHECK = "Check"
    PAYPAL = "PayPal"
    OTHER = "Other"

class Payment(SQLModel, table=True):
    __tablename__ = "payments"

    id: UUID = Field(default_factory=uuid4, primary_key=True)

    # Foreign keys
    registration_id: UUID = Field(foreign_key="registrations.id")

    # Payment details
    amount: Decimal
    payment_method: PaymentMethod
    status: PaymentStatus = Field(default=PaymentStatus.PENDING)

    # Payment method details (stored as JSON)
    payment_method_details: Optional[str] = Field(default=None)

    # Transaction information
    transaction_id: Optional[str] = Field(max_length=255, default=None)
    gateway_transaction_id: Optional[str] = Field(max_length=255, default=None)
    gateway_response: Optional[str] = Field(default=None)

    # Processing information
    processed_at: Optional[datetime] = Field(default=None)
    gateway_fee: Optional[Decimal] = Field(default=None)

    # Metadata
    notes: Optional[str] = Field(default=None)
    failure_reason: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    registration: Optional["Registration"] = Relationship(back_populates="payments")

    def set_payment_method_details(self, details: Dict[str, Any]):
        """Set payment method details as JSON string"""
        self.payment_method_details = json.dumps(details)

    def get_payment_method_details(self) -> Dict[str, Any]:
        """Get payment method details as dictionary"""
        if self.payment_method_details:
            try:
                return json.loads(self.payment_method_details)
            except json.JSONDecodeError:
                return {}
        return {}

    def mark_completed(self, transaction_id: str = None, gateway_transaction_id: str = None):
        """Mark payment as completed"""
        self.status = PaymentStatus.COMPLETED
        self.processed_at = datetime.utcnow()
        if transaction_id:
            self.transaction_id = transaction_id
        if gateway_transaction_id:
            self.gateway_transaction_id = gateway_transaction_id
        self.updated_at = datetime.utcnow()

    def mark_failed(self, reason: str = None):
        """Mark payment as failed"""
        self.status = PaymentStatus.FAILED
        self.processed_at = datetime.utcnow()
        if reason:
            self.failure_reason = reason
        self.updated_at = datetime.utcnow()