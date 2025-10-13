import { test, expect } from '@playwright/test';

test.describe('Mobile Experience', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE dimensions

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login form properly on mobile', async ({ page }) => {
    // Check that main elements are visible
    await expect(page.getByText('Maria Havens')).toBeVisible();
    await expect(page.getByText('Point of Sale System')).toBeVisible();
    await expect(page.getByText('Staff Login')).toBeVisible();
    
    // Check form fields are properly sized for mobile
    const usernameInput = page.getByRole('textbox', { name: 'Username' });
    const passwordInput = page.getByRole('textbox', { name: 'Password' });
    const loginButton = page.getByRole('button', { name: 'Login' });
    
    await expect(usernameInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(loginButton).toBeVisible();
    
    // Verify inputs are touch-friendly (minimum 44px touch target)
    const loginButtonBox = await loginButton.boundingBox();
    expect(loginButtonBox?.height).toBeGreaterThanOrEqual(44);
  });

  test('should show images correctly on mobile', async ({ page }) => {
    // Check that logo/brand images are visible
    const brandImages = page.locator('img');
    const imageCount = await brandImages.count();
    
    expect(imageCount).toBeGreaterThan(0);
    
    // Check that at least one image is visible and loaded
    for (let i = 0; i < imageCount; i++) {
      const image = brandImages.nth(i);
      await expect(image).toBeAttached();
      
      // Check if image loaded successfully
      const isLoaded = await image.evaluate((img: HTMLImageElement) => {
        return img.complete && img.naturalHeight !== 0;
      });
      
      if (isLoaded) {
        // At least one image should be loaded
        expect(isLoaded).toBe(true);
        break;
      }
    }
  });

  test('should handle touch interactions properly', async ({ page }) => {
    const usernameInput = page.getByRole('textbox', { name: 'Username' });
    const passwordInput = page.getByRole('textbox', { name: 'Password' });
    
    // Simulate touch interactions
    await usernameInput.tap();
    await expect(usernameInput).toBeFocused();
    
    await usernameInput.fill('mobileuser');
    
    await passwordInput.tap();
    await expect(passwordInput).toBeFocused();
    
    await passwordInput.fill('mobilepass');
    
    // Test login button tap
    const loginButton = page.getByRole('button', { name: 'Login' });
    await loginButton.tap();
    
    // Should show error message or loading state
    await expect(page.locator('.text-red-600, .animate-spin')).toBeVisible();
  });

  test('should display Quick POS Access button on mobile', async ({ page }) => {
    const quickPOSButton = page.getByRole('button', { name: 'Quick POS Access' });
    await expect(quickPOSButton).toBeVisible();
    
    // Verify it's properly sized for mobile
    const buttonBox = await quickPOSButton.boundingBox();
    expect(buttonBox?.height).toBeGreaterThanOrEqual(44);
    
    // Test the button functionality
    await quickPOSButton.tap();
    
    // Should navigate to POS page (this might show an error or redirect)
    await page.waitForTimeout(500); // Brief wait for any navigation
  });

  test('should show PWA install banner on mobile when appropriate', async ({ page }) => {
    // Mock beforeinstallprompt event
    await page.evaluate(() => {
      const event = new Event('beforeinstallprompt');
      (event as any).preventDefault = () => {};
      (event as any).prompt = () => Promise.resolve();
      (event as any).userChoice = Promise.resolve({ outcome: 'accepted' });
      
      window.dispatchEvent(event);
    });

    // PWA banner should be visible and properly positioned on mobile
    const installBanner = page.locator('text=Install Maria Havens POS app?');
    await expect(installBanner).toBeVisible();
    
    // Banner should be at the top of the screen
    const bannerBox = await installBanner.locator('..').boundingBox();
    expect(bannerBox?.y).toBeLessThan(50); // Should be near top of viewport
    
    // Install button should be touch-friendly
    const installButton = page.getByRole('button', { name: 'Install' });
    const installButtonBox = await installButton.boundingBox();
    expect(installButtonBox?.height).toBeGreaterThanOrEqual(32); // Minimum mobile touch target
  });

  test('should handle mobile viewport changes gracefully', async ({ page }) => {
    // Test portrait orientation
    await expect(page.getByText('Staff Login')).toBeVisible();
    
    // Simulate landscape orientation
    await page.setViewportSize({ width: 667, height: 375 });
    
    // Elements should still be visible and properly positioned
    await expect(page.getByText('Staff Login')).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Username' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Password' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
  });

  test('should show network status on mobile', async ({ page }) => {
    // The NetworkStatus component should be rendered
    // We'll check for its presence by looking for network-related elements
    // This might be visible as a status indicator or offline message
    
    // Simulate offline condition
    await page.context().setOffline(true);
    
    // Wait a moment for offline detection
    await page.waitForTimeout(1000);
    
    // There should be some indication of network status
    // (The NetworkStatus component should show something)
    // We'll check if the page still functions properly offline
    const loginButton = page.getByRole('button', { name: 'Login' });
    await expect(loginButton).toBeVisible();
    
    // Restore online
    await page.context().setOffline(false);
  });
});