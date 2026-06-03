# Flowdesk API Testing Guide - Complete Version

## Overview

**NEW ENDPOINTS ADDED:**
- ✅ Company Documents Management (Create, Read, Update, Delete)
- ✅ Inquiry/Ticket Management System
- ✅ Dashboard & Analytics endpoints
- ✅ Admin APIs (Platform Management)
- ✅ Company Search & Pagination
- ✅ Statistics & Reporting

## Prerequisites

1. **Backend Running**: `pnpm dev` from the `backend` folder
2. **Docker Services Running**: `docker-compose up -d`
3. **Postman Installed**: Download from [postman.com](https://www.postman.com/downloads/)

## Import Postman Collection

1. Open **Postman**
2. Click **Import** (top-left)
3. Upload: `Flowdesk-API-Collection.postman_collection.json`
4. Click **Import**

---

## API Endpoints Summary

### 1️⃣ **AUTHENTICATION** (No Auth Required)
```
POST   /api/companies/register       → Create new company account
POST   /api/companies/login          → Get JWT token
```

### 2️⃣ **COMPANY PROFILE** (Auth Required)
```
GET    /api/companies/me             → Get your company profile
GET    /api/companies/:companyId     → Get any company (public)
PUT    /api/companies/profile        → Update company name, email, category
PUT    /api/companies/config         → Update API integration settings
```

### 3️⃣ **DOCUMENTS** (Auth Required)
```
GET    /api/companies/documents                → List all documents (paginated)
GET    /api/companies/documents/:documentId    → Get specific document
POST   /api/companies/upload                   → Upload PDF/Word/Text file
DELETE /api/companies/documents/:documentId    → Delete document
```

### 4️⃣ **CHAT & CONVERSATIONS** (Auth Required)
```
POST   /api/chat                     → Process customer support message
GET    /api/chat/history             → Get chat history for customer
```

### 5️⃣ **INQUIRIES & TICKETS** (Auth Required)
```
GET    /api/inquiries                           → Get all inquiries (paginated)
GET    /api/inquiries/:inquiryId                → Get specific inquiry with messages
GET    /api/inquiries/customer                  → Get inquiries by customer email
PUT    /api/inquiries/:inquiryId/status        → Update inquiry status
GET    /api/inquiries/dashboard                → Get dashboard statistics
```

### 6️⃣ **ADMIN APIs** (Public - No Auth)
```
GET    /api/admin/companies                    → Get all companies (paginated, searchable)
GET    /api/admin/companies/:companyId         → Get company details
GET    /api/admin/companies/:companyId/stats   → Get company statistics
GET    /api/admin/stats                        → Get platform-wide statistics
DELETE /api/admin/companies/:companyId         → Delete company and all data
```

### 7️⃣ **UTILITY**
```
GET    /health                       → Check backend health
```

---

## Step-by-Step Testing Guide

### Step 1: Register a Company
**Endpoint:** `POST /api/companies/register`

**Request Body:**
```json
{
  "email": "admin@techcorp.com",
  "password": "SecurePass123!",
  "companyName": "Tech Corp Solutions",
  "category": "SaaS",
  "domain": "techcorp.com",
  "supportEmail": "support@techcorp.com"
}
```

**Expected Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "company": {
    "id": "uuid-123",
    "email": "admin@techcorp.com",
    "companyName": "Tech Corp Solutions",
    "category": "SaaS"
  }
}
```

**✅ Save the token** - You'll need it for all authenticated requests

---

### Step 2: Login Company
**Endpoint:** `POST /api/companies/login`

**Request Body:**
```json
{
  "email": "admin@techcorp.com",
  "password": "SecurePass123!"
}
```

**Response:** Same as registration (includes JWT token)

---

### Step 3: Get Company Profile
**Endpoint:** `GET /api/companies/me`

**Headers:**
```
Authorization: Bearer {{token}}
```

**Response:**
```json
{
  "id": "uuid-123",
  "email": "admin@techcorp.com",
  "companyName": "Tech Corp Solutions",
  "category": "SaaS",
  "domain": "techcorp.com",
  "supportEmail": "support@techcorp.com",
  "apiBaseUrl": null,
  "apiAuthType": null,
  "kbDocuments": [],
  "inquiries": []
}
```

---

### Step 4: Upload Documents
**Endpoint:** `POST /api/companies/upload`

**Headers:**
```
Authorization: Bearer {{token}}
Content-Type: multipart/form-data
```

**Body:** Select file (PDF, Word, or Text)

**Response:**
```json
{
  "message": "Document uploaded successfully",
  "document": {
    "id": "doc-456",
    "fileName": "policy.pdf",
    "fileType": "application/pdf",
    "content": "...",
    "createdAt": "2026-06-02T10:30:00Z"
  }
}
```

---

### Step 5: Get All Documents
**Endpoint:** `GET /api/companies/documents?page=1&limit=10`

**Headers:**
```
Authorization: Bearer {{token}}
```

**Response:**
```json
{
  "message": "Documents retrieved successfully",
  "data": [
    {
      "id": "doc-456",
      "fileName": "policy.pdf",
      "fileType": "application/pdf",
      "createdAt": "2026-06-02T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

---

### Step 6: Process Customer Chat
**Endpoint:** `POST /api/chat`

**Headers:**
```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Request Body:**
```json
{
  "customerEmail": "john@example.com",
  "message": "My website has been down for 2 hours. This is urgent!"
}
```

**Response:**
```json
{
  "message": "Chat processed",
  "classification": {
    "category": "website_down",
    "confidence": 0.95
  },
  "response": "We understand your website is down. This is critical...",
  "customerValid": true,
  "chatId": "msg-789"
}
```

**Test Different Issue Categories:**
- "I want a refund" → `refund_request`
- "How do I reset my password?" → `password_reset`
- "My API quota exceeded" → `api_quota_exceeded`
- "I need to upgrade my plan" → `upgrade_request`

---

### Step 7: Get Chat History
**Endpoint:** `GET /api/chat/history?customerEmail=john@example.com`

**Headers:**
```
Authorization: Bearer {{token}}
```

**Response:**
```json
{
  "messages": [
    {
      "id": "msg-789",
      "companyId": "uuid-123",
      "customerEmail": "john@example.com",
      "customerMessage": "My website has been down...",
      "aiResponse": "We understand your website is down...",
      "category": "website_down",
      "confidence": 0.95,
      "createdAt": "2026-06-02T10:30:00Z"
    }
  ]
}
```

---

### Step 8: Get All Inquiries
**Endpoint:** `GET /api/inquiries?page=1&limit=10&status=open`

**Headers:**
```
Authorization: Bearer {{token}}
```

**Response:**
```json
{
  "message": "Inquiries retrieved successfully",
  "data": [
    {
      "id": "inq-123",
      "customerEmail": "john@example.com",
      "subject": "Website Down",
      "status": "open",
      "createdAt": "2026-06-02T10:30:00Z",
      "messages": [...]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

**Status Filter Options:** `open`, `in_progress`, `resolved`, `closed`

---

### Step 9: Update Inquiry Status
**Endpoint:** `PUT /api/inquiries/:inquiryId/status`

**Headers:**
```
Authorization: Bearer {{token}}
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "resolved"
}
```

**Response:**
```json
{
  "message": "Inquiry status updated",
  "inquiry": {
    "id": "inq-123",
    "status": "resolved",
    "updatedAt": "2026-06-02T10:35:00Z"
  }
}
```

---

### Step 10: Get Company Dashboard
**Endpoint:** `GET /api/inquiries/dashboard`

**Headers:**
```
Authorization: Bearer {{token}}
```

**Response:**
```json
{
  "message": "Dashboard data retrieved successfully",
  "dashboard": {
    "company": {
      "companyName": "Tech Corp Solutions",
      "category": "SaaS",
      "email": "admin@techcorp.com",
      "createdAt": "2026-06-02T10:00:00Z"
    },
    "metrics": {
      "totalChats": 15,
      "totalDocuments": 3
    },
    "recentChats": [...],
    "statusDistribution": [
      {"status": "open", "count": 5},
      {"status": "resolved", "count": 10}
    ],
    "categoryDistribution": [
      {"category": "website_down", "count": 5},
      {"category": "refund_request", "count": 3}
    ]
  }
}
```

---

## Admin APIs (No Auth Required)

### Get All Registered Companies
**Endpoint:** `GET /api/admin/companies?page=1&limit=10&search=`

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 10)
- `search`: Search by company name, email, or domain

**Response:**
```json
{
  "message": "Companies retrieved successfully",
  "data": [
    {
      "id": "uuid-123",
      "email": "admin@techcorp.com",
      "companyName": "Tech Corp Solutions",
      "category": "SaaS",
      "domain": "techcorp.com",
      "supportEmail": "support@techcorp.com",
      "createdAt": "2026-06-02T10:00:00Z",
      "_count": {
        "kbDocuments": 3,
        "inquiries": 5
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
```

---

### Get Platform Statistics
**Endpoint:** `GET /api/admin/stats`

**Response:**
```json
{
  "message": "Platform statistics retrieved",
  "stats": {
    "totalCompanies": 25,
    "totalChats": 150,
    "totalDocuments": 45,
    "companiesByCategory": [
      {"category": "SaaS", "count": 10},
      {"category": "Hosting", "count": 8},
      {"category": "Ecommerce", "count": 7}
    ]
  }
}
```

---

## Common Testing Scenarios

### Scenario 1: Company Onboarding Flow
```
1. Register Company
   ↓
2. Login Company
   ↓
3. Get Profile
   ↓
4. Update API Config
   ↓
5. Upload Documents
   ↓
6. Get Documents
```

### Scenario 2: Customer Support Workflow
```
1. Process Customer Chat (website_down)
   ↓
2. Process Customer Chat (refund_request)
   ↓
3. Get Chat History
   ↓
4. Get All Inquiries
   ↓
5. Update Inquiry Status → resolved
```

### Scenario 3: Analytics & Reporting
```
1. Get Company Dashboard
   ↓
2. Get Company Statistics (Admin)
   ↓
3. Get Platform Statistics (Admin)
   ↓
4. Get All Companies (Admin)
```

---

## Error Responses

### Missing Token
```json
{
  "message": "No token provided"
}
```

### Invalid Token
```json
{
  "message": "Invalid or expired authentication token"
}
```

### Not Found
```json
{
  "message": "Company not found"
}
```

### Invalid Data
```json
{
  "message": "Missing required fields"
}
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "No token provided" | Add Authorization header: `Bearer your_token` |
| "Connection refused" | Start backend: `pnpm dev` from backend folder |
| "Database error" | Ensure Docker containers running: `docker-compose up -d` |
| 404 Not Found | Verify correct company/document ID |
| 401 Unauthorized | Token expired, login again |
| File upload fails | Ensure file is PDF/Word/Text and < 10MB |

---

## Next Steps

✅ Test all endpoints locally with Postman
✅ Verify database records with Prisma Studio: `pnpm dlx prisma studio`
✅ Test error scenarios
✅ Deploy to AWS EC2
✅ Implement additional features:
   - Admin authentication middleware
   - Rate limiting
   - Request logging
   - Search analytics
   - Email notifications

🚀 Ready to deploy!
