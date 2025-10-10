import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Login from './Login';
import POS from './POS';
import KitchenDisplay from './KitchenDisplay';
import AdminDashboard from './AdminDashboard';
import HousekeepingDashboard from './HousekeepingDashboard';

export default function Home() {
  const { user } = useAuth();
  const [showQuickPOS, setShowQuickPOS] = useState(false);

  if (!user && !showQuickPOS) {
    return <Login onQuickPOSAccess={() => setShowQuickPOS(true)} />;
  }

  if (showQuickPOS && !user) {
    return <POS isQuickAccess={true} onBackToLogin={() => setShowQuickPOS(false)} />;
  }

  // Route based on user role
  switch (user?.role) {
    case 'kitchen_staff':
      return <KitchenDisplay />;
    case 'admin':
    case 'manager':
      return <AdminDashboard />;
    case 'housekeeping':
      return <HousekeepingDashboard />;
    case 'waiter':
    case 'cashier':
    case 'receptionist':
    case 'delivery':
    default:
      return <POS />;
  }
}
