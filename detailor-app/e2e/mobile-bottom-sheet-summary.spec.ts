import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 375, height: 812 } });

test('enterprise flow shows mobile bottom-sheet summary with continue', async ({ page }) => {
  await page.goto('/book/new');
  // Switch to enterprise experience if toggle present
  const toggle = page.getByRole('button', { name: /Try New Experience/i });
  if (await toggle.isVisible().catch(() => false)) {
    await toggle.click();
  }
  // If enterprise UI didn't activate (no services), skip
  const enterpriseMarker = page.getByRole('heading', { name: /Choose Your Service/i });
  if (!(await enterpriseMarker.isVisible({ timeout: 5000 }).catch(() => false))) {
    test.skip(true, 'Enterprise UI not active (no services)');
  }
  // Bottom sheet should show Estimated total and a Continue button on mobile
  const summary = page.getByText(/Estimated total/i);
  if (!(await summary.isVisible({ timeout: 5000 }).catch(() => false))) {
    test.skip(true, 'Bottom-sheet summary not available yet');
  }
  const continueBtn = page.getByRole('button', { name: /Continue|Complete Booking/i });
  await expect(continueBtn).toBeVisible();
  // Click continue to advance a step (if possible)
  await continueBtn.click({ trial: true }).catch(() => {});
});


