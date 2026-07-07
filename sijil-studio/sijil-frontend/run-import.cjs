const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

async function run() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();

  console.log('Navigating to import page...');
  await page.goto('http://localhost:3000/admin/import');

  console.log('Page title:', await page.title());
  
  // Wait for the repo input to load
  await page.waitForSelector('input[placeholder*="github.com"]');
  
  console.log('Entering repository URL...');
  await page.fill('input[placeholder*="github.com"]', 'https://github.com/koure-onyx/chemestry-e2');
  
  // Take screenshot
  await page.screenshot({ path: 'import-step1-url-entered.png' });
  console.log('Screenshot saved: import-step1-url-entered.png');

  console.log('Clicking "Preview Import"...');
  // Find button containing "Preview Import"
  const previewBtn = page.locator('button:has-text("Preview Import")');
  await previewBtn.click();

  // Wait for the scanning/preview to finish. This might take up to 60 seconds.
  console.log('Waiting for preview to complete...');
  // We can wait for the Start Import button or for the live log to show "Ready to start import" or check selector.
  // The page shows preview data using <ImportPreview data={previewData} /> and the "Start Import" button when ready.
  // So we can wait for the "Start Import" button.
  const startImportBtn = page.locator('button:has-text("Start Import")');
  await startImportBtn.waitFor({ state: 'visible', timeout: 90000 });
  
  await page.screenshot({ path: 'import-step2-preview-ready.png' });
  console.log('Screenshot saved: import-step2-preview-ready.png');

  console.log('Preview loaded! Let us click "Start Import"...');
  await startImportBtn.click();

  console.log('Import started! Waiting for redirection / progress monitoring...');
  // After clicking start, it updates the log and redirects to /admin/import/[batchId] after 1.5 seconds.
  // Let us wait for navigation or check URL
  await page.waitForURL(/\/admin\/import\//, { timeout: 30000 });
  console.log('Redirected to progress page:', page.url());

  // Periodically check the progress on the page
  console.log('Monitoring progress...');
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(5000);
    const url = page.url();
    
    // Check progress text or status
    // Let's capture a screenshot of the progress page
    const screenshotName = `import-progress-step-${i + 3}.png`;
    await page.screenshot({ path: screenshotName });
    console.log(`[Status check ${i+1}] Screenshot saved: ${screenshotName}`);
    
    // Check if the page has "COMPLETED" or progress is 100% or check if there is completed badge
    const isCompleted = await page.locator('span:has-text("COMPLETED")').count();
    const isFailed = await page.locator('span:has-text("FAILED")').count();
    
    if (isCompleted > 0) {
      console.log('🎉 Import Completed Successfully!');
      break;
    }
    if (isFailed > 0) {
      console.log('❌ Import Failed!');
      break;
    }
  }

  await page.screenshot({ path: 'import-final-status.png' });
  console.log('Screenshot saved: import-final-status.png');

  await browser.close();
  console.log('Browser closed.');
}

run().catch(err => {
  console.error('Error during execution:', err);
  process.exit(1);
});
