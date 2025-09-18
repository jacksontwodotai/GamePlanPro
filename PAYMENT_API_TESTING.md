# Payment Processing API Testing Guide

This document provides examples for testing the payment processing API endpoints.

## Authentication

All endpoints require a valid Supabase auth token in the Authorization header:
```
Authorization: Bearer <your_supabase_jwt_token>
```

## Endpoints

### 1. Process Payment
**POST** `/api/payments/process`

```bash
curl -X POST http://localhost:2004/api/payments/process \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "registration_id": 1,
    "amount": 50.00,
    "payment_method_details": {
      "method": "credit_card",
      "card_last_four": "1234",
      "brand": "visa"
    }
  }'
```

### 2. List Payments
**GET** `/api/payments`

```bash
# Get all payments
curl -X GET http://localhost:2004/api/payments \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Filter by registration ID
curl -X GET "http://localhost:2004/api/payments?registration_id=1" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Filter by status and pagination
curl -X GET "http://localhost:2004/api/payments?status=Completed&page=1&limit=5" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 3. Get Payment Details
**GET** `/api/payments/{payment_id}`

```bash
curl -X GET http://localhost:2004/api/payments/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Registration Management (Supporting Endpoints)

### Create Registration
**POST** `/api/registrations`

```bash
curl -X POST http://localhost:2004/api/registrations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "user_id": 1,
    "team_id": 1,
    "player_id": 1,
    "registration_fee": 150.00,
    "notes": "Season registration for player"
  }'
```

### List Registrations
**GET** `/api/registrations`

```bash
curl -X GET http://localhost:2004/api/registrations \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Get Registration Details
**GET** `/api/registrations/{registration_id}`

```bash
curl -X GET http://localhost:2004/api/registrations/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Sample Response Formats

### Payment Process Response
```json
{
  "message": "Payment processed successfully",
  "payment": {
    "id": 1,
    "registration_id": 1,
    "amount": "50.00",
    "payment_method": "credit_card",
    "status": "Completed",
    "transaction_id": "txn_1726626017861_1",
    "processed_at": "2024-09-18T08:46:57.861Z",
    "created_at": "2024-09-18T08:46:57.861Z"
  }
}
```

### Payments List Response
```json
{
  "payments": [
    {
      "id": 1,
      "registration_id": 1,
      "amount": "50.00",
      "payment_method": "credit_card",
      "status": "Completed",
      "registrations": {
        "id": 1,
        "registration_fee": "150.00",
        "amount_paid": "50.00",
        "balance_due": "100.00",
        "status": "Pending",
        "users": {
          "id": 1,
          "first_name": "John",
          "last_name": "Doe",
          "email": "john@example.com"
        },
        "teams": {
          "id": 1,
          "name": "Team Alpha",
          "organization": "Sports Club"
        },
        "players": {
          "id": 1,
          "first_name": "Jane",
          "last_name": "Smith",
          "email": "jane@example.com"
        }
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

## Error Handling

All endpoints return appropriate HTTP status codes:
- `200`: Success
- `201`: Created successfully
- `400`: Bad request (validation errors)
- `401`: Unauthorized (invalid/missing token)
- `404`: Resource not found
- `409`: Conflict (duplicate registration)
- `500`: Internal server error

Error responses include a descriptive message:
```json
{
  "error": "registration_id, amount, and payment_method_details are required"
}
```