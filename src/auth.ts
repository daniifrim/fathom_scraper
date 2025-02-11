import { Page } from 'playwright';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const { GOOGLE_EMAIL, GOOGLE_PASSWORD } = process.env;

if (!GOOGLE_EMAIL || !GOOGLE_PASSWORD) {
  throw new Error('Google credentials not found in .env file');
}

// TypeScript type assertion since we checked for undefined above
const email = GOOGLE_EMAIL as string;
const password = GOOGLE_PASSWORD as string;

async function handlePasswordLogin(page: Page): Promise<void> {
  console.log('Attempting password login...');
  await page.waitForSelector('input[type="password"]', { timeout: 10000 });
  await page.fill('input[type="password"]', password);
  await page.waitForTimeout(1000);
  
  // Look for the Next button and click it
  const nextButton = await page.locator('button[type="button"]').filter({ hasText: 'Next' }).first();
  await nextButton.click();
}

async function handleSignInOptions(page: Page): Promise<void> {
  console.log('On sign-in options screen...');
  
  // Look for "Enter your password" option and click it
  const passwordOption = await page.locator('div').filter({ hasText: /^Enter your password$/ }).first();
  if (await passwordOption.isVisible()) {
    console.log('Selecting password option...');
    await passwordOption.click();
    await page.waitForTimeout(1000);
    await handlePasswordLogin(page);
    return;
  }
  
  console.log('Password option not found, waiting for manual intervention...');
}

async function handleSecurityWarning(page: Page): Promise<void> {
  console.log('Checking for security warning...');
  
  // Check for the security warning text
  const securityWarning = await page.getByText('This browser or app may not be secure').isVisible()
    .catch(() => false);
  
  if (securityWarning) {
    console.log('Security warning detected, clicking "Try again"...');
    const tryAgainButton = await page.getByRole('button', { name: 'Try again' });
    if (await tryAgainButton.isVisible()) {
      await tryAgainButton.click();
      await page.waitForTimeout(2000);
    }
  }
}

async function handlePasskeyScreen(page: Page): Promise<void> {
  console.log('Checking for passkey screen...');
  
  // Wait for the page content to stabilize
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  
  // Try to find the "Try another way" text and button
  const tryAnotherWayText = await page.getByText('Try another way', { exact: true }).first();
  
  if (await tryAnotherWayText.isVisible()) {
    console.log('Found "Try another way" button on passkey screen...');
    // Click the parent button element
    const button = await page.locator('button').filter({ hasText: 'Try another way' }).first();
    await button.click();
    await page.waitForTimeout(2000);
    
    // After clicking "Try another way", handle the sign-in options
    await handleSignInOptions(page);
  } else {
    console.log('No passkey screen detected, continuing...');
  }
}

export async function loginToFathom(page: Page): Promise<void> {
  console.log('Navigating to Fathom login page...');
  
  // Go directly to the sign-in page
  await page.goto('https://fathom.video/users/sign_in', { waitUntil: 'networkidle' });
  console.log('On sign-in page');

  // Click Sign in with Google button
  console.log('Clicking Sign in with Google button...');
  await page.waitForSelector('button >> text=Sign in with Google');
  await page.click('button >> text=Sign in with Google');

  // Wait for Google sign-in page to load
  console.log('Waiting for Google sign-in page...');
  await page.waitForURL(/accounts\.google\.com/);
  
  // Fill in email with a delay to appear more human-like
  console.log('Entering email...');
  await page.waitForSelector('input[type="email"]');
  await page.fill('input[type="email"]', email);
  await page.waitForTimeout(1000);
  
  // Click the Next button after email
  const nextButton = await page.locator('button[type="button"]').filter({ hasText: 'Next' }).first();
  await nextButton.click();
  
  try {
    // Wait for the next screen to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check for security warning first
    await handleSecurityWarning(page);
    
    // Try to handle the passkey screen
    await handlePasskeyScreen(page);
    
    // Check if we're on the password screen
    const passwordField = await page.waitForSelector('input[type="password"]', { timeout: 5000 })
      .catch(() => null);
    
    if (passwordField) {
      await handlePasswordLogin(page);
    }

    // Wait for successful navigation to Fathom
    console.log('Waiting for redirect to Fathom...');
    await page.waitForURL(/fathom\.video/, { timeout: 300000 }); // 5 minute timeout
    console.log('Successfully redirected to Fathom domain');
    
    // Wait for the home page to be fully loaded
    console.log('Waiting for home page to load...');
    try {
      console.log('Waiting for network activity to settle...');
      await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {
        console.log('Network did not become idle, but continuing as page loads progressively...');
      });

      console.log('Looking for call-gallery element...');
      const gallery = await page.waitForSelector('call-gallery', { timeout: 30000, state: 'visible' });
      console.log('Call gallery found:', gallery ? 'yes' : 'no');

      console.log('Current URL after gallery found:', await page.url());
      
      // Log the page content to see what we're working with
      const pageContent = await page.content();
      console.log('Page content snippet:', pageContent.substring(0, 200));
      
      await page.waitForTimeout(3000); // Give extra time for dynamic content to load
      console.log('Extra wait completed');
    } catch (error) {
      console.error('Error during home page load:', error);
      throw error;
    }
    
    console.log('Login and page load successful!');
    
  } catch (error) {
    console.log('Error during automated login:', error);
    console.log('Please complete the sign-in process manually.');
    await page.waitForURL(/fathom\.video/, { timeout: 300000 }); // 5 minute timeout for manual intervention
  }
} 