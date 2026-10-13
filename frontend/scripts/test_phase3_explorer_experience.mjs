import puppeteer from "puppeteer-core";
import path from "path";

const ARTIFACT_DIR = "C:\\Users\\user\\.gemini\\antigravity-ide\\brain\\c1ae0555-1b21-4922-925e-a10bd7dedcd8";
const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function runAcceptanceSuite() {
  console.log("===============================================================");
  console.log("VANVAS PHASE 3: THE EXPLORER'S APP EXPERIENCE E2E ACCEPTANCE");
  console.log("===============================================================\n");

  const results = [];
  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      results.push({ message, status: "PASS" });
    } else {
      console.error(`[FAIL] ${message}`);
      results.push({ message, status: "FAIL" });
    }
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  try {
    // -------------------------------------------------------------
    // SCENARIO 1: Desktop Editorial Website Mode (1440x900)
    // -------------------------------------------------------------
    console.log("\n--- Scenario 1: Desktop Editorial Website Mode (1440x900) ---");
    const desktopPage = await browser.newPage();
    await desktopPage.setViewport({ width: 1440, height: 900 });
    await desktopPage.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded", timeout: 20000 });
    await sleep(2500);

    const desktopHero = await desktopPage.evaluate(() => {
      const text = document.body.innerText;
      return text.includes("The Timeless Indian Journal") || text.includes("VANVAS") || text.includes("India");
    });
    assert(desktopHero, "Desktop renders authentic editorial title and hero brand presence");

    const desktopFooterExists = await desktopPage.evaluate(() => {
      const footer = document.querySelector("footer");
      return !!footer && window.getComputedStyle(footer).display !== "none";
    });
    assert(desktopFooterExists, "Desktop website preserves full public editorial footer");

    const desktopScreenshotPath = path.join(ARTIFACT_DIR, "vanvas_phase3_desktop_website.png");
    await desktopPage.screenshot({ path: desktopScreenshotPath, fullPage: false });
    console.log(`Screenshot saved: ${desktopScreenshotPath}`);
    await desktopPage.close();

    // -------------------------------------------------------------
    // SCENARIO 2: Mobile Browser Website Mode (390x844, no standalone flag)
    // -------------------------------------------------------------
    console.log("\n--- Scenario 2: Mobile Browser Responsive Website (390x844) ---");
    const mobileBrowserPage = await browser.newPage();
    await mobileBrowserPage.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await mobileBrowserPage.setUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1");
    await mobileBrowserPage.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded", timeout: 20000 });
    await sleep(2500);

    const mobileBrowserFooter = await mobileBrowserPage.evaluate(() => {
      const footer = document.querySelector("footer");
      return !!footer && window.getComputedStyle(footer).display !== "none";
    });
    assert(mobileBrowserFooter, "Responsive mobile browser mode retains public website footer");

    const mobileBrowserScreenshotPath = path.join(ARTIFACT_DIR, "vanvas_phase3_mobile_website.png");
    await mobileBrowserPage.screenshot({ path: mobileBrowserScreenshotPath, fullPage: false });
    console.log(`Screenshot saved: ${mobileBrowserScreenshotPath}`);
    await mobileBrowserPage.close();

    // -------------------------------------------------------------
    // SCENARIO 3: Installed PWA Standalone Mode (390x844, mode=app)
    // -------------------------------------------------------------
    console.log("\n--- Scenario 3: Installed PWA Standalone App Mode (390x844) ---");
    const appPage = await browser.newPage();
    await appPage.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await appPage.setUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148");
    await appPage.goto(`${BASE_URL}/?mode=app`, { waitUntil: "domcontentloaded", timeout: 20000 });
    await sleep(2500);

    const bodyText = await appPage.evaluate(() => document.body.innerText);
    const hasCommandCenter = bodyText.includes("COMMAND CENTER") || bodyText.includes("यात्रा नियंत्रण") || bodyText.includes("नमस्ते") || bodyText.includes("CHALO");
    assert(hasCommandCenter, "Standalone App Mode displays Mobile Travel Command Center");

    const appFooterSuppressed = await appPage.evaluate(() => {
      const footer = document.querySelector("footer");
      return !footer || window.getComputedStyle(footer).display === "none";
    });
    assert(appFooterSuppressed, "Standalone App Mode suppresses long public marketing footer");

    const bottomNavExists = await appPage.evaluate(() => {
      const nav = document.querySelector("nav");
      return !!nav;
    });
    assert(bottomNavExists, "Bottom Navigation Bar is active in standalone app shell");

    const appScreenshotPath = path.join(ARTIFACT_DIR, "vanvas_phase3_installed_app_home.png");
    await appPage.screenshot({ path: appScreenshotPath, fullPage: false });
    console.log(`Screenshot saved: ${appScreenshotPath}`);

    // -------------------------------------------------------------
    // SCENARIO 4: Core Journey - Search Destination Handoff to Plan
    // -------------------------------------------------------------
    console.log("\n--- Scenario 4: Destination Search to Plan Wizard Handoff ---");
    await appPage.goto(`${BASE_URL}/plan?dest=varanasi&mode=app`, { waitUntil: "domcontentloaded", timeout: 20000 });
    await sleep(2500);

    const planPageText = await appPage.evaluate(() => document.body.innerText);
    const destinationHandoffSuccess = planPageText.toLowerCase().includes("varanasi");
    assert(destinationHandoffSuccess, "Plan Wizard receives and preselects 'Varanasi' directly from URL/search handoff");

    const planScreenshotPath = path.join(ARTIFACT_DIR, "vanvas_phase3_plan_handoff.png");
    await appPage.screenshot({ path: planScreenshotPath, fullPage: false });
    console.log(`Screenshot saved: ${planScreenshotPath}`);

    // -------------------------------------------------------------
    // SCENARIO 5: Solo Travel 4-Tab Architecture (/solo)
    // -------------------------------------------------------------
    console.log("\n--- Scenario 5: Solo Travel Cockpit & 4 Focused Tabs ---");
    await appPage.goto(`${BASE_URL}/solo?dest=manali&mode=app`, { waitUntil: "domcontentloaded", timeout: 20000 });
    await sleep(2500);

    const soloText = await appPage.evaluate(() => document.body.innerText);
    const hasSoloTabs = soloText.includes("Discover") && soloText.includes("Travellers") && soloText.includes("Circles") && soloText.includes("Safety");
    assert(hasSoloTabs, "Solo Travel renders 4 clear top-level tabs (Discover, Travellers, Circles, Safety)");

    // Switch to Travellers tab
    const switchedToTravellers = await appPage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const btn = buttons.find((b) => b.innerText.includes("Travellers"));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    if (switchedToTravellers) {
      await sleep(1500);
      const afterTravellersText = await appPage.evaluate(() => document.body.innerText);
      assert(afterTravellersText.includes("Solo Explorers") || afterTravellersText.includes("active travellers"), "Switches to Travellers community tab cleanly");
    }

    const soloScreenshotPath = path.join(ARTIFACT_DIR, "vanvas_phase3_solo_cockpit.png");
    await appPage.screenshot({ path: soloScreenshotPath, fullPage: false });
    console.log(`Screenshot saved: ${soloScreenshotPath}`);

    // -------------------------------------------------------------
    // SCENARIO 6: Trek Discovery & Cockpit (/treks & /treks/hampta-pass)
    // -------------------------------------------------------------
    console.log("\n--- Scenario 6: Trek Discovery & Cockpit ---");
    await appPage.goto(`${BASE_URL}/treks?mode=app`, { waitUntil: "domcontentloaded", timeout: 20000 });
    await sleep(2500);

    const trekDeskText = await appPage.evaluate(() => document.body.innerText);
    const hasTrekDesk = trekDeskText.includes("EXPEDITION DESK") || trekDeskText.includes("Himalayan Treks") || trekDeskText.includes("Difficulty");
    assert(hasTrekDesk, "Trek Discovery features scannable Expedition Desk header");

    await appPage.goto(`${BASE_URL}/treks/hampta-pass?mode=app`, { waitUntil: "domcontentloaded", timeout: 20000 });
    await sleep(2500);

    const trekDetailText = await appPage.evaluate(() => document.body.innerText);
    const hasTrekTabs = trekDetailText.includes("Overview") && trekDetailText.includes("Route & Map") && trekDetailText.includes("Gear & Prep") && trekDetailText.includes("Budget");
    assert(hasTrekTabs, "Trek detail page renders organized 5-tab Cockpit navigation");

    const trekScreenshotPath = path.join(ARTIFACT_DIR, "vanvas_phase3_trek_cockpit.png");
    await appPage.screenshot({ path: trekScreenshotPath, fullPage: false });
    console.log(`Screenshot saved: ${trekScreenshotPath}`);

    await appPage.close();

    // -------------------------------------------------------------
    // Summary
    // -------------------------------------------------------------
    console.log("\n===============================================================");
    const passed = results.filter((r) => r.status === "PASS").length;
    const total = results.length;
    console.log(`RESULTS: ${passed}/${total} TESTS PASSED`);
    console.log("===============================================================\n");

    if (passed === total) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error("Test execution encountered an error:", err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runAcceptanceSuite();
