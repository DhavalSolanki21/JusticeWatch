export async function loginAsJudge(page) {
  await page.goto('/login');
  await page.fill('#login-username', 'judge_ahm');
  await page.fill('#login-password', 'Password@123');
  await page.click('#login-submit-btn');
  await page.waitForURL('**/dashboard');
}

export async function loginAsLawyer(page) {
  await page.goto('/login');
  await page.fill('#login-username', 'lawyer_verified');
  await page.fill('#login-password', 'Password@123');
  await page.click('#login-submit-btn');
  await page.waitForURL('**/dashboard');
}

export async function loginAsUnverified(page) {
  await page.goto('/login');
  await page.fill('#login-username', 'lawyer_unverified');
  await page.fill('#login-password', 'Password@123');
  await page.click('#login-submit-btn');
  await page.waitForSelector('.notice-error', { state: 'visible' });
}
