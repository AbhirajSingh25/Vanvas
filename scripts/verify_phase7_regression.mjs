import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { pathToFileURL } from "url";

const puppeteer = (await import(pathToFileURL(path.resolve(__dirname, "../frontend/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js")).href)).default;

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const ARTIFACT_DIR = "C:\\Users\\user\\.gemini\\antigravity-ide\\brain\\ba2eb0e1-68ab-4120-bf46-11e6679bb8cf\\phase7_screenshots";
const BASE_URL = "http://localhost:3000";

if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runRegressionSuite() {
  console.log("==================================================");
  console.log("VANVAS PHASE 7 REGRESSION & VISUAL ACCEPTANCE SUITE");
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Screenshots: ${ARTIFACT_DIR}`);
  console.log("==================================================");

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu"
    ]
  });

  const results = {
    viewportsTested: [],
    densityAssertions: {},
    roadTripAssertions: {},
    trekPlanningAssertions: {},
    floatingCopilotAssertions: {},
    screenshots: []
  };

  const page = await browser.newPage();

  // Monitor console errors
  page.on("console", (msg) => {
    if (msg.type() === "error" && !msg.text().includes("favicon")) {
      console.warn(`[BROWSER CONSOLE ERROR] ${msg.text()}`);
    }
  });

  try {
    // -----------------------------------------------------------
    // TEST 1: HOME SCREEN - DENSITY SWITCHER DEDUPLICATION & SPOTLIGHT CAROUSEL
    // -----------------------------------------------------------
    console.log("\n[TEST 1] Verifying Home Screen (Density Deduplication, Floating Ask Vanvas & Spotlight)");
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await sleep(2000);

    // Count visible density switchers on Home
    const visibleDensitySwitchersCount = await page.evaluate(() => {
      const candidates = Array.from(document.querySelectorAll('button[aria-label*="density" i], [data-testid="density-switcher"]'));
      const visible = candidates.filter(el => {
        const style = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
      });
      return visible.length;
    });
    console.log(`- Visible density switchers in Home viewport: ${visibleDensitySwitchersCount} (Expected: exactly 1 in Header)`);
    results.densityAssertions.homeSwitcherCount = visibleDensitySwitchersCount;

    // Check Floating Ask Vanvas Trigger
    const floatingCopilot = await page.$('#floating-ask-vanvas-btn, [data-testid="floating-ask-vanvas"]');
    const copilotVisible = !!floatingCopilot && await page.evaluate(el => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
    }, floatingCopilot);
    console.log(`- Floating Ask VANVAS present and visible: ${copilotVisible}`);
    results.floatingCopilotAssertions.presentOnHome = copilotVisible;

    // Test clicking Floating Ask Vanvas
    if (floatingCopilot) {
      await floatingCopilot.click();
      await sleep(1000);
      const modalOpen = await page.evaluate(() => {
        return !!document.querySelector('[role="dialog"]') || document.body.textContent.includes("Ask VANVAS");
      });
      console.log(`- Clicking Floating Ask VANVAS opened modal: ${modalOpen}`);
      results.floatingCopilotAssertions.modalOpens = modalOpen;

      // Close modal (Escape or close button)
      await page.keyboard.press("Escape");
      await sleep(500);
    }

    const homeShot = path.join(ARTIFACT_DIR, "01_home_mobile_390x844.png");
    await page.screenshot({ path: homeShot, fullPage: false });
    results.screenshots.push(homeShot);

    // -----------------------------------------------------------
    // TEST 2: DAY ESCAPE (/one-day) - REAL ORIGINAL VS COMPACT LAYOUT
    // -----------------------------------------------------------
    console.log("\n[TEST 2] Verifying Day Escape (/one-day) Original vs Compact Density");
    await page.goto(`${BASE_URL}/one-day`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await sleep(2000);

    // Initial state is Original mode
    const originalCards = await page.$$('[data-testid="original-oneday-card"]');
    const originalCardMetrics = await page.evaluate(() => {
      const card = document.querySelector('[data-testid="original-oneday-card"]');
      if (!card) return null;
      const img = card.querySelector('img');
      const rect = card.getBoundingClientRect();
      const imgRect = img ? img.getBoundingClientRect() : null;
      return {
        cardWidth: Math.round(rect.width),
        cardHeight: Math.round(rect.height),
        imgHeight: imgRect ? Math.round(imgRect.height) : 0,
        imgWidth: imgRect ? Math.round(imgRect.width) : 0,
        isVerticalLayout: imgRect ? (imgRect.width >= rect.width * 0.8) : false
      };
    });

    console.log(`- Original Mode Cards found: ${originalCards.length}`);
    console.log(`- Original Card Metrics:`, originalCardMetrics);
    results.densityAssertions.originalCardsCount = originalCards.length;
    results.densityAssertions.originalCardMetrics = originalCardMetrics;

    const originalShot = path.join(ARTIFACT_DIR, "02_oneday_original_390x844.png");
    await page.screenshot({ path: originalShot, fullPage: false });
    results.screenshots.push(originalShot);

    // Toggle to Compact mode via Header switcher
    await page.evaluate(() => {
      // Set localStorage directly or trigger switcher
      localStorage.setItem("vanvas_density", "compact");
      window.dispatchEvent(new Event("storage"));
    });
    // Or click density toggle in header if accessible
    await page.reload({ waitUntil: "domcontentloaded", timeout: 60000 });
    await sleep(2000);

    // Check Compact state
    const isDocumentCompact = await page.evaluate(() => {
      return document.documentElement.getAttribute("data-density") === "compact";
    });
    const compactRows = await page.$$('[data-testid="compact-oneday-row"]');
    const compactRowMetrics = await page.evaluate(() => {
      const row = document.querySelector('[data-testid="compact-oneday-row"]');
      if (!row) return null;
      const img = row.querySelector('img');
      const rect = row.getBoundingClientRect();
      const imgRect = img ? img.getBoundingClientRect() : null;
      return {
        rowWidth: Math.round(rect.width),
        rowHeight: Math.round(rect.height),
        thumbnailWidth: imgRect ? Math.round(imgRect.width) : 0,
        thumbnailHeight: imgRect ? Math.round(imgRect.height) : 0,
        isHorizontalRow: imgRect ? (imgRect.width < rect.width * 0.35) : false
      };
    });

    console.log(`- Compact Mode data-density active: ${isDocumentCompact}`);
    console.log(`- Compact Mode Rows found: ${compactRows.length}`);
    console.log(`- Compact Row Metrics:`, compactRowMetrics);
    results.densityAssertions.isDocumentCompact = isDocumentCompact;
    results.densityAssertions.compactRowsCount = compactRows.length;
    results.densityAssertions.compactRowMetrics = compactRowMetrics;

    const compactShot = path.join(ARTIFACT_DIR, "03_oneday_compact_390x844.png");
    await page.screenshot({ path: compactShot, fullPage: false });
    results.screenshots.push(compactShot);

    // Reset density back to original for subsequent tests
    await page.evaluate(() => {
      localStorage.setItem("vanvas_density", "original");
      document.documentElement.setAttribute("data-density", "original");
    });

    // -----------------------------------------------------------
    // TEST 3: DEDICATED TREK PLANNER (/treks/plan & /treks/[slug]/plan)
    // -----------------------------------------------------------
    console.log("\n[TEST 3] Verifying Dedicated Trek Planning Architecture");
    
    // Check catalogue entry point
    await page.goto(`${BASE_URL}/treks/plan`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await sleep(2000);

    const trekCards = await page.$$('[data-testid="trek-selector-card"]');
    console.log(`- Trek selector cards in /treks/plan: ${trekCards.length}`);
    results.trekPlanningAssertions.catalogueCardsCount = trekCards.length;

    const treksPlanShot = path.join(ARTIFACT_DIR, "04_treks_plan_catalogue.png");
    await page.screenshot({ path: treksPlanShot, fullPage: false });
    results.screenshots.push(treksPlanShot);

    // Navigate to specific trek planner: Tungnath & Chandrashila
    await page.goto(`${BASE_URL}/treks/tungnath-chandrashila/plan`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await sleep(2000);

    // Step 1 assertions
    const step1Heading = await page.evaluate(() => {
      const h2 = document.querySelector('h2');
      return h2 ? h2.textContent.trim() : "";
    });
    const trekTitle = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      return h1 ? h1.textContent.trim() : "";
    });
    console.log(`- Step 1 Trek Title: "${trekTitle}", Step Heading: "${step1Heading}"`);
    results.trekPlanningAssertions.step1Title = trekTitle;

    // Advance to Step 2 (Dates & Party)
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent && b.textContent.includes("Continue to Dates"));
      if (btn) btn.click();
    });
    await sleep(800);

    // Step 2 assertions (Dates & Party)
    const step2Content = await page.evaluate(() => {
      return {
        hasTrailDurationNotice: document.body.textContent.includes("Trail schedule:") || document.body.textContent.includes("3 Days"),
        groupSizeSelectorPresent: document.body.textContent.includes("Group Size") || document.body.textContent.includes("Hikers")
      };
    });
    console.log(`- Step 2 Assertions:`, step2Content);
    results.trekPlanningAssertions.step2 = step2Content;

    // Advance to Step 3 (Readiness & Safety)
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent?.includes("Continue to Readiness"));
      if (btn) btn.click();
    });
    await sleep(800);

    // Step 3 assertions (Readiness & AMS advisory)
    const step3Content = await page.evaluate(() => {
      return {
        hasAltitudeAdvisory: document.body.textContent.includes("High Altitude Notice") || document.body.textContent.includes("Acclimatisation"),
        hasGuideOptions: document.body.textContent.includes("Certified Local Guide") || document.body.textContent.includes("Self-Navigated")
      };
    });
    console.log(`- Step 3 Assertions:`, step3Content);
    results.trekPlanningAssertions.step3 = step3Content;

    // Advance to Step 4 (Route & Gear)
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent && b.textContent.includes("Continue to Route"));
      if (btn) btn.click();
    });
    await sleep(800);

    // Step 4 assertions (Routes and rental gear checklist)
    const step4Content = await page.evaluate(() => {
      return {
        hasRouteOptions: document.body.textContent.includes("Route Options") || document.body.textContent.includes("Waypoints:"),
        hasGearChecklist: document.body.textContent.includes("Gear Checklist") || document.body.textContent.includes("Trek Poles")
      };
    });
    console.log(`- Step 4 Assertions:`, step4Content);
    results.trekPlanningAssertions.step4 = step4Content;

    // Advance to Step 5 (Review Expedition)
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent && b.textContent.includes("Review Expedition Summary"));
      if (btn) btn.click();
    });
    await sleep(1000);

    // Step 5 assertions (Expedition itinerary, cost breakdown, save button)
    const step5Content = await page.evaluate(() => {
      return {
        hasItinerary: document.body.textContent.includes("Day 1:") || document.body.textContent.includes("Chopta"),
        hasEstimatedBudget: document.body.textContent.includes("Total Estimated Expedition Budget") || document.body.textContent.includes("₹"),
        hasSaveButton: document.body.textContent.includes("Save Trek Expedition")
      };
    });
    console.log(`- Step 5 Assertions:`, step5Content);
    results.trekPlanningAssertions.step5 = step5Content;

    const trekStep5Shot = path.join(ARTIFACT_DIR, "05_trek_plan_review_step5.png");
    await page.screenshot({ path: trekStep5Shot, fullPage: false });
    results.screenshots.push(trekStep5Shot);

    // Test legacy redirect: /plan?mode=trek -> /treks/plan
    await page.goto(`${BASE_URL}/plan?mode=trek`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await sleep(2000);
    const redirectedUrl = page.url();
    const isRedirectedToTreksPlan = redirectedUrl.includes("/treks/plan");
    console.log(`- Legacy /plan?mode=trek URL redirected to: ${redirectedUrl} (Success: ${isRedirectedToTreksPlan})`);
    results.trekPlanningAssertions.legacyRedirectSuccess = isRedirectedToTreksPlan;

    // -----------------------------------------------------------
    // TEST 4: ROAD TRIP (/road-trip) - CORRIDORS & ROUTE PLOTTING LOADER
    // -----------------------------------------------------------
    console.log("\n[TEST 4] Verifying Road Trip (/road-trip) Corridors & Plotting Experience");
    await page.goto(`${BASE_URL}/road-trip`, { waitUntil: "domcontentloaded", timeout: 60000 });
    // Wait for corridors to load from API
    try {
      await page.waitForSelector('[data-testid="corridor-card"], [data-testid="origin-city-btn"]', { timeout: 8000 });
    } catch (_) {}
    await sleep(1000);

    const roadTripData = await page.evaluate(() => {
      const corridors = document.querySelectorAll('[data-testid="corridor-card"], button:has(h4)');
      const originButtons = document.querySelectorAll('[data-testid="origin-city-btn"]');
      const originInput = document.querySelector('[data-testid="origin-custom-input"], input[placeholder*="starting city"]');
      return {
        title: document.title,
        corridorsCount: corridors.length,
        originButtonsCount: originButtons.length,
        hasOriginInput: !!originInput,
        hasStepHeader: document.body.textContent.includes("Where are you starting?") || document.body.textContent.includes("ROAD TRIP")
      };
    });
    console.log(`- Road Trip Page Data:`, roadTripData);
    results.roadTripAssertions.pageData = roadTripData;

    // Test clicking a corridor or selecting origin to trigger RoutePlottingLoader
    const firstCorridor = await page.$('[data-testid="corridor-card"]');
    if (firstCorridor) {
      console.log("- Clicking corridor to trigger RoutePlottingLoader...");
      await firstCorridor.click();
      await sleep(600);
      const loaderVisible = await page.evaluate(() => {
        return !!document.querySelector('[data-testid="route-plotting-loader"]') || 
               document.body.textContent.includes("LIVE ROUTE PLOTTING") ||
               document.body.textContent.includes("Tracing highway geometry");
      });
      console.log(`- RoutePlottingLoader rendered with progressive route animation: ${loaderVisible}`);
      results.roadTripAssertions.loaderVisible = loaderVisible;

      const plottingShot = path.join(ARTIFACT_DIR, "06b_road_trip_plotting_loader.png");
      await page.screenshot({ path: plottingShot, fullPage: false });
      results.screenshots.push(plottingShot);
    }

    const roadTripShot = path.join(ARTIFACT_DIR, "06_road_trip_overview.png");
    await page.screenshot({ path: roadTripShot, fullPage: false });
    results.screenshots.push(roadTripShot);

    // -----------------------------------------------------------
    // TEST 5: VIEWPORT RESPONSIVENESS MATRIX
    // -----------------------------------------------------------
    console.log("\n[TEST 5] Verifying Target Viewport Matrix");
    const viewports = [
      { width: 360, height: 780, name: "mobile_360x780" },
      { width: 390, height: 844, name: "mobile_390x844" },
      { width: 430, height: 932, name: "mobile_430x932" },
      { width: 768, height: 1024, name: "tablet_768x1024" },
      { width: 1440, height: 900, name: "desktop_1440x900" }
    ];

    for (const vp of viewports) {
      await page.setViewport({ width: vp.width, height: vp.height, isMobile: vp.width < 1000 });
      await page.goto(`${BASE_URL}/`, { waitUntil: "networkidle2" });
      await sleep(1000);
      const vpShot = path.join(ARTIFACT_DIR, `07_vp_${vp.name}.png`);
      await page.screenshot({ path: vpShot, fullPage: false });
      results.screenshots.push(vpShot);
      results.viewportsTested.push(vp.name);
      console.log(`- Captured viewport: ${vp.name}`);
    }

    console.log("\n==================================================");
    console.log("PHASE 7 REGRESSION & VISUAL ACCEPTANCE SUITE FINISHED");
    console.log("==================================================");

  } catch (err) {
    console.error("Test Suite Error:", err);
  } finally {
    await browser.close();
  }

  // Write summary results JSON
  fs.writeFileSync(
    path.join(ARTIFACT_DIR, "phase7_regression_results.json"),
    JSON.stringify(results, null, 2)
  );
  console.log(`Results saved to ${path.join(ARTIFACT_DIR, "phase7_regression_results.json")}`);
}

runRegressionSuite().catch(console.error);
