# Maria Havens POS - Deployment Guide

## Single Web Service Deployment

This POS system is configured to run as a single web service that serves both the React frontend and Express.js backend.

### Architecture
- **Frontend**: React + Vite (built to `dist/client/`)
- **Backend**: Express.js + TypeScript (built to `server/dist/`)
- **Database**: PostgreSQL
- **Static Files**: Served by Express from the built frontend

### Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development servers:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

4. Start production server:
   ```bash
   npm start
   ```

### Render Deployment

#### Prerequisites
1. Create a Render account
2. Create a PostgreSQL database service on Render
3. Fork/upload this repository to GitHub

#### Deployment Steps

1. **Create Web Service**:
   - Connect your GitHub repository
   - Choose "Web Service"
   - Set the following build settings:
     - **Build Command**: `npm install && npm run build`
     - **Start Command**: `npm start`
     - **Environment**: Node

2. **Environment Variables**:
   Set these in Render dashboard:
   ```
   NODE_ENV=production
   PORT=10000
   DATABASE_URL=[Auto-filled by Render PostgreSQL service]
   JWT_SECRET=[Generate a secure random string]
   ```

3. **Database Connection**:
   - Link your PostgreSQL database service
   - The `DATABASE_URL` will be automatically provided

#### Configuration Files
- `render.yaml` - Render service configuration
- `server/.env.production` - Production environment template
- `server/src/db.ts` - Database connection with environment variables

### Build Output
- Frontend assets: `dist/client/`
- Backend compiled JS: `server/dist/`
- The Express server serves static files from `dist/client/`

### Database Migration
Run your database migrations after deployment:
```bash
# Connect to your Render service shell and run:
npm run migrate  # (if you have migration scripts)
```

### Troubleshooting

1. **Build Failures**: Check that all dependencies are installed
2. **Database Connection**: Verify `DATABASE_URL` is set correctly
3. **Static File Issues**: Ensure frontend builds to `dist/client/`
4. **Port Issues**: Render automatically sets PORT, don't override it locally

### Performance Notes
- Frontend is optimized with Vite production build
- PWA support included with service worker
- Static assets are served with proper caching headers