// server/seeds/01_initial_data.ts
import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex('staff').del();
  await knex('products').del();
  await knex('categories').del();
  await knex('tables').del();
  await knex('rooms').del();

  // Inserts categories
  await knex('categories').insert([
    { id: 1, name: 'Appetizers', description: 'Start your meal right', is_active: true },
    { id: 2, name: 'Main Course', description: 'Hearty meals', is_active: true },
    { id: 3, name: 'Beverages', description: 'Drinks and refreshments', is_active: true },
    { id: 4, name: 'Desserts', description: 'Sweet endings', is_active: true },
    { id: 5, name: 'Room Service', description: 'Hotel room amenities', is_active: true },
  ]);

  // Inserts products
  await knex('products').insert([
    { id: 1, category_id: 1, name: 'Samosas', description: 'Crispy pastries filled with spiced vegetables', price: 150, is_available: true, preparation_time: 10 },
    { id: 2, category_id: 1, name: 'Chicken Wings', description: 'Spicy grilled chicken wings', price: 300, is_available: true, preparation_time: 15 },
    { id: 4, category_id: 2, name: 'Ugali & Nyama Choma', description: 'Traditional grilled meat with ugali', price: 800, is_available: true, preparation_time: 25 },
    { id: 5, category_id: 2, name: 'Pilau Rice', description: 'Spiced rice with tender beef', price: 600, is_available: true, preparation_time: 30 },
    { id: 9, category_id: 3, name: 'Tusker Beer', description: 'Local premium beer', price: 250, is_available: true, preparation_time: 2 },
    { id: 10, category_id: 3, name: 'Coca Cola', description: 'Classic soft drink', price: 100, is_available: true, preparation_time: 1 },
    { id: 14, category_id: 4, name: 'Chocolate Cake', description: 'Rich chocolate layer cake', price: 350, is_available: true, preparation_time: 5 },
  ]);

  // Inserts staff
  await knex('staff').insert([
    { id: 1, employee_id: 'EMP001', username: 'john.manager', name: 'John Manager', role: 'manager', pin: '1234', password: 'manager123', is_active: true },
    { id: 2, employee_id: 'EMP002', username: 'mary.waiter', name: 'Mary Waiter', role: 'waiter', pin: '5678', password: 'waiter123', is_active: true },
    { id: 5, employee_id: 'EMP005', username: 'admin', name: 'Admin User', role: 'admin', pin: '0000', password: 'admin123', is_active: true },
  ]);

  // Inserts tables
  await knex('tables').insert([
    { id: 1, table_number: 'T01', capacity: 4, status: 'available' },
    { id: 2, table_number: 'T02', capacity: 2, status: 'occupied' },
    { id: 3, table_number: 'T03', capacity: 6, status: 'available' },
    { id: 4, table_number: 'T04', capacity: 4, status: 'reserved' },
  ]);

  // Inserts rooms
  await knex('rooms').insert([
    { id: 1, room_number: '101', room_type: 'Standard', status: 'occupied', guest_name: 'John Doe', rate: 5000 },
    { id: 2, room_number: '102', room_type: 'Standard', status: 'vacant', rate: 5000 },
    { id: 3, room_number: '103', room_type: 'Deluxe', status: 'cleaning', rate: 7500 },
    { id: 4, room_number: '201', room_type: 'Suite', status: 'maintenance', rate: 12000 },
  ]);
}