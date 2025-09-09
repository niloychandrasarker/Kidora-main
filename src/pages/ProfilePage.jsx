import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { CheckCircle2, Package, Truck, Clock, ChevronRight, ChevronDown, ShoppingCart, Heart, BadgeCheck, User, RefreshCcw, LogOut, MapPin } from "lucide-react";
import { useOrders } from "../context/useOrders";
import api from "../services/apiService";

// Orders now come from OrderContext

const statusColors = {
  processing: "bg-amber-100 text-amber-700",
  packed: "bg-purple-100 text-purple-700",
  shipped: "bg-blue-100 text-blue-700",
  out_for_delivery: "bg-indigo-100 text-indigo-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const { cartItems, wishlistItems } = useCart();
  const { orders } = useOrders();
  const { user, logout, isAuthenticated, refreshProfile, updateProfile } = useAuth();
  const [activeOrder, setActiveOrder] = useState(orders[0] || null);
  const [menuOpen, setMenuOpen] = useState(false);
  const addressesRef = useRef(null);
  const accountRef = useRef(null);
  // Addresses state
  const [addresses, setAddresses] = useState([]);
  const [addrLoading, setAddrLoading] = useState(false);
  const [addrError, setAddrError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ fullName: "", phone: "", streetAddress: "", city: "", postalCode: "", notes: "", isDefault: false });
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({ fullName: "", phone: "", streetAddress: "", city: "", postalCode: "", notes: "", isDefault: false });
  // Account info state (prefill from user if available for instant UI)
  const [accForm, setAccForm] = useState({
    email: user?.email || "",
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    phone: user?.phone || "",
  });
  const [accLoading, setAccLoading] = useState(false);
  const [accMsg, setAccMsg] = useState("");
  const [accLoaded, setAccLoaded] = useState(false); // loaded once from backend
  const [accDirty, setAccDirty] = useState(false);   // user is editing

  // Sync active order when orders load
  useEffect(() => {
    if (!activeOrder && orders && orders.length > 0) {
      setActiveOrder(orders[0]);
    }
  }, [orders, activeOrder]);

  // Load profile once after auth; don't overwrite when user is typing
  useEffect(() => {
    if (!isAuthenticated) {
      setAddresses([]);
      return;
    }
    let cancelled = false;
    (async () => {
      if (accLoaded) return; // only first load
      try {
        const prof = await refreshProfile();
        if (cancelled) return;
        const u = prof || user || {};
        setAccForm({
          email: u.email || "",
          firstName: u.firstName || "",
          lastName: u.lastName || "",
          phone: u.phone || "",
        });
        setAccLoaded(true);
      } catch {
        // ignore
      }
    })();
    loadAddresses();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, accLoaded]);

  // Keep Account Info in sync with user context once profile updates after registration/login
  useEffect(() => {
    if (!user) return;
    // If user isn't editing, mirror context profile into the form
    if (!accDirty) {
      setAccForm(prev => {
        const next = {
          email: user.email || "",
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          phone: user.phone || "",
        };
        // Avoid unnecessary state updates
        if (
          prev.email === next.email &&
          prev.firstName === next.firstName &&
          prev.lastName === next.lastName &&
          prev.phone === next.phone
        ) return prev;
        return next;
      });
    }
  }, [user, accDirty]);

  async function loadAddresses() {
    try {
      setAddrLoading(true);
      setAddrError("");
  const res = await api.getUserAddresses();
  const data = res?.data ?? res;
  setAddresses(Array.isArray(data) ? data : (data?.content || []));
    } catch (err) {
      console.error(err);
      setAddrError("Failed to load addresses.");
    } finally {
      setAddrLoading(false);
    }
  }

  const resetAddForm = () => setAddForm({ fullName: "", phone: "", streetAddress: "", city: "", postalCode: "", notes: "", isDefault: false });

  async function handleAddAddress(e) {
    e?.preventDefault();
    try {
      setAddrLoading(true);
      setAddrError("");
      const payload = { ...addForm };
      await api.createAddress(payload);
      resetAddForm();
      setShowAddForm(false);
      await loadAddresses();
    } catch (err) {
      console.error(err);
      setAddrError("Could not add address.");
    } finally {
      setAddrLoading(false);
    }
  }

  function startEdit(a) {
    setEditId(a.id);
    setEditForm({
      fullName: a.fullName || "",
      phone: a.phone || "",
      streetAddress: a.streetAddress || "",
      city: a.city || "",
      postalCode: a.postalCode || "",
  notes: a.notes || "",
      isDefault: !!a.isDefault,
    });
  }

  function cancelEdit() {
    setEditId(null);
  }

  async function saveEditAddress(id) {
    try {
      setAddrLoading(true);
      setAddrError("");
      await api.updateAddress(id, { ...editForm });
      setEditId(null);
      await loadAddresses();
    } catch (err) {
      console.error(err);
      setAddrError("Could not update address.");
    } finally {
      setAddrLoading(false);
    }
  }

  async function deleteAddress(id) {
    const ok = window.confirm("Delete this address?");
    if (!ok) return;
    try {
      setAddrLoading(true);
      setAddrError("");
      await api.deleteAddress(id);
      await loadAddresses();
    } catch (err) {
      console.error(err);
      setAddrError("Could not delete address.");
    } finally {
      setAddrLoading(false);
    }
  }

  async function setDefaultAddress(a) {
    try {
      setAddrLoading(true);
      setAddrError("");
      // Send full payload to satisfy validation
      await api.updateAddress(a.id, {
        fullName: a.fullName,
        phone: a.phone,
        streetAddress: a.streetAddress,
        city: a.city,
        postalCode: a.postalCode,
        isDefault: true,
      });
      await loadAddresses();
    } catch (err) {
      console.error(err);
      setAddrError("Could not set default.");
    } finally {
      setAddrLoading(false);
    }
  }

  async function handleSaveAccount(e) {
    e?.preventDefault();
    setAccMsg("");
    try {
      setAccLoading(true);
      const payload = {
        firstName: accForm.firstName?.trim() || "",
        lastName: accForm.lastName?.trim() || "",
        phone: accForm.phone?.trim() || "",
      };
      const res = await updateProfile(payload);
      if (res?.success) {
        setAccMsg("Account updated successfully.");
        setAccDirty(false);
        setAccLoaded(true);
      } else {
        setAccMsg(res?.message || "Failed to update account.");
      }
    } catch {
      setAccMsg("Failed to update account.");
    } finally {
      setAccLoading(false);
      // no auto-refresh of accForm to avoid overriding user typing
    }
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Sign In</h2>
          <p className="text-gray-600 mb-6">You need to sign in to view your profile.</p>
          <button
            onClick={() => navigate("/")}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 relative">
            <button
              type="button"
              onClick={()=>setMenuOpen(o=>!o)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:text-blue-600 hover:border-blue-400 transition"
              aria-label={menuOpen ? 'Collapse menu' : 'Expand menu'}
            >
              {menuOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            <div className="flex items-center space-x-4 pr-10">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-xl">
                {user?.firstName ? user.firstName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  {user?.firstName && user?.lastName 
                    ? `${user.firstName} ${user.lastName}` 
                    : 'User'
                  } 
                  <BadgeCheck className="w-5 h-5 text-blue-500" />
                </h2>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
            </div>
            <div className={`mt-6 space-y-2 text-sm ${menuOpen ? 'block' : 'hidden'} animate-fade-in`}>  
              <button onClick={()=>accountRef.current?.scrollIntoView({behavior:'smooth', block:'start'})} className="flex w-full items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50">
                <span className="flex items-center gap-2"><User className="w-4 h-4" /> Account Info</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
              <button onClick={()=>addressesRef.current?.scrollIntoView({behavior:'smooth', block:'start'})} className="flex w-full items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50">
                <span className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Addresses</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
              <button onClick={()=>navigate('/orders')} className="flex w-full items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50">
                <span className="flex items-center gap-2"><ShoppingCart className="w-4 h-4" /> Orders ({orders.length})</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
              <button onClick={()=>navigate('/wishlist')} className="flex w-full items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50">
                <span className="flex items-center gap-2"><Heart className="w-4 h-4" /> Wishlist ({wishlistItems.length})</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
              <button onClick={()=>navigate('/cart')} className="flex w-full items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50">
                <span className="flex items-center gap-2"><ShoppingCart className="w-4 h-4" /> Cart ({cartItems.length})</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
              <button className="flex w-full items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50">
                <span className="flex items-center gap-2"><RefreshCcw className="w-4 h-4" /> Returns</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
              <button onClick={logout} className="flex w-full items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 text-red-600">
                <span className="flex items-center gap-2"><LogOut className="w-4 h-4" /> Logout</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 space-y-4">
            <h3 className="font-semibold text-gray-800">Quick Stats</h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 rounded-xl bg-blue-50">
                <p className="text-xl font-bold text-blue-600">{orders.length}</p>
                <p className="text-xs text-blue-700 font-medium">Orders</p>
              </div>
              <div className="p-3 rounded-xl bg-green-50">
                <p className="text-xl font-bold text-green-600">{wishlistItems.length}</p>
                <p className="text-xs text-green-700 font-medium">Wishlist</p>
              </div>
              <div className="p-3 rounded-xl bg-indigo-50 col-span-2">
                <p className="text-xl font-bold text-indigo-600">৳ {orders.reduce((s,o)=>s+o.total,0)}</p>
                <p className="text-xs text-indigo-700 font-medium">Total Spent</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-8">
          {/* Account Info */}
          <div ref={accountRef} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Account Info</h3>
            </div>
            {accMsg && (
              <div className={`mb-4 text-sm ${accMsg.includes('successfully') ? 'text-green-700 bg-green-50 border border-green-100' : 'text-red-700 bg-red-50 border border-red-100'} rounded p-2`}>{accMsg}</div>
            )}
            <form onSubmit={handleSaveAccount} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input value={accForm.email} readOnly className="w-full border rounded-lg px-3 py-2 bg-gray-50 text-gray-600" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input value={accForm.firstName} onChange={e=>{ setAccDirty(true); setAccForm(f=>({...f, firstName:e.target.value})); }} placeholder="First name" className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input value={accForm.lastName} onChange={e=>{ setAccDirty(true); setAccForm(f=>({...f, lastName:e.target.value})); }} placeholder="Last name" className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input value={accForm.phone} onChange={e=>{ setAccDirty(true); setAccForm(f=>({...f, phone:e.target.value})); }} placeholder="01xxxxxxxxx" className="w-full border rounded-lg px-3 py-2" />
              </div>
              <div className="md:col-span-2 flex gap-2">
                <button disabled={accLoading || !accDirty} className="px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50">Save Changes</button>
              </div>
            </form>
          </div>
          {/* Active Order Tracking */}
          {activeOrder && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    Order Tracking <Package className="w-5 h-5 text-gray-500" />
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">Order ID: {activeOrder.id} • Placed on {activeOrder.date}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusColors[activeOrder.status] || 'bg-gray-100 text-gray-700'}`}>{activeOrder.status}</span>
                  {activeOrder.returns?.status && activeOrder.returns.status !== 'PENDING' && (
                    <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${activeOrder.returns.status==='APPROVED'?'bg-green-100 text-green-700': activeOrder.returns.status==='REJECTED'?'bg-red-100 text-red-700': activeOrder.returns.status==='COMPLETED'?'bg-blue-100 text-blue-700':'bg-amber-100 text-amber-700'}`}>
                      {activeOrder.returns.status==='APPROVED' && 'Return Approved'}
                      {activeOrder.returns.status==='REJECTED' && 'Return Rejected'}
                      {activeOrder.returns.status==='COMPLETED' && 'Return Successful'}
                    </span>
                  )}
                </div>
              </div>

              {/* Tracking Steps */}
              <div className="relative">
                <div className="flex justify-between text-xs font-medium text-gray-500 mb-4">
                  {activeOrder.tracking.steps.map(step => (
                    <div key={step.key} className="flex-1 text-center">
                      <p className={step.key === activeOrder.tracking.current ? 'text-gray-900 font-semibold' : ''}>{step.label}</p>
                      <p className="mt-1 text-[10px] uppercase tracking-wide">{step.time || '—'}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  {activeOrder.tracking.steps.map(step => {
                    const index = activeOrder.tracking.steps.findIndex(s=>s.key===step.key);
                    const currentIndex = activeOrder.tracking.steps.findIndex(s=>s.key===activeOrder.tracking.current);
                    const completed = index <= currentIndex;
                    return (
                      <div key={step.key} className="flex-1 flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shadow ${completed ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gray-200 text-gray-500'}`}>{completed ? <CheckCircle2 className="w-5 h-5 text-white" /> : index+1}</div>
                        {index < activeOrder.tracking.steps.length -1 && (
                          <div className={`h-1 flex-1 mx-1 md:mx-2 rounded ${completed && index < currentIndex ? 'bg-gradient-to-r from-blue-500 to-indigo-600' : 'bg-gray-200'}`}></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Items */}
              <div className="mt-6 border-t pt-6">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">Items ({activeOrder.items.length}) <Truck className="w-4 h-4 text-gray-500" /></h4>
                <div className="divide-y">
                  {activeOrder.items.map(it => (
                    <div key={`${it.id}-${it.selectedSize || ''}`} className="py-3 flex items-center justify-between text-sm">
                      <div className="flex-1">
                        <p className="font-medium text-gray-800 line-clamp-1">{it.title}</p>
                        <p className="text-xs text-gray-500">Size: {it.selectedSize || '-'} • Qty: {it.qty}</p>
                      </div>
                      <p className="font-semibold text-gray-900">৳ {it.price * it.qty}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between text-sm font-medium">
                  <span>Total</span>
                  <span>৳ {activeOrder.total}</span>
                </div>
              </div>
            </div>
          )}

          {/* Orders List */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">Recent Orders <Clock className="w-5 h-5 text-gray-500" /></h3>
              <button onClick={()=>navigate('/orders')} className="text-xs px-3 py-1 rounded-full bg-gray-900 text-white hover:bg-gray-800">View All</button>
            </div>
            <div className="divide-y">
                  {orders.map(o => (
                <button
                  key={o.id}
                  onClick={()=>setActiveOrder(o)}
                  className={`w-full text-left py-4 flex items-center justify-between gap-4 hover:bg-gray-50 rounded-lg px-2 transition ${activeOrder && activeOrder.id === o.id ? 'bg-gray-50' : ''}`}
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{o.id}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{o.date}</p>
                  </div>
                  <div className="hidden md:block text-sm font-medium text-gray-700">৳ {o.total}</div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`px-2 py-1 text-[10px] font-medium rounded-full ${statusColors[o.status] || 'bg-gray-100 text-gray-700'}`}>{o.status}</span>
                    {o.returns?.status && o.returns.status !== 'PENDING' && (
                      <span className={`px-2 py-0.5 text-[9px] font-medium rounded-full ${o.returns.status==='APPROVED'?'bg-green-100 text-green-700': o.returns.status==='REJECTED'?'bg-red-100 text-red-700': o.returns.status==='COMPLETED'?'bg-blue-100 text-blue-700':'bg-amber-100 text-amber-700'}`}>
                        {o.returns.status==='APPROVED' && 'Return Approved'}
                        {o.returns.status==='REJECTED' && 'Return Rejected'}
                        {o.returns.status==='COMPLETED' && 'Return Successful'}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Addresses */}
          <div ref={addressesRef} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Addresses</h3>
              <button
                onClick={() => setShowAddForm(v => !v)}
                className="text-xs px-3 py-1 rounded-full bg-blue-600 text-white hover:bg-blue-700"
              >
                {showAddForm ? 'Close' : 'Add New'}
              </button>
            </div>

            {addrError && (
              <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded p-2">{addrError}</div>
            )}

            {/* Add Form */}
            {showAddForm && (
              <form onSubmit={handleAddAddress} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name<span className="text-red-500">*</span></label>
                  <input required value={addForm.fullName} onChange={e=>setAddForm(f=>({...f, fullName:e.target.value}))} placeholder="Enter your full name" className="w-full border rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number<span className="text-red-500">*</span></label>
                  <input required value={addForm.phone} onChange={e=>setAddForm(f=>({...f, phone:e.target.value}))} placeholder="01xxxxxxxxx" className="w-full border rounded-lg px-3 py-2" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address<span className="text-red-500">*</span></label>
                  <textarea required value={addForm.streetAddress} onChange={e=>setAddForm(f=>({...f, streetAddress:e.target.value}))} placeholder="House, road, area" className="w-full border rounded-lg px-3 py-2 min-h-[80px]"></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City<span className="text-red-500">*</span></label>
                  <input required value={addForm.city} onChange={e=>setAddForm(f=>({...f, city:e.target.value}))} placeholder="Dhaka" className="w-full border rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code<span className="text-red-500">*</span></label>
                  <input required value={addForm.postalCode} onChange={e=>setAddForm(f=>({...f, postalCode:e.target.value}))} placeholder="1207" className="w-full border rounded-lg px-3 py-2" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                  <input value={addForm.notes} onChange={e=>setAddForm(f=>({...f, notes:e.target.value}))} placeholder="Any delivery instructions" className="w-full border rounded-lg px-3 py-2" />
                </div>
                <label className="flex items-center gap-2 text-sm md:col-span-2">
                  <input type="checkbox" checked={addForm.isDefault} onChange={e=>setAddForm(f=>({...f, isDefault:e.target.checked}))} />
                  Make default
                </label>
                <div className="md:col-span-2 flex gap-2">
                  <button disabled={addrLoading} className="px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50">Save Address</button>
                  <button type="button" onClick={()=>{resetAddForm(); setShowAddForm(false);}} className="px-4 py-2 rounded-lg border">Cancel</button>
                </div>
              </form>
            )}

            {/* Address List */}
            <div className="space-y-3">
              {addrLoading && addresses.length === 0 && (
                <p className="text-sm text-gray-500">Loading addresses…</p>
              )}
              {!addrLoading && addresses.length === 0 && (
                <p className="text-sm text-gray-500">No saved addresses. Add one to speed up checkout.</p>
              )}
              {addresses.map(a => (
                <div key={a.id} className="border rounded-xl p-4 hover:bg-gray-50">
                  {editId === a.id ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name<span className="text-red-500">*</span></label>
                        <input required value={editForm.fullName} onChange={e=>setEditForm(f=>({...f, fullName:e.target.value}))} placeholder="Enter your full name" className="w-full border rounded-lg px-3 py-2" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number<span className="text-red-500">*</span></label>
                        <input required value={editForm.phone} onChange={e=>setEditForm(f=>({...f, phone:e.target.value}))} placeholder="01xxxxxxxxx" className="w-full border rounded-lg px-3 py-2" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Address<span className="text-red-500">*</span></label>
                        <textarea required value={editForm.streetAddress} onChange={e=>setEditForm(f=>({...f, streetAddress:e.target.value}))} placeholder="House, road, area" className="w-full border rounded-lg px-3 py-2 min-h-[80px]"></textarea>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">City<span className="text-red-500">*</span></label>
                        <input required value={editForm.city} onChange={e=>setEditForm(f=>({...f, city:e.target.value}))} placeholder="Dhaka" className="w-full border rounded-lg px-3 py-2" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code<span className="text-red-500">*</span></label>
                        <input required value={editForm.postalCode} onChange={e=>setEditForm(f=>({...f, postalCode:e.target.value}))} placeholder="1207" className="w-full border rounded-lg px-3 py-2" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                        <input value={editForm.notes} onChange={e=>setEditForm(f=>({...f, notes:e.target.value}))} placeholder="Any delivery instructions" className="w-full border rounded-lg px-3 py-2" />
                      </div>
                      <label className="flex items-center gap-2 text-sm md:col-span-2">
                        <input type="checkbox" checked={!!editForm.isDefault} onChange={e=>setEditForm(f=>({...f, isDefault:e.target.checked}))} />
                        Set as default
                      </label>
                      <div className="md:col-span-2 flex gap-2">
                        <button disabled={addrLoading} onClick={()=>saveEditAddress(a.id)} className="px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50">Save</button>
                        <button type="button" onClick={cancelEdit} className="px-4 py-2 rounded-lg border">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div>
                        <p className="font-medium text-gray-900">
                          {a.fullName} {a.isDefault && <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 align-middle">Default</span>}
                        </p>
                        <p className="text-sm text-gray-600">{a.phone}</p>
                        <p className="text-sm text-gray-600">{a.streetAddress}, {a.city} {a.postalCode}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {!a.isDefault && (
                          <button disabled={addrLoading} onClick={()=>setDefaultAddress(a)} className="text-xs px-3 py-1 rounded-full border hover:bg-gray-100">Set Default</button>
                        )}
                        <button disabled={addrLoading} onClick={()=>startEdit(a)} className="text-xs px-3 py-1 rounded-full border hover:bg-gray-100">Edit</button>
                        <button disabled={addrLoading} onClick={()=>deleteAddress(a.id)} className="text-xs px-3 py-1 rounded-full border text-red-600 hover:bg-red-50">Delete</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
