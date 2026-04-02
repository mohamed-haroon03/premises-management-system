import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import OwnerDashboard from './pages/OwnerDashboard';
import Properties from './pages/Properties';
import PropertyDetails from './pages/PropertyDetails';
import Tenants from './pages/Tenants';
import Leases from './pages/Leases';
import Rents from './pages/Rents';
import Payments from './pages/Payments';
import TenantDashboard from './pages/tenant/TenantDashboard';
import TenantPayments from './pages/tenant/TenantPayments';
import { LayoutDashboard, Building2, Users, Receipt, FileText, Home, AlertCircle } from 'lucide-react';
import NotificationDropdown from './components/NotificationDropdown';
import Notifications from './pages/Notifications';
import { Toaster } from 'react-hot-toast';

// Placeholder for the main dashboard interface
const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const ownerNavItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Properties', path: '/properties', icon: <Building2 size={20} /> },
    { name: 'Tenants', path: '/tenants', icon: <Users size={20} /> },
    { name: 'Leases', path: '/leases', icon: <FileText size={20} /> },
    { name: 'Monthly Rents', path: '/rents', icon: <FileText size={20} /> },
    { name: 'Payments', path: '/payments', icon: <Receipt size={20} /> }
  ];

  const tenantNavItems = [
    { name: 'Home', path: '/tenant-dashboard', icon: <Home size={20} /> },
    { name: 'Payments', path: '/tenant-payments', icon: <Receipt size={20} /> }
  ];

  const navItems = user?.role === 'Tenant' ? tenantNavItems : ownerNavItems;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Basic Sidebar */}
      <aside className="w-64 bg-indigo-900 text-white min-h-screen flex flex-col shadow-xl z-20">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center transform -rotate-3">
              <Building2 className="text-white h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-wider">PMS</h2>
              <p className="text-indigo-300 text-xs mt-0.5 uppercase tracking-widest font-semibold">{user?.role} Portal</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-4 mt-6 space-y-1.5 overflow-y-auto pb-4">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl cursor-pointer font-medium transition-all ${isActive ? 'bg-indigo-800 shadow-inner border border-indigo-700/50 text-white' : 'hover:bg-indigo-800/50 text-indigo-100 hover:text-white border border-transparent'}`}
              >
                <div className={`${isActive ? 'text-indigo-300' : 'text-indigo-400 opacity-80'}`}>{item.icon}</div>
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 mt-auto border-t border-indigo-800/50">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="h-10 w-10 bg-indigo-800 rounded-full flex items-center justify-center font-bold text-sm shadow-inner border border-indigo-700/30">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold truncate">{user?.name || 'Guest'}</p>
              <p className="text-xs text-indigo-300 truncate">{user?.email || 'guest@example.com'}</p>
            </div>
          </div>
          <button onClick={logout} className="w-full py-2.5 bg-indigo-800/50 hover:bg-rose-500 text-indigo-100 hover:text-white rounded-xl transition-all font-medium border border-indigo-700/30 hover:border-transparent flex items-center justify-center gap-2">
            Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white/80 backdrop-blur-md shadow-sm h-16 flex items-center px-8 justify-between border-b border-gray-100 z-10 shrink-0 sticky top-0">
          <h1 className="text-lg font-bold text-gray-800">Hello, {user?.name || 'User'} 👋</h1>

          <div className="flex items-center gap-4">
            <NotificationDropdown />
          </div>
        </header>
        <div className="p-8 flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <DashboardLayout>{children}</DashboardLayout> : <Navigate to="/login" replace />;
};

// Root Redirect Component
const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'Tenant' ? "/tenant-dashboard" : "/dashboard"} replace />;
};

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={<RootRedirect />} />

          <Route path="/dashboard" element={
            <ProtectedRoute>
              <OwnerDashboard />
            </ProtectedRoute>
          } />

          <Route path="/properties" element={
            <ProtectedRoute>
              <Properties />
            </ProtectedRoute>
          } />

          <Route path="/properties/:id" element={
            <ProtectedRoute>
              <PropertyDetails />
            </ProtectedRoute>
          } />

          <Route path="/notifications" element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          } />

          <Route path="/tenants" element={
            <ProtectedRoute>
              <Tenants />
            </ProtectedRoute>
          } />

          <Route path="/leases" element={
            <ProtectedRoute>
              <Leases />
            </ProtectedRoute>
          } />

          <Route path="/rents" element={
            <ProtectedRoute>
              <Rents />
            </ProtectedRoute>
          } />

          <Route path="/payments" element={
            <ProtectedRoute>
              <Payments />
            </ProtectedRoute>
          } />

          <Route path="/payments" element={
            <ProtectedRoute>
              <Payments />
            </ProtectedRoute>
          } />

          {/* Tenant Routes */}
          <Route path="/tenant-dashboard" element={
            <ProtectedRoute>
              <TenantDashboard />
            </ProtectedRoute>
          } />

          <Route path="/tenant-payments" element={
            <ProtectedRoute>
              <TenantPayments />
            </ProtectedRoute>
          } />

          <Route path="/tenant-payments" element={
            <ProtectedRoute>
              <TenantPayments />
            </ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
