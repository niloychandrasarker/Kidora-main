# Kidora E-Commerce Platform

A full-stack e-commerce application built with React (frontend) and Spring Boot (backend).

## Tech Stack

- **Frontend**: React 18, Vite, TailwindCSS
- **Backend**: Spring Boot 3.x, Java 21
- **Database**: PostgreSQL
- **Authentication**: JWT + OTP
- **File Upload**: Multipart file handling
- **PDF Generation**: jsPDF

## API Documentation

Base URL: `http://localhost:8080/api`

### 📋 Complete API Summary

**Total APIs:** 44 endpoints used in frontend  
**Public APIs:** 5 (products, banners, auth)  
**Authenticated APIs:** 39 (user, cart, orders, admin)

| Category | APIs | Key Features |
|----------|------|-------------|
| **Authentication** | 5 | OTP login, JWT tokens, role validation |
| **Products** | 8 | CRUD, search, categories, file upload |
| **Orders** | 6 | Create, track, admin management |
| **Cart & Wishlist** | 7 | Add/remove items, toggle favorites |
| **User Management** | 6 | Profile, addresses, admin user control |
| **Hero Banners** | 4 | Dynamic homepage banners |
| **File Upload** | 1 | Image/video uploads |
| **Returns** | 2 | Return request handling |
| **Admin Dashboard** | 5+ | Analytics, order management, role control |

> **📄 Complete Documentation:** See [API_COMPLETE_REFERENCE.md](./API_COMPLETE_REFERENCE.md) for detailed parameter documentation of all 44 APIs.

### Response Format
**Success Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human readable message"
}
```

---

## Authentication & Profile APIs

### 1. Request OTP
**Endpoint:** `POST /api/auth/request-otp`  
**Access:** Public  
**Description:** Request OTP for email-based login

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:8080/api/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com"}'
```

### 2. Verify OTP
**Endpoint:** `POST /api/auth/verify-otp`  
**Access:** Public  
**Description:** Verify OTP and receive JWT token

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "email": "user@example.com",
      "role": "USER",
      "firstName": "John",
      "lastName": "Doe"
    }
  }
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:8080/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "otp": "123456"}'
```

### 3. Get User Profile
**Endpoint:** `GET /api/user/me`  
**Access:** Authenticated  
**Description:** Get current user's profile information

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+8801234567890",
    "role": "USER",
    "createdAt": "2025-01-01T10:00:00"
  }
}
```

**cURL Example:**
```bash
curl -H "Authorization: Bearer <TOKEN>" \
  http://localhost:8080/api/user/me
```

### 4. Update User Profile
**Endpoint:** `PUT /api/user/me`  
**Access:** Authenticated  
**Description:** Update current user's profile

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "phone": "+8801234567890"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "firstName": "John",
    "lastName": "Smith",
    "phone": "+8801234567890"
  }
}
```

---

## Product APIs (Public)

### 5. List Products
**Endpoint:** `GET /api/products`  
**Access:** Public  
**Description:** Get paginated list of products

**Query Parameters:**
- `page` (optional): Page number (default: 0)
- `size` (optional): Items per page (default: 20)
- `search` (optional): Search in title/description
- `category` (optional): Filter by category
- `sort` (optional): Sort field (title, price, createdAt)
- `direction` (optional): Sort direction (asc, desc)

**Example URL:**
```
GET /api/products?page=0&size=10&search=shirt&category=clothing&sort=price&direction=asc
```

**Response:**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": 1,
        "title": "Cotton T-Shirt",
        "description": "Comfortable cotton t-shirt",
        "price": 25.99,
        "discount": 10,
        "stock": 100,
        "category": "clothing",
        "images": ["http://localhost:8080/uploads/products/image1.jpg"],
        "mainImage": "http://localhost:8080/uploads/products/main1.jpg",
        "videoUrl": "https://youtube.com/watch?v=abc123",
        "rating": 4.5,
        "availableSizes": ["S", "M", "L", "XL"],
        "createdAt": "2025-01-01T10:00:00"
      }
    ],
    "totalElements": 50,
    "totalPages": 5,
    "size": 10,
    "number": 0,
    "first": true,
    "last": false
  }
}
```

**cURL Example:**
```bash
curl "http://localhost:8080/api/products?page=0&size=5&search=shirt"
```

### 6. Get Product Details
**Endpoint:** `GET /api/products/{id}`  
**Access:** Public  
**Description:** Get detailed information about a specific product

**Path Parameters:**
- `id`: Product ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Cotton T-Shirt",
    "description": "High-quality cotton t-shirt perfect for casual wear",
    "price": 25.99,
    "discount": 10,
    "stock": 100,
    "category": "clothing",
    "images": [
      "http://localhost:8080/uploads/products/image1.jpg",
      "http://localhost:8080/uploads/products/image2.jpg"
    ],
    "mainImage": "http://localhost:8080/uploads/products/main1.jpg",
    "videoUrl": "https://youtube.com/watch?v=abc123",
    "rating": 4.5,
    "reviews": 25,
    "availableSizes": ["S", "M", "L", "XL"],
    "createdAt": "2025-01-01T10:00:00"
  }
}
```

**cURL Example:**
```bash
curl http://localhost:8080/api/products/1
```

---

## Product Management APIs (Admin/Sub-Admin)

### 7. Create Product
**Endpoint:** `POST /api/admin/products`  
**Access:** ADMIN, SUB_ADMIN  
**Description:** Create a new product

**Content-Type:** `multipart/form-data`

**Form Parameters:**
- `title` (required): Product title
- `description` (required): Product description
- `price` (required): Product price
- `discount` (optional): Discount percentage
- `stock` (required): Available stock
- `category` (required): Product category
- `videoUrl` (optional): YouTube video URL
- `availableSizes` (optional): Comma-separated sizes (S,M,L,XL)
- `mainImage` (file, required): Main product image
- `images` (files, optional): Additional product images

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Cotton T-Shirt",
    "price": 25.99,
    "stock": 100
  }
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:8080/api/admin/products \
  -H "Authorization: Bearer <TOKEN>" \
  -F "title=Cotton T-Shirt" \
  -F "description=High quality cotton t-shirt" \
  -F "price=25.99" \
  -F "stock=100" \
  -F "category=clothing" \
  -F "availableSizes=S,M,L,XL" \
  -F "mainImage=@/path/to/main-image.jpg" \
  -F "images=@/path/to/image1.jpg" \
  -F "images=@/path/to/image2.jpg"
```

### 8. Update Product
**Endpoint:** `PUT /api/admin/products/{id}`  
**Access:** ADMIN, SUB_ADMIN  
**Description:** Update existing product

**Path Parameters:**
- `id`: Product ID

**Content-Type:** `multipart/form-data`
Same form parameters as Create Product (all optional for update)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Updated Cotton T-Shirt",
    "price": 29.99
  }
}
```

### 9. Delete Product
**Endpoint:** `DELETE /api/admin/products/{id}`  
**Access:** ADMIN, SUB_ADMIN  
**Description:** Delete a product

**Path Parameters:**
- `id`: Product ID

**Response:**
```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

**cURL Example:**
```bash
curl -X DELETE http://localhost:8080/api/admin/products/1 \
  -H "Authorization: Bearer <TOKEN>"
```

---

## Hero Banner APIs

### 10. Get Hero Banners (Public)
**Endpoint:** `GET /api/hero-banners`  
**Access:** Public  
**Description:** Get all active hero banners

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Summer Sale",
      "subtitle": "Up to 50% off",
      "imageUrl": "http://localhost:8080/uploads/banners/banner1.jpg",
      "buttonText": "Shop Now",
      "buttonLink": "/category/summer",
      "isActive": true,
      "order": 1
    }
  ]
}
```

### 11. Create Hero Banner
**Endpoint:** `POST /api/admin/hero-banners`  
**Access:** ADMIN, SUB_ADMIN  
**Description:** Create new hero banner

**Content-Type:** `multipart/form-data`

**Form Parameters:**
- `title` (required): Banner title
- `subtitle` (optional): Banner subtitle
- `buttonText` (optional): Button text
- `buttonLink` (optional): Button link URL
- `isActive` (optional): Active status (default: true)
- `order` (optional): Display order (default: 0)
- `image` (file, required): Banner image

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Summer Sale",
    "imageUrl": "http://localhost:8080/uploads/banners/banner1.jpg"
  }
}
```

### 12. Update Hero Banner
**Endpoint:** `PUT /api/admin/hero-banners/{id}`  
**Access:** ADMIN, SUB_ADMIN

### 13. Delete Hero Banner
**Endpoint:** `DELETE /api/admin/hero-banners/{id}`  
**Access:** ADMIN, SUB_ADMIN

---

## Order APIs

### 14. Place Order
**Endpoint:** `POST /api/orders`  
**Access:** Authenticated  
**Description:** Place a new order

**Request Body:**
```json
{
  "items": [
    {
      "productId": 1,
      "quantity": 2,
      "selectedSize": "M"
    }
  ],
  "shippingAddress": {
    "name": "John Doe",
    "phone": "+8801234567890",
    "address": "123 Main St, Dhaka, Bangladesh",
    "city": "Dhaka",
    "postalCode": "1000"
  },
  "paymentMethod": "COD",
  "senderNumber": "+8801234567890",
  "transactionId": "TXN123456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 101,
    "orderNumber": "ORD-2025-001",
    "status": "PROCESSING",
    "totalAmount": 91.98,
    "subtotal": 51.98,
    "shippingCost": 40.00,
    "paymentMethod": "COD",
    "createdAt": "2025-01-01T10:00:00"
  }
}
```

### 15. Get My Orders
**Endpoint:** `GET /api/orders/my`  
**Access:** Authenticated  
**Description:** Get current user's orders

**Query Parameters:**
- `page` (optional): Page number (default: 0)
- `size` (optional): Items per page (default: 10)

**Response:**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": 101,
        "orderNumber": "ORD-2025-001",
        "status": "DELIVERED",
        "totalAmount": 91.98,
        "paymentMethod": "COD",
        "createdAt": "2025-01-01T10:00:00",
        "items": [
          {
            "productId": 1,
            "productTitle": "Cotton T-Shirt",
            "quantity": 2,
            "unitPrice": 25.99,
            "selectedSize": "M"
          }
        ]
      }
    ],
    "totalElements": 5,
    "totalPages": 1
  }
}
```

### 16. Get Order Details
**Endpoint:** `GET /api/orders/{id}`  
**Access:** Authenticated (own orders only)  
**Description:** Get detailed order information

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 101,
    "orderNumber": "ORD-2025-001",
    "status": "DELIVERED",
    "totalAmount": 91.98,
    "subtotal": 51.98,
    "shippingCost": 40.00,
    "paymentMethod": "COD",
    "shippingAddress": {
      "name": "John Doe",
      "phone": "+8801234567890",
      "address": "123 Main St, Dhaka, Bangladesh"
    },
    "items": [
      {
        "productId": 1,
        "productTitle": "Cotton T-Shirt",
        "quantity": 2,
        "unitPrice": 25.99,
        "selectedSize": "M"
      }
    ],
    "createdAt": "2025-01-01T10:00:00",
    "deliveredAt": "2025-01-05T15:30:00"
  }
}
```

---

## Admin Order Management APIs

### 17. Get All Orders (Admin)
**Endpoint:** `GET /api/admin/orders`  
**Access:** ADMIN, SUB_ADMIN  
**Description:** Get all orders with full details

**Query Parameters:**
- `page` (optional): Page number (default: 0)
- `size` (optional): Items per page (default: 50)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 101,
      "orderNumber": "ORD-2025-001",
      "createdAt": "2025-01-01T10:00:00",
      "status": "PROCESSING",
      "paymentMethod": "COD",
      "userEmail": "customer@example.com",
      "totalAmount": 91.98,
      "subtotal": 51.98,
      "shippingCost": 40.00,
      "shippingName": "John Doe",
      "shippingPhone": "+8801234567890",
      "shippingAddress": "123 Main St, Dhaka",
      "items": [
        {
          "productId": 1,
          "title": "Cotton T-Shirt",
          "quantity": 2,
          "unitPrice": 25.99,
          "size": "M"
        }
      ]
    }
  ]
}
```

**cURL Example:**
```bash
curl -H "Authorization: Bearer <TOKEN>" \
  "http://localhost:8080/api/admin/orders?page=0&size=10"
```

### 18. Update Order Status
**Endpoint:** `PUT /api/admin/orders/{id}/status`  
**Access:** ADMIN, SUB_ADMIN  
**Description:** Update order status

**Path Parameters:**
- `id`: Order ID

**Request Body:**
```json
{
  "status": "SHIPPED"
}
```

**Status Flow:**
```
PROCESSING → PACKED → SHIPPED → OUT_FOR_DELIVERY → DELIVERED
                ↓
            CANCELLED (before SHIPPED)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 101,
    "status": "SHIPPED",
    "updatedAt": "2025-01-02T14:30:00"
  }
}
```

**cURL Example:**
```bash
curl -X PUT http://localhost:8080/api/admin/orders/101/status \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"status": "SHIPPED"}'
```

---

## Return Request APIs

### 19. Create Return Request
**Endpoint:** `POST /api/returns`  
**Access:** Authenticated  
**Description:** Create return request for delivered order

**Request Body:**
```json
{
  "orderId": 101,
  "productId": 1,
  "reason": "Product doesn't fit properly",
  "reasonCategory": "SIZE_ISSUE",
  "images": ["base64ImageString1", "base64ImageString2"]
}
```

**Reason Categories:**
- `SIZE_ISSUE`
- `QUALITY_ISSUE` 
- `WRONG_ITEM`
- `DAMAGED`
- `OTHER`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 201,
    "orderId": 101,
    "status": "PENDING",
    "reason": "Product doesn't fit properly",
    "reasonCategory": "SIZE_ISSUE",
    "createdAt": "2025-01-10T09:00:00"
  }
}
```

### 20. Get Admin Return Requests
**Endpoint:** `GET /api/admin/returns`  
**Access:** ADMIN, SUB_ADMIN  
**Description:** Get all return requests

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 201,
      "orderId": 101,
      "productId": 1,
      "status": "PENDING",
      "reason": "Product doesn't fit properly", 
      "reasonCategory": "SIZE_ISSUE",
      "userEmail": "customer@example.com",
      "createdAt": "2025-01-10T09:00:00",
      "images": ["http://localhost:8080/uploads/returns/img1.jpg"]
    }
  ]
}
```

### 21. Update Return Status
**Endpoint:** `PUT /api/admin/returns/{id}/status`  
**Access:** ADMIN, SUB_ADMIN  
**Description:** Approve, reject or complete return request

**Request Body:**
```json
{
  "status": "APPROVED"
}
```

**Status Flow:**
```
PENDING → APPROVED → COMPLETED
    ↓
  REJECTED
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 201,
    "status": "APPROVED",
    "updatedAt": "2025-01-11T10:30:00"
  }
}
```

---

## Dashboard & Analytics APIs

### 22. Get Dashboard Overview
**Endpoint:** `GET /api/admin/dashboard/overview`  
**Access:** ADMIN, SUB_ADMIN  
**Description:** Get comprehensive dashboard analytics

**Response:**
```json
{
  "success": true,
  "data": {
    "totalOrders": 1250,
    "totalRevenue": 125750.50,
    "itemsSold7d": 245,
    "revenueTrend": [
      {
        "date": "2025-01-01",
        "revenue": 5240.75
      },
      {
        "date": "2025-01-02", 
        "revenue": 6180.25
      }
    ],
    "topProducts": [
      {
        "productId": 1,
        "title": "Cotton T-Shirt",
        "quantitySold": 125,
        "revenue": 3248.75
      }
    ],
    "returns": {
      "pending": 5,
      "approved": 12,
      "rejected": 3,
      "completed": 8
    }
  }
}
```

**cURL Example:**
```bash
curl -H "Authorization: Bearer <TOKEN>" \
  http://localhost:8080/api/admin/dashboard/overview
```

---

## User Management APIs

### 23. Get All Users
**Endpoint:** `GET /api/admin/users`  
**Access:** ADMIN only  
**Description:** Get list of all users

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "USER",
      "createdAt": "2025-01-01T10:00:00"
    },
    {
      "id": 2,
      "email": "admin@example.com", 
      "firstName": "Admin",
      "lastName": "User",
      "role": "ADMIN",
      "createdAt": "2025-01-01T08:00:00"
    }
  ]
}
```

### 24. Update User Role
**Endpoint:** `PUT /api/admin/users/{id}/role`  
**Access:** ADMIN only  
**Description:** Promote user to SUB_ADMIN or demote to USER

**Path Parameters:**
- `id`: User ID

**Request Body:**
```json
{
  "role": "SUB_ADMIN"
}
```

**Valid Roles:**
- `USER`: Regular customer
- `SUB_ADMIN`: Limited admin access (no user management)
- `ADMIN`: Full access (cannot be demoted via API)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 5,
    "email": "user@example.com",
    "oldRole": "USER",
    "newRole": "SUB_ADMIN",
    "updatedAt": "2025-01-15T12:00:00"
  }
}
```

**cURL Example:**
```bash
curl -X PUT http://localhost:8080/api/admin/users/5/role \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"role": "SUB_ADMIN"}'
```

---

## File Upload APIs

### 25. Generic File Upload
**Endpoint:** `POST /api/admin/upload`  
**Access:** ADMIN, SUB_ADMIN  
**Description:** Upload files (used internally by product/banner creation)

**Content-Type:** `multipart/form-data`

**Form Parameters:**
- `file`: File to upload

**Response:**
```json
{
  "success": true,
  "data": {
    "filename": "abc123.jpg",
    "url": "http://localhost:8080/uploads/products/abc123.jpg",
    "size": 245760
  }
}
```

---

## Error Codes Reference

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_OTP` | 400 | OTP is invalid or expired |
| `USER_NOT_FOUND` | 404 | User does not exist |
| `ACCESS_DENIED` | 403 | Insufficient permissions |
| `PRODUCT_NOT_FOUND` | 404 | Product does not exist |
| `ORDER_NOT_FOUND` | 404 | Order does not exist |
| `INVALID_ORDER_STATUS` | 400 | Invalid status transition |
| `RETURN_NOT_ALLOWED` | 400 | Return not allowed for this order |
| `FILE_UPLOAD_FAILED` | 500 | File upload error |
| `ORDERS_LOAD_FAILED` | 500 | Error loading orders |
| `RETURNS_LOAD_FAILED` | 500 | Error loading returns |
| `USERS_LOAD_FAILED` | 500 | Error loading users |

---

## Authentication

All protected endpoints require JWT token in Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Role-Based Access

- **Public**: No authentication required
- **Authenticated**: Valid JWT token required  
- **ADMIN**: Full access to all endpoints
- **SUB_ADMIN**: Admin access except user management
- **USER**: Basic customer access

---

## Development Setup

1. **Clone repository**
```bash
git clone https://github.com/niloychandrasarker/Kidora-main.git
cd Kidora-main
```

2. **Backend setup**
```bash
cd kidora-backend
./mvnw spring-boot:run
```

3. **Frontend setup**
```bash
npm install
npm run dev
```

4. **Database setup**
- Install PostgreSQL
- Create database: `kidora`
- Update `application.properties` with your DB credentials

---

## Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up --build

# Access application
Frontend: http://localhost:5173
Backend API: http://localhost:8080/api
```

---

## Notes

- All file uploads support JPG, PNG, GIF formats
- Maximum file size: 10MB per file
- OTP expires after 10 minutes
- JWT tokens expire after 24 hours
- Order status changes are irreversible in most cases
- Returns are only allowed for DELIVERED orders within 30 days

---

For more details, check the source code or contact the development team.
