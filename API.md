# API Documentation

This document describes the REST API endpoints for the Church Portal backend.

## Base URL

- **Production**: https://backend.blacksea-4befa204.eastus2.azurecontainerapps.io
- **Local Development**: http://localhost:5000

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Common Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional error details"
}
```

## Authentication Endpoints

### POST /api/auth/register
Register a new user.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "jwt-token-here",
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "member"
    }
  }
}
```

### POST /api/auth/login
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "jwt-token-here",
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "member"
    }
  }
}
```

## Donation Endpoints

### GET /api/donations
Get all donations (admin/treasurer only) or user's donations.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `startDate` (optional): Filter from date (YYYY-MM-DD)
- `endDate` (optional): Filter to date (YYYY-MM-DD)

**Response:**
```json
{
  "success": true,
  "data": {
    "donations": [
      {
        "id": 1,
        "donorId": 1,
        "amount": 500.00,
        "donationType": "tithe",
        "paymentMethod": "check",
        "checkNumber": "1234",
        "donationDate": "2024-01-15",
        "createdAt": "2024-01-15T10:30:00Z",
        "donor": {
          "name": "John Doe",
          "email": "john@example.com"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

### POST /api/donations
Create a new donation entry.

**Request Body:**
```json
{
  "donorId": 1,
  "amount": 500.00,
  "donationType": "tithe",
  "paymentMethod": "check",
  "checkNumber": "1234",
  "donationDate": "2024-01-15",
  "notes": "Monthly tithe"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "donorId": 1,
    "amount": 500.00,
    "donationType": "tithe",
    "paymentMethod": "check",
    "checkNumber": "1234",
    "donationDate": "2024-01-15",
    "notes": "Monthly tithe",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

## Donor Endpoints

### GET /api/donors
Get all donors (admin/treasurer only).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "555-1234",
      "address": "123 Main St",
      "city": "Anytown",
      "state": "ST",
      "zipCode": "12345",
      "isFamily": false,
      "familyMembers": [],
      "totalDonations": 2500.00,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST /api/donors
Create a new donor.

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "555-5678",
  "address": "456 Oak Ave",
  "city": "Hometown",
  "state": "ST",
  "zipCode": "54321",
  "isFamily": true,
  "familyMembers": ["Spouse Name", "Child Name"]
}
```

### GET /api/donors/search
Search donors by name or email.

**Query Parameters:**
- `q`: Search query string

## Expense Endpoints

### GET /api/expenses
Get expense submissions.

**Query Parameters:**
- `status` (optional): Filter by status (pending, approved, rejected)
- `userId` (optional): Filter by user ID
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response:**
```json
{
  "success": true,
  "data": {
    "expenses": [
      {
        "id": 1,
        "userId": 1,
        "amount": 45.67,
        "category": "office supplies",
        "description": "Printer paper and ink",
        "expenseDate": "2024-01-15",
        "status": "pending",
        "receiptUrl": "https://storage.blob.core.windows.net/receipts/receipt-123.pdf",
        "createdAt": "2024-01-15T14:30:00Z",
        "user": {
          "name": "John Doe",
          "email": "john@example.com"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "pages": 1
    }
  }
}
```

### POST /api/expenses
Submit a new expense.

**Content-Type**: multipart/form-data

**Form Fields:**
- `amount`: Expense amount
- `category`: Expense category
- `description`: Description of expense
- `expenseDate`: Date of expense (YYYY-MM-DD)
- `receipt`: File upload (PDF, JPEG, PNG)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "userId": 1,
    "amount": 45.67,
    "category": "office supplies",
    "description": "Printer paper and ink",
    "expenseDate": "2024-01-15",
    "status": "pending",
    "receiptUrl": "https://storage.blob.core.windows.net/receipts/receipt-123.pdf",
    "createdAt": "2024-01-15T14:30:00Z"
  }
}
```

### PUT /api/expenses/:id/status
Update expense status (admin/treasurer only).

**Request Body:**
```json
{
  "status": "approved",
  "notes": "Approved for reimbursement"
}
```

## Offering Endpoints

### GET /api/offerings
Get offering entries.

**Query Parameters:**
- `startDate` (optional): Filter from date
- `endDate` (optional): Filter to date
- `type` (optional): Filter by offering type

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "offeringDate": "2024-01-14",
      "serviceType": "Sunday Morning",
      "totalAmount": 2500.00,
      "cashAmount": 500.00,
      "checkAmount": 2000.00,
      "checkCount": 12,
      "notes": "Good offering today",
      "createdAt": "2024-01-14T20:00:00Z"
    }
  ]
}
```

### POST /api/offerings
Create a new offering entry (admin/treasurer only).

**Request Body:**
```json
{
  "offeringDate": "2024-01-14",
  "serviceType": "Sunday Morning",
  "cashAmount": 500.00,
  "checkAmount": 2000.00,
  "checkCount": 12,
  "notes": "Good offering today"
}
```

## Report Endpoints

### GET /api/reports/donations
Generate donation report.

**Query Parameters:**
- `startDate`: Start date (required)
- `endDate`: End date (required)
- `format` (optional): Response format (json, pdf)

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalAmount": 12500.00,
      "totalDonations": 45,
      "averageDonation": 277.78,
      "donorCount": 23
    },
    "byType": {
      "tithe": 8000.00,
      "offering": 3500.00,
      "building": 1000.00
    },
    "byMonth": [
      {
        "month": "2024-01",
        "amount": 6250.00,
        "count": 22
      }
    ]
  }
}
```

### GET /api/reports/expenses
Generate expense report.

**Query Parameters:**
- `startDate`: Start date (required)
- `endDate`: End date (required)
- `category` (optional): Filter by category
- `status` (optional): Filter by status

### GET /api/reports/donor/:donorId
Generate individual donor report.

**Query Parameters:**
- `year`: Tax year (default: current year)

## File Upload Endpoints

### POST /api/upload/receipt
Upload receipt file.

**Content-Type**: multipart/form-data
**Form Field**: `receipt` (file)

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://storage.blob.core.windows.net/receipts/receipt-123.pdf",
    "filename": "receipt-123.pdf",
    "size": 245760
  }
}
```

## Health Check

### GET /health
Check API health status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "database": "connected",
  "storage": "accessible"
}
```

## Error Codes

- **400**: Bad Request - Invalid input data
- **401**: Unauthorized - Missing or invalid JWT token
- **403**: Forbidden - Insufficient permissions
- **404**: Not Found - Resource not found
- **422**: Validation Error - Input validation failed
- **429**: Too Many Requests - Rate limit exceeded
- **500**: Internal Server Error - Server error

## Rate Limits

- **General**: 100 requests per 15 minutes per IP
- **Auth**: 5 login attempts per 15 minutes per IP
- **File Upload**: 10 uploads per hour per user

## Data Types

### Donation Types
- `tithe`
- `offering`
- `building`
- `missions`
- `other`

### Payment Methods
- `cash`
- `check`
- `online`
- `card`

### Expense Categories
- `office supplies`
- `utilities`
- `maintenance`
- `events`
- `missions`
- `other`

### User Roles
- `member`: Basic user permissions
- `admin`: Full administrative access
- `treasurer`: Financial management permissions

## Examples

### Complete Donation Workflow

1. **Create Donor**:
   ```bash
   curl -X POST https://backend.blacksea-4befa204.eastus2.azurecontainerapps.io/api/donors \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"name":"John Doe","email":"john@example.com"}'
   ```

2. **Add Donation**:
   ```bash
   curl -X POST https://backend.blacksea-4befa204.eastus2.azurecontainerapps.io/api/donations \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"donorId":1,"amount":500,"donationType":"tithe","paymentMethod":"check"}'
   ```

3. **Generate Report**:
   ```bash
   curl "https://backend.blacksea-4befa204.eastus2.azurecontainerapps.io/api/reports/donations?startDate=2024-01-01&endDate=2024-12-31" \
     -H "Authorization: Bearer $TOKEN"
   ```

### Error Handling Example

```javascript
// Frontend error handling
try {
  const response = await fetch('/api/donations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(donationData)
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Request failed');
  }
  
  const result = await response.json();
  console.log('Success:', result.data);
} catch (error) {
  console.error('Error:', error.message);
}
```

---

For additional information or support, please refer to the [GitHub repository](https://github.com/sangeethdba/church-portal).