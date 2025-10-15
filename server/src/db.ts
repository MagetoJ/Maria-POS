import knex from 'knex';
import dotenv from 'dotenv';
import path from 'path';

// Load environment-specific configuration
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
dotenv.config({ path: path.join(__dirname, '..', envFile) });

const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🔗 Database URL configured: ${process.env.DATABASE_URL ? 'Yes' : 'No'}`);

// Enhanced database configuration with better environment detection
const getDatabaseConfig = () => {
  if (process.env.DATABASE_URL) {
    // Use DATABASE_URL (for both development and production)
    console.log('🗄️ Using DATABASE_URL connection');
    return {
      client: 'pg',
      connection: {
        connectionString: process.env.DATABASE_URL,
        ssl: isProduction ? { rejectUnauthorized: false } : false
      },
      pool: {
        min: isProduction ? 2 : 1,
        max: isProduction ? 10 : 5,
        createTimeoutMillis: 30000,
        acquireTimeoutMillis: 60000,
        idleTimeoutMillis: 600000,
        reapIntervalMillis: 1000,
        createRetryIntervalMillis: 100,
        propagateCreateError: false
      },
      debug: isDevelopment
    };
  } else {
    // Fallback to individual connection parameters (legacy support)
    console.log('🗄️ Using individual connection parameters');
    return {
      client: 'pg',
      connection: {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'pos_mocha_dev',
        port: parseInt(process.env.DB_PORT || '5432'),
        ssl: false
      },
      debug: isDevelopment
    };
  }
};

const db = knex(getDatabaseConfig());

// Enhanced connection testing with retry logic
const testConnection = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await db.raw('SELECT 1+1 as result');
      console.log('✅ Database connected successfully');
      if (isProduction) {
        console.log('🗄️ Production database connection established');
      }
      return true;
    } catch (err: any) {
      console.error(`❌ Database connection attempt ${i + 1} failed:`, err.message);
      if (i === retries - 1) {
        console.error('💥 All database connection attempts failed');
        if (isProduction) {
          console.error('🚨 Production database connection failed - check DATABASE_URL');
        }
      } else {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
      }
    }
  }
  return false;
};

// Test connection on startup
testConnection();

export default db;