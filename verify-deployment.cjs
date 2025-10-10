#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Maria-POS Render Deployment Verification\n');

const checks = [
  {
    name: 'Frontend build output',
    path: 'dist/client/index.html',
    type: 'file'
  },
  {
    name: 'Frontend assets',
    path: 'dist/client/assets',
    type: 'directory'
  },
  {
    name: 'Backend build output',
    path: 'server/dist/index.js',
    type: 'file'
  },
  {
    name: 'Backend package.json',
    path: 'server/package.json',
    type: 'file'
  },
  {
    name: 'Database file',
    path: 'server/database/pos.sqlite3',
    type: 'file'
  },
  {
    name: 'Frontend production env',
    path: '.env.production',
    type: 'file'
  },
  {
    name: 'Backend production env',
    path: 'server/.env.production',
    type: 'file'
  }
];

let allPassed = true;

checks.forEach(check => {
  const fullPath = path.resolve(__dirname, check.path);
  let exists = false;
  
  try {
    const stats = fs.statSync(fullPath);
    exists = check.type === 'file' ? stats.isFile() : stats.isDirectory();
  } catch (err) {
    exists = false;
  }
  
  const status = exists ? '✅' : '❌';
  console.log(`${status} ${check.name}: ${check.path}`);
  
  if (!exists) {
    allPassed = false;
  }
});

console.log('\n📋 Configuration Check:');

// Check package.json scripts
try {
  const pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'package.json'), 'utf8'));
  const hasRenderBuild = pkg.scripts && pkg.scripts['render-build'];
  console.log(`${hasRenderBuild ? '✅' : '❌'} Frontend render-build script`);
  
  if (!hasRenderBuild) allPassed = false;
} catch (err) {
  console.log('❌ Error reading frontend package.json');
  allPassed = false;
}

// Check server package.json scripts
try {
  const serverPkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'server/package.json'), 'utf8'));
  const hasStart = serverPkg.scripts && serverPkg.scripts['start'];
  const hasBuild = serverPkg.scripts && serverPkg.scripts['build'];
  
  console.log(`${hasBuild ? '✅' : '❌'} Backend build script`);
  console.log(`${hasStart ? '✅' : '❌'} Backend start script`);
  
  if (!hasStart || !hasBuild) allPassed = false;
} catch (err) {
  console.log('❌ Error reading backend package.json');
  allPassed = false;
}

console.log('\n🎯 Render Deployment Instructions:');
console.log('');
console.log('Frontend (Static Site):');
console.log('  - Root Directory: .');
console.log('  - Build Command: npm install && npm run build');
console.log('  - Publish Directory: dist/client');
console.log('  - Environment: VITE_API_URL=https://your-backend-url.onrender.com');
console.log('');
console.log('Backend (Web Service):');
console.log('  - Root Directory: server');
console.log('  - Build Command: npm install && npm run build');
console.log('  - Start Command: npm start');
console.log('  - Environment: NODE_ENV=production, PORT=10000');
console.log('');

if (allPassed) {
  console.log('🎉 All checks passed! Your project is ready for Render deployment.');
  process.exit(0);
} else {
  console.log('⚠️  Some checks failed. Please fix the issues above before deploying.');
  process.exit(1);
}