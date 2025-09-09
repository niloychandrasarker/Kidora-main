import { useEffect, useState, useRef } from 'react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Textarea from '../components/ui/Textarea';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Modal from '../components/ui/Modal';
import apiService from '../../services/apiService';

const initialBanners = [
  { id: 1, title: 'Printed Cotton Taaga Dress', description: 'Premium quality printed cotton dress for kids. Soft, stylish, and perfect for all occasions.', price: '৳ 2006', discount: 33, image: '/hero.png', rating: 4.9, reviews: '1000+', category: 'kids', features: ['FREE SHIPPING WORLDWIDE','QUALITY GUARANTEE'] },
  { id: 2, title: 'Trendy Boys Polo Shirt', description: 'Trendy and comfortable polo shirt for boys. Perfect for all-day wear.', price: '৳ 950', discount: 21, image: '/hero2.png', rating: 4.7, reviews: '800+', category: 'men', features: ['EASY RETURNS','FAST DELIVERY'] },
];

export default function HeroBanners() {
  const [banners, setBanners] = useState(initialBanners);
  // const [loading, setLoading] = useState(false); // not used
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [newBanner, setNewBanner] = useState({
    title: '',
    description: '',
    price: '',
    discount: '',
    image: '',
    rating: '',
    reviews: '',
    category: '',
    featureInput: '',
    features: [],
    _imageFile: null,
    _additionalFiles: [],
    productId: '',
  });
  const [editBanner, setEditBanner] = useState({
    id: null,
    title: '',
    description: '',
    price: '',
    discount: '',
    image: '',
    rating: '',
    reviews: '',
    category: '',
    featureInput: '',
    features: [],
    _imageFile: null,
    _additionalFiles: [],
    productId: '',
  });
  const imageInputRef = useRef(null);
  const additionalImagesRef = useRef(null);
  const editImageInputRef = useRef(null);
  const editAdditionalImagesRef = useRef(null);

  const isValid = newBanner.title && newBanner.image && newBanner.price;
  const isEditValid = editBanner.title && editBanner.price;

  useEffect(() => {
    let cancelled = false;
    (async () => {
  // setLoading(true);
      try {
        const res = await apiService.getHeroBanners();
        const data = res?.data ?? res;
        if (!cancelled && Array.isArray(data)) {
          const mapped = data.map(b => ({
            id: b.id,
            title: b.title,
            description: b.description,
            price: b.price ?? '',
            discount: b.discount ?? 0,
            image: b.imageUrl,
            rating: b.rating ?? 0,
            reviews: b.reviews ?? '',
            category: b.category ?? '',
            features: b.features ?? [],
            productId: b.productId,
          }));
          setBanners(mapped.length ? mapped : initialBanners);
        }
      } catch {
        setBanners(initialBanners);
      } finally {
        // if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; }
  }, []);

  const addBanner = async () => {
    if(!isValid) return;
    try {
      const fd = new FormData();
      fd.append('title', newBanner.title);
      if (newBanner.description) fd.append('description', newBanner.description);
      if (newBanner.price) fd.append('price', newBanner.price);
      if (newBanner.discount) fd.append('discount', newBanner.discount);
      if (newBanner.rating) fd.append('rating', newBanner.rating);
      if (newBanner.reviews) fd.append('reviews', newBanner.reviews);
      if (newBanner.category) fd.append('category', newBanner.category);
      if (newBanner.productId) fd.append('productId', newBanner.productId);
      newBanner.features.forEach(f => fd.append('features', f));
      if (newBanner._imageFile) fd.append('image', newBanner._imageFile);
      if (Array.isArray(newBanner._additionalFiles)) {
        newBanner._additionalFiles.forEach(f => fd.append('additionalImages', f));
      }

      const res = await apiService.createHeroBanner(fd);
      const saved = res?.data ?? res;
      if (saved?.id) {
        setBanners(prev => [
      {
            id: saved.id,
            title: saved.title,
            description: saved.description,
            price: saved.price ?? '',
            discount: saved.discount ?? 0,
            image: saved.imageUrl,
            rating: saved.rating ?? 0,
            reviews: saved.reviews ?? '',
            category: saved.category ?? '',
            features: saved.features ?? [],
            productId: saved.productId,
          },
          ...prev,
        ]);
      }
    setNewBanner({ title: '', description:'', price:'', discount:'', image:'', rating:'', reviews:'', category:'', featureInput:'', features:[], _imageFile:null, _additionalFiles:[], productId:'' });
      setOpen(false);
  } catch {
      // fallback to local add
      const { featureInput: _unusedFeature, _imageFile: _unusedFile, ...rest } = newBanner;
    setBanners(prev => [{ id: Date.now(), ...rest, discount: rest.discount || 0, rating: rest.rating || 0 }, ...prev]);
    setNewBanner({ title: '', description:'', price:'', discount:'', image:'', rating:'', reviews:'', category:'', featureInput:'', features:[], _imageFile:null, _additionalFiles:[], productId:'' });
      setOpen(false);
    }
  };

  // removed unused removeBanner

  const addFeature = () => {
    if(!newBanner.featureInput.trim()) return;
    setNewBanner(p=>({...p, features:[...p.features, p.featureInput.trim()], featureInput:''}));
  };

  const removeFeature = (idx) => setNewBanner(p=>({...p, features: p.features.filter((_,i)=>i!==idx)}));

  const handleImageChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if(file){
      const url = URL.createObjectURL(file);
      setNewBanner(p=>({...p, image:url, _imageFile:file }));
    }
  };

  const handleAdditionalImagesChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length) {
      setNewBanner(p => ({ ...p, _additionalFiles: files }));
    }
  };

  const handleEditImageChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if(file){
      const url = URL.createObjectURL(file);
      setEditBanner(p=>({...p, image:url, _imageFile:file }));
    }
  };

  const handleEditAdditionalImagesChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length) {
      setEditBanner(p => ({ ...p, _additionalFiles: files }));
    }
  };

  const deleteBanner = async (id) => {
    try {
      await apiService.deleteHeroBanner(id);
  } catch { /* ignore */ }
    setBanners(prev => prev.filter(b => b.id !== id));
  }

  const openEdit = (b) => {
    setEditBanner({
      id: b.id,
      title: b.title || '',
      description: b.description || '',
      price: b.price || '',
      discount: b.discount || '',
      image: b.image || '',
      rating: b.rating || '',
      reviews: b.reviews || '',
      category: b.category || '',
      featureInput: '',
      features: Array.isArray(b.features) ? [...b.features] : [],
      _imageFile: null,
      _additionalFiles: [],
      productId: b.productId || '',
    });
    setEditOpen(true);
  };

  const updateBanner = async () => {
    if(!isEditValid || !editBanner.id) return;
    try {
      const fd = new FormData();
      fd.append('title', editBanner.title);
      if (editBanner.description) fd.append('description', editBanner.description);
      if (editBanner.price) fd.append('price', editBanner.price);
      if (editBanner.discount) fd.append('discount', editBanner.discount);
      if (editBanner.rating) fd.append('rating', editBanner.rating);
      if (editBanner.reviews) fd.append('reviews', editBanner.reviews);
      if (editBanner.category) fd.append('category', editBanner.category);
      if (editBanner.productId) fd.append('productId', editBanner.productId);
      editBanner.features.forEach(f => fd.append('features', f));
      if (editBanner._imageFile) fd.append('image', editBanner._imageFile);
      if (Array.isArray(editBanner._additionalFiles)) {
        editBanner._additionalFiles.forEach(f => fd.append('additionalImages', f));
      }

      const res = await apiService.updateHeroBanner(editBanner.id, fd);
      const saved = res?.data ?? res;
      if (saved?.id) {
        setBanners(prev => prev.map(item => item.id === saved.id ? {
          id: saved.id,
          title: saved.title,
          description: saved.description,
          price: saved.price ?? '',
          discount: saved.discount ?? 0,
          image: saved.imageUrl,
          rating: saved.rating ?? 0,
          reviews: saved.reviews ?? '',
          category: saved.category ?? '',
          features: saved.features ?? [],
          productId: saved.productId,
        } : item));
      } else if (editBanner.image) {
        setBanners(prev => prev.map(item => item.id === editBanner.id ? {
          ...item,
          title: editBanner.title,
          description: editBanner.description,
          price: editBanner.price,
          discount: editBanner.discount || 0,
          image: editBanner._imageFile ? URL.createObjectURL(editBanner._imageFile) : editBanner.image,
          rating: editBanner.rating || 0,
          reviews: editBanner.reviews || '',
          category: editBanner.category || '',
          features: editBanner.features || [],
          productId: editBanner.productId || '',
        } : item));
      }
      setEditOpen(false);
      setEditBanner({ id: null, title: '', description: '', price: '', discount: '', image: '', rating: '', reviews: '', category: '', featureInput: '', features: [], _imageFile: null, _additionalFiles: [], productId: '' });
  } catch {
      setEditOpen(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Hero Banners</h2>
        <Button onClick={()=>setOpen(true)}>Add Banner</Button>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {banners.map(b => (
          <Card key={b.id} className="overflow-hidden group">
            <div className="aspect-[5/3] bg-gradient-to-br from-gray-100 to-gray-200 relative">
              <img src={b.image} alt={b.title} className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-3">
                <Button variant="secondary" onClick={()=>openEdit(b)}>Edit</Button>
                <Button variant="destructive" onClick={()=>deleteBanner(b.id)}>Delete</Button>
              </div>
              {Number(b.discount) > 0 && (
                <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">{Number(b.discount)}% OFF</div>
              )}
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{b.title}</CardTitle>
              <div className="text-xs text-gray-500 flex gap-2 flex-wrap">
                <span>{b.category}</span>
                <span>⭐ {b.rating}</span>
                <span>{b.reviews}</span>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              <p className="text-xs text-gray-600 line-clamp-2">{b.description}</p>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-bold text-gray-900">
                  {(() => {
                    const cleaned = String(b.price ?? '').replace(/[৳$\s,]/g, '');
                    const base = Number.parseFloat(cleaned) || 0;
                    const d = Number(b.discount) > 0 ? Math.round(base * (1 - Number(b.discount)/100)) : base;
                    return `৳ ${d.toLocaleString('en-US')}`;
                  })()}
                </span>
                {Number(b.discount) > 0 && (
                  <span className="text-gray-400 line-through text-xs">
                    {(() => {
                      const cleaned = String(b.price ?? '').replace(/[৳$\s,]/g, '');
                      const base = Number.parseFloat(cleaned) || 0;
                      return `৳ ${base.toLocaleString('en-US')}`;
                    })()}
                  </span>
                )}
              </div>
              {b.features?.length>0 && (
                <ul className="flex flex-wrap gap-1">
                  {b.features.map((f,i)=>(
                    <li key={i} className="bg-gray-100 text-[10px] px-2 py-1 rounded">{f}</li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ))}
        {banners.length===0 && (
          <div className="text-center py-20 text-gray-500 border-2 border-dashed rounded-xl">No banners yet</div>
        )}
      </div>

      <Modal open={open} onClose={()=>setOpen(false)} title="Add Hero Banner" actions={
        <>
          <Button variant="outline" onClick={()=>setOpen(false)}>Cancel</Button>
          <Button onClick={addBanner} disabled={!isValid} className={!isValid? 'opacity-60 cursor-not-allowed':''}>Save</Button>
        </>
      }>
        <div className="space-y-6 max-h-[70vh] pr-1 overflow-y-auto">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="flex items-center justify-between text-[11px] font-medium text-gray-600 mb-1">Title * {!newBanner.title && <span className="text-red-500 font-normal">Required</span>}</label>
              <Input value={newBanner.title} onChange={e=>setNewBanner(p=>({...p,title:e.target.value}))} placeholder="Banner title" />
            </div>
            <div>
              <label className="text-[11px] font-medium text-gray-600 mb-1">Category</label>
              <select value={newBanner.category} onChange={e=>setNewBanner(p=>({...p,category:e.target.value}))} className="w-full rounded-md border border-gray-300 bg-white px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Select...</option>
                <option value="kids">Kids</option>
                <option value="men">Men</option>
                <option value="women">Women</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-[11px] font-medium text-gray-600 mb-1">Link to Product (optional, product ID)</label>
            <Input value={newBanner.productId || ''} onChange={e=>setNewBanner(p=>({...p,productId:e.target.value}))} placeholder="123" />
          </div>
          <div>
            <label className="text-[11px] font-medium text-gray-600 mb-1">Description</label>
            <Textarea rows={3} value={newBanner.description} onChange={e=>setNewBanner(p=>({...p,description:e.target.value}))} placeholder="Short description" />
          </div>
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="text-[11px] font-medium text-gray-600 mb-1">Price *</label>
              <Input value={newBanner.price} onChange={e=>setNewBanner(p=>({...p,price:e.target.value}))} placeholder="৳ ..." />
            </div>
            <div>
              <label className="text-[11px] font-medium text-gray-600 mb-1">Discount %</label>
              <Input type="number" value={newBanner.discount} onChange={e=>setNewBanner(p=>({...p,discount:e.target.value}))} placeholder="0" />
            </div>
            <div>
              <label className="text-[11px] font-medium text-gray-600 mb-1">Rating</label>
              <Input type="number" step="0.1" value={newBanner.rating} onChange={e=>setNewBanner(p=>({...p,rating:e.target.value}))} placeholder="4.5" />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-medium text-gray-600 mb-1">Reviews</label>
              <Input value={newBanner.reviews} onChange={e=>setNewBanner(p=>({...p,reviews:e.target.value}))} placeholder="1000+" />
            </div>
            <div>
              <label className="flex items-center justify-between text-[11px] font-medium text-gray-600 mb-1">Main Image * {!newBanner.image && <span className="text-red-500 font-normal">Required</span>}</label>
              <div onClick={()=>imageInputRef.current?.click()} className={`border-2 border-dashed rounded-md p-4 text-center text-xs cursor-pointer ${newBanner.image? 'border-green-300 bg-green-50':'hover:border-gray-400 border-gray-300'}`}>
                <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                {newBanner.image ? 'Replace Image' : 'Click to Upload'}
                {newBanner.image && <img src={newBanner.image} alt="preview" className="mt-2 h-24 w-24 object-cover rounded" />}
              </div>
            </div>
          </div>
          <div>
            <label className="text-[11px] font-medium text-gray-600 mb-1">Additional Images (optional, added to linked product gallery)</label>
            <div className="border-2 border-dashed rounded-md p-4 text-xs">
              <input ref={additionalImagesRef} type="file" accept="image/*" multiple onChange={handleAdditionalImagesChange} />
              {newBanner._additionalFiles?.length > 0 && (
                <div className="text-[11px] text-gray-500 mt-2">{newBanner._additionalFiles.length} file(s) selected</div>
              )}
            </div>
          </div>
          <div>
            <label className="text-[11px] font-medium text-gray-600 mb-1">Features</label>
            <div className="flex gap-2 mb-2">
              <Input value={newBanner.featureInput} onChange={e=>setNewBanner(p=>({...p,featureInput:e.target.value}))} placeholder="Add feature" />
              <Button type="button" variant="outline" onClick={addFeature} className="whitespace-nowrap">+ Add</Button>
            </div>
            {newBanner.features.length>0 && (
              <div className="flex flex-wrap gap-2">
                {newBanner.features.map((f,i)=>(
                  <span key={i} className="bg-gray-100 text-[11px] px-2 py-1 rounded flex items-center gap-1">{f}<button type="button" onClick={()=>removeFeature(i)} className="text-red-500 hover:text-red-600">×</button></span>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
      <Modal open={editOpen} onClose={()=>setEditOpen(false)} title="Edit Hero Banner" actions={
        <>
          <Button variant="outline" onClick={()=>setEditOpen(false)}>Cancel</Button>
          <Button onClick={updateBanner} disabled={!isEditValid} className={!isEditValid? 'opacity-60 cursor-not-allowed':''}>Update</Button>
        </>
      }>
        <div className="space-y-6 max-h-[70vh] pr-1 overflow-y-auto">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="flex items-center justify-between text-[11px] font-medium text-gray-600 mb-1">Title * {!editBanner.title && <span className="text-red-500 font-normal">Required</span>}</label>
              <Input value={editBanner.title} onChange={e=>setEditBanner(p=>({...p,title:e.target.value}))} placeholder="Banner title" />
            </div>
            <div>
              <label className="text-[11px] font-medium text-gray-600 mb-1">Category</label>
              <select value={editBanner.category} onChange={e=>setEditBanner(p=>({...p,category:e.target.value}))} className="w-full rounded-md border border-gray-300 bg-white px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Select...</option>
                <option value="kids">Kids</option>
                <option value="men">Men</option>
                <option value="women">Women</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-[11px] font-medium text-gray-600 mb-1">Link to Product (optional, product ID)</label>
            <Input value={editBanner.productId || ''} onChange={e=>setEditBanner(p=>({...p,productId:e.target.value}))} placeholder="123" />
          </div>
          <div>
            <label className="text-[11px] font-medium text-gray-600 mb-1">Description</label>
            <Textarea rows={3} value={editBanner.description} onChange={e=>setEditBanner(p=>({...p,description:e.target.value}))} placeholder="Short description" />
          </div>
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="text-[11px] font-medium text-gray-600 mb-1">Price *</label>
              <Input value={editBanner.price} onChange={e=>setEditBanner(p=>({...p,price:e.target.value}))} placeholder="৳ ..." />
            </div>
            <div>
              <label className="text-[11px] font-medium text-gray-600 mb-1">Discount %</label>
              <Input type="number" value={editBanner.discount} onChange={e=>setEditBanner(p=>({...p,discount:e.target.value}))} placeholder="0" />
            </div>
            <div>
              <label className="text-[11px] font-medium text-gray-600 mb-1">Rating</label>
              <Input type="number" step="0.1" value={editBanner.rating} onChange={e=>setEditBanner(p=>({...p,rating:e.target.value}))} placeholder="4.5" />
            </div>
            <div>
              <label className="text-[11px] font-medium text-gray-600 mb-1">Reviews</label>
              <Input value={editBanner.reviews} onChange={e=>setEditBanner(p=>({...p,reviews:e.target.value}))} placeholder="1000+" />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center justify-between text-[11px] font-medium text-gray-600 mb-1">Main Image</label>
              <div onClick={()=>editImageInputRef.current?.click()} className={`border-2 border-dashed rounded-md p-4 text-center text-xs cursor-pointer ${editBanner.image? 'border-green-300 bg-green-50':'hover:border-gray-400 border-gray-300'}`}>
                <input ref={editImageInputRef} type="file" accept="image/*" onChange={handleEditImageChange} className="hidden" />
                {editBanner.image ? 'Replace Image' : 'Click to Upload'}
                {editBanner.image && <img src={editBanner.image} alt="preview" className="mt-2 h-24 w-24 object-cover rounded" />}
              </div>
            </div>
          </div>
          <div>
            <label className="text-[11px] font-medium text-gray-600 mb-1">Additional Images (optional, added to linked product gallery)</label>
            <div className="border-2 border-dashed rounded-md p-4 text-xs">
              <input ref={editAdditionalImagesRef} type="file" accept="image/*" multiple onChange={handleEditAdditionalImagesChange} />
              {editBanner._additionalFiles?.length > 0 && (
                <div className="text-[11px] text-gray-500 mt-2">{editBanner._additionalFiles.length} file(s) selected</div>
              )}
            </div>
          </div>
          <div>
            <label className="text-[11px] font-medium text-gray-600 mb-1">Features</label>
            <div className="flex gap-2 mb-2">
              <Input value={editBanner.featureInput} onChange={e=>setEditBanner(p=>({...p,featureInput:e.target.value}))} placeholder="Add feature" />
              <Button type="button" variant="outline" onClick={()=>{ if(editBanner.featureInput?.trim()){ setEditBanner(p=>({...p,features:[...p.features, p.featureInput.trim()], featureInput:''})) } }} className="whitespace-nowrap">+ Add</Button>
            </div>
            {editBanner.features.length>0 && (
              <div className="flex flex-wrap gap-2">
                {editBanner.features.map((f,i)=>(
                  <span key={i} className="bg-gray-100 text-[11px] px-2 py-1 rounded flex items-center gap-1">{f}<button type="button" onClick={()=>setEditBanner(p=>({...p, features: p.features.filter((_,idx)=>idx!==i)}))} className="text-red-500 hover:text-red-600">×</button></span>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
