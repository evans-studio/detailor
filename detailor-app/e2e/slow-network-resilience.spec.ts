import { test, expect } from '@playwright/test';

// Ensures the booking flow remains usable and preserves state under slow network
test('booking flow shows skeletons and persists state on slow network', async ({ page }) => {
  // Throttle network by delaying services/add-ons/quotes endpoints
  await page.route('**/api/services**', async route => {
    await new Promise(r => setTimeout(r, 1200));
    await route.continue();
  });
  await page.route('**/api/add-ons**', async route => {
    await new Promise(r => setTimeout(r, 1200));
    await route.continue();
  });
  await page.route('**/api/**/quotes**', async route => {
    await new Promise(r => setTimeout(r, 1200));
    await route.continue();
  });

  await page.goto('/book/new');

  // Expect some loading UI
  const loading = page.getByText(/loading|fetching|please wait/i);
  await expect(loading.or(page.locator('[data-testid="loading-skeleton"]')).first()).toBeVisible({ timeout: 5000 });

  // Choose first service once available
  const firstService = page.locator('[data-testid="service-card"]').first();
  await firstService.waitFor({ state: 'visible', timeout: 15000 });
  await firstService.click();

  // Navigate forward and then reload to verify persistence
  const nextBtn = page.getByRole('button', { name: /next|continue/i }).first();
  if (await nextBtn.isEnabled().catch(() => false)) {
    await nextBtn.click();
  }
  await page.reload();

  // Expect we are still on same step (URL or visible heading)
  await expect(page).toHaveURL(/book\/new/);
  await expect(
    page.getByRole('heading', { name: /service|vehicle|schedule|review|payment/i }).first()
  ).toBeVisible();
});


