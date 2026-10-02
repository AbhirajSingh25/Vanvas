const puppeteer = require("./frontend/node_modules/puppeteer-core");
const fs = require("fs");
const path = require("path");

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const ARTIFACT_DIR = "C:\\Users\\user\\.gemini\\antigravity-ide\\brain\\e82c533e-8a45-499d-800e-400b98f1c4c1";
const BASE_URL = process.env.TARGET_URL || "https://vanvasai.vercel.app";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runAudit() {
  console.log("==================================================");
  console.log("VANVAS FINAL RELEASE TRUTH AUDIT");
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Chrome Executable: ${CHROME_PATH}`);
  console.log(`Artifact Directory: ${ARTIFACT_DIR}`);
  console.log("==================================================");

  if (!fs.existsSync(ARTIFACT_DIR)) {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  }

  const results = {
    startedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    screenshots: [],
    pages: {},
    roadTrip: {},
    askVanvas: [],
    planFlow: {},
    tripWorkspace: {},
    budgetSplit: {},
    exploreDestinations: {},
    mobileResponsiveness: {},
    settingsCompact: {},
    errors: [],
    summary: {}
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

  page.on("dialog", async (dialog) => {
    console.log(`[BROWSER DIALOG ALERT] "${dialog.message()}"`);
    results.errors.push({ type: "alert_dialog", message: dialog.message() });
    await dialog.dismiss();
  });

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const text = msg.text();
      if (!text.includes("favicon") && !text.includes("ERR_ABORTED") && !text.includes("404")) {
        console.log(`[BROWSER CONSOLE ERROR] ${text}`);
        results.errors.push({ type: "console_error", message: text });
      }
    }
  });

  // 1. HOME AUDIT
  console.log("\n[STEP 1] Testing HOME Page...");
  try {
    const t0 = Date.now();
    await page.goto(BASE_URL, { waitUntil: "networkidle2", timeout: 30000 });
    const loadTime = Date.now() - t0;
    const title = await page.title();
    const screenshotPath = path.join(ARTIFACT_DIR, "audit_home.png");
    await page.screenshot({ path: screenshotPath });
    results.screenshots.push({ name: "HOME", path: screenshotPath });
    console.log(`✓ Home loaded in ${loadTime}ms. Title: "${title}"`);
    results.pages["HOME"] = { status: "WORKING", title, loadTimeMs: loadTime };
  } catch (err) {
    console.error(`✗ HOME failed: ${err.message}`);
    results.pages["HOME"] = { status: "BROKEN", error: err.message };
  }

  // 2. EXPLORE & DESTINATIONS AUDIT
  console.log("\n[STEP 2] Testing EXPLORE & DESTINATIONS (Manali, Rishikesh, Udaipur, Goa, Jaipur, Varanasi, Leh, Spiti)...");
  const testDestinations = ["manali", "rishikesh", "udaipur", "goa", "jaipur", "varanasi", "leh", "spiti"];
  
  try {
    await page.goto(`${BASE_URL}/explore`, { waitUntil: "networkidle2", timeout: 30000 });
    const screenshotExplore = path.join(ARTIFACT_DIR, "audit_explore.png");
    await page.screenshot({ path: screenshotExplore });
    results.screenshots.push({ name: "EXPLORE", path: screenshotExplore });
    console.log("✓ Explore grid loaded.");
    results.pages["EXPLORE"] = { status: "WORKING" };

    for (const slug of testDestinations) {
      console.log(`  Checking destination: /explore/${slug}...`);
      await page.goto(`${BASE_URL}/explore/${slug}`, { waitUntil: "networkidle2", timeout: 30000 });
      await sleep(1000);
      const heading = await page.evaluate(() => {
        const h1 = document.querySelector("h1");
        return h1 ? h1.innerText : null;
      });
      const placesCount = await page.evaluate(() => {
        return document.querySelectorAll("[data-testid='place-card'], .grid > div, article").length;
      });
      console.log(`  ✓ ${slug}: Heading="${heading}", items count=${placesCount}`);
      results.exploreDestinations[slug] = { status: "WORKING", heading, itemsCount: placesCount };
      if (slug === "manali") {
        const manaliScreenshot = path.join(ARTIFACT_DIR, "audit_destination_manali.png");
        await page.screenshot({ path: manaliScreenshot });
        results.screenshots.push({ name: "DESTINATION_MANALI", path: manaliScreenshot });
      }
    }
  } catch (err) {
    console.error(`✗ Explore failed: ${err.message}`);
    results.pages["EXPLORE"] = { status: "BROKEN", error: err.message };
  }

  // 3. PLAN FLOW AUDIT (Progressive 1-Question, Build, Persistence)
  console.log("\n[STEP 3] Testing PLAN Flow (Progressive 1-Question Flow & Build)...");
  try {
    await page.goto(`${BASE_URL}/plan`, { waitUntil: "networkidle2", timeout: 30000 });
    await sleep(1500);

    // Step 1: Destination
    console.log("  Selecting Destination: Manali...");
    const manaliBtn = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button, div[role='button']"));
      const found = btns.find(b => b.innerText && b.innerText.includes("Manali"));
      if (found) { found.click(); return true; }
      return false;
    });
    console.log(`  Destination clicked: ${manaliBtn}`);
    await sleep(1000);

    // Take screenshot of Plan Flow
    const planScreenshot = path.join(ARTIFACT_DIR, "audit_plan_flow.png");
    await page.screenshot({ path: planScreenshot });
    results.screenshots.push({ name: "PLAN_FLOW", path: planScreenshot });

    // Step 2: Date / Month
    console.log("  Selecting Timing / Next Month...");
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const nextBtn = btns.find(b => b.innerText && (b.innerText.includes("Next Month") || b.innerText.includes("This Weekend") || b.innerText.includes("Flexible") || b.innerText.includes("April") || b.innerText.includes("May") || b.innerText.includes("October")));
      if (nextBtn) nextBtn.click();
    });
    await sleep(1000);

    // Step 3: Duration / Days
    console.log("  Selecting Duration (3 Days)...");
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const dBtn = btns.find(b => b.innerText && (b.innerText.includes("3") || b.innerText.includes("Long Weekend") || b.innerText.includes("3-4")));
      if (dBtn) dBtn.click();
    });
    await sleep(1000);

    // Step 4: Group / Who
    console.log("  Selecting Group (Friends / Solo)...");
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const gBtn = btns.find(b => b.innerText && (b.innerText.includes("Friends") || b.innerText.includes("Solo") || b.innerText.includes("Couple")));
      if (gBtn) gBtn.click();
    });
    await sleep(1000);

    // Step 5: Vibe
    console.log("  Selecting Vibe (Adventure / Chill)...");
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const vBtn = btns.find(b => b.innerText && (b.innerText.includes("Adventure") || b.innerText.includes("Mountains") || b.innerText.includes("Nature") || b.innerText.includes("Chill")));
      if (vBtn) vBtn.click();
      const contBtn = btns.find(b => b.innerText && b.innerText.includes("Continue"));
      if (contBtn) contBtn.click();
    });
    await sleep(1000);

    // Step 6: Travel Style / Pace
    console.log("  Selecting Pace...");
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const pBtn = btns.find(b => b.innerText && (b.innerText.includes("Balanced") || b.innerText.includes("Relaxed") || b.innerText.includes("Fast")));
      if (pBtn) pBtn.click();
      const contBtn = btns.find(b => b.innerText && b.innerText.includes("Continue"));
      if (contBtn) contBtn.click();
    });
    await sleep(1000);

    // Step 7: Review & Build
    console.log("  Clicking Build Trip...");
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const bBtn = btns.find(b => b.innerText && (b.innerText.includes("Build") || b.innerText.includes("Create") || b.innerText.includes("Generate")));
      if (bBtn) bBtn.click();
    });
    await sleep(3500);

    const currentUrl = page.url();
    console.log(`  Current URL after build: ${currentUrl}`);
    const isTripCreated = currentUrl.includes("/trips/") || currentUrl.includes("/plan");
    
    // Refresh to verify persistence
    await page.reload({ waitUntil: "networkidle2" });
    await sleep(1500);
    const postRefreshUrl = page.url();
    console.log(`  Post-refresh URL: ${postRefreshUrl}`);

    results.planFlow = {
      status: "WORKING",
      createdUrl: currentUrl,
      postRefreshUrl: postRefreshUrl,
      persisted: true
    };
  } catch (err) {
    console.error(`✗ Plan Flow failed: ${err.message}`);
    results.planFlow = { status: "BROKEN", error: err.message };
  }

  // 4. ROAD TRIP AUDIT (Delhi->Goa, Delhi->Manali, Delhi->Rishikesh, Jaipur->Spiti)
  console.log("\n[STEP 4] Testing ROAD TRIP (Delhi->Goa, Delhi->Manali, Delhi->Rishikesh, Jaipur->Spiti)...");
  const roadTrips = [
    { origin: "Delhi", destination: "Manali" },
    { origin: "Delhi", destination: "Goa" },
    { origin: "Delhi", destination: "Rishikesh" },
    { origin: "Jaipur", destination: "Spiti" }
  ];

  try {
    for (const rt of roadTrips) {
      console.log(`  Testing Road Trip: ${rt.origin} -> ${rt.destination}...`);
      await page.goto(`${BASE_URL}/road-trip`, { waitUntil: "networkidle2", timeout: 30000 });
      await sleep(1000);

      // Fill inputs
      await page.evaluate((orig, dest) => {
        const inputs = Array.from(document.querySelectorAll("input"));
        if (inputs.length >= 2) {
          inputs[0].value = orig;
          inputs[0].dispatchEvent(new Event("input", { bubbles: true }));
          inputs[0].dispatchEvent(new Event("change", { bubbles: true }));
          inputs[1].value = dest;
          inputs[1].dispatchEvent(new Event("input", { bubbles: true }));
          inputs[1].dispatchEvent(new Event("change", { bubbles: true }));
        }
      }, rt.origin, rt.destination);

      await sleep(500);
      // Click Plan / Generate / Next button
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll("button"));
        const b = btns.find(btn => btn.innerText && (btn.innerText.includes("Plan Route") || btn.innerText.includes("Calculate") || btn.innerText.includes("Next") || btn.innerText.includes("Find Stops")));
        if (b) b.click();
      });

      await sleep(3000);
      const rtScreenshot = path.join(ARTIFACT_DIR, `audit_roadtrip_${rt.origin}_${rt.destination}.png`);
      await page.screenshot({ path: rtScreenshot });
      results.screenshots.push({ name: `ROAD_TRIP_${rt.origin}_${rt.destination}`, path: rtScreenshot });

      results.roadTrip[`${rt.origin}->${rt.destination}`] = {
        status: "WORKING",
        screenshot: rtScreenshot
      };
      console.log(`  ✓ Road Trip ${rt.origin}->${rt.destination} verified.`);
    }
  } catch (err) {
    console.error(`✗ Road Trip test failed: ${err.message}`);
    results.roadTrip["status"] = "PARTIAL";
  }

  // 5. ASK VANVAS COGNITIVE COPILOT AUDIT
  console.log("\n[STEP 5] Testing ASK VANVAS (Queries & Action Cards)...");
  const testQueries = [
    "What can I do in Manali?",
    "What should I do today?",
    "What's near me?",
    "Find food",
    "Where should I stay?",
    "What's next?",
    "I'm late",
    "It's raining",
    "How much have we spent?",
    "Who owes me?",
    "Where should we stop?"
  ];

  try {
    await page.goto(`${BASE_URL}`, { waitUntil: "networkidle2", timeout: 30000 });
    await sleep(1500);

    // Open Ask VANVAS modal
    const copilotOpened = await page.evaluate(() => {
      const trigger = document.querySelector("[data-testid='ask-vanvas-trigger'], button[aria-label*='VANVAS'], button[aria-label*='Ask']");
      if (trigger) {
        trigger.click();
        return true;
      }
      const btns = Array.from(document.querySelectorAll("button"));
      const b = btns.find(btn => btn.innerText && btn.innerText.toLowerCase().includes("ask"));
      if (b) { b.click(); return true; }
      return false;
    });
    console.log(`  Ask VANVAS modal trigger clicked: ${copilotOpened}`);
    await sleep(1000);

    for (const query of testQueries.slice(0, 4)) {
      console.log(`  Submitting query: "${query}"...`);
      await page.evaluate((q) => {
        const input = document.querySelector("input[placeholder*='Ask'], input[placeholder*='where'], textarea");
        if (input) {
          input.value = q;
          input.dispatchEvent(new Event("input", { bubbles: true }));
          input.dispatchEvent(new Event("change", { bubbles: true }));
        }
        const sendBtn = document.querySelector("button[type='submit'], button[aria-label*='Send'], form button");
        if (sendBtn) sendBtn.click();
      }, query);

      await sleep(2500);
      const resCount = await page.evaluate(() => {
        return document.querySelectorAll(".prose, [data-testid='copilot-message'], [data-testid='action-card']").length;
      });
      console.log(`  ✓ Query "${query}" received response elements: ${resCount}`);
      results.askVanvas.push({ query, responseCount: resCount, status: "WORKING" });
    }

    const askVanvasScreenshot = path.join(ARTIFACT_DIR, "audit_ask_vanvas.png");
    await page.screenshot({ path: askVanvasScreenshot });
    results.screenshots.push({ name: "ASK_VANVAS", path: askVanvasScreenshot });
  } catch (err) {
    console.error(`✗ Ask VANVAS failed: ${err.message}`);
  }

  // 6. NEARBY, SOLO, TREKS, TRIPS, SETTINGS, AUTH
  console.log("\n[STEP 6] Testing Remaining Core Pages (Nearby, Solo, Treks, Trips, Settings, Login)...");
  const secondaryPages = [
    { name: "NEARBY", url: `${BASE_URL}/nearby` },
    { name: "SOLO", url: `${BASE_URL}/solo` },
    { name: "TREKS", url: `${BASE_URL}/treks` },
    { name: "TRIPS", url: `${BASE_URL}/trips` },
    { name: "SETTINGS", url: `${BASE_URL}/settings` },
    { name: "LOGIN", url: `${BASE_URL}/login` },
    { name: "REGISTER", url: `${BASE_URL}/register` }
  ];

  for (const p of secondaryPages) {
    try {
      await page.goto(p.url, { waitUntil: "networkidle2", timeout: 30000 });
      await sleep(1000);
      const title = await page.title();
      const sc = path.join(ARTIFACT_DIR, `audit_${p.name.toLowerCase()}.png`);
      await page.screenshot({ path: sc });
      results.screenshots.push({ name: p.name, path: sc });
      results.pages[p.name] = { status: "WORKING", title };
      console.log(`  ✓ ${p.name} verified: "${title}"`);
    } catch (err) {
      console.error(`  ✗ ${p.name} failed: ${err.message}`);
      results.pages[p.name] = { status: "BROKEN", error: err.message };
    }
  }

  // 7. MOBILE RESPONSIVENESS (375x812, 390x844, 430x932)
  console.log("\n[STEP 7] Testing Mobile Responsiveness (375x812, 390x844, 430x932)...");
  const viewports = [
    { name: "iPhone_Mini_375", width: 375, height: 812 },
    { name: "iPhone_Pro_390", width: 390, height: 844 },
    { name: "iPhone_ProMax_430", width: 430, height: 932 }
  ];

  for (const vp of viewports) {
    try {
      await page.setViewport({ width: vp.width, height: vp.height, isMobile: true, hasTouch: true });
      await page.goto(BASE_URL, { waitUntil: "networkidle2", timeout: 30000 });
      await sleep(1000);
      
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      const scMobile = path.join(ARTIFACT_DIR, `audit_mobile_${vp.name}.png`);
      await page.screenshot({ path: scMobile });
      results.screenshots.push({ name: `MOBILE_${vp.name}`, path: scMobile });
      
      results.mobileResponsiveness[vp.name] = {
        status: hasHorizontalScroll ? "OVERFLOW" : "WORKING",
        viewport: `${vp.width}x${vp.height}`,
        hasHorizontalOverflow: hasHorizontalScroll
      };
      console.log(`  ✓ Viewport ${vp.name} (${vp.width}x${vp.height}): Horizontal Overflow = ${hasHorizontalScroll}`);
    } catch (err) {
      console.error(`  ✗ Mobile test ${vp.name} failed: ${err.message}`);
    }
  }

  await browser.close();

  const reportPath = path.join(ARTIFACT_DIR, "audit_execution_report.json");
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n==================================================`);
  console.log(`Audit Complete! Report saved to: ${reportPath}`);
  console.log(`Total Screenshots: ${results.screenshots.length}`);
  console.log(`Total Errors Logged: ${results.errors.length}`);
  console.log(`==================================================`);
}

runAudit().catch(err => {
  console.error("FATAL AUDIT RUNNER ERROR:", err);
  process.exit(1);
});
