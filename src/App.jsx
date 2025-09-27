import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import { OrderProvider } from "./context/OrderContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CartPage from "./pages/CartPage";
import WishlistPage from "./pages/WishlistPage";
import CheckoutPage from "./pages/CheckoutPage";
import ProfilePage from "./pages/ProfilePage";
import OrdersPage from "./pages/OrdersPage";
import OrderDetails from "./pages/OrderDetails";
import AdminLayout from "./admin/AdminLayout";
import Dashboard from "./admin/pages/Dashboard";

import HeroBanners from "./admin/pages/HeroBanners";
import AdminOrders from "./admin/pages/Orders";
import AdminReturns from "./admin/pages/Returns";
import AdminUsers from "./admin/pages/Users";
import "./App.css";
import {lazy} from "react";

const HomePage = lazy(() => import("./pages/HomePage"));
const ProductDetails = lazy(() => import("./pages/ProductDetails"));
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));

const Products = lazy(() => import("./admin/pages/Products"));



function AppShell() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  return (
    <div className={`min-h-screen bg-gray-50 flex flex-col ${!isAdmin ? 'pt-16' : ''}`}>
      {!isAdmin && <Navbar />}
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/category/:categoryName" element={<CategoryPage />} />
          <Route path="/product/:productId" element={<ProductDetails />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/search" element={<SearchPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/orders/:orderId" element={<OrderDetails />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="hero" element={<HeroBanners />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="returns" element={<AdminReturns />} />
            <Route path="users" element={<AdminUsers />} />
          </Route>
        </Routes>
      </div>
      {!isAdmin && <Footer />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <OrderProvider>
          <Router>
            <AppShell />
          </Router>
        </OrderProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
