import { useState, useCallback, useEffect } from "react";
import { OrderContext } from "./OrderContextInternal";
import apiService from "../services/apiService";
import { useAuth } from "./AuthContext";

const initialOrders = [];

export const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState(initialOrders);
  const { isAuthenticated } = useAuth();

  const normalizeStatus = useCallback((s) => {
    const up = String(s || '').toUpperCase();
    switch (up) {
      case 'PROCESSING': return 'processing';
      case 'PACKED': return 'packed';
      case 'SHIPPED': return 'shipped';
      case 'OUT_FOR_DELIVERY': return 'out_for_delivery';
      case 'DELIVERED': return 'delivered';
      case 'CANCELLED': return 'cancelled';
      default: return (s || '').toString().toLowerCase() || 'processing';
    }
  }, []);

  const normalizeOrder = useCallback((o) => {
    if (!o) return null;
    const items = Array.isArray(o.items) ? o.items.map(it => ({
      id: it.productId,
      title: it.productTitle,
      qty: Number(it.quantity || 0),
      price: Number(it.unitPrice || 0),
      selectedSize: it.selectedSize || null,
    })) : [];
    const steps = Array.isArray(o.tracking?.steps) ? o.tracking.steps.map(s => ({ key: s.key, label: s.label, time: s.time || null })) : [
      { key: 'processing', label: 'Processing', time: null },
      { key: 'packed', label: 'Packed', time: null },
      { key: 'shipped', label: 'Shipped', time: null },
      { key: 'out_for_delivery', label: 'Out for Delivery', time: null },
      { key: 'delivered', label: 'Delivered', time: null },
    ];
    const completedIdx = Array.isArray(o.tracking?.steps) ? o.tracking.steps.reduce((idx, s, i) => (s.completed ? i : idx), -1) : -1;
    const current = completedIdx >= 0 ? steps[completedIdx].key : normalizeStatus(o.status);
    const createdAt = o.createdAt ? String(o.createdAt) : '';
    const returnStatus = o.returnRequest?.status ? String(o.returnRequest.status).toUpperCase() : null;
    const returnEligible = Boolean(o.returnEligible);
    return {
      id: o.orderNumber || String(o.id),
  _rawId: o.id,
      date: createdAt ? createdAt.substring(0, 10) : new Date().toISOString().split('T')[0],
      status: normalizeStatus(o.status),
      total: Number(o.totalAmount || 0),
      items,
      tracking: { steps, current },
      returns: { status: returnStatus, eligible: returnEligible },
      payment: {
        method: String(o.paymentMethod || 'COD').toLowerCase(),
        provider: o.paymentProvider || null,
        status: (o.paymentStatus || 'PENDING').toString().toLowerCase(),
        senderNumber: o.senderNumber || null,
        transactionId: o.transactionId || null,
      },
      shipping: {
        name: o.shippingName || '',
        phone: o.shippingPhone || '',
        address: o.shippingAddress || '',
        city: o.shippingCity || '',
        postalCode: o.shippingPostalCode || '',
        notes: o.shippingNotes || '',
      },
      _raw: o,
    };
  }, [normalizeStatus]);

  // Load from backend if authenticated; otherwise try local cache once
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        if (isAuthenticated) {
          const res = await apiService.getUserOrders();
          const list = res?.data ?? res ?? [];
          const normalized = Array.isArray(list) ? list.map(normalizeOrder).filter(Boolean) : [];
          if (!cancelled) setOrders(normalized);
        } else {
          const raw = localStorage.getItem('kidora-orders');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (!cancelled && Array.isArray(parsed)) setOrders(parsed);
          }
        }
      } catch {
        // fallback to local cache
        try {
          const raw = localStorage.getItem('kidora-orders');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (!cancelled && Array.isArray(parsed)) setOrders(parsed);
          }
        } catch { /* ignore */ }
      }
    };
    load();
    return () => { cancelled = true; };
  }, [isAuthenticated, normalizeOrder]);

  // Persist to localStorage whenever orders change (lightweight cache)
  useEffect(() => {
    try {
      localStorage.setItem('kidora-orders', JSON.stringify(orders));
    } catch { /* ignore persist errors */ }
  }, [orders]);

  const advanceOrderStatus = useCallback((orderId) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const stepKeys = o.tracking.steps.map((s) => s.key);
        const currentIndex = stepKeys.indexOf(o.tracking.current);
        if (currentIndex < stepKeys.length - 1) {
          const nextKey = stepKeys[currentIndex + 1];
          const updatedSteps = o.tracking.steps.map((s) =>
            s.key === nextKey && !s.time
              ? { ...s, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }
              : s
          );
          return {
            ...o,
            status: nextKey === "delivered" ? "delivered" : o.status,
            tracking: { ...o.tracking, current: nextKey, steps: updatedSteps },
          };
        }
        return o;
      })
    );
  }, []);

  const addOrder = useCallback((order) => {
    setOrders((prev) => [order, ...prev]);
  }, []);

  const addBackendOrder = useCallback((orderResponse) => {
    const n = normalizeOrder(orderResponse);
    if (!n) return;
    setOrders((prev) => [n, ...prev]);
  }, [normalizeOrder]);

  const replaceOrder = useCallback((normalizedOrder) => {
    setOrders(prev => prev.map(o => (o._rawId === normalizedOrder._rawId || String(o.id) === String(normalizedOrder.id)) ? normalizedOrder : o));
  }, []);

  const updateOrderFromResponse = useCallback((orderResponse) => {
    const n = normalizeOrder(orderResponse);
    if (n) replaceOrder(n);
  }, [normalizeOrder, replaceOrder]);

  return (
  <OrderContext.Provider value={{ orders, advanceOrderStatus, addOrder, addBackendOrder, updateOrderFromResponse }}>
      {children}
    </OrderContext.Provider>
  );
};
