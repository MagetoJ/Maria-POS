# Deployment Guide for Maria Havens POS

This guide covers deploying your POS system to Render.com.

## Prerequisites

1. A Render.com account
2. GitHub repository with your code
3. Environment variables configured

## Deployment Steps

### 1. Prepare Your Repository

Ensure all the files are committed to GitHub:
```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### 2. Deploy Backend (API Service)

1. Go to Render Dashboard → New → Web Service
2. Connect your GitHub repository
3. Configure the service:
   - **Name**: `pos-mocha-api`
   - **Environment**: `Node`
   - **Branch**: `main`
   - **Root Directory**: `server`
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `npm start`

4. Set Environment Variables:
   - `NODE_ENV` = `production`
   - `JWT_SECRET` = (Generate a secure random string)
   - `PORT` = `10000`

5. Deploy and wait for completion

### 3. Deploy Frontend (Static Site)

1. Go to Render Dashboard → New → Static Site
2. Connect your GitHub repository
3. Configure the service:
   - **Name**: `pos-mocha-frontend`
   - **Branch**: `main`
   - **Root Directory**: `/`
   - **Build Command**: `npm ci && npm run build`
   - **Publish Directory**: `./dist`

4. Set Environment Variables:
   - `VITE_API_URL` = Your backend service URL (e.g., `https://pos-mocha-api.onrender.com`)

5. Deploy and wait for completion

### 4. Update CORS Configuration

After frontend deployment, update your backend CORS settings:

1. Go to your backend service settings
2. Add the frontend URL to allowed origins:
   - Add your frontend URL to the CORS configuration

## Environment Variables Reference

### Backend (.env)
```
NODE_ENV=production
JWT_SECRET=your-super-secure-jwt-secret-here
PORT=10000
```

### Frontend (.env)
```
VITE_API_URL=https://your-backend-service.onrender.com
```

## Database Setup

The SQLite database will be initialized automatically on first deployment. The setup includes:
- All required tables
- Initial categories and products
- Default admin user
- Sample data

## Post-Deployment Checklist

1. ✅ Backend health check: `https://your-api-url.onrender.com/health`
2. ✅ Frontend loads properly
3. ✅ Login functionality works
4. ✅ API communication between frontend and backend
5. ✅ WebSocket connections for kitchen display
6. ✅ Mobile responsiveness on various devices

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure frontend URL is in backend CORS configuration
2. **Database Issues**: Check server logs for SQLite initialization errors
3. **Build Failures**: Verify all dependencies are in package.json
4. **API Connection**: Verify VITE_API_URL is correctly set in frontend

### Useful Commands

```bash
# Test API health
curl https://your-api-url.onrender.com/health

# Check build locally
npm run build

# Preview build locally
npm run preview
```

## Performance Optimization

- Static assets are optimized automatically
- Code splitting is configured for better loading
- Images should be optimized before upload
- Consider enabling Render's CDN for faster asset delivery

## Security Considerations

- JWT_SECRET should be a strong, unique value
- Database is SQLite (suitable for small-medium deployments)
- HTTPS is enabled by default on Render
- Regular security updates should be applied

## Scaling

For high traffic, consider:
- Upgrading to PostgreSQL
- Using Render's autoscaling features
- Implementing Redis for session management
- Adding monitoring and alerting