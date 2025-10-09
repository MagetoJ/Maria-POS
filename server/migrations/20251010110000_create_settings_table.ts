import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('settings', function (table) {
    table.string('key').primary();
    table.text('value');
  });

  // Insert default settings
  return knex('settings').insert([
    { key: 'business_name', value: 'Maria Havens' },
    { key: 'business_address', value: 'P.O. Box 123, Nairobi, Kenya' },
    { key: 'business_phone', value: '+254 700 123 456' },
    { key: 'currency_symbol', value: 'KES' },
    { key: 'tax_rate_percentage', value: '16' },
    { key: 'service_charge_percentage', value: '10' },
    { key: 'receipt_footer_message', value: 'Thank you for dining with us!' }
  ]);
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('settings');
}