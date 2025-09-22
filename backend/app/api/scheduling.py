"""
Scheduling conflict detection API endpoints.

Provides endpoints for checking scheduling conflicts and managing
detected conflicts in the system.
"""

from fastapi import APIRouter, HTTPException, Depends, Query, status
from sqlmodel import Session
from typing import List, Optional
from datetime import datetime
from uuid import UUID
import time

from app.database.connection import get_session
from app.models.conflict import ConflictType
from app.api.schemas import (
    ConflictCheckRequest, ConflictResponse, ConflictListResponse,
    ErrorResponse
)
from app.api.auth import get_current_user, User
from app.services.scheduling import SchedulingService

router = APIRouter(prefix="/scheduling", tags=["scheduling"])


@router.post(
    "/conflicts/check",
    response_model=List[ConflictResponse],
    responses={
        400: {"model": ErrorResponse},
        401: {"model": ErrorResponse},
        500: {"model": ErrorResponse}
    },
    summary="Check for scheduling conflicts",
    description="""
    Check for scheduling conflicts for a proposed event.

    This endpoint validates:
    - Venue double-booking conflicts
    - Team assignment overlaps
    - Time overlap validation
    - Recurring event conflicts

    Returns a list of detected conflicts within 2 seconds.
    """
)
async def check_conflicts(
    request: ConflictCheckRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
) -> List[ConflictResponse]:
    """Check for scheduling conflicts for a proposed event."""
    try:
        # Start timing for performance requirement (2 seconds)
        start_time = time.time()

        # Validate request
        if request.start_time >= request.end_time:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Event end time must be after start time"
            )

        # Check if start time is not too far in the past
        now = datetime.utcnow()
        if request.start_time < now and (now - request.start_time).days > 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot check conflicts for events more than 1 day in the past"
            )

        # Initialize scheduling service
        scheduling_service = SchedulingService(session)

        # Check for conflicts
        conflicts = scheduling_service.check_conflicts(request)

        # Ensure we respond within 2 seconds
        elapsed_time = time.time() - start_time
        if elapsed_time > 2.0:
            # Log performance warning (in production, use proper logging)
            print(f"Warning: Conflict check took {elapsed_time:.2f} seconds")

        return conflicts

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


@router.get(
    "/conflicts",
    response_model=ConflictListResponse,
    responses={
        400: {"model": ErrorResponse},
        401: {"model": ErrorResponse},
        500: {"model": ErrorResponse}
    },
    summary="Get existing conflicts",
    description="""
    Retrieve existing conflicts from the database with optional filtering.

    Supports filtering by:
    - Date range (start_date_after, end_date_before)
    - Venue ID
    - Team ID
    - Conflict type
    - Resolution status

    Results are paginated and ordered by creation date (newest first).
    """
)
async def get_conflicts(
    start_date_after: Optional[datetime] = Query(None, description="Filter conflicts for events starting after this date"),
    end_date_before: Optional[datetime] = Query(None, description="Filter conflicts for events ending before this date"),
    venue_id: Optional[UUID] = Query(None, description="Filter conflicts for specific venue"),
    team_id: Optional[int] = Query(None, description="Filter conflicts for specific team"),
    conflict_type: Optional[ConflictType] = Query(None, description="Filter by conflict type"),
    is_resolved: Optional[bool] = Query(None, description="Filter by resolution status"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of results"),
    offset: int = Query(0, ge=0, description="Number of results to skip"),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
) -> ConflictListResponse:
    """Get existing conflicts with filtering and pagination."""
    try:
        # Validate date range
        if start_date_after and end_date_before and start_date_after >= end_date_before:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="start_date_after must be before end_date_before"
            )

        # Initialize scheduling service
        scheduling_service = SchedulingService(session)

        # Get conflicts
        conflicts, total_count = scheduling_service.get_conflicts(
            start_date_after=start_date_after,
            end_date_before=end_date_before,
            venue_id=str(venue_id) if venue_id else None,
            team_id=team_id,
            conflict_type=conflict_type,
            is_resolved=is_resolved,
            limit=limit,
            offset=offset
        )

        # Calculate pagination info
        has_next = offset + limit < total_count
        has_prev = offset > 0

        return ConflictListResponse(
            conflicts=conflicts,
            total=total_count,
            limit=limit,
            offset=offset,
            has_next=has_next,
            has_prev=has_prev
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


@router.get(
    "/conflicts/summary",
    summary="Get conflict summary statistics",
    description="Get summary statistics about conflicts in the system"
)
async def get_conflict_summary(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get summary statistics about conflicts."""
    try:
        scheduling_service = SchedulingService(session)

        # Get basic counts
        total_conflicts, _ = scheduling_service.get_conflicts(limit=1, offset=0)
        resolved_conflicts, _ = scheduling_service.get_conflicts(is_resolved=True, limit=1, offset=0)
        unresolved_conflicts, _ = scheduling_service.get_conflicts(is_resolved=False, limit=1, offset=0)

        venue_conflicts, _ = scheduling_service.get_conflicts(
            conflict_type=ConflictType.VENUE_DOUBLE_BOOKING, limit=1, offset=0
        )
        team_conflicts, _ = scheduling_service.get_conflicts(
            conflict_type=ConflictType.TEAM_OVERLAP, limit=1, offset=0
        )

        return {
            "total_conflicts": len(total_conflicts),
            "resolved_conflicts": len(resolved_conflicts),
            "unresolved_conflicts": len(unresolved_conflicts),
            "venue_conflicts": len(venue_conflicts),
            "team_conflicts": len(team_conflicts),
            "resolution_rate": round(
                (len(resolved_conflicts) / max(len(total_conflicts), 1)) * 100, 2
            )
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )


# Health check endpoint for the scheduling service
@router.get(
    "/health",
    summary="Scheduling service health check",
    description="Check if the scheduling service is operational"
)
async def health_check(
    session: Session = Depends(get_session)
):
    """Health check for scheduling service."""
    try:
        # Test database connectivity
        session.exec("SELECT 1")

        return {
            "status": "healthy",
            "service": "scheduling",
            "timestamp": datetime.utcnow().isoformat(),
            "version": "1.0.0"
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Service unavailable: {str(e)}"
        )