import { test, expect } from '@playwright/test';
import { loginAsJudge, loginAsLawyer, loginAsUnverified } from './helpers/auth';

test.describe('Authentication and Public Pages', () => {
  test('landing page loads correctly', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1').first()).toContainText('JusticeWatch');
  });

  test('unknown route redirects to landing', async ({ page }) => {
    await page.goto('/some-unknown-route');
    await expect(page).toHaveURL('/');
  });

  test('registration valid and invalid flows', async ({ page }) => {
    await page.goto('/register');
    
    // empty form submission
    await page.click('#register-submit-btn');
    await expect(page.locator('.notice-error').first()).toBeVisible();
    
    // valid submission
    const ts = Date.now();
    await page.fill('#reg-fullname', 'Test Lawyer');
    await page.fill('#reg-username', `lawyer_${ts}`);
    await page.fill('#reg-email', `lawyer_${ts}@example.com`);
    await page.fill('#reg-pass', 'StrongPass123!');
    await page.fill('#reg-confirm', 'StrongPass123!');
    await page.click('#register-submit-btn');
    
    await expect(page.locator('body')).toContainText('Pending Verification');
  });

  test('login flows for different roles', async ({ page }) => {
    // We expect these users to exist in the database already via Django seed/fixtures
    
    // Unverified
    await loginAsUnverified(page);
    await expect(page.locator('.notice-error')).toContainText('verif');

    // Lawyer
    await loginAsLawyer(page);
    await expect(page.locator('.sidebar')).toBeVisible();

    // Judge
    await loginAsJudge(page);
    await expect(page.locator('.sidebar')).toBeVisible();
  });
});
