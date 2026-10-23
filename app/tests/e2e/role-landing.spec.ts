import { expect, test, type Page } from '@playwright/test';

async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
}

test('admin users land on the admin landing page after login', async ({ page }) => {
  await login(page, 'admin@dentalclinic.com', 'admin123');

  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByTestId('admin-landing-page')).toBeVisible();
  await expect(page.getByTestId('admin-landing-title')).toContainText('Run the clinic');
});

test('patient users land on the patient landing page after login', async ({ page }) => {
  await login(page, 'patient@example.com', 'patient123');

  await expect(page).toHaveURL(/\/patient$/);
  await expect(page.getByTestId('patient-landing-page')).toBeVisible();
  await expect(page.getByTestId('patient-landing-title')).toContainText('Welcome back');
});
