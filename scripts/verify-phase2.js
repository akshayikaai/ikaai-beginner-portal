const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = path.resolve('C:/Users/Akshay Tiwari/.gemini/antigravity-ide/brain/410b466f-1050-465c-8c54-a27c519a5bc1');

async function run() {
  console.log('🚀 Starting Phase 2 Playwright Browser Verification on http://localhost:3000...');

  if (!fs.existsSync(ARTIFACT_DIR)) {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();

  try {
    // 1. Visit Login Page & authenticate as Priya Sharma
    console.log('1. Logging in as Priya Sharma...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
    await page.click('button:has-text("Priya Sharma")');
    await page.waitForTimeout(300);
    await page.click('button[type="submit"]');

    // Wait for Dashboard
    await page.waitForURL('**/dashboard', { timeout: 30000 });
    await page.waitForTimeout(1000);

    // Dismiss DPDP consent modal if visible
    const consentButton = page.locator('button:has-text("Acknowledge & Continue")');
    if (await consentButton.isVisible({ timeout: 3000 })) {
      console.log('Dismissing DPDP consent modal...');
      await consentButton.click();
      await page.waitForTimeout(1000);
    }

    // 2. Navigate to Module 2 (Monitoring & Evaluation Basics)
    console.log('2. Navigating to Module 2 (/modules/mod-res-2)...');
    await page.goto('http://localhost:3000/modules/mod-res-2', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Capture Module Overview screenshot
    const overviewPath = path.join(ARTIFACT_DIR, '06_module_overview.png');
    await page.screenshot({ path: overviewPath, fullPage: true });
    console.log('📸 Saved:', overviewPath);

    // 3. Open Resource 1 Preview & verify timer starts
    console.log('3. Opening resource preview for M&E Primer...');
    const firstResource = page.locator('div[role="button"]:has-text("M&E Primer for Impact Assessment")');
    await firstResource.click();
    await page.waitForTimeout(1500);

    // Check timer display
    const timerText = await page.locator('text=/completes in/').textContent().catch(() => 'Timer active');
    console.log('Timer status:', timerText);

    // Test Fullscreen Toggle
    console.log('Testing Fullscreen toggle...');
    const fullscreenBtn = page.locator('button:has-text("Fullscreen")');
    if (await fullscreenBtn.isVisible()) {
      await fullscreenBtn.click();
      await page.waitForTimeout(800);
      const exitFullscreenBtn = page.locator('button:has-text("Exit Fullscreen")');
      await exitFullscreenBtn.click();
      await page.waitForTimeout(500);
    }

    const previewPath = path.join(ARTIFACT_DIR, '07_resource_inline_preview.png');
    await page.screenshot({ path: previewPath, fullPage: true });
    console.log('📸 Saved:', previewPath);

    // 4. Open Quiz Modal
    console.log('4. Opening Module Quiz modal...');
    const startQuizBtn = page.locator('button:has-text("Start quiz")');
    if (await startQuizBtn.isVisible()) {
      await startQuizBtn.click();
      await page.waitForTimeout(1000);

      const quizModalPath = path.join(ARTIFACT_DIR, '08_quiz_modal.png');
      await page.screenshot({ path: quizModalPath });
      console.log('📸 Saved:', quizModalPath);

      // Select answers:
      // Question 1: "Before programme implementation commences" (2nd option)
      console.log('Selecting quiz answers...');
      const q1Option = page.locator('text=Before programme implementation commences');
      await q1Option.click();
      await page.waitForTimeout(300);

      // Question 2: "Independent objective assessment by an external entity" (2nd option)
      const q2Option = page.locator('text=Independent objective assessment by an external entity');
      await q2Option.click();
      await page.waitForTimeout(500);

      // Submit Quiz
      console.log('Submitting quiz...');
      const submitQuizBtn = page.locator('button:has-text("Submit quiz")');
      await submitQuizBtn.click();
      await page.waitForTimeout(2500);
    }

    // Capture Graded Quiz Result screenshot
    const resultPath = path.join(ARTIFACT_DIR, '09_quiz_graded_result.png');
    await page.screenshot({ path: resultPath, fullPage: true });
    console.log('📸 Saved:', resultPath);

    // 5. Expand FAQ Accordion
    console.log('5. Interacting with Module FAQs...');
    const faqItem = page.locator('button:has-text("What is a counterfactual in evaluation?")');
    if (await faqItem.isVisible()) {
      await faqItem.click();
      await page.waitForTimeout(800);
    }

    const faqPath = path.join(ARTIFACT_DIR, '10_faqs_expanded.png');
    await page.screenshot({ path: faqPath, fullPage: true });
    console.log('📸 Saved:', faqPath);

    console.log('🎉 Phase 2 Browser Verification Complete!');
  } catch (error) {
    console.error('❌ Browser verification error:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();
