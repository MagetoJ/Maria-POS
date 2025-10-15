import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import POS from './pages/POS';
import AdminDashboard from './pages/AdminDashboard';
import KitchenDisplay from './pages/KitchenDisplay';
import HousekeepingDashboard from './pages/HousekeepingDashboard';
import Home from './pages/Home';
import NetworkStatus from './components/NetworkStatus';
import KitchenDashboard from './pages/KitchenDashboard';


// This component remains the same, protecting sensitive routes
const ProtectedRoute = ({ children, allowedRoles }: { children: JSX.Element, allowedRoles?: string[] }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/pos" replace />;
  }

  return children;
};

function App() {
  const navigate = useNavigate();

  const handleQuickPOS = () => {
    navigate('/pos');
  };

  return (
    <>
      <NetworkStatus />
      <Routes>
        <Route path="/login" element={<Login onQuickPOSAccess={handleQuickPOS} />} />
        
        {/* The isQuickAccess prop has been removed from the POS component */}
        <Route path="/pos" element={<POS />} /> 
        
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
            <ProtectedRoute>
              <KitchenDisplay />
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
        <Route
          path="/"
          element={
              <Home />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
