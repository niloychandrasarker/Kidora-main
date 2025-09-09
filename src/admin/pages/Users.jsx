import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/apiService';
import { Card, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function Users() {
  const { isAdmin, isSubAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const res = await api.getAllUsers();
      const data = res?.data ?? res;
      setUsers(Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []));
    } catch (e) {
      setError(e?.message || 'Failed to load users');
    } finally { setLoading(false); }
  };

  useEffect(()=>{ load(); }, []);

  const filtered = users.filter(u => {
    const term = q.toLowerCase();
    return !term || [u.email, u.firstName, u.lastName, u.phone].some(v => String(v||'').toLowerCase().includes(term));
  });

  const changeRole = async (u, target) => {
    if (u.role === 'ADMIN') { alert('Primary ADMIN role cannot be changed here'); return; }
    try {
      const res = await api.makeRequest(`/admin/users/${u.id}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: target })
      });
      const data = res?.data ?? res;
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, role: data.role || target } : x));
    } catch (e) {
      alert(e?.message || 'Failed to change role');
    }
  };

  if (isSubAdmin && !isAdmin) {
    return <div className='p-6 rounded-md bg-yellow-50 border border-yellow-200 text-sm text-yellow-800'>You don't have permission to view or manage users.</div>;
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <h2 className='text-xl font-semibold text-gray-900'>Users</h2>
        <div className='flex gap-2 w-full sm:w-auto'>
          <Input placeholder='Search users...' value={q} onChange={e=>setQ(e.target.value)} className='w-full sm:w-64' />
          <Button variant='outline' onClick={load}>Refresh</Button>
        </div>
      </div>
      {loading && <div className='text-sm text-gray-500'>Loading users...</div>}
      {error && <div className='p-3 text-sm rounded-md bg-red-50 text-red-700 border border-red-200'>{error}</div>}
      <Card>
        <CardContent className='overflow-x-auto'>
          <table className='min-w-full text-sm'>
            <thead>
              <tr className='text-left text-gray-500 border-b'>
                <th className='py-2 pr-4 font-medium'>ID</th>
                <th className='py-2 pr-4 font-medium'>Email</th>
                <th className='py-2 pr-4 font-medium'>Name</th>
                <th className='py-2 pr-4 font-medium'>Phone</th>
                <th className='py-2 pr-4 font-medium'>Role</th>
                <th className='py-2 pr-4 font-medium'>Created</th>
                <th className='py-2 pr-4 font-medium'>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} className='border-b last:border-0'>
                  <td className='py-2 pr-4'>{u.id}</td>
                  <td className='py-2 pr-4 font-medium text-gray-900'>{u.email}</td>
                  <td className='py-2 pr-4'>{[u.firstName, u.lastName].filter(Boolean).join(' ')||'-'}</td>
                  <td className='py-2 pr-4'>{u.phone || '-'}</td>
                  <td className='py-2 pr-4'>{u.role}</td>
                  <td className='py-2 pr-4'>{String(u.createdAt||'').toString().slice(0,19).replace('T',' ')}</td>
                  <td className='py-2 pr-4'>
                    {u.role !== 'ADMIN' && (
                      u.role === 'SUB_ADMIN' ? (
                        <Button variant='outline' size='sm' onClick={()=>changeRole(u,'USER')}>Remove Sub-Admin</Button>
                      ) : (
                        <Button variant='outline' size='sm' onClick={()=>changeRole(u,'SUB_ADMIN')}>Make Sub-Admin</Button>
                      )
                    )}
                  </td>
                </tr>
              ))}
              {!loading && filtered.length===0 && (
                <tr><td colSpan={7} className='py-10 text-center text-gray-500'>No users</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
