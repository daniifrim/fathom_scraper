import { Page } from 'playwright';
import * as fs from 'fs/promises';
import * as path from 'path';
import { performance } from 'perf_hooks';

interface VideoMetadata {
  title: string;
  date: string;
  duration: string;
  url: string;
  thumbnailUrl: string;
  section: string;  // e.g., "Yesterday", "Last Week"
  checkmarks: number; // Number of checkmarks shown
}

interface TranscriptData {
  meetingTitle: string;
  transcript: string;
  summary: string;
  metadata: VideoMetadata;
}

async function getVideoMetadata(thumbnailElement: any): Promise<VideoMetadata> {
  console.log('Extracting metadata from thumbnail...');
  
  // Get the section title (Yesterday, Last Week, etc.)
  const section = await thumbnailElement.evaluate((el: Element) => {
    const sectionHeader = el.closest('section')?.previousElementSibling;
    return sectionHeader ? sectionHeader.textContent || '' : '';
  });
  console.log('Found section:', section);

  // Using locator methods instead of $eval
  const title = await thumbnailElement
    .locator('call-gallery-thumbnail-title span')
    .first()
    .textContent();
  console.log('Found title:', title);
  
  const date = await thumbnailElement
    .locator('li.text-default')
    .first()
    .textContent();
  console.log('Found date:', date);
  
  const duration = await thumbnailElement
    .locator('span.font-sans')
    .first()
    .textContent();
  console.log('Found duration:', duration);
  
  const url = await thumbnailElement
    .locator('a')
    .first()
    .getAttribute('href');
  console.log('Found URL:', url);
  
  const thumbnailUrl = await thumbnailElement
    .locator('img')
    .first()
    .getAttribute('src');
  console.log('Found thumbnail URL:', thumbnailUrl);

  // Get number of checkmarks
  const checkmarksText = await thumbnailElement
    .locator('li.text-info-warn')
    .first()
    .textContent();
  const checkmarks = checkmarksText ? parseInt(checkmarksText.replace(/\D/g, '')) || 0 : 0;
  console.log('Found checkmarks:', checkmarks);

  return {
    title: title?.trim() || 'Untitled',
    date: date?.trim() || '',
    duration: duration?.trim() || '',
    url: url || '',
    thumbnailUrl: thumbnailUrl || '',
    section: section.trim(),
    checkmarks
  };
}

export async function saveTranscript(data: TranscriptData): Promise<string> {
  // Create transcripts directory if it doesn't exist
  const transcriptsDir = path.join(process.cwd(), 'transcripts');
  await fs.mkdir(transcriptsDir, { recursive: true });

  // Create a filename from the title and date
  const safeTitle = data.metadata.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const safeDate = data.metadata.date.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const filename = `${safeTitle}_${safeDate}.txt`;
  const filepath = path.join(transcriptsDir, filename);

  // Process summary to remove extra line breaks
  const processedSummary = data.summary
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');

  // Process transcript to remove extra line breaks
  const processedTranscript = data.transcript
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');

  // Create the content with proper line breaks and clear section separation
  const content = `=== Meeting Information ===
Title: ${data.metadata.title}
Date: ${data.metadata.date}
Duration: ${data.metadata.duration}
URL: ${data.metadata.url}
Section: ${data.metadata.section}
Checkmarks: ${data.metadata.checkmarks}

=== Summary ===
${processedSummary}

=== Transcript ===
${processedTranscript}`;

  // Save to file with explicit encoding
  await fs.writeFile(filepath, content, { encoding: 'utf8' });
  
  // Verify the file was written
  const stats = await fs.stat(filepath);
  console.log(`Transcript file size: ${stats.size} bytes`);
  
  return filepath;
}

function logTimingInfo(operation: string, startTime: number) {
  const endTime = performance.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  console.log(`${operation} took ${duration} seconds`);
}

export async function scrapeMeetingTranscript(page: Page): Promise<TranscriptData> {
  const scrapeStartTime = performance.now();
  console.log('\n=== Starting Scraper ===');
  
  try {
    const navigationStartTime = performance.now();
    // Verify page is still active
    await page.evaluate(() => {
      console.log('Page is active and JavaScript is running');
      return document.readyState;
    });
    
    console.log('Page state:', await page.evaluate(() => document.readyState));
    console.log('Current URL:', await page.url());

    // Make sure we're on the home page
    if (!page.url().includes('fathom.video/home')) {
      console.log('Not on home page, navigating...');
      await page.goto('https://fathom.video/home', { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });
      console.log('Navigation complete');
    }
    logTimingInfo('Navigation to home page', navigationStartTime);

    // Immediately check what we can see
    console.log('\n=== Page Structure Check ===');
    const pageTitle = await page.title();
    console.log('Page title:', pageTitle);
    
    // Log all main elements we can find
    const elements = await page.evaluate(() => {
      const results: any = {};
      results.inertiaApp = !!document.querySelector('inertia-app');
      results.appLayout = !!document.querySelector('app-layout');
      results.main = !!document.querySelector('main');
      results.callGallery = !!document.querySelector('call-gallery');
      results.thumbnails = document.querySelectorAll('call-gallery-thumbnail').length;
      return results;
    });
    console.log('Found elements:', elements);

    // Wait for the main container which holds the gallery content
    console.log('\n=== Looking for Gallery Content ===');
    const mainContainer = await page.waitForSelector('body > inertia-app > app-layout > main', { 
      timeout: 5000,
      state: 'attached'  // Change to attached state which is less strict
    });
    console.log('Main container found:', !!mainContainer);

    // Try simpler selector first
    console.log('Looking for any call-gallery-thumbnail...');
    const anyThumbnail = await page.locator('call-gallery-thumbnail').first();
    const thumbnailCount = await anyThumbnail.count();
    console.log('Number of thumbnails found with simple selector:', thumbnailCount);

    if (thumbnailCount > 0) {
      console.log('Found thumbnails with simple selector, proceeding with first one');
      // Rest of the code...
    }

    // Wait for the meeting thumbnail to become visible
    console.log('Waiting for meeting thumbnail...');
    try {
      const thumbnailSelector = 'body > inertia-app > app-layout > main > page-completed-calls > call-gallery > section:nth-child(2) > call-gallery-thumbnail';
      console.log('Using thumbnail selector:', thumbnailSelector);
      
      const thumbnail = await page.waitForSelector(thumbnailSelector, { timeout: 10000 });
      console.log('Thumbnail element found:', thumbnail ? 'yes' : 'no');
      
      if (thumbnail) {
        const thumbnailHtml = await thumbnail.evaluate(el => el.outerHTML);
        console.log('Thumbnail structure (first 200 chars):', thumbnailHtml.substring(0, 200));
      }
    } catch (error) {
      console.error('Failed to find thumbnail:', error);
      throw error;
    }
    
    // Selecting the meeting thumbnail using the updated selector path
    console.log('Attempting to select first meeting...');
    const selectedMeeting = await page.locator('body > inertia-app > app-layout > main > page-completed-calls > call-gallery > section:nth-child(2) > call-gallery-thumbnail').first();
    const count = await selectedMeeting.count();
    console.log('Number of meetings found:', count);
    
    if (!count) {
      console.error('No meetings found with the selector');
      throw new Error('No meeting found using updated selector');
    }
    
    // Get metadata for the selected meeting
    const metadataStartTime = performance.now();
    console.log('Attempting to extract metadata...');
    let metadata: VideoMetadata;
    try {
      metadata = await getVideoMetadata(selectedMeeting);
      console.log('Successfully extracted metadata:', {
        title: metadata.title || 'No title found',
        date: metadata.date || 'No date found',
        duration: metadata.duration || 'No duration found',
        section: metadata.section || 'No section found',
        checkmarks: metadata.checkmarks || 'No checkmarks found',
        url: metadata.url || 'No URL found',
        thumbnailUrl: metadata.thumbnailUrl || 'No thumbnail URL found'
      });
    } catch (error) {
      console.error('Failed to extract metadata:', error);
      throw error;
    }
    logTimingInfo('Metadata extraction', metadataStartTime);

    // Click to open the meeting
    console.log('Looking for meeting link...');
    try {
      const meetingLink = await selectedMeeting.locator('a').first();
      await meetingLink.waitFor({ state: 'visible' });
      console.log('Meeting link found, attempting to click...');
      await meetingLink.click();
      console.log('Successfully clicked meeting link');
    } catch (error) {
      console.error('Failed to click meeting link:', error);
      throw error;
    }
    
    // Wait for page transition by URL change
    console.log('Waiting for page transition...');
    await page.waitForURL(/calls\/[0-9]+/);
    console.log('Page transition complete, new URL:', await page.url());
    
    // First get the summary since we're already on that page
    console.log('Looking for Copy Summary button...');
    try {
      // Wait for the page to be ready for interaction
      await page.waitForLoadState('domcontentloaded');
      
      // Wait for and click the Copy Summary button
      console.log('Waiting for Copy Summary button to appear...');
      const copySummaryButton = await page.locator('button').filter({ hasText: 'Copy Summary' });
      await copySummaryButton.waitFor({ state: 'visible' });
      console.log('Copy Summary button found and visible');
      
      await copySummaryButton.click();
      console.log('Clicked Copy Summary button');

      // Wait for summary content in clipboard
      console.log('Waiting for summary content in clipboard...');
      let summaryContent = '';
      let attempts = 0;
      const maxAttempts = 20; // 20 attempts * 500ms = 10 seconds max wait
      
      while (attempts < maxAttempts) {
        try {
          const clipboardText = await page.evaluate(() => {
            return new Promise<string>((resolve, reject) => {
              navigator.permissions.query({ name: 'clipboard-read' as PermissionName })
                .then(result => {
                  if (result.state === 'granted') {
                    return navigator.clipboard.readText();
                  } else {
                    throw new Error(`Clipboard permission not granted: ${result.state}`);
                  }
                })
                .then(text => {
                  if (text && text.length > 0) {
                    resolve(text);
                  } else {
                    reject(new Error('Clipboard was empty'));
                  }
                })
                .catch(reject);
            });
          });

          // Check if we got meaningful content
          if (clipboardText && clipboardText.length > 100 && !clipboardText.includes('<button')) {
            summaryContent = clipboardText;
            console.log(`Successfully got summary content, length: ${summaryContent.length} characters`);
            break;
          }
          
          console.log(`Waiting for valid summary content (attempt ${attempts + 1}/${maxAttempts})...`);
          await page.waitForTimeout(500);
          attempts++;
        } catch (error) {
          console.log('Clipboard read attempt failed, retrying...');
          await page.waitForTimeout(500);
          attempts++;
        }
      }

      if (!summaryContent || summaryContent.length <= 100 || summaryContent.includes('<button')) {
        throw new Error('Failed to get valid summary content after multiple attempts');
      }

      // Now switch to transcript tab and get the transcript
      console.log('Looking for Transcript button...');
      const transcriptButton = await page.locator('button.uppercase').filter({ hasText: 'Transcript' });
      await transcriptButton.waitFor({ state: 'visible' });
      console.log('Transcript button found and visible');
      
      await transcriptButton.click();
      console.log('Successfully clicked transcript button');
      
      // Click Copy Transcript button
      console.log('Clicking Copy Transcript button...');
      const copyTranscriptButton = await page.locator('button').filter({ hasText: 'Copy Transcript' });
      await copyTranscriptButton.click();
      console.log('Clicked Copy Transcript button');

      // Wait for transcript content in clipboard
      console.log('Waiting for transcript content in clipboard...');
      let transcriptContent = '';
      attempts = 0;
      
      while (attempts < maxAttempts) {
        try {
          const clipboardText = await page.evaluate(() => {
            return new Promise<string>((resolve, reject) => {
              navigator.permissions.query({ name: 'clipboard-read' as PermissionName })
                .then(result => {
                  if (result.state === 'granted') {
                    return navigator.clipboard.readText();
                  } else {
                    throw new Error(`Clipboard permission not granted: ${result.state}`);
                  }
                })
                .then(text => {
                  if (text && text.length > 0) {
                    resolve(text);
                  } else {
                    reject(new Error('Clipboard was empty'));
                  }
                })
                .catch(reject);
            });
          });

          // Check if we got meaningful content and it's different from the summary
          if (clipboardText && clipboardText.length > 1000 && clipboardText !== summaryContent) {
            transcriptContent = clipboardText;
            console.log(`Successfully got transcript content, length: ${transcriptContent.length} characters`);
            break;
          }
          
          console.log(`Waiting for valid transcript content (attempt ${attempts + 1}/${maxAttempts})...`);
          await page.waitForTimeout(500);
          attempts++;
        } catch (error) {
          console.log('Clipboard read attempt failed, retrying...');
          await page.waitForTimeout(500);
          attempts++;
        }
      }

      if (!transcriptContent || transcriptContent.length <= 1000 || transcriptContent === summaryContent) {
        throw new Error('Failed to get valid transcript content after multiple attempts');
      }
      
      const transcriptStartTime = performance.now();
      const result: TranscriptData = { 
        meetingTitle: metadata.title,
        transcript: transcriptContent,
        summary: summaryContent,
        metadata 
      };
      logTimingInfo('Content extraction', transcriptStartTime);
      logTimingInfo('Total scraping operation', scrapeStartTime);
      return result;
      
    } catch (error) {
      console.error('Failed to extract meeting content:', error);
      throw error;
    }
  } catch (error) {
    console.error('Failed to scrape meeting transcript:', error);
    throw error;
  }
} 