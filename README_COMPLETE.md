# Kidora E-commerce Platform

## 🚀 Features

### Frontend (React + Vite)
- **Modern UI/UX**: Clean and responsive design with Tailwind CSS
- **Authentication**: Email + OTP verification system
- **Shopping Cart & Wishlist**: Persistent localStorage data
- **Product Management**: Categories, search, filtering
- **Order Tracking**: Multi-step order status tracking
- **Admin Panel**: Complete admin dashboard for managing products, orders, and hero banners
- **Payment Integration**: COD and Mobile Banking (bKash, Nagad, Rocket)

### Backend (Spring Boot + PostgreSQL)
- **JWT Authentication**: Secure token-based authentication
- **OTP Verification**: Email-based OTP system
- **RESTful APIs**: Complete CRUD operations
- **Order Management**: Full order lifecycle management
- **Admin Controls**: Admin-only endpoints with role-based access
- **Database**: PostgreSQL with JPA/Hibernate

## 🛠️ Tech Stack

### Frontend
- React 19.1.1
- Vite 7.1.3
- Tailwind CSS 4.1.12
- React Router DOM 7.8.1
- Lucide React (Icons)
- Fuse.js (Search)

### Backend
- Spring Boot 3.5.5
- Java 21
- PostgreSQL
- Spring Security + JWT
- Spring Mail
- Maven

## 📋 Prerequisites

### Frontend
- Node.js 18+ and npm
- Modern web browser

### Backend
- Java 21
- PostgreSQL 12+
- Maven (optional, wrapper included)

## 🚀 Quick Start

### 1. Database Setup
```sql
-- Create PostgreSQL database
CREATE DATABASE kidora;
-- User: postgres, Password: root
```

### 2. Backend Setup
```bash
cd kidora-backend

# Configure email in application.properties
# spring.mail.username=your-email@gmail.com
# spring.mail.password=your-app-password

# Run backend server
.\mvnw.cmd spring-boot:run
# Server will start on http://localhost:8080
```

### 3. Frontend Setup
```bash
cd ../

# Install dependencies
npm install

# Start development server
npm run dev
# Frontend will start on http://localhost:5173
```

## 🔐 Authentication System

### User Authentication
- Email-based registration with OTP verification
- Login with email + OTP (no passwords)
- JWT tokens for session management
- Persistent authentication state

### Admin Access
- **Admin Email**: `niloysarker.cs@gmail.com`
- Admin gets OTP via email for secure login
- Admin panel accessible at `/admin`
- Role-based access control

## 📱 API Endpoints

### Authentication
- `POST /api/auth/send-otp` - Send login OTP
- `POST /api/auth/register/send-otp` - Send registration OTP
- `POST /api/auth/verify-otp` - Verify OTP and login
- `POST /api/auth/register` - Complete registration
- `POST /api/auth/validate-token` - Validate JWT token

### Products
- `GET /api/products` - Get all products (with pagination, search, category filter)
- `GET /api/products/{id}` - Get product by ID
- `GET /api/products/categories` - Get categories
- `POST /api/products` - Create product (Admin only)
- `PUT /api/products/{id}` - Update product (Admin only)
- `DELETE /api/products/{id}` - Delete product (Admin only)

### Orders
- `POST /api/orders` - Create new order
- `GET /api/orders` - Get user orders
- `GET /api/orders/{id}` - Get order details

### Addresses
- `GET /api/addresses` - Get user addresses
- `POST /api/addresses` - Create address
- `PUT /api/addresses/{id}` - Update address
- `DELETE /api/addresses/{id}` - Delete address
- `GET /api/addresses/default` - Get default address

### Admin
- `GET /api/admin/dashboard/stats` - Dashboard statistics
- `GET /api/admin/orders` - All orders with pagination
- `PUT /api/admin/orders/{id}/status` - Update order status
- `PUT /api/admin/orders/{id}/payment-status` - Update payment status

## 💾 Database Schema

### Users
- Email-based authentication
- Role-based access (USER/ADMIN)
- Profile information

### Products
- Complete product information
- Category management
- Stock tracking
- Image galleries

### Orders
- Order lifecycle management
- Payment tracking
- Shipping information
- Order items with product snapshots

### Addresses
- User shipping addresses
- Default address selection

## 🛒 Order Flow

1. **Browse Products**: Users can browse, search, and filter products
2. **Add to Cart**: Products added to cart with size selection
3. **Checkout**: User selects/adds shipping address
4. **Payment**: Choose COD or Mobile Banking
5. **Order Tracking**: Real-time order status updates
6. **Admin Management**: Admins can update order status

## 🎨 Admin Features

- **Dashboard**: Sales statistics and overview
- **Product Management**: CRUD operations for products
- **Order Management**: View and update order status
- **Hero Banner Management**: Manage homepage banners
- **User Management**: View user orders and details

## 📧 Email Configuration

Update `application.properties` with your Gmail credentials:
```properties
spring.mail.username=your-email@gmail.com
spring.mail.password=your-app-password
```

**Note**: Use App Password for Gmail, not regular password.

## 🔒 Security Features

- JWT token authentication
- OTP-based login (no passwords)
- Role-based access control
- CORS configuration
- Request validation
- Secure admin access

## 📱 Mobile Responsive

- Fully responsive design
- Mobile-first approach
- Touch-friendly interface
- Optimized for all screen sizes

## 🚀 Deployment

### Frontend (Vercel/Netlify)
```bash
npm run build
# Deploy dist/ folder
```

### Backend (Railway/Heroku)
```bash
# Set environment variables
# DATABASE_URL=postgresql://...
# JWT_SECRET=your-secret
# MAIL_USERNAME=your-email
# MAIL_PASSWORD=your-password
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support or questions, contact: niloysarker.cs@gmail.com

---

**Happy Shopping with Kidora! 🛍️**
