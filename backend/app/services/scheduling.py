"""
Scheduling conflict detection service.

This module provides comprehensive conflict detection for events,
venues, and teams to prevent double-booking and overlapping assignments.
"""

from typing import List, Optional, Dict, Tuple
from datetime import datetime, timedelta
from uuid import UUID
from sqlmodel import Session, select, and_, or_, func
from sqlalchemy import text
import re

from app.models.event import Event, EventType
from app.models.venue import Venue
from app.models.team import Team
from app.models.event_team import EventTeam
from app.models.conflict import Conflict, ConflictType
from app.api.schemas import ConflictCheckRequest, ConflictResponse, ConflictEventInfo


class SchedulingService:
    """Service for detecting and managing scheduling conflicts."""

    def __init__(self, session: Session):
        self.session = session

    def check_conflicts(self, request: ConflictCheckRequest) -> List[ConflictResponse]:
        """
        Check for all types of scheduling conflicts for a proposed event.

        Returns list of ConflictResponse objects within 2 seconds.
        """
        conflicts = []

        # Get expanded events for recurring pattern
        event_instances = self._expand_recurring_events(request)

        for event_data in event_instances:
            # Check venue conflicts
            venue_conflicts = self._check_venue_conflicts(event_data, request.event_id)
            conflicts.extend(venue_conflicts)

            # Check team conflicts
            team_conflicts = self._check_team_conflicts(event_data, request.event_id)
            conflicts.extend(team_conflicts)

        return conflicts

    def get_conflicts(
        self,
        start_date_after: Optional[datetime] = None,
        end_date_before: Optional[datetime] = None,
        venue_id: Optional[str] = None,
        team_id: Optional[int] = None,
        conflict_type: Optional[ConflictType] = None,
        is_resolved: Optional[bool] = None,
        limit: int = 100,
        offset: int = 0
    ) -> Tuple[List[ConflictResponse], int]:
        """
        Get existing conflicts from the database with filtering.

        Returns tuple of (conflicts, total_count).
        """
        # Build query
        query = select(Conflict)

        # Apply filters
        conditions = []

        if start_date_after or end_date_before:
            # Join with events to filter by event times
            query = query.join(Event, Conflict.event_id == Event.id)

            if start_date_after:
                conditions.append(Event.start_time >= start_date_after)
            if end_date_before:
                conditions.append(Event.end_time <= end_date_before)

        if venue_id:
            conditions.append(and_(
                Conflict.resource_type == "venue",
                Conflict.resource_id == str(venue_id)
            ))

        if team_id:
            conditions.append(and_(
                Conflict.resource_type == "team",
                Conflict.resource_id == str(team_id)
            ))

        if conflict_type:
            conditions.append(Conflict.conflict_type == conflict_type)

        if is_resolved is not None:
            conditions.append(Conflict.is_resolved == is_resolved)

        if conditions:
            query = query.where(and_(*conditions))

        # Get total count
        count_query = select(func.count(Conflict.id))
        if conditions:
            count_query = count_query.where(and_(*conditions))
        total_count = self.session.exec(count_query).scalar() or 0

        # Apply pagination and order
        query = query.order_by(Conflict.created_at.desc())
        query = query.offset(offset).limit(limit)

        # Execute query
        db_conflicts = self.session.exec(query).all()

        # Convert to response objects
        conflicts = []
        for db_conflict in db_conflicts:
            conflict_response = self._convert_db_conflict_to_response(db_conflict)
            if conflict_response:
                conflicts.append(conflict_response)

        return conflicts, total_count

    def _expand_recurring_events(self, request: ConflictCheckRequest) -> List[Dict]:
        """
        Expand recurring events into individual instances.

        Returns list of event data dictionaries for checking.
        """
        if not request.is_recurring or not request.recurrence_rule:
            # Single event
            return [{
                'start_time': request.start_time,
                'end_time': request.end_time,
                'venue_id': request.venue_id,
                'team_ids': request.team_ids,
                'name': request.name,
                'event_type': request.event_type
            }]

        # Parse recurrence rule and expand
        try:
            events = []
            duration = request.end_time - request.start_time

            # Simple recurrence rule parsing (extend as needed)
            rule_instances = self._parse_recurrence_rule(
                request.recurrence_rule,
                request.start_time
            )

            for start_time in rule_instances:
                events.append({
                    'start_time': start_time,
                    'end_time': start_time + duration,
                    'venue_id': request.venue_id,
                    'team_ids': request.team_ids,
                    'name': request.name,
                    'event_type': request.event_type
                })

            return events

        except Exception:
            # If recurrence parsing fails, fall back to single event
            return [{
                'start_time': request.start_time,
                'end_time': request.end_time,
                'venue_id': request.venue_id,
                'team_ids': request.team_ids,
                'name': request.name,
                'event_type': request.event_type
            }]

    def _parse_recurrence_rule(self, rule: str, start_time: datetime) -> List[datetime]:
        """
        Parse a simple recurrence rule into datetime instances.

        Supports basic patterns like:
        - DAILY for 30 days
        - WEEKLY on TUESDAY for 12 weeks
        - MONTHLY on day 15 for 6 months
        """
        instances = []

        try:
            # Simple pattern matching for common rules
            if "DAILY" in rule.upper():
                # Extract number of days
                days_match = re.search(r'(\d+)\s*days?', rule, re.IGNORECASE)
                days = int(days_match.group(1)) if days_match else 30

                for i in range(min(days, 365)):  # Cap at 1 year
                    instances.append(start_time + timedelta(days=i))

            elif "WEEKLY" in rule.upper():
                # Extract number of weeks
                weeks_match = re.search(r'(\d+)\s*weeks?', rule, re.IGNORECASE)
                weeks = int(weeks_match.group(1)) if weeks_match else 12

                for i in range(min(weeks, 52)):  # Cap at 1 year
                    instances.append(start_time + timedelta(weeks=i))

            elif "MONTHLY" in rule.upper():
                # Extract number of months (approximate with 30 days)
                months_match = re.search(r'(\d+)\s*months?', rule, re.IGNORECASE)
                months = int(months_match.group(1)) if months_match else 6

                for i in range(min(months, 12)):  # Cap at 1 year
                    instances.append(start_time + timedelta(days=i*30))

            else:
                # Unknown rule, return just the start time
                instances.append(start_time)

        except Exception:
            # If parsing fails, return just the start time
            instances.append(start_time)

        return instances

    def _check_venue_conflicts(self, event_data: Dict, exclude_event_id: Optional[str] = None) -> List[ConflictResponse]:
        """Check for venue double-booking conflicts."""
        conflicts = []

        if not event_data.get('venue_id'):
            return conflicts

        venue_id = event_data['venue_id']
        start_time = event_data['start_time']
        end_time = event_data['end_time']

        # Query for overlapping events at the same venue
        query = select(Event).where(
            and_(
                Event.venue_id == venue_id,
                or_(
                    # Event starts during our event
                    and_(Event.start_time >= start_time, Event.start_time < end_time),
                    # Event ends during our event
                    and_(Event.end_time > start_time, Event.end_time <= end_time),
                    # Event completely contains our event
                    and_(Event.start_time <= start_time, Event.end_time >= end_time),
                    # Our event completely contains their event
                    and_(Event.start_time >= start_time, Event.end_time <= end_time)
                )
            )
        )

        if exclude_event_id:
            query = query.where(Event.id != exclude_event_id)

        conflicting_events = self.session.exec(query).all()

        # Get venue name
        venue = self.session.get(Venue, venue_id)
        venue_name = venue.name if venue else "Unknown Venue"

        for conflicting_event in conflicting_events:
            conflicts.append(ConflictResponse(
                conflict_type=ConflictType.VENUE_DOUBLE_BOOKING,
                description=f"Venue '{venue_name}' is double-booked with event '{conflicting_event.name}'",
                resource_type="venue",
                resource_id=str(venue_id),
                resource_name=venue_name,
                severity=8,  # High severity for venue conflicts
                primary_event=self._create_event_info(event_data),
                conflicting_event=self._create_event_info_from_db(conflicting_event, venue_name),
                detected_by="system"
            ))

        return conflicts

    def _check_team_conflicts(self, event_data: Dict, exclude_event_id: Optional[str] = None) -> List[ConflictResponse]:
        """Check for team scheduling conflicts."""
        conflicts = []

        team_ids = event_data.get('team_ids', [])
        if not team_ids:
            return conflicts

        start_time = event_data['start_time']
        end_time = event_data['end_time']

        for team_id in team_ids:
            # Query for overlapping events with this team
            query = select(Event).join(EventTeam).where(
                and_(
                    EventTeam.team_id == team_id,
                    or_(
                        # Event starts during our event
                        and_(Event.start_time >= start_time, Event.start_time < end_time),
                        # Event ends during our event
                        and_(Event.end_time > start_time, Event.end_time <= end_time),
                        # Event completely contains our event
                        and_(Event.start_time <= start_time, Event.end_time >= end_time),
                        # Our event completely contains their event
                        and_(Event.start_time >= start_time, Event.end_time <= end_time)
                    )
                )
            )

            if exclude_event_id:
                query = query.where(Event.id != exclude_event_id)

            conflicting_events = self.session.exec(query).all()

            # Get team name
            team = self.session.get(Team, team_id)
            team_name = team.name if team else f"Team {team_id}"

            for conflicting_event in conflicting_events:
                # Get venue name for conflicting event
                conflicting_venue_name = None
                if conflicting_event.venue_id:
                    venue = self.session.get(Venue, conflicting_event.venue_id)
                    conflicting_venue_name = venue.name if venue else "Unknown Venue"

                conflicts.append(ConflictResponse(
                    conflict_type=ConflictType.TEAM_OVERLAP,
                    description=f"Team '{team_name}' is assigned to overlapping event '{conflicting_event.name}'",
                    resource_type="team",
                    resource_id=str(team_id),
                    resource_name=team_name,
                    severity=7,  # High severity for team conflicts
                    primary_event=self._create_event_info(event_data),
                    conflicting_event=self._create_event_info_from_db(conflicting_event, conflicting_venue_name),
                    detected_by="system"
                ))

        return conflicts

    def _create_event_info(self, event_data: Dict) -> ConflictEventInfo:
        """Create ConflictEventInfo from event data dictionary."""
        venue_name = None
        if event_data.get('venue_id'):
            venue = self.session.get(Venue, event_data['venue_id'])
            venue_name = venue.name if venue else "Unknown Venue"

        # Create a placeholder UUID for new events
        import uuid
        event_id = event_data.get('id')
        if event_id is None:
            event_id = uuid.UUID('00000000-0000-0000-0000-000000000000')
        elif isinstance(event_id, str):
            event_id = uuid.UUID(event_id)

        return ConflictEventInfo(
            id=event_id,
            name=event_data['name'],
            event_type=event_data['event_type'],
            start_time=event_data['start_time'],
            end_time=event_data['end_time'],
            venue_id=event_data.get('venue_id'),
            venue_name=venue_name
        )

    def _create_event_info_from_db(self, event: Event, venue_name: Optional[str] = None) -> ConflictEventInfo:
        """Create ConflictEventInfo from database Event model."""
        if not venue_name and event.venue_id:
            venue = self.session.get(Venue, event.venue_id)
            venue_name = venue.name if venue else "Unknown Venue"

        return ConflictEventInfo(
            id=event.id,
            name=event.name,
            event_type=event.event_type,
            start_time=event.start_time,
            end_time=event.end_time,
            venue_id=event.venue_id,
            venue_name=venue_name
        )

    def _convert_db_conflict_to_response(self, db_conflict: Conflict) -> Optional[ConflictResponse]:
        """Convert database Conflict model to ConflictResponse."""
        try:
            # Get primary event
            primary_event = self.session.get(Event, db_conflict.event_id)
            if not primary_event:
                return None

            # Get conflicting event
            conflicting_event = self.session.get(Event, db_conflict.conflicting_event_id)
            if not conflicting_event:
                return None

            # Get resource name
            resource_name = None
            if db_conflict.resource_type == "venue":
                venue = self.session.get(Venue, db_conflict.resource_id)
                resource_name = venue.name if venue else "Unknown Venue"
            elif db_conflict.resource_type == "team":
                team = self.session.get(Team, int(db_conflict.resource_id))
                resource_name = team.name if team else f"Team {db_conflict.resource_id}"

            return ConflictResponse(
                id=db_conflict.id,
                conflict_type=db_conflict.conflict_type,
                description=db_conflict.description,
                resource_type=db_conflict.resource_type,
                resource_id=db_conflict.resource_id,
                resource_name=resource_name,
                severity=db_conflict.severity,
                primary_event=self._create_event_info_from_db(primary_event),
                conflicting_event=self._create_event_info_from_db(conflicting_event),
                is_resolved=db_conflict.is_resolved,
                detected_by=db_conflict.detected_by,
                created_at=db_conflict.created_at
            )

        except Exception:
            # If conversion fails, skip this conflict
            return None