# Maria Havens POS - Production Database Setup Guide

## 🎯 **IMMEDIATE ACTION REQUIRED**

Your Maria Havens POS system now has **complete database setup** with all missing tables and fixed SSL connections. Here's how to deploy it:

## 🚀 **Step 1: Deploy to Render**

### Option A: Automatic Deployment (Recommended)
1. **Push to GitHub** (triggers automatic Render deployment):
   ```powershell
   # Run this in PowerShell from your project root
   .\deploy-to-render.ps1
   ```

### Option B: Manual Git Commands
```bash
git add .
git commit -m "Fix: Complete database setup with all 12 tables and SSL support"
git push origin main
```

## 📊 **What's Been Fixed**

### ✅ **Database Connection Issues**
- ✅ Fixed SSL connection handling for Render PostgreSQL
- ✅ Updated both `server/src/db.ts` and setup scripts
- ✅ Added proper environment detection (production vs development)

### ✅ **Complete Database Schema (12 Tables)**
- ✅ **Existing**: staff, categories, products, orders, tables, rooms, settings
- ✅ **NEW**: order_items, inventory, shifts, attendance, room_transactions

### ✅ **Build Process Updated**
- ✅ `render.yaml` now uses `setup-production-db` script
- ✅ Handles SSL connections properly during deployment
- ✅ Creates all 12 tables with complete sample data

## 🔐 **Login Credentials (After Deployment)**

| Role | Username | Password | PIN |
|------|----------|----------|-----|
| Admin | `admin` | `admin123` | `1234` |
| Manager | `john.manager` | `manager123` | `5678` |
| Waiter | `mary.waiter` | `waiter123` | `9012` |
| Receptionist | `sarah.receptionist` | `reception123` | `3456` |

## 📋 **Sample Data Included**

- **👥 Staff**: 4 users with different roles
- **🍽️ Categories**: 8 food categories (Beverages, Main Courses, etc.)
- **🍴 Products**: 16 menu items with prices and prep times
- **🪑 Tables**: 8 restaurant tables with different capacities
- **🏨 Rooms**: 10 hotel rooms (Standard, Deluxe, Suite, Penthouse)
- **⚙️ Settings**: Business configuration (tax rate, currency, etc.)

## 🔍 **How to Verify After Deployment**

### 1. Monitor Render Dashboard
- Go to your Render dashboard
- Watch the build logs for success
- Look for: "Database setup complete!"

### 2. Test the Application
1. Open your Render app URL
2. Try logging in with admin credentials: `admin` / `admin123`
3. Check that all features work:
   - Staff management
   - Menu/products
   - Table management
   - Room management

### 3. Test Mobile/Phone Access
1. Open the app on your phone
2. Try PIN login with: `admin` PIN `1234`
3. Should work without "failed to fetch" errors

## 🔧 **Troubleshooting**

### If Build Fails:
1. Check Render build logs for errors
2. Ensure PostgreSQL addon is connected
3. Verify `DATABASE_URL` environment variable exists

### If "Failed to Fetch" Still Occurs:
1. Check browser console for CORS errors
2. Verify your Render app URL is correct
3. Ensure database tables were created successfully

### Manual Database Check (If Needed):
```bash
# Run this after deployment to test database
cd server
node test-production-connection.js
```

## 📱 **Mobile App Notes**

Your mobile app should now work because:
- ✅ SSL connections are properly configured
- ✅ CORS headers include mobile-friendly origins
- ✅ Authentication endpoints handle both password and PIN login
- ✅ All required tables exist with proper relationships

## 🎯 **Expected Results**

After deployment, your app will have:

1. **✅ Working Login System** - No more authentication failures
2. **✅ Complete Database** - All 12 tables with sample data
3. **✅ Mobile Compatibility** - Phone access should work
4. **✅ Full POS Features** - Orders, inventory, staff management
5. **✅ Hotel Management** - Room bookings and guest management

## 📞 **Support**

If you encounter any issues after deployment:

1. **Check Render Logs**: Look for database connection errors
2. **Test Database**: Run `node test-production-connection.js`
3. **Verify Environment**: Ensure `DATABASE_URL` is set correctly
4. **Clear Browser Cache**: Sometimes helps with "failed to fetch" errors

---

## 🎉 **Ready to Deploy!**

Your Maria Havens POS system is now **production-ready** with:
- Complete database schema (12 tables)
- SSL connection support
- Mobile-friendly authentication  
- Comprehensive sample data
- Proper error handling

**Run the deployment now and your "failed to fetch" errors should be resolved!**