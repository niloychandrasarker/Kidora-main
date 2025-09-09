import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Heart,
  ShoppingCart,
  Star,
  Minus,
  Plus,
  Share2,
  Shield,
  Truck,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Check,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { trackViewItem, trackAddToCart } from "../utils/analytics";
import apiService from "../services/apiService";

// Helper to produce an embeddable video URL (supports YouTube standard links)
function computeVideoEmbed(raw) {
  if(!raw) return '';
  try {
    // Already an embed link
    if(/\/embed\//.test(raw)) return raw;
    // If it's a regular YouTube watch URL
    const ytMatch = raw.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/))([A-Za-z0-9_-]{6,})/);
    if(ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
    return raw;
  } catch { return raw; }
}

const ProductDetails = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { addToCart, isInWishlist, toggleWishlist } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState("M");
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [relatedProductsSlide, setRelatedProductsSlide] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isAddedToCart, setIsAddedToCart] = useState(false);
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  // Separate thumbnail drag state to avoid interference with main image / related products
  const [thumbTouchStart, setThumbTouchStart] = useState(null);
  const [thumbTouchEnd, setThumbTouchEnd] = useState(null);
  const [thumbIsDragging, setThumbIsDragging] = useState(false);
  const [thumbDragOffset, setThumbDragOffset] = useState(0);
  // Zoom state for main image (desktop only)
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState('50% 50%');

  // Scroll to top when component mounts or productId changes
  useEffect(() => {
    // Immediate scroll to top
    window.scrollTo(0, 0);
    // Also smooth scroll for better UX
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 100);
  }, [productId]);

  // Fetch product details from backend
  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        
        // Fetch specific product
        const productResponse = await apiService.getProductById(productId);
        const prod = (productResponse && typeof productResponse === 'object' && 'success' in productResponse)
          ? productResponse.data
          : productResponse;

        if (prod && (prod.id || prod._id || prod.productId)) {
          setProduct(prod);
          // Fetch related products (same category)
          const relatedResponse = await apiService.getProductsByCategory(String(prod.category || ''));
          const rd = relatedResponse?.data ?? relatedResponse;
          const list = Array.isArray(rd) ? rd : (rd?.content || rd?.products || []);
          const related = (Array.isArray(list) ? list : [])
            .filter(p => (p.id ?? p._id ?? p.productId) !== (prod.id ?? prod._id ?? prod.productId))
            .slice(0, 8);
          setRelatedProducts(related);
        } else {
          setProduct(null);
        }
      } catch (error) {
        console.error('Error fetching product details:', error);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProductDetails();
    }
  }, [productId]);

  // Track product view and set default size
  useEffect(() => {
    if (product) {
      trackViewItem(product);
      const sizes = Array.isArray(product.availableSizes) && product.availableSizes.length > 0
        ? product.availableSizes
        : ["XS","S","M","L","XL","XXL"];
      setSelectedSize(prev => sizes.includes(prev) ? prev : (sizes[0] || "M"));
    }
  }, [product]);

  // Calculate values that depend on product (but don't use hooks inside)
  const imagesPerSlide = 4;
  const totalImages = product?.images ? product.images.length : 4;
  const maxSlides = Math.ceil(totalImages / imagesPerSlide);
  
  const relatedProductsPerSlide = 4;
  const totalRelatedProducts = relatedProducts.length;
  const maxRelatedSlides =
    totalRelatedProducts > 0
      ? Math.ceil(totalRelatedProducts / relatedProductsPerSlide)
      : 0;

  // Simple slide functions
  const nextSlide = () => {
    if (currentSlide < maxSlides - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const nextRelatedSlide = () => {
    if (relatedProductsSlide < maxRelatedSlides - 1) {
      setRelatedProductsSlide(relatedProductsSlide + 1);
    }
  };

  const prevRelatedSlide = () => {
    if (relatedProductsSlide > 0) {
      setRelatedProductsSlide(relatedProductsSlide - 1);
    }
  };

  // Track view_item when product loads
  useEffect(() => {
    if (product) {
      trackViewItem(product);
    }
  }, [product]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Main image gallery navigation
      if (e.key === "ArrowLeft" && currentSlide > 0) {
        setCurrentSlide(prev => prev - 1);
      } else if (e.key === "ArrowRight" && currentSlide < maxSlides - 1) {
        setCurrentSlide(prev => prev + 1);
      }
      // Related products navigation (Shift + Arrow keys)
      else if (
        e.shiftKey &&
        e.key === "ArrowLeft" &&
        relatedProductsSlide > 0
      ) {
        setRelatedProductsSlide(prev => prev - 1);
      } else if (
        e.shiftKey &&
        e.key === "ArrowRight" &&
        relatedProductsSlide < maxRelatedSlides - 1
      ) {
        setRelatedProductsSlide(prev => prev + 1);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [currentSlide, maxSlides, relatedProductsSlide, maxRelatedSlides]);

  // Auto-reset slide when selectedImageIndex changes externally
  useEffect(() => {
    const targetSlide = Math.floor(selectedImageIndex / imagesPerSlide);
    // Only adjust currentSlide if the selected image is outside the visible range
    const visibleStart = currentSlide * imagesPerSlide;
    const visibleEnd = visibleStart + imagesPerSlide - 1;
    if (
      selectedImageIndex < visibleStart ||
      selectedImageIndex > visibleEnd
    ) {
      setCurrentSlide(targetSlide);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedImageIndex, imagesPerSlide]);

  // Reset related products slide when product changes
  useEffect(() => {
    setRelatedProductsSlide(0);
    setSelectedImageIndex(0);
    setCurrentSlide(0);
    setQuantity(1);
    setSelectedSize("M");
    setIsAddedToCart(false);
  }, [productId]);

  // Helpers for prices and currency formatting
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

  // Render description preserving admin formatting, and make best-effort from plain text
  const renderRichDescription = (desc) => {
    const raw0 = (desc || '').trim();
    if (!raw0) return null;

    // 1) Basic normalizations
    let raw = raw0
      .replace(/\r\n/g, '\n')
      // convert common bullet characters at start-of-line to markdown '- '
      .replace(/^\s*[•·▪◦►–—-]\s+/gm, '- ')
      // convert accidental leading semicolons to list items
      .replace(/^\s*;\s*/gm, '- ')
      // convert "text#" prefix used by some feeds to an H2 heading
      .replace(/^\s*text#\s*/i, '## ');

    const lines = raw.split('\n');

    // 2) If there are no explicit list markers, turn plain short lines into a list
    const hasExplicitList = lines.some((l) => /^(\s*([-*+]|\d+\.|\d+\))\s+)/.test(l));
    const isHeading = (l) => /^\s*#{1,6}\s+/.test(l);

    if (!hasExplicitList) {
      for (let i = 0; i < lines.length; i++) {
        const l = lines[i];
        if (!l || l.trim() === '') continue;
        if (isHeading(l) || /^\s*[>|`]/.test(l)) continue;
        // If line already starts like a list, keep; else convert to '- '
        if (!/^\s*[-*+]\s+/.test(l) && !/^(\s*\d+\.|\s*\d+\))\s+/.test(l)) {
          lines[i] = `- ${l.replace(/^\s*[;:-]?\s*/, '')}`;
        }
      }
    }

    // 3) Ensure a blank line before the first list block so Markdown parser recognizes it
    const out = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const prev = out.length > 0 ? out[out.length - 1] : '';
      const isBullet = /^\s*([-*+]|\d+\.|\d+\))\s+/.test(line);
      const prevBlank = prev.trim() === '';
      const prevBullet = /^\s*([-*+]|\d+\.|\d+\))\s+/.test(prev);
      if (isBullet && !prevBlank && !prevBullet) {
        out.push(''); // insert blank line before list
      }
      out.push(line);
    }

    const text = out.join('\n');
    return (
      <div className="prose max-w-none prose-li:my-0 prose-p:my-2">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
      </div>
    );
  };

  // Note: Don't render Not Found here; wait for loading to finish below.

  const handleQuantityChange = (type) => {
    if (type === "increase") {
      setQuantity((prev) => prev + 1);
    } else if (type === "decrease" && quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const handleAddToCart = async () => {
    const res = await addToCart(product, quantity, selectedSize);
    trackAddToCart(product, quantity, selectedSize);
    if (res?.success) {
  // Stay on page and show success state
  setIsAddedToCart(true);
    } else if (res?.message) {
      alert(res.message);
    }
  };

  // Touch handling for mobile sliding - Related products with smooth animation
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setIsDragging(true);
    setDragOffset(0);
  };

  const onTouchMove = (e) => {
    if (!touchStart || !isDragging) return;

    const currentTouch = e.targetTouches[0].clientX;
    const diff = touchStart - currentTouch;
    setTouchEnd(currentTouch);
    setDragOffset(diff);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) {
      setIsDragging(false);
      setDragOffset(0);
      return;
    }

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && relatedProductsSlide < maxRelatedSlides - 1) {
      nextRelatedSlide();
    } else if (isRightSwipe && relatedProductsSlide > 0) {
      prevRelatedSlide();
    }

    // Reset drag states
    setIsDragging(false);
    setDragOffset(0);
    setTouchStart(null);
    setTouchEnd(null);
  };

  // Touch handling for main image sliding with smooth animation
  const onMainImageTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setIsDragging(true);
    setDragOffset(0);
  };

  const onMainImageTouchMove = (e) => {
    if (!touchStart || !isDragging) return;

    const currentTouch = e.targetTouches[0].clientX;
    const diff = touchStart - currentTouch;
    setTouchEnd(currentTouch);
    setDragOffset(diff);
  };

  const onMainImageTouchEnd = () => {
    if (!touchStart || !touchEnd) {
      setIsDragging(false);
      setDragOffset(0);
      return;
    }

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    const totalImages = product.images ? product.images.length : 1;

    if (isLeftSwipe && selectedImageIndex < totalImages - 1) {
      setSelectedImageIndex((prev) => prev + 1);
    } else if (isRightSwipe && selectedImageIndex > 0) {
      setSelectedImageIndex((prev) => prev - 1);
    }

    // Reset drag states
    setIsDragging(false);
    setDragOffset(0);
    setTouchStart(null);
    setTouchEnd(null);
  };

  // Reset zoom when image changes
  useEffect(() => {
    setIsZoomed(false);
  }, [selectedImageIndex, productId]);

  // Mouse based zoom handlers (ignored on touch devices)
  const handleImageMouseEnter = () => {
    if (window.matchMedia('(pointer:fine)').matches) {
      setIsZoomed(true);
    }
  };
  const handleImageMouseLeave = () => {
    setIsZoomed(false);
  };
  const handleImageMouseMove = (e) => {
    if (!isZoomed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomOrigin(`${x}% ${y}%`);
  };

  // Touch handling for thumbnail sliding with independent state
  const onThumbnailTouchStart = (e) => {
    setThumbTouchEnd(null);
    setThumbTouchStart(e.targetTouches[0].clientX);
    setThumbIsDragging(true);
    setThumbDragOffset(0);
  };

  const onThumbnailTouchMove = (e) => {
    if (!thumbTouchStart || !thumbIsDragging) return;
    const current = e.targetTouches[0].clientX;
    const diff = thumbTouchStart - current;
    setThumbTouchEnd(current);
    setThumbDragOffset(diff);
  };

  const onThumbnailTouchEnd = () => {
    if (!thumbTouchStart || !thumbTouchEnd) {
      setThumbIsDragging(false);
      setThumbDragOffset(0);
      return;
    }
    const distance = thumbTouchStart - thumbTouchEnd;
    const isLeft = distance > minSwipeDistance;
    const isRight = distance < -minSwipeDistance;
    if (isLeft && currentSlide < maxSlides - 1) {
      setCurrentSlide((s) => s + 1);
    } else if (isRight && currentSlide > 0) {
      setCurrentSlide((s) => s - 1);
    }
    setThumbIsDragging(false);
    setThumbDragOffset(0);
    setThumbTouchStart(null);
    setThumbTouchEnd(null);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl font-semibold text-gray-600">Loading product...</div>
      </div>
    );
  }

  // Product not found
  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Product Not Found</h1>
          <p className="text-gray-600 mb-8">The product you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-300"
          >
            Go Home
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
          </div>
        </div>
      </div>

      {/* Product Details */}
      <div className="max-w-7xl mx-auto px-3 md:px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-12">
          {/* Product Image */}
          <div className="space-y-4">
            <div
              className="h-[320px] sm:h-[360px] md:h-[420px] lg:h-[480px] xl:h-[500px] bg-white rounded-xl md:rounded-2xl overflow-hidden shadow-md md:shadow-lg max-w-md mx-auto lg:max-w-full relative group"
              onTouchStart={onMainImageTouchStart}
              onTouchMove={onMainImageTouchMove}
              onTouchEnd={onMainImageTouchEnd}
              onMouseEnter={handleImageMouseEnter}
              onMouseLeave={handleImageMouseLeave}
              onMouseMove={handleImageMouseMove}
              style={{
                transform: isDragging
                  ? `translateX(-${dragOffset * 0.5}px)`
                  : "none",
                transition: isDragging ? "none" : "transform 0.3s ease-out",
              }}
            >
              <img
                src={
                  product.images && product.images.length > 0
                    ? product.images[selectedImageIndex]
                    : product.mainImage || product.image
                }
                alt={product.title}
                className={`w-full h-full object-cover transition-transform duration-300 md:duration-500 ease-in-out select-none ${isZoomed ? 'scale-[1.85] cursor-crosshair' : 'scale-100 md:group-hover:scale-105'}`}
                style={isZoomed ? { transformOrigin: zoomOrigin } : undefined}
                draggable={false}
              />
              {/* Optional subtle lens indicator when zoomed */}
              {isZoomed && (
                <div className="pointer-events-none absolute inset-0 border-0">
                  {/* We could add a small circle or crosshair; keeping minimal to avoid distraction */}
                </div>
              )}

              {/* Touch sliding indicators - mobile only */}
              {product.images && product.images.length > 1 && (
                <div className="md:hidden absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-1">
                  {product.images.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        selectedImageIndex === index
                          ? "bg-white shadow-lg"
                          : "bg-white/50"
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Touch instruction for mobile */}
              {product.images && product.images.length > 1 && (
                <div className="md:hidden absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white text-xs px-3 py-1 rounded-full opacity-80">
                  Swipe to see more
                </div>
              )}
            </div>

            {/* Thumbnail images with smooth sliding */}
            <div className="relative max-w-md mx-auto lg:max-w-full">
              {/* Mobile touch instruction for thumbnails */}
              {totalImages > imagesPerSlide && (
                <div className="md:hidden mb-2 text-center">
                  <p className="text-xs text-gray-500">
                    Swipe thumbnails to see more
                  </p>
                </div>
              )}

              {/* Navigation arrows - only show on desktop if more than 4 images */}
              {totalImages > imagesPerSlide && (
                <>
                  <button
                    onClick={prevSlide}
                    className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-8 h-8 bg-white rounded-full shadow-lg items-center justify-center hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={currentSlide === 0}
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <button
                    onClick={nextSlide}
                    className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-8 h-8 bg-white rounded-full shadow-lg items-center justify-center hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={currentSlide === maxSlides - 1}
                  >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  </button>
                </>
              )}

              {/* Sliding container with touch support */}
              <div className="overflow-hidden">
                <div
                  className="flex ease-out"
                  style={{
                    transform: `translateX(-${currentSlide * 100}%)${
                      thumbIsDragging
                        ? ` translateX(-${thumbDragOffset * 0.3}px)`
                        : ""
                    }`,
                    transition: thumbIsDragging
                      ? "none"
                      : "transform 0.45s cubic-bezier(0.22, 0.61, 0.36, 1)",
                  }}
                  onTouchStart={onThumbnailTouchStart}
                  onTouchMove={onThumbnailTouchMove}
                  onTouchEnd={onThumbnailTouchEnd}
                >
                  {Array.from({ length: maxSlides }).map((_, slideIndex) => (
                    <div
                      key={slideIndex}
                      className="w-full flex-shrink-0 grid grid-cols-4 gap-2 md:gap-4"
                    >
                      {(
                        product.images || [
                          product.mainImage || product.image,
                          product.mainImage || product.image,
                          product.mainImage || product.image,
                          product.mainImage || product.image,
                        ]
                      )
                        .slice(
                          slideIndex * imagesPerSlide,
                          (slideIndex + 1) * imagesPerSlide
                        )
                        .map((img, index) => {
                          const actualIndex =
                            slideIndex * imagesPerSlide + index;
                          return (
                            <div
                              key={actualIndex}
                              onClick={() => setSelectedImageIndex(actualIndex)}
                              className={`aspect-square bg-white rounded-md md:rounded-lg overflow-hidden cursor-pointer border-2 transition-all duration-300 transform active:scale-95 md:hover:scale-105 ${
                                selectedImageIndex === actualIndex
                                  ? "border-blue-500 ring-1 md:ring-2 ring-blue-200 shadow-md md:shadow-lg"
                                  : "border-transparent hover:border-gray-300 hover:shadow-sm md:hover:shadow-md"
                              }`}
                            >
                              <img
                                src={img}
                                alt={`${product.title} view ${actualIndex + 1}`}
                                className="w-full h-full object-cover transition-transform duration-300 select-none"
                                draggable={false}
                              />
                            </div>
                          );
                        })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Slide indicators - mobile optimized */}
              {totalImages > imagesPerSlide && (
                <div className="flex justify-center mt-3 md:mt-4 space-x-1 md:space-x-2">
                  {Array.from({ length: maxSlides }).map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all duration-300 transform hover:scale-110 ${
                        currentSlide === index
                          ? "bg-blue-500 shadow-lg"
                          : "bg-gray-300 hover:bg-gray-400"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-3 md:space-y-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                {product.title}
              </h1>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 md:w-5 md:h-5 ${
                        i < Math.floor(product.rating)
                          ? "text-yellow-400 fill-current"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                  <span className="text-sm text-gray-600 ml-1">
                    {product.rating} ({product.reviews || "100+"} reviews)
                  </span>
                </div>
              </div>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <div className="flex items-center space-x-3 md:space-x-4">
                <span className="text-2xl md:text-3xl font-bold text-gray-900">
                  {getDiscountedPrice(product)}
                </span>
                {product.discount && (
                  <span className="text-base md:text-lg text-gray-500 line-through">
                    {product.price}
                  </span>
                )}
                {product.discount && (
                  <span className="bg-red-100 text-red-800 text-xs md:text-sm font-medium px-2 py-1 rounded">
                    {product.discount}% OFF
                  </span>
                )}
              </div>
              <p className="text-sm text-green-600">
                Free shipping on orders above ৳500
              </p>
            </div>

            {/* Size Selection */}
            <div className="space-y-2">
              <h3 className="text-base md:text-lg font-semibold text-gray-900">
                Size
              </h3>
              <div className="flex flex-wrap gap-2">
                {(Array.isArray(product.availableSizes) && product.availableSizes.length > 0
                  ? product.availableSizes
                  : ["XS", "S", "M", "L", "XL", "XXL"]).map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`w-10 h-10 md:w-12 md:h-12 border rounded-lg font-medium text-sm transition-colors ${
                      selectedSize === size
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <h3 className="text-base md:text-lg font-semibold text-gray-900">
                Quantity
              </h3>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handleQuantityChange("decrease")}
                  className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50"
                  disabled={quantity === 1}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-16 h-10 border border-gray-300 rounded-lg flex items-center justify-center font-medium">
                  {quantity}
                </span>
                <button
                  onClick={() => handleQuantityChange("increase")}
                  className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <div className="flex space-x-4">
                <button
                  onClick={handleAddToCart}
                  disabled={isAddedToCart}
                  className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2 ${
                    isAddedToCart
                      ? "bg-green-600 text-white"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {isAddedToCart ? (
                    <>
                      <Check className="w-5 h-5" />
                      <span>Added to Cart!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5" />
                      <span>Add to Cart</span>
                    </>
                  )}
                </button>
                <button
                  onClick={async () => {
                    const r = await toggleWishlist(product);
                    if (!r?.success && r?.message) {
                      alert(r.message);
                    }
                  }}
                  className={`p-3 border rounded-xl transition-colors ${
                    isInWishlist(product.id ?? product._id ?? product.productId)
                      ? "border-red-300 bg-red-50 text-red-600"
                      : "border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <Heart
                    className={`w-6 h-6 ${
                      isInWishlist(product.id ?? product._id ?? product.productId) ? "fill-current" : ""
                    }`}
                  />
                </button>
                <button className="p-3 border border-gray-300 rounded-xl hover:bg-gray-50">
                  <Share2 className="w-6 h-6" />
                </button>
              </div>

              <button
                onClick={async () => {
                  const r = await addToCart(product, quantity, selectedSize);
                  if (r?.success) {
                    navigate("/cart");
                  } else if (r?.message) {
                    alert(r.message);
                  }
                }}
                className="w-full bg-gray-900 text-white py-3 px-6 rounded-xl font-semibold hover:bg-gray-800 transition-colors"
              >
                Buy Now
              </button>
            </div>

            {/* Product Features */}
            <div className="space-y-4 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <span className="w-6 h-6 bg-gradient-to-r from-green-400 to-blue-500 rounded-full mr-2"></span>
                Why Choose This Product?
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Shield className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-green-800">
                      Quality Guarantee
                    </p>
                    <p className="text-sm text-green-600">
                      100% authentic products with premium materials
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Truck className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-blue-800">Fast Delivery</p>
                    <p className="text-sm text-blue-600">
                      Free shipping & 2-3 business days delivery
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <RotateCcw className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-purple-800">Easy Returns</p>
                    <p className="text-sm text-purple-600">
                      Hassle-free 30-day return & exchange policy
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Description */}
        <div className="mt-16 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl p-8 shadow-lg border border-blue-200">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Product Description
            </h2>
          </div>
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-sm">
            {renderRichDescription(
              product.description || `${product.title} is crafted with the finest materials and attention\n\n- Premium materials\n- Modern fit\n- Easy care`
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <span className="text-gray-700 font-medium">Premium quality fabric with excellent breathability</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-gray-700 font-medium">Modern fit that suits all body types</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                  <span className="text-gray-700 font-medium">Easy care instructions - machine washable</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                  <span className="text-gray-700 font-medium">Available in multiple sizes and colors</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                  <span className="text-gray-700 font-medium">Perfect for both casual and formal occasions</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-teal-500 rounded-full mr-3"></div>
                  <span className="text-gray-700 font-medium">100% satisfaction guarantee</span>
                </div>
              </div>
            </div>
          </div>
        </div>

  {/* Product Video */}
  {product?.videoUrl && (
          <div className="mt-16 bg-gradient-to-br from-purple-50 to-pink-100 rounded-3xl p-8 shadow-lg border border-purple-200">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m2 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Product Video
              </h2>
            </div>
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 shadow-sm">
              <div className="aspect-video rounded-xl overflow-hidden shadow-lg border-2 border-white">
                <iframe
                  src={computeVideoEmbed(product.videoUrl)}
                  title={`${product.title} Product Video`}
                  className="w-full h-full"
                  frameBorder="0"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                ></iframe>
              </div>
              <div className="mt-4 text-center">
                <p className="text-gray-600 text-sm">
                  🎥 Watch this video to see the product in detail and learn more about its features
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Related Products with Mobile Touch Sliding */}
        {totalRelatedProducts > 0 && (
          <div className="mt-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                You May Also Like
              </h2>
              {/* Desktop navigation arrows - hidden on mobile */}
              {totalRelatedProducts > relatedProductsPerSlide && (
                <div className="hidden md:flex space-x-2">
                  <button
                    onClick={prevRelatedSlide}
                    className="w-10 h-10 bg-white border border-gray-300 rounded-full shadow-sm flex items-center justify-center hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={relatedProductsSlide === 0}
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <button
                    onClick={nextRelatedSlide}
                    className="w-10 h-10 bg-white border border-gray-300 rounded-full shadow-sm flex items-center justify-center hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={relatedProductsSlide === maxRelatedSlides - 1}
                  >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              )}
            </div>

            {/* Mobile touch instruction */}
            <div className="md:hidden mb-4 text-center">
              <p className="text-sm text-gray-500">
                Swipe left or right to see more products
              </p>
            </div>

            {/* Related Products Mobile Optimized Container */}
            <div className="relative overflow-hidden">
              <div
                className="flex ease-out"
                style={{
                  transform: `translateX(-${relatedProductsSlide * 100}%) ${
                    isDragging ? `translateX(-${dragOffset * 0.3}px)` : ""
                  }`,
                  transition: isDragging
                    ? "none"
                    : "transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                }}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
              >
                {Array.from({ length: maxRelatedSlides }).map(
                  (_, slideIndex) => (
                    <div
                      key={slideIndex}
                      className="w-full flex-shrink-0 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-6"
                    >
                      {relatedProducts
                        .slice(
                          slideIndex * relatedProductsPerSlide,
                          (slideIndex + 1) * relatedProductsPerSlide
                        )
                        .map((relatedProduct) => (
                          <div
                            key={relatedProduct.id ?? relatedProduct._id ?? relatedProduct.productId}
                            onClick={() => {
                              const rid = relatedProduct.id ?? relatedProduct._id ?? relatedProduct.productId;
                              if (!rid) return;
                              window.scrollTo(0, 0);
                              navigate(`/product/${rid}`);
                            }}
                            className="bg-white rounded-lg md:rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer transform active:scale-95 md:hover:scale-105"
                          >
                            <div className="aspect-square overflow-hidden">
                              <img
                                src={
                                  (Array.isArray(relatedProduct.images) && relatedProduct.images[0])
                                  || relatedProduct.mainImage
                                  || relatedProduct.image
                                  || "/image.png"
                                }
                                alt={relatedProduct.title}
                                className="w-full h-full object-cover transition-transform duration-300 select-none"
                                draggable={false}
                              />
                            </div>
                            <div className="p-2 md:p-4">
                              <h3 className="font-medium md:font-semibold text-gray-900 mb-1 md:mb-2 text-xs md:text-sm leading-tight line-clamp-2">
                                {relatedProduct.title}
                              </h3>
                              <div className="flex items-center justify-between">
                                <span className="text-sm md:text-lg font-bold text-gray-900">
                                  {getDiscountedPrice(relatedProduct)}
                                </span>
                                <div className="flex items-center space-x-1">
                                  <Star className="w-3 h-3 md:w-4 md:h-4 text-yellow-400 fill-current" />
                                  <span className="text-xs md:text-sm text-gray-600">
                                    {relatedProduct.rating}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Mobile-optimized slide indicators */}
            {totalRelatedProducts > relatedProductsPerSlide && (
              <div className="flex justify-center mt-4 md:mt-6 space-x-1 md:space-x-2">
                {Array.from({ length: maxRelatedSlides }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setRelatedProductsSlide(index)}
                    className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all duration-300 transform hover:scale-110 ${
                      relatedProductsSlide === index
                        ? "bg-blue-500 shadow-lg"
                        : "bg-gray-300 hover:bg-gray-400"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetails;
