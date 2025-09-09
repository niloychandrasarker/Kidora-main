import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import apiService from "../services/apiService";
import { useAuth } from "./AuthContext";

const CartContext = createContext();

// Custom hook to use cart context
const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

// Main CartProvider component
export default function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);

  // Helpers
  const parsePrice = useCallback((val) => {
    const n = parseFloat(String(val ?? '').replace(/[৳$\s,]/g, ''));
    return isNaN(n) ? 0 : n;
  }, []);

  // Load from backend
  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) { setCartItems([]); return []; }
    try {
      const res = await apiService.getCart();
      const data = res?.data ?? res;
      const list = Array.isArray(data) ? data : (data?.items || []);
      setCartItems(list);
      return list;
    } catch {
      setCartItems([]);
      return [];
    }
  }, [isAuthenticated]);

  const refreshWishlist = useCallback(async () => {
    if (!isAuthenticated) { setWishlistItems([]); return []; }
    try {
      const res = await apiService.getWishlist();
      const data = res?.data ?? res;
      const list = Array.isArray(data) ? data : (data?.items || []);
      setWishlistItems(list);
      return list;
    } catch {
      setWishlistItems([]);
      return [];
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshCart();
      refreshWishlist();
    } else {
      setCartItems([]);
      setWishlistItems([]);
    }
  }, [isAuthenticated, refreshCart, refreshWishlist]);

  // Cart actions
  const addToCart = useCallback(async (product, quantity = 1, selectedSize = 'M') => {
    if (!isAuthenticated) {
      return { success: false, message: 'Please sign in to add items to cart' };
    }
    const id = product?.id ?? product?._id ?? product?.productId;
    if (!id) return { success: false, message: 'Invalid product' };
    const payload = { productId: id, quantity, selectedSize };
    try {
      await apiService.addOrUpdateCartItem(payload);
      await refreshCart();
      return { success: true };
    } catch (e) {
      return { success: false, message: e?.message || 'Failed to add to cart' };
    }
  }, [isAuthenticated, refreshCart]);

  const updateCartQuantity = useCallback(async (productId, selectedSize, quantity) => {
    if (quantity <= 0) {
      await apiService.removeCartItem(productId, selectedSize);
      await refreshCart();
      return;
    }
    await apiService.addOrUpdateCartItem({ productId, quantity, selectedSize });
    await refreshCart();
  }, [refreshCart]);

  const removeFromCart = useCallback(async (productId, selectedSize = 'M') => {
    await apiService.removeCartItem(productId, selectedSize);
    await refreshCart();
  }, [refreshCart]);

  const clearCart = useCallback(async () => {
    await apiService.clearCart();
    await refreshCart();
  }, [refreshCart]);

  const getCartTotal = useCallback(() => {
    return cartItems.reduce((total, item) => total + parsePrice(item.price) * (item.quantity || 1), 0);
  }, [cartItems, parsePrice]);

  const cartItemsCount = useMemo(() => cartItems.reduce((sum, it) => sum + (it.quantity || 1), 0), [cartItems]);

  // Wishlist actions
  const isInWishlist = useCallback((productId) => {
    const pid = productId != null ? String(productId) : '';
    return wishlistItems.some(w => String(w.id ?? w.productId) === pid);
  }, [wishlistItems]);

  const toggleWishlist = useCallback(async (input) => {
    if (!isAuthenticated) {
      return { success: false, message: 'Please sign in to use wishlist' };
    }
    const idRaw = (typeof input === 'object') ? (input.id ?? input._id ?? input.productId) : input;
    const id = idRaw != null ? Number(idRaw) : NaN;
    if (!id || Number.isNaN(id)) return { success: false };
    try {
      await apiService.toggleWishlist(id);
      await refreshWishlist();
      return { success: true };
    } catch (e) {
      return { success: false, message: e?.message || 'Wishlist update failed' };
    }
  }, [isAuthenticated, refreshWishlist]);

  const removeFromWishlist = useCallback(async (productId) => {
    const id = Number(productId);
    await apiService.removeWishlistItem(id);
    await refreshWishlist();
  }, [refreshWishlist]);

  const clearWishlist = useCallback(() => setWishlistItems([]), []);

  const wishlistItemsCount = useMemo(() => wishlistItems.length, [wishlistItems]);

  const value = {
    // Cart
    cartItems,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    getCartTotal,
    cartItemsCount,
    refreshCart,

    // Wishlist
    wishlistItems,
    wishlistItemsCount,
    isInWishlist,
    toggleWishlist,
    removeFromWishlist,
    clearWishlist,
    refreshWishlist,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// Export both useCart hook and CartProvider component
// eslint-disable-next-line react-refresh/only-export-components
export { useCart, CartProvider };
