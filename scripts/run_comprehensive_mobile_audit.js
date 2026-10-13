const path = require("path");
const fs = require("fs");
const puppeteer = require(path.resolve(__dirname, "../frontend/node_modules/puppeteer-core"));

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const ARTIFACT_DIR = "C:\\Users\\user\\.gemini\\antigravity-ide\\brain\\65035a41-9bd7-4632-b98d-3ceba0641959\\browser_screenshots";
const BASE_URL = "http://localhost:3000";

if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function runComprehensiveAudit() {
  console.log("==================================================================");
  console.log("VANVAS ACCEPTANCE AUDIT: VERIFYING RENDERING ACROSS VIEWPORTS");
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Artifact Dir: ${ARTIFACT_DIR}`);
  console.log("==================================================================");

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

  const viewports = [
    { name: "360px_android", width: 360, height: 780 },
    { name: "390px_iphone", width: 390, height: 844 },
    { name: "430px_max", width: 430, height: 932 },
    { name: "768px_tablet", width: 768, height: 1024 },
    { name: "1440px_desktop", width: 1440, height: 900 }
  ];

  const auditReport = {
    startedAt: new Date().toISOString(),
    viewportsChecked: [],
    overflowDefects: [],
    brandingChecks: [],
    oneDayFlowChecks: [],
    trekDetailChecks: [],
    screenshotsCaptured: []
  };

  for (const vp of viewports) {
    console.log(`\n--- Testing Viewport: ${vp.name} (${vp.width}x${vp.height}) ---`);
    const page = await browser.newPage();
    await page.evaluateOnNewDocument(() => {
      try {
        sessionStorage.setItem("vanvas_startup_shown", "1");
      } catch (e) {}
    });
    await page.setViewport({ width: vp.width, height: vp.height });

    // 1. HOME ROUTE AUDIT
    console.log(`[${vp.name}] Auditing Home (/)`);
    await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded", timeout: 20000 });
    await sleep(1500);

    // Verify exactly one VANVAS logo mark in mobile home header
    const homeBranding = await page.evaluate((isMobile) => {
      const header = document.querySelector("header");
      if (!header) return { error: "No header element found" };

      const mobileHeader = header.querySelector(".xl\\:hidden");
      const desktopHeader = header.querySelector(".hidden.xl\\:flex");

      if (isMobile && mobileHeader) {
        // Count instances of "VANVAS" text in mobile header
        const textNodes = [];
        const walker = document.createTreeWalker(mobileHeader, NodeFilter.SHOW_TEXT);
        let node;
        while ((node = walker.nextNode())) {
          if (node.nodeValue && node.nodeValue.includes("VANVAS")) {
            textNodes.push(node.nodeValue.trim());
          }
        }
        return {
          viewport: "mobile",
          vanvasWordmarkCount: textNodes.length,
          texts: textNodes
        };
      }
      return { viewport: "desktop", ok: true };
    }, vp.width < 1280);

    auditReport.brandingChecks.push({ viewport: vp.name, route: "/", ...homeBranding });

    // Check overflow on Home
    const homeOverflow = await page.evaluate(() => {
      const docW = document.documentElement.scrollWidth;
      const winW = window.innerWidth;
      const bodyW = document.body.scrollWidth;
      return { docW, winW, bodyW, hasOverflow: docW > winW + 1 || bodyW > winW + 1 };
    });
    if (homeOverflow.hasOverflow) {
      auditReport.overflowDefects.push({ viewport: vp.name, route: "/", ...homeOverflow });
    }

    const homeSS = path.join(ARTIFACT_DIR, `home_${vp.name}.jpg`);
    await page.screenshot({ path: homeSS, quality: 85 });
    auditReport.screenshotsCaptured.push(homeSS);

    // 2. ONE-DAY ESCAPE AUDIT & PROGRESSIVE FLOW
    console.log(`[${vp.name}] Auditing One-Day (/one-day) Progressive Flow`);
    await page.goto(`${BASE_URL}/one-day`, { waitUntil: "domcontentloaded", timeout: 20000 });
    await sleep(1200);

    // Verify Step A: Journey (origin, corridors, no seeded itinerary below form)
    const stepACheck = await page.evaluate(() => {
      const text = document.body.innerText;
      const hasStep1 = text.includes("STEP 1 OF 2") || text.includes("Choose Your Journey");
      const hasItinerarySeeded = text.includes("ACTIVE CORRIDOR COCKPIT");
      return { hasStep1, hasItinerarySeeded };
    });

    const oneDayStepASS = path.join(ARTIFACT_DIR, `one_day_stepA_${vp.name}.jpg`);
    await page.screenshot({ path: oneDayStepASS, quality: 85 });
    auditReport.screenshotsCaptured.push(oneDayStepASS);

    // Click "Continue to Experience Style" to transition to Step B
    const clickedContinue = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const btn = btns.find(b => b.textContent && (b.textContent.includes("Continue to Experience Style") || b.textContent.includes("Continue")));
      if (btn) { btn.click(); return true; }
      return false;
    });
    if (clickedContinue) {
      await sleep(500);
    }

    const stepBCheck = await page.evaluate(() => {
      const text = document.body.innerText;
      const hasStep2 = text.includes("STEP 2 OF 2") || text.includes("Tailor Your Day Escape");
      const hasDuration = text.includes("3 Hours") && text.includes("Full Day");
      return { hasStep2, hasDuration };
    });

    const oneDayStepBSS = path.join(ARTIFACT_DIR, `one_day_stepB_${vp.name}.jpg`);
    await page.screenshot({ path: oneDayStepBSS, quality: 85 });
    auditReport.screenshotsCaptured.push(oneDayStepBSS);

    // Click "Plan My Day" to transition to Step C (Itinerary)
    const clickedPlan = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const btn = btns.find(b => b.textContent && b.textContent.includes("Plan My Day"));
      if (btn) { btn.click(); return true; }
      return false;
    });
    if (clickedPlan) {
      await sleep(600);
    }

    const stepCCheck = await page.evaluate(() => {
      const text = document.body.innerText;
      const hasItinerary = text.includes("Itinerary") && text.includes("Departure:");
      const tabs = Array.from(document.querySelectorAll("button[role='tab']")).map(b => b.textContent.trim());
      return { hasItinerary, tabs };
    });

    // Test tab click (Route)
    await page.evaluate(() => {
      const tab = document.getElementById("tab-route");
      if (tab) tab.click();
    });
    await sleep(400);

    const oneDayStepCSS = path.join(ARTIFACT_DIR, `one_day_stepC_${vp.name}.jpg`);
    await page.screenshot({ path: oneDayStepCSS, quality: 85 });
    auditReport.screenshotsCaptured.push(oneDayStepCSS);

    // Check overflow on One-Day
    const oneDayOverflow = await page.evaluate(() => {
      const docW = document.documentElement.scrollWidth;
      const winW = window.innerWidth;
      const bodyW = document.body.scrollWidth;
      return { docW, winW, bodyW, hasOverflow: docW > winW + 1 || bodyW > winW + 1 };
    });
    if (oneDayOverflow.hasOverflow) {
      auditReport.overflowDefects.push({ viewport: vp.name, route: "/one-day", ...oneDayOverflow });
    }

    auditReport.oneDayFlowChecks.push({
      viewport: vp.name,
      stepA: stepACheck,
      stepB: stepBCheck,
      stepC: stepCCheck
    });

    // 3. TREKS DISCOVERY AUDIT
    console.log(`[${vp.name}] Auditing Treks Discovery (/treks)`);
    await page.goto(`${BASE_URL}/treks`, { waitUntil: "domcontentloaded", timeout: 20000 });
    await sleep(1200);

    const treksOverflow = await page.evaluate(() => {
      const docW = document.documentElement.scrollWidth;
      const winW = window.innerWidth;
      const bodyW = document.body.scrollWidth;
      return { docW, winW, bodyW, hasOverflow: docW > winW + 1 || bodyW > winW + 1 };
    });
    if (treksOverflow.hasOverflow) {
      auditReport.overflowDefects.push({ viewport: vp.name, route: "/treks", ...treksOverflow });
    }

    const treksSS = path.join(ARTIFACT_DIR, `treks_discovery_${vp.name}.jpg`);
    await page.screenshot({ path: treksSS, quality: 85 });
    auditReport.screenshotsCaptured.push(treksSS);

    // 4. TREK DETAIL AUDIT (/treks/kedarkantha)
    console.log(`[${vp.name}] Auditing Trek Detail (/treks/kedarkantha)`);
    await page.goto(`${BASE_URL}/treks/kedarkantha`, { waitUntil: "domcontentloaded", timeout: 20000 });
    await sleep(1200);

    const trekDetailCheck = await page.evaluate(() => {
      const winW = window.innerWidth;

      // Find Trail Mode button and check if its right edge exceeds viewport
      const trailButtons = Array.from(document.querySelectorAll("button")).filter(b => b.textContent.includes("Trail Mode"));
      const trailModeInside = trailButtons.every(b => {
        const rect = b.getBoundingClientRect();
        return rect.right <= winW + 1 && rect.left >= 0;
      });

      // Check tab labels
      const tabs = Array.from(document.querySelectorAll("button[role='tab']")).map(b => b.textContent.trim());

      // Check overflow
      const docW = document.documentElement.scrollWidth;
      const bodyW = document.body.scrollWidth;
      const hasOverflow = docW > winW + 1 || bodyW > winW + 1;

      return { trailModeInside, tabs, hasOverflow, docW, winW, bodyW };
    });

    if (trekDetailCheck.hasOverflow) {
      auditReport.overflowDefects.push({ viewport: vp.name, route: "/treks/kedarkantha-summit", ...trekDetailCheck });
    }

    const trekDetailSS = path.join(ARTIFACT_DIR, `trek_detail_${vp.name}.jpg`);
    await page.screenshot({ path: trekDetailSS, quality: 85 });
    auditReport.screenshotsCaptured.push(trekDetailSS);

    // Test tab switching on trek detail
    await page.evaluate(() => {
      const tab = document.getElementById("tab-route");
      if (tab) tab.click();
    });
    await sleep(400);

    await page.evaluate(() => {
      const tab = document.getElementById("tab-conditions");
      if (tab) tab.click();
    });
    await sleep(400);

    // Test Trail Mode activation and exit
    const enteredTrailMode = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const btn = btns.find(b => b.textContent && b.textContent.includes("Trail Mode"));
      if (btn) { btn.click(); return true; }
      return false;
    });
    if (enteredTrailMode) {
      await sleep(500);

      const trailModeSS = path.join(ARTIFACT_DIR, `trail_mode_${vp.name}.jpg`);
      await page.screenshot({ path: trailModeSS, quality: 85 });
      auditReport.screenshotsCaptured.push(trailModeSS);

      // Exit trail mode
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll("button"));
        const btn = btns.find(b => b.textContent && (b.textContent.includes("Exit") || b.textContent.includes("Exit Trail Mode")));
        if (btn) btn.click();
      });
      await sleep(400);
    }

    auditReport.trekDetailChecks.push({
      viewport: vp.name,
      ...trekDetailCheck
    });

    await page.close();
  }

  await browser.close();

  const reportPath = path.join(ARTIFACT_DIR, "acceptance_report.json");
  fs.writeFileSync(reportPath, JSON.stringify(auditReport, null, 2));
  console.log(`\nAudit finished! Report saved to: ${reportPath}`);
  console.log(`Total overflow defects: ${auditReport.overflowDefects.length}`);
  console.log(`Screenshots captured: ${auditReport.screenshotsCaptured.length}`);
}

runComprehensiveAudit().catch((err) => {
  console.error(err);
  process.exit(1);
});
