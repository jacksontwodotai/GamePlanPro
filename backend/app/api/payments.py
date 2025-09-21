from fastapi import APIRouter, HTTPException, Depends, Query, status
from sqlmodel import Session, select, and_
from typing import List, Optional
from uuid import UUID
from decimal import Decimal
import uuid

from app.database.connection import get_session
from app.models.payment import Payment, PaymentStatus
from app.models.registration import Registration
from app.api.schemas import (
    PaymentCreate,
    PaymentUpdate,
    PaymentResponse,
    PaymentListResponse,
    PaymentMethodDetails,
    ErrorResponse
)
from app.api.auth import get_current_user

# Simple auth bypass for testing
def get_test_user():
    from app.api.auth import User
    return User(id=1, email="test@example.com", role="admin")

router = APIRouter()

@router.post("/payments/process", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
def process_payment(
    payment_data: PaymentCreate,
    session: Session = Depends(get_session),
    current_user = Depends(get_test_user)
):
    """Process a new payment for a registration"""
    try:
        # Validate registration exists
        registration = session.get(Registration, payment_data.registration_id)
        if not registration:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Registration not found"
            )

        # Validate payment amount doesn't exceed balance due
        if payment_data.amount > registration.balance_due:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Payment amount ({payment_data.amount}) cannot exceed balance due ({registration.balance_due})"
            )

        # Create payment record
        payment = Payment(
            registration_id=payment_data.registration_id,
            amount=payment_data.amount,
            payment_method=payment_data.payment_method,
            status=PaymentStatus.PENDING,
            notes=payment_data.notes
        )

        # Set payment method details if provided
        if payment_data.payment_method_details:
            payment.set_payment_method_details(payment_data.payment_method_details.dict(exclude_none=True))

        # Generate transaction ID
        payment.transaction_id = f"TXN-{uuid.uuid4().hex[:12].upper()}"

        session.add(payment)
        session.flush()  # Flush to get the payment ID

        # Update registration with payment amount
        registration.amount_paid += payment_data.amount
        registration.update_payment_status()

        session.add(registration)
        session.commit()
        session.refresh(payment)

        # Load registration for response
        payment.registration = registration

        return PaymentResponse.from_orm(payment)

    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/payments", response_model=PaymentListResponse)
def get_payments(
    registration_id: Optional[UUID] = Query(None, description="Filter by registration ID"),
    status_filter: Optional[PaymentStatus] = Query(None, alias="status", description="Filter by payment status"),
    method: Optional[str] = Query(None, description="Filter by payment method"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(50, ge=1, le=100, description="Items per page"),
    session: Session = Depends(get_session),
    current_user = Depends(get_test_user)
):
    """Get paginated list of payments with optional filtering"""
    try:
        # Build query
        statement = select(Payment)

        # Apply filters
        conditions = []

        if registration_id:
            conditions.append(Payment.registration_id == registration_id)

        if status_filter:
            conditions.append(Payment.status == status_filter)

        if method:
            conditions.append(Payment.payment_method.ilike(f"%{method}%"))

        if conditions:
            statement = statement.where(and_(*conditions))

        # Count total records
        count_statement = select(Payment)
        if conditions:
            count_statement = count_statement.where(and_(*conditions))
        total = len(session.exec(count_statement).all())

        # Apply pagination and ordering
        offset = (page - 1) * per_page
        statement = statement.offset(offset).limit(per_page).order_by(Payment.created_at.desc())

        payments = session.exec(statement).all()

        # Load registration details for each payment
        for payment in payments:
            payment.registration = session.get(Registration, payment.registration_id)

        return PaymentListResponse(
            payments=[PaymentResponse.from_orm(payment) for payment in payments],
            total=total,
            page=page,
            per_page=per_page,
            has_next=(page * per_page) < total,
            has_prev=page > 1
        )

    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/payments/{payment_id}", response_model=PaymentResponse)
def get_payment(
    payment_id: UUID,
    session: Session = Depends(get_session),
    current_user = Depends(get_test_user)
):
    """Get payment details by ID"""
    payment = session.get(Payment, payment_id)
    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")

    # Load registration details
    payment.registration = session.get(Registration, payment.registration_id)

    return PaymentResponse.from_orm(payment)

@router.put("/payments/{payment_id}", response_model=PaymentResponse)
def update_payment(
    payment_id: UUID,
    payment_data: PaymentUpdate,
    session: Session = Depends(get_session),
    current_user = Depends(get_test_user)
):
    """Update payment status and details"""
    try:
        payment = session.get(Payment, payment_id)
        if not payment:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")

        # Get original status for comparison
        original_status = payment.status
        original_amount = payment.amount

        # Update payment fields
        update_data = payment_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(payment, field, value)

        # If status changed to completed or failed, update processed timestamp
        if payment_data.status and payment_data.status != original_status:
            if payment_data.status == PaymentStatus.COMPLETED:
                payment.mark_completed(
                    transaction_id=payment_data.transaction_id,
                    gateway_transaction_id=payment_data.gateway_transaction_id
                )
            elif payment_data.status == PaymentStatus.FAILED:
                payment.mark_failed(payment_data.failure_reason)

        session.add(payment)

        # If payment status changed, update registration
        if payment_data.status and payment_data.status != original_status:
            registration = session.get(Registration, payment.registration_id)
            if registration:
                # Recalculate amount_paid based on all completed payments
                completed_payments = session.exec(
                    select(Payment).where(
                        Payment.registration_id == registration.id,
                        Payment.status == PaymentStatus.COMPLETED
                    )
                ).all()

                registration.amount_paid = sum(p.amount for p in completed_payments)
                registration.update_payment_status()
                session.add(registration)

        session.commit()
        session.refresh(payment)

        # Load registration for response
        payment.registration = session.get(Registration, payment.registration_id)

        return PaymentResponse.from_orm(payment)

    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.delete("/payments/{payment_id}", status_code=status.HTTP_204_NO_CONTENT)
def cancel_payment(
    payment_id: UUID,
    session: Session = Depends(get_session),
    current_user = Depends(get_test_user)
):
    """Cancel a payment (only if not completed)"""
    try:
        payment = session.get(Payment, payment_id)
        if not payment:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")

        # Only allow cancellation of pending or processing payments
        if payment.status in [PaymentStatus.COMPLETED, PaymentStatus.CANCELLED]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot cancel payment with status: {payment.status}"
            )

        # Update payment status
        payment.status = PaymentStatus.CANCELLED
        payment.updated_at = payment.created_at.__class__.utcnow()
        session.add(payment)

        # Update registration payment amounts
        registration = session.get(Registration, payment.registration_id)
        if registration:
            # Only reduce amount_paid if payment was previously counted
            if payment.status == PaymentStatus.COMPLETED:
                registration.amount_paid -= payment.amount
            registration.update_payment_status()
            session.add(registration)

        session.commit()

    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))