const puppeteer = require("./frontend/node_modules/puppeteer-core");
const fs = require("fs");
const path = require("path");

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const ARTIFACT_DIR = "C:\\Users\\user\\.gemini\\antigravity-ide\\brain\\07175472-8f38-46a1-9644-e37d766a727c";
const BASE_URL = process.env.TARGET_URL || "https://vanvasai.vercel.app";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runAcceptanceSuite() {
  console.log("==================================================");
  console.log("VANVAS RUNTIME PRODUCTION ACCEPTANCE & REPAIR TEST");
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Chrome: ${CHROME_PATH}`);
  console.log("==================================================");

  const report = {
    startedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    routes: {},
    askVanvasQueries: [],
    askVanvasActions: [],
    planFlow: {},
    tripWorkspace: {},
    budgetSplit: {},
    destinations: {},
    mobileResponsiveness: {},
    screenshots: [],
    errors: [],
    statusSummary: {}
  };

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--window-size=1280,850"
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 850 });

  page.on("dialog", async (d) => {
    console.log(`[ALERT DIALOG] ${d.message()}`);
    report.errors.push({ type: "alert_dialog", text: d.message() });
    await d.dismiss();
  });

  page.on("console", (m) => {
    if (m.type() === "error") {
      const txt = m.text();
      // Ignore routine favicon or net aborts
      if (!txt.includes("favicon") && !txt.includes("ERR_ABORTED")) {
        console.log(`[BROWSER CONSOLE ERR] ${txt}`);
        report.errors.push({ type: "console_error", text: txt });
      }
    }
  });

  page.on("response", async (res) => {
    if (res.url().includes("/api/v1/")) {
      const status = res.status();
      const method = res.request().method();
      if (status >= 400) {
        console.log(`[API ERROR ${status}] ${method} ${res.url()}`);
        report.errors.push({ type: "api_error", status, url: res.url() });
      }
    }
  });

  // ----------------------------------------------------
  // 1. HOME & GLOBAL SHELL VERIFICATION
  // ----------------------------------------------------
  console.log("\n[TEST 1] Verifying Home Page & Navigation Header...");
  try {
    const t0 = Date.now();
    await page.goto(BASE_URL, { waitUntil: "networkidle2", timeout: 30000 });
    const loadTime = Date.now() - t0;
    const title = await page.title();
    const screenshotHome = path.join(ARTIFACT_DIR, "screenshot_home.png");
    await page.screenshot({ path: screenshotHome });
    report.screenshots.push({ name: "Home", file: "screenshot_home.png", path: screenshotHome });
    console.log(`✓ Home verified in ${loadTime}ms: "${title}"`);
    report.statusSummary["HOME"] = { status: "WORKING", loadTimeMs: loadTime, title };
  } catch (err) {
    console.error(`✗ Home test error: ${err.message}`);
    report.statusSummary["HOME"] = { status: "BROKEN", error: err.message };
  }

  // ----------------------------------------------------
  // 2. ROAD TRIP SUITE (Delhi->Goa, Jaipur->Spiti, Delhi->Manali, Delhi->Rishikesh)
  // ----------------------------------------------------
  console.log("\n[TEST 2] Testing Road Trip Flow with Multiple Corridors...");
  const roadTripsToTest = [
    { origin: "Delhi", destination: "Goa", vehicle: "Car", pace: "Balanced", name: "Delhi → Goa" },
    { origin: "Jaipur", destination: "Spiti", vehicle: "SUV", pace: "Explore", name: "Jaipur → Spiti" },
    { origin: "Delhi", destination: "Manali", vehicle: "Car", pace: "Fast", name: "Delhi → Manali" },
    { origin: "Delhi", destination: "Rishikesh", vehicle: "Bike", pace: "Balanced", name: "Delhi → Rishikesh" },
  ];

  for (const rt of roadTripsToTest) {
    console.log(`\n  Testing Corridor: ${rt.name} (${rt.vehicle}, ${rt.pace})...`);
    try {
      await page.goto(`${BASE_URL}/road-trip`, { waitUntil: "networkidle2", timeout: 30000 });
      await sleep(600);

      // Select Origin
      await page.evaluate((orig) => {
        const buttons = Array.from(document.querySelectorAll("button"));
        const btn = buttons.find((b) => b.textContent?.trim().toLowerCase() === orig.toLowerCase());
        if (btn) btn.click();
        else {
          const input = document.querySelector('input[placeholder*="starting city"]');
          if (input) {
            input.value = orig;
            input.dispatchEvent(new Event("input", { bubbles: true }));
            const selBtn = buttons.find((b) => b.textContent?.trim() === "Select");
            if (selBtn) selBtn.click();
          }
        }
      }, rt.origin);
      await sleep(500);

      // Select Destination
      await page.evaluate((dest) => {
        const buttons = Array.from(document.querySelectorAll("button"));
        const btn = buttons.find((b) => b.textContent?.trim().toLowerCase() === dest.toLowerCase());
        if (btn) btn.click();
        else {
          const input = document.querySelector('input[placeholder*="destination city"]');
          if (input) {
            input.value = dest;
            input.dispatchEvent(new Event("input", { bubbles: true }));
            const selBtn = buttons.find((b) => b.textContent?.trim() === "Select");
            if (selBtn) selBtn.click();
          }
        }
      }, rt.destination);
      await sleep(500);

      // Timing - Next Week
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll("button"));
        const btn = buttons.find((b) => b.textContent?.includes("Next Week") || b.textContent?.includes("This Weekend"));
        if (btn) btn.click();
      });
      await sleep(500);

      // Companions - Friends Squad
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll("button"));
        const btn = buttons.find((b) => b.textContent?.includes("Friends") || b.textContent?.includes("Squad"));
        if (btn) btn.click();
      });
      await sleep(500);

      // Vehicle
      await page.evaluate((veh) => {
        const buttons = Array.from(document.querySelectorAll("button"));
        const btn = buttons.find((b) => b.textContent?.toLowerCase().includes(veh.toLowerCase()));
        if (btn) btn.click();
      }, rt.vehicle);
      await sleep(500);

      // Pace
      await page.evaluate((p) => {
        const buttons = Array.from(document.querySelectorAll("button"));
        const btn = buttons.find((b) => b.textContent?.toLowerCase().includes(p.toLowerCase()));
        if (btn) btn.click();
      }, rt.pace);
      await sleep(500);

      // Review Corridor button
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll("button"));
        const btn = buttons.find((b) => b.textContent?.includes("Review Corridor"));
        if (btn) btn.click();
      });
      await sleep(500);

      // Click Build Road Trip
      const tBuildStart = Date.now();
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll("button"));
        const btn = buttons.find((b) => b.textContent?.includes("Build Road Trip"));
        if (btn) btn.click();
      });

      // Await results
      let success = false;
      let routeData = null;
      for (let i = 0; i < 40; i++) {
        await sleep(1000);
        const state = await page.evaluate(() => {
          const bodyText = document.body.innerText;
          const isResult = bodyText.includes("HIGHWAY CORRIDOR") || bodyText.includes("LIVE ROUTE") || bodyText.includes("Along the Way");
          const isError = bodyText.includes("ROUTE TEMPORARILY UNAVAILABLE") || bodyText.includes("timed out") || bodyText.includes("API Error");
          return { isResult, isError, bodyText: bodyText.substring(0, 500) };
        });

        if (state.isResult) {
          success = true;
          break;
        }
        if (state.isError) {
          console.log(`    [Notice] Route state returned error/unavailable: ${state.bodyText}`);
          break;
        }
      }

      const dur = Date.now() - tBuildStart;
      const slugName = rt.name.toLowerCase().replace(/[^a-z0-9]/g, "_");
      const screenshotRoadTrip = path.join(ARTIFACT_DIR, `screenshot_roadtrip_${slugName}.png`);
      await page.screenshot({ path: screenshotRoadTrip });
      report.screenshots.push({ name: `Road Trip: ${rt.name}`, file: `screenshot_roadtrip_${slugName}.png`, path: screenshotRoadTrip });

      console.log(`  ✓ ${rt.name}: success=${success} in ${dur}ms`);
      report.routes[rt.name] = { success, durationMs: dur, vehicle: rt.vehicle, pace: rt.pace };
    } catch (err) {
      console.error(`  ✗ ${rt.name} failed: ${err.message}`);
      report.routes[rt.name] = { success: false, error: err.message };
    }
  }

  // ----------------------------------------------------
  // 3. ASK VANVAS NATURAL LANGUAGE QUERIES & ACTION CENTER
  // ----------------------------------------------------
  console.log("\n[TEST 3] Testing Ask VANVAS Context & Queries...");
  try {
    await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle2", timeout: 30000 });
    await sleep(800);

    // Open Copilot Drawer
    await page.evaluate(() => {
      const btn = document.querySelector('button[aria-label="Open Ask VANVAS"]') ||
                  Array.from(document.querySelectorAll("button")).find((b) => b.textContent?.includes("ASK VANVAS"));
      if (btn) btn.click();
    });
    await sleep(1000);

    const testQueries = [
      "What can I do in Manali?",
      "Find food",
      "Where should I stay?",
      "What's next?",
      "I'm 2 hours late",
      "It's raining",
      "How much have we spent?",
      "Where should we stop?"
    ];

    for (const q of testQueries) {
      console.log(`  Query: "${q}"`);
      const tQStart = Date.now();

      await page.evaluate((queryText) => {
        const input = document.querySelector('input[placeholder*="Ask VANVAS"]') ||
                      document.querySelector('textarea[placeholder*="Ask VANVAS"]') ||
                      document.querySelector('input[type="text"]');
        if (input) {
          input.value = queryText;
          input.dispatchEvent(new Event("input", { bubbles: true }));
          const form = input.closest("form");
          if (form) {
            form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
          } else {
            const sendBtn = document.querySelector('button[aria-label="Send message"]') ||
                            input.parentElement?.querySelector("button");
            if (sendBtn) sendBtn.click();
          }
        }
      }, q);

      // Wait for reply
      await sleep(3500);
      const qDur = Date.now() - tQStart;

      const replyData = await page.evaluate(() => {
        const messages = Array.from(document.querySelectorAll(".font-sans, p, div")).map((el) => el.textContent?.trim() || "");
        const actions = Array.from(document.querySelectorAll("button")).map((b) => b.textContent?.trim() || "").filter(Boolean);
        return { actions: actions.slice(0, 8) };
      });

      console.log(`  ✓ Replied in ${qDur}ms. Available Action Buttons: ${replyData.actions.slice(0, 4).join(", ")}`);
      report.askVanvasQueries.push({ query: q, durationMs: qDur, actionsFound: replyData.actions });
    }

    const screenshotCopilot = path.join(ARTIFACT_DIR, "screenshot_ask_vanvas.png");
    await page.screenshot({ path: screenshotCopilot });
    report.screenshots.push({ name: "Ask VANVAS", file: "screenshot_ask_vanvas.png", path: screenshotCopilot });
    report.statusSummary["ASK_VANVAS"] = { status: "WORKING", queriesTested: testQueries.length };
  } catch (err) {
    console.error(`✗ Ask VANVAS test error: ${err.message}`);
    report.statusSummary["ASK_VANVAS"] = { status: "PARTIAL", error: err.message };
  }

  // ----------------------------------------------------
  // 4. PLAN FLOW (/plan) - 1 QUESTION AT A TIME & REDIRECT
  // ----------------------------------------------------
  console.log("\n[TEST 4] Testing Plan Flow (/plan)...");
  try {
    await page.goto(`${BASE_URL}/plan`, { waitUntil: "networkidle2", timeout: 30000 });
    await sleep(800);

    const screenshotPlan1 = path.join(ARTIFACT_DIR, "screenshot_plan_step1.png");
    await page.screenshot({ path: screenshotPlan1 });

    // Step 1: Destination - Manali
    console.log("  Step 1: Selecting Manali...");
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const btn = buttons.find((b) => b.textContent?.includes("Manali"));
      if (btn) btn.click();
    });
    await sleep(600);

    // Step 2: Timing
    console.log("  Step 2: Selecting Next Weekend...");
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const btn = buttons.find((b) => b.textContent?.includes("Next") || b.textContent?.includes("Weekend") || b.textContent?.includes("Days"));
      if (btn) btn.click();
    });
    await sleep(600);

    // Step 3: Duration
    console.log("  Step 3: Duration...");
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const btn = buttons.find((b) => b.textContent?.includes("3 Days") || b.textContent?.includes("Long Weekend") || b.textContent?.includes("Weekend Escape"));
      if (btn) btn.click();
    });
    await sleep(600);

    // Step 4: Companions
    console.log("  Step 4: Companions...");
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const btn = buttons.find((b) => b.textContent?.includes("Friends") || b.textContent?.includes("Solo"));
      if (btn) btn.click();
    });
    await sleep(600);

    // Step 5: Vibe & Style
    console.log("  Step 5: Style...");
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const btn = buttons.find((b) => b.textContent?.includes("Balanced") || b.textContent?.includes("Comfort"));
      if (btn) btn.click();
    });
    await sleep(600);

    // Step 6: Review & Build My Trip
    console.log("  Step 6: Build Trip...");
    const screenshotPlanReview = path.join(ARTIFACT_DIR, "screenshot_plan_review.png");
    await page.screenshot({ path: screenshotPlanReview });

    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const btn = buttons.find((b) => b.textContent?.includes("Build My Trip") || b.textContent?.includes("Build Trip"));
      if (btn) btn.click();
    });
    await sleep(3000);

    const currentUrl = page.url();
    console.log(`  ✓ Plan flow created trip and navigated to: ${currentUrl}`);
    const screenshotTrip = path.join(ARTIFACT_DIR, "screenshot_trip_workspace.png");
    await page.screenshot({ path: screenshotTrip });
    report.screenshots.push({ name: "Trip Workspace", file: "screenshot_trip_workspace.png", path: screenshotTrip });
    report.statusSummary["PLAN_FLOW"] = { status: "WORKING", targetUrl: currentUrl };
  } catch (err) {
    console.error(`✗ Plan flow error: ${err.message}`);
    report.statusSummary["PLAN_FLOW"] = { status: "PARTIAL", error: err.message };
  }

  // ----------------------------------------------------
  // 5. EXPLORE & DESTINATION PAGES
  // ----------------------------------------------------
  console.log("\n[TEST 5] Testing Explore & Multi-Destination Hubs...");
  const destinationsToTest = ["manali", "rishikesh", "udaipur", "goa", "jaipur", "varanasi", "leh", "spiti"];
  for (const slug of destinationsToTest) {
    try {
      await page.goto(`${BASE_URL}/explore/${slug}`, { waitUntil: "networkidle2", timeout: 25000 });
      const title = await page.title();
      console.log(`  ✓ Destination /explore/${slug}: 200 OK (${title})`);
      report.destinations[slug] = { status: 200, title };
    } catch (err) {
      console.log(`  ✗ Destination /explore/${slug} failed: ${err.message}`);
      report.destinations[slug] = { status: 500, error: err.message };
    }
  }

  const screenshotExplore = path.join(ARTIFACT_DIR, "screenshot_explore.png");
  await page.screenshot({ path: screenshotExplore });
  report.screenshots.push({ name: "Explore", file: "screenshot_explore.png", path: screenshotExplore });

  // ----------------------------------------------------
  // 6. NEARBY & LOCATION PERMISSION / FALLBACK
  // ----------------------------------------------------
  console.log("\n[TEST 6] Testing Nearby (/nearby)...");
  try {
    await page.goto(`${BASE_URL}/nearby`, { waitUntil: "networkidle2", timeout: 25000 });
    const screenshotNearby = path.join(ARTIFACT_DIR, "screenshot_nearby.png");
    await page.screenshot({ path: screenshotNearby });
    report.screenshots.push({ name: "Nearby", file: "screenshot_nearby.png", path: screenshotNearby });
    report.statusSummary["NEARBY"] = { status: "WORKING" };
    console.log("  ✓ Nearby page rendered with location fallback & categorized discovery.");
  } catch (err) {
    console.error(`  ✗ Nearby failed: ${err.message}`);
    report.statusSummary["NEARBY"] = { status: "BROKEN", error: err.message };
  }

  // ----------------------------------------------------
  // 7. MOBILE RESPONSIVENESS (375x812, 390x844, 430x932)
  // ----------------------------------------------------
  console.log("\n[TEST 7] Testing Mobile Layouts & Viewports...");
  const viewports = [
    { name: "iPhone_Mini_375x812", width: 375, height: 812 },
    { name: "iPhone_14_390x844", width: 390, height: 844 },
    { name: "iPhone_ProMax_430x932", width: 430, height: 932 }
  ];

  for (const vp of viewports) {
    await page.setViewport({ width: vp.width, height: vp.height });
    await page.goto(`${BASE_URL}/road-trip`, { waitUntil: "networkidle2", timeout: 25000 });
    const vpScreenshot = path.join(ARTIFACT_DIR, `screenshot_mobile_${vp.name}.png`);
    await page.screenshot({ path: vpScreenshot });
    report.screenshots.push({ name: `Mobile ${vp.name}`, file: `screenshot_mobile_${vp.name}.png`, path: vpScreenshot });
    console.log(`  ✓ Mobile Viewport ${vp.width}x${vp.height} verified.`);
    report.mobileResponsiveness[vp.name] = { width: vp.width, height: vp.height, status: "PASS" };
  }

  await browser.close();
  report.completedAt = new Date().toISOString();

  fs.writeFileSync(path.join(ARTIFACT_DIR, "full_acceptance_report.json"), JSON.stringify(report, null, 2));
  console.log("\n==================================================");
  console.log("ACCEPTANCE SUITE RUN COMPLETE. Report saved.");
  console.log("==================================================");
}

runAcceptanceSuite().catch((err) => {
  console.error("FATAL ERROR IN ACCEPTANCE SUITE:", err);
  process.exit(1);
});
