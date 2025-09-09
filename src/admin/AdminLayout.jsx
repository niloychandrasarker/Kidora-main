import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import Button from './components/ui/Button';
import Input from './components/ui/Input';
import { useState } from 'react';
import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

const baseNavItems = [
  { to: '/admin', label: 'Dashboard' },
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/hero', label: 'Hero Section' },
  { to: '/admin/orders', label: 'Orders' },
  { to: '/admin/returns', label: 'Returns' },
  { to: '/admin/users', label: 'Users', adminOnly: true },
];

export default function AdminLayout() {
  const { user, isLoading, isAdmin, isSubAdmin, isAdminOrSub, sendOtp, verifyOtp, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [email, setEmail] = useState('niloysarker.cs@gmail.com');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const navigate = useNavigate();
  const sidebarRef = useRef(null);

  // Close on ESC key
  const handleKey = useCallback((e)=>{
    if(e.key==='Escape') setSidebarOpen(false);
  },[]);
  useEffect(()=>{
    document.addEventListener('keydown', handleKey);
    return ()=>document.removeEventListener('keydown', handleKey);
  },[handleKey]);

  // Body scroll lock for mobile drawer
  useEffect(()=>{
    if(typeof document==='undefined') return;
    if(sidebarOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow='hidden';
      return ()=>{ document.body.style.overflow=prev; };
    }
  },[sidebarOpen]);

  // Click outside to close (mobile)
  useEffect(()=>{
    if(!sidebarOpen) return;
    const handler = (e)=>{
      if(sidebarRef.current && !sidebarRef.current.contains(e.target)){
        setSidebarOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return ()=>document.removeEventListener('mousedown', handler);
  },[sidebarOpen]);
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAdminOrSub) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white w-full max-w-md rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <h1 className="text-xl font-semibold text-gray-900">Admin Login</h1>
          <p className="text-sm text-gray-600">Enter admin or sub-admin email to receive OTP and verify.</p>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Email</label>
              <Input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@example.com" />
            </div>
            {!otpSent ? (
              <Button onClick={async ()=>{ const res = await sendOtp(email); if(res?.success) setOtpSent(true); else alert(res?.message||'Failed to send OTP'); }}>Send OTP</Button>
            ) : (
              <>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">OTP</label>
                  <Input value={otp} onChange={e=>setOtp(e.target.value)} placeholder="Enter OTP" />
                </div>
                <Button onClick={async ()=>{ const res = await verifyOtp(email, otp); if(!res?.success) alert(res?.message||'OTP verify failed'); }}>Verify & Continue</Button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  const navItems = baseNavItems.filter(item => !(item.adminOnly && !isAdmin));

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={`fixed inset-y-0 left-0 z-40 w-60 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full lg:translate-x-0'}`}
        role="dialog"
        aria-label="Admin navigation"
        aria-modal={sidebarOpen}
      >
        <div className="h-16 flex items-center px-5 border-b border-gray-100">
          <span className="font-extrabold text-xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent select-none">Kidora Admin</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin'}
              className={({ isActive }) => `block px-3 py-2.5 rounded-lg text-sm font-medium transition ${isActive ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
              onClick={()=>setSidebarOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <Button variant="outline" className="w-full" onClick={()=>navigate('/')}>Return to Store</Button>
        </div>
      </div>
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden" onClick={()=>setSidebarOpen(false)} aria-hidden="true" />
      )}
      {/* Main */}
      <div className="flex-1 flex flex-col lg:pl-60">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 shadow-sm sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2 rounded-md border border-gray-200 hover:bg-gray-50" onClick={()=>setSidebarOpen(o=>!o)}>
              <span className="sr-only">Toggle Menu</span>
              <div className="w-5 h-0.5 bg-gray-600 mb-1" />
              <div className="w-5 h-0.5 bg-gray-600 mb-1" />
              <div className="w-5 h-0.5 bg-gray-600" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900 hidden sm:block">{isSubAdmin && !isAdmin ? 'Sub Admin Panel' : 'Admin Dashboard'}</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden xs:block text-right">
              <p className="font-semibold text-gray-900 leading-tight text-sm">{user?.email || 'Admin'}</p>
              <p className="text-[10px] sm:text-xs text-gray-500">{user?.role || 'ADMIN'}</p>
            </div>
            <Button variant="outline" className="hidden sm:inline-flex" onClick={logout}>Logout</Button>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-10 space-y-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
