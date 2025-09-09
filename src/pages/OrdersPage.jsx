import { useOrders } from "../context/useOrders";
import { Package, ArrowLeft, CheckCircle2, Truck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/apiService";
import { useMemo, useRef, useState } from "react";
import { Plus, X } from "lucide-react";

const statusColors = {
  processing: "bg-amber-100 text-amber-700",
  packed: "bg-purple-100 text-purple-700",
  shipped: "bg-blue-100 text-blue-700",
  out_for_delivery: "bg-indigo-100 text-indigo-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function OrdersPage() {
  const { orders, updateOrderFromResponse } = useOrders();
  const navigate = useNavigate();
  const [returnFor, setReturnFor] = useState(null); // rawId for order
  const [returnReason, setReturnReason] = useState("");
  const [returnStep, setReturnStep] = useState(1); // 1=policy, 2=form
  const [returnData, setReturnData] = useState({ productId: '', phone: '', email: '', reasonCategory: 'DAMAGED', photos: [] });
  const [expanded, setExpanded] = useState(null); // _rawId or id of expanded order
  const photoInputRef = useRef(null);
  const selectedOrder = useMemo(()=> orders.find(o => (o._rawId||o.id) === returnFor) || null, [orders, returnFor]);
  const tryCancel = async (rawId) => {
    if (!window.confirm("Cancel this order? You can only cancel before it is shipped.")) return;
    try {
      const res = await api.cancelOrder(rawId);
      const data = res?.data ?? res;
      if (data?.id) updateOrderFromResponse(data);
    } catch (e) {
      alert(e?.message || 'Failed to cancel order');
    }
  };
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Package className="w-6 h-6 text-gray-600" /> Your Orders</h1>
          <p className="text-sm text-gray-500 mt-1">Track and manage all your orders</p>
        </div>
        <button onClick={()=>navigate('/profile')} className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Profile
        </button>
      </div>
      <div className="space-y-6">
        {orders.map(order => {
          const expandedNow = (expanded === (order._rawId || order.id));
          return (
            <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div
                className="p-6 cursor-pointer flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:bg-gray-50 rounded-2xl"
                onClick={() => setExpanded(expandedNow ? null : (order._rawId || order.id))}
              >
                <div>
                  <p className="font-semibold text-gray-900 flex items-center gap-2">{order.id}{expandedNow && <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">Details</span>}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Placed on {order.date} • {order.items.length} items</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap justify-end">
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusColors[order.status] || 'bg-gray-100 text-gray-700'}`}>{order.status}</span>
                  {order.returns?.status && order.returns.status !== 'PENDING' && (
                    <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${order.returns.status==='APPROVED'?'bg-green-100 text-green-700': order.returns.status==='REJECTED'?'bg-red-100 text-red-700': order.returns.status==='COMPLETED'?'bg-blue-100 text-blue-700':'bg-amber-100 text-amber-700'}`}>
                      {order.returns.status==='APPROVED' && 'Return Approved'}
                      {order.returns.status==='REJECTED' && 'Return Rejected'}
                      {order.returns.status==='COMPLETED' && 'Return Successful'}
                    </span>
                  )}
                  <p className="text-sm font-semibold text-gray-900">৳ {order.total}</p>
                </div>
              </div>
              {expandedNow && (
                <div className="px-6 pb-6 -mt-2">
                  {/* Tracking Steps */}
                  {order.tracking?.steps && (
                    <div className="mb-5">
                      <div className="flex justify-between text-[10px] font-medium text-gray-500 mb-3">
                        {order.tracking.steps.map(step => (
                          <div key={step.key} className="flex-1 text-center">
                            <p className={step.key === order.tracking.current ? 'text-gray-900 font-semibold text-xs' : ''}>{step.label}</p>
                            <p className="mt-1 text-[9px] uppercase tracking-wide">{step.time || '—'}</p>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between">
                        {order.tracking.steps.map(step => {
                          const index = order.tracking.steps.findIndex(s => s.key === step.key);
                          const currentIndex = order.tracking.steps.findIndex(s => s.key === order.tracking.current);
                          const completed = index <= currentIndex;
                          return (
                            <div key={step.key} className="flex-1 flex items-center">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-semibold shadow ${completed ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gray-200 text-gray-500'}`}>
                                {completed ? <CheckCircle2 className="w-4 h-4 text-white" /> : index + 1}
                              </div>
                              {index < order.tracking.steps.length - 1 && (
                                <div className={`h-1 flex-1 mx-1 md:mx-2 rounded ${completed && index < currentIndex ? 'bg-gradient-to-r from-blue-500 to-indigo-600' : 'bg-gray-200'}`}></div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {/* Items */}
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                    {order.items.map(it => (
                      <div key={`${it.id}-${it.title}-${it.selectedSize || ''}`} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
                        <div className="pr-2">
                          <p className="font-medium text-gray-800 line-clamp-1">{it.title}</p>
                          <p className="text-[10px] uppercase tracking-wide text-gray-500">Size: {it.selectedSize || '-'} • Qty: {it.qty}</p>
                        </div>
                        <p className="text-gray-900 font-semibold text-xs">৳ {Number(it.price) * Number(it.qty)}</p>
                      </div>
                    ))}
                  </div>
                  {/* Actions */}
                  <div className="mt-4 flex flex-wrap gap-2 justify-between items-center">
                    <div className="flex gap-2">
                      <button onClick={(e)=>{ e.stopPropagation(); navigate(`/orders/${order._rawId || order.id}`); }} className="text-[11px] px-3 py-1 rounded-full border hover:bg-gray-50">Full Page</button>
                      {order.status !== 'shipped' && order.status !== 'out_for_delivery' && order.status !== 'delivered' && order.status !== 'cancelled' && (
                        <button onClick={(e)=>{ e.stopPropagation(); tryCancel(order._rawId || order.id); }} className="text-[11px] px-3 py-1 rounded-full border border-red-300 text-red-600 hover:bg-red-50">Cancel</button>
                      )}
                      {order.status === 'delivered' && canReturn(order) && !order._raw?.returnRequest && order.returns?.status !== 'REJECTED' && (
                        <button onClick={(e)=>{ e.stopPropagation(); setReturnFor(order._rawId || order.id); setReturnReason(""); }} className="text-[11px] px-3 py-1 rounded-full border border-blue-300 text-blue-700 hover:bg-blue-50">Return</button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">Total: <span className="font-semibold text-gray-800">৳ {order.total}</span></p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {orders.length === 0 && (
        <div className="text-center py-16">
          <Package className="w-12 h-12 mx-auto text-gray-300" />
          <p className="mt-4 text-gray-600 font-medium">No orders yet</p>
          <button onClick={()=>navigate('/')} className="mt-4 px-5 py-2.5 bg-gray-900 text-white rounded-full text-sm font-medium hover:bg-gray-800">Start Shopping</button>
        </div>
      )}

      {/* Return Request Modal */}
      {returnFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-5 space-y-4">
            {returnStep===1 ? (
              <>
                <h3 className="text-lg font-semibold text-gray-900">Return Policy</h3>
                <div className="text-sm text-gray-700 space-y-2 max-h-64 overflow-auto">
                  <p>• You may request a return within 3 days after delivery.</p>
                  <p>• Items must be unused and in original condition unless damaged in transit.</p>
                  <p>• Please provide a clear reason; damaged items should include photos.</p>
                  <p>• Our team will review and contact you to complete the process.</p>
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={()=>{ setReturnFor(null); setReturnReason(""); setReturnStep(1); }} className="px-3 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50">Close</button>
                  <button onClick={()=>setReturnStep(2)} className="px-3 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700">I Agree</button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-gray-900">Return Form</h3>
                <div className="grid gap-3 text-sm">
                  <label className="block">
                    <span className="text-gray-600 text-xs">Product</span>
                    <select value={returnData.productId}
                      onChange={(e)=>setReturnData(d=>({...d, productId: e.target.value}))}
                      className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2">
                      <option value="">Select product</option>
                      {(selectedOrder?.items||[]).map(it => (
                        <option key={`${it.id}-${it.selectedSize||''}`} value={it.id}>{it.title} {it.selectedSize?`(Size: ${it.selectedSize})`:''}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-gray-600 text-xs">Your Email</span>
                    <input type="email" value={returnData.email} onChange={(e)=>setReturnData(d=>({...d,email:e.target.value}))} className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2" placeholder="name@example.com" />
                  </label>
                  <label className="block">
                    <span className="text-gray-600 text-xs">Phone</span>
                    <input value={returnData.phone} onChange={(e)=>setReturnData(d=>({...d,phone:e.target.value}))} className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2" placeholder="01XXXXXXXXX" />
                  </label>
                  <label className="block">
                    <span className="text-gray-600 text-xs">Reason Category</span>
                    <select value={returnData.reasonCategory} onChange={(e)=>setReturnData(d=>({...d,reasonCategory:e.target.value}))} className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2">
                      <option value="DAMAGED">Damaged</option>
                      <option value="WRONG_SIZE">Wrong Size</option>
                      <option value="NOT_AS_DESCRIBED">Not as Described</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-gray-600 text-xs">Reason</span>
                    <textarea value={returnReason} onChange={(e)=>setReturnReason(e.target.value)} placeholder="Write your reason here..." className="mt-1 w-full h-24 border border-gray-300 rounded-md px-3 py-2" />
                  </label>
                  <div>
                    <span className="text-gray-600 text-xs">Photos (optional)</span>
                    <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {Array.isArray(returnData.photos) && returnData.photos.map((file, idx) => (
                        <div key={`${idx}-${file.name||'photo'}`} className="relative group">
                          <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-24 object-cover rounded-md border" />
                          <button type="button" onClick={()=>setReturnData(d=>({ ...d, photos: d.photos.filter((_,i)=>i!==idx) }))} className="absolute -top-2 -right-2 bg-black/60 hover:bg-black text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition" aria-label="Remove photo">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      <button type="button" onClick={()=>photoInputRef.current?.click()} className="flex items-center justify-center h-24 border-2 border-dashed border-gray-300 rounded-md hover:border-gray-400 hover:bg-gray-50 transition">
                        <div className="flex flex-col items-center text-gray-500 text-xs">
                          <Plus className="w-5 h-5 mb-1" />
                          Add photos
                        </div>
                      </button>
                    </div>
                    <input ref={photoInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e)=>{
                      const files = Array.from(e.target.files||[]);
                      if (!files.length) return;
                      setReturnData(d=>({ ...d, photos: [...(d.photos||[]), ...files] }));
                      // reset input to allow re-adding same file if needed
                      e.target.value = '';
                    }} />
                  </div>
                </div>
                <div className="flex justify-between gap-2 pt-2">
                  <button onClick={()=>setReturnStep(1)} className="px-3 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50">Back</button>
                  <div className="flex gap-2">
                    <button onClick={()=>{ setReturnFor(null); setReturnReason(""); setReturnStep(1); setReturnData({ productId:'', phone:'', email:'', reasonCategory:'DAMAGED', photos: []}); }} className="px-3 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50">Cancel</button>
                    <button onClick={()=>submitReturnMultipart(returnFor, returnReason, returnData, setReturnFor, setReturnReason, setReturnData, setReturnStep, updateOrderFromResponse)} className="px-3 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700">Submit</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Helpers
function canReturn(order) {
  try {
  // Prefer backend eligibility flag if present
  if (typeof order._raw?.returnEligible !== 'undefined') return !!order._raw.returnEligible;
  const deliveredStep = (order.tracking?.steps || []).find(s => s.key === 'delivered' && s.time);
  if (!deliveredStep) return false;
    // Orders from backend also carry createdAt; fallback to delivered time text HH:mm if present today
    // We'll allow the button and let backend enforce the 3-day rule strictly.
    return true;
  } catch { return false; }
}

async function submitReturnMultipart(orderId, reason, extra, setReturnFor, setReturnReason, setReturnData, setReturnStep, updateOrderFromResponse) {
  if (!reason || reason.trim().length < 5) { alert('Please enter at least 5 characters.'); return; }
  try {
    const fd = new FormData();
    fd.append('reason', reason);
    if (extra.productId) fd.append('productId', extra.productId);
    if (extra.phone) fd.append('phone', extra.phone);
    if (extra.email) fd.append('email', extra.email);
    if (extra.reasonCategory) fd.append('reasonCategory', extra.reasonCategory);
    if (Array.isArray(extra.photos)) {
      extra.photos.forEach(f => fd.append('photos', f));
    }
    const res = await fetch(`${api.baseURL}/orders/${orderId}/return`, {
      method: 'POST',
      headers: { ...api.getAuthHeaders() },
      body: fd,
    });
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) throw new Error((data && (data.message||data.error)) || `HTTP ${res.status}`);
    const payload = data?.data ?? data;
    if (payload?.id) updateOrderFromResponse(payload);
    setReturnFor(null);
    setReturnReason('');
    setReturnData({ productId:'', phone:'', email:'', reasonCategory:'DAMAGED', photos: []});
    setReturnStep(1);
    alert('Return request submitted. We will contact you soon.');
  } catch (e) {
    alert(e?.message || 'Failed to submit return request');
  }
}
