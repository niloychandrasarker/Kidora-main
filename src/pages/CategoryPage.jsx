import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import ProductCard from "../components/ProductCard";
import apiService from "../services/apiService";

const CategoryPage = () => {
  const banners = {
    women: { image: "/woman-category-banner.png", alt: "Women" },
    men: { image: "/man-category-banner.png", alt: "Men" },
    kids: { image: "/kids.png", alt: "Kids" },
    parents: { image: "/man-category-banner.png", alt: "Parents" },
  };

  const { categoryName } = useParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ priceRange: "all", rating: "all", sortBy: "default" });

  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        setLoading(true);
        const cat = categoryName?.toLowerCase();
        if (cat === 'parents') {
          // fetch all and combine men + women
          const resAll = await apiService.getAllProducts(0, 500);
          const data = resAll?.data ?? resAll;
          const all = Array.isArray(data)
            ? data
            : (Array.isArray(data.products) ? data.products : (data.content || []));
          const list = (all || []).filter(p => {
            const c = String(p.category||'').toLowerCase();
            return c === 'men' || c === 'women';
          });
          if (active) setProducts(list);
        } else {
          const res = await apiService.getProductsByCategory(cat);
          const list = res?.data?.content || res?.data || res || [];
          if (active) setProducts(Array.isArray(list) ? list : []);
        }
      } catch {
        if (active) setProducts([]);
      } finally {
        if (active) setLoading(false);
      }
    };
    if (categoryName) run();
    return () => { active = false; };
  }, [categoryName]);

  const toPriceNumber = (val) => {
    if (typeof val === 'number') return val;
    const cleaned = String(val ?? "").replace(/[\u09f3$\s,]/g, "");
    const n = parseFloat(cleaned);
    return isNaN(n) ? 0 : n;
  };

  const handleFilterChange = (k, v) => setFilters((p) => ({ ...p, [k]: v }));

  const filtered = (() => {
    let arr = [...products];
    if (filters.priceRange !== 'all') {
      arr = arr.filter(p => {
        const price = toPriceNumber(p.price);
        if (filters.priceRange === 'under-500') return price < 500;
        if (filters.priceRange === '500-1000') return price >= 500 && price <= 1000;
        if (filters.priceRange === 'over-1000') return price > 1000;
        return true;
      });
    }
    if (filters.rating !== 'all') {
      arr = arr.filter(p => {
        const r = Number(p.rating ?? 0);
        if (filters.rating === '4-plus') return r >= 4;
        if (filters.rating === '4.5-plus') return r >= 4.5;
        if (filters.rating === '5') return r === 5;
        return true;
      });
    }
    if (filters.sortBy === 'price-low') arr.sort((a,b)=> toPriceNumber(a.price)-toPriceNumber(b.price));
    if (filters.sortBy === 'price-high') arr.sort((a,b)=> toPriceNumber(b.price)-toPriceNumber(a.price));
    if (filters.sortBy === 'rating') arr.sort((a,b)=> Number(b.rating??0)-Number(a.rating??0));
    return arr;
  })();

  const title = categoryName ? categoryName[0].toUpperCase()+categoryName.slice(1) : '';
  const banner = banners[categoryName?.toLowerCase()] || null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between py-4 gap-3">
            <div className="space-y-1">
              <button onClick={()=>navigate('/')} className="text-gray-600 hover:text-blue-600 text-sm">← Back to Home</button>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{title} <span className="text-blue-600">Collection</span></h1>
              <p className="text-sm text-gray-500">{filtered.length} {filtered.length===1?'item':'items'} found</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={()=>handleFilterChange('priceRange','all')} className="px-3 py-2 border rounded-lg text-sm">Reset</button>
              <select value={filters.priceRange} onChange={(e)=>handleFilterChange('priceRange', e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
                <option value="all">All Prices</option>
                <option value="under-500">Under ৳500</option>
                <option value="500-1000">৳500 - ৳1000</option>
                <option value="over-1000">Over ৳1000</option>
              </select>
              <select value={filters.sortBy} onChange={(e)=>handleFilterChange('sortBy', e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
                <option value="default">Default</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Rating</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {banner && (
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-2">
          <img src={banner.image} alt={banner.alt} className="w-full rounded-lg object-cover sm:max-h-[320px] max-h-[200px]" />
        </div>
      )}

      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        {loading ? (
          <div className="flex justify-center items-center py-20"><div className="text-lg font-semibold text-gray-600">Loading products...</div></div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-6">
            {filtered.map((p)=> (
              <div key={p.id ?? p._id ?? p.productId} className="p-1 sm:p-2"><ProductCard product={p} /></div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No Products Found</h3>
            <p className="text-gray-500 text-sm sm:text-base">Sorry, we couldn't find any products in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryPage;
