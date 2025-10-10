# Maria-POS Render Deployment Guide

This project is configured for deployment on Render using the **Option A: Separate Frontend & Backend** approach.

## Project Structure

```
root/
  src/
    react-app/       <- Frontend (React + Vite)
    @/config/         <- API configuration
  server/
    src/            <- Backend (Node.js + Express + TypeScript)
    database/       <- SQLite database
  dist/
    client/         <- Built frontend files
  server/dist/      <- Built backend files
```

## Prerequisites

1. GitHub repository with your code
2. Render account (free tier available)

## Step 1: Deploy Backend on Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure the backend service:

### Backend Configuration
- **Name**: `maria-pos-backend`
- **Region**: Oregon (US West)
- **Root Directory**: `server`
- **Runtime**: Node.js
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

### Backend Environment Variables
Set these in the Render dashboard:
- `NODE_ENV`: `production`
- `PORT`: `10000` (Render default)
- `FRONTEND_URL`: `https://maria-pos.onrender.com` (update with your frontend URL)
- `JWT_SECRET`: Generate a secure random string

4. Click **"Create Web Service"**
5. Note the backend URL (e.g., `https://api-maria-pos.onrender.com`)

## Step 2: Deploy Frontend on Render

1. Go to Render Dashboard → **"New"** → **"Static Site"**
2. Connect the same GitHub repository
3. Configure the frontend service:

### Frontend Configuration
- **Name**: `maria-pos-frontend`
- **Root Directory**: `.` (project root)
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist/client`

### Frontend Environment Variables
- `VITE_API_URL`: `https://api-maria-pos.onrender.com` (your backend URL)

4. Click **"Create Static Site"**

## Step 3: Update Environment Configuration

### Update Backend CORS

In your `server/src/index.ts`, update the allowed origins:

```typescript
const allowedOrigins = [
  'http://localhost:5173', 
  'http://localhost:3000', 
  'http://localhost:5174',
  'https://maria-pos.com',
  'https://maria-pos.onrender.com', // Your frontend URL
  process.env.FRONTEND_URL
];
```

### Update Frontend API URL

In your `.env.production`:

```env
VITE_API_URL=https://api-maria-pos.onrender.com
```

## Step 4: Custom Domains (Optional)

After deployment works with Render subdomains:

1. **Backend**: Add custom domain `api.maria-pos.com`
2. **Frontend**: Add custom domain `maria-pos.com`
3. Update CORS and environment variables accordingly

## Testing the Deployment

1. **Backend Health Check**: Visit `https://api-maria-pos.onrender.com/health`
2. **Frontend**: Visit `https://maria-pos.onrender.com`
3. **Test Login**: Try logging in to verify frontend-backend communication

## Deployment Commands (Local Testing)

```bash
# Test frontend build
npm run build

# Test backend build
cd server
npm run build

# Test backend locally
npm run dev
```

## Troubleshooting

### CORS Issues
- Ensure backend `allowedOrigins` includes your frontend domain
- Check environment variables are set correctly

### Build Issues
- Check Node.js version compatibility (18.x required)
- Verify all dependencies are in `package.json`
- Check TypeScript configuration

### Database Issues
- SQLite database is included in the repository
- Database migrations run automatically on startup
- Check server logs in Render dashboard

## Files Structure Summary

### Root package.json
- Contains frontend build scripts
- Dependencies for React/Vite

### server/package.json  
- Contains backend build scripts
- Dependencies for Express/Node.js

### Key Configuration Files
- `vite.config.ts` - Frontend build configuration
- `server/tsconfig.json` - Backend TypeScript config
- `.env.production` - Production environment variables

## Auto-Deployment

Both services will automatically redeploy when you push to your GitHub repository's main branch.