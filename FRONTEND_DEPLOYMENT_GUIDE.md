# 🚀 Frontend Deployment Guide for Render

## ✅ Frontend is Ready for Render Deployment

Your POS Mocha frontend has been configured to work with your backend at `https://mariahavensbackend.onrender.com`.

## 📋 What Was Updated

### ✅ Environment Configuration
- ✅ Updated `.env.production` with correct backend URL
- ✅ Fixed hardcoded API URLs in all components
- ✅ Updated Vite configuration for production builds
- ✅ Added proper environment variable handling

### ✅ Component Updates
- ✅ `StaffManagement.tsx` - Now uses environment variable
- ✅ `InventoryManagement.tsx` - All API calls use environment variable  
- ✅ `AdminDashboard.tsx` - API base URL from environment
- ✅ `AuthContext.tsx` - Already properly configured

### ✅ Build Configuration
- ✅ `vite.config.ts` - Optimized for production
- ✅ `package.json` - Added render-specific build script
- ✅ `render.yaml` - Configured as static site deployment
- ✅ `render-frontend.yaml` - Alternative static site config

## 🚀 Deployment Steps

### Option 1: Using render.yaml (Recommended)

1. **Connect Repository**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click **"New+"** → **"Web Service"**
   - Connect your GitHub repository

2. **Configure Service**
   - **Name**: `maria-havens-pos-frontend`
   - **Environment**: `Node`
   - **Region**: Choose your preferred region
   - **Branch**: `main`
   - **Build Command**: `npm install && VITE_API_URL=https://mariahavensbackend.onrender.com npm run build`
   - **Publish Directory**: `dist/client`

3. **Environment Variables** (Set in Render Dashboard)
   ```
   NODE_VERSION=20.11.1
   VITE_API_URL=https://mariahavensbackend.onrender.com
   NODE_ENV=production
   ```

4. **Deploy**
   - Click **"Create Static Site"**
   - Render will automatically build and deploy your frontend

### Option 2: Manual Configuration

If you don't want to use the YAML file:

1. Create a new **Static Site** on Render
2. Set **Build Command**: `npm install && VITE_API_URL=https://mariahavensbackend.onrender.com npm run build`
3. Set **Publish Directory**: `dist/client`
4. Add environment variables as listed above

## 🔧 Build Process

```bash
# 1. Install dependencies
npm install

# 2. Build with production API URL
VITE_API_URL=https://mariahavensbackend.onrender.com npm run build

# 3. Static files generated in dist/client/
```

## 📱 Frontend Features

### ✅ API Integration
- All components now use `VITE_API_URL` environment variable
- Fallback to localhost for development
- Proper error handling for API calls

### ✅ Routing & SPAs
- React Router configured for SPA behavior
- All routes redirect to `index.html` for client-side routing
- Proper 404 handling

### ✅ Performance Optimizations
- Static assets cached with long-term caching headers
- HTML files with proper cache-busting
- Vendor chunks separated for better caching

## 🌐 After Deployment

Your frontend will be available at your Render URL, e.g.:
`https://maria-havens-pos-frontend.onrender.com`

### ✅ Expected Behavior
- ✅ Frontend loads and displays login screen
- ✅ API calls reach backend at `https://mariahavensbackend.onrender.com`
- ✅ Authentication works with backend
- ✅ All CRUD operations functional
- ✅ Real-time features (if any) work with WebSockets

## 🔍 Testing After Deployment

1. **Open your frontend URL**
2. **Test login** with default credentials:
   - Admin: `admin` / `admin123` (PIN: 1234)
   - Manager: `john.manager` / `manager123` (PIN: 5678)
   - Waiter: `mary.waiter` / `waiter123` (PIN: 9012)

3. **Verify API connectivity**:
   - Open browser dev tools → Network tab
   - Login and check if API calls go to `mariahavensbackend.onrender.com`
   - All requests should return 200 status codes

## 🐛 Troubleshooting

### Build Failures
- Check that `VITE_API_URL` is set during build
- Verify Node.js version is 20.11.1 or higher
- Check build logs for TypeScript errors

### Runtime Issues
- Open browser console for JavaScript errors
- Check Network tab for failed API calls
- Verify backend is running at `https://mariahavensbackend.onrender.com`

### CORS Issues
Ensure your backend includes frontend domain in CORS settings:
```javascript
// In your backend
app.use(cors({
  origin: ['https://your-frontend.onrender.com'],
  credentials: true
}));
```

## 🎉 Deployment Complete!

Your frontend is now ready for production use on Render with proper backend connectivity.

---

**Next Steps:**
1. Deploy using one of the methods above
2. Test all functionality
3. Configure custom domain (optional)
4. Set up monitoring and alerts