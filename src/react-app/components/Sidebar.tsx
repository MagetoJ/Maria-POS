import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

// Define the structure for a navigation item
interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType; // Allows passing icon components like `Utensils`
}

// Define the props that the Sidebar component will accept
interface SidebarProps {
  title: string;
  navItems: NavItem[];
  activeItem: string;
  onNavItemClick: (id: string) => void;
}

export default function Sidebar({ title, navItems, activeItem, onNavItemClick }: SidebarProps) {
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [activeItem]);

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isMobileMenuOpen]);

  const handleNavItemClick = (id: string) => {
    onNavItemClick(id);
    setIsMobileMenuOpen(false);
  };

  const renderNavItems = (isMobile = false) => (
    <nav className={isMobile ? "space-y-1 px-4" : "space-y-2"}>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeItem === item.id;
        return (
          <button
            key={item.id}
            onClick={() => handleNavItemClick(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
              isMobile ? 'text-base' : 'text-base'
            } ${
              isActive
                ? 'bg-yellow-100 text-yellow-900 font-semibold'
                : 'text-gray-700 hover:bg-gray-100 font-medium'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'text-yellow-800' : 'text-gray-500'}`} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 bg-white border-r border-gray-200 p-6 flex-shrink-0">
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-600">Logged in as {user?.name}</p>
        </div>
        
        {renderNavItems()}

        <div className="mt-auto pt-6 border-t border-gray-200">
           <p className="text-xs text-gray-500">© Maria Havens POS</p>
           <p className="text-xs text-gray-500">Role: <span className="capitalize font-medium">{user?.role.replace('_', ' ')}</span></p>
        </div>
      </aside>

      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-20 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="bg-white border border-gray-300 rounded-lg p-2 shadow-md hover:shadow-lg transition-shadow"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Mobile Navigation Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Sidebar */}
          <div className="fixed inset-y-0 left-0 w-80 bg-white shadow-xl transform transition-transform">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{title}</h2>
                  <p className="text-sm text-gray-600">Logged in as {user?.name}</p>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                  aria-label="Close navigation menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation */}
              <div className="flex-1 py-4 overflow-y-auto">
                {renderNavItems(true)}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">© Maria Havens POS</p>
                <p className="text-xs text-gray-500">
                  Role: <span className="capitalize font-medium">{user?.role.replace('_', ' ')}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Mobile Bottom Navigation for smaller screens */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 sm:hidden">
        <div className="flex">
          {navItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavItemClick(item.id)}
                className={`flex-1 flex flex-col items-center gap-1 px-2 py-3 text-xs transition-colors ${
                  isActive
                    ? 'bg-yellow-50 text-yellow-900 font-medium'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-yellow-800' : 'text-gray-500'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
          {navItems.length > 4 && (
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="flex-1 flex flex-col items-center gap-1 px-2 py-3 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
            >
              <Menu className="w-5 h-5 text-gray-500" />
              <span>More</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
}
