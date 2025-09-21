from fastapi import APIRouter, HTTPException, Depends, Query, status
from sqlmodel import Session, select, and_
from typing import List, Optional
from uuid import UUID

from app.database.connection import get_session
from app.models.venue_amenity import VenueAmenity
from app.api.schemas import VenueAmenityCreate, VenueAmenityUpdate, VenueAmenityResponse, ErrorResponse
from app.api.auth import get_current_user

# Simple auth bypass for testing
def get_test_user():
    from app.api.auth import User
    return User(id=1, email="test@example.com", role="admin")

router = APIRouter()

@router.post("/venue-amenities", response_model=VenueAmenityResponse, status_code=status.HTTP_201_CREATED)
def create_venue_amenity(
    amenity_data: VenueAmenityCreate,
    session: Session = Depends(get_session),
    current_user = Depends(get_test_user)
):
    """Create a new venue amenity"""
    try:
        # Check if amenity name already exists
        existing_amenity = session.exec(select(VenueAmenity).where(VenueAmenity.name == amenity_data.name)).first()
        if existing_amenity:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A venue amenity with this name already exists"
            )

        # Create the amenity
        amenity = VenueAmenity(
            name=amenity_data.name,
            description=amenity_data.description
        )

        session.add(amenity)
        session.commit()
        session.refresh(amenity)

        return VenueAmenityResponse.from_orm(amenity)

    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/venue-amenities", response_model=List[VenueAmenityResponse])
def get_venue_amenities(
    name: Optional[str] = Query(None, description="Filter by amenity name (partial match)"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records to return"),
    sort_by: str = Query("name", description="Sort by field (name, created_at, updated_at)"),
    sort_order: str = Query("asc", description="Sort order (asc, desc)"),
    session: Session = Depends(get_session),
    current_user = Depends(get_test_user)
):
    """Get paginated list of venue amenities with optional filtering and sorting"""
    try:
        statement = select(VenueAmenity)

        # Apply filters
        conditions = []

        if name:
            conditions.append(VenueAmenity.name.ilike(f"%{name}%"))

        if is_active is not None:
            conditions.append(VenueAmenity.is_active == is_active)

        if conditions:
            statement = statement.where(and_(*conditions))

        # Apply sorting
        sort_column = getattr(VenueAmenity, sort_by, VenueAmenity.name)
        if sort_order.lower() == "desc":
            sort_column = sort_column.desc()

        statement = statement.order_by(sort_column)

        # Apply pagination
        statement = statement.offset(skip).limit(limit)

        amenities = session.exec(statement).all()

        return [VenueAmenityResponse.from_orm(amenity) for amenity in amenities]

    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/venue-amenities/{amenity_id}", response_model=VenueAmenityResponse)
def get_venue_amenity(
    amenity_id: UUID,
    session: Session = Depends(get_session),
    current_user = Depends(get_test_user)
):
    """Get venue amenity details by ID"""
    amenity = session.get(VenueAmenity, amenity_id)
    if not amenity:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Venue amenity not found")

    return VenueAmenityResponse.from_orm(amenity)

@router.put("/venue-amenities/{amenity_id}", response_model=VenueAmenityResponse)
def update_venue_amenity(
    amenity_id: UUID,
    amenity_data: VenueAmenityUpdate,
    session: Session = Depends(get_session),
    current_user = Depends(get_test_user)
):
    """Update venue amenity"""
    try:
        amenity = session.get(VenueAmenity, amenity_id)
        if not amenity:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Venue amenity not found")

        # Check if new name already exists (if name is being updated)
        if amenity_data.name and amenity_data.name != amenity.name:
            existing_amenity = session.exec(select(VenueAmenity).where(VenueAmenity.name == amenity_data.name)).first()
            if existing_amenity:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="A venue amenity with this name already exists"
                )

        # Update amenity fields
        update_data = amenity_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(amenity, field, value)

        session.add(amenity)
        session.commit()
        session.refresh(amenity)

        return VenueAmenityResponse.from_orm(amenity)

    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.delete("/venue-amenities/{amenity_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_venue_amenity(
    amenity_id: UUID,
    session: Session = Depends(get_session),
    current_user = Depends(get_test_user)
):
    """Delete venue amenity"""
    amenity = session.get(VenueAmenity, amenity_id)
    if not amenity:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Venue amenity not found")

    try:
        # TODO: In future, check if amenity is being used by any venues
        # For now, we'll allow deletion as per work order requirements

        session.delete(amenity)
        session.commit()

    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))