const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = path.resolve('C:/Users/Akshay Tiwari/.gemini/antigravity-ide/brain/410b466f-1050-465c-8c54-a27c519a5bc1');

async function run() {
  console.log('🚀 Starting Phase 3 Playwright Browser Verification on http://localhost:3000...');

  if (!fs.existsSync(ARTIFACT_DIR)) {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();

  try {
    // -------------------------------------------------------------
    // 1. Authenticate as Priya Sharma (Learner)
    // -------------------------------------------------------------
    console.log('1. Logging in as Priya Sharma...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
    await page.click('button:has-text("Priya Sharma")');
    await page.waitForTimeout(300);
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard', { timeout: 30000 });
    await page.waitForTimeout(1000);

    const consentBtn = page.locator('button:has-text("Acknowledge & Continue")');
    if (await consentBtn.isVisible({ timeout: 3000 })) {
      await consentBtn.click();
      await page.waitForTimeout(800);
    }

    // -------------------------------------------------------------
    // 2. Test Written Exam Portal (/exam/prog-research)
    // -------------------------------------------------------------
    console.log('2. Visiting Written Exam Portal (/exam/prog-research)...');
    await page.goto('http://localhost:3000/exam/prog-research', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);

    // If not yet submitted, draft responses and submit
    const submitFinalBtn = page.locator('button:has-text("Submit final exam")');
    if (await submitFinalBtn.isVisible()) {
      console.log('Drafting exam responses...');
      const textareas = page.locator('textarea');
      const count = await textareas.count();
      for (let i = 0; i < count; i++) {
        await textareas.nth(i).fill(
          `Detailed methodological framework: We propose a cluster randomized evaluation with rigorous baseline stratification across rural districts in Bihar and UP. Key risks are mitigated via dual-entry data checks and weekly supervisor audits.`
        );
      }
      await page.waitForTimeout(500);

      console.log('Opening exam submit confirmation...');
      await submitFinalBtn.click();
      await page.waitForTimeout(800);

      const confirmBtn = page.locator('button:has-text("Confirm & Submit")');
      await confirmBtn.click();
      await page.waitForTimeout(2000);
    }

    const examScreenshot = path.join(ARTIFACT_DIR, '11_exam_submitted_learner.png');
    await page.screenshot({ path: examScreenshot, fullPage: true });
    console.log('📸 Saved:', examScreenshot);

    // -------------------------------------------------------------
    // 3. Test Anonymous Feedback Portal (/feedback)
    // -------------------------------------------------------------
    console.log('3. Visiting Feedback Portal (/feedback)...');
    await page.goto('http://localhost:3000/feedback', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    console.log('Submitting anonymous feedback...');
    const feedbackTextarea = page.locator('textarea');
    await feedbackTextarea.fill(
      'The baseline evaluation framework and CAPI device training were exceptional. The 30-second reading timer provided structured pacing across all technical handbooks.'
    );

    const submitFeedbackBtn = page.locator('button[type="submit"]:has-text("Submit feedback")');
    await submitFeedbackBtn.click();
    await page.waitForTimeout(2000);

    const feedbackScreenshot = path.join(ARTIFACT_DIR, '12_feedback_submitted.png');
    await page.screenshot({ path: feedbackScreenshot, fullPage: true });
    console.log('📸 Saved:', feedbackScreenshot);

    // -------------------------------------------------------------
    // 4. Test Announcements Feed (/announcements)
    // -------------------------------------------------------------
    console.log('4. Visiting Announcements Feed (/announcements)...');
    await page.goto('http://localhost:3000/announcements', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Click Research cohort filter
    const researchFilterBtn = page.locator('button:has-text("Research")');
    if (await researchFilterBtn.isVisible()) {
      await researchFilterBtn.click();
      await page.waitForTimeout(600);
    }

    const announcementsScreenshot = path.join(ARTIFACT_DIR, '13_announcements_feed.png');
    await page.screenshot({ path: announcementsScreenshot, fullPage: true });
    console.log('📸 Saved:', announcementsScreenshot);

    // -------------------------------------------------------------
    // 5. Test Cohort & Direct Chat (/chat)
    // -------------------------------------------------------------
    console.log('5. Visiting Messages & Channels (/chat)...');
    await page.goto('http://localhost:3000/chat', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Type a message in the active cohort chat
    const chatInput = page.locator('input[placeholder*="Message"]');
    await chatInput.fill('Just completed the M&E written evaluation. Looking forward to Friday cohort review!');
    await page.waitForTimeout(300);

    const sendBtn = page.locator('button:has-text("Send")');
    await sendBtn.click();
    await page.waitForTimeout(1500);

    const chatScreenshot = path.join(ARTIFACT_DIR, '14_chat_active_thread.png');
    await page.screenshot({ path: chatScreenshot, fullPage: true });
    console.log('📸 Saved:', chatScreenshot);

    // -------------------------------------------------------------
    // 6. Test Gradebook & Transcript (/grades)
    // -------------------------------------------------------------
    console.log('6. Visiting Gradebook & Transcript (/grades)...');
    await page.goto('http://localhost:3000/grades', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);

    const gradebookScreenshot = path.join(ARTIFACT_DIR, '15_gradebook_transcript.png');
    await page.screenshot({ path: gradebookScreenshot, fullPage: true });
    console.log('📸 Saved:', gradebookScreenshot);

    // -------------------------------------------------------------
    // 7. Test Instructor View (Dr. Vikram Mehta)
    // -------------------------------------------------------------
    console.log('7. Switching to Instructor Dr. Vikram Mehta...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
    await page.click('button:has-text("Dr. Vikram Mehta")');
    await page.waitForTimeout(300);
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard', { timeout: 30000 });
    await page.waitForTimeout(1000);

    const instructorConsent = page.locator('button:has-text("Acknowledge & Continue")');
    if (await instructorConsent.isVisible({ timeout: 2000 }).catch(() => false)) {
      await instructorConsent.click();
      await page.waitForTimeout(800);
    }

    // Grade Priya Sharma's exam submission
    console.log('Instructor evaluating exam submissions at /exam/prog-research...');
    await page.goto('http://localhost:3000/exam/prog-research', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);

    // Check if DPDP consent appeared on exam page as well
    if (await instructorConsent.isVisible({ timeout: 1000 }).catch(() => false)) {
      await instructorConsent.click();
      await page.waitForTimeout(500);
    }

    const gradeBtn = page.locator('button:has-text("Grade Submission")').first();
    if (await gradeBtn.isVisible()) {
      await gradeBtn.click();
      await page.waitForTimeout(800);

      // Fill marks and feedback
      const marksInput = page.locator('input[type="number"]');
      await marksInput.fill('28');

      const feedbackInput = page.locator('div[role="dialog"] textarea');
      await feedbackInput.fill('Outstanding operational insight, sampling clarity, and thorough hypothesis risk mitigations.');

      const saveGradeBtn = page.locator('button:has-text("Save Grade & Feedback")');
      await saveGradeBtn.click();
      await page.waitForTimeout(2000);
    }

    const instructorExamScreenshot = path.join(ARTIFACT_DIR, '16_instructor_graded_exam.png');
    await page.screenshot({ path: instructorExamScreenshot, fullPage: true });
    console.log('📸 Saved:', instructorExamScreenshot);

    // View Instructor Feedback Dashboard with DPDP Privacy Check
    console.log('Instructor reviewing feedback dashboard at /feedback...');
    await page.goto('http://localhost:3000/feedback', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);

    const instructorFeedbackScreenshot = path.join(ARTIFACT_DIR, '17_instructor_feedback_privacy.png');
    await page.screenshot({ path: instructorFeedbackScreenshot, fullPage: true });
    console.log('📸 Saved:', instructorFeedbackScreenshot);

    console.log('🎉 Phase 3 Playwright Browser Verification Complete!');
  } catch (error) {
    console.error('❌ Phase 3 Browser verification error:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();
