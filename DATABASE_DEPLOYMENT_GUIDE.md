# Database Deployment Guide

## Overview

This guide explains how to manage database schema changes for both development and production environments. The system is configured to use separate databases for development and production.

## Database Configuration

### Development Environment
- Uses local PostgreSQL database: `postgresql://postgres:postgres@localhost:5432/pos_mocha_dev`
- Configured in `server/.env` file
- Debug mode enabled for detailed logging

### Production Environment  
- Uses Render PostgreSQL database: `postgresql://mariahavens_user:BvEnYG8hb7baKudACcyxLuGkNgpxqloT@dpg-d3l72s3uibrs73cf7l60-a.oregon-postgres.render.com/mariahavens`
- Configured in `server/.env.production` file
- SSL enabled with proper certificates

## Development Workflow

### 1. Local Development and Testing

First, ensure all features work locally:

```powershell
# Navigate to server directory
cd "c:\Users\DELL\Desktop\POS Mocha\server"

# Run latest migrations on development database
npm run migrate:dev

# Add image columns if missing
npm run fix-images:dev

# Seed the database with sample data
npm run seed:dev

# Start development server
npm run dev
```

### 2. Test All Features

Verify these features work properly:
- ✅ Adding inventory items with images
- ✅ Adding products with images  
- ✅ Adding rooms with images
- ✅ User authentication and roles
- ✅ Dashboard functionality
- ✅ Order management
- ✅ Reports generation

### 3. Frontend Testing

```powershell
# In the root directory, start the frontend
cd "c:\Users\DELL\Desktop\POS Mocha"
npm run dev
```

Test the complete application flow:
- Login with different user roles
- Create products with image uploads
- Manage inventory items
- Test all CRUD operations

## Production Deployment

**Only proceed after all features are verified locally!**

### 1. Update Production Database Schema

```powershell
# Navigate to server directory
cd "c:\Users\DELL\Desktop\POS Mocha\server"

# Run migrations on production database
npm run migrate:prod

# Add image columns to production database
npm run fix-images:prod

# Optional: Run setup script for comprehensive database setup
npm run setup-render
```

### 2. Deploy Application to Render

After database schema is updated:

1. **Push changes to Git repository**
2. **Trigger Render deployment** 
3. **Verify production deployment**

### 3. Verify Production Environment

Check that production environment variables are set correctly in Render dashboard:

- `NODE_ENV=production`
- `DATABASE_URL=postgresql://mariahavens_user:BvEnYG8hb7baKudACcyxLuGkNgpxqloT@dpg-d3l72s3uibrs73cf7l60-a.oregon-postgres.render.com/mariahavens`
- `JWT_SECRET=Lokeshen@345`
- `PORT=10000`

## Database Schema Changes

### Current Issues Fixed

1. **Missing Image Columns**: Added `image_url` column to:
   - `products` table (for menu items)
   - `inventory_items` table (for inventory management)
   - `rooms` table (for room photos)

2. **Environment Detection**: Enhanced database connection to properly detect development vs production environments

3. **SSL Configuration**: Proper SSL settings for Render PostgreSQL connection

### New Migration Added

- `20241226000000_ensure_products_image_column.js`
- Safely adds image_url columns to all relevant tables
- Includes proper indexes for performance
- Idempotent - won't fail if columns already exist

## Available Scripts

### Development Scripts
```powershell
npm run migrate:dev      # Run migrations (development)
npm run seed:dev         # Run seeds (development)  
npm run fix-images:dev   # Add missing image columns (development)
npm run db:reset:dev     # Reset and rebuild dev database
```

### Production Scripts
```powershell
npm run migrate:prod     # Run migrations (production)
npm run seed:prod        # Run seeds (production)
npm run fix-images:prod  # Add missing image columns (production) 
npm run setup-render     # Complete production database setup
```

## Troubleshooting

### Database Connection Issues
1. Verify environment variables are correct
2. Check network connectivity to database
3. Ensure PostgreSQL service is running (for development)
4. Verify SSL configuration for production

### Migration Issues
1. Check migration files for syntax errors
2. Verify database permissions
3. Review migration logs for specific errors
4. Use rollback if needed: `npx knex migrate:rollback`

### Image Upload Issues
1. Verify `image_url` columns exist in database
2. Check file upload permissions
3. Validate image storage configuration

## Security Notes

- Database credentials are stored in environment files
- Production credentials should never be committed to Git
- Use Render environment variables for sensitive data
- Regularly rotate database passwords

## Next Steps

After successful deployment:
1. Monitor application logs
2. Test all features in production environment
3. Set up automated backups
4. Configure monitoring and alerting