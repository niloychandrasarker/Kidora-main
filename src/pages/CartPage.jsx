import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { trackViewCart, trackBeginCheckout } from "../utils/analytics";
import {
  ArrowLeft,
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  Heart,
  Truck,
  ShieldCheck,
} from "lucide-react";
import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const CartPage = () => {
  const navigate = useNavigate();
  const {
    cartItems,
    updateCartQuantity,
    removeFromCart,
    getCartTotal,
    cartItemsCount,
    toggleWishlist,
    refreshCart,
  } = useCart();
  const { isAuthenticated } = useAuth();

  const handleQuantityChange = (id, selectedSize, currentQuantity, change) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity > 0) {
      updateCartQuantity(id, selectedSize, newQuantity);
    }
  };

  const handleRemoveItem = (id, selectedSize) => {
    removeFromCart(id, selectedSize);
  };

  const handleMoveToWishlist = (item) => {
    toggleWishlist(item);
    removeFromCart(item.id, item.selectedSize);
  };

  // Shipping is decided at checkout (Inside Dhaka = 100, Outside = 160). Final calculated at checkout.
  const finalTotal = getCartTotal();

  // Fetch latest server cart when auth changes or on mount
  useEffect(() => {
    if (isAuthenticated) {
      refreshCart();
    }
  }, [isAuthenticated, refreshCart]);

  // Track view_cart when items change
  useEffect(() => {
    if (cartItems.length > 0) {
      trackViewCart(cartItems);
    }
  }, [cartItems]);

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-16">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors duration-200 group"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-200" />
                <span className="font-medium">Back</span>
              </button>
              <h1 className="ml-6 text-xl font-semibold text-gray-900">
                Shopping Cart
              </h1>
            </div>
          </div>
        </div>

        {/* Empty Cart */}
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <ShoppingBag className="w-24 h-24 text-gray-300 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Your cart is empty
          </h2>
          <p className="text-gray-600 mb-8">
            Looks like you haven't added anything to your cart yet.
          </p>
          <button
            onClick={() => navigate("/")}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors duration-200 group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-200" />
              <span className="font-medium">Back</span>
            </button>
            <h1 className="ml-6 text-xl font-semibold text-gray-900">
              Shopping Cart ({cartItemsCount} items)
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow-sm p-4 md:p-6"
              >
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Product Image */}
                  <div
                    className="w-full md:w-32 h-32 bg-gray-100 rounded-lg overflow-hidden cursor-pointer"
                    onClick={() => navigate(`/product/${item.id}`)}
                  >
                    <img
                      src={item.image || 
                        (Array.isArray(item.images) && item.images[0]) ||
                        "/image.png"}
                      alt={item.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                    />
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 space-y-3">
                    <div>
                      <h3
                        className="font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                        onClick={() => navigate(`/product/${item.id}`)}
                      >
                        {item.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Size: {item.selectedSize} | Category: {item.category}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {/* Quantity Controls */}
                        <div className="flex items-center border border-gray-300 rounded-lg">
                          <button
                            onClick={() =>
                              handleQuantityChange(
                                item.id,
                                item.selectedSize,
                                item.quantity,
                                -1
                              )
                            }
                            className="p-2 hover:bg-gray-50 transition-colors"
                            disabled={item.quantity === 1}
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="px-4 py-2 font-medium">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              handleQuantityChange(
                                item.id,
                                item.selectedSize,
                                item.quantity,
                                1
                              )
                            }
                            className="p-2 hover:bg-gray-50 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Price */}
                        <div className="text-right min-w-[80px]">
                          <p className="font-bold text-lg text-gray-900">
                            ৳
                            {(
                              parseFloat(String(item.price).replace(/[৳$\s]/g, "")) *
                              item.quantity
                            ).toFixed(0)}
                          </p>
                          <p className="text-sm text-gray-600">
                            ৳
                            {parseFloat(
                              String(item.price).replace(/[৳$\s]/g, "")
                            ).toFixed(0)}{" "}
                            each
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-4 pt-2">
                      <button
                        onClick={() => handleMoveToWishlist(item)}
                        className="flex items-center space-x-1 text-sm text-gray-600 hover:text-red-600 transition-colors"
                        aria-label="Move to Wishlist"
                      >
                        <Heart className="w-4 h-4" />
                        <span>Move to Wishlist</span>
                      </button>
                      <button
                        onClick={() =>
                          handleRemoveItem(item.id, item.selectedSize)
                        }
                        className="flex items-center space-x-1 text-sm text-gray-600 hover:text-red-600 transition-colors"
                        aria-label="Remove from Cart"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Order Summary
              </h2>

              <div className="space-y-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({cartItemsCount} items)</span>
                  <span>৳{getCartTotal()}</span>
                </div>

                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>Calculated at checkout</span>
                </div>

                {/* Free-shipping thresholds removed */}

                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-semibold text-gray-900">
                    <span>Total</span>
                    <span>৳{finalTotal}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    const items = cartItems.map((it) => ({
                      item_id: String(it.id),
                      item_name: it.title,
                      item_category: it.category,
                      price: parseFloat(String(it.price).replace(/[৳$\s]/g, "")) || 0,
                      quantity: it.quantity,
                      item_variant: it.selectedSize,
                    }));
                    trackBeginCheckout(items, finalTotal);
                    navigate("/checkout");
                  }}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200 mt-6"
                >
                  Proceed to Checkout
                </button>

                <button
                  onClick={() => navigate("/")}
                  className="w-full border border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200"
                >
                  Continue Shopping
                </button>
              </div>

              {/* Trust Badges */}
              <div className="mt-8 pt-6 border-t space-y-4">
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <Truck className="w-5 h-5 text-green-600" />
                  <span>Delivery: Inside Dhaka ৳100, Outside Dhaka ৳160</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                  <span>Secure payment & 30-day returns</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
