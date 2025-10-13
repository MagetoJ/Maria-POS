import { test, expect } from '@playwright/test';

test.describe('Login Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display specific error message for incorrect credentials', async ({ page }) => {
    // Fill in wrong credentials
    await page.getByRole('textbox', { name: 'Username' }).fill('wronguser');
    await page.getByRole('textbox', { name: 'Password' }).fill('wrongpass');
    
    // Click login button
    await page.getByRole('button', { name: 'Login' }).click();
    
    // Wait for and verify error message appears
    const errorMessage = page.locator('.text-red-600');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('Incorrect username or password');
    
    // Verify the error has the shake animation class
    await expect(errorMessage.locator('..')).toHaveClass(/animate-shake/);
    
    // Verify no blank reload occurred - form should still be visible with values
    await expect(page.getByRole('textbox', { name: 'Username' })).toHaveValue('wronguser');
    await expect(page.getByRole('textbox', { name: 'Password' })).toHaveValue('wrongpass');
  });

  test('should display network error message when server is unreachable', async ({ page }) => {
    // Mock network failure
    await page.route('**/api/login', route => route.abort());
    
    await page.getByRole('textbox', { name: 'Username' }).fill('testuser');
    await page.getByRole('textbox', { name: 'Password' }).fill('testpass');
    await page.getByRole('button', { name: 'Login' }).click();
    
    // Verify network error message
    const errorMessage = page.locator('.text-red-600');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('Cannot connect to server');
  });

  test('should clear error message on successful login attempt', async ({ page }) => {
    // First, create an error
    await page.getByRole('textbox', { name: 'Username' }).fill('wronguser');
    await page.getByRole('textbox', { name: 'Password' }).fill('wrongpass');
    await page.getByRole('button', { name: 'Login' }).click();
    
    // Wait for error to appear
    await expect(page.locator('.text-red-600')).toBeVisible();
    
    // Clear form and try with valid credentials (mock success)
    await page.getByRole('textbox', { name: 'Username' }).fill('');
    await page.getByRole('textbox', { name: 'Username' }).fill('admin');
    await page.getByRole('textbox', { name: 'Password' }).fill('');
    await page.getByRole('textbox', { name: 'Password' }).fill('admin');
    
    // Mock successful login
    await page.route('**/api/login', route => 
      route.fulfill({
        status: 200,
        body: JSON.stringify({ success: true, token: 'fake-token', user: { role: 'admin' } })
      })
    );
    
    await page.getByRole('button', { name: 'Login' }).click();
    
    // Verify error message is cleared (not visible)
    await expect(page.locator('.text-red-600')).not.toBeVisible();
  });

  test('should show loading state during login attempt', async ({ page }) => {
    // Slow down the API response to see loading state
    await page.route('**/api/login', route => {
      setTimeout(() => {
        route.fulfill({
          status: 401,
          body: JSON.stringify({ success: false, message: 'Invalid credentials' })
        });
      }, 1000);
    });
    
    await page.getByRole('textbox', { name: 'Username' }).fill('testuser');
    await page.getByRole('textbox', { name: 'Password' }).fill('testpass');
    await page.getByRole('button', { name: 'Login' }).click();
    
    // Verify loading state
    await expect(page.getByRole('button', { name: 'Logging in...' })).toBeVisible();
    await expect(page.locator('.animate-spin')).toBeVisible();
    
    // Wait for login to complete and verify error appears
    await expect(page.locator('.text-red-600')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
  });
});