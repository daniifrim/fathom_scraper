import { chromium, Browser, Page } from 'playwright';

async function runTest() {
  let browser: Browser | null = null;
  let page: Page | null = null;

  try {
    console.log('Starting test...');
    
    // Launch browser with specific options
    browser = await chromium.launch({
      headless: false,
      args: ['--no-sandbox'],
      slowMo: 500 // Add delay between actions
    });
    console.log('Browser launched successfully');
    
    // Create a new context with viewport and video recording
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      recordVideo: { dir: 'videos/' }
    });
    console.log('Browser context created');
    
    // Create a new page
    page = await context.newPage();
    console.log('New page created');
    
    // Navigate to Google
    console.log('Navigating to google.com...');
    await page.goto('https://google.com', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    console.log('Navigation complete');
    
    // Take a screenshot
    await page.screenshot({ path: 'test-screenshot.png' });
    console.log('Screenshot taken');
    
    // Wait a bit
    console.log('Waiting 5 seconds...');
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('Test failed:', error);
    throw error;
  } finally {
    console.log('Cleaning up...');
    if (page) await page.close();
    if (browser) await browser.close();
    console.log('Test complete!');
  }
}

// Run the test
runTest().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 