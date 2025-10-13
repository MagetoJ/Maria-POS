import { test, expect } from '@playwright/test';

test.describe('PWA Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should register service worker', async ({ page }) => {
    // Wait for service worker registration
    await page.waitForFunction(() => {
      return navigator.serviceWorker.ready;
    });

    // Check if service worker is registered
    const swRegistered = await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.ready;
      return registration !== null;
    });

    expect(swRegistered).toBe(true);
  });

  test('should have proper PWA manifest', async ({ page }) => {
    // Check if manifest link exists
    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toBeAttached();
    
    // Verify manifest can be fetched
    const response = await page.request.get('/manifest.json');
    expect(response.status()).toBe(200);
    
    const manifest = await response.json();
    expect(manifest.name).toBe('Maria Havens POS System');
    expect(manifest.short_name).toBe('Maria Havens POS');
    expect(manifest.display).toBe('standalone');
    expect(manifest.theme_color).toBe('#f59e0b');
    expect(manifest.icons).toBeDefined();
    expect(manifest.icons.length).toBeGreaterThan(0);
  });

  test('should show PWA install banner when conditions are met', async ({ page, context }) => {
    // Mock beforeinstallprompt event
    await page.evaluate(() => {
      // Simulate the beforeinstallprompt event
      const event = new Event('beforeinstallprompt');
      (event as any).preventDefault = () => {};
      (event as any).prompt = () => Promise.resolve();
      (event as any).userChoice = Promise.resolve({ outcome: 'accepted' });
      
      window.dispatchEvent(event);
    });

    // Check if install banner is visible
    const installBanner = page.locator('text=Install Maria Havens POS app?');
    await expect(installBanner).toBeVisible();
    
    // Check install button
    const installButton = page.getByRole('button', { name: 'Install' });
    await expect(installButton).toBeVisible();
    
    // Check dismiss button (X)
    const dismissButton = page.locator('button').filter({ has: page.locator('svg') }).last();
    await expect(dismissButton).toBeVisible();
  });

  test('should handle PWA install button click', async ({ page }) => {
    // Mock beforeinstallprompt event with prompt method
    await page.evaluate(() => {
      const mockEvent = {
        preventDefault: () => {},
        prompt: () => Promise.resolve(),
        userChoice: Promise.resolve({ outcome: 'accepted' })
      };
      
      const event = new Event('beforeinstallprompt');
      Object.assign(event, mockEvent);
      window.dispatchEvent(event);
    });

    // Wait for banner to appear
    await expect(page.locator('text=Install Maria Havens POS app?')).toBeVisible();
    
    // Click install button
    const installButton = page.getByRole('button', { name: 'Install' });
    await installButton.click();
    
    // Banner should disappear after successful install
    await expect(page.locator('text=Install Maria Havens POS app?')).not.toBeVisible();
  });

  test('should dismiss PWA install banner', async ({ page }) => {
    // Mock beforeinstallprompt event
    await page.evaluate(() => {
      const event = new Event('beforeinstallprompt');
      (event as any).preventDefault = () => {};
      window.dispatchEvent(event);
    });

    // Wait for banner to appear
    await expect(page.locator('text=Install Maria Havens POS app?')).toBeVisible();
    
    // Click dismiss button (X)
    const dismissButton = page.locator('button').filter({ has: page.locator('svg') }).last();
    await dismissButton.click();
    
    // Banner should disappear
    await expect(page.locator('text=Install Maria Havens POS app?')).not.toBeVisible();
  });

  test('should not show install banner when app is already installed', async ({ page }) => {
    // Mock display mode as standalone (app is installed)
    await page.addInitScript(() => {
      Object.defineProperty(window, 'matchMedia', {
        value: (query: string) => ({
          matches: query === '(display-mode: standalone)',
          addEventListener: () => {},
          removeEventListener: () => {}
        })
      });
    });

    // Mock beforeinstallprompt event
    await page.evaluate(() => {
      const event = new Event('beforeinstallprompt');
      (event as any).preventDefault = () => {};
      window.dispatchEvent(event);
    });

    // Wait a bit to ensure any banner would have appeared
    await page.waitForTimeout(500);
    
    // Banner should not be visible since app is "installed"
    await expect(page.locator('text=Install Maria Havens POS app?')).not.toBeVisible();
  });
});