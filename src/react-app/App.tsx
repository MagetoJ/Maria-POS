import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import POS from './pages/POS';
import AdminDashboard from './pages/AdminDashboard';
import HousekeepingDashboard from './pages/HousekeepingDashboard';
import Home from './pages/Home';
import NetworkStatus from './components/NetworkStatus';
import KitchenDashboard from './pages/KitchenDashboard';
import ReceptionistDashboard from './pages/ReceptionistDashboard';
import QRMenuOrdering from './components/QRMenuOrdering';

import PWAUpdateNotification from './components/PWAUpdateNotification';

import AccountantDashboard from './pages/AccountantDashboard';

const SKIP_LOGIN = import.meta.env.VITE_SKIP_LOGIN === 'true';

// This component remains the same, protecting sensitive routes
const ProtectedRoute = ({ children, allowedRoles }: { children: JSX.Element, allowedRoles?: string[] }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated && !SKIP_LOGIN) {
    return <Navigate to="/login" replace />;
  }

  // If no specific roles are required, just being authenticated is enough
  if (!allowedRoles) {
    return children;
  }

  if (user && allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect unauthorized users to home, which will then route them to their correct dashboard
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleQuickPOS = () => {
    navigate('/pos');
  };

  return (
    <>
      <NetworkStatus />

      <PWAUpdateNotification />
      <Routes>
        <Route path="/login" element={<Login onQuickPOSAccess={handleQuickPOS} />} />
        
        {/* Public QR Menu Ordering Route */}
        <Route path="/qr/menu" element={<QRMenuOrdering />} />
        
        <Route 
          path="/pos" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'manager', 'staff', 'waiter', 'cashier', 'delivery', 'kitchen_staff', 'receptionist', 'housekeeping']}>
              <POS />
            </ProtectedRoute>
          } 
        /> 
        
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin', 'manager']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/kitchen"
          element={
            <ProtectedRoute allowedRoles={['kitchen_staff', 'admin', 'manager']}>
              {/* Using KitchenDashboard for consistency */}
              <KitchenDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/housekeeping"
          element={
            <ProtectedRoute allowedRoles={['housekeeping', 'admin', 'manager']}>
              <HousekeepingDashboard />
            </ProtectedRoute>
          }
        />

        {/* --- ADDED RECEPTIONIST ROUTE --- */}
        <Route
          path="/reception"
          element={
            <ProtectedRoute allowedRoles={['receptionist', 'admin', 'manager']}>
              <ReceptionistDashboard />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/accountant"
          element={
            <ProtectedRoute allowedRoles={['accountant', 'admin', 'manager']}>
              <AccountantDashboard />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/"
          element={
            user?.role === 'accountant' ? (
              <Navigate to="/accountant" replace />
            ) : (
              <Navigate to="/pos" replace />
            )
          }
        />
        <Route path="*" element={
          user?.role === 'accountant' ? (
            <Navigate to="/accountant" replace />
          ) : (
            <Navigate to="/pos" replace />
          )
        } />
      </Routes>
    </>
  );
}

export default App;
