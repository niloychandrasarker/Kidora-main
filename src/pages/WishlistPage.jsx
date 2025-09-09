import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { ArrowLeft, Heart, ShoppingCart, Trash2, Star } from "lucide-react";

const WishlistPage = () => {
  const navigate = useNavigate();
  const {
    wishlistItems,
    toggleWishlist,
    addToCart,
    wishlistItemsCount,
    refreshWishlist,
  } = useCart();
  const { isAuthenticated } = useAuth();

  // Resolve image URL coming from backend (may be relative like /uploads/...)
  const resolveImageUrl = (img) => {
    const src = img || '';
    if (!src) return '/image.png';
    if (/^https?:\/\//i.test(src)) return src;
    const path = src.startsWith('/') ? src : `/${src}`;
    return `http://localhost:8080${path}`;
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshWishlist();
    }
  }, [isAuthenticated, refreshWishlist]);

  const handleAddToCart = (item) => {
    addToCart(item, 1, "M"); // Default quantity 1 and size M
  };

  const handleRemoveFromWishlist = (item) => {
    toggleWishlist(item);
  };

  const handleMoveToCart = (item) => {
    addToCart(item, 1, "M");
    toggleWishlist(item);
  };

  if (wishlistItems.length === 0) {
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
                My Wishlist
              </h1>
            </div>
          </div>
        </div>

        {/* Empty Wishlist */}
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <Heart className="w-24 h-24 text-gray-300 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Your wishlist is empty
          </h2>
          <p className="text-gray-600 mb-8">
            Save your favorite items here to buy them later.
          </p>
          <button
            onClick={() => navigate("/")}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
          >
            Start Shopping
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
              My Wishlist ({wishlistItemsCount} items)
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Actions Bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
            <p className="text-gray-600">
              {wishlistItemsCount} item{wishlistItemsCount !== 1 ? "s" : ""} in
              your wishlist
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  wishlistItems.forEach((item) => addToCart(item, 1, "M"));
                  alert("All items added to cart!");
                }}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Add All to Cart</span>
              </button>
            </div>
          </div>
        </div>

        {/* Wishlist Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {wishlistItems.map((item) => (
            <div
        key={item.id ?? item.productId}
              className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 group"
            >
              {/* Product Image */}
              <div
                className="relative aspect-square bg-gray-100 cursor-pointer overflow-hidden"
                onClick={() => {
                  const pid = item.id ?? item.productId;
                  if (!pid) return;
                  navigate(`/product/${pid}`);
                }}
              >
                <img
                  src={resolveImageUrl(item.image || (Array.isArray(item.images) && item.images[0]))}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.src = '/image.png';
                  }}
                />

                {/* Remove from Wishlist Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFromWishlist(item);
                  }}
                  className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center text-red-600 hover:bg-red-50 transition-colors duration-200"
                >
                  <Heart className="w-4 h-4 fill-current" />
                </button>

                {/* Quick Add to Cart Overlay */}
                <div className="absolute inset-0 bg-transparent group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToCart(item);
                    }}
                    className="bg-white text-gray-900 px-4 py-2 rounded-lg font-medium opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    Quick Add to Cart
                  </button>
                </div>
              </div>

              {/* Product Details */}
              <div className="p-4">
                <h3
                  className="font-semibold text-gray-900 mb-2 line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors"
                  onClick={() => {
                    const pid = item.id ?? item.productId;
                    if (!pid) return;
                    navigate(`/product/${pid}`);
                  }}
                >
                  {item.title}
                </h3>

                {/* Rating */}
                <div className="flex items-center space-x-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(item.rating)
                          ? "text-yellow-400 fill-current"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                  <span className="text-sm text-gray-600 ml-1">
                    {item.rating}
                  </span>
                </div>

                {/* Price */}
                <div className="flex items-center space-x-2 mb-4">
                  <span className="text-lg font-bold text-gray-900">
                    {item.price}
                  </span>
                  <span className="text-sm text-gray-500 line-through">
                    ৳
                    {Math.floor(
                      parseFloat(item.price.replace(/[৳$\s]/g, "")) * 1.2
                    )}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <button
                    onClick={() => handleMoveToCart(item)}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium flex items-center justify-center space-x-2"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Move to Cart</span>
                  </button>

                  <button
                    onClick={() => handleRemoveFromWishlist(item)}
                    className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium flex items-center justify-center space-x-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Continue Shopping */}
        <div className="mt-12 text-center">
          <button
            onClick={() => navigate("/")}
            className="bg-gray-900 text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors duration-200 font-medium"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
};

export default WishlistPage;
