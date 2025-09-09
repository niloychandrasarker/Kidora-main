import { Star, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const { toggleWishlist } = useCart();

  const handleCardClick = () => {
  const productId = product?.id ?? product?._id ?? product?.productId;
  if (!productId) return;
  window.scrollTo(0, 0);
  navigate(`/product/${productId}`);
  };
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Star
          key="half"
          className="w-4 h-4 fill-yellow-400 text-yellow-400 opacity-50"
        />
      );
    }

    const remainingStars = 5 - Math.ceil(rating);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />);
    }

    return stars;
  };

  // Helpers for image and price display
  const pickImage = (p) => p?.mainImage || (Array.isArray(p?.images) && p.images[0]) || p?.image || "/image.png";
  const toPriceNumber = (val) => {
    if (typeof val === 'number') return val;
    const cleaned = String(val ?? "").replace(/[৳$\s,]/g, "");
    const n = parseFloat(cleaned);
    return isNaN(n) ? 0 : n;
  };
  const formatCurrency = (n) => `৳ ${Number(n).toLocaleString('en-US')}`;
  const getDiscountedPrice = (p) => {
    const priceNum = toPriceNumber(p?.price);
    if (!p?.discount) return formatCurrency(priceNum);
    const discounted = Math.round(priceNum * (1 - p.discount / 100));
    return formatCurrency(discounted);
  };

  return (
    <div
      onClick={handleCardClick}
      className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100 cursor-pointer relative"
    >
      {/* Badges */}
    {Number(product.discount) > 0 && product.stock !== 0 && (
        <span className="absolute top-2 left-2 bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded z-10">
      {Number(product.discount)}% OFF
        </span>
      )}
      {product.stock === 0 && (
        <span className="absolute top-2 left-2 bg-gray-900/80 backdrop-blur text-white text-[10px] font-semibold px-2 py-1 rounded z-10">
          OUT OF STOCK
        </span>
      )}
      <div className="aspect-square overflow-hidden bg-gray-50">
        <img
          src={pickImage(product)}
          alt={product.title}
          className={`w-full h-full object-cover transition-all duration-300 ${product.stock===0 ? 'opacity-50 grayscale' : 'group-hover:scale-105'}`}
        />
      </div>
  <div className="p-4">
        <h3 className="font-medium text-gray-900 mb-2 text-sm leading-tight line-clamp-2">
          {product.title}
        </h3>
        {product.description && (
          <p className="text-xs text-gray-600 mb-2 line-clamp-2 whitespace-pre-line">
            {String(product.description).split(/\r?\n/)[0]}
          </p>
        )}
        <div className="mb-3 flex items-center gap-2">
          <span className="text-lg font-bold text-gray-900">
            {getDiscountedPrice(product)}
          </span>
      {Number(product.discount) > 0 && (
            <span className="text-base text-gray-500 line-through">
        {formatCurrency(toPriceNumber(product.price))}
            </span>
          )}
        </div>
    {typeof product.rating !== 'undefined' && product.rating !== null && (
          <div className="flex items-center space-x-1 mb-2">
            <div className="flex">{renderStars(product.rating)}</div>
            <span className="text-xs text-gray-500">
              ({product.reviews || "1000"})
            </span>
          </div>
        )}
  <div className="flex justify-end mt-2">
          <button
            onClick={async (e) => { e.stopPropagation(); await toggleWishlist(product); }}
            className="w-10 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50"
          >
            <Heart className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
