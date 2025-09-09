import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import api from '../../services/apiService';
import Badge from '../components/ui/Badge';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  useEffect(()=>{
    let cancelled = false;
    const load = async () => {
      setLoading(true); setError('');
      try {
        const d = await api.getDashboardOverview();
        if(!cancelled) setData(d);
      } catch(e){ if(!cancelled) setError(e?.message || 'Failed to load dashboard'); }
      if(!cancelled) setLoading(false);
    };
    load();
    return ()=> { cancelled = true; };
  },[]);

  const cards = [
    { label: 'Total Revenue', value: money(data?.totalRevenue), color: 'emerald' },
    { label: 'Total Orders', value: data?.totalOrders ?? '-', color: 'blue' },
    { label: 'Items Sold (7d)', value: data?.itemsSold7d ?? '-', color: 'indigo' },
    { label: 'Pending Returns', value: data?.returns?.pending ?? 0, color: 'amber' },
  ];

  return (
    <div className='space-y-8'>
      <div className='flex items-start justify-between'>
        <h2 className='text-xl font-semibold text-gray-900'>Dashboard</h2>
        {loading && <span className='text-xs text-gray-500 animate-pulse'>Loading...</span>}
      </div>
      {error && <div className='p-3 text-sm rounded-md bg-red-50 text-red-700 border border-red-200'>{error}</div>}
      <div className='grid gap-6 sm:grid-cols-2 xl:grid-cols-4'>
        {cards.map(c => (
          <MetricCard key={c.label} {...c} />
        ))}
      </div>
      <div className='grid gap-6 xl:grid-cols-3'>
        <Card className='xl:col-span-2'>
          <CardHeader><CardTitle>Revenue (Last 7 Days)</CardTitle></CardHeader>
          <CardContent>
            <TrendChart points={data?.revenueTrend || []} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Top Products</CardTitle></CardHeader>
          <CardContent>
            {(!data?.topProducts || data.topProducts.length===0) && <p className='text-sm text-gray-500'>No data</p>}
            <ul className='divide-y divide-gray-100 -mx-2'>
              {(data?.topProducts||[]).map(p => (
                <li key={p.productId} className='flex items-center justify-between py-2 px-2 text-sm'>
                  <span className='truncate max-w-[65%]' title={p.title}>{p.title}</span>
                  <Badge variant='outline'>{p.quantity}</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Returns Snapshot</CardTitle></CardHeader>
        <CardContent>
          <div className='flex gap-6 text-sm'>
            <div>
              <p className='text-gray-500 text-xs uppercase tracking-wide'>Pending</p>
              <p className='text-lg font-semibold'>{data?.returns?.pending ?? 0}</p>
            </div>
            <div>
              <p className='text-gray-500 text-xs uppercase tracking-wide'>Approved</p>
              <p className='text-lg font-semibold'>{data?.returns?.approved ?? 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function money(v){ if(v==null) return '-'; return 'Tk ' + Number(v).toFixed(2); }

function MetricCard({ label, value, color }) {
  return (
    <Card className='relative overflow-hidden'>
      <CardHeader><CardTitle>{label}</CardTitle></CardHeader>
      <CardContent>
        <p className='text-3xl font-bold tracking-tight text-gray-900'>{value}</p>
      </CardContent>
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 bg-${color}-500`} />
    </Card>
  );
}

function TrendChart({ points }) {
  if(!points || points.length===0) return <div className='h-40 flex items-center justify-center text-sm text-gray-400'>No data</div>;
  // Normalize amounts
  const vals = points.map(p => Number(p.amount || p.AMOUNT || 0));
  const max = Math.max(...vals, 1);
  const w = 500, h = 140, pad = 10;
  const step = vals.length>1 ? (w - pad*2)/(vals.length-1) : 0;
  const d = vals.map((v,i)=>`${i===0?'M':'L'} ${pad + i*step} ${h - pad - (v/max)*(h-pad*2)}`).join(' ');
  return (
    <div className='overflow-x-auto'>
      <svg width={w} height={h} className='max-w-full'>
        <path d={d} fill='none' stroke='#2563eb' strokeWidth='2' />
        {vals.map((v,i)=>{
          const x = pad + i*step; const y = h - pad - (v/max)*(h-pad*2);
          return <circle key={i} cx={x} cy={y} r={3} fill='#2563eb' />;
        })}
      </svg>
    </div>
  );
}
