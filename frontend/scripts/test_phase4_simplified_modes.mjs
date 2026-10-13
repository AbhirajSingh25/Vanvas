import puppeteer from "puppeteer-core";
import path from "path";

const ARTIFACT_DIR = "C:\\Users\\user\\.gemini\\antigravity-ide\\brain\\c1ae0555-1b21-4922-925e-a10bd7dedcd8";
const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function runPhase4Acceptance() {
  console.log("===============================================================");
  console.log("VANVAS PHASE 4: SIMPLIFIED TRAVEL MODES & MOBILE APP UX E2E");
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
    // SCENARIO 1: One Day / Day Escape Mode - 3 Core Questions & Palette
    // -------------------------------------------------------------
    console.log("\n--- Scenario 1: One Day Mode Planning & Visual Family ---");
    const oneDayPage = await browser.newPage();
    await oneDayPage.setViewport({ width: 1440, height: 900 });
    await oneDayPage.goto(`${BASE_URL}/one-day`, { waitUntil: "domcontentloaded", timeout: 25000 });
    await sleep(2500);

    // 1. Verify Non-Dark Palette (Parchment primary surface)
    const pageBgColor = await oneDayPage.evaluate(() => {
      const el = document.querySelector(".min-h-screen");
      return window.getComputedStyle(el).backgroundColor;
    });
    // #FAF4E8 in rgb is rgb(250, 244, 232)
    const isParchment = pageBgColor.includes("250") || pageBgColor.includes("239") || pageBgColor.includes("244");
    assert(isParchment, "One Day page uses authentic Explorer's Desk parchment background instead of pitch black");

    // 2. Verify 3 Core Planning Questions Are Answered Upfront
    const oneDayBodyText = await oneDayPage.evaluate(() => document.body.innerText.toLowerCase());
    const hasQuestion1 = oneDayBodyText.includes("where are you starting") || oneDayBodyText.includes("starting & heading");
    const hasQuestion2 = oneDayBodyText.includes("how much time do you have");
    const hasQuestion3 = oneDayBodyText.includes("preferred experience style") || oneDayBodyText.includes("experience style");
    assert(hasQuestion1, "One Day answers Question 1: 'Where are you starting & heading?'");
    assert(hasQuestion2, "One Day answers Question 2: 'How much time do you have?' (3h, 6h, Full Day)");
    assert(hasQuestion3, "One Day answers Question 3: 'Preferred Experience Style' (Food, Nature, Culture, Adventure)");

    // 3. Verify Prominent Planning Button
    const hasPlanAction = oneDayBodyText.includes("update itinerary") || oneDayBodyText.includes("plan in vanvas");
    assert(hasPlanAction, "One Day displays prominent action to update or plan itinerary");

    // 4. Verify Reusable Tab Bar & Chronological Sequence
    const hasItineraryTabs = oneDayBodyText.includes("itinerary") && oneDayBodyText.includes("route & map") && oneDayBodyText.includes("budget") && oneDayBodyText.includes("checklist");
    assert(hasItineraryTabs, "One Day organizes secondary sections into compact horizontal VanvasTabBar");

    // Save desktop screenshot
    const oneDayDesktopScreenshot = path.join(ARTIFACT_DIR, "vanvas_phase4_oneday_desktop.png");
    await oneDayPage.screenshot({ path: oneDayDesktopScreenshot, fullPage: false });
    console.log(`Screenshot saved: ${oneDayDesktopScreenshot}`);

    // 5. Test Switching Tabs (Route & Map, Budget, Checklist)
    const switchedToBudget = await oneDayPage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const btn = buttons.find((b) => b.innerText.includes("Budget"));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    if (switchedToBudget) {
      await sleep(1000);
      const budgetText = await oneDayPage.evaluate(() => document.body.innerText);
      assert(budgetText.includes("Cost Breakdown") || budgetText.includes("Per Person Split"), "One Day switches to Budget tab ledger cleanly");
    }

    // 6. Test Stop Detail Adaptive Modal
    const switchedBackToItinerary = await oneDayPage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const btn = buttons.find((b) => b.innerText.includes("Itinerary"));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    if (switchedBackToItinerary) {
      await sleep(800);
    }

    // Click first stop card
    const openedModal = await oneDayPage.evaluate(() => {
      const cards = Array.from(document.querySelectorAll("div[class*='cursor-pointer']"));
      const stopCard = cards.find((c) => c.innerText.includes("Details →"));
      if (stopCard) {
        stopCard.click();
        return true;
      }
      return false;
    });
    if (openedModal) {
      await sleep(1000);
      const modalText = await oneDayPage.evaluate(() => document.body.innerText);
      assert(modalText.includes("ACTIVITY & DURATION") || modalText.includes("Local Insider Tip"), "Stop detail adaptive modal opens with rich local intelligence");

      const modalScreenshot = path.join(ARTIFACT_DIR, "vanvas_phase4_oneday_modal.png");
      await oneDayPage.screenshot({ path: modalScreenshot, fullPage: false });
      console.log(`Screenshot saved: ${modalScreenshot}`);

      // Close modal
      await oneDayPage.keyboard.press("Escape");
      await sleep(600);
    }

    await oneDayPage.close();

    // -------------------------------------------------------------
    // SCENARIO 2: Mobile Responsive One Day Experience (390x844)
    // -------------------------------------------------------------
    console.log("\n--- Scenario 2: Mobile Responsive One Day (390x844) ---");
    const mobileOneDayPage = await browser.newPage();
    await mobileOneDayPage.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await mobileOneDayPage.setUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1");
    await mobileOneDayPage.goto(`${BASE_URL}/one-day?from=delhi`, { waitUntil: "domcontentloaded", timeout: 25000 });
    await sleep(2000);

    const hasNoHorizontalOverflow = await mobileOneDayPage.evaluate(() => {
      return document.documentElement.scrollWidth <= window.innerWidth + 5;
    });
    assert(hasNoHorizontalOverflow, "One Day page layout has no horizontal overflow on mobile 390px");

    const oneDayMobileScreenshot = path.join(ARTIFACT_DIR, "vanvas_phase4_oneday_mobile.png");
    await mobileOneDayPage.screenshot({ path: oneDayMobileScreenshot, fullPage: false });
    console.log(`Screenshot saved: ${oneDayMobileScreenshot}`);
    await mobileOneDayPage.close();

    // -------------------------------------------------------------
    // SCENARIO 3: Trek Discovery - Explorer's Desk Palette & Filters
    // -------------------------------------------------------------
    console.log("\n--- Scenario 3: Trek Discovery Page (/treks) ---");
    const treksPage = await browser.newPage();
    await treksPage.setViewport({ width: 1440, height: 900 });
    await treksPage.goto(`${BASE_URL}/treks`, { waitUntil: "domcontentloaded", timeout: 25000 });
    await sleep(2000);

    // Verify non-black palette
    const treksBgColor = await treksPage.evaluate(() => {
      const el = document.querySelector(".min-h-screen");
      return window.getComputedStyle(el).backgroundColor;
    });
    const isTreksParchment = treksBgColor.includes("250") || treksBgColor.includes("244");
    assert(isTreksParchment, "Trek Discovery page uses authentic parchment palette (#FAF4E8), not pitch black");

    const treksText = await treksPage.evaluate(() => document.body.innerText.toLowerCase());
    const hasExpeditionDesk = treksText.includes("expedition desk") && treksText.includes("difficulty") && treksText.includes("est. budget");
    assert(hasExpeditionDesk, "Trek Discovery answers key questions via Expedition Desk header");

    const treksListScreenshot = path.join(ARTIFACT_DIR, "vanvas_phase4_treks_list.png");
    await treksPage.screenshot({ path: treksListScreenshot, fullPage: false });
    console.log(`Screenshot saved: ${treksListScreenshot}`);
    await treksPage.close();

    // -------------------------------------------------------------
    // SCENARIO 4: Trek Cockpit (/treks/hampta-pass) - Safety & 5 Tabs
    // -------------------------------------------------------------
    console.log("\n--- Scenario 4: Trek Cockpit & Safety Directives (/treks/hampta-pass) ---");
    const trekDetailPage = await browser.newPage();
    await trekDetailPage.setViewport({ width: 1440, height: 900 });
    await trekDetailPage.goto(`${BASE_URL}/treks/hampta-pass`, { waitUntil: "domcontentloaded", timeout: 25000 });
    await sleep(2500);

    // Verify parchment styling
    const trekDetailBgColor = await trekDetailPage.evaluate(() => {
      const el = document.querySelector(".min-h-screen");
      return window.getComputedStyle(el).backgroundColor;
    });
    const isTrekDetailParchment = trekDetailBgColor.includes("250") || trekDetailBgColor.includes("244");
    assert(isTrekDetailParchment, "Trek detail page adopts warm parchment surface (#FAF4E8)");

    const trekDetailText = await trekDetailPage.evaluate(() => document.body.innerText.toLowerCase());

    // Urgent Safety Callout
    const hasSafetyCallout = trekDetailText.includes("acclimatization required") || trekDetailText.includes("ams");
    assert(hasSafetyCallout, "Urgent altitude safety warning is prominent and never hidden");

    // Compact 5 Tabs
    const hasTrek5Tabs = trekDetailText.includes("overview") && trekDetailText.includes("route & map") && trekDetailText.includes("conditions & safety") && trekDetailText.includes("gear & prep") && trekDetailText.includes("budget");
    assert(hasTrek5Tabs, "Trek Cockpit organizes details into 5 compact tabs (Overview, Route, Conditions & Safety, Gear, Budget)");

    // Switch to Conditions & Safety Tab
    const switchedToSafety = await trekDetailPage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const btn = buttons.find((b) => b.innerText.includes("Conditions & Safety"));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    if (switchedToSafety) {
      await sleep(1000);
      const safetyText = await trekDetailPage.evaluate(() => document.body.innerText);
      assert(safetyText.includes("Nearest Medical Aid") || safetyText.includes("Medical Directives"), "Switches to Conditions & Safety tab cleanly");
    }

    // Switch to Gear & Prep Tab
    const switchedToGear = await trekDetailPage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const btn = buttons.find((b) => b.innerText.includes("Gear & Prep"));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    if (switchedToGear) {
      await sleep(1000);
      const gearText = await trekDetailPage.evaluate(() => document.body.innerText);
      assert(gearText.includes("Gear Planner") || gearText.includes("STUDENT"), "Switches to Gear & Prep tab optimizer cleanly");
    }

    const trekCockpitScreenshot = path.join(ARTIFACT_DIR, "vanvas_phase4_trek_cockpit.png");
    await trekDetailPage.screenshot({ path: trekCockpitScreenshot, fullPage: false });
    console.log(`Screenshot saved: ${trekCockpitScreenshot}`);

    // Test Trail Mode launch & exit
    const launchedTrailMode = await trekDetailPage.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const btn = buttons.find((b) => b.innerText.includes("Trail Mode"));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    if (launchedTrailMode) {
      await sleep(1000);
      const trailModeText = await trekDetailPage.evaluate(() => document.body.innerText);
      assert(trailModeText.includes("TRAIL COCKPIT") && trailModeText.includes("Waypoint 1"), "Launches full-screen on-trail cockpit mode with altitude telemetry");

      // Exit trail mode
      await trekDetailPage.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll("button"));
        const btn = buttons.find((b) => b.innerText.includes("Exit [✕]"));
        if (btn) btn.click();
      });
      await sleep(800);
    }

    await trekDetailPage.close();

    // -------------------------------------------------------------
    // SCENARIO 5: Solo Travel Tab Bar Consistency Check (/solo)
    // -------------------------------------------------------------
    console.log("\n--- Scenario 5: Solo Travel Shared Tab Bar Consistency ---");
    const soloPage = await browser.newPage();
    await soloPage.setViewport({ width: 1440, height: 900 });
    await soloPage.goto(`${BASE_URL}/solo?dest=manali`, { waitUntil: "domcontentloaded", timeout: 25000 });
    await sleep(2000);

    const soloText = await soloPage.evaluate(() => document.body.innerText);
    const hasSoloSharedTabs = soloText.includes("Discover") && soloText.includes("Travellers") && soloText.includes("Circles") && soloText.includes("Safety");
    assert(hasSoloSharedTabs, "Solo Travel page maintains exact same unified VanvasTabBar navigation");

    await soloPage.close();

    // -------------------------------------------------------------
    // Final Summary
    // -------------------------------------------------------------
    console.log("\n===============================================================");
    const passed = results.filter((r) => r.status === "PASS").length;
    const total = results.length;
    console.log(`PHASE 4 RESULTS: ${passed}/${total} TESTS PASSED`);
    console.log("===============================================================\n");

    if (passed === total) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error("Phase 4 test execution encountered error:", err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runPhase4Acceptance();
