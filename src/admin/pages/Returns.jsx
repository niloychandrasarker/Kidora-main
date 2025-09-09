import { useEffect, useState } from 'react';
import api from '../../services/apiService';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';

export default function Returns() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getReturnRequests();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to load return requests', e);
      setError(e?.message || 'Failed to load return requests');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const setStatus = async (id, status) => {
    try {
  const updated = await api.updateReturnStatus(id, status);
  // Optimistic local update
  setItems(prev => prev.map(r => r.id === id ? { ...r, status: updated?.status || status, completedAt: updated?.completedAt || r.completedAt } : r));
  // Also refresh in background to ensure consistency
  load();
  alert('Return status updated');
    } catch (e) { console.error('Failed to update return status', e); }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Return Requests</h2>
        <Button variant="outline" onClick={load}>Refresh</Button>
      </div>
      {error && (
        <div className="p-3 text-sm rounded-md bg-red-50 text-red-700 border border-red-200">{error}</div>
      )}
      <Card>
        <CardContent className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-2 pr-4">ID</th>
                <th className="py-2 pr-4">Order</th>
                <th className="py-2 pr-4">User</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Reason</th>
                <th className="py-2 pr-4">Photos</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(r => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="py-2 pr-4">{r.id}</td>
                  <td className="py-2 pr-4">{r.orderNumber} (#{r.orderId})</td>
                  <td className="py-2 pr-4">{r.userEmail}</td>
                  <td className="py-2 pr-4">{r.status === 'COMPLETED' ? 'RETURN SUCCESSFUL' : r.status}</td>
                  <td className="py-2 pr-4 max-w-xs truncate" title={r.reason}>{r.reason}</td>
                  <td className="py-2 pr-4">
                    {/* photos not included in list payload, available in order details */}
                    —
                  </td>
                  <td className="py-2 pr-4 flex gap-2">
                    <Button variant="outline" onClick={()=>setSelected(r)}>View</Button>
                    {r.status === 'PENDING' && (
                      <>
                        <Button onClick={()=>setStatus(r.id, 'APPROVED')}>Approve</Button>
                        <Button variant="destructive" onClick={()=>setStatus(r.id, 'REJECTED')}>Reject</Button>
                      </>
                    )}
                    {r.status === 'APPROVED' && (
                      <Button onClick={()=>setStatus(r.id, 'COMPLETED')}>Mark Return Successful</Button>
                    )}
                  </td>
                </tr>
              ))}
              {items.length===0 && (
                <tr><td colSpan={7} className="py-10 text-center text-gray-500">No return requests</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Return #{selected.id}</h3>
              <Button variant="outline" onClick={()=>setSelected(null)}>Close</Button>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500 text-xs">Order</p>
                <p className="font-medium">{selected.orderNumber} (#{selected.orderId})</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">User</p>
                <p className="font-medium">{selected.userEmail}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Ordered</p>
                <p className="font-medium">{String(selected.orderCreatedAt||'').toString().slice(0,19).replace('T',' ')}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Delivered</p>
                <p className="font-medium">{selected.deliveredAt ? String(selected.deliveredAt).toString().slice(0,19).replace('T',' ') : '-'}</p>
              </div>
            </div>
            <div className="text-sm">
              <p className="text-gray-500 text-xs mb-1">Reason</p>
              <p className="font-medium">[{selected.reasonCategory || 'N/A'}] {selected.reason}</p>
            </div>
            <div className="text-sm grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p className="text-gray-500 text-xs">Contact Email</p>
                <p className="font-medium">{selected.contactEmail || '-'}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Contact Phone</p>
                <p className="font-medium">{selected.contactPhone || '-'}</p>
              </div>
            </div>
            {Array.isArray(selected.photos) && selected.photos.length>0 && (
              <div>
                <p className="text-gray-500 text-xs mb-2">Photos</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {selected.photos.map((src, i) => (
                    <a href={src} target="_blank" rel="noreferrer" key={i} className="block"><img src={src} alt="photo" className="w-full h-24 object-cover rounded-md border" /></a>
                  ))}
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2">
              {selected.status === 'PENDING' && <Button onClick={()=>{ setStatus(selected.id,'APPROVED'); setSelected(null); }}>Approve</Button>}
              {selected.status === 'PENDING' && <Button variant="destructive" onClick={()=>{ setStatus(selected.id,'REJECTED'); setSelected(null); }}>Reject</Button>}
              {selected.status === 'APPROVED' && <Button onClick={()=>{ setStatus(selected.id,'COMPLETED'); setSelected(null); }}>Mark Return Successful</Button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
