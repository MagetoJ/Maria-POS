import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Bed, Wifi, Tv, Wind, Loader2, AlertCircle, LogIn, LogOut, User, Phone, Calendar } from 'lucide-react';
import { API_URL } from '../config/api';

interface Room {
  id: number;
  room_number: string;
  room_type: string;
  status: 'vacant' | 'occupied' | 'cleaning' | 'maintenance' | 'reserved';
  rate: number | null;
  guest_name?: string | null;
  guest_contact?: string | null;
  check_in_date?: string | null;
}

export default function RoomView() {
  const { user } = useAuth(); // <-- ADD THIS LINE
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debug logging
  console.log('RoomView - Current user:', user);
  console.log('RoomView - User role:', user?.role);

  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isCheckInModalOpen, setCheckInModalOpen] = useState(false);
  const [isCheckOutModalOpen, setCheckOutModalOpen] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestContact, setGuestContact] = useState('');
  const [nights, setNights] = useState(1);
  const [logoutDetails, setLogoutDetails] = useState({ staffName: '', pin: '' });
  const [isProcessing, setIsProcessing] = useState(false);

  // Auto-calculate the total
  const totalAmount = useMemo(() => {
    if (!selectedRoom || !selectedRoom.rate) return 0;
    return selectedRoom.rate * nights;
  }, [selectedRoom, nights]);

  const fetchRooms = async () => {
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem('pos_token');

    try {
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/api/rooms`, {
        headers,
      });

      if (!response.ok) throw new Error('Failed to fetch rooms');
      const data = await response.json();
      setRooms(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleOpenCheckIn = (room: Room) => {
    setSelectedRoom(room);
    setGuestName('');
    setGuestContact('');
    setNights(1);
    if (!user) {
      setLogoutDetails({ staffName: '', pin: '' });
    }
    setCheckInModalOpen(true);
  };

  const generateCheckInReceipt = (data: {
    guestName: string;
    roomNumber: string;
    roomType: string;
    nights: number;
    rate: number;
    totalAmount: number;
    checkInDate: Date;
    staffName: string;
  }) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print receipts');
      return;
    }
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - ${data.roomNumber}</title>
          <style>
            body { font-family: 'Courier New', monospace; width: 80mm; padding: 5px; font-size: 13px; line-height: 1.4; }
            .center { text-align: center; }
            .divider { border-top: 1px dashed #000; margin: 10px 0; }
            .flex { display: flex; justify-content: space-between; }
            .total { font-size: 16px; font-weight: bold; margin-top: 10px; }
            @media print { body { width: 80mm; margin: 0; padding: 5px; } }
          </style>
        </head>
        <body>
          <div class="center">
            <h2 style="margin: 0;">MARIA HAVENS</h2>
            <p style="margin: 5px 0;">CHECK-IN RECEIPT</p>
          </div>
          <div class="divider"></div>
          <p>Guest: ${data.guestName}</p>
          <p>Room: ${data.roomNumber} (${data.roomType})</p>
          <div class="divider"></div>
          
          <div class="flex">
            <span>Rate (${data.nights} nights x KES ${data.rate.toLocaleString()})</span>
            <span>KES ${data.totalAmount.toLocaleString()}</span>
          </div>
          
          <div class="divider"></div>
          <div class="flex total">
            <span>TOTAL PAID:</span>
            <span>KES ${data.totalAmount.toLocaleString()}</span>
          </div>
          
          <div class="divider"></div>
          <p>Check-In: ${data.checkInDate.toLocaleString()}</p>
          <p>Staff: ${data.staffName}</p>
          <div class="divider"></div>
          <p class="center" style="margin-top:20px;">Safe Travels!</p>
          <script>window.onload = () => { window.print(); window.close(); };</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const generateCheckOutReceipt = (data: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <style>
          body { font-family: 'Courier New', monospace; width: 80mm; font-size: 12px; margin: 0; padding: 10px; }
          .center { text-align: center; }
          .flex { display: flex; justify-content: space-between; }
          .bold { font-weight: bold; }
          hr { border: none; border-top: 1px dashed black; margin: 5px 0; }
        </style>
        <body>
          <div class="center">
            <h2>MARIA HAVENS POS</h2>
            <p>ROOM CHECKOUT RECEIPT</p>
          </div>
          <hr/>
          <div class="flex"><span>Room:</span> <span>${data.roomNumber}</span></div>
          <div class="flex"><span>Type:</span> <span>${data.roomType}</span></div>
          <div class="flex"><span>Rate:</span> <span>KES ${(data.rate || 0).toLocaleString()}</span></div>
          <hr/>
          <div class="flex bold"><span>TOTAL DUE:</span> <span>KES ${(data.total || 0).toLocaleString()}</span></div>
          <hr/>
          <p>Checked out by: ${data.clearedBy}</p>
          <p>Date: ${new Date().toLocaleString()}</p>
          <p class="center">*** THANK YOU ***</p>
          <script>window.onload = function() { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleCheckIn = async () => {
    if (!selectedRoom || !guestName) return;
    
    // Validate staff details if not logged in
    if (!user && (!logoutDetails.staffName || !logoutDetails.pin)) {
      alert("Please enter your name and PIN to authorize check-in.");
      return;
    }

    setIsProcessing(true);
    const token = localStorage.getItem('pos_token');
    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${API_URL}/api/rooms/${selectedRoom.id}/check-in`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          guest_name: guestName, 
          guest_contact: guestContact,
          nights: nights,
          rate: selectedRoom.rate,
          total_price: totalAmount,
          staffName: user?.username || logoutDetails.staffName,
          authPin: logoutDetails.pin
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Check-in failed');
      }

      // Generate receipt
      generateCheckInReceipt({
        guestName: guestName,
        roomNumber: selectedRoom.room_number,
        roomType: selectedRoom.room_type,
        nights: nights,
        rate: selectedRoom.rate || 0,
        totalAmount: totalAmount,
        checkInDate: new Date(),
        staffName: user?.username || logoutDetails.staffName || 'Staff'
      });

      setCheckInModalOpen(false);
      await fetchRooms(); // Refresh the room list
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenCheckOut = (room: Room) => {
    setSelectedRoom(room);
    setLogoutDetails({ staffName: '', pin: '' });
    setCheckOutModalOpen(true);
  };

  const handleCheckOut = async () => {
    if (!selectedRoom) return;
    
    // Validate staff details if not logged in
    if (!user && (!logoutDetails.staffName || !logoutDetails.pin)) {
      alert("Please enter your name and PIN to authorize check-out.");
      return;
    }

    setIsProcessing(true);
    const token = localStorage.getItem('pos_token');
    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${API_URL}/api/rooms/${selectedRoom.id}/check-out`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          staffName: logoutDetails.staffName,
          authPin: logoutDetails.pin
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Check-out failed');
      }

      const receiptData = await response.json();
      generateThermalReceipt(receiptData);
      
      setCheckOutModalOpen(false);
      await fetchRooms(); // Refresh the room list
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = (status: Room['status']) => {
    switch (status) {
      case 'vacant': return 'bg-emerald-100 border-emerald-500 text-emerald-700';
      case 'occupied': return 'bg-rose-100 border-rose-500 text-rose-700';
      case 'cleaning': return 'bg-amber-100 border-amber-500 text-amber-700';
      case 'maintenance': return 'bg-amber-100 border-amber-500 text-amber-700';
      case 'reserved': return 'bg-blue-100 border-blue-500 text-blue-700';
      default: return 'bg-gray-100 border-gray-400';
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-yellow-500" /></div>;
  }
  if (error) {
    return <div className="text-center text-red-500 p-4">{error}</div>;
  }

  return (
    <>
      <div className="p-4 sm:p-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
          <Bed className="w-8 h-8 text-blue-600" />
          Hotel Room Status
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {rooms.map((room) => (
            <div 
              key={room.id} 
              className={`rounded-xl border-2 shadow-sm p-4 flex flex-col transition-all hover:scale-105 cursor-pointer ${getStatusColor(room.status)}`}
              onClick={() => {
                if (room.status === 'vacant') handleOpenCheckIn(room);
                else if (room.status === 'occupied') handleOpenCheckOut(room);
              }}
            >
              <div className="flex-grow">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-2xl font-bold">#{room.room_number}</h3>
                  <span className="text-xs uppercase font-bold px-2 py-1 bg-white bg-opacity-50 rounded-full border border-current">
                    {room.status === 'cleaning' ? 'Dirty' : room.status}
                  </span>
                </div>
                <p className="text-sm opacity-80 font-medium capitalize">{room.room_type}</p>
                <p className="text-lg font-bold mt-1">
                  {typeof room.rate === 'number' ? `KES ${room.rate.toLocaleString()}/night` : 'Rate not set'}
                </p>
              </div>

              <div className="flex items-center gap-3 mt-4 text-xs opacity-70 border-t border-current border-opacity-20 pt-3">
                <span className="flex items-center gap-1"><Wifi size={14} /> WiFi</span>
                <span className="flex items-center gap-1"><Tv size={14} /> TV</span>
                <span className="flex items-center gap-1"><Wind size={14} /> AC</span>
              </div>

              {/* Room Action Buttons */}
              <div className="mt-4">
                {room.status === 'vacant' && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleOpenCheckIn(room); }} 
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
                  >
                    <LogIn size={16} /> Check-In
                  </button>
                )}
                {room.status === 'occupied' && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleOpenCheckOut(room); }} 
                    disabled={isProcessing} 
                    className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-5 h-5 animate-spin"/>
                    ) : (
                      <>
                        <LogOut size={16} /> Manage / Checkout
                      </>
                    )}
                  </button>
                )}
                {(room.status === 'cleaning' || room.status === 'maintenance') && (
                  <div className="w-full text-center py-2 px-4 rounded-lg bg-amber-200 text-amber-800 text-sm font-bold border border-amber-300">
                    {room.status === 'cleaning' ? 'NEEDS CLEANING' : 'UNDER MAINTENANCE'}
                  </div>
                )}
                {room.status === 'reserved' && (
                  <div className="w-full text-center py-2 px-4 rounded-lg bg-blue-200 text-blue-800 text-sm font-bold border border-blue-300">
                    RESERVED
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Check-In Modal */}
      {isCheckInModalOpen && selectedRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Check-In to Room {selectedRoom.room_number}</h3>
            <div className="space-y-4">
              {!user && (
                <>
                  <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200 mb-4">
                    <p className="text-xs text-yellow-800">Please provide your staff details to authorize this action.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Staff Name *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input 
                        type="text" 
                        value={logoutDetails.staffName} 
                        onChange={(e) => setLogoutDetails({...logoutDetails, staffName: e.target.value})} 
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg" 
                        required 
                        placeholder="Your username"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Staff PIN *</label>
                    <div className="relative">
                      <AlertCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input 
                        type="password" 
                        value={logoutDetails.pin} 
                        onChange={(e) => setLogoutDetails({...logoutDetails, pin: e.target.value})} 
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg" 
                        required 
                        placeholder="Your 4-digit PIN"
                      />
                    </div>
                  </div>
                  <hr />
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Guest Name *</label>
                <div className="relative"><User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="text" value={guestName} onChange={(e) => setGuestName(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg" required /></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nights *</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                      type="number" 
                      min="1" 
                      value={nights} 
                      onChange={(e) => setNights(parseInt(e.target.value) || 1)} 
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Guest Contact</label>
                  <div className="relative"><Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" /><input type="text" value={guestContact} onChange={(e) => setGuestContact(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg" /></div>
                </div>
              </div>

              {/* Total Calculation Display */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-emerald-800 font-semibold uppercase tracking-wider text-xs">Total Amount:</span>
                  <span className="text-xl font-black text-emerald-900">
                    KES {totalAmount.toLocaleString()}
                  </span>
                </div>
                <p className="text-[10px] text-emerald-600 mt-1 uppercase font-bold">
                  {nights} night(s) × KES {(selectedRoom.rate || 0).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setCheckInModalOpen(false)} className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">Cancel</button>
              <button onClick={handleCheckIn} disabled={!guestName || isProcessing || (!user && (!logoutDetails.staffName || !logoutDetails.pin))} className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Confirm Check-In'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Check-Out Modal */}
      {isCheckOutModalOpen && selectedRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Check-Out from Room {selectedRoom.room_number}</h3>
            <p className="text-sm text-gray-600 mb-4">Please confirm checkout and provide authorization details.</p>
            <div className="space-y-4">
              <div className="p-3 bg-red-50 rounded-lg border border-red-100 mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Guest:</span>
                  <span className="font-semibold">{selectedRoom.guest_name || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Rate:</span>
                  <span className="font-semibold">KES {(selectedRoom.rate || 0).toLocaleString()}</span>
                </div>
              </div>

              {!user && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Staff Name *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input 
                        type="text" 
                        value={logoutDetails.staffName} 
                        onChange={(e) => setLogoutDetails({...logoutDetails, staffName: e.target.value})} 
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg" 
                        required 
                        placeholder="Your username"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Staff PIN *</label>
                    <div className="relative">
                      <AlertCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input 
                        type="password" 
                        value={logoutDetails.pin} 
                        onChange={(e) => setLogoutDetails({...logoutDetails, pin: e.target.value})} 
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg" 
                        required 
                        placeholder="Your 4-digit PIN"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setCheckOutModalOpen(false)} className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">Cancel</button>
              <button 
                onClick={handleCheckOut} 
                disabled={isProcessing || (!user && (!logoutDetails.staffName || !logoutDetails.pin))} 
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Confirm Check-Out'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}