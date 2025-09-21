# Event Scheduling API - Work Order 094

## Overview
Complete RESTful API for event scheduling with team association management. Allows administrators and coaches to manage events (practices, games, meetings) with team associations, supporting both single and recurring events.

## API Endpoints

### Authentication
All endpoints require Bearer token authentication in the Authorization header:
```
Authorization: Bearer <token>
```

### Base URL
```
http://localhost:8000/api
```

## Event Management Endpoints

### 1. Create Event
**POST** `/events`

Creates a new event with optional team associations.

**Request Body:**
```json
{
  "name": "Team Practice Session",
  "description": "Weekly practice for the team",
  "event_type": "Practice",
  "start_time": "2025-09-22T14:00:00",
  "end_time": "2025-09-22T16:00:00",
  "venue_id": "550e8400-e29b-41d4-a716-446655440000",
  "is_recurring": false,
  "recurrence_rule": null,
  "team_ids": [1, 2]
}
```

**Response:** `201 Created`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Team Practice Session",
  "description": "Weekly practice for the team",
  "event_type": "Practice",
  "start_time": "2025-09-22T14:00:00",
  "end_time": "2025-09-22T16:00:00",
  "venue_id": "550e8400-e29b-41d4-a716-446655440000",
  "venue": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Main Stadium"
  },
  "is_recurring": false,
  "recurrence_rule": null,
  "created_by_user_id": 1,
  "created_at": "2025-09-21T10:00:00",
  "updated_at": "2025-09-21T10:00:00",
  "team_ids": [1, 2]
}
```

### 2. Get Events (Paginated with Filters)
**GET** `/events`

Returns paginated list of events with optional filtering.

**Query Parameters:**
- `event_type`: Filter by event type (Practice, Game, Meeting, Tournament, Other)
- `start_date_after`: Filter events starting after this date
- `end_date_before`: Filter events ending before this date
- `venue_id`: Filter by venue ID
- `team_id`: Filter events associated with specific team
- `skip`: Number of events to skip (default: 0)
- `limit`: Maximum number of events to return (default: 100, max: 1000)

**Example:**
```
GET /events?event_type=Practice&team_id=1&limit=50
```

**Response:** `200 OK`
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Team Practice Session",
    "event_type": "Practice",
    "start_time": "2025-09-22T14:00:00",
    "end_time": "2025-09-22T16:00:00",
    "venue": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Main Stadium"
    },
    "team_ids": [1, 2]
  }
]
```

### 3. Get Single Event
**GET** `/events/{event_id}`

Returns complete event details including venue and team information.

**Response:** `200 OK` or `404 Not Found`

### 4. Update Event
**PUT** `/events/{event_id}`

Updates event and manages team associations.

**Request Body:** (all fields optional)
```json
{
  "name": "Updated Event Name",
  "event_type": "Game",
  "team_ids": [1, 3, 4]
}
```

**Response:** `200 OK` or `404 Not Found`

### 5. Delete Event
**DELETE** `/events/{event_id}`

Removes event and all associated team relationships.

**Response:** `204 No Content` or `404 Not Found`

## Team Association Endpoints

### 6. Add Teams to Event
**POST** `/events/{event_id}/teams`

Adds teams to an existing event.

**Request Body:**
```json
{
  "team_ids": [3, 4, 5]
}
```

**Response:** `201 Created`
```json
{
  "message": "Teams added successfully",
  "team_ids": [3, 4, 5]
}
```

### 7. Remove Team from Event
**DELETE** `/events/{event_id}/teams/{team_id}`

Removes specific team from event.

**Response:** `204 No Content` or `404 Not Found`

## Event Types
- `Practice`
- `Game`
- `Meeting`
- `Tournament`
- `Other`

## Validation Rules
- `end_time` must be after `start_time`
- All datetime fields must be valid ISO 8601 format
- Event names are required (max 255 characters)
- Authorization token required for all operations

## Error Responses
All endpoints return appropriate HTTP status codes with JSON error messages:

```json
{
  "detail": "Error message description"
}
```

Common status codes:
- `400 Bad Request`: Validation errors, invalid data
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server errors

## Running the API

1. Start the FastAPI server:
```bash
cd backend
source venv/bin/activate
python main.py
```

2. Access API documentation at: http://localhost:8000/docs

3. Run tests:
```bash
python test_api.py
```