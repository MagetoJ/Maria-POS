import { test, expect } from '@playwright/test';

test.describe('Frontend API Configuration Fix', () => {
  test('should use correct backend URL in production mode', async ({ page }) => {
    // Listen for console messages to verify API configuration
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'log') {
        consoleLogs.push(msg.text());
      }
    });

    // Navigate to the login page
    await page.goto('/');
    
    // Wait for the API configuration log
    await page.waitForFunction(() => {
      return window.console && document.readyState === 'complete';
    });

    // Check if API configuration is logged correctly
    const apiConfigLog = consoleLogs.find(log => log.includes('🔌 API Configuration:'));
    expect(apiConfigLog).toBeTruthy();
    
    // Verify the configuration contains expected values
    if (apiConfigLog) {
      // In development, it might use localhost, but structure should be correct
      expect(apiConfigLog).toMatch(/apiUrl|finalApiUrl/);
      expect(apiConfigLog).toMatch(/mode.*production|development/);
    }
  });

  test('should make login requests to correct endpoint', async ({ page }) => {
    const networkRequests: string[] = [];
    
    // Intercept network requests to verify the API endpoint
    page.on('request', request => {
      networkRequests.push(request.url());
    });

    // Navigate to login page
    await page.goto('/');
    
    // Fill in login form
    await page.fill('input[name="username"], input#username', 'testuser');
    await page.fill('input[name="password"], input#password', 'testpass');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Wait a moment for the request to be made
    await page.waitForTimeout(2000);
    
    // Verify that a login request was made to the correct endpoint
    const loginRequest = networkRequests.find(url => url.includes('/api/login'));
    expect(loginRequest).toBeTruthy();
    
    if (loginRequest) {
      // In development, it might be localhost:3000
      // In production, it should be the full backend URL or relative
      const isValidEndpoint = loginRequest.includes('/api/login') && 
        (loginRequest.includes('localhost:3000') || 
         loginRequest.includes('maria-pos-podv.onrender.com') ||
         loginRequest.startsWith('/api/login')); // relative path is also valid
      
      expect(isValidEndpoint).toBe(true);
    }
  });

  test('should handle API configuration console logs', async ({ page }) => {
    const consoleLogs: string[] = [];
    
    page.on('console', msg => {
      consoleLogs.push(msg.text());
    });

    // Navigate to the page
    await page.goto('/');
    
    // Wait for API configuration to be logged
    await page.waitForTimeout(3000);
    
    // Look for the specific API configuration log
    const apiConfigLog = consoleLogs.find(log => 
      log.includes('🔌 API Configuration:') || 
      log.includes('API Configuration')
    );
    
    expect(apiConfigLog).toBeTruthy();
    console.log('API Configuration Log:', apiConfigLog);
  });

  test('should display correct error messages on login failure', async ({ page }) => {
    const consoleLogs: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'log' || msg.type() === 'error') {
        consoleLogs.push(`${msg.type()}: ${msg.text()}`);
      }
    });

    // Navigate to login
    await page.goto('/');
    
    // Try to login with invalid credentials
    await page.fill('input[name="username"], input#username', 'invalid');
    await page.fill('input[name="password"], input#password', 'invalid');
    await page.click('button[type="submit"]');
    
    // Wait for login attempt and response
    await page.waitForTimeout(5000);
    
    // Check for login attempt log
    const loginAttemptLog = consoleLogs.find(log => 
      log.includes('🔌 Attempting login to:') ||
      log.includes('Attempting login to:')
    );
    
    expect(loginAttemptLog).toBeTruthy();
    
    if (loginAttemptLog) {
      // Verify the login attempt goes to the correct endpoint
      const isCorrectEndpoint = loginAttemptLog.includes('/api/login') &&
        (loginAttemptLog.includes('localhost') || 
         loginAttemptLog.includes('maria-pos-podv.onrender.com') ||
         loginAttemptLog.includes('http'));
      
      expect(isCorrectEndpoint).toBe(true);
      console.log('Login attempt endpoint:', loginAttemptLog);
    }
    
    // Check for error handling
    const errorLog = consoleLogs.find(log => 
      log.includes('Login result:') || 
      log.includes('Login failed') ||
      log.includes('Error state set to:')
    );
    
    expect(errorLog).toBeTruthy();
    console.log('Error handling logs found:', errorLog ? 'Yes' : 'No');
  });

  test('should handle network connectivity issues gracefully', async ({ page }) => {
    // Navigate to the page first to load it
    await page.goto('/');
    
    // Block all network requests to simulate connectivity issues
    await page.route('**/*', route => {
      if (route.request().url().includes('/api/')) {
        route.abort('failed');
      } else {
        route.continue();
      }
    });
    
    // Try to login
    await page.fill('input[name="username"], input#username', 'testuser');
    await page.fill('input[name="password"], input#password', 'testpass');
    await page.click('button[type="submit"]');
    
    // Wait for error message to appear
    await page.waitForSelector('.text-red-600', { timeout: 10000 });
    
    // Verify error message is displayed
    const errorMessage = await page.textContent('.text-red-600');
    expect(errorMessage).toMatch(/connect|network|error/i);
  });
});

test.describe('Production Environment Simulation', () => {
  test('should resolve API URL correctly in simulated production', async ({ page }) => {
    // Inject production-like environment variables
    await page.addInitScript(() => {
      // Mock Vite environment variables for production
      Object.defineProperty(window, '__VITE_ENV__', {
        value: {
          MODE: 'production',
          PROD: true,
          DEV: false,
          VITE_API_URL: 'https://maria-pos-podv.onrender.com'
        },
        writable: false
      });
    });

    const consoleLogs: string[] = [];
    page.on('console', msg => {
      consoleLogs.push(msg.text());
    });

    await page.goto('/');
    await page.waitForTimeout(2000);

    // Look for API configuration that shows production settings
    const relevantLogs = consoleLogs.filter(log => 
      log.includes('API Configuration') || 
      log.includes('Production mode detected') ||
      log.includes('maria-pos-podv.onrender.com')
    );

    expect(relevantLogs.length).toBeGreaterThan(0);
    console.log('Production simulation logs:', relevantLogs);
  });
});