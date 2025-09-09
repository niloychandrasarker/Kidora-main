import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { trackBeginCheckout, trackPurchase } from "../utils/analytics";
import { useOrders } from "../context/useOrders";
import apiService from "../services/apiService";
import { useAuth } from "../context/AuthContext";

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { addBackendOrder } = useOrders();
  const { isAuthenticated } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    notes: "",
  });
  const [paymentMethod, setPaymentMethod] = useState("cod"); // cod | online
  const [paymentProvider, setPaymentProvider] = useState(""); // bkash | nagad | rocket
  const [senderNumber, setSenderNumber] = useState("");
  const [transactionId, setTransactionId] = useState("");
  // Delivery area selection: inside Dhaka (100) or outside Dhaka (160)
  const [shippingArea, setShippingArea] = useState('inside'); // 'inside' | 'outside'

  const paymentAccounts = {
    bkash: { label: 'bKash', number: '01710000001', instructions: 'Send Money (Personal)' },
    nagad: { label: 'Nagad', number: '01810000002', instructions: 'Send Money (Personal)' },
    rocket: { label: 'Rocket', number: '01610000003', instructions: 'Send Money (Personal)' },
  };

  const shippingCost = shippingArea === 'inside' ? 100 : 160;
  const finalTotal = getCartTotal() + shippingCost;

  // Load user addresses when authenticated
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!isAuthenticated) return;
      try {
        const res = await apiService.getUserAddresses();
        const raw = res?.data ?? res;
        const list = Array.isArray(raw) ? raw : (raw?.content || []);
        if (cancelled) return;
        setAddresses(Array.isArray(list) ? list : []);
        if (Array.isArray(list) && list.length > 0) {
          const def = list.find(a => a.isDefault) || list[0];
          setSelectedAddressId(def.id);
          setUseNewAddress(false);
        } else {
          setUseNewAddress(true);
        }
      } catch {
        // ignore; fall back to entering new address
        setUseNewAddress(true);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  const selectedAddress = useMemo(() => {
    return addresses.find(a => a.id === selectedAddressId) || null;
  }, [addresses, selectedAddressId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert('Please sign in first to place your order.');
      navigate('/profile');
      return;
    }

    // Validation: if using a saved address, ensure one is selected; otherwise validate form fields
    if (!useNewAddress) {
      if (!selectedAddressId || !selectedAddress) {
        alert('Please select a delivery address.');
        return;
      }
    } else {
      if (!form.fullName || !form.phone || !form.address || !form.city) {
        alert('Please fill in all required fields.');
        return;
      }
    }
  const items = cartItems.map((it) => ({
      item_id: String(it.id),
      item_name: it.title,
      item_category: it.category,
      price: parseFloat(String(it.price).replace(/[৳$\s]/g, "")) || 0,
      quantity: it.quantity,
      item_variant: it.selectedSize,
    }));
    if (paymentMethod === 'online') {
      if (!paymentProvider) {
        alert('Please select a payment service (bKash, Nagad or Rocket).');
        return;
      }
      if (!senderNumber || senderNumber.trim().length < 11) {
        alert('Please enter the sender mobile number (11 digits).');
        return;
      }
      if (!transactionId.trim()) {
        alert('Please enter the transaction ID.');
        return;
      }
    }
  // Determine shipping details (existing address or new form)
    let shippingName = form.fullName;
    let shippingPhone = form.phone;
    let shippingAddress = form.address;
    let shippingCity = form.city;
    let shippingPostalCode = form.postalCode || '0000';
    let shippingNotes = form.notes || '';

    if (!useNewAddress && selectedAddress) {
      shippingName = selectedAddress.fullName;
      shippingPhone = selectedAddress.phone;
      shippingAddress = selectedAddress.apartment
        ? `${selectedAddress.streetAddress}, ${selectedAddress.apartment}`
        : selectedAddress.streetAddress;
      shippingCity = selectedAddress.city;
      shippingPostalCode = selectedAddress.postalCode || '0000';
    }

    // Override shipping city based on delivery area selection for backend calculation
    if (shippingArea === 'inside') {
      shippingCity = 'Dhaka';
    } else {
      // Ensure it doesn't match 'Dhaka' so backend applies outside rate
      if ((shippingCity || '').trim().toLowerCase() === 'dhaka') {
        shippingCity = 'Outside Dhaka';
      }
    }

    // If the user has no saved addresses, automatically save this one as default
    if (isAuthenticated && Array.isArray(addresses) && addresses.length === 0) {
      try {
        await apiService.createAddress({
          fullName: shippingName,
          phone: shippingPhone,
          streetAddress: shippingAddress,
          apartment: '',
          city: shippingCity,
          state: '',
          postalCode: shippingPostalCode,
          country: 'Bangladesh',
          isDefault: true,
        });
      } catch {
        // Non-blocking: even if save fails, continue with order
      }
    }

    // Build backend payload
    const payload = {
      items: cartItems.map((it) => ({
        productId: Number(it.id),
        quantity: Number(it.quantity),
        selectedSize: String(it.selectedSize || 'M'),
      })),
      paymentMethod: paymentMethod.toUpperCase(), // COD | ONLINE
      paymentProvider: paymentProvider ? paymentProvider : undefined,
      senderNumber: paymentMethod === 'online' ? senderNumber : undefined,
      transactionId: paymentMethod === 'online' ? transactionId : undefined,
      shippingName,
      shippingPhone,
      shippingAddress,
      shippingCity,
      shippingPostalCode,
      shippingNotes,
    };
    try {
      const res = await apiService.createOrder(payload);
      const data = res?.data ?? res;
      if (!data || !data.id) {
        throw new Error('Failed to place order');
      }
      // analytics
      trackPurchase(String(data.orderNumber || data.id), items, finalTotal);
  // hydrate orders list (prepend)
  addBackendOrder(data);
      clearCart();
      alert('Order placed successfully!');
      navigate('/orders');
    } catch (err) {
      alert(err?.message || 'Failed to place order');
    }
  };
  // Ensure begin_checkout tracked if user lands directly here
  useEffect(() => {
    if (cartItems.length > 0) {
      const items = cartItems.map((it) => ({
        item_id: String(it.id),
        item_name: it.title,
        item_category: it.category,
  price: parseFloat(String(it.price).replace(/[৳$\s]/g, "")) || 0,
        quantity: it.quantity,
        item_variant: it.selectedSize,
      }));
      trackBeginCheckout(items, finalTotal);
    }
  }, [cartItems, finalTotal]);

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Your cart is empty
          </h2>
          <button
            onClick={() => navigate("/")}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors duration-200 group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-200" />
              <span className="font-medium">Back</span>
            </button>
            <h1 className="ml-6 text-xl font-semibold text-gray-900">
              Checkout
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-4">
            {/* Delivery Address */}
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Delivery Address</h2>
                {addresses.length > 0 && (
                  <button type="button" onClick={() => setUseNewAddress(v => !v)} className="text-sm text-blue-600 hover:underline">
                    {useNewAddress ? 'Select saved address' : 'Use a new address'}
                  </button>
                )}
              </div>
              {isAuthenticated && addresses.length > 0 && !useNewAddress && (
                <div className="space-y-3">
                  {addresses.map(addr => (
                    <label key={addr.id} className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer ${selectedAddressId===addr.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input type="radio" name="address" checked={selectedAddressId===addr.id} onChange={() => setSelectedAddressId(addr.id)} className="mt-1" />
                      <div className="text-sm">
                        <p className="font-medium text-gray-900 flex items-center gap-2">{addr.fullName} <span className="text-gray-500">•</span> {addr.phone} {addr.isDefault && <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700">Default</span>}</p>
                        <p className="text-gray-700">{addr.streetAddress}{addr.apartment ? `, ${addr.apartment}` : ''}</p>
                        <p className="text-gray-500">{addr.city}{addr.postalCode ? ` ${addr.postalCode}` : ''}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {/* If no saved addresses or user chose to enter a new one, show form fields below */}
              {(addresses.length === 0 || useNewAddress) && (
                <p className="text-xs text-gray-500 -mb-2">{addresses.length === 0 ? 'No saved address found—this address will be saved as your default.' : 'Enter a new delivery address for this order.'}</p>
              )}
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {addresses.length > 0 && !useNewAddress ? 'Notes (optional)' : 'Shipping Address'}
              </h2>
              {/* Delivery Area Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer ${shippingArea==='inside' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" name="shippingArea" className="accent-blue-600" checked={shippingArea==='inside'} onChange={()=>setShippingArea('inside')} />
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">Inside Dhaka</p>
                    <p className="text-xs text-gray-600">Delivery charge ৳100</p>
                  </div>
                </label>
                <label className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer ${shippingArea==='outside' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" name="shippingArea" className="accent-blue-600" checked={shippingArea==='outside'} onChange={()=>setShippingArea('outside')} />
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">Outside Dhaka</p>
                    <p className="text-xs text-gray-600">Delivery charge ৳160</p>
                  </div>
                </label>
              </div>
              {(addresses.length === 0 || useNewAddress) ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Full Name*</label>
                    <input type="text" name="fullName" value={form.fullName} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter your full name" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Phone Number*</label>
                    <input type="tel" name="phone" value={form.phone} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="01xxxxxxxxx" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-700 mb-1">Address*</label>
                    <textarea name="address" value={form.address} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" rows={3} placeholder="House, road, area" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">City*</label>
                    <input type="text" name="city" value={form.city} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Dhaka" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Postal Code</label>
                    <input type="text" name="postalCode" value={form.postalCode} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="1207" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-700 mb-1">Notes (optional)</label>
                    <input type="text" name="notes" value={form.notes} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Any delivery instructions" />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  <label className="block text-sm text-gray-700">Delivery Notes (optional)</label>
                  <input type="text" name="notes" value={form.notes} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Any delivery instructions" />
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Payment Method</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <label className={`relative flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition ${paymentMethod==='cod' ? 'border-blue-500 ring-2 ring-blue-200 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" name="payment" value="cod" className="mt-1" checked={paymentMethod==='cod'} onChange={()=>setPaymentMethod('cod')} />
                  <div>
                    <p className="font-medium text-gray-900">Cash on Delivery</p>
                    <p className="text-xs text-gray-600">Pay with cash when the order arrives</p>
                  </div>
                  <span className="absolute top-2 right-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-600 text-white">Popular</span>
                </label>
                <label className={`relative flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition ${paymentMethod==='online' ? 'border-blue-500 ring-2 ring-blue-200 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" name="payment" value="online" className="mt-1" checked={paymentMethod==='online'} onChange={()=>setPaymentMethod('online')} />
                  <div>
                    <p className="font-medium text-gray-900">Online Payment</p>
                    <p className="text-xs text-gray-600">(Demo) Pretend to pay now</p>
                  </div>
                </label>
              </div>
              {paymentMethod === 'online' && (
                <div className="space-y-5">
                  <div className="p-4 rounded-lg bg-gradient-to-br from-indigo-50 to-blue-50 border border-blue-100 text-[13px] text-gray-700 leading-relaxed">
                    প্রথমে নিচের যেকোনো নম্বরে <span className="font-semibold">Send Money</span> করুন (Personal)। তারপর যে মোবাইল নম্বর থেকে টাকা পাঠিয়েছেন ও <span className="font-semibold">Transaction ID</span> নিচে লিখে অর্ডার কনফার্ম করুন। আমরা ভেরিফাই করে স্ট্যাটাস আপডেট করব।
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {Object.entries(paymentAccounts).map(([key, acc]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setPaymentProvider(key)}
                        className={`relative p-3 rounded-lg border text-left transition flex flex-col gap-1 ${paymentProvider===key ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
                      >
                        <span className="text-sm font-semibold text-gray-900">{acc.label}</span>
                        <span className="text-xs font-mono tracking-wide text-gray-600">{acc.number}</span>
                        <span className="text-[10px] uppercase text-gray-500">{acc.instructions}</span>
                        {paymentProvider===key && <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-blue-500" />}
                      </button>
                    ))}
                  </div>
                  {paymentProvider && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Sender Mobile Number</label>
                        <input
                          type="tel"
                          value={senderNumber}
                          onChange={(e)=>setSenderNumber(e.target.value.replace(/[^0-9]/g,'').slice(0,11))}
                          maxLength={11}
                          placeholder="01XXXXXXXXX"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Transaction ID</label>
                        <input
                          type="text"
                          value={transactionId}
                          onChange={(e)=>setTransactionId(e.target.value.trim())}
                          placeholder="e.g. 7HG5KLMN"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm uppercase"
                        />
                      </div>
                      <div className="sm:col-span-2 text-[11px] text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                        নির্বাচিত নম্বর: <span className="font-medium text-gray-900">{paymentAccounts[paymentProvider].label} {paymentAccounts[paymentProvider].number}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => navigate("/cart")}
                className="flex-1 border border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-50"
              >
                Back to Cart
              </button>
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700"
              >
                {paymentMethod === 'cod' ? 'Place Order (COD)' : 'Pay & Place Order'}
              </button>
            </div>
          </form>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Order Summary
              </h2>

              <div className="space-y-4">
                <div className="space-y-3 max-h-64 overflow-auto pr-1">
                  {cartItems.map((item) => (
                    <div key={`${item.id}-${item.selectedSize}`} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img src={item.image} alt={item.title} className="w-12 h-12 rounded object-cover" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 line-clamp-1">{item.title}</p>
                          <p className="text-xs text-gray-600">Size: {item.selectedSize} × {item.quantity}</p>
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-gray-900">
                        ৳{(
                          parseFloat(String(item.price).replace(/[৳$\s]/g, "")) * item.quantity
                        ).toFixed(0)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between text-gray-600 pt-2">
                  <span>Subtotal</span>
                  <span>৳{getCartTotal()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>{shippingCost === 0 ? "Free" : `৳${shippingCost}`}</span>
                </div>
                <div className="border-t pt-3 space-y-1">
                  <div className="flex justify-between text-lg font-semibold text-gray-900">
                    <span>Total</span>
                    <span>৳{finalTotal}</span>
                  </div>
                  <p className="text-[11px] text-gray-500">By placing your order you agree to our Terms & Refund Policy.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;


