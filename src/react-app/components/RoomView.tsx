import { useState, useEffect } from 'react';
import { usePOS, Room } from '../contexts/POSContext';
import { formatCurrency } from '../data/mockData';
import { Bed, User, Calendar, DollarSign } from 'lucide-react';

export default function RoomView() {
  const { currentOrder, setCurrentOrder } = usePOS();
  const [rooms, setRooms] = useState<Room[]>([]);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await fetch('/api/rooms');
        if (!response.ok) throw new Error('Failed to fetch rooms');
        const data = await response.json();
        setRooms(data);
      } catch (error) {
        console.error('Error fetching rooms:', error);
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
          room_id: room.id
        });
      }
      alert(`Room ${room.room_number} selected for room service order`);
    }
  };

  return (
    <div className="flex-1 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Hotel Rooms</h2>
        <p className="text-gray-600">Select an occupied room to provide room service</p>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-6">
        {[
          { color: 'bg-green-100 border-green-300', label: 'Vacant' },
          { color: 'bg-red-100 border-red-300', label: 'Occupied' },
          { color: 'bg-yellow-100 border-yellow-300', label: 'Reserved' },
          { color: 'bg-orange-100 border-orange-300', label: 'Maintenance' },
          { color: 'bg-gray-100 border-gray-300', label: 'Cleaning' },
        ].map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded border ${item.color}`}></div>
            <span className="text-sm text-gray-600">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {rooms.map((room) => (
          <div
            key={room.id}
            onClick={() => handleRoomSelect(room)}
            className={`
              relative p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md
              ${getStatusColor(room.status)}
              ${(room.status === 'occupied' || room.status === 'reserved') ? 'hover:scale-105' : 'cursor-not-allowed opacity-75'}
              ${currentOrder?.room_id === room.id ? 'ring-2 ring-blue-500' : ''}
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

              {room.check_in_date && room.check_out_date && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {new Date(room.check_in_date).toLocaleDateString()} -{' '}
                    {new Date(room.check_out_date).toLocaleDateString()}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="w-4 h-4" />
                <span>{formatCurrency(room.rate)}/night</span>
              </div>
            </div>

            {currentOrder?.room_id === room.id && (
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                ✓
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Room Stats */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-2xl font-bold text-green-600">
            {rooms.filter(r => r.status === 'vacant').length}
          </div>
          <div className="text-sm text-gray-600">Vacant Rooms</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-2xl font-bold text-red-600">
            {rooms.filter(r => r.status === 'occupied').length}
          </div>
          <div className="text-sm text-gray-600">Occupied Rooms</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-2xl font-bold text-yellow-600">
            {rooms.filter(r => r.status === 'reserved').length}
          </div>
          <div className="text-sm text-gray-600">Reserved Rooms</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-2xl font-bold text-orange-600">
            {rooms.filter(r => r.status === 'maintenance').length}
          </div>
          <div className="text-sm text-gray-600">Maintenance</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-2xl font-bold text-gray-600">
            {rooms.length}
          </div>
          <div className="text-sm text-gray-600">Total Rooms</div>
        </div>
      </div>
    </div>
  );
}
