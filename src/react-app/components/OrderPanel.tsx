import React, { useState, useEffect } from 'react';
import { usePOS } from '../contexts/POSContext';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config/api';
import { Trash2, User, CreditCard, X, Loader2, UtensilsCrossed } from 'lucide-react';

// Centralized currency formatter
const formatCurrency = (amount: number): string => {
  if (typeof amount !== 'number') return 'KES 0';
  return `KES ${amount.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

// Define the props the component will accept
interface OrderPanelProps {
  isQuickAccess?: boolean;
}

export default function OrderPanel({ isQuickAccess = false }: OrderPanelProps) {
    const { currentOrder, removeItemFromOrder, clearOrder, updateItemQuantity } = usePOS();
    const { user, validateStaffPin } = useAuth();
    
    const [customerName, setCustomerName] = useState('');
    const [showPinModal, setShowPinModal] = useState(false);
    const [pinUsername, setPinUsername] = useState('');
    const [pin, setPin] = useState('');
    const [pinError, setPinError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // If logged in, pre-fill the username
    useEffect(() => {
        if (user) {
            setPinUsername(user.username);
        }
    }, [user]);

    const subtotal = currentOrder?.items.reduce((acc, item) => acc + (item.price * item.quantity), 0) ?? 0;
    const tax = subtotal * 0.16;
    const total = subtotal + tax;

    const handleQuantityChange = (itemId: number, newQuantity: number) => {
        updateItemQuantity(itemId, newQuantity);
    };

    const handleFinalizeOrder = () => {
        if (!currentOrder || currentOrder.items.length === 0) {
            alert("Cannot process an empty order.");
            return;
        }
        setShowPinModal(true);
    };
    
    const handlePinVerification = async () => {
        const usernameForValidation = isQuickAccess ? pinUsername : user?.username;
        if (!usernameForValidation) {
            setPinError("Username is required for PIN validation.");
            return;
        }
        if (pin.length !== 4) {
            setPinError("PIN must be 4 digits.");
            return;
        }

        setIsSubmitting(true);
        setPinError('');

        const validatedUser = await validateStaffPin(usernameForValidation, pin);

        if (validatedUser) {
            await submitOrder(validatedUser);
        } else {
            setPinError("Invalid username or PIN. Please try again.");
            setIsSubmitting(false);
        }
    };

    const submitOrder = async (staff: any) => {
        if (!currentOrder) return;

        const orderPayload = {
            ...currentOrder,
            items: currentOrder.items.map(item => ({
                product_id: item.product_id,
                quantity: item.quantity,
                unit_price: item.price,
                total_price: item.price * item.quantity,
                notes: item.notes
            })),
            staff_username: staff.username,
            pin: pin,
            total_amount: total,
            subtotal: subtotal,
            tax_amount: tax
        };
        
        try {
            const response = await fetch(`${API_URL}/api/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderPayload),
            });

            if (response.ok) {
                alert('Order submitted successfully!');
                clearOrder();
                setCustomerName('');
                setShowPinModal(false);
                setPin('');
                if (isQuickAccess) setPinUsername('');
            } else {
                const error = await response.json();
                setPinError(error.message || "Order submission failed.");
            }
        } catch (error) {
            setPinError('An error occurred while submitting the order.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50">
            {/* Order Header */}
            <div className="p-4 border-b bg-white">
                <h2 className="text-xl font-bold text-gray-800">Current Order</h2>
                <p className="text-sm text-gray-500">
                    Order Type: <span className="font-medium capitalize">{currentOrder?.order_type.replace('_', ' ') || 'N/A'}</span>
                </p>
            </div>

            {/* Order Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {currentOrder?.items.map(item => (
                    <div key={item.id} className="flex items-center bg-white p-3 rounded-lg shadow-sm">
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">{item.name}</p>
                            <p className="text-sm text-gray-600">{formatCurrency(item.price)}</p>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                            <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value))}
                                className="w-16 p-1 text-center border rounded-md"
                                min="1"
                            />
                            <button onClick={() => removeItemFromOrder(item.id)} className="text-red-500 hover:text-red-700 p-1">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
                {!currentOrder || currentOrder.items.length === 0 && (
                    <div className="text-center text-gray-400 pt-16">
                        <UtensilsCrossed className="w-12 h-12 mx-auto text-gray-300" />
                        <p className="mt-2">Add items from the menu to start an order.</p>
                    </div>
                )}
            </div>

            {/* Order Summary & Actions */}
            {currentOrder && currentOrder.items.length > 0 && (
                <div className="p-4 border-t bg-white">
                    <div className="space-y-2 mb-4">
                        <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                        <div className="flex justify-between"><span>Tax (16%)</span><span>{formatCurrency(tax)}</span></div>
                        <div className="flex justify-between font-bold text-lg"><span>Total</span><span>{formatCurrency(total)}</span></div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={clearOrder} className="w-full py-3 bg-red-100 text-red-700 rounded-md font-semibold hover:bg-red-200">
                            Clear
                        </button>
                        <button onClick={handleFinalizeOrder} className="w-full py-3 bg-yellow-400 text-yellow-900 rounded-md font-semibold hover:bg-yellow-500">
                            Finalize Order
                        </button>
                    </div>
                </div>
            )}

            {/* PIN Modal */}
            {showPinModal && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-80">
                        <h3 className="text-lg font-bold mb-4">Staff Authorization</h3>
                        
                        {isQuickAccess && !user && (
                             <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                                <input
                                    type="text"
                                    value={pinUsername}
                                    onChange={(e) => setPinUsername(e.target.value)}
                                    className="w-full p-2 border rounded-md"
                                    placeholder="Enter your username"
                                />
                            </div>
                        )}

                        <div className="mb-4">
                             <label className="block text-sm font-medium text-gray-700 mb-1">PIN</label>
                            <input
                                type="password"
                                value={pin}
                                onChange={(e) => setPin(e.target.value)}
                                maxLength={4}
                                className="w-full p-2 text-center text-2xl tracking-widest border rounded-md"
                            />
                        </div>

                        {pinError && <p className="text-red-500 text-sm text-center mb-2">{pinError}</p>}

                        <div className="flex gap-2">
                            <button onClick={() => { setShowPinModal(false); setPinError(''); }} className="w-full py-2 bg-gray-200 rounded-md">Cancel</button>
                            <button onClick={handlePinVerification} disabled={isSubmitting} className="w-full py-2 bg-blue-500 text-white rounded-md flex justify-center items-center">
                                {isSubmitting ? <Loader2 className="animate-spin" /> : 'Submit'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

