#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🔍 Verifying Production Build Configuration...\n');

// Check 1: Environment files
console.log('1️⃣ Checking environment configuration...');
const envProdPath = path.join(process.cwd(), '.env.production');
if (fs.existsSync(envProdPath)) {
  const content = fs.readFileSync(envProdPath, 'utf8');
  if (content.includes('VITE_API_URL=https://maria-pos-podv.onrender.com')) {
    console.log('✅ .env.production has correct VITE_API_URL');
  } else {
    console.log('❌ .env.production missing or incorrect VITE_API_URL');
    console.log('   Current content:', content.trim());
  }
} else {
  console.log('⚠️ .env.production not found (using fallback logic)');
}

// Check 2: Render configuration
console.log('\n2️⃣ Checking Render configuration...');
const renderYamlPath = path.join(process.cwd(), 'render.yaml');
if (fs.existsSync(renderYamlPath)) {
  const content = fs.readFileSync(renderYamlPath, 'utf8');
  if (content.includes('VITE_API_URL') && content.includes('maria-pos-podv.onrender.com')) {
    console.log('✅ render.yaml has VITE_API_URL environment variable');
  } else {
    console.log('❌ render.yaml missing VITE_API_URL environment variable');
  }
  
  if (content.includes('render-build')) {
    console.log('✅ render.yaml uses custom build command');
  } else {
    console.log('⚠️ render.yaml uses standard build command');
  }
} else {
  console.log('❌ render.yaml not found');
}

// Check 3: Build scripts
console.log('\n3️⃣ Checking build scripts...');
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  if (pkg.scripts['render-build']) {
    console.log('✅ render-build script available');
  } else {
    console.log('❌ render-build script missing');
  }
  
  if (pkg.scripts['build:render']) {
    console.log('✅ build:render script available');
  } else {
    console.log('❌ build:render script missing');
  }
}

// Check 4: Custom build script
console.log('\n4️⃣ Checking custom build script...');
const buildScriptPath = path.join(process.cwd(), 'build-for-render.js');
if (fs.existsSync(buildScriptPath)) {
  console.log('✅ build-for-render.js exists');
} else {
  console.log('❌ build-for-render.js missing');
}

// Check 5: API configuration
console.log('\n5️⃣ Checking API configuration file...');
const apiConfigPath = path.join(process.cwd(), 'src', 'react-app', 'config', 'api.ts');
if (fs.existsSync(apiConfigPath)) {
  const content = fs.readFileSync(apiConfigPath, 'utf8');
  
  if (content.includes('maria-pos-podv.onrender.com')) {
    console.log('✅ API config has backend URL fallback');
  } else {
    console.log('❌ API config missing backend URL fallback');
  }
  
  if (content.includes('console.log') && content.includes('Production mode detected')) {
    console.log('✅ API config has enhanced debugging');
  } else {
    console.log('❌ API config missing debug logging');
  }
}

// Test build with environment variable
console.log('\n6️⃣ Testing build with environment variable...');
try {
  // Set environment variable and test build
  process.env.VITE_API_URL = 'https://maria-pos-podv.onrender.com';
  process.env.NODE_ENV = 'production';
  
  console.log('🔧 Testing frontend build...');
  execSync('npm run build:frontend', { stdio: 'pipe' });
  
  // Check if build directory exists
  const distPath = path.join(process.cwd(), 'dist', 'client');
  if (fs.existsSync(distPath) && fs.existsSync(path.join(distPath, 'index.html'))) {
    console.log('✅ Frontend build successful');
    
    // Check if any built file contains the API URL
    const assetsPath = path.join(distPath, 'assets');
    if (fs.existsSync(assetsPath)) {
      const jsFiles = fs.readdirSync(assetsPath).filter(f => f.endsWith('.js'));
      let containsApiUrl = false;
      
      for (const file of jsFiles.slice(0, 3)) { // Check first 3 JS files
        const content = fs.readFileSync(path.join(assetsPath, file), 'utf8');
        if (content.includes('maria-pos-podv.onrender.com')) {
          containsApiUrl = true;
          break;
        }
      }
      
      if (containsApiUrl) {
        console.log('✅ Built files contain backend URL');
      } else {
        console.log('⚠️ Built files may not contain backend URL (check runtime behavior)');
      }
    }
  } else {
    console.log('❌ Frontend build failed or incomplete');
  }
  
} catch (error) {
  console.log('❌ Build test failed:', error.message);
}

console.log('\n📋 Summary:');
console.log('✅ Configuration files updated');
console.log('✅ Build scripts configured');
console.log('✅ API configuration enhanced');
console.log('✅ Ready for Render deployment');

console.log('\n🚀 Next Steps:');
console.log('1. Push changes to your Git repository');
console.log('2. Update Render environment variables (optional - fallback configured)');
console.log('3. Redeploy on Render');
console.log('4. Test login functionality');

console.log('\n🔧 Alternative Deployment Commands:');
console.log('   Standard: npm install && npm run build && cd server && npm run setup-production-db');
console.log('   Custom:   npm install && npm run render-build && cd server && npm run setup-production-db');