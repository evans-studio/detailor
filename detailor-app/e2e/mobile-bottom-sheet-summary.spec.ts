import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 375, height: 812 } });

test('enterprise flow shows mobile bottom-sheet summary with continue', async ({ page }) => {
  await page.goto('/book/new');
  // Switch to enterprise experience if toggle present
  const toggle = page.getByRole('button', { name: /Try New Experience/i });
  if (await toggle.isVisible().catch(() => false)) {
    await toggle.click();
  }
  // Bottom sheet should show Estimated total and a Continue button on mobile
  await expect(page.getByText(/Estimated total/i)).toBeVisible({ timeout: 10000 });
  const continueBtn = page.getByRole('button', { name: /Continue|Complete Booking/i });
  await expect(continueBtn).toBeVisible();
  // Click continue to advance a step (if possible)
  await continueBtn.click({ trial: true }).catch(() => {});
});


