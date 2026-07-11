import { chromium } from 'playwright';

const BASE = 'http://localhost:3000';
const CASES = [
  { case_category: 'Criminal', crime_type: 'Theft', chargesheet_status: 'Filed', num_parties: 2, num_hearings: 5, filing_to_first_list_days: 15, court_caseload: 500, case_age_days: 120 },
  { case_category: 'Civil', crime_type: 'Property Dispute', chargesheet_status: 'Not Filed', num_parties: 4, num_hearings: 2, filing_to_first_list_days: 45, court_caseload: 800, case_age_days: 300 },
  { case_category: 'Family', crime_type: 'Divorce', chargesheet_status: 'Trial', num_parties: 2, num_hearings: 8, filing_to_first_list_days: 10, court_caseload: 200, case_age_days: 600 },
  { case_category: 'Criminal', crime_type: 'Assault', chargesheet_status: 'Under Review', num_parties: 2, num_hearings: 1, filing_to_first_list_days: 5, court_caseload: 600, case_age_days: 30 },
  { case_category: 'Corporate', crime_type: 'Fraud', chargesheet_status: 'Trial', num_parties: 6, num_hearings: 12, filing_to_first_list_days: 60, court_caseload: 1200, case_age_days: 900 }
];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const results = [];

  // Wait a few seconds to ensure Vite and Django are fully up
  await new Promise(r => setTimeout(r, 3000));

  // Perform Login
  await page.goto(`${BASE}/login`);
  await page.fill('#login-username', 'testuser');
  await page.fill('#login-password', 'password123');
  await page.click('#login-submit-btn');
  // Wait for login to complete (navigates to /dashboard)
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  const token = await page.evaluate(() => localStorage.getItem('access_token'));
  console.log("Token after login:", token ? "Present" : "Missing");

  for (const c of CASES) {
    await page.goto(`${BASE}/predictions`);
    await page.waitForTimeout(1000);
    // Click Interactive Predictor tab
    await page.click('text=Interactive Predictor');
    // Ensure Custom Scenario is selected
    await page.click('text=Custom Scenario');
    
    for (const [field, value] of Object.entries(c)) {
      if (['case_category', 'chargesheet_status'].includes(field)) {
         await page.selectOption(`select[name="${field}"]`, String(value));
      } else {
         await page.fill(`input[name="${field}"]`, String(value));
      }
    }
    
    await page.click('button[type="submit"]');
    await page.waitForSelector('[data-testid="prediction-result"]', { timeout: 15000 });

    const duration = await page.textContent('[data-testid="duration-days"]');
    const disposal = await page.textContent('[data-testid="disposal-outcome"]');
    
    // Check model comparison rows
    const rows = await page.locator('[data-testid="model-comparison-row"]').all();
    const modelPredictions = [];
    for (const row of rows) {
       const tds = await row.locator('td').all();
       const modelName = await tds[0].textContent();
       const modelPred = await tds[1].textContent();
       modelPredictions.push(`${modelName.trim().split(' ')[0]}: ${modelPred.trim()}`);
    }
    
    results.push({ 
       input: c, 
       duration: duration.trim(), 
       disposal: disposal.trim(),
       comparisons: modelPredictions
    });
  }

  await browser.close();

  // Sanity checks — flag anything suspicious
  const durations = results.map(r => r.duration);
  const disposals = results.map(r => r.disposal);
  
  const allDurationsSame = durations.every(d => d === durations[0]);
  const allDisposalsSame = disposals.every(d => d === disposals[0]);
  
  const anyNull = results.some(r => !r.duration || !r.disposal || r.duration === 'null' || r.disposal === 'null');
  const missingComparisons = results.some(r => r.comparisons.length < 4);
  const allIdenticalComparisons = results.some(r => {
    if(r.comparisons.length < 2) return false;
    const firstPred = r.comparisons[0].split(': ')[1];
    return r.comparisons.every(c => c.split(': ')[1] === firstPred);
  });

  console.log(JSON.stringify(results, null, 2));
  
  let failed = false;
  if (anyNull) {
    console.error('FAIL: null/empty prediction found');
    failed = true;
  }
  if (allDurationsSame && allDisposalsSame) {
    console.error('FAIL: all predictions identical across test cases — model likely not using input');
    failed = true;
  }
  if (missingComparisons) {
    console.error('FAIL: missing model comparison rows (expected 4 models)');
    failed = true;
  }
  if (allIdenticalComparisons) {
    console.error('NOTE: In at least one case, all 4 models output the exact same prediction. This might indicate wiring issues or high certainty.');
  }
  if (!failed) {
    console.log('PASS: predictions returned and vary by input. 4 models successfully compared.');
  }
})();
