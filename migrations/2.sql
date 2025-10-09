
-- Orders table
CREATE TABLE orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_number TEXT NOT NULL UNIQUE,
  order_type TEXT NOT NULL, -- dine_in, takeaway, delivery, room_service
  table_id INTEGER,
  room_id INTEGER,
  customer_name TEXT,
  customer_phone TEXT,
  staff_id INTEGER,
  status TEXT DEFAULT 'pending', -- pending, confirmed, preparing, ready, completed, cancelled
  subtotal REAL DEFAULT 0,
  tax_amount REAL DEFAULT 0,
  service_charge REAL DEFAULT 0,
  discount_amount REAL DEFAULT 0,
  total_amount REAL DEFAULT 0,
  payment_status TEXT DEFAULT 'pending', -- pending, partial, paid, refunded
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Order items
CREATE TABLE order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price REAL NOT NULL,
  total_price REAL NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'pending', -- pending, preparing, ready, served
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Order item variations
CREATE TABLE order_item_variations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_item_id INTEGER NOT NULL,
  variation_id INTEGER NOT NULL,
  price_modifier REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Payments
CREATE TABLE payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  payment_method TEXT NOT NULL, -- cash, card, mobile_money, room_charge
  amount REAL NOT NULL,
  reference_number TEXT,
  status TEXT DEFAULT 'completed', -- pending, completed, failed, refunded
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Inventory
CREATE TABLE inventory_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  current_stock REAL DEFAULT 0,
  minimum_stock REAL DEFAULT 0,
  cost_per_unit REAL DEFAULT 0,
  supplier TEXT,
  inventory_type TEXT DEFAULT 'kitchen', -- kitchen, bar, housekeeping, minibar
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_staff ON orders(staff_id);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_status ON order_items(status);
CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_inventory_type ON inventory_items(inventory_type);
