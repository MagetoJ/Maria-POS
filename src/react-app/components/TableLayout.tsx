// src/react-app/components/TableLayout.tsx
import { useState, useEffect } from 'react';
import { usePOS, Table } from '@/react-app/contexts/POSContext';
import { Users } from 'lucide-react';

export default function TableLayout() {
  const { currentOrder, setCurrentOrder } = usePOS();
  const [tables, setTables] = useState<Table[]>([]);

  // --- FETCH TABLES FROM BACKEND ---
  useEffect(() => {
    const fetchTables = async () => {
      try {
        const response = await fetch('/api/tables');
        if (!response.ok) throw new Error('Failed to fetch tables');
        const data = await response.json();
        setTables(data);
      } catch (error) {
        console.error('Error fetching tables:', error);
      }
    };

    fetchTables();
  }, []);

  // --- STATUS COLOR HELPER ---
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'occupied':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'reserved':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'cleaning':
        return 'bg-gray-100 border-gray-300 text-gray-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  // --- HANDLE TABLE SELECTION ---
  const handleTableSelect = (table: Table) => {
    if (table.status === 'available') {
      if (currentOrder) {
        setCurrentOrder({
          ...currentOrder,
          order_type: 'dine_in',
          table_id: table.id,
        });
      }
      alert(`Table ${table.table_number} selected for current order`);
    }
  };

  // --- RENDER ---
  return (
    <div className="flex-1 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Restaurant Floor Plan</h2>
        <p className="text-gray-600">Select an available table to assign to your order</p>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
          <span className="text-sm text-gray-600">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
          <span className="text-sm text-gray-600">Occupied</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
          <span className="text-sm text-gray-600">Reserved</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
          <span className="text-sm text-gray-600">Cleaning</span>
        </div>
      </div>

      {/* Table Grid */}
      <div className="grid grid-cols-4 lg:grid-cols-6 gap-4">
        {tables.map((table) => (
          <div
            key={table.id}
            onClick={() => handleTableSelect(table)}
            className={`
              relative p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md
              ${getStatusColor(table.status)}
              ${table.status === 'available' ? 'hover:scale-105' : 'cursor-not-allowed opacity-75'}
              ${currentOrder?.table_id === table.id ? 'ring-2 ring-blue-500' : ''}
            `}
          >
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-2 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <Users className="w-6 h-6 text-gray-600" />
              </div>
              <div className="font-bold text-lg">{table.table_number}</div>
              <div className="text-sm opacity-75">{table.capacity} seats</div>
              <div className="text-xs mt-1 font-medium capitalize">
                {table.status.replace('_', ' ')}
              </div>
            </div>

            {currentOrder?.table_id === table.id && (
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                ✓
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Table Stats */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-2xl font-bold text-green-600">
            {tables.filter((t) => t.status === 'available').length}
          </div>
          <div className="text-sm text-gray-600">Available Tables</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-2xl font-bold text-red-600">
            {tables.filter((t) => t.status === 'occupied').length}
          </div>
          <div className="text-sm text-gray-600">Occupied Tables</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-2xl font-bold text-yellow-600">
            {tables.filter((t) => t.status === 'reserved').length}
          </div>
          <div className="text-sm text-gray-600">Reserved Tables</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-2xl font-bold text-gray-600">{tables.length}</div>
          <div className="text-sm text-gray-600">Total Tables</div>
        </div>
      </div>
    </div>
  );
}
