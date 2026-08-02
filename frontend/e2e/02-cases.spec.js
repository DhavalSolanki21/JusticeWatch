import { test, expect } from '@playwright/test';
import { loginAsJudge, loginAsLawyer } from './helpers/auth';

test.describe('Case Management', () => {
  test('search and filter cases', async ({ page }) => {
    await loginAsJudge(page);
    await page.goto('/search');
    
    await page.fill('input[placeholder="Search by Case No, FIR, or Sections..."]', 'CIV');
    await page.click('button:has-text("Execute Query")');
    await expect(page.locator('table.jw-table tbody tr').first()).toBeVisible();
    
    // Filter by category
    await page.locator('select').nth(0).selectOption('Civil');
    await page.click('button:has-text("Execute Query")');
    await page.waitForTimeout(500); // give it a moment to refetch
  });

  test('file a new case as lawyer', async ({ page }) => {
    await loginAsLawyer(page);
    await page.goto('/file-case');
    
    page.on('dialog', dialog => dialog.accept());

    // form submission
    await page.locator('select').nth(0).selectOption({ index: 1 });
    await page.fill('input[placeholder="e.g., Session Court No. 4"]', 'High Court');
    await page.locator('select').nth(1).selectOption('Civil');
    await page.fill('input[placeholder="e.g., Theft, Fraud"]', 'Defamation');
    await page.fill('input[placeholder="e.g., IPC Sec 420, CrPC Sec 144"]', 'IPC 123');
    await page.fill('input[placeholder="e.g., FIR-1234/2026"]', 'FIR-001');
    await page.fill('textarea', 'Notes...');
    await page.click('button:has-text("File Case to Registry")');
    
    await expect(page).toHaveURL(/.*\/dashboard/);
  });

  test('case detail and predictions for judge', async ({ page }) => {
    await loginAsJudge(page);
    await page.goto('/dashboard');
    const caseCards = page.locator('.case-card');
    if (await caseCards.count() > 0) {
      await caseCards.first().click();
      await expect(page).toHaveURL(/.*\/cases\/\d+/);
      
      // Add hearing
      const addBtn = page.locator('button:has-text("Add Hearing")');
      if (await addBtn.isVisible()) {
        await addBtn.click();
        await page.fill('input[name="hearing_date"]', '2026-10-10');
        await page.fill('input[name="purpose"]', 'Arguments');
        await page.click('button:has-text("Save")');
        await expect(page.locator('.timeline')).toContainText('Arguments');
      }
    }
  });
});
