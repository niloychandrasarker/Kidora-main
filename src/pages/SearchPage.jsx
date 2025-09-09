import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import Fuse from "fuse.js";
import apiService from "../services/apiService";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const SearchPage = () => {
  const query = useQuery();
  const searchTerm = query.get("q") || "";
  // input state not needed as we navigate via Navbar and URL query
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllProducts = async () => {
      try {
        setLoading(true);
        
        // Fetch all products from backend
        const response = await apiService.getAllProducts(0, 200);
        if (response?.success) {
          const data = response.data ?? response;
          const list = Array.isArray(data)
            ? data
            : (Array.isArray(data.products) ? data.products : (data.content || []));
          setAllProducts(Array.isArray(list) ? list : []);
        } else setAllProducts([]);
      } catch (error) {
        console.error('Error fetching products for search:', error);
        setAllProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAllProducts();
  }, []);

  // Fuse.js config
  const fuse = new Fuse(allProducts, {
    keys: ["title", "description", "category"],
    threshold: 0.4,
    distance: 100,
  });

  const filtered =
    searchTerm.trim() === ""
      ? []
      : fuse.search(searchTerm).map((result) => result.item);

  // search handled by Navbar; this page reads from URL

  return (
    <div className="min-h-screen bg-gray-50 pt-20 px-2 sm:px-6 lg:px-8">
      {/* <form onSubmit={handleSearch} className="max-w-xl mx-auto mb-4 flex">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 border border-gray-300 rounded-l px-3 py-1 text-base"
        />
        <button
          type="submit"
          className="px-4 py-1 bg-blue-500 text-white rounded-r"
        >
          Search
        </button>
      </form> */}
      {searchTerm && (
        <h2 className="text-center text-xl font-bold mb-6 text-gray-800">
          {searchTerm}
        </h2>
      )}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-lg font-semibold text-gray-600">Loading products...</div>
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {filtered.map((product) => (
              <ProductCard
                key={product.id ?? product._id ?? product.productId}
                product={product}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
              No Products Found
            </h3>
            <p className="text-gray-500 text-sm sm:text-base">
              Sorry, we couldn't find any products matching your search.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
