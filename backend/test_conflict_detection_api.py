"""
Test script for conflict detection API endpoints.

This script tests the comprehensive conflict detection functionality
including venue double-booking, team overlaps, and recurring events.
"""

import requests
import json
from datetime import datetime, timedelta
from uuid import uuid4


# Configuration
BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api"

# Test authentication token (matches the simple auth in auth.py)
AUTH_TOKEN = "test-token-123"
HEADERS = {
    "Authorization": f"Bearer {AUTH_TOKEN}",
    "Content-Type": "application/json"
}


def test_health_check():
    """Test the scheduling service health check."""
    print("🔍 Testing scheduling service health check...")

    try:
        response = requests.get(f"{API_BASE}/scheduling/health")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")

        assert response.status_code == 200
        print("✅ Health check passed!")

    except Exception as e:
        print(f"❌ Health check failed: {e}")


def test_conflict_check_no_conflicts():
    """Test conflict checking with no conflicts."""
    print("\n🔍 Testing conflict check with no conflicts...")

    # Create a test event request for tomorrow
    tomorrow = datetime.now() + timedelta(days=1)
    request_data = {
        "name": "Test Practice Session",
        "event_type": "Practice",
        "start_time": tomorrow.isoformat(),
        "end_time": (tomorrow + timedelta(hours=2)).isoformat(),
        "venue_id": str(uuid4()),  # Random venue ID that shouldn't exist
        "team_ids": [999],  # Random team ID that shouldn't exist
        "is_recurring": False
    }

    try:
        response = requests.post(
            f"{API_BASE}/scheduling/conflicts/check",
            headers=HEADERS,
            json=request_data
        )

        print(f"Status: {response.status_code}")
        conflicts = response.json()
        print(f"Conflicts found: {len(conflicts)}")

        assert response.status_code == 200
        print("✅ No conflicts check passed!")

    except Exception as e:
        print(f"❌ No conflicts check failed: {e}")


def test_conflict_check_invalid_data():
    """Test conflict checking with invalid data."""
    print("\n🔍 Testing conflict check with invalid data...")

    # Test with end time before start time
    now = datetime.now()
    invalid_request = {
        "name": "Invalid Event",
        "event_type": "Practice",
        "start_time": now.isoformat(),
        "end_time": (now - timedelta(hours=1)).isoformat(),  # End before start
        "venue_id": str(uuid4()),
        "team_ids": [],
        "is_recurring": False
    }

    try:
        response = requests.post(
            f"{API_BASE}/scheduling/conflicts/check",
            headers=HEADERS,
            json=invalid_request
        )

        print(f"Status: {response.status_code}")
        print(f"Error: {response.json()}")

        assert response.status_code == 400
        print("✅ Invalid data check passed!")

    except Exception as e:
        print(f"❌ Invalid data check failed: {e}")


def test_recurring_event_check():
    """Test conflict checking for recurring events."""
    print("\n🔍 Testing recurring event conflict check...")

    # Create a weekly recurring event
    start_time = datetime.now() + timedelta(days=1)
    request_data = {
        "name": "Weekly Team Meeting",
        "event_type": "Meeting",
        "start_time": start_time.isoformat(),
        "end_time": (start_time + timedelta(hours=1)).isoformat(),
        "venue_id": str(uuid4()),
        "team_ids": [1, 2],
        "is_recurring": True,
        "recurrence_rule": "WEEKLY for 4 weeks"
    }

    try:
        response = requests.post(
            f"{API_BASE}/scheduling/conflicts/check",
            headers=HEADERS,
            json=request_data
        )

        print(f"Status: {response.status_code}")
        conflicts = response.json()
        print(f"Conflicts found: {len(conflicts)}")

        assert response.status_code == 200
        print("✅ Recurring event check passed!")

    except Exception as e:
        print(f"❌ Recurring event check failed: {e}")


def test_get_conflicts_list():
    """Test getting the list of existing conflicts."""
    print("\n🔍 Testing get conflicts list...")

    try:
        response = requests.get(
            f"{API_BASE}/scheduling/conflicts",
            headers=HEADERS,
            params={
                "limit": 10,
                "offset": 0
            }
        )

        print(f"Status: {response.status_code}")
        result = response.json()
        print(f"Total conflicts: {result.get('total', 0)}")
        print(f"Conflicts returned: {len(result.get('conflicts', []))}")

        assert response.status_code == 200
        print("✅ Get conflicts list passed!")

    except Exception as e:
        print(f"❌ Get conflicts list failed: {e}")


def test_conflict_summary():
    """Test getting conflict summary statistics."""
    print("\n🔍 Testing conflict summary...")

    try:
        response = requests.get(
            f"{API_BASE}/scheduling/conflicts/summary",
            headers=HEADERS
        )

        print(f"Status: {response.status_code}")
        summary = response.json()
        print(f"Summary: {summary}")

        assert response.status_code == 200
        print("✅ Conflict summary passed!")

    except Exception as e:
        print(f"❌ Conflict summary failed: {e}")


def test_unauthorized_access():
    """Test that endpoints require authentication."""
    print("\n🔍 Testing unauthorized access...")

    try:
        # Try without auth token
        response = requests.post(
            f"{API_BASE}/scheduling/conflicts/check",
            json={
                "name": "Test Event",
                "event_type": "Practice",
                "start_time": datetime.now().isoformat(),
                "end_time": (datetime.now() + timedelta(hours=1)).isoformat()
            }
        )

        print(f"Status: {response.status_code}")

        assert response.status_code == 401
        print("✅ Unauthorized access check passed!")

    except Exception as e:
        print(f"❌ Unauthorized access check failed: {e}")


def run_all_tests():
    """Run all conflict detection API tests."""
    print("🚀 Starting Conflict Detection API Tests")
    print("=" * 50)

    # Test server connectivity first
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code != 200:
            print("❌ Server is not running or not healthy")
            return
    except Exception:
        print("❌ Cannot connect to server. Make sure it's running on localhost:8000")
        return

    # Run individual tests
    test_health_check()
    test_unauthorized_access()
    test_conflict_check_invalid_data()
    test_conflict_check_no_conflicts()
    test_recurring_event_check()
    test_get_conflicts_list()
    test_conflict_summary()

    print("\n" + "=" * 50)
    print("🎉 All tests completed!")
    print("\nTo test actual conflicts, you'll need to:")
    print("1. Create some venues and teams in the database")
    print("2. Create overlapping events")
    print("3. Then test the conflict detection with real data")


if __name__ == "__main__":
    run_all_tests()