const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = path.resolve('C:/Users/Akshay Tiwari/.gemini/antigravity-ide/brain/410b466f-1050-465c-8c54-a27c519a5bc1');

async function run() {
  console.log('🚀 Starting Playwright Browser Verification on http://localhost:3000...');
  
  if (!fs.existsSync(ARTIFACT_DIR)) {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  try {
    // 1. Visit Login Page
    console.log('Visiting http://localhost:3000/login...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
    
    const loginScreenshotPath = path.join(ARTIFACT_DIR, '01_login_desktop.png');
    await page.screenshot({ path: loginScreenshotPath, fullPage: true });
    console.log('📸 Saved login screenshot:', loginScreenshotPath);

    // 2. Click Demo Login for Priya Sharma
    console.log('Clicking Priya Sharma demo login...');
    await page.click('button:has-text("Priya Sharma")');
    await page.waitForTimeout(400);

    // Click Sign in button
    console.log('Submitting login form...');
    await page.click('button[type="submit"]');

    // 3. Wait for Dashboard navigation
    console.log('Waiting for /dashboard...');
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    await page.waitForTimeout(1000);

    // 4. Handle DPDP Consent Modal
    const consentButton = page.locator('button:has-text("Acknowledge & Continue")');
    if (await consentButton.isVisible({ timeout: 4000 })) {
      console.log('DPDP Consent modal detected. Clicking Acknowledge & Continue...');
      await consentButton.click();
      await page.waitForTimeout(1200);
    }

    // 5. Capture Dashboard Desktop
    const dashboardDesktopPath = path.join(ARTIFACT_DIR, '02_dashboard_desktop.png');
    await page.screenshot({ path: dashboardDesktopPath, fullPage: true });
    console.log('📸 Saved dashboard desktop screenshot:', dashboardDesktopPath);

    // 6. Test Theme Toggle to Dark Mode via evaluate
    console.log('Switching to dark mode...');
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('ikaai-theme', 'dark');
    });
    await page.waitForTimeout(600);

    const dashboardDarkPath = path.join(ARTIFACT_DIR, '03_dashboard_dark.png');
    await page.screenshot({ path: dashboardDarkPath, fullPage: true });
    console.log('📸 Saved dashboard dark mode screenshot:', dashboardDarkPath);

    // Switch back to light for mobile check
    await page.evaluate(() => {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('ikaai-theme', 'light');
    });

    // 7. Mobile Viewport (375x812)
    console.log('Setting mobile viewport (375x812)...');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(600);

    const dashboardMobilePath = path.join(ARTIFACT_DIR, '04_dashboard_mobile.png');
    await page.screenshot({ path: dashboardMobilePath, fullPage: true });
    console.log('📸 Saved dashboard mobile screenshot:', dashboardMobilePath);

    // 8. Open Mobile Slide-In Drawer
    console.log('Opening mobile slide-in drawer...');
    await page.click('button[aria-label="Open navigation menu"]');
    await page.waitForTimeout(600);

    const drawerMobilePath = path.join(ARTIFACT_DIR, '05_drawer_mobile.png');
    await page.screenshot({ path: drawerMobilePath });
    console.log('📸 Saved mobile drawer screenshot:', drawerMobilePath);

    console.log('🎉 All browser verifications completed successfully!');
  } catch (err) {
    console.error('❌ Browser verification failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();
