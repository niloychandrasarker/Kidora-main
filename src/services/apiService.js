const BASE_URL = 'http://localhost:8080/api';

class ApiService {
  constructor() {
    this.baseURL = BASE_URL;
  }

  // Helper method to get auth headers
  getAuthHeaders() {
    // Align with AuthContext storage key
    const token = localStorage.getItem('kidora-token');
    return {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
  }

  // Helper method for API calls
  async makeRequest(url, options = {}) {
    const config = {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(`${this.baseURL}${url}`, config);
      const text = await response.text();
      let data = null;
      try { data = text ? JSON.parse(text) : null; } catch { /* not json */ }

      if (!response.ok) {
        const msg = (data && (data.message || data.error || data.details)) || `HTTP ${response.status}`;
        throw new Error(msg);
      }
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Product APIs
  async getAllProducts(page = 0, size = 20, category = null, search = null) {
    let url = `/products?page=${page}&size=${size}`;
    if (category) url += `&category=${category}`;
    if (search) url += `&search=${search}`;
    
    return this.makeRequest(url);
  }

  async getProductById(id) {
    return this.makeRequest(`/products/${id}`);
  }

  async getProductsByCategory(category) {
    return this.makeRequest(`/products?category=${category}`);
  }

  async searchProducts(query) {
    return this.makeRequest(`/products?search=${query}`);
  }

  // Admin Product APIs
  async createProduct(formData) {
    const res = await fetch(`${this.baseURL}/products/admin`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
      },
      body: formData,
    });
    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      try {
        const err = await res.json();
        msg = err?.message || msg;
  } catch { /* ignore parse error */ }
    
      return { success: false, message: msg };
    }
    return res.json();
  }

  async updateProduct(id, formData) {
    const res = await fetch(`${this.baseURL}/products/admin/${id}`, {
      method: 'PUT',
      headers: {
        ...this.getAuthHeaders(),
      },
      body: formData,
    });
    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      try {
        const err = await res.json();
        msg = err?.message || msg;
  } catch { /* ignore parse error */ }
      return { success: false, message: msg };
    }
    return res.json();
  }

  async deleteProduct(id) {
  // Backend delete mapping is DELETE /api/products/{id} (admin auth required)
  return this.makeRequest(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  async getLowStockProducts(threshold = 10) {
    return this.makeRequest(`/products/low-stock?threshold=${threshold}`);
  }

  // Authentication APIs
  async register(userData) {
    return this.makeRequest('/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
  }
  
  async sendOtp(email) {
    return this.makeRequest('/auth/send-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
  }

  async verifyOtp(email, otpCode) {
    return this.makeRequest('/auth/verify-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, otp: otpCode }),
    });
  }

  async login(email) {
    // Backward compatibility: alias to send-otp
    return this.sendOtp(email);
  }

  async logout() {
    return this.makeRequest('/auth/logout', {
      method: 'POST',
    });
  }

  // Order APIs
  async createOrder(orderData) {
    return this.makeRequest('/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });
  }

  async getUserOrders() {
    return this.makeRequest('/orders');
  }

  async getOrderById(id) {
    return this.makeRequest(`/orders/${id}`);
  }
  

  async updateOrderStatus(id, status) {
    return this.makeRequest(`/orders/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
  }

  async cancelOrder(id) {
    return this.makeRequest(`/orders/${id}/cancel`, {
      method: 'POST',
    });
  }

  // Address APIs
  async getUserAddresses() {
    return this.makeRequest('/addresses');
  }

  async createAddress(addressData) {
    return this.makeRequest('/addresses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(addressData),
    });
  }

  async updateAddress(id, addressData) {
    return this.makeRequest(`/addresses/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(addressData),
    });
  }

  async deleteAddress(id) {
    return this.makeRequest(`/addresses/${id}`, {
      method: 'DELETE',
    });
  }

  // User Profile APIs
  async getProfile() {
    return this.makeRequest('/user/me');
  }

  async updateProfile(profile) {
    return this.makeRequest('/user/me', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profile),
    });
  }

  // Admin APIs
  async getAllUsers() {
    return this.makeRequest('/admin/users');
  }

  async getDashboardOverview() {
    const res = await this.makeRequest('/admin/dashboard/overview');
    return res?.data ?? res;
  }

  async getAllOrders() {
    return this.makeRequest('/admin/orders');
  }

  async getAdminOrders(page = 0, size = 20) {
  const res = await this.makeRequest(`/admin/orders?page=${page}&size=${size}`);
  // Unwrap common shapes
  const data = res?.data ?? res;
  if (Array.isArray(data?.orders) || typeof data?.hasNext !== 'undefined') return data;
  if (Array.isArray(data?.content)) return { orders: data.content, hasNext: false, hasPrevious: false };
  if (Array.isArray(data)) return { orders: data, hasNext: false, hasPrevious: false };
  return data;
  }

  async updateAdminOrderStatus(orderId, status) {
  const res = await this.makeRequest(`/admin/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
  return res?.data ?? res;
  }

  async updateAdminPaymentStatus(orderId, paymentStatus) {
    return this.makeRequest(`/admin/orders/${orderId}/payment-status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentStatus }),
    });
  }

  // Admin Return Requests APIs
  async getReturnRequests() {
  const res = await this.makeRequest('/admin/returns');
  // Unwrap common shapes to return a plain array of return requests
  const data = res?.data ?? res;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  return [];
  }

  async updateReturnStatus(id, status) {
  const res = await this.makeRequest(`/admin/returns/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
  return res?.data ?? res;
  }

//   async getAllProducts() {
//     return this.makeRequest('/admin/products');
//   }

  // File Upload API
  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    return fetch(`${this.baseURL}/products/upload`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
      },
      body: formData,
    }).then(response => response.json());
  }

  // Hero Banners APIs
  async getHeroBanners() {
  const res = await this.makeRequest('/hero-banners');
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data?.content)) return res.data.content;
  if (Array.isArray(res?.content)) return res.content;
  return [];
  }

  async createHeroBanner(formData) {
    const res = await fetch(`${this.baseURL}/hero-banners`, {
      method: 'POST',
      headers: { ...this.getAuthHeaders() },
      body: formData,
    });
    return res.json();
  }

  async updateHeroBanner(id, formData) {
    const res = await fetch(`${this.baseURL}/hero-banners/${id}`, {
      method: 'PUT',
      headers: { ...this.getAuthHeaders() },
      body: formData,
    });
    return res.json();
  }

  async deleteHeroBanner(id) {
    return this.makeRequest(`/hero-banners/${id}`, { method: 'DELETE' });
  }

  // Cart APIs (authenticated)
  async getCart() {
    return this.makeRequest('/cart');
  }

  async addOrUpdateCartItem({ productId, quantity = 1, selectedSize = 'M' }) {
    const pid = Number(productId);
    return this.makeRequest('/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: pid, quantity: Number(quantity) || 1, selectedSize: selectedSize || 'M' }),
    });
  }

  async removeCartItem(productId, selectedSize) {
    const params = new URLSearchParams({ productId: String(productId), selectedSize: selectedSize || 'M' });
    return this.makeRequest(`/cart?${params.toString()}`, { method: 'DELETE' });
  }

  async clearCart() {
    return this.makeRequest('/cart/clear', { method: 'DELETE' });
  }

  // Wishlist APIs (authenticated)
  async getWishlist() {
    return this.makeRequest('/wishlist');
  }

  async toggleWishlist(productId) {
  const pid = Number(productId);
  const params = new URLSearchParams({ productId: String(pid) });
    return this.makeRequest(`/wishlist/toggle?${params.toString()}`, { method: 'POST' });
  }

  async removeWishlistItem(productId) {
  const pid = Number(productId);
  const params = new URLSearchParams({ productId: String(pid) });
    return this.makeRequest(`/wishlist?${params.toString()}`, { method: 'DELETE' });
  }
}

export default new ApiService();
