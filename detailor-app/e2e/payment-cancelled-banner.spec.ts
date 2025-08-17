import { test, expect } from '@playwright/test';

test('payment cancelled banner shows with retry buttons', async ({ page }) => {
  await page.goto('/book/new?payment=cancelled');
  await expect(page.getByText(/Payment was cancelled/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /Pay in Full/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Pay Deposit/i })).toBeVisible();
});


