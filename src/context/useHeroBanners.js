import { useContext } from 'react';
import HeroBannerContext from './HeroBannerContext';

export default function useHeroBanners(){
  return useContext(HeroBannerContext);
}
