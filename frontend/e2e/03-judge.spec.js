import { test, expect } from '@playwright/test';
import { loginAsJudge, loginAsLawyer } from './helpers/auth';

test.describe('Judge Capabilities', () => {
  test('analytics dashboard access', async ({ page }) => {
    await loginAsJudge(page);
    await page.goto('/analytics');
    
    await expect(page.locator('h1')).toContainText('Analytics');
    await expect(page.locator('.chart-container').first()).toBeVisible();
  });

  test('lawyer denied analytics access', async ({ page }) => {
    await loginAsLawyer(page);
    await page.goto('/analytics');
    await expect(page).not.toHaveURL('/analytics');
    await expect(page).toHaveURL('/dashboard');
  });

  test('approve lawyer from panel', async ({ page }) => {
    await loginAsJudge(page);
    await page.goto('/approvals');
    
    const pendingList = page.locator('.pending-lawyer-item');
    if (await pendingList.count() > 0) {
      await pendingList.first().locator('button:has-text("Approve")').click();
      await expect(page.locator('.toast-success')).toBeVisible();
    }
  });
});
