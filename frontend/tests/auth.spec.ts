// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test('Nutzer kann sich einloggen', async ({ page }) => {
  await page.goto('/login');

  await page.getByPlaceholder('you@example.com').fill('test@test.com');
  await page.getByPlaceholder('••••••••').fill('password123');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page).toHaveURL(/.*dashboard/);
});

test('Fehlermeldung bei falschen Daten', async ({ page }) => {
  await page.goto('/login');

  await page.getByPlaceholder('you@example.com').fill('falsch@example.com');
  await page.getByPlaceholder('••••••••').fill('falsch');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page.getByText('Invalid email or password')).toBeVisible();
});