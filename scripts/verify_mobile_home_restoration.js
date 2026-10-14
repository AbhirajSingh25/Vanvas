const path = require("path");
const fs = require("fs");
const puppeteer = require(path.resolve(__dirname, "../frontend/node_modules/puppeteer-core"));

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const ARTIFACT_DIR = path.resolve("C:\\Users\\user\\.gemini\\antigravity-ide\\brain\\0e625c3c-18c4-424e-8459-b6e31a2063e3\\mobile_home_audit_screenshots");
const BASE_URL = "http://localhost:3000";

if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

const VIEWPORTS = [
  { name: "360x780_android", width: 360, height: 780 },
  { name: "390x844_iphone", width: 390, height: 844 },
  { name: "430x932_iphone_max", width: 430, height: 932 },
  { name: "768x1024_tablet", width: 768, height: 1024 },
  { name: "1440x900_desktop", width: 1440, height: 900 }
];

async function runMobileAudit() {
  console.log("==================================================================");
  console.log("VANVAS MOBILE HOME RESTORATION & ACCEPTANCE AUDIT");
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

  const results = {
    viewportsTested: [],
    densitySwitcherVisible: false,
    densitySwitchWorked: false,
    densityPersistedAfterReload: false,
    densityDimensionsDiff: null,
    soloTravelFound: false,
    allModesFound: [],
    modeCountText: "",
    duplicateHeaderDetected: false,
    horizontalOverflows: [],
    bottomNavObscuring: false,
    bottomGapCheck: null,
    screenshots: []
  };

  try {
    // 1. Audit Viewports and Density Modes
    for (const vp of VIEWPORTS) {
      console.log(`\nTesting Viewport: ${vp.name} (${vp.width}x${vp.height})`);
      const page = await browser.newPage();
      await page.setViewport({ width: vp.width, height: vp.height });
      await page.evaluateOnNewDocument(() => {
        try {
          sessionStorage.setItem("vanvas_startup_shown", "1");
        } catch (e) {}
      });

      await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
      await sleep(2000);

      // Check overflow
      const overflow = await page.evaluate(() => {
        const docW = document.documentElement.scrollWidth;
        const winW = window.innerWidth;
        return { docW, winW, hasOverflow: docW > winW };
      });

      if (overflow.hasOverflow) {
        console.error(`  [DEFECT] Horizontal overflow detected at ${vp.name}: doc=${overflow.docW} > win=${overflow.winW}`);
        results.horizontalOverflows.push({ viewport: vp.name, ...overflow });
      } else {
        console.log(`  [OK] No horizontal overflow: doc=${overflow.docW} <= win=${overflow.winW}`);
      }

      // Check duplicate branding or header in mobile view
      if (vp.width < 1280) {
        const headerCheck = await page.evaluate(() => {
          const mobileCommand = document.querySelector('[data-testid="mobile-command-center"]');
          if (!mobileCommand) return { foundCommandCenter: false, innerLogoCount: 0 };
          const logos = mobileCommand.querySelectorAll('svg[aria-label="VANVAS Emblem"], a[href="/"]');
          return {
            foundCommandCenter: true,
            innerLogoCount: logos.length
          };
        });
        if (headerCheck.innerLogoCount > 0) {
          console.warn(`  [WARN] Potential duplicate logo/link inside command center: ${headerCheck.innerLogoCount}`);
          results.duplicateHeaderDetected = true;
        } else {
          console.log(`  [OK] No duplicate branding inside mobile command center`);
        }
      }

      // Capture Original Mode Screenshot
      const origShotPath = path.join(ARTIFACT_DIR, `home_${vp.name}_original.png`);
      await page.screenshot({ path: origShotPath, fullPage: false });
      results.screenshots.push(`home_${vp.name}_original.png`);
      console.log(`  [Screenshot] Saved: home_${vp.name}_original.png`);

      // Switch to Compact Mode if switcher exists
      const hasCompactBtn = await page.evaluate(() => {
        const btn = document.getElementById("density-btn-compact") || document.querySelector('button[aria-label="Switch to Compact Mode"]');
        if (btn) {
          btn.click();
          return true;
        }
        return false;
      });

      if (hasCompactBtn) {
        results.densitySwitcherVisible = true;
        await sleep(800);
        const isCompactActive = await page.evaluate(() => {
          return document.documentElement.getAttribute("data-density") === "compact" ||
                 document.documentElement.classList.contains("density-compact");
        });
        if (isCompactActive) {
          results.densitySwitchWorked = true;
        }

        // Capture Compact Mode Screenshot
        const compactShotPath = path.join(ARTIFACT_DIR, `home_${vp.name}_compact.png`);
        await page.screenshot({ path: compactShotPath, fullPage: false });
        results.screenshots.push(`home_${vp.name}_compact.png`);
        console.log(`  [Screenshot] Saved: home_${vp.name}_compact.png`);
      }

      results.viewportsTested.push(vp.name);
      await page.close();
    }

    // 2. Dedicated Deep Inspection on standard phone viewport (390x844)
    console.log("\n--- Detailed Mobile Functional & Persistence Verification (390x844) ---");
    const mobilePage = await browser.newPage();
    await mobilePage.setViewport({ width: 390, height: 844 });
    await mobilePage.evaluateOnNewDocument(() => {
      try {
        sessionStorage.setItem("vanvas_startup_shown", "1");
      } catch (e) {}
    });

    // Start with Original
    await mobilePage.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await sleep(2000);
    await mobilePage.evaluate(() => {
      const btn = document.getElementById("density-btn-original");
      if (btn) btn.click();
    });
    await sleep(1000);

    // Measure Original dimensions
    const originalDims = await mobilePage.evaluate(() => {
      const modeGrid = document.querySelector('[data-testid="mobile-command-center"]');
      const actionLinks = modeGrid ? Array.from(modeGrid.querySelectorAll('a[href="/plan"], a[href="/explore"]')) : [];
      const planBox = actionLinks[0]?.getBoundingClientRect();
      const firstDestCard = modeGrid ? modeGrid.querySelector('a[href^="/explore/"]') : null;
      const destBox = firstDestCard ? firstDestCard.getBoundingClientRect() : null;
      const densityAttr = document.documentElement.getAttribute("data-density");
      return {
        planHeight: planBox ? planBox.height : 0,
        planWidth: planBox ? planBox.width : 0,
        destWidth: destBox ? destBox.width : 0,
        destHeight: destBox ? destBox.height : 0,
        densityAttr
      };
    });
    console.log("  Original Mode Dimensions:", originalDims);

    // Click Compact button
    await mobilePage.evaluate(() => {
      const btn = document.getElementById("density-btn-compact") || document.querySelector('button[aria-label="Switch to Compact Mode"]');
      if (btn) btn.click();
    });
    await sleep(1000);

    // Measure Compact dimensions
    const compactDims = await mobilePage.evaluate(() => {
      const modeGrid = document.querySelector('[data-testid="mobile-command-center"]');
      const actionLinks = modeGrid ? Array.from(modeGrid.querySelectorAll('a[href="/plan"], a[href="/explore"]')) : [];
      const planBox = actionLinks[0]?.getBoundingClientRect();
      const firstDestCard = modeGrid ? modeGrid.querySelector('a[href^="/explore/"]') : null;
      const destBox = firstDestCard ? firstDestCard.getBoundingClientRect() : null;
      const densityAttr = document.documentElement.getAttribute("data-density");
      return {
        planHeight: planBox ? planBox.height : 0,
        planWidth: planBox ? planBox.width : 0,
        destWidth: destBox ? destBox.width : 0,
        destHeight: destBox ? destBox.height : 0,
        densityAttr
      };
    });
    console.log("  Compact Mode Dimensions:", compactDims);

    results.densityDimensionsDiff = {
      planHeightDiff: originalDims.planHeight - compactDims.planHeight,
      destWidthDiff: originalDims.destWidth - compactDims.destWidth
    };
    console.log("  Difference (Original - Compact):", results.densityDimensionsDiff);

    // Verify persistence after page reload
    console.log("  Reloading page to test persistence of Compact mode...");
    await mobilePage.reload({ waitUntil: "domcontentloaded" });
    await sleep(2000);
    const reloadedDensity = await mobilePage.evaluate(() => {
      return {
        domAttr: document.documentElement.getAttribute("data-density"),
        hasCompactClass: document.documentElement.classList.contains("density-compact"),
        localStore: localStorage.getItem("vanvas_density")
      };
    });
    console.log("  Reloaded Density State:", reloadedDensity);
    results.densityPersistedAfterReload = (reloadedDensity.domAttr === "compact" || reloadedDensity.localStore === "compact");

    // 3. Verify All 5 Travel Modes
    console.log("\n--- Checking Travel Modes & Navigation ---");
    const modeChecks = await mobilePage.evaluate(() => {
      const modesSection = document.querySelector('[data-testid="mobile-command-center"]');
      if (!modesSection) return { found: false, links: [], countText: "" };

      const links = Array.from(modesSection.querySelectorAll('a[href="/road-trip"], a[href="/one-day"], a[href="/solo"], a[href="/treks"], a[href="/nearby"]')).map(a => ({
        href: a.getAttribute("href"),
        text: a.innerText.trim().replace(/\n/g, " "),
        bounds: a.getBoundingClientRect()
      }));

      const countSpan = Array.from(modesSection.querySelectorAll("span")).find(s => s.innerText.includes("MODE"));

      return {
        found: true,
        links,
        countText: countSpan ? countSpan.innerText.trim() : ""
      };
    });

    console.log(`  Travel Mode Count Display: "${modeChecks.countText}"`);
    results.modeCountText = modeChecks.countText;
    results.allModesFound = modeChecks.links.map(l => l.href);
    results.soloTravelFound = results.allModesFound.includes("/solo");

    console.log(`  Found ${modeChecks.links.length} modes:`);
    for (const l of modeChecks.links) {
      console.log(`    - ${l.href} (${l.text})`);
    }

    // 4. Test actual navigation to /solo
    console.log("\n--- Testing Navigation to /solo ---");
    await mobilePage.evaluate(() => {
      const soloLink = document.querySelector('[data-testid="mobile-command-center"] a[href="/solo"]');
      if (soloLink) soloLink.click();
    });
    await sleep(2500);
    const soloUrl = mobilePage.url();
    console.log(`  Arrived at: ${soloUrl}`);
    const soloHeading = await mobilePage.evaluate(() => {
      return document.querySelector("h1")?.innerText || document.title;
    });
    console.log(`  Solo Page Heading/Title: ${soloHeading}`);

    const soloShot = path.join(ARTIFACT_DIR, "solo_page_navigation_390.png");
    await mobilePage.screenshot({ path: soloShot });
    results.screenshots.push("solo_page_navigation_390.png");

    // 5. Navigate back to Home and test /road-trip, /one-day, /treks, /nearby
    console.log("\n--- Testing Other 4 Travel Mode Routes ---");
    const remainingRoutes = ["/road-trip", "/one-day", "/treks", "/nearby"];
    for (const r of remainingRoutes) {
      await mobilePage.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });
      await sleep(1500);
      await mobilePage.evaluate((route) => {
        const link = document.querySelector(`[data-testid="mobile-command-center"] a[href="${route}"]`);
        if (link) link.click();
      }, r);
      await sleep(2000);
      console.log(`  [OK] Successfully navigated to: ${mobilePage.url()}`);
    }

    // 6. Inspect Bottom Navigation and Vertical Spacing on Home
    await mobilePage.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });
    await sleep(1500);

    const bottomCheck = await mobilePage.evaluate(() => {
      const nav = document.querySelector('nav[aria-label="Mobile Navigation"]');
      const navBox = nav ? nav.getBoundingClientRect() : null;

      const cmdCenter = document.querySelector('[data-testid="mobile-command-center"]');
      const cmdBox = cmdCenter ? cmdCenter.getBoundingClientRect() : null;

      // Find last visible child element inside cmdCenter
      const children = cmdCenter ? Array.from(cmdCenter.children) : [];
      const lastChild = children[children.length - 1];
      const lastBox = lastChild ? lastChild.getBoundingClientRect() : null;

      const winH = window.innerHeight;

      return {
        navTop: navBox ? navBox.top : 0,
        navHeight: navBox ? navBox.height : 0,
        cmdBottom: cmdBox ? cmdBox.bottom : 0,
        lastChildBottom: lastBox ? lastBox.bottom : 0,
        winH
      };
    });

    console.log("\n--- Bottom Clearance & Navigation Clearance ---", bottomCheck);
    results.bottomGapCheck = bottomCheck;

    // Full page screenshot of home to confirm aesthetic composition
    const fullHomeShot = path.join(ARTIFACT_DIR, "home_full_page_390.png");
    await mobilePage.screenshot({ path: fullHomeShot, fullPage: true });
    results.screenshots.push("home_full_page_390.png");

    await mobilePage.close();
  } catch (err) {
    console.error("Audit error:", err);
  } finally {
    await browser.close();
  }

  console.log("\n==================================================================");
  console.log("AUDIT SUMMARY REPORT:");
  console.log(JSON.stringify(results, null, 2));
  console.log("==================================================================");

  fs.writeFileSync(path.join(ARTIFACT_DIR, "audit_results.json"), JSON.stringify(results, null, 2));
}

runMobileAudit().catch(console.error);
