import { expect, test, type Page } from '@playwright/test';

async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
}

async function clickNavAndAssert(page: Page, label: string, urlRegex: RegExp) {
  await page.getByRole('link', { name: label, exact: true }).click();
  await expect(page).toHaveURL(urlRegex);
  await expect(page.getByTestId('main-layout')).toBeVisible();
  await expect(page.getByTestId('app-sidebar')).toBeVisible();
  await expect(page.getByTestId('app-main')).toBeVisible();
}

test('admin can navigate main sidebar links', async ({ page }) => {
  await login(page, 'admin@dentalclinic.com', 'admin123');
  await expect(page).toHaveURL(/\/admin$/);

  await clickNavAndAssert(page, 'Admin Home', /\/admin$/);
  await clickNavAndAssert(page, 'Users', /\/users$/);
  await clickNavAndAssert(page, 'Patients', /\/patients$/);
  await clickNavAndAssert(page, 'Appointments', /\/appointments$/);
  await clickNavAndAssert(page, 'Calendar', /\/calendar$/);
  await clickNavAndAssert(page, 'Treatments', /\/treatments$/);
  await clickNavAndAssert(page, 'Categories', /\/treatments\/categories$/);
  await clickNavAndAssert(page, 'Invoices', /\/billing\/invoices$/);
  await clickNavAndAssert(page, 'Payments', /\/billing\/payments$/);
  await clickNavAndAssert(page, 'Financial Reports', /\/billing\/reports$/);
  await clickNavAndAssert(page, 'Messages', /\/messages$/);
  await clickNavAndAssert(page, 'Settings', /\/settings$/);
});

test('patient can navigate portal sidebar links', async ({ page }) => {
  await login(page, 'patient@example.com', 'patient123');
  await expect(page).toHaveURL(/\/patient$/);

  await clickNavAndAssert(page, 'Patient Home', /\/patient$/);
  await clickNavAndAssert(page, 'My Appointments', /\/portal\/appointments$/);
  await clickNavAndAssert(page, 'My Billing', /\/portal\/billing$/);
  await clickNavAndAssert(page, 'Treatment History', /\/portal\/treatments$/);
  await clickNavAndAssert(page, 'Prescriptions', /\/portal\/prescriptions$/);
  await clickNavAndAssert(page, 'Profile', /\/portal\/profile$/);
});

