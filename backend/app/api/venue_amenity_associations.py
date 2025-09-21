from fastapi import APIRouter, HTTPException, Depends, status
from sqlmodel import Session, select
from typing import List
from uuid import UUID

from app.database.connection import get_session
from app.models.venue import Venue
from app.models.venue_amenity import VenueAmenity
from app.models.venue_has_amenity import VenueHasAmenity
from app.api.schemas import (
    VenueAmenityAssociationCreate,
    VenueAmenityAssociationUpdate,
    VenueAmenityAssociationResponse,
    VenueAmenityAssociationListCreate,
    ErrorResponse
)
from app.api.auth import get_current_user

# Simple auth bypass for testing
def get_test_user():
    from app.api.auth import User
    return User(id=1, email="test@example.com", role="admin")

router = APIRouter()

@router.post("/venues/{venue_id}/amenities", response_model=List[VenueAmenityAssociationResponse], status_code=status.HTTP_201_CREATED)
def create_venue_amenity_associations(
    venue_id: UUID,
    association_data: VenueAmenityAssociationListCreate,
    session: Session = Depends(get_session),
    current_user = Depends(get_test_user)
):
    """Create new venue-amenity associations"""
    try:
        # Validate venue exists
        venue = session.get(Venue, venue_id)
        if not venue:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Venue not found"
            )

        created_associations = []

        for assoc_data in association_data.associations:
            # Validate amenity exists
            amenity = session.get(VenueAmenity, assoc_data.amenity_id)
            if not amenity:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Amenity with ID {assoc_data.amenity_id} not found"
                )

            # Check for duplicate association
            existing_association = session.exec(
                select(VenueHasAmenity).where(
                    VenueHasAmenity.venue_id == venue_id,
                    VenueHasAmenity.amenity_id == assoc_data.amenity_id
                )
            ).first()

            if existing_association:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Association between venue and amenity {assoc_data.amenity_id} already exists"
                )

            # Create the association
            association = VenueHasAmenity(
                venue_id=venue_id,
                amenity_id=assoc_data.amenity_id,
                quantity=assoc_data.quantity,
                notes=assoc_data.notes
            )

            session.add(association)
            session.flush()  # Flush to get the ID
            session.refresh(association)

            # Load the amenity for the response
            association.amenity = amenity
            created_associations.append(association)

        session.commit()

        return [VenueAmenityAssociationResponse.from_orm(assoc) for assoc in created_associations]

    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.put("/venues/{venue_id}/amenities/{amenity_id}", response_model=VenueAmenityAssociationResponse)
def update_venue_amenity_association(
    venue_id: UUID,
    amenity_id: UUID,
    association_data: VenueAmenityAssociationUpdate,
    session: Session = Depends(get_session),
    current_user = Depends(get_test_user)
):
    """Update an existing venue-amenity association"""
    try:
        # Validate venue exists
        venue = session.get(Venue, venue_id)
        if not venue:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Venue not found"
            )

        # Validate amenity exists
        amenity = session.get(VenueAmenity, amenity_id)
        if not amenity:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Amenity not found"
            )

        # Find the association
        association = session.exec(
            select(VenueHasAmenity).where(
                VenueHasAmenity.venue_id == venue_id,
                VenueHasAmenity.amenity_id == amenity_id
            )
        ).first()

        if not association:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Association between venue and amenity not found"
            )

        # Update association fields
        update_data = association_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(association, field, value)

        session.add(association)
        session.commit()
        session.refresh(association)

        # Load the amenity for the response
        association.amenity = amenity

        return VenueAmenityAssociationResponse.from_orm(association)

    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.delete("/venues/{venue_id}/amenities/{amenity_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_venue_amenity_association(
    venue_id: UUID,
    amenity_id: UUID,
    session: Session = Depends(get_session),
    current_user = Depends(get_test_user)
):
    """Delete a venue-amenity association"""
    try:
        # Validate venue exists
        venue = session.get(Venue, venue_id)
        if not venue:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Venue not found"
            )

        # Validate amenity exists
        amenity = session.get(VenueAmenity, amenity_id)
        if not amenity:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Amenity not found"
            )

        # Find the association
        association = session.exec(
            select(VenueHasAmenity).where(
                VenueHasAmenity.venue_id == venue_id,
                VenueHasAmenity.amenity_id == amenity_id
            )
        ).first()

        if not association:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Association between venue and amenity not found"
            )

        session.delete(association)
        session.commit()

    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/venues/{venue_id}/amenities", response_model=List[VenueAmenityAssociationResponse])
def get_venue_amenities(
    venue_id: UUID,
    session: Session = Depends(get_session),
    current_user = Depends(get_test_user)
):
    """Get all amenities associated with a venue"""
    try:
        # Validate venue exists
        venue = session.get(Venue, venue_id)
        if not venue:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Venue not found"
            )

        # Get all associations for this venue
        associations = session.exec(
            select(VenueHasAmenity).where(VenueHasAmenity.venue_id == venue_id)
        ).all()

        # Load amenity details for each association
        for association in associations:
            association.amenity = session.get(VenueAmenity, association.amenity_id)

        return [VenueAmenityAssociationResponse.from_orm(assoc) for assoc in associations]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))