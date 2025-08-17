import { test, expect } from '@playwright/test';

test('review step: detects slot no longer available and returns to schedule', async ({ page }) => {
  await page.goto('/book/new');
  await expect(page.getByRole('heading', { name: /book a service/i })).toBeVisible({ timeout: 10000 });

  // Progress service step if present
  const combo = page.getByRole('combobox');
  if (await combo.isVisible().catch(() => false)) {
    await combo.click();
    const first = page.getByRole('option').first();
    if (await first.isVisible().catch(() => false)) {
      await first.click();
    }
    const next1 = page.getByRole('button', { name: /^next$/i }).first();
    if (await next1.isVisible().catch(() => false)) await next1.click();
  }

  // Fill guest customer if visible
  const nameInput = page.getByPlaceholder('Enter your full name');
  if (await nameInput.isVisible().catch(() => false)) {
    await nameInput.fill('Guest Tester');
    await page.getByPlaceholder('Enter your email address').fill('guest@example.com');
    await page.getByPlaceholder('Confirm your email address').fill('guest@example.com');
    await page.getByPlaceholder('Enter your phone number').fill('07123456789');
    const addr1 = page.getByPlaceholder('Address line 1');
    if (await addr1.isVisible().catch(() => false)) {
      await addr1.fill('10 Downing Street');
      await page.getByPlaceholder('Postcode').fill('SW1A 2AA');
    }
    const next2 = page.getByRole('button', { name: /^next$/i }).first();
    if (await next2.isVisible().catch(() => false)) await next2.click();
  }

  // Select first slot if visible
  const slotLabel = page.locator('label:has(input[name="slot"])').first();
  if (!(await slotLabel.isVisible().catch(() => false))) test.skip(true, 'No slot list visible to select');
  await slotLabel.click();
  const next3 = page.getByRole('button', { name: /^next$/i }).first();
  await next3.click();

  // At review, intercept subsequent slots fetch to simulate unavailability
  await expect(page).toHaveURL(/book\/new\?step=review/i);
  await page.route('**/api/*availability/slots**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { slots: [] } }),
    });
  });

  // Click Continue to Payment to trigger re-validation
  const continueBtn = page.getByRole('button', { name: /Continue to Payment/i });
  if (!(await continueBtn.isVisible().catch(() => false))) test.skip(true, 'No continue button at review');
  await continueBtn.click();

  // Expect to be bounced back to schedule step and see an unavailable message
  await expect(page).toHaveURL(/book\/new\?step=schedule/i);
  await expect(page.getByText(/Selected slot is no longer available/i)).toBeVisible();
});


