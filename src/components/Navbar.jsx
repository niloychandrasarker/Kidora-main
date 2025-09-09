import { Search, ShoppingCart, Menu, X, Heart, User, LogIn, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { brandName } from "../utils/brand";
import apiService from "../services/apiService";
import AuthModal from "./AuthModal";

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const navigate = useNavigate();
  const { cartItemsCount, wishlistItemsCount } = useCart();
  const { isAuthenticated, logout, isAdmin, isSubAdmin } = useAuth();

  const [searchInput, setSearchInput] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  // Suggestions handled via BackendSearchResults
  const [mobileSearchInput, setMobileSearchInput] = useState("");

  const handleSearch = (e, inputValue) => {
    e.preventDefault();
    if (inputValue.trim()) {
      navigate(`/search?q=${encodeURIComponent(inputValue.trim())}`);
      setIsMobileMenuOpen(false);
      setShowDropdown(false);
    }
  };

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200 fixed top-0 left-0 w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 lg:h-18">
          {/* Logo / Brand */}
          <div className="flex-shrink-0">
            <button
              onClick={() => navigate("/")}
              className="cursor-pointer select-none flex items-center"
              aria-label={brandName}
            >
              <img
                src="/Kidora-logo.png"
                alt="Kidora Logo"
                className="h-10 lg:h-14 w-auto object-contain"
              />
            </button>
          </div>

          {/* Search Bar - Center positioned */}
          <div className="hidden lg:flex flex-1 max-w-lg mx-8">
            <form
              className="relative w-full"
              onSubmit={(e) => handleSearch(e, searchInput)}
            >
              <input
                type="text"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setShowDropdown(!!e.target.value);
                }}
                placeholder="Search for products, brands and more..."
                className="w-full pl-4 pr-12 py-3 border-2 border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-gray-50 hover:bg-white transition-colors"
                autoComplete="off"
                onFocus={() => setShowDropdown(!!searchInput)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-blue-500 to-blue-600 text-white p-2 rounded-full hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-md"
              >
                <Search className="w-4 h-4" />
              </button>
        {showDropdown && searchInput && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-white border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          {/* Query backend for suggestions */}
          <BackendSearchResults query={searchInput} onPick={(p)=>{ const pid = p.id ?? p._id ?? p.productId; if(!pid) return; navigate(`/product/${pid}`); setShowDropdown(false); }} />
                </div>
              )}
            </form>
          </div>

          {/* Desktop Icons */}
          <div className="hidden lg:flex items-center space-x-4">
            {/* Authentication */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate("/profile")}
                  className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors group"
                  aria-label="Profile"
                >
                  <User className="w-5 h-5" />
                </button>
                {(isAdmin || isSubAdmin) && (
                  <button
                    onClick={() => navigate("/admin")}
                    className={`px-3 py-1 text-xs font-medium text-white rounded-full transition-colors ${isAdmin ? 'bg-purple-600 hover:bg-purple-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                  >
                    {isAdmin ? 'Admin' : 'Sub Admin'}
                  </button>
                )}
                <button
                  onClick={logout}
                  className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                  aria-label="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setAuthMode("login");
                    setAuthModalOpen(true);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setAuthMode("register");
                    setAuthModalOpen(true);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Sign Up
                </button>
              </div>
            )}
            {/* Wishlist */}
            <button
              onClick={() => navigate("/wishlist")}
              className="relative p-2 text-gray-600 hover:text-red-500 transition-colors group"
            >
              <Heart className="w-5 h-5" />
              {wishlistItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-semibold">
                  {wishlistItemsCount}
                </span>
              )}
            </button>

            {/* Cart */}
            <button
              onClick={() => navigate("/cart")}
              className="relative p-2 text-gray-600 hover:text-green-500 transition-colors group"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-semibold">
                  {cartItemsCount}
                </span>
              )}
            </button>

            {/* User Profile and Notifications removed as requested */}
          </div>

          {/* Mobile Search and Menu */}
          <div className="lg:hidden flex items-center space-x-2">
            {/* Mobile Search Icon (opens only search panel) */}
            <button
              className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
              onClick={() => {
                setMobileSearchOpen((s) => !s);
                setIsMobileMenuOpen(false);
              }}
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Mobile Cart */}
            <button
              onClick={() => navigate("/cart")}
              className="relative p-2 text-gray-600 hover:text-green-500 transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-semibold">
                  {cartItemsCount}
                </span>
              )}
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => {
                setIsMobileMenuOpen((s) => !s);
                setMobileSearchOpen(false);
              }}
              className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Panel */}
        {mobileSearchOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white">
            <div className="px-4 pt-4 pb-2">
              <form
                className="relative"
                onSubmit={(e) => {
                  handleSearch(e, mobileSearchInput);
                  setMobileSearchOpen(false);
                }}
              >
                <input
                  type="text"
                  value={mobileSearchInput}
                  onChange={(e) => setMobileSearchInput(e.target.value)}
                  placeholder="Search for products, brands and more..."
                  className="w-full pl-4 pr-12 py-3 border-2 border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-gray-50"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-blue-500 to-blue-600 text-white p-2 rounded-full"
                >
                  <Search className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white">
            <div className="px-4 pt-4 pb-6 space-y-4">
              {/* Mobile Menu Items */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                <button
                  onClick={() => navigate("/profile")}
                  className="flex flex-col items-center space-y-2 p-4 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <User className="w-6 h-6 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">
                    Profile
                  </span>
                </button>
                {(isAdmin || isSubAdmin) && (
                  <button
                    onClick={() => { navigate('/admin'); setIsMobileMenuOpen(false); }}
                    className="flex flex-col items-center space-y-2 p-4 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <span className="w-6 h-6 flex items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-bold">{isAdmin ? 'A' : 'S'}</span>
                    <span className="text-sm font-medium text-gray-700">{isAdmin ? 'Admin' : 'Sub Admin'}</span>
                  </button>
                )}
                <button
                  onClick={() => navigate("/wishlist")}
                  className="flex flex-col items-center space-y-2 p-4 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Heart className="w-6 h-6 text-red-500" />
                  <span className="text-sm font-medium text-gray-700">
                    Wishlist ({wishlistItemsCount})
                  </span>
                </button>

                <button
                  onClick={() => navigate("/cart")}
                  className="flex flex-col items-center space-y-2 p-4 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <ShoppingCart className="w-6 h-6 text-green-500" />
                  <span className="text-sm font-medium text-gray-700">
                    Cart ({cartItemsCount})
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Authentication Modal */}
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
      />
    </nav>
  );
};

export default Navbar;

function BackendSearchResults({ query, onPick }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const run = async () => {
      if (!query) { setResults([]); return; }
      try {
        setLoading(true);
        const res = await apiService.searchProducts(query);
        const list = res?.data?.content || res?.data || res || [];
        if (active) setResults(Array.isArray(list) ? list.slice(0, 5) : []);
  } catch {
        if (active) setResults([]);
      } finally {
        if (active) setLoading(false);
      }
    };
    const t = setTimeout(run, 200);
    return () => { active = false; clearTimeout(t); };
  }, [query]);

  if (loading) {
    return <div className="px-4 py-2 text-gray-500 text-sm">Searching...</div>;
  }
  if (!results.length) {
    return <div className="px-4 py-2 text-gray-400 text-sm">No results</div>;
  }
  return (
    <>
    {results.map((p) => (
        <div
      key={p.id ?? p._id ?? p.productId}
          onMouseDown={() => onPick(p)}
          className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-sm"
        >
          {p.title}
        </div>
      ))}
    </>
  );
}
