#!/usr/bin/env node

// Build script for Render deployment
// This ensures environment variables are properly set during build

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Starting Render build process...');

// Set environment variables for build
process.env.NODE_ENV = 'production';
process.env.VITE_API_URL = 'https://maria-pos-podv.onrender.com';

console.log('🔧 Environment variables set:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('VITE_API_URL:', process.env.VITE_API_URL);

try {
  // Install frontend dependencies
  console.log('📦 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });

  // Build frontend
  console.log('🔨 Building frontend...');
  execSync('npm run build:frontend', { stdio: 'inherit' });

  // Verify build output
  const distDir = path.join(process.cwd(), 'dist', 'client');
  if (fs.existsSync(distDir)) {
    console.log('✅ Frontend build complete');
    console.log('📁 Build output directory:', distDir);
    
    // List build files
    const files = fs.readdirSync(distDir);
    console.log('📄 Build files:', files.slice(0, 10));
  } else {
    throw new Error('Build directory not found');
  }

  // Install backend dependencies
  console.log('📦 Installing backend dependencies...');
  execSync('cd server && npm install', { stdio: 'inherit' });

  // Build backend
  console.log('🔨 Building backend...');
  execSync('npm run build:backend', { stdio: 'inherit' });

  console.log('✅ Render build process completed successfully!');
  
} catch (error) {
  console.error('❌ Build process failed:', error.message);
  process.exit(1);
}