import { test, expect } from '@playwright/test';

// Simulates a payment decline and verifies recovery UX in confirmation page
test('payment decline shows failure and retry path', async ({ page }) => {
  // Start at booking flow
  await page.goto('/book/new');

  // Progress minimally; tests are resilient to optional UI
  // Pick first available service if present
  const firstService = page.locator('[data-testid="service-card"]').first();
  if (await firstService.isVisible().catch(() => false)) {
    await firstService.click();
  }
  const nextBtn = page.getByRole('button', { name: /next|continue/i }).first();
  if (await nextBtn.isEnabled().catch(() => false)) {
    await nextBtn.click();
  }

  // Navigate to confirmation with a fake declined session
  await page.goto('/bookings/confirmation?session_id=declined_session');

  // Stub verify-session to simulate decline
  await page.route('**/api/payments/verify-session', async route => {
    await route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({ success: false, error: { message: 'payment_status: failed' } }),
    });
  });

  // Expect error UI
  await expect(page.getByText(/Booking Failed/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /try again/i })).toBeVisible();
});


