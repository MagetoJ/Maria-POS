#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Maria Havens POS - Render Deployment Checklist\n');

const checks = [
  {
    name: 'Server package.json has ws dependency',
    check: () => {
      const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'server', 'package.json'), 'utf8'));
      return pkg.dependencies.ws;
    }
  },
  {
    name: 'render.yaml exists',
    check: () => fs.existsSync(path.join(__dirname, 'render.yaml'))
  },
  {
    name: 'Production environment file exists',
    check: () => fs.existsSync(path.join(__dirname, '.env.production'))
  },
  {
    name: 'Dockerfile exists',
    check: () => fs.existsSync(path.join(__dirname, 'Dockerfile'))
  },
  {
    name: 'Server has health check endpoint',
    check: () => {
      const indexFile = fs.readFileSync(path.join(__dirname, 'server', 'src', 'index.ts'), 'utf8');
      return indexFile.includes('/health');
    }
  },
  {
    name: 'Tailwind config has mobile-first setup',
    check: () => {
      const tailwindFile = fs.readFileSync(path.join(__dirname, 'tailwind.config.js'), 'utf8');
      return tailwindFile.includes('touch') && tailwindFile.includes('xs');
    }
  },
  {
    name: 'Main CSS has mobile styles',
    check: () => {
      const cssFile = fs.readFileSync(path.join(__dirname, 'src', 'react-app', 'index.css'), 'utf8');
      return cssFile.includes('min-h-touch') && cssFile.includes('webkit-text-size-adjust');
    }
  },
  {
    name: 'HTML has proper viewport meta',
    check: () => {
      const htmlFile = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
      return htmlFile.includes('user-scalable=no') && htmlFile.includes('mobile-web-app-capable');
    }
  }
];

let passed = 0;
let failed = 0;

checks.forEach(({ name, check }) => {
  try {
    if (check()) {
      console.log(`✅ ${name}`);
      passed++;
    } else {
      console.log(`❌ ${name}`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ ${name} (Error: ${error.message})`);
    failed++;
  }
});

console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);

if (failed === 0) {
  console.log('🎉 All checks passed! Your project is ready for Render deployment.\n');
  console.log('Next steps:');
  console.log('1. Push your code to GitHub');
  console.log('2. Connect your repo to Render');
  console.log('3. Use the render.yaml file for Blueprint deployment');
  console.log('4. Set environment variables in Render dashboard');
} else {
  console.log('⚠️  Some checks failed. Please fix the issues above before deploying.');
}

console.log('\n🔗 Deployment URLs (after deployment):');
console.log('Backend: https://pos-mocha-api.onrender.com');
console.log('Frontend: https://pos-mocha-frontend.onrender.com');
console.log('Health Check: https://pos-mocha-api.onrender.com/health');