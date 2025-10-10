# 🚀 Quick Deployment Commands

## **GitHub Setup Commands:**

```powershell
# Navigate to project
cd "c:\Users\DELL\Desktop\POS Mocha"

# Initialize git (if needed)
git init

# Add all files
git add .

# Initial commit
git commit -m "Initial commit: Maria-POS ready for Render deployment"

# Add GitHub remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/maria-pos-render.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## **Test Builds Locally:**

```powershell
# Test frontend build
npm run build:frontend

# Test backend build
npm run build:backend

# Verify deployment readiness
node verify-deployment.cjs
```

## **Update Frontend Config Commands:**

```powershell
# After getting backend URL, update .env.production
# Then rebuild and push
npm run build:frontend
git add .env.production dist/
git commit -m "Update frontend config with production backend URL"
git push origin main
```

## **Render Configuration Values:**

### **Backend Service:**
- **Root Directory:** `server`
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`

**Environment Variables:**
```
NODE_ENV=production
PORT=10000
DATABASE_PATH=/opt/render/project/src/server/database/pos.sqlite3
ALLOWED_ORIGINS=https://your-frontend-name.onrender.com
```

### **Frontend Static Site:**
- **Root Directory:** (empty)
- **Build Command:** `npm install && npm run build:frontend`
- **Publish Directory:** `dist/client`

**Environment Variables:**
```
VITE_API_URL=https://your-backend-name.onrender.com
```