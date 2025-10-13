#!/usr/bin/env node

// Test script to verify API configuration
// This simulates how the frontend will resolve the API URL in production

console.log('🧪 Testing API URL Resolution...\n');

// Simulate production environment
const mockEnv = {
  PROD: true,
  DEV: false,
  MODE: 'production',
  VITE_API_URL: 'https://maria-pos-podv.onrender.com'
};

// Simulate window object for different hostnames
const testHostnames = [
  'maria-pos-podv.onrender.com',
  'mariahavensfrontend.onrender.com',
  'mariahavens.com',
  'localhost'
];

function simulateGetApiUrl(hostname, viteApiUrl) {
  const env = { ...mockEnv, VITE_API_URL: viteApiUrl };
  
  // Replicate the logic from api.ts
  if (env.VITE_API_URL) {
    return env.VITE_API_URL;
  }
  
  if (env.PROD) {
    console.log('🔍 Production mode detected:', {
      hostname,
      VITE_API_URL: env.VITE_API_URL,
      NODE_ENV: env.NODE_ENV,
      MODE: env.MODE
    });
    
    if (hostname.includes('mariahavens.com')) {
      return 'https://maria-pos-podv.onrender.com';
    }
    
    if (hostname.includes('onrender.com')) {
      if (hostname === 'maria-pos-podv.onrender.com') {
        return '';
      }
      return 'https://maria-pos-podv.onrender.com';
    }
    
    return 'https://maria-pos-podv.onrender.com';
  }
  
  return 'http://localhost:3000';
}

// Test with VITE_API_URL set
console.log('🎯 Test 1: With VITE_API_URL set');
for (const hostname of testHostnames) {
  const result = simulateGetApiUrl(hostname, 'https://maria-pos-podv.onrender.com');
  console.log(`   ${hostname}: ${result || '(empty - uses relative paths)'}`);
}

console.log('\n❌ Test 2: Without VITE_API_URL (fallback behavior)');
for (const hostname of testHostnames) {
  const result = simulateGetApiUrl(hostname, undefined);
  console.log(`   ${hostname}: ${result || '(empty - uses relative paths)'}`);
}

console.log('\n✅ Expected behavior:');
console.log('   - All production environments should get: https://maria-pos-podv.onrender.com');
console.log('   - OR use relative paths when served from same domain');
console.log('   - Never use localhost in production');

console.log('\n🔧 Recommendations:');
console.log('   1. Always set VITE_API_URL in production builds');
console.log('   2. Use full backend URL in environment variables');
console.log('   3. Test with build environment before deploying');