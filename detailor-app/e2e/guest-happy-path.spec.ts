import { test, expect } from '@playwright/test';

test('guest happy path: service → customer → schedule → review URL persists', async ({ page, context }) => {
  await page.goto('/book/new');
  await expect(page.getByRole('heading', { name: /book a service/i })).toBeVisible();

  // Step: service (select first available if combobox present)
  const combo = page.getByRole('combobox');
  if (await combo.isVisible().catch(() => false)) {
    await combo.click();
    const first = page.getByRole('option').first();
    if (await first.isVisible().catch(() => false)) {
      await first.click();
    }
  }
  const next1 = page.getByRole('button', { name: /^next$/i }).first();
  if (await next1.isVisible().catch(() => false)) {
    await next1.click();
  }

  // Step: customer (fill basic fields)
  const nameInput = page.getByPlaceholder('Enter your full name');
  if (await nameInput.isVisible().catch(() => false)) {
    await nameInput.fill('Guest Tester');
    await page.getByPlaceholder('Enter your email address').fill('guest@example.com');
    await page.getByPlaceholder('Confirm your email address').fill('guest@example.com');
    await page.getByPlaceholder('Enter your phone number').fill('07123456789');
    await page.getByPlaceholder('Address line 1').fill('221B Baker Street');
    await page.getByPlaceholder('Postcode').fill('NW1 6XE');
    await page.getByRole('button', { name: /^next$/i }).click();
  }

  // Step: schedule (pick first available slot)
  const slotLabel = page.locator('label:has(input[name="slot"])').first();
  if (await slotLabel.isVisible().catch(() => false)) {
    await slotLabel.click();
    await page.getByRole('button', { name: /^next$/i }).click();
  }

  // Step: review -> ensure URL step persists on reload
  await expect(page).toHaveURL(/book\/new\?step=review/i);
  await page.reload();
  await expect(page).toHaveURL(/book\/new\?step=review/i);
});


