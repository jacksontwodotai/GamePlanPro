from fastapi import APIRouter, HTTPException, Depends, Query, status
from sqlmodel import Session, select, and_, or_
from typing import List, Optional
from uuid import UUID

from app.database.connection import get_session
from app.models.venue import Venue
from app.api.schemas import VenueCreate, VenueUpdate, VenueResponse, ErrorResponse
from app.api.auth import get_current_user

router = APIRouter()

@router.post("/venues", response_model=VenueResponse, status_code=status.HTTP_201_CREATED)
def create_venue(
    venue_data: VenueCreate,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    """Create a new venue"""
    try:
        # Check if venue name already exists
        existing_venue = session.exec(select(Venue).where(Venue.name == venue_data.name)).first()
        if existing_venue:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A venue with this name already exists"
            )

        # Create the venue
        venue = Venue(
            name=venue_data.name,
            address=venue_data.address,
            city=venue_data.city,
            state=venue_data.state,
            zip_code=venue_data.zip_code,
            capacity=venue_data.capacity,
            description=venue_data.description,
            is_active=venue_data.is_active
        )

        session.add(venue)
        session.commit()
        session.refresh(venue)

        return VenueResponse.from_orm(venue)

    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/venues", response_model=List[VenueResponse])
def get_venues(
    name: Optional[str] = Query(None, description="Filter by venue name (partial match)"),
    city: Optional[str] = Query(None, description="Filter by city"),
    state: Optional[str] = Query(None, description="Filter by state"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    min_capacity: Optional[int] = Query(None, ge=0, description="Minimum capacity"),
    max_capacity: Optional[int] = Query(None, ge=0, description="Maximum capacity"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records to return"),
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    """Get paginated list of venues with optional filtering"""
    try:
        statement = select(Venue)

        # Apply filters
        conditions = []

        if name:
            conditions.append(Venue.name.ilike(f"%{name}%"))

        if city:
            conditions.append(Venue.city.ilike(f"%{city}%"))

        if state:
            conditions.append(Venue.state.ilike(f"%{state}%"))

        if is_active is not None:
            conditions.append(Venue.is_active == is_active)

        if min_capacity is not None:
            conditions.append(Venue.capacity >= min_capacity)

        if max_capacity is not None:
            conditions.append(Venue.capacity <= max_capacity)

        if conditions:
            statement = statement.where(and_(*conditions))

        # Apply pagination and ordering
        statement = statement.offset(skip).limit(limit).order_by(Venue.name)

        venues = session.exec(statement).all()

        return [VenueResponse.from_orm(venue) for venue in venues]

    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/venues/{venue_id}", response_model=VenueResponse)
def get_venue(
    venue_id: UUID,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    """Get venue details by ID"""
    venue = session.get(Venue, venue_id)
    if not venue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Venue not found")

    return VenueResponse.from_orm(venue)

@router.put("/venues/{venue_id}", response_model=VenueResponse)
def update_venue(
    venue_id: UUID,
    venue_data: VenueUpdate,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    """Update venue"""
    try:
        venue = session.get(Venue, venue_id)
        if not venue:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Venue not found")

        # Check if new name already exists (if name is being updated)
        if venue_data.name and venue_data.name != venue.name:
            existing_venue = session.exec(select(Venue).where(Venue.name == venue_data.name)).first()
            if existing_venue:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="A venue with this name already exists"
                )

        # Update venue fields
        update_data = venue_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(venue, field, value)

        session.add(venue)
        session.commit()
        session.refresh(venue)

        return VenueResponse.from_orm(venue)

    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.delete("/venues/{venue_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_venue(
    venue_id: UUID,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    """Delete venue"""
    venue = session.get(Venue, venue_id)
    if not venue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Venue not found")

    try:
        # Check if venue is being used by any events
        from app.models.event import Event
        existing_events = session.exec(select(Event).where(Event.venue_id == venue_id)).first()
        if existing_events:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete venue that is associated with events. Please remove venue from all events first."
            )

        session.delete(venue)
        session.commit()

    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))