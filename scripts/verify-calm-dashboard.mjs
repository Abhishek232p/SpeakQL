import { chromium } from "@playwright/test";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

if (fs.existsSync(".env.local")) {
  dotenv.config({ path: ".env.local" });
}
if (fs.existsSync(".env.test.local")) {
  dotenv.config({ path: ".env.test.local" });
}

const baseUrl = "http://localhost:3000";
const testEmail = process.env.TEST_ACCOUNT_EMAIL || "facttech.prime@gmail.com";
const testPassword = process.env.TEST_ACCOUNT_PASSWORD || "Spk_2bQvm0RntGfCt9TRaD0nN8mM!9x";

const artifactDir = "C:\\Users\\abhis\\.gemini\\antigravity-ide\\brain\\78fd5760-1399-4635-b457-4f46c4a8dde9";

async function verifyDashboardUX() {
  console.log(`[UX Test] Launching Chromium to verify calm beginner dashboard at ${baseUrl}`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  try {
    // 1. Login
    console.log("[UX Test] Navigating to login page...");
    await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');

    // 2. Wait for dashboard
    console.log("[UX Test] Waiting for dashboard navigation...");
    await page.waitForURL("**/dashboard", { timeout: 15000 });
    await page.waitForSelector(".duo-command-center", { timeout: 10000 });

    const pageContent = await page.content();

    // 3. Check for Primary Recommended Action
    const hasPrimaryAction = pageContent.includes("PRIMARY RECOMMENDED ACTION");
    const hasStartLesson1 = pageContent.includes("START LESSON 1");
    const hasActiveDialogueMission = pageContent.includes("Active Dialogue Mission");
    const hasLessonCards = (await page.locator(".duo-lesson-card").count()) > 0;
    const hasStoneButtons = (await page.locator(".duo-stone-button").count()) > 0;

    console.log(`--> Has PRIMARY RECOMMENDED ACTION: ${hasPrimaryAction}`);
    console.log(`--> Has START LESSON 1 Button: ${hasStartLesson1}`);
    console.log(`--> Has Competing Active Dialogue Mission: ${hasActiveDialogueMission} (should be false)`);
    console.log(`--> Lesson cards count: ${await page.locator(".duo-lesson-card").count()}`);
    console.log(`--> Stepping stone button count: ${await page.locator(".duo-stone-button").count()}`);

    // Capture desktop screenshot
    const desktopScreenshotPath = path.join(artifactDir, "dashboard_calm_desktop_verified.png");
    await page.screenshot({ path: desktopScreenshotPath, fullPage: true });
    console.log(`[UX Test] Desktop screenshot saved to ${desktopScreenshotPath}`);

    // 4. Test Mobile Viewport (iPhone 14 / 390x844)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(500);
    const mobileScreenshotPath = path.join(artifactDir, "dashboard_calm_mobile_verified.png");
    await page.screenshot({ path: mobileScreenshotPath, fullPage: true });
    console.log(`[UX Test] Mobile screenshot saved to ${mobileScreenshotPath}`);

    // 5. Test clicking START LESSON to ensure lesson modal opens cleanly
    await page.setViewportSize({ width: 1280, height: 800 });
    const startLessonBtn = page.locator('button:has-text("START LESSON")').first();
    if (await startLessonBtn.count() > 0) {
      console.log("[UX Test] Clicking START LESSON ▶ button...");
      await startLessonBtn.click();
      await page.waitForSelector(".duo-lesson-overlay", { timeout: 10000 });
      console.log("[UX Test] Lesson modal successfully opened!");
      const modalScreenshotPath = path.join(artifactDir, "lesson_modal_verified.png");
      await page.screenshot({ path: modalScreenshotPath });
      console.log(`[UX Test] Lesson modal screenshot saved to ${modalScreenshotPath}`);
    } else {
      console.log("[UX Test] Clicking first PRACTICE AGAIN button...");
      const practiceBtn = page.locator('button:has-text("PRACTICE AGAIN")').first();
      await practiceBtn.click();
      await page.waitForSelector(".duo-lesson-overlay", { timeout: 10000 });
      console.log("[UX Test] Lesson modal successfully opened from practice!");
      const modalScreenshotPath = path.join(artifactDir, "lesson_modal_verified.png");
      await page.screenshot({ path: modalScreenshotPath });
      console.log(`[UX Test] Lesson modal screenshot saved to ${modalScreenshotPath}`);
    }

    console.log("\n=======================================================");
    console.log("UX VERIFICATION SUMMARY:");
    console.log(`- Competing mission removed: ${!hasActiveDialogueMission}`);
    console.log(`- Primary action dominant: ${hasPrimaryAction && hasStartLesson1}`);
    console.log(`- Structured lesson cards: ${hasLessonCards}`);
    console.log(`- Test compatibility retained: ${hasStoneButtons}`);
    console.log("=======================================================\n");

  } catch (err) {
    console.error("[UX Test] Error during verification:", err);
  } finally {
    await browser.close();
  }
}

verifyDashboardUX();
