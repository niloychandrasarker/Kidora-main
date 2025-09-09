import { useEffect, useState } from "react";
import HeroBanner from "../components/HeroBanner";
import Categories from "../components/Categories";
import ProductSection from "../components/ProductSection";
import apiService from "../services/apiService";

const HomePage = () => {
  const [men, setMen] = useState([]);
  const [women, setWomen] = useState([]);
  const [kids, setKids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [all, setAll] = useState([]);

  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        setLoading(true);
        const res = await apiService.getAllProducts(0, 200);
        const data = res?.data ?? res;
        const list = Array.isArray(data)
          ? data
          : (Array.isArray(data.products) ? data.products : (data.content || []));
  const arr = Array.isArray(list) ? list : [];
        if (!active) return;
  setAll(arr);
        setMen(arr.filter(p => String(p.category||'').toLowerCase()==='men'));
        setWomen(arr.filter(p => String(p.category||'').toLowerCase()==='women'));
        setKids(arr.filter(p => String(p.category||'').toLowerCase()==='kids'));
      } catch {
        if (!active) return;
        setMen([]); setWomen([]); setKids([]);
      } finally {
        if (active) setLoading(false);
      }
    };
    run();
    return () => { active = false; };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Banner Section */}
      <HeroBanner />

      {/* Categories Section */}
      <Categories />

      {/* Men Section */}
      {men.length > 0 && (
        <ProductSection title="Men" products={men.slice(0, 8)} />
      )}

      {/* Women Section */}
      {women.length > 0 && (
        <ProductSection title="Women" products={women.slice(0, 8)} titleColor="text-pink-600" />
      )}

      {/* Kids Section */}
      {kids.length > 0 && (
        <ProductSection title="Kids" products={kids.slice(0, 8)} titleColor="text-emerald-600" />
      )}

      {!loading && men.length===0 && women.length===0 && kids.length===0 && all.length>0 && (
        <ProductSection title="Latest" products={all.slice(0, 8)} />
      )}
      {!loading && all.length===0 && (
        <div className="py-16 text-center text-gray-500">No products yet. Add from admin.</div>
      )}

    </div>
  );
};

export default HomePage;
