/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.raw(`
    CREATE TABLE invoices (
      id SERIAL PRIMARY KEY,
      order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
      invoice_number TEXT NOT NULL UNIQUE,
      due_date TIMESTAMP,
      status TEXT DEFAULT 'unpaid', -- unpaid, partial, paid, overdue
      billing_address TEXT,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX idx_invoices_order_id ON invoices(order_id);
    CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);
    CREATE INDEX idx_invoices_status ON invoices(status);
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.raw(`
    DROP TABLE IF EXISTS invoices;
  `);
};
