from fastapi import APIRouter, HTTPException, Depends, Query, status
from sqlmodel import Session, select, and_, or_, text
from sqlalchemy import text as sql_text
from typing import List, Optional
from datetime import datetime
from uuid import UUID

from app.database.connection import get_session
from app.models.event import Event, EventType
from app.models.venue import Venue
from app.api.schemas import EventCreate, EventUpdate, EventResponse, TeamAssociation, ErrorResponse
from app.api.auth import get_current_user

router = APIRouter()

def get_event_with_venue(session: Session, event_id: UUID) -> Optional[Event]:
    """Get event with venue information"""
    statement = select(Event).where(Event.id == event_id)
    event = session.exec(statement).first()
    if event and event.venue_id:
        venue = session.get(Venue, event.venue_id)
        event.venue = venue
    return event

def get_event_team_ids(session: Session, event_id: UUID) -> List[int]:
    """Get team IDs associated with an event"""
    try:
        result = session.exec(sql_text(f"SELECT team_id FROM event_teams WHERE event_id = '{event_id}'"))
        return [row[0] for row in result.fetchall()]
    except:
        return []

def create_event_team_associations(session: Session, event_id: UUID, team_ids: List[int]):
    """Create event-team associations"""
    for team_id in team_ids:
        try:
            session.exec(sql_text(f"INSERT INTO event_teams (id, event_id, team_id) VALUES (gen_random_uuid(), '{event_id}', {team_id}) ON CONFLICT DO NOTHING"))
        except Exception as e:
            continue

def delete_event_team_associations(session: Session, event_id: UUID, team_ids: Optional[List[int]] = None):
    """Delete event-team associations"""
    if team_ids:
        team_ids_str = ','.join(map(str, team_ids))
        session.exec(sql_text(f"DELETE FROM event_teams WHERE event_id = '{event_id}' AND team_id IN ({team_ids_str})"))
    else:
        session.exec(sql_text(f"DELETE FROM event_teams WHERE event_id = '{event_id}'"))

@router.post("/events", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
def create_event(
    event_data: EventCreate,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    """Create a new event with optional team associations"""
    try:
        # Create the event
        event = Event(
            name=event_data.name,
            description=event_data.description,
            event_type=event_data.event_type,
            start_time=event_data.start_time,
            end_time=event_data.end_time,
            venue_id=event_data.venue_id,
            is_recurring=event_data.is_recurring,
            recurrence_rule=event_data.recurrence_rule,
            created_by_user_id=current_user.id
        )

        session.add(event)
        session.commit()
        session.refresh(event)

        # Create team associations if provided
        if event_data.team_ids:
            create_event_team_associations(session, event.id, event_data.team_ids)
            session.commit()

        # Get event with venue and team info for response
        event_with_venue = get_event_with_venue(session, event.id)
        if event_with_venue and event_with_venue.venue_id:
            venue = session.get(Venue, event_with_venue.venue_id)
            event_with_venue.venue = venue

        event_response = EventResponse.from_orm(event_with_venue)
        event_response.team_ids = event_data.team_ids or []

        return event_response

    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/events", response_model=List[EventResponse])
def get_events(
    event_type: Optional[EventType] = Query(None),
    start_date_after: Optional[datetime] = Query(None),
    end_date_before: Optional[datetime] = Query(None),
    venue_id: Optional[UUID] = Query(None),
    team_id: Optional[int] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    """Get paginated list of events with optional filtering"""
    try:
        statement = select(Event)

        # Apply filters
        conditions = []
        if event_type:
            conditions.append(Event.event_type == event_type)
        if start_date_after:
            conditions.append(Event.start_time >= start_date_after)
        if end_date_before:
            conditions.append(Event.end_time <= end_date_before)
        if venue_id:
            conditions.append(Event.venue_id == venue_id)

        # Handle team filtering - get events that have the specified team
        if team_id:
            # Get event IDs that are associated with the team
            team_event_ids = session.exec(sql_text(f"SELECT event_id FROM event_teams WHERE team_id = {team_id}")).fetchall()
            if team_event_ids:
                event_ids = [row[0] for row in team_event_ids]
                conditions.append(Event.id.in_(event_ids))
            else:
                # No events found for this team, return empty list
                return []

        if conditions:
            statement = statement.where(and_(*conditions))

        statement = statement.offset(skip).limit(limit).order_by(Event.start_time)

        events = session.exec(statement).all()

        # Prepare response with venue and team information
        response_events = []
        for event in events:
            event_response = EventResponse.from_orm(event)

            # Add venue information
            if event.venue_id:
                venue = session.get(Venue, event.venue_id)
                event_response.venue = venue

            # Add team IDs
            event_response.team_ids = get_event_team_ids(session, event.id)
            response_events.append(event_response)

        return response_events

    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/events/{event_id}", response_model=EventResponse)
def get_event(
    event_id: UUID,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    """Get complete event details with venue and team information"""
    event = get_event_with_venue(session, event_id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    event_response = EventResponse.from_orm(event)
    event_response.team_ids = get_event_team_ids(session, event_id)

    return event_response

@router.put("/events/{event_id}", response_model=EventResponse)
def update_event(
    event_id: UUID,
    event_data: EventUpdate,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    """Update event and manage team associations"""
    try:
        event = session.get(Event, event_id)
        if not event:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

        # Update event fields
        update_data = event_data.dict(exclude_unset=True)
        team_ids = update_data.pop('team_ids', None)

        for field, value in update_data.items():
            setattr(event, field, value)

        # Validate time constraint if both times are being updated
        if hasattr(event, 'start_time') and hasattr(event, 'end_time') and event.start_time >= event.end_time:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="end_time must be after start_time")

        session.add(event)
        session.commit()
        session.refresh(event)

        # Update team associations if provided
        if team_ids is not None:
            # Remove all existing associations
            delete_event_team_associations(session, event_id)
            # Add new associations
            if team_ids:
                create_event_team_associations(session, event_id, team_ids)
            session.commit()

        # Get updated event with venue and team info
        event_with_venue = get_event_with_venue(session, event_id)
        if event_with_venue and event_with_venue.venue_id:
            venue = session.get(Venue, event_with_venue.venue_id)
            event_with_venue.venue = venue

        event_response = EventResponse.from_orm(event_with_venue)
        event_response.team_ids = team_ids if team_ids is not None else get_event_team_ids(session, event_id)

        return event_response

    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.delete("/events/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(
    event_id: UUID,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    """Delete event and all associated team relationships"""
    event = session.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    try:
        # Delete team associations first
        delete_event_team_associations(session, event_id)

        # Delete the event
        session.delete(event)
        session.commit()

    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/events/{event_id}/teams", status_code=status.HTTP_201_CREATED)
def add_teams_to_event(
    event_id: UUID,
    team_data: TeamAssociation,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    """Add teams to an event"""
    event = session.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    try:
        create_event_team_associations(session, event_id, team_data.team_ids)
        session.commit()

        return {"message": "Teams added successfully", "team_ids": team_data.team_ids}

    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.delete("/events/{event_id}/teams/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_team_from_event(
    event_id: UUID,
    team_id: int,
    session: Session = Depends(get_session),
    current_user = Depends(get_current_user)
):
    """Remove specific team from event"""
    event = session.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    try:
        # Check if association exists
        result = session.exec(sql_text(f"SELECT 1 FROM event_teams WHERE event_id = '{event_id}' AND team_id = {team_id}"))
        if not result.first():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team association not found")

        delete_event_team_associations(session, event_id, [team_id])
        session.commit()

    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))