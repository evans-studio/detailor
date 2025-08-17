import { test, expect } from '@playwright/test';

test('guest smoke: progresses when possible and persists current step across reload', async ({ page }) => {
  await page.goto('/book/new');
  await expect(page.getByRole('heading', { name: /book a service/i })).toBeVisible({ timeout: 10000 });

  // Try to progress through service step
  const combo = page.getByRole('combobox');
  if (await combo.isVisible().catch(() => false)) {
    await combo.click();
    const first = page.getByRole('option').first();
    if (await first.isVisible().catch(() => false)) {
      await first.click();
    }
  }
  const nextBtn = page.getByRole('button', { name: /^next$/i }).first();
  if (await nextBtn.isVisible().catch(() => false)) {
    await nextBtn.click();
  }

  // Try to fill customer step if visible
  const nameInput = page.getByPlaceholder('Enter your full name');
  if (await nameInput.isVisible().catch(() => false)) {
    await nameInput.fill('Guest Tester');
    await page.getByPlaceholder('Enter your email address').fill('guest@example.com');
    await page.getByPlaceholder('Confirm your email address').fill('guest@example.com');
    await page.getByPlaceholder('Enter your phone number').fill('07123456789');
    const addr1 = page.getByPlaceholder('Address line 1');
    if (await addr1.isVisible().catch(() => false)) {
      await addr1.fill('221B Baker Street');
      await page.getByPlaceholder('Postcode').fill('NW1 6XE');
    }
    const next2 = page.getByRole('button', { name: /^next$/i }).first();
    if (await next2.isVisible().catch(() => false)) {
      await next2.click();
    }
  }

  // Try to pick a slot if visible
  const slotLabel = page.locator('label:has(input[name="slot"])').first();
  if (await slotLabel.isVisible().catch(() => false)) {
    await slotLabel.click();
    const next3 = page.getByRole('button', { name: /^next$/i }).first();
    if (await next3.isVisible().catch(() => false)) {
      await next3.click();
    }
  }

  // Capture current step from URL
  const url = new URL(page.url());
  const currentStep = url.searchParams.get('step');
  expect(currentStep).toBeTruthy();

  // Reload and ensure step persists
  await page.reload();
  const url2 = new URL(page.url());
  expect(url2.searchParams.get('step')).toBe(currentStep);
});


