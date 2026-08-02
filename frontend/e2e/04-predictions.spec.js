import { test, expect } from '@playwright/test';
import { loginAsJudge } from './helpers/auth';

test.describe('Predictions', () => {
  test('interactive predictor custom scenario', async ({ page }) => {
    await loginAsJudge(page);
    await page.goto('/predictions');
    
    await page.locator('select[name="case_category"]').selectOption('Criminal');
    await page.locator('input[name="crime_type"]').fill('Theft');
    await page.locator('input[name="num_parties"]').fill('2');
    await page.locator('input[name="num_hearings"]').fill('5');
    
    await page.click('button:has-text("Generate Roadmap")');
    await expect(page.locator('[data-testid="prediction-result"]')).toBeVisible({ timeout: 15000 });
  });

  test('profile update', async ({ page }) => {
    await loginAsJudge(page);
    await page.goto('/profile');
    
    page.on('dialog', dialog => dialog.accept());
    await page.locator('.form-group:has-text("Display Name") input').fill('Honorable Judge Test');
    await page.click('button:has-text("Save Profile")');
    await expect(page.locator('.form-group:has-text("Display Name") input')).toHaveValue('Honorable Judge Test');
  });
});
