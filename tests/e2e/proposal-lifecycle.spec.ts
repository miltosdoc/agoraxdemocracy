import { test, expect } from '@playwright/test';

test.describe('Proposal Lifecycle', () => {
  test.beforeEach(async ({ page }) => {
    // Login as demo user
    await page.goto('/login');
    await page.getByPlaceholder('Username or email').fill('miltos');
    await page.getByPlaceholder('Password').fill('password');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page).toHaveURL('/dashboard');
  });

  test('should create a new proposal', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Click "New Proposal" button
    await page.getByRole('button', { name: /new proposal/i, exact: false }).click();
    
    // Fill proposal form
    await page.getByLabel('Title').fill('Test Proposal');
    await page.getByLabel('Description').fill('This is a test proposal for E2E testing.');
    
    // Submit
    await page.getByRole('button', { name: /submit|create/i }).click();
    
    // Should redirect to proposal detail
    await expect(page).toHaveURL(/\/proposals\/\d+/);
  });

  test('should view proposal details', async ({ page }) => {
    // Navigate to an existing proposal
    await page.goto('/proposals/1');
    
    // Check proposal title is visible
    await expect(page.getByText('Test Proposal')).toBeVisible();
    
    // Check tabs are present
    await expect(page.getByText('Overview')).toBeVisible();
    await expect(page.getByText('Debate')).toBeVisible();
    await expect(page.getByText('Amendments')).toBeVisible();
  });
});
