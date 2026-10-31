const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = path.resolve('C:/Users/Akshay Tiwari/.gemini/antigravity-ide/brain/410b466f-1050-465c-8c54-a27c519a5bc1');

async function run() {
  console.log('🚀 Starting Phase 4 Playwright Browser Verification on http://localhost:3000...');

  if (!fs.existsSync(ARTIFACT_DIR)) {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });

  try {
    // -------------------------------------------------------------
    // 1. Priya Sharma Context (Certificate in Progress Roadmap)
    // -------------------------------------------------------------
    console.log('1. Logging in as Priya Sharma (Certificate in Progress)...');
    const priyaContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const priyaPage = await priyaContext.newPage();

    await priyaPage.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
    await priyaPage.locator('text=Priya Sharma').click();
    await priyaPage.waitForTimeout(400);
    await priyaPage.click('button[type="submit"]');

    await priyaPage.waitForURL('**/dashboard', { timeout: 30000 });
    await priyaPage.waitForTimeout(1000);

    const consentBtn = priyaPage.locator('button:has-text("Acknowledge & Continue")');
    if (await consentBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await consentBtn.click();
      await priyaPage.waitForTimeout(800);
    }

    console.log('Visiting Certificate page for Priya Sharma at /certificate/prog-research...');
    await priyaPage.goto('http://localhost:3000/certificate/prog-research', { waitUntil: 'networkidle' });
    await priyaPage.waitForTimeout(1500);

    const certRoadmapScreenshot = path.join(ARTIFACT_DIR, '18_certificate_eligibility_roadmap.png');
    await priyaPage.screenshot({ path: certRoadmapScreenshot, fullPage: true });
    console.log('📸 Saved:', certRoadmapScreenshot);
    await priyaContext.close();

    // -------------------------------------------------------------
    // 2. Ananya Sen Context (Official Issued Certificate)
    // -------------------------------------------------------------
    console.log('2. Logging in as Ananya Sen (Fully Certified Learner)...');
    const ananyaContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const ananyaPage = await ananyaContext.newPage();

    await ananyaPage.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
    await ananyaPage.locator('text=Ananya Sen').click();
    await ananyaPage.waitForTimeout(400);
    await ananyaPage.click('button[type="submit"]');

    await ananyaPage.waitForURL('**/dashboard', { timeout: 30000 });
    await ananyaPage.waitForTimeout(1000);

    const ananyaConsent = ananyaPage.locator('button:has-text("Acknowledge & Continue")');
    if (await ananyaConsent.isVisible({ timeout: 2000 }).catch(() => false)) {
      await ananyaConsent.click();
      await ananyaPage.waitForTimeout(800);
    }

    console.log('Visiting Official Issued Certificate for Ananya Sen at /certificate/prog-field...');
    await ananyaPage.goto('http://localhost:3000/certificate/prog-field', { waitUntil: 'networkidle' });
    await ananyaPage.waitForTimeout(1800);

    const certIssuedScreenshot = path.join(ARTIFACT_DIR, '19_certificate_issued_official.png');
    await ananyaPage.screenshot({ path: certIssuedScreenshot, fullPage: true });
    console.log('📸 Saved:', certIssuedScreenshot);
    await ananyaContext.close();

    // -------------------------------------------------------------
    // 3. Public Verification Context (/verify/v-ikaai-cert-8492)
    // -------------------------------------------------------------
    console.log('3. Visiting Public Verification Page (/verify/v-ikaai-cert-8492)...');
    const publicContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const publicPage = await publicContext.newPage();

    await publicPage.goto('http://localhost:3000/verify/v-ikaai-cert-8492', { waitUntil: 'networkidle' });
    await publicPage.waitForTimeout(1500);

    const publicVerifyScreenshot = path.join(ARTIFACT_DIR, '20_public_credential_verification.png');
    await publicPage.screenshot({ path: publicVerifyScreenshot, fullPage: true });
    console.log('📸 Saved:', publicVerifyScreenshot);
    await publicContext.close();

    // -------------------------------------------------------------
    // 4. Admin Context (Deepak Joshi - Cohort Analytics & DPDP Exit)
    // -------------------------------------------------------------
    console.log('4. Logging in as Deepak Joshi (Admin)...');
    const adminContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const adminPage = await adminContext.newPage();

    await adminPage.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
    await adminPage.locator('text=Deepak Joshi').click();
    await adminPage.waitForTimeout(400);
    await adminPage.click('button[type="submit"]');

    await adminPage.waitForURL('**/dashboard', { timeout: 30000 });
    await adminPage.waitForTimeout(1000);

    const adminConsent = adminPage.locator('button:has-text("Acknowledge & Continue")');
    if (await adminConsent.isVisible({ timeout: 2000 }).catch(() => false)) {
      await adminConsent.click();
      await adminPage.waitForTimeout(800);
    }

    console.log('Visiting Admin Reports at /admin/reports...');
    await adminPage.goto('http://localhost:3000/admin/reports', { waitUntil: 'networkidle' });
    await adminPage.waitForTimeout(1500);

    const adminAnalyticsScreenshot = path.join(ARTIFACT_DIR, '21_admin_cohort_analytics.png');
    await adminPage.screenshot({ path: adminAnalyticsScreenshot, fullPage: true });
    console.log('📸 Saved:', adminAnalyticsScreenshot);

    // Switch to Users & DPDP Exit Management tab
    console.log('Switching to Learner Directory & DPDP Exit Management tab...');
    await adminPage.click('button:has-text("Learner Directory & DPDP Exit Management")');
    await adminPage.waitForTimeout(1000);

    // Click "Anonymise Exit" button
    const anonymiseBtn = adminPage.locator('button:has-text("Anonymise Exit")').first();
    if (await anonymiseBtn.isVisible()) {
      await anonymiseBtn.click();
      await adminPage.waitForTimeout(800);
    }

    const adminAnonymiseModalScreenshot = path.join(ARTIFACT_DIR, '22_admin_dpdp_anonymise_modal.png');
    await adminPage.screenshot({ path: adminAnonymiseModalScreenshot, fullPage: true });
    console.log('📸 Saved:', adminAnonymiseModalScreenshot);

    await adminContext.close();

    console.log('🎉 Phase 4 Playwright Browser Verification Complete!');
  } catch (error) {
    console.error('❌ Phase 4 Browser verification error:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();
