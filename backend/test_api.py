#!/usr/bin/env python3
"""
Simple test script to verify the Event Scheduling API endpoints
"""
import requests
import json
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api"

# Test headers with mock auth token
headers = {
    "Authorization": "Bearer test-token",
    "Content-Type": "application/json"
}

def test_create_event():
    """Test POST /api/events"""
    event_data = {
        "name": "Team Practice Session",
        "description": "Weekly practice for the team",
        "event_type": "Practice",
        "start_time": (datetime.now() + timedelta(days=1)).isoformat(),
        "end_time": (datetime.now() + timedelta(days=1, hours=2)).isoformat(),
        "is_recurring": False,
        "team_ids": [1, 2]
    }

    response = requests.post(f"{API_BASE}/events", json=event_data, headers=headers)
    print(f"Create Event - Status: {response.status_code}")
    if response.status_code == 201:
        event = response.json()
        print(f"Created event: {event['name']} with ID: {event['id']}")
        return event['id']
    else:
        print(f"Error: {response.text}")
        return None

def test_get_events():
    """Test GET /api/events"""
    response = requests.get(f"{API_BASE}/events", headers=headers)
    print(f"Get Events - Status: {response.status_code}")
    if response.status_code == 200:
        events = response.json()
        print(f"Found {len(events)} events")
        return events
    else:
        print(f"Error: {response.text}")
        return []

def test_get_event(event_id):
    """Test GET /api/events/{event_id}"""
    response = requests.get(f"{API_BASE}/events/{event_id}", headers=headers)
    print(f"Get Event {event_id} - Status: {response.status_code}")
    if response.status_code == 200:
        event = response.json()
        print(f"Event details: {event['name']}")
        return event
    else:
        print(f"Error: {response.text}")
        return None

def run_tests():
    """Run all API tests"""
    print("Testing Event Scheduling API...")
    print("=" * 50)

    # Test health endpoint
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"Health check - Status: {response.status_code}")
    except Exception as e:
        print(f"Cannot connect to API server: {e}")
        return

    # Test API endpoints
    event_id = test_create_event()
    test_get_events()

    if event_id:
        test_get_event(event_id)

    print("=" * 50)
    print("API tests completed!")

if __name__ == "__main__":
    run_tests()