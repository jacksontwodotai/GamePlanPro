#!/usr/bin/env python3
"""
Test script for Venue Amenities API endpoints
Tests all CRUD operations for venue amenities
"""

import requests
import json
import uuid
from datetime import datetime
import sys

# Base URL for the API
BASE_URL = "http://localhost:8000/api"

# Test credentials (adjust as needed based on your auth setup)
AUTH_TOKEN = None  # Will be set after login
HEADERS = {"Content-Type": "application/json"}

def login():
    """Login to get authentication token"""
    global AUTH_TOKEN, HEADERS
    # Note: Using basic auth bypass for testing since auth setup might vary
    # In production, you'd need proper login credentials
    print("⚠️  Skipping authentication for testing (using existing auth from venues)")
    return True

def test_create_venue_amenity():
    """Test POST /api/venue-amenities"""
    print("\n=== Testing CREATE Venue Amenity ===")

    amenity_data = {
        "name": "WiFi",
        "description": "High-speed wireless internet access throughout the venue"
    }

    response = requests.post(f"{BASE_URL}/venue-amenities",
                           json=amenity_data,
                           headers=HEADERS)

    if response.status_code == 201:
        data = response.json()
        print(f"✅ Successfully created venue amenity: {data['name']}")
        print(f"   ID: {data['id']}")
        print(f"   Description: {data['description']}")
        return data['id']
    else:
        print(f"❌ Failed to create venue amenity: {response.status_code}")
        print(f"   Response: {response.text}")
        return None

def test_create_duplicate_amenity():
    """Test creating duplicate amenity (should fail)"""
    print("\n=== Testing CREATE Duplicate Amenity (should fail) ===")

    amenity_data = {
        "name": "WiFi",
        "description": "Another WiFi amenity"
    }

    response = requests.post(f"{BASE_URL}/venue-amenities",
                           json=amenity_data,
                           headers=HEADERS)

    if response.status_code == 409:
        print("✅ Correctly rejected duplicate amenity name")
    else:
        print(f"❌ Expected 409 conflict, got: {response.status_code}")
        print(f"   Response: {response.text}")

def test_get_venue_amenities():
    """Test GET /api/venue-amenities"""
    print("\n=== Testing GET All Venue Amenities ===")

    response = requests.get(f"{BASE_URL}/venue-amenities", headers=HEADERS)

    if response.status_code == 200:
        data = response.json()
        print(f"✅ Successfully retrieved {len(data)} venue amenities")
        for amenity in data:
            print(f"   - {amenity['name']}: {amenity['description']}")
        return len(data) > 0
    else:
        print(f"❌ Failed to get venue amenities: {response.status_code}")
        print(f"   Response: {response.text}")
        return False

def test_get_venue_amenities_with_filters():
    """Test GET /api/venue-amenities with filters"""
    print("\n=== Testing GET Venue Amenities with Filters ===")

    # Test name filter
    response = requests.get(f"{BASE_URL}/venue-amenities?name=WiFi", headers=HEADERS)

    if response.status_code == 200:
        data = response.json()
        print(f"✅ Successfully filtered amenities by name: {len(data)} results")
    else:
        print(f"❌ Failed to filter amenities: {response.status_code}")

    # Test pagination
    response = requests.get(f"{BASE_URL}/venue-amenities?skip=0&limit=10", headers=HEADERS)

    if response.status_code == 200:
        data = response.json()
        print(f"✅ Successfully paginated amenities: {len(data)} results")
    else:
        print(f"❌ Failed to paginate amenities: {response.status_code}")

def test_get_venue_amenity_by_id(amenity_id):
    """Test GET /api/venue-amenities/{id}"""
    print(f"\n=== Testing GET Venue Amenity by ID ===")

    response = requests.get(f"{BASE_URL}/venue-amenities/{amenity_id}", headers=HEADERS)

    if response.status_code == 200:
        data = response.json()
        print(f"✅ Successfully retrieved venue amenity: {data['name']}")
        print(f"   ID: {data['id']}")
        print(f"   Created: {data['created_at']}")
        return True
    else:
        print(f"❌ Failed to get venue amenity: {response.status_code}")
        print(f"   Response: {response.text}")
        return False

def test_get_nonexistent_amenity():
    """Test GET for non-existent amenity (should return 404)"""
    print("\n=== Testing GET Non-existent Amenity (should fail) ===")

    fake_id = str(uuid.uuid4())
    response = requests.get(f"{BASE_URL}/venue-amenities/{fake_id}", headers=HEADERS)

    if response.status_code == 404:
        print("✅ Correctly returned 404 for non-existent amenity")
    else:
        print(f"❌ Expected 404, got: {response.status_code}")

def test_update_venue_amenity(amenity_id):
    """Test PUT /api/venue-amenities/{id}"""
    print(f"\n=== Testing UPDATE Venue Amenity ===")

    update_data = {
        "name": "WiFi Pro",
        "description": "Premium high-speed wireless internet with enterprise-grade security"
    }

    response = requests.put(f"{BASE_URL}/venue-amenities/{amenity_id}",
                          json=update_data,
                          headers=HEADERS)

    if response.status_code == 200:
        data = response.json()
        print(f"✅ Successfully updated venue amenity: {data['name']}")
        print(f"   New description: {data['description']}")
        return True
    else:
        print(f"❌ Failed to update venue amenity: {response.status_code}")
        print(f"   Response: {response.text}")
        return False

def test_partial_update_venue_amenity(amenity_id):
    """Test partial PUT /api/venue-amenities/{id}"""
    print(f"\n=== Testing PARTIAL UPDATE Venue Amenity ===")

    update_data = {
        "description": "Updated description only"
    }

    response = requests.put(f"{BASE_URL}/venue-amenities/{amenity_id}",
                          json=update_data,
                          headers=HEADERS)

    if response.status_code == 200:
        data = response.json()
        print(f"✅ Successfully partially updated venue amenity")
        print(f"   New description: {data['description']}")
        return True
    else:
        print(f"❌ Failed to partially update venue amenity: {response.status_code}")
        print(f"   Response: {response.text}")
        return False

def test_delete_venue_amenity(amenity_id):
    """Test DELETE /api/venue-amenities/{id}"""
    print(f"\n=== Testing DELETE Venue Amenity ===")

    response = requests.delete(f"{BASE_URL}/venue-amenities/{amenity_id}", headers=HEADERS)

    if response.status_code == 204:
        print("✅ Successfully deleted venue amenity")
        return True
    else:
        print(f"❌ Failed to delete venue amenity: {response.status_code}")
        print(f"   Response: {response.text}")
        return False

def test_delete_nonexistent_amenity():
    """Test DELETE for non-existent amenity (should return 404)"""
    print("\n=== Testing DELETE Non-existent Amenity (should fail) ===")

    fake_id = str(uuid.uuid4())
    response = requests.delete(f"{BASE_URL}/venue-amenities/{fake_id}", headers=HEADERS)

    if response.status_code == 404:
        print("✅ Correctly returned 404 for non-existent amenity deletion")
    else:
        print(f"❌ Expected 404, got: {response.status_code}")

def create_sample_amenities():
    """Create some sample amenities for testing"""
    print("\n=== Creating Sample Amenities ===")

    sample_amenities = [
        {"name": "Parking", "description": "On-site parking available"},
        {"name": "Accessibility", "description": "Wheelchair accessible facilities"},
        {"name": "Sound System", "description": "Professional audio equipment available"},
        {"name": "Catering Kitchen", "description": "Full commercial kitchen for catering"}
    ]

    created_ids = []
    for amenity in sample_amenities:
        response = requests.post(f"{BASE_URL}/venue-amenities",
                               json=amenity,
                               headers=HEADERS)
        if response.status_code == 201:
            data = response.json()
            created_ids.append(data['id'])
            print(f"✅ Created: {amenity['name']}")
        else:
            print(f"❌ Failed to create {amenity['name']}: {response.status_code}")

    return created_ids

def main():
    """Run all tests"""
    print("🚀 Starting Venue Amenities API Tests")
    print("=====================================")

    # Check if API is running
    try:
        response = requests.get(f"{BASE_URL.replace('/api', '')}/health")
        if response.status_code != 200:
            print("❌ API is not running. Please start the server first.")
            sys.exit(1)
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to API. Please start the server first.")
        sys.exit(1)

    print("✅ API is running")

    # Login (if needed)
    if not login():
        print("❌ Failed to authenticate")
        sys.exit(1)

    # Test sequence
    test_results = []

    # Test basic CRUD operations
    amenity_id = test_create_venue_amenity()
    if amenity_id:
        test_results.append("CREATE: ✅")

        test_create_duplicate_amenity()

        if test_get_venue_amenities():
            test_results.append("GET ALL: ✅")
        else:
            test_results.append("GET ALL: ❌")

        test_get_venue_amenities_with_filters()

        if test_get_venue_amenity_by_id(amenity_id):
            test_results.append("GET BY ID: ✅")
        else:
            test_results.append("GET BY ID: ❌")

        test_get_nonexistent_amenity()

        if test_update_venue_amenity(amenity_id):
            test_results.append("UPDATE: ✅")
        else:
            test_results.append("UPDATE: ❌")

        if test_partial_update_venue_amenity(amenity_id):
            test_results.append("PARTIAL UPDATE: ✅")
        else:
            test_results.append("PARTIAL UPDATE: ❌")

        if test_delete_venue_amenity(amenity_id):
            test_results.append("DELETE: ✅")
        else:
            test_results.append("DELETE: ❌")

        test_delete_nonexistent_amenity()
    else:
        test_results.append("CREATE: ❌")
        print("❌ Skipping remaining tests due to creation failure")

    # Create sample data for manual testing
    sample_ids = create_sample_amenities()

    # Summary
    print("\n" + "="*50)
    print("📋 TEST SUMMARY")
    print("="*50)
    for result in test_results:
        print(f"   {result}")

    if sample_ids:
        print(f"\n📝 Created {len(sample_ids)} sample amenities for manual testing")
        print("   You can now test the API manually using these amenities")

    print("\n🎉 Venue Amenities API testing completed!")

if __name__ == "__main__":
    main()