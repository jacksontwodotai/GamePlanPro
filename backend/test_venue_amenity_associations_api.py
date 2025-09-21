#!/usr/bin/env python3
"""
Test script for Venue-Amenity Association API endpoints
Tests all CRUD operations for venue-amenity associations
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
    print("⚠️  Skipping authentication for testing (using existing auth bypass)")
    return True

def create_test_venue():
    """Create a test venue for associations"""
    print("\n=== Creating Test Venue ===")

    venue_data = {
        "name": f"Test Venue {uuid.uuid4().hex[:8]}",
        "address": "123 Test Street",
        "city": "Test City",
        "state": "Test State",
        "zip_code": "12345",
        "capacity": 100,
        "description": "Test venue for amenity associations"
    }

    response = requests.post(f"{BASE_URL}/venues",
                           json=venue_data,
                           headers=HEADERS)

    if response.status_code == 201:
        data = response.json()
        print(f"✅ Created test venue: {data['name']} (ID: {data['id']})")
        return data['id']
    else:
        print(f"❌ Failed to create test venue: {response.status_code}")
        print(f"   Response: {response.text}")
        return None

def create_test_amenities():
    """Create test amenities for associations"""
    print("\n=== Creating Test Amenities ===")

    test_amenities = [
        {"name": f"WiFi-{uuid.uuid4().hex[:8]}", "description": "High-speed internet"},
        {"name": f"Parking-{uuid.uuid4().hex[:8]}", "description": "Free parking"},
        {"name": f"AV Equipment-{uuid.uuid4().hex[:8]}", "description": "Audio/Visual equipment"}
    ]

    created_amenities = []
    for amenity in test_amenities:
        response = requests.post(f"{BASE_URL}/venue-amenities",
                               json=amenity,
                               headers=HEADERS)
        if response.status_code == 201:
            data = response.json()
            created_amenities.append(data['id'])
            print(f"✅ Created amenity: {amenity['name']} (ID: {data['id']})")
        else:
            print(f"❌ Failed to create amenity {amenity['name']}: {response.status_code}")

    return created_amenities

def test_create_venue_amenity_associations(venue_id, amenity_ids):
    """Test POST /api/venues/{venue_id}/amenities"""
    print(f"\n=== Testing CREATE Venue-Amenity Associations ===")

    if len(amenity_ids) < 2:
        print("❌ Need at least 2 amenities for testing")
        return False

    association_data = {
        "associations": [
            {
                "amenity_id": amenity_ids[0],
                "quantity": 5,
                "notes": "Located in main hall"
            },
            {
                "amenity_id": amenity_ids[1],
                "quantity": 100,
                "notes": "Free parking spaces"
            }
        ]
    }

    response = requests.post(f"{BASE_URL}/venues/{venue_id}/amenities",
                           json=association_data,
                           headers=HEADERS)

    if response.status_code == 201:
        data = response.json()
        print(f"✅ Successfully created {len(data)} venue-amenity associations")
        for assoc in data:
            print(f"   - Amenity ID: {assoc['amenity_id']}, Quantity: {assoc['quantity']}")
        return True
    else:
        print(f"❌ Failed to create associations: {response.status_code}")
        print(f"   Response: {response.text}")
        return False

def test_create_duplicate_association(venue_id, amenity_id):
    """Test creating duplicate association (should fail)"""
    print(f"\n=== Testing CREATE Duplicate Association (should fail) ===")

    association_data = {
        "associations": [
            {
                "amenity_id": amenity_id,
                "quantity": 1,
                "notes": "Duplicate test"
            }
        ]
    }

    response = requests.post(f"{BASE_URL}/venues/{venue_id}/amenities",
                           json=association_data,
                           headers=HEADERS)

    if response.status_code == 409:
        print("✅ Correctly rejected duplicate association")
    else:
        print(f"❌ Expected 409 conflict, got: {response.status_code}")
        print(f"   Response: {response.text}")

def test_get_venue_amenities(venue_id):
    """Test GET /api/venues/{venue_id}/amenities"""
    print(f"\n=== Testing GET Venue Amenities ===")

    response = requests.get(f"{BASE_URL}/venues/{venue_id}/amenities", headers=HEADERS)

    if response.status_code == 200:
        data = response.json()
        print(f"✅ Successfully retrieved {len(data)} venue amenities")
        for assoc in data:
            amenity_name = assoc.get('amenity', {}).get('name', 'Unknown')
            print(f"   - {amenity_name}: Qty={assoc['quantity']}, Notes={assoc['notes']}")
        return len(data) > 0
    else:
        print(f"❌ Failed to get venue amenities: {response.status_code}")
        print(f"   Response: {response.text}")
        return False

def test_update_venue_amenity_association(venue_id, amenity_id):
    """Test PUT /api/venues/{venue_id}/amenities/{amenity_id}"""
    print(f"\n=== Testing UPDATE Venue-Amenity Association ===")

    update_data = {
        "quantity": 10,
        "notes": "Updated: Located in conference room"
    }

    response = requests.put(f"{BASE_URL}/venues/{venue_id}/amenities/{amenity_id}",
                          json=update_data,
                          headers=HEADERS)

    if response.status_code == 200:
        data = response.json()
        print(f"✅ Successfully updated association")
        print(f"   New quantity: {data['quantity']}")
        print(f"   New notes: {data['notes']}")
        return True
    else:
        print(f"❌ Failed to update association: {response.status_code}")
        print(f"   Response: {response.text}")
        return False

def test_update_nonexistent_association(venue_id):
    """Test updating non-existent association (should fail)"""
    print(f"\n=== Testing UPDATE Non-existent Association (should fail) ===")

    fake_amenity_id = str(uuid.uuid4())
    update_data = {
        "quantity": 5,
        "notes": "Should not work"
    }

    response = requests.put(f"{BASE_URL}/venues/{venue_id}/amenities/{fake_amenity_id}",
                          json=update_data,
                          headers=HEADERS)

    if response.status_code == 404:
        print("✅ Correctly returned 404 for non-existent association")
    else:
        print(f"❌ Expected 404, got: {response.status_code}")

def test_delete_venue_amenity_association(venue_id, amenity_id):
    """Test DELETE /api/venues/{venue_id}/amenities/{amenity_id}"""
    print(f"\n=== Testing DELETE Venue-Amenity Association ===")

    response = requests.delete(f"{BASE_URL}/venues/{venue_id}/amenities/{amenity_id}", headers=HEADERS)

    if response.status_code == 204:
        print("✅ Successfully deleted association")
        return True
    else:
        print(f"❌ Failed to delete association: {response.status_code}")
        print(f"   Response: {response.text}")
        return False

def test_delete_nonexistent_association(venue_id):
    """Test deleting non-existent association (should fail)"""
    print(f"\n=== Testing DELETE Non-existent Association (should fail) ===")

    fake_amenity_id = str(uuid.uuid4())
    response = requests.delete(f"{BASE_URL}/venues/{venue_id}/amenities/{fake_amenity_id}", headers=HEADERS)

    if response.status_code == 404:
        print("✅ Correctly returned 404 for non-existent association deletion")
    else:
        print(f"❌ Expected 404, got: {response.status_code}")

def test_invalid_venue_operations():
    """Test operations with invalid venue ID"""
    print(f"\n=== Testing Operations with Invalid Venue ID ===")

    fake_venue_id = str(uuid.uuid4())
    fake_amenity_id = str(uuid.uuid4())

    # Test create with invalid venue
    association_data = {
        "associations": [
            {
                "amenity_id": fake_amenity_id,
                "quantity": 1
            }
        ]
    }

    response = requests.post(f"{BASE_URL}/venues/{fake_venue_id}/amenities",
                           json=association_data,
                           headers=HEADERS)

    if response.status_code == 404:
        print("✅ Correctly rejected creation with invalid venue ID")
    else:
        print(f"❌ Expected 404 for invalid venue, got: {response.status_code}")

def cleanup_test_data(venue_id, amenity_ids):
    """Clean up test data"""
    print(f"\n=== Cleaning Up Test Data ===")

    # Delete venue (should cascade delete associations)
    if venue_id:
        response = requests.delete(f"{BASE_URL}/venues/{venue_id}", headers=HEADERS)
        if response.status_code == 204:
            print("✅ Deleted test venue")
        else:
            print(f"⚠️  Could not delete test venue: {response.status_code}")

    # Delete amenities
    for amenity_id in amenity_ids:
        response = requests.delete(f"{BASE_URL}/venue-amenities/{amenity_id}", headers=HEADERS)
        if response.status_code == 204:
            print(f"✅ Deleted test amenity: {amenity_id}")
        else:
            print(f"⚠️  Could not delete test amenity {amenity_id}: {response.status_code}")

def main():
    """Run all tests"""
    print("🚀 Starting Venue-Amenity Association API Tests")
    print("=" * 55)

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

    # Setup test data
    venue_id = create_test_venue()
    if not venue_id:
        print("❌ Failed to create test venue, aborting tests")
        sys.exit(1)

    amenity_ids = create_test_amenities()
    if len(amenity_ids) < 3:
        print("❌ Failed to create enough test amenities, aborting tests")
        sys.exit(1)

    # Test sequence
    test_results = []

    try:
        # Test basic CRUD operations
        if test_create_venue_amenity_associations(venue_id, amenity_ids):
            test_results.append("CREATE ASSOCIATIONS: ✅")

            test_create_duplicate_association(venue_id, amenity_ids[0])

            if test_get_venue_amenities(venue_id):
                test_results.append("GET ASSOCIATIONS: ✅")
            else:
                test_results.append("GET ASSOCIATIONS: ❌")

            if test_update_venue_amenity_association(venue_id, amenity_ids[0]):
                test_results.append("UPDATE ASSOCIATION: ✅")
            else:
                test_results.append("UPDATE ASSOCIATION: ❌")

            test_update_nonexistent_association(venue_id)

            if test_delete_venue_amenity_association(venue_id, amenity_ids[1]):
                test_results.append("DELETE ASSOCIATION: ✅")
            else:
                test_results.append("DELETE ASSOCIATION: ❌")

            test_delete_nonexistent_association(venue_id)

        else:
            test_results.append("CREATE ASSOCIATIONS: ❌")
            print("❌ Skipping remaining tests due to creation failure")

        # Test error cases
        test_invalid_venue_operations()

    finally:
        # Clean up test data
        cleanup_test_data(venue_id, amenity_ids)

    # Summary
    print("\n" + "="*50)
    print("📋 TEST SUMMARY")
    print("="*50)
    for result in test_results:
        print(f"   {result}")

    print("\n🎉 Venue-Amenity Association API testing completed!")

if __name__ == "__main__":
    main()