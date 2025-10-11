import { Category, Product, Table, Room } from '../contexts/POSContext';

export const mockCategories: Category[] = [
  { id: 1, name: 'Appetizers', description: 'Start your meal right', is_active: true },
  { id: 2, name: 'Main Course', description: 'Hearty meals', is_active: true },
  { id: 3, name: 'Beverages', description: 'Drinks and refreshments', is_active: true },
  { id: 4, name: 'Desserts', description: 'Sweet endings', is_active: true },
  { id: 5, name: 'Room Service', description: 'Hotel room amenities', is_active: true },
];

export const mockProducts: Product[] = [
  // Appetizers
  { id: 1, category_id: 1, name: 'Samosas', description: 'Crispy pastries filled with spiced vegetables', price: 150, is_available: true, preparation_time: 10 },
  { id: 2, category_id: 1, name: 'Chicken Wings', description: 'Spicy grilled chicken wings', price: 300, is_available: true, preparation_time: 15 },
  { id: 3, category_id: 1, name: 'Spring Rolls', description: 'Fresh vegetable spring rolls', price: 200, is_available: true, preparation_time: 8 },
  
  // Main Course
  { id: 4, category_id: 2, name: 'Ugali & Nyama Choma', description: 'Traditional grilled meat with ugali', price: 800, is_available: true, preparation_time: 25 },
  { id: 5, category_id: 2, name: 'Pilau Rice', description: 'Spiced rice with tender beef', price: 600, is_available: true, preparation_time: 30 },
  { id: 6, category_id: 2, name: 'Fish & Chips', description: 'Crispy fish fillet with potato chips', price: 750, is_available: true, preparation_time: 20 },
  { id: 7, category_id: 2, name: 'Chicken Curry', description: 'Creamy coconut chicken curry', price: 700, is_available: true, preparation_time: 25 },
  { id: 8, category_id: 2, name: 'Vegetable Stir Fry', description: 'Mixed vegetables in savory sauce', price: 450, is_available: true, preparation_time: 15 },
  
  // Beverages
  { id: 9, category_id: 3, name: 'Tusker Beer', description: 'Local premium beer', price: 250, is_available: true, preparation_time: 2 },
  { id: 10, category_id: 3, name: 'Coca Cola', description: 'Classic soft drink', price: 100, is_available: true, preparation_time: 1 },
  { id: 11, category_id: 3, name: 'Fresh Mango Juice', description: 'Freshly squeezed mango juice', price: 200, is_available: true, preparation_time: 5 },
  { id: 12, category_id: 3, name: 'Kenyan Coffee', description: 'Locally roasted coffee', price: 150, is_available: true, preparation_time: 5 },
  { id: 13, category_id: 3, name: 'Masala Tea', description: 'Spiced milk tea', price: 80, is_available: true, preparation_time: 5 },
  
  // Desserts
  { id: 14, category_id: 4, name: 'Chocolate Cake', description: 'Rich chocolate layer cake', price: 350, is_available: true, preparation_time: 5 },
  { id: 15, category_id: 4, name: 'Ice Cream', description: 'Vanilla ice cream with toppings', price: 200, is_available: true, preparation_time: 3 },
  { id: 16, category_id: 4, name: 'Fruit Salad', description: 'Fresh mixed tropical fruits', price: 250, is_available: true, preparation_time: 5 },
  
  // Room Service
  { id: 17, category_id: 5, name: 'Continental Breakfast', description: 'Bread, eggs, coffee, juice', price: 500, is_available: true, preparation_time: 15 },
  { id: 18, category_id: 5, name: 'Room Cleaning', description: 'Professional room cleaning service', price: 300, is_available: true, preparation_time: 30 },
  { id: 19, category_id: 5, name: 'Laundry Service', description: 'Wash and fold service', price: 200, is_available: true, preparation_time: 120 },
];

export const mockTables: Table[] = [
  { id: 1, table_number: 'T01', capacity: 4, status: 'available', x_position: 20, y_position: 20 },
  { id: 2, table_number: 'T02', capacity: 2, status: 'occupied', x_position: 20, y_position: 60 },
  { id: 3, table_number: 'T03', capacity: 6, status: 'available', x_position: 60, y_position: 20 },
  { id: 4, table_number: 'T04', capacity: 4, status: 'reserved', x_position: 60, y_position: 60 },
  { id: 5, table_number: 'T05', capacity: 8, status: 'available', x_position: 20, y_position: 100 },
  { id: 6, table_number: 'T06', capacity: 2, status: 'cleaning', x_position: 60, y_position: 100 },
  { id: 7, table_number: 'T07', capacity: 4, status: 'available', x_position: 100, y_position: 20 },
  { id: 8, table_number: 'T08', capacity: 6, status: 'occupied', x_position: 100, y_position: 60 },
];

export const mockRooms: Room[] = [
  { id: 1, room_number: '101', room_type: 'Standard', status: 'occupied', guest_name: 'John Doe', check_in_date: '2024-10-08', check_out_date: '2024-10-12', rate: 5000 },
  { id: 2, room_number: '102', room_type: 'Standard', status: 'vacant', rate: 5000 },
  { id: 3, room_number: '103', room_type: 'Deluxe', status: 'reserved', guest_name: 'Jane Smith', check_in_date: '2024-10-10', check_out_date: '2024-10-15', rate: 7500 },
  { id: 4, room_number: '104', room_type: 'Standard', status: 'cleaning', rate: 5000 },
  { id: 5, room_number: '201', room_type: 'Suite', status: 'occupied', guest_name: 'Bob Wilson', check_in_date: '2024-10-07', check_out_date: '2024-10-11', rate: 12000 },
  { id: 6, room_number: '202', room_type: 'Deluxe', status: 'vacant', rate: 7500 },
  { id: 7, room_number: '203', room_type: 'Suite', status: 'maintenance', rate: 12000 },
  { id: 8, room_number: '204', room_type: 'Standard', status: 'vacant', rate: 5000 },
];

export const formatCurrency = (amount: number | undefined | null): string => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return 'KES 0';
  }
  return `KES ${amount.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};
