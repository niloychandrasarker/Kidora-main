import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Package, Truck } from 'lucide-react';
import { useOrders } from '../context/useOrders';
import apiService from '../services/apiService';

const statusColors = {
  processing: 'bg-amber-100 text-amber-700',
  packed: 'bg-purple-100 text-purple-700',
  shipped: 'bg-blue-100 text-blue-700',
  out_for_delivery: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function OrderDetails() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { orders, addBackendOrder, updateOrderFromResponse } = useOrders();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const numericId = useMemo(() => {
    const n = Number(orderId);
    return Number.isFinite(n) ? n : null;
  }, [orderId]);

  const existing = useMemo(() => {
    // Find by raw id or by displayed id
    return orders.find(o => (numericId && o._rawId === numericId) || String(o.id) === String(orderId));
  }, [orders, numericId, orderId]);

  useEffect(() => {
    let cancelled = false;
    const fetchIfNeeded = async () => {
      if (existing || !numericId) return;
      setLoading(true);
      setError('');
      try {
        const res = await apiService.getOrderById(numericId);
        const data = res?.data ?? res;
        if (!cancelled && data) addBackendOrder(data);
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Failed to load order');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchIfNeeded();
    return () => { cancelled = true; };
  }, [existing, numericId, addBackendOrder]);

  const order = existing;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Package className="w-5 h-5 text-gray-600" /> Order Tracking</h1>
        <button onClick={() => navigate('/orders')} className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </button>
      </div>

      {loading && (
        <div className="bg-white rounded-2xl shadow-sm border p-6 text-sm text-gray-600">Loading order…</div>
      )}
      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 rounded-2xl p-4 mb-4 text-sm">{error}</div>
      )}
      {!loading && !order && !error && (
        <div className="bg-white rounded-2xl shadow-sm border p-6 text-sm text-gray-600">Order not found.</div>
      )}

      {order && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-500">Order ID</p>
              <p className="text-lg font-semibold text-gray-900">{order.id}</p>
              <p className="text-xs text-gray-500 mt-1">Placed on {order.date}</p>
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
              {order.status !== 'shipped' && order.status !== 'out_for_delivery' && order.status !== 'delivered' && order.status !== 'cancelled' && (
                <button
                  onClick={async () => {
                    if (!window.confirm('Cancel this order? You can only cancel before it is shipped.')) return;
                    try {
                      const res = await apiService.cancelOrder(order._rawId || order.id);
                      const data = res?.data ?? res;
                      if (data?.id) updateOrderFromResponse(data);
                    } catch (e) {
                      alert(e?.message || 'Failed to cancel order');
                    }
                  }}
                  className="text-xs px-3 py-1 rounded-full border border-red-300 text-red-600 hover:bg-red-50"
                >
                  Cancel Order
                </button>
              )}
            </div>
          </div>

          {/* Tracking Steps */}
          <div className="relative">
            <div className="flex justify-between text-xs font-medium text-gray-500 mb-4">
              {order.tracking.steps.map(step => (
                <div key={step.key} className="flex-1 text-center">
                  <p className={step.key === order.tracking.current ? 'text-gray-900 font-semibold' : ''}>{step.label}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-wide">{step.time || '—'}</p>
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
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shadow ${completed ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gray-200 text-gray-500'}`}>
                      {completed ? <CheckCircle2 className="w-5 h-5 text-white" /> : index + 1}
                    </div>
                    {index < order.tracking.steps.length - 1 && (
                      <div className={`h-1 flex-1 mx-1 md:mx-2 rounded ${completed && index < currentIndex ? 'bg-gradient-to-r from-blue-500 to-indigo-600' : 'bg-gray-200'}`}></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Items */}
          <div className="mt-6 border-t pt-6">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">Items ({order.items.length}) <Truck className="w-4 h-4 text-gray-500" /></h4>
            <div className="divide-y">
              {order.items.map(it => (
                <div key={`${it.id}-${it.title}-${it.selectedSize || ''}`} className="py-3 flex items-center justify-between text-sm">
                  <div className="flex-1">
                    <p className="font-medium text-gray-800 line-clamp-1">{it.title}</p>
                    <p className="text-xs text-gray-500">Size: {it.selectedSize || '-'} • Qty: {it.qty}</p>
                  </div>
                  <p className="font-semibold text-gray-900">৳ {Number(it.price) * Number(it.qty)}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between text-sm font-medium">
              <span>Total</span>
              <span>৳ {order.total}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
