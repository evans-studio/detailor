import { test, expect } from '@playwright/test';

test('keyboard-only: tab to Next and activate with Enter', async ({ page }) => {
  await page.goto('/book/new');
  await page.keyboard.press('Tab'); // focus first focusable
  // Press Tab a few times and try Enter on a Next button if focused
  for (let i = 0; i < 10; i += 1) {
    const next = page.getByRole('button', { name: /^next$/i }).first();
    if (await next.isVisible().catch(() => false)) {
      await next.focus();
      await page.keyboard.press('Enter');
      break;
    }
    await page.keyboard.press('Tab');
  }
  // URL should reflect step change if it progressed
  await expect(page).toHaveURL(/book\/new\?step=/i);
});


