# Complete API Reference - Frontend Usage

**Base URL:** `http://localhost:8080/api`  
**Authentication:** Bearer token in Authorization header  
**Frontend Implementation:** Uses `apiService.js` wrapper

---

## 📊 API Summary Overview

**Total APIs Used:** 32 endpoints  
**Authentication Required:** 27 endpoints  
**Public Endpoints:** 5 endpoints

---

## 🔐 Authentication APIs (5 endpoints)

### 1. Register User
- **Endpoint:** `POST /api/auth/register`
- **Access:** Public
- **Frontend Usage:** `apiService.register(userData)`
- **Parameters:**
  ```json
  {
    "firstName": "string",
    "lastName": "string", 
    "email": "string",
    "phone": "string",
    "password": "string"
  }
  ```

### 2. Send OTP for Login
- **Endpoint:** `POST /api/auth/send-otp`
- **Access:** Public
- **Frontend Usage:** `apiService.sendOtp(email)` or `apiService.login(email)`
- **Parameters:**
  ```json
  {
    "email": "string"
  }
  ```

### 3. Verify OTP & Login
- **Endpoint:** `POST /api/auth/verify-otp`
- **Access:** Public
- **Frontend Usage:** `apiService.verifyOtp(email, otpCode)`
- **Parameters:**
  ```json
  {
    "email": "string",
    "otp": "string"
  }
  ```

### 4. Validate Token
- **Endpoint:** `POST /api/auth/validate-token`
- **Access:** Authenticated
- **Frontend Usage:** Auto-called for token validation
- **Parameters:** Token in Authorization header

### 5. Logout
- **Endpoint:** `POST /api/auth/logout`
- **Access:** Authenticated
- **Frontend Usage:** `apiService.logout()`
- **Parameters:** None (token in header)

---

## 🛍️ Product APIs (8 endpoints)

### 6. Get All Products (with filters)
- **Endpoint:** `GET /api/products`
- **Access:** Public
- **Frontend Usage:** `apiService.getAllProducts(page, size, category, search)`
- **Query Parameters:**
  - `page`: number (default: 0)
  - `size`: number (default: 20)
  - `category`: string (optional)
  - `search`: string (optional)

### 7. Get Product by ID
- **Endpoint:** `GET /api/products/{id}`
- **Access:** Public
- **Frontend Usage:** `apiService.getProductById(id)`
- **Path Parameters:**
  - `id`: number (product ID)

### 8. Get Products by Category
- **Endpoint:** `GET /api/products?category={category}`
- **Access:** Public
- **Frontend Usage:** `apiService.getProductsByCategory(category)`
- **Query Parameters:**
  - `category`: string

### 9. Search Products
- **Endpoint:** `GET /api/products?search={query}`
- **Access:** Public
- **Frontend Usage:** `apiService.searchProducts(query)`
- **Query Parameters:**
  - `search`: string

### 10. Create Product (Admin)
- **Endpoint:** `POST /api/products/admin`
- **Access:** Admin only
- **Frontend Usage:** `apiService.createProduct(formData)`
- **Parameters:** FormData with:
  - `name`: string
  - `description`: string
  - `price`: number
  - `category`: string
  - `stock`: number
  - `images`: File[]
  - `mainImage`: File

### 11. Update Product (Admin)
- **Endpoint:** `PUT /api/products/admin/{id}`
- **Access:** Admin only
- **Frontend Usage:** `apiService.updateProduct(id, formData)`
- **Parameters:** Same as create + path parameter `id`

### 12. Delete Product (Admin)
- **Endpoint:** `DELETE /api/products/{id}`
- **Access:** Admin only
- **Frontend Usage:** `apiService.deleteProduct(id)`
- **Path Parameters:**
  - `id`: number

### 13. Get Low Stock Products (Admin)
- **Endpoint:** `GET /api/products/low-stock`
- **Access:** Admin only
- **Frontend Usage:** `apiService.getLowStockProducts(threshold)`
- **Query Parameters:**
  - `threshold`: number (default: 10)

---

## 📦 Order APIs (6 endpoints)

### 14. Create Order
- **Endpoint:** `POST /api/orders`
- **Access:** Authenticated
- **Frontend Usage:** `apiService.createOrder(orderData)`
- **Parameters:**
  ```json
  {
    "items": [
      {
        "productId": "number",
        "quantity": "number",
        "selectedSize": "string",
        "price": "number"
      }
    ],
    "shippingAddress": {
      "street": "string",
      "city": "string",
      "state": "string",
      "zipCode": "string",
      "country": "string"
    },
    "paymentMethod": "string",
    "totalAmount": "number"
  }
  ```

### 15. Get User Orders
- **Endpoint:** `GET /api/orders`
- **Access:** Authenticated
- **Frontend Usage:** `apiService.getUserOrders()`
- **Parameters:** None

### 16. Get Order by ID
- **Endpoint:** `GET /api/orders/{id}`
- **Access:** Authenticated
- **Frontend Usage:** `apiService.getOrderById(id)`
- **Path Parameters:**
  - `id`: number

### 17. Update Order Status
- **Endpoint:** `PUT /api/orders/{id}/status`
- **Access:** Authenticated (user's own order)
- **Frontend Usage:** `apiService.updateOrderStatus(id, status)`
- **Parameters:**
  ```json
  {
    "status": "string" // PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED
  }
  ```

### 18. Cancel Order
- **Endpoint:** `POST /api/orders/{id}/cancel`
- **Access:** Authenticated
- **Frontend Usage:** `apiService.cancelOrder(id)`
- **Path Parameters:**
  - `id`: number

### 19. Get Admin Orders (Admin)
- **Endpoint:** `GET /api/admin/orders`
- **Access:** Admin/Sub-Admin
- **Frontend Usage:** `apiService.getAdminOrders(page, size)`
- **Query Parameters:**
  - `page`: number (default: 0)
  - `size`: number (default: 20)

---

## 🛒 Cart APIs (4 endpoints)

### 20. Get Cart
- **Endpoint:** `GET /api/cart`
- **Access:** Authenticated
- **Frontend Usage:** `apiService.getCart()`
- **Parameters:** None

### 21. Add/Update Cart Item
- **Endpoint:** `POST /api/cart`
- **Access:** Authenticated
- **Frontend Usage:** `apiService.addOrUpdateCartItem({productId, quantity, selectedSize})`
- **Parameters:**
  ```json
  {
    "productId": "number",
    "quantity": "number",
    "selectedSize": "string"
  }
  ```

### 22. Remove Cart Item
- **Endpoint:** `DELETE /api/cart`
- **Access:** Authenticated
- **Frontend Usage:** `apiService.removeCartItem(productId, selectedSize)`
- **Query Parameters:**
  - `productId`: number
  - `selectedSize`: string

### 23. Clear Cart
- **Endpoint:** `DELETE /api/cart/clear`
- **Access:** Authenticated
- **Frontend Usage:** `apiService.clearCart()`
- **Parameters:** None

---

## ❤️ Wishlist APIs (3 endpoints)

### 24. Get Wishlist
- **Endpoint:** `GET /api/wishlist`
- **Access:** Authenticated
- **Frontend Usage:** `apiService.getWishlist()`
- **Parameters:** None

### 25. Toggle Wishlist Item
- **Endpoint:** `POST /api/wishlist/toggle`
- **Access:** Authenticated
- **Frontend Usage:** `apiService.toggleWishlist(productId)`
- **Query Parameters:**
  - `productId`: number

### 26. Remove Wishlist Item
- **Endpoint:** `DELETE /api/wishlist`
- **Access:** Authenticated
- **Frontend Usage:** `apiService.removeWishlistItem(productId)`
- **Query Parameters:**
  - `productId`: number

---

## 🏠 Address APIs (4 endpoints)

### 27. Get User Addresses
- **Endpoint:** `GET /api/addresses`
- **Access:** Authenticated
- **Frontend Usage:** `apiService.getUserAddresses()`
- **Parameters:** None

### 28. Create Address
- **Endpoint:** `POST /api/addresses`
- **Access:** Authenticated
- **Frontend Usage:** `apiService.createAddress(addressData)`
- **Parameters:**
  ```json
  {
    "street": "string",
    "city": "string",
    "state": "string",
    "zipCode": "string",
    "country": "string",
    "isDefault": "boolean"
  }
  ```

### 29. Update Address
- **Endpoint:** `PUT /api/addresses/{id}`
- **Access:** Authenticated
- **Frontend Usage:** `apiService.updateAddress(id, addressData)`
- **Parameters:** Same as create + path parameter `id`

### 30. Delete Address
- **Endpoint:** `DELETE /api/addresses/{id}`
- **Access:** Authenticated
- **Frontend Usage:** `apiService.deleteAddress(id)`
- **Path Parameters:**
  - `id`: number

---

## 👤 User Profile APIs (2 endpoints)

### 31. Get Profile
- **Endpoint:** `GET /api/user/me`
- **Access:** Authenticated
- **Frontend Usage:** `apiService.getProfile()`
- **Parameters:** None

### 32. Update Profile
- **Endpoint:** `PUT /api/user/me`
- **Access:** Authenticated
- **Frontend Usage:** `apiService.updateProfile(profile)`
- **Parameters:**
  ```json
  {
    "firstName": "string",
    "lastName": "string",
    "email": "string",
    "phone": "string"
  }
  ```

---

## 🎨 Hero Banner APIs (4 endpoints)

### 33. Get Hero Banners
- **Endpoint:** `GET /api/hero-banners`
- **Access:** Public
- **Frontend Usage:** `apiService.getHeroBanners()`
- **Parameters:** None

### 34. Create Hero Banner (Admin)
- **Endpoint:** `POST /api/hero-banners`
- **Access:** Admin only
- **Frontend Usage:** `apiService.createHeroBanner(formData)`
- **Parameters:** FormData with banner details

### 35. Update Hero Banner (Admin)
- **Endpoint:** `PUT /api/hero-banners/{id}`
- **Access:** Admin only
- **Frontend Usage:** `apiService.updateHeroBanner(id, formData)`
- **Parameters:** Same as create + path parameter `id`

### 36. Delete Hero Banner (Admin)
- **Endpoint:** `DELETE /api/hero-banners/{id}`
- **Access:** Admin only
- **Frontend Usage:** `apiService.deleteHeroBanner(id)`
- **Path Parameters:**
  - `id`: number

---

## 📂 File Upload API (1 endpoint)

### 37. Upload File
- **Endpoint:** `POST /api/products/upload`
- **Access:** Admin only
- **Frontend Usage:** `apiService.uploadFile(file)`
- **Parameters:** FormData with `file` field

---

## 👥 Admin User Management APIs (2 endpoints)

### 38. Get All Users (Admin)
- **Endpoint:** `GET /api/admin/users`
- **Access:** Admin only
- **Frontend Usage:** `apiService.getAllUsers()`
- **Parameters:** None

### 39. Change User Role (Admin)
- **Endpoint:** `PUT /api/admin/users/{id}/role`
- **Access:** Admin only
- **Frontend Usage:** Direct `api.makeRequest()` call
- **Parameters:**
  ```json
  {
    "role": "string" // USER, SUB_ADMIN, ADMIN
  }
  ```

---

## 📊 Admin Dashboard APIs (3 endpoints)

### 40. Get Dashboard Overview
- **Endpoint:** `GET /api/admin/dashboard/overview`
- **Access:** Admin/Sub-Admin
- **Frontend Usage:** `apiService.getDashboardOverview()`
- **Parameters:** None

### 41. Update Admin Order Status
- **Endpoint:** `PUT /api/admin/orders/{id}/status`
- **Access:** Admin/Sub-Admin
- **Frontend Usage:** `apiService.updateAdminOrderStatus(orderId, status)`
- **Parameters:**
  ```json
  {
    "status": "string"
  }
  ```

### 42. Update Admin Payment Status
- **Endpoint:** `PUT /api/admin/orders/{id}/payment-status`
- **Access:** Admin/Sub-Admin
- **Frontend Usage:** `apiService.updateAdminPaymentStatus(orderId, paymentStatus)`
- **Parameters:**
  ```json
  {
    "paymentStatus": "string"
  }
  ```

---

## 🔄 Return Request APIs (2 endpoints)

### 43. Get Return Requests (Admin)
- **Endpoint:** `GET /api/admin/returns`
- **Access:** Admin/Sub-Admin
- **Frontend Usage:** `apiService.getReturnRequests()`
- **Parameters:** None

### 44. Update Return Status (Admin)
- **Endpoint:** `PUT /api/admin/returns/{id}/status`
- **Access:** Admin/Sub-Admin
- **Frontend Usage:** `apiService.updateReturnStatus(id, status)`
- **Parameters:**
  ```json
  {
    "status": "string" // PENDING, APPROVED, REJECTED, COMPLETED
  }
  ```

---

## 🔧 Frontend API Service Implementation

All APIs are accessed through the centralized `apiService.js` wrapper:

```javascript
// Base configuration
const BASE_URL = 'http://localhost:8080/api';

// Authentication headers automatically added
getAuthHeaders() {
  const token = localStorage.getItem('kidora-token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

// Centralized request handler
async makeRequest(url, options = {}) {
  // Handles auth headers, error parsing, response formatting
}
```

## 🚀 Usage Examples

### Authentication Flow
```javascript
// 1. Send OTP
await apiService.sendOtp('user@example.com');

// 2. Verify OTP & Login
const response = await apiService.verifyOtp('user@example.com', '123456');
```

### Product Operations
```javascript
// Get products with filters
const products = await apiService.getAllProducts(0, 10, 'clothing', 'shirt');

// Get single product
const product = await apiService.getProductById(123);
```

### Cart Management
```javascript
// Add to cart
await apiService.addOrUpdateCartItem({
  productId: 123,
  quantity: 2,
  selectedSize: 'L'
});

// Get cart items
const cart = await apiService.getCart();
```

### Order Processing
```javascript
// Create order
const order = await apiService.createOrder({
  items: [...],
  shippingAddress: {...},
  paymentMethod: 'CARD',
  totalAmount: 99.99
});
```

---

## ⚠️ Error Handling

All API calls include comprehensive error handling:

```javascript
try {
  const response = await apiService.someApiCall();
  // Handle success
} catch (error) {
  // Error message from backend or generic HTTP error
  console.error('API Error:', error.message);
}
```

---

## 🔒 Authentication & Authorization

- **Public APIs:** 5 endpoints (products, hero banners, auth initiation)
- **User APIs:** 22 endpoints (require valid JWT token)
- **Admin APIs:** 15 endpoints (require ADMIN or SUB_ADMIN role)
- **Admin-only APIs:** 8 endpoints (require ADMIN role only)

---

## 📝 Notes

1. All authenticated endpoints require JWT token in Authorization header
2. Admin endpoints have role-based access control (ADMIN/SUB_ADMIN)
3. File uploads use FormData for multipart handling
4. Error responses include structured error messages
5. Success responses follow consistent format with `success` and `data` fields
6. Query parameters are automatically URL-encoded
7. Response data is automatically unwrapped for different backend response formats

This document covers **ALL** APIs currently used in the Kidora frontend application.
