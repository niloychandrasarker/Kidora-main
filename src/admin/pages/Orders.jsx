import { useEffect, useState, useCallback } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import apiService from '../../services/apiService';

const statusFlow = ['processing','packed','shipped','out_for_delivery','delivered'];
const cancellableStatuses = new Set(['processing','packed','shipped']);

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [sortKey, setSortKey] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  // Load admin orders from backend
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await apiService.getAdminOrders(page, 50);
        const data = res?.data ?? res;
        // support multiple shapes: {orders: []} | {content: []} | []
        const list = Array.isArray(data?.orders)
          ? data.orders
          : Array.isArray(data?.content)
          ? data.content
          : Array.isArray(data)
          ? data
          : [];
        const mapped = list.map(mapOrderResponseToRow);
        if (!cancelled) {
          setOrders(mapped);
          setHasNext(Boolean((res?.data ?? res)?.hasNext ?? data?.hasNext));
          setHasPrevious(Boolean((res?.data ?? res)?.hasPrevious ?? data?.hasPrevious));
        }
      } catch (e) {
        console.error('Failed to load admin orders', e);
        if (!cancelled) setError(e?.message || 'Failed to load orders');
      }
      if (!cancelled) setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [page]);

  const combined = orders;

  const applySort = (list) => {
    const sorted = [...list];
    sorted.sort((a,b)=>{
      if(sortKey==='total') return sortDir==='asc'? a.total - b.total : b.total - a.total;
      if(sortKey==='status') return sortDir==='asc'? a.status.localeCompare(b.status): b.status.localeCompare(a.status);
      return sortDir==='asc'? a.id.localeCompare(b.id): b.id.localeCompare(a.id); // id fallback
    });
    return sorted;
  };

  const filtered = applySort(combined.filter(o => (
    ((String(o.id).toLowerCase().includes(query.toLowerCase()) || String(o.orderNumber||'').toLowerCase().includes(query.toLowerCase()) || o.customer.toLowerCase().includes(query.toLowerCase()))) &&
    (!statusFilter || o.status===statusFilter) &&
    (!methodFilter || o.method===methodFilter)
  )));

  const nextStatus = async (o) => {
    const idx = statusFlow.indexOf(o.status);
    if(idx < 0 || idx >= statusFlow.length -1) return;
    const updated = statusFlow[idx+1];
    try {
  const data = await apiService.updateAdminOrderStatus(o.rawId, updated.toUpperCase());
  const mapped = mapOrderResponseToRow(data);
      setOrders(prev => prev.map(ord => ord.rawId===mapped.rawId ? mapped : ord));
      setSelected(s => s && s.rawId===mapped.rawId ? mapped : s);
    } catch (e) {
      console.error('Failed to update status', e);
    }
  };

  const prevStatus = async (o) => {
    const idx = statusFlow.indexOf(o.status);
    if(idx <= 0) return; // can't go before first
    const updated = statusFlow[idx-1];
    try {
      const data = await apiService.updateAdminOrderStatus(o.rawId, updated.toUpperCase());
      const mapped = mapOrderResponseToRow(data);
      setOrders(prev => prev.map(ord => ord.rawId===mapped.rawId ? mapped : ord));
      setSelected(s => s && s.rawId===mapped.rawId ? mapped : s);
    } catch(e){ console.error('Failed to revert status', e); }
  };

  const cancelOrder = async (o) => {
    if(!cancellableStatuses.has(o.status)) return; // guard
    if(!window.confirm('Cancel this order?')) return;
    try {
      const data = await apiService.updateAdminOrderStatus(o.rawId, 'CANCELLED');
      const mapped = mapOrderResponseToRow(data);
      setOrders(prev => prev.map(ord => ord.rawId===mapped.rawId ? mapped : ord));
      setSelected(s => s && s.rawId===mapped.rawId ? mapped : s);
    } catch(e){ console.error('Failed to cancel order', e); }
  };

  const statusBadge = (s) => {
    if(s==='processing') return <Badge variant='info'>Processing</Badge>;
    if(s==='packed') return <Badge variant='default'>Packed</Badge>;
    if(s==='shipped') return <Badge variant='default'>Shipped</Badge>;
    if(s==='out_for_delivery') return <Badge variant='default'>Out for Delivery</Badge>;
    if(s==='delivered') return <Badge variant='success'>Delivered</Badge>;
    if(s==='cancelled') return <Badge variant='destructive'>Cancelled</Badge>;
    return s;
  };

  function mapOrderResponseToRow(order) {
    // Accept either wrapper { data } or raw
  const o = order?.id ? order : (order?.data || {});
  const total = Number(o.totalAmount ?? 0);
  const shipping = Number(o.shippingCost || 0);
  const subtotal = Number(o.subtotal || (Array.isArray(o.items)? o.items : (Array.isArray(o.orderItems)? o.orderItems : [])).reduce((s,it)=> s + (Number(it.unitPrice||it.price||0) * Number(it.quantity||it.qty||0)),0));
  const method = String(o.paymentMethod || 'COD').toLowerCase();
  const status = String(o.status || 'PROCESSING').toLowerCase();
  const srcItems = Array.isArray(o.items) ? o.items : Array.isArray(o.orderItems) ? o.orderItems : [];
  const items = srcItems.map(it => ({ id: it.productId || it.id, title: it.productTitle || it.title, qty: it.quantity, price: Number(it.unitPrice || it.price || 0), selectedSize: it.selectedSize || null }));
    return {
      rawId: o.id,
      id: o.orderNumber || String(o.id),
      orderNumber: o.orderNumber,
      customer: o.shippingName || 'Customer',
      phone: o.shippingPhone || '',
      address: o.shippingAddress || '',
      total,
      shipping,
      subtotal,
      method,
      senderNumber: o.senderNumber || null,
      transactionId: o.transactionId || null,
      status,
      items,
    };
  }

  // Generate a simple invoice PDF for selected order
  const handlePrint = useCallback(async () => {
    if (!selected) return;
    try {
      const doc = new jsPDF();
      const ord = selected;
      const marginLeft = 14;
  const money = (v)=> `Tk ${Number(v||0).toFixed(2)}`;
      // Add logo (top-right)
      try {
        const logoUrl = '/Kidora-logo.png';
        const resp = await fetch(logoUrl);
        const blob = await resp.blob();
        const b64 = await new Promise(res => { const fr = new FileReader(); fr.onload = ()=>res(fr.result); fr.readAsDataURL(blob); });
        doc.addImage(b64, 'PNG', 150, 8, 40, 15);
      } catch { /* ignore logo errors */ }

      // Header
      doc.setFontSize(18);
      doc.text('Invoice', marginLeft, 16);
      doc.setFontSize(10);
      doc.text(`Order: ${ord.id}`, marginLeft, 24);
      doc.text(`Date: ${new Date().toLocaleString()}`, marginLeft, 30);
      // Customer
      doc.setFontSize(11); doc.text('Customer Information', marginLeft, 40);
      doc.setFontSize(9);
      const custLines = [
        `Name: ${ord.customer}`,
        `Phone: ${ord.phone || '-'}`,
        `Address: ${ord.address || '-'}`
      ];
      custLines.forEach((l,i)=> doc.text(l, marginLeft, 46 + (i*5)));
      // Items table
      const body = (ord.items||[]).map(it => {
        const qty = Number(it.qty || it.quantity || 0);
        const unit = Number(it.price || it.unitPrice || 0);
        return [
          it.title || it.productTitle || '-',
          it.selectedSize || '-',
          String(qty),
          money(unit),
          money(unit * qty)
        ];
      });
      doc.autoTable({
        startY: 66,
        head: [['Product','Size','Qty','Price','Subtotal']],
        body,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [37,99,235] }
      });
      let y = doc.lastAutoTable ? doc.lastAutoTable.finalY + 6 : 74;
      const calcSubtotal = ord.subtotal ?? (ord.items||[]).reduce((s,it)=> s + (Number(it.price||it.unitPrice||0) * Number(it.qty||it.quantity||0)),0);
      const delivery = Number(ord.shipping||0);
      const grand = Number(ord.total || (calcSubtotal + delivery));

      // Summary table (plain theme for alignment)
      doc.autoTable({
        startY: y,
        theme: 'plain',
        styles: { fontSize: 10, cellPadding: { top:2, bottom:2, left:2, right:2 } },
        columnStyles: { 0: { halign: 'right', fontStyle: 'bold' }, 1: { halign: 'right' } },
        body: [
          ['Subtotal', money(calcSubtotal)],
          ['Delivery', money(delivery)],
          [{ content: 'Total', styles: { fontSize: 11 } }, { content: money(grand), styles: { fontSize: 11, fontStyle: 'bold' } }]
        ]
      });
      y = doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : y + 22;
      doc.setFontSize(9);
      doc.text(`Payment: ${ord.method === 'online' ? 'Online' : 'Cash on Delivery'}`, marginLeft, y); y+=5;
      if (ord.method === 'online') {
        doc.text(`Sender: ${ord.senderNumber || '-'}`, marginLeft, y); y+=5; doc.text(`Txn ID: ${ord.transactionId || '-'}`, marginLeft, y); y+=5;
      }
      doc.setFontSize(8);
      doc.text('Thank you for shopping with Kidora!', marginLeft, 285);
      doc.save(`invoice-${ord.id}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF', err);
      alert('PDF generation failed');
    }
  }, [selected]);

  return (
    <div className='space-y-8'>
      <div className='flex items-center justify-between'>
        <h2 className='text-xl font-semibold text-gray-900'>Orders</h2>
        <div className='flex gap-2'>
          <Button variant='outline' onClick={()=>setPage(p=>p)}>Refresh</Button>
        </div>
      </div>
      {loading && <div className='text-sm text-gray-500'>Loading orders...</div>}
      {error && <div className='p-3 text-sm rounded-md bg-red-50 text-red-700 border border-red-200'>{error}</div>}
      <div className='space-y-4'>
        <div className='flex flex-col lg:flex-row lg:items-center justify-between gap-4'>
          <h2 className='text-xl font-semibold text-gray-900'>Orders</h2>
          <div className='flex flex-col sm:flex-row gap-3 w-full lg:w-auto'>
            <Input placeholder='Search orders...' value={query} onChange={e=>setQuery(e.target.value)} className='sm:w-60' />
            <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className='border border-gray-300 rounded-md px-2 py-2 text-sm'>
              <option value=''>All Status</option>
              {statusFlow.map(s=> <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={methodFilter} onChange={e=>setMethodFilter(e.target.value)} className='border border-gray-300 rounded-md px-2 py-2 text-sm'>
              <option value=''>All Methods</option>
              <option value='cod'>COD</option>
              <option value='online'>Online</option>
            </select>
            <div className='flex gap-2'>
              <select value={sortKey} onChange={e=>setSortKey(e.target.value)} className='border border-gray-300 rounded-md px-2 py-2 text-sm'>
                <option value='date'>ID</option>
                <option value='total'>Total</option>
                <option value='status'>Status</option>
              </select>
              <button onClick={()=>setSortDir(d=>d==='asc'?'desc':'asc')} className='border border-gray-300 rounded-md px-3 py-2 text-sm hover:bg-gray-50'>{sortDir==='asc'?'↑':'↓'}</button>
            </div>
            {(statusFilter||methodFilter||query) && (
              <button onClick={()=>{setQuery('');setStatusFilter('');setMethodFilter('');}} className='text-xs text-blue-600 underline'>Reset</button>
            )}
          </div>
        </div>
        <div className='text-xs text-gray-500 flex flex-wrap gap-4'>
          <span>Total Orders: {combined.length}</span>
          <span>Showing: {filtered.length}</span>
          <div className='ml-auto flex gap-2'>
            <Button variant='outline' onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={!hasPrevious}>Prev</Button>
            <Button variant='outline' onClick={()=>setPage(p=>p+1)} disabled={!hasNext}>Next</Button>
          </div>
        </div>
      </div>
      <Card>
        <CardContent className='overflow-x-auto'>
          <table className='min-w-full text-sm'>
            <thead>
              <tr className='text-left text-gray-500 border-b'>
                <th className='py-2 pr-4 font-medium'>Order</th>
                <th className='py-2 pr-4 font-medium'>Customer</th>
                <th className='py-2 pr-4 font-medium'>Address</th>
                <th className='py-2 pr-4 font-medium'>Items</th>
                <th className='py-2 pr-4 font-medium'>Total</th>
                <th className='py-2 pr-4 font-medium'>Method</th>
                <th className='py-2 pr-4 font-medium'>Status</th>
                <th className='py-2 pr-4 font-medium'>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.id} className='border-b last:border-0 hover:bg-gray-50'>
                  <td className='py-2 pr-4 font-medium text-gray-900'>{o.id}</td>
                  <td className='py-2 pr-4'>{o.customer}</td>
                  <td className='py-2 pr-4'>{o.address}</td>
                  <td className='py-2 pr-4'>{o.items ? o.items.reduce((a,c)=>a+Number(c.qty||0),0) : 0}</td>
                  <td className='py-2 pr-4'>৳ {o.total}</td>
                  <td className='py-2 pr-4'>{o.method === 'online' ? <Badge variant='info'>Online</Badge> : <Badge>Cash</Badge>}</td>
                  <td className='py-2 pr-4'>{statusBadge(o.status)}</td>
                  <td className='py-2 pr-4 flex flex-wrap gap-2'>
                    <Button variant='outline' onClick={()=>setSelected(o)}>View</Button>
                    {statusFlow.indexOf(o.status) > 0 && o.status !== 'delivered' && o.status !== 'cancelled' && (
                      <Button variant='outline' onClick={()=>prevStatus(o)}>Previous</Button>
                    )}
                    {o.status !== 'delivered' && o.status !== 'cancelled' && (
                      <Button variant='default' onClick={()=>nextStatus(o)}>Next</Button>
                    )}
                    {cancellableStatuses.has(o.status) && (
                      <Button variant='destructive' onClick={()=>cancelOrder(o)}>Cancel</Button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length===0 && (
                <tr><td colSpan={8} className='py-10 text-center text-gray-500'>No orders</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
      <Modal open={!!selected} onClose={()=>setSelected(null)} title={selected? `Order ${selected.id}`:''} actions={selected && <>
        <Button variant='outline' onClick={handlePrint}>Print</Button>
        <Button variant='outline' onClick={()=>setSelected(null)}>Close</Button>
        {selected.status !== 'delivered' && selected.status !== 'cancelled' && (
          <>
            {statusFlow.indexOf(selected.status) > 0 && (
              <Button variant='outline' onClick={()=>prevStatus(selected)}>Previous</Button>
            )}
            <Button onClick={()=>nextStatus(selected)}>Next</Button>
            {cancellableStatuses.has(selected.status) && (
              <Button variant='destructive' onClick={()=>cancelOrder(selected)}>Cancel</Button>
            )}
          </>
        )}
      </>}>
        {selected && (
          <div className='space-y-5'>
            <div className='grid sm:grid-cols-2 gap-4 text-sm'>
              <div>
                <p className='text-gray-500 text-xs uppercase tracking-wide'>Customer</p>
                <p className='font-medium text-gray-900'>{selected.customer}</p>
              </div>
              <div>
                <p className='text-gray-500 text-xs uppercase tracking-wide'>Phone</p>
                <p className='font-medium text-gray-900'>{selected.phone}</p>
              </div>
              <div className='sm:col-span-2'>
                <p className='text-gray-500 text-xs uppercase tracking-wide'>Address</p>
                <p className='font-medium text-gray-900'>{selected.address}</p>
              </div>
            </div>
            <div className='text-sm'>
              <p className='text-gray-500 text-xs uppercase tracking-wide mb-2'>Items</p>
              {selected.items && selected.items.length>0 ? (
                <div className='border rounded-lg overflow-hidden'>
                  <table className='min-w-full text-xs'>
                    <thead className='bg-gray-50 text-gray-600'>
                      <tr>
                        <th className='text-left px-3 py-2 font-medium'>Product</th>
                        <th className='text-left px-3 py-2 font-medium'>Size</th>
                        <th className='text-left px-3 py-2 font-medium'>Qty</th>
                        <th className='text-left px-3 py-2 font-medium'>Price</th>
                        <th className='text-left px-3 py-2 font-medium'>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                              {selected.items.map(it => {
                        const qty = Number(it.qty || it.quantity || 0);
                        const price = Number(it.price || it.unitPrice || 0);
                        return (
                                  <tr key={`${it.id}-${it.title}-${it.selectedSize || ''}`} className='border-t'>
                            <td className='px-3 py-2 font-medium text-gray-900'>{it.title || it.productTitle}</td>
                                    <td className='px-3 py-2'>{it.selectedSize || '-'}</td>
                            <td className='px-3 py-2'>{qty}</td>
                            <td className='px-3 py-2'>৳ {price}</td>
                            <td className='px-3 py-2 font-semibold'>৳ {price * qty}</td>
                          </tr>
                        );
                      })}
                      {/* Summary */}
                      <tr className='bg-gray-50 border-t'>
                        <td colSpan={4} className='px-3 py-2 text-right font-medium'>Subtotal</td>
                        <td className='px-3 py-2 font-semibold'>৳ {(Number.isFinite(selected.subtotal) && selected.subtotal>0) ? selected.subtotal : (selected.items || []).reduce((s,it)=> s + (Number(it.price||it.unitPrice||0) * Number(it.qty||it.quantity||0)), 0)}</td>
                      </tr>
                      <tr className='bg-gray-50'>
                        <td colSpan={4} className='px-3 py-2 text-right font-medium'>Delivery</td>
                        <td className='px-3 py-2 font-semibold'>৳ {Number(selected.shipping || 0)}</td>
                      </tr>
                      <tr className='bg-gray-100'>
                        <td colSpan={4} className='px-3 py-2 text-right font-bold text-gray-900'>Total</td>
                        <td className='px-3 py-2 font-bold text-gray-900'>৳ {selected.total}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : <p className='text-gray-500 italic'>No items found</p>}
            </div>
            <div className='text-sm'>
              <p className='text-gray-500 text-xs uppercase tracking-wide mb-1'>Payment</p>
              {selected.method === 'online' ? (
                <div className='space-y-1'>
                  <p><span className='font-medium'>Method:</span> Online</p>
                  <p><span className='font-medium'>Sender:</span> {selected.senderNumber}</p>
                  <p><span className='font-medium'>Transaction ID:</span> {selected.transactionId}</p>
                </div>
              ) : <p>Cash on Delivery</p>}
            </div>
            <div>
              <p className='text-gray-500 text-xs uppercase tracking-wide mb-1'>Status</p>
              {statusBadge(selected.status)}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
