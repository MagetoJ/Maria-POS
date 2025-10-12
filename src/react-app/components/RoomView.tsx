import { useState, useEffect } from 'react';
import { usePOS, Room } from '../contexts/POSContext';
import { Bed, User, Calendar, DollarSign, Loader2 } from 'lucide-react';

// --- Helper Function ---
const formatCurrency = (amount: number): string => {
  if (typeof amount !== 'number') {
    return 'KES 0';
  }
  return `KES ${amount.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

export default function RoomView() {
  const { currentOrder, setCurrentOrder } = usePOS();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRooms = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/rooms');
        if (!response.ok) throw new Error('Failed to fetch rooms');
        const data = await response.json();
        setRooms(data);
      } catch (error) {
        console.error('Error fetching rooms:', error);
        setError('Could not load room information.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchRooms();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'vacant':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'occupied':
        return 'bg-red-100 border-red-300 text-red-800';
      case 'reserved':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'maintenance':
        return 'bg-orange-100 border-orange-300 text-orange-800';
      case 'cleaning':
        return 'bg-gray-100 border-gray-300 text-gray-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getRoomTypeColor = (type: string) => {
    switch (type) {
      case 'Standard':
        return 'bg-blue-100 text-blue-800';
      case 'Deluxe':
        return 'bg-purple-100 text-purple-800';
      case 'Suite':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleRoomSelect = (room: any) => {
    if (room.status === 'occupied' || room.status === 'reserved') {
      if (currentOrder) {
        setCurrentOrder({
          ...currentOrder,
          order_type: 'room_service',
          location_detail: `Room ${room.room_number}`, // <-- **CHANGED LINE**
          room_id: room.id
        });
        alert(`Room ${room.room_number} selected for the current order.`);
      }
    } else {
        alert(`Room ${room.room_number} is not occupied or reserved and cannot be selected for room service.`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full p-6">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500 p-6">{error}</div>;
  }

  return (
    <div className="flex-1 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Hotel Rooms</h2>
        <p className="text-gray-600">Select an occupied or reserved room to start a room service order.</p>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {rooms.map((room) => (
          <div
            key={room.id}
            onClick={() => handleRoomSelect(room)}
            className={`
              relative p-4 rounded-lg border-2 transition-all
              ${getStatusColor(room.status)}
              ${(room.status === 'occupied' || room.status === 'reserved') ? 'cursor-pointer hover:shadow-md hover:scale-105' : 'cursor-not-allowed opacity-70'}
              ${currentOrder?.room_id === room.id ? 'ring-2 ring-blue-500 shadow-lg' : ''}
            `}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Bed className="w-5 h-5" />
                <span className="font-bold text-lg">{room.room_number}</span>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoomTypeColor(room.room_type)}`}>
                {room.room_type}
              </span>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium capitalize">
                {room.status.replace('_', ' ')}
              </div>

              {room.guest_name && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4" />
                  <span>{room.guest_name}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="w-4 h-4" />
                <span>{formatCurrency(room.rate)}/night</span>
              </div>
            </div>

            {currentOrder?.room_id === room.id && (
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold border-2 border-white">
                ✓
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}