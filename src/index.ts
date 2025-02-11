import { chromium } from 'playwright';
import { loginToFathom } from './auth';
import { scrapeMeetingTranscript, saveTranscript } from './scraper';
import * as path from 'path';
import * as fs from 'fs/promises';
import { performance } from 'perf_hooks';

const AUTH_FILE = 'auth.json';

async function checkAuthFileExists(): Promise<boolean> {
  try {
    await fs.access(AUTH_FILE);
    return true;
  } catch {
    return false;
  }
}

console.log('Script starting...');
const startTime = performance.now();
console.log('Launching browser...');

(async () => {
  try {
    // Check if we have stored authentication
    const hasStoredAuth = await checkAuthFileExists();
    console.log(hasStoredAuth ? 'Found stored authentication' : 'No stored authentication found');

    // Launch the browser with enhanced anti-detection settings
    const browser = await chromium.launch({ 
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-site-isolation-trials'
      ]
    });
    
    console.log('Browser launched successfully');
    
    // Create context with stored auth if available
    const context = await browser.newContext(hasStoredAuth ? {
      storageState: AUTH_FILE,
      viewport: { width: 1280, height: 720 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      permissions: ['geolocation', 'notifications', 'clipboard-read', 'clipboard-write'],
      deviceScaleFactor: 2,
      hasTouch: false,
      isMobile: false,
      locale: 'en-US',
      timezoneId: 'Europe/Madrid',
      javaScriptEnabled: true,
      bypassCSP: false,
      ignoreHTTPSErrors: false,
      colorScheme: 'light',
      reducedMotion: 'no-preference',
      forcedColors: 'none',
      acceptDownloads: true
    } : {
      viewport: { width: 1280, height: 720 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      permissions: ['geolocation', 'notifications', 'clipboard-read', 'clipboard-write'],
      deviceScaleFactor: 2,
      hasTouch: false,
      isMobile: false,
      locale: 'en-US',
      timezoneId: 'Europe/Madrid',
      javaScriptEnabled: true,
      bypassCSP: false,
      ignoreHTTPSErrors: false,
      colorScheme: 'light',
      reducedMotion: 'no-preference',
      forcedColors: 'none',
      acceptDownloads: true
    });

    // Add anti-detection scripts
    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
      Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
    });
    
    console.log('Browser context created');
    const page = await context.newPage();
    console.log('New page created');

    try {
      // Only login if we don't have stored auth
      if (!hasStoredAuth) {
        await loginToFathom(page);
        console.log('Logged in successfully.');
        
        // Store authentication for future use
        console.log('Saving authentication state...');
        await context.storageState({ path: AUTH_FILE });
        console.log('Authentication state saved');
      } else {
        // If we have stored auth, just navigate to home
        console.log('Using stored authentication...');
        console.log('Attempting to navigate to home page...');
        
        try {
          // First just get to the page
          await page.goto('https://fathom.video/home', { 
            waitUntil: 'domcontentloaded',
            timeout: 30000 
          });
          console.log('Initial navigation complete');
          
          // Log the current state
          console.log('Current URL:', await page.url());
          console.log('Page title:', await page.title());
          
          // Check if we can find any elements
          const hasContent = await page.evaluate(() => {
            return {
              readyState: document.readyState,
              hasInertiaApp: !!document.querySelector('inertia-app'),
              hasGallery: !!document.querySelector('call-gallery'),
              numThumbnails: document.querySelectorAll('call-gallery-thumbnail').length
            };
          });
          console.log('Page content check:', hasContent);
          
          // Now wait for network to settle, but don't fail if it doesn't
          await page.waitForLoadState('networkidle', { timeout: 5000 })
            .catch(() => console.log('Network did not become idle, but page is loaded'));
            
        } catch (error) {
          console.error('Navigation error:', error);
          throw error;
        }
      }

      // Verify we're logged in
      const isLoggedIn = await page.url().includes('fathom.video/home');
      if (!isLoggedIn) {
        console.log('Stored authentication expired, logging in again...');
        await loginToFathom(page);
        await context.storageState({ path: AUTH_FILE });
      }

      const transcriptData = await scrapeMeetingTranscript(page);
      
      // Save the transcript to a file
      console.log('\nSaving transcript to file...');
      const savedFilePath = await saveTranscript(transcriptData);
      console.log(`Transcript saved to: ${savedFilePath}`);
      
      console.log('\n=== Scraped Meeting Data ===');
      console.log(`Meeting Title: ${transcriptData.meetingTitle}`);
      console.log(`Duration: ${transcriptData.metadata.duration}`);
      console.log(`Date: ${transcriptData.metadata.date}`);
      console.log(`URL: ${transcriptData.metadata.url}`);
      console.log(`Section: ${transcriptData.metadata.section}`);
      console.log(`Checkmarks: ${transcriptData.metadata.checkmarks}`);
      console.log(`Transcript Length: ${transcriptData.transcript.length} characters`);
      if (transcriptData.summary) {
        console.log('\n=== Summary ===');
        console.log(transcriptData.summary);
      }
      console.log('\n=== End of Data ===');
    } catch (error: any) {
      console.error('Error during execution:', error);
      
      // If there's an auth error, delete the stored auth
      if (error.message?.includes('auth') || error.message?.includes('login')) {
        console.log('Authentication error detected, removing stored credentials...');
        await fs.unlink(AUTH_FILE).catch(() => {});
      }
    } finally {
      console.log('Cleaning up...');
      await context.close();
      await browser.close();
      console.log('Browser closed');
    }
  } catch (error) {
    console.error('Failed to launch browser:', error);
  } finally {
    const endTime = performance.now();
    const executionTime = (endTime - startTime) / 1000;
    console.log(`\nTotal execution time: ${executionTime.toFixed(2)} seconds`);
  }
})().catch(error => {
  console.error('Top level error:', error);
  const endTime = performance.now();
  const executionTime = (endTime - startTime) / 1000;
  console.log(`\nTotal execution time: ${executionTime.toFixed(2)} seconds`);
}); 