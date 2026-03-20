import db from './src/db';

async function run() {
  try {
    console.log('Running migrations...');
    
    const hasCompletedBy = await db.schema.hasColumn('orders', 'completed_by');
    if (!hasCompletedBy) {
      await db.schema.alterTable('orders', (table) => {
        table.integer('completed_by').unsigned().references('id').inTable('staff').onDelete('SET NULL');
      });
      console.log('✅ Added completed_by column to orders');
    }

    const hasTransactionCode = await db.schema.hasColumn('payments', 'transaction_code');
    if (!hasTransactionCode) {
      await db.schema.alterTable('payments', (table) => {
        table.text('transaction_code');
      });
      console.log('✅ Added transaction_code column to payments');
    }

    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

run();
