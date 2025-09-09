import { createContext, useEffect, useState, useCallback } from 'react';
import heroBannersSeed from '../data/heroBanners';

const HeroBannerContext = createContext();

export function HeroBannerProvider({ children }) {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  // load from localStorage or seed
  useEffect(()=>{
    try {
      const raw = localStorage.getItem('heroBanners');
      if(raw){
        setBanners(JSON.parse(raw));
      } else {
        setBanners(heroBannersSeed);
      }
  } catch{
      setBanners(heroBannersSeed);
    } finally {
      setLoading(false);
    }
  },[]);

  // persist
  useEffect(()=>{
    if(!loading){
      localStorage.setItem('heroBanners', JSON.stringify(banners));
    }
  },[banners, loading]);

  const addHeroBanner = (data) => {
    setBanners(prev => [{ id: Date.now(), ...data }, ...prev]);
  };

  const removeHeroBanner = (id) => setBanners(prev => prev.filter(b=>b.id!==id));

  // placeholder backend fetch simulation
  const refreshFromBackend = useCallback(async ()=>{
    setLoading(true);
    // simulate latency + potential server transformation
    await new Promise(r=>setTimeout(r, 400));
    // In real scenario fetch('/api/hero-banners').then(res=>res.json())
    // For now just reuse current persisted list
    setLoading(false);
    return banners;
  },[banners]);

  const value = { banners, loading, addHeroBanner, removeHeroBanner, refreshFromBackend };
  return <HeroBannerContext.Provider value={value}>{children}</HeroBannerContext.Provider>;
}

export default HeroBannerContext;
