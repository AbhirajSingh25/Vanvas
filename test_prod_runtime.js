const puppeteer = require("./frontend/node_modules/puppeteer-core");
const fs = require("fs");
const path = require("path");

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const ARTIFACT_DIR = "C:\\Users\\user\\.gemini\\antigravity-ide\\brain\\07175472-8f38-46a1-9644-e37d766a727c";
const BASE_URL = process.env.TARGET_URL || "https://vanvasai.vercel.app";

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTests() {
  console.log(`[TEST-RUNNER] Starting Chrome from: ${CHROME_PATH}`);
  console.log(`[TEST-RUNNER] Target Base URL: ${BASE_URL}`);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--window-size=1280,800"
    ]
  });

  const results = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    pages: {},
    roadTripTests: [],
    askVanvasTests: [],
    planFlow: {},
    consoleErrors: [],
    failedRequests: []
  };

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  page.on("dialog", async (dialog) => {
    console.log(`[BROWSER DIALOG ALERT] "${dialog.message()}"`);
    results.consoleErrors.push({ text: `Alert Dialog: ${dialog.message()}` });
    await dialog.dismiss();
  });

  page.on("response", async (res) => {
    if (res.url().includes("/api/v1/")) {
      const status = res.status();
      const url = res.url();
      console.log(`[API RESPONSE] ${res.request().method()} ${url} -> ${status}`);
    }
  });

  page.on("requestfailed", (req) => {
    console.log(`[REQUEST FAILED] ${req.url()} (${req.failure()?.errorText})`);
    results.failedRequests.push({ url: req.url(), error: req.failure()?.errorText });
  });

  // 1. Home Page Verification
  console.log(`\n--- 1. Testing Home Page: ${BASE_URL} ---`);
  try {
    const t0 = Date.now();
    const resp = await page.goto(BASE_URL, { waitUntil: "networkidle2", timeout: 30000 });
    const loadTime = Date.now() - t0;
    const title = await page.title();
    console.log(`Home loaded in ${loadTime}ms with status ${resp?.status()}, title: "${title}"`);
    const screenshotPath = path.join(ARTIFACT_DIR, "screenshot_home.png");
    await page.screenshot({ path: screenshotPath, fullPage: false });
    results.pages.home = { status: resp?.status(), loadTimeMs: loadTime, screenshot: screenshotPath, title };
  } catch (err) {
    console.error(`Home load failed: ${err.message}`);
    results.pages.home = { error: err.message };
  }

  // 2. Road Trip Page & Delhi -> Goa Route Test
  console.log(`\n--- 2. Testing Road Trip: ${BASE_URL}/road-trip ---`);
  try {
    const t0 = Date.now();
    await page.goto(`${BASE_URL}/road-trip`, { waitUntil: "networkidle2", timeout: 30000 });
    console.log(`Road trip cockpit loaded in ${Date.now() - t0}ms`);
    await sleep(1000);

    const screenshotPath1 = path.join(ARTIFACT_DIR, "screenshot_roadtrip_step1.png");
    await page.screenshot({ path: screenshotPath1 });

    // Step 1: Click Delhi
    console.log("Step 1: Selecting Delhi...");
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const btn = buttons.find((b) => b.textContent?.trim() === "Delhi");
      if (btn) btn.click();
    });
    await sleep(800);

    // Step 2: Click Goa
    console.log("Step 2: Selecting Goa...");
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const btn = buttons.find((b) => b.textContent?.trim() === "Goa");
      if (btn) btn.click();
    });
    await sleep(800);

    // Step 3: Timing - This Weekend
    console.log("Step 3: Timing - This Weekend...");
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const btn = buttons.find((b) => b.textContent?.includes("This Weekend"));
      if (btn) btn.click();
    });
    await sleep(800);

    // Step 4: Companions - Friends Squad
    console.log("Step 4: Companions - Friends Squad...");
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const btn = buttons.find((b) => b.textContent?.includes("Friends Squad"));
      if (btn) btn.click();
    });
    await sleep(800);

    // Step 5: Vehicle - Car
    console.log("Step 5: Vehicle - Car...");
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const btn = buttons.find((b) => b.textContent?.includes("Personal Car / Sedan"));
      if (btn) btn.click();
    });
    await sleep(800);

    // Step 6: Pace - Balanced Journey
    console.log("Step 6: Pace - Balanced...");
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const btn = buttons.find((b) => b.textContent?.includes("Balanced Journey"));
      if (btn) btn.click();
    });
    await sleep(800);

    // Step 7: Priorities -> Review Corridor
    console.log("Step 7: Click Review Corridor...");
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const btn = buttons.find((b) => b.textContent?.includes("Review Corridor"));
      if (btn) btn.click();
    });
    await sleep(800);

    const screenshotReview = path.join(ARTIFACT_DIR, "screenshot_roadtrip_review.png");
    await page.screenshot({ path: screenshotReview });

    // Step 8: Build Road Trip
    console.log("Step 8: Click Build Road Trip...");
    const tBuild = Date.now();
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const btn = buttons.find((b) => b.textContent?.includes("Build Road Trip"));
      if (btn) btn.click();
    });

    // Wait for result or error
    let buildSuccess = false;
    let buildError = null;
    for (let i = 0; i < 60; i++) {
      await sleep(1000);
      const text = await page.evaluate(() => document.body.innerText);
      if (text.includes("HIGHWAY CORRIDOR") || text.includes("LIVE ROUTE") || text.includes("ESTIMATED ROUTE") || text.includes("Along the Way")) {
        buildSuccess = true;
        break;
      }
      if (text.includes("timed out") || text.includes("Failed to calculate") || text.includes("API Error")) {
        buildError = text;
        break;
      }
    }

    const buildTime = Date.now() - tBuild;
    const screenshotResult = path.join(ARTIFACT_DIR, "screenshot_roadtrip_result.png");
    await page.screenshot({ path: screenshotResult });

    console.log(`Road trip build result in ${buildTime}ms: success=${buildSuccess}, error=${buildError}`);
    results.roadTripTests.push({
      route: "Delhi -> Goa",
      durationMs: buildTime,
      success: buildSuccess,
      error: buildError,
      screenshot: screenshotResult
    });
  } catch (err) {
    console.error(`Road trip test failed: ${err.message}`);
    results.roadTripTests.push({ route: "Delhi -> Goa", error: err.message });
  }

  // 3. Plan Page Flow Verification
  console.log(`\n--- 3. Testing Plan Flow: ${BASE_URL}/plan ---`);
  try {
    await page.goto(`${BASE_URL}/plan`, { waitUntil: "networkidle2", timeout: 30000 });
    const screenshotPlan = path.join(ARTIFACT_DIR, "screenshot_plan.png");
    await page.screenshot({ path: screenshotPlan });

    // Click first destination card
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const destBtn = buttons.find((b) => b.textContent?.includes("Manali") || b.textContent?.includes("Rishikesh") || b.textContent?.includes("Goa"));
      if (destBtn) destBtn.click();
    });
    await sleep(800);

    results.planFlow.started = true;
    const screenshotPlanStep2 = path.join(ARTIFACT_DIR, "screenshot_plan_step2.png");
    await page.screenshot({ path: screenshotPlanStep2 });
    results.planFlow.screenshots = [screenshotPlan, screenshotPlanStep2];
  } catch (err) {
    console.error(`Plan flow test failed: ${err.message}`);
    results.planFlow.error = err.message;
  }

  // 4. Explore & Destination Pages
  console.log(`\n--- 4. Testing Explore & Destination Pages ---`);
  try {
    await page.goto(`${BASE_URL}/explore`, { waitUntil: "networkidle2", timeout: 30000 });
    const screenshotExplore = path.join(ARTIFACT_DIR, "screenshot_explore.png");
    await page.screenshot({ path: screenshotExplore });
    results.pages.explore = { status: 200, screenshot: screenshotExplore };

    await page.goto(`${BASE_URL}/destination/manali`, { waitUntil: "networkidle2", timeout: 30000 });
    const screenshotDestManali = path.join(ARTIFACT_DIR, "screenshot_dest_manali.png");
    await page.screenshot({ path: screenshotDestManali });
    results.pages.manali = { status: 200, screenshot: screenshotDestManali };
  } catch (err) {
    console.error(`Explore/Destination test failed: ${err.message}`);
    results.pages.exploreError = err.message;
  }

  // 5. Ask VANVAS Verification
  console.log(`\n--- 5. Testing Ask VANVAS Drawer & Quick Actions ---`);
  try {
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle2", timeout: 30000 });
    await sleep(1000);

    // Open Ask VANVAS
    const copilotBtnFound = await page.evaluate(() => {
      const btn = document.querySelector('button[aria-label="Open Ask VANVAS"]') ||
                  Array.from(document.querySelectorAll("button")).find((b) => b.textContent?.includes("ASK VANVAS") || b.textContent?.includes("Ask VANVAS") || b.getAttribute("title")?.includes("VANVAS"));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });

    console.log(`Ask VANVAS button clicked: ${copilotBtnFound}`);
    await sleep(1200);
    const screenshotCopilot = path.join(ARTIFACT_DIR, "screenshot_ask_vanvas.png");
    await page.screenshot({ path: screenshotCopilot });
    results.askVanvasTests.push({ opened: copilotBtnFound, screenshot: screenshotCopilot });
  } catch (err) {
    console.error(`Ask VANVAS test failed: ${err.message}`);
    results.askVanvasTests.push({ error: err.message });
  }

  await browser.close();
  console.log(`\n[TEST-RUNNER] Completed. Saving summary report...`);
  fs.writeFileSync(path.join(ARTIFACT_DIR, "runtime_test_results.json"), JSON.stringify(results, null, 2));
}

runTests().catch((err) => {
  console.error("FATAL ERROR IN RUNNER:", err);
  process.exit(1);
});
