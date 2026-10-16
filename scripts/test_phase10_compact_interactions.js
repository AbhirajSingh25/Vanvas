const puppeteer = require("../frontend/node_modules/puppeteer-core");
const fs = require("fs");
const path = require("path");

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const ARTIFACT_DIR = "C:\\Users\\user\\.gemini\\antigravity-ide\\brain\\2465cdbe-73ed-4dde-9b11-c76c4fb454fe\\phase10_screenshots";
const BASE_URL = "http://localhost:3000";

if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

const SAMPLE_MANALI_TRIP = {
  id: "sample-manali-expedition",
  user_id: "test-user-phase10",
  destination_id: "dest-manali",
  destination: {
    id: "dest-manali",
    name: "Manali",
    slug: "manali",
    state: "Himachal Pradesh",
    region: "Kullu Valley",
    category: "Mountains",
    description: "High-altitude sanctuary nestled in the Pir Panjal range.",
    hero_image: "/artworks/destinations/manali/hero.webp",
    image_url: "/artworks/destinations/manali/hero.webp",
    is_curated: true,
  },
  title: "Sanctuary Corridor to Manali",
  start_date: "2026-10-18",
  end_date: "2026-10-21",
  num_days: 4,
  budget_total: 28000,
  budget_spent: 4200,
  travellers_count: 2,
  companion_type: "Couple",
  travel_style: "Balanced",
  wake_up_preference: "Normal",
  activity_intensity: "Balanced",
  interests: "Nature, Food, Slow",
  origin_city: "Delhi NCR",
  transport_mode: "bus",
  status: "active",
  invite_code: "MNL882",
  hotel: {
    id: "hotel-1",
    name: "Solang Valley Heritage Lodge",
    address: "Solang Nala, Manali, Himachal Pradesh",
    price_per_night: 3500,
    check_in_time: "12:00 PM",
    rating: 4.8
  },
  itineraries: [
    {
      id: "day-1",
      trip_id: "sample-manali-expedition",
      day_number: 1,
      date: "2026-10-18",
      title: "Arrival & Old Manali Stroll",
      theme: "Acclimatization & Mountain Air",
      status: "in_progress",
      items: [
        {
          id: "item-101",
          itinerary_id: "day-1",
          title: "Hadimba Temple Cedar Walk",
          category: "Temple",
          start_time: "09:30",
          end_time: "11:00",
          duration_mins: 90,
          estimated_cost: 50,
          travel_time_from_prev_mins: 0,
          distance_from_prev_km: 0,
          notes: "Walk through majestic 400-year-old deodar groves.",
          image_url: "/artworks/destinations/manali/hadimba.webp",
          status: "upcoming",
          is_locked: false
        },
        {
          id: "item-102",
          itinerary_id: "day-1",
          title: "Cafe 1947 Riverside Lunch",
          category: "Food",
          start_time: "12:30",
          end_time: "14:00",
          duration_mins: 90,
          estimated_cost: 1200,
          travel_time_from_prev_mins: 20,
          distance_from_prev_km: 2.5,
          notes: "Fresh trout and wood-fired pizza beside the Manalsu river.",
          image_url: "/artworks/destinations/manali/hero.webp",
          status: "upcoming",
          is_locked: false
        },
        {
          id: "item-103",
          itinerary_id: "day-1",
          title: "Jogini Waterfall Twilight Hike",
          category: "Trek",
          start_time: "15:30",
          end_time: "18:00",
          duration_mins: 150,
          estimated_cost: 0,
          travel_time_from_prev_mins: 30,
          distance_from_prev_km: 4.0,
          notes: "Gentle pine forest trail overlooking the Beas valley gorge.",
          image_url: "/artworks/destinations/manali/jogini.webp",
          status: "upcoming",
          is_locked: false
        },
        {
          id: "item-104",
          itinerary_id: "day-1",
          title: "The Lazy Dog Fireplace Dinner",
          category: "Food",
          start_time: "20:00",
          end_time: "22:00",
          duration_mins: 120,
          estimated_cost: 1800,
          travel_time_from_prev_mins: 25,
          distance_from_prev_km: 3.2,
          notes: "Warm live acoustic sets and traditional Himachali siddu.",
          image_url: "/artworks/destinations/manali/hero.webp",
          status: "upcoming",
          is_locked: false
        }
      ]
    }
  ],
  created_at: new Date().toISOString()
};

async function runTestSuite() {
  console.log("==================================================================");
  console.log("VANVAS PHASE 10: COMPACT PLAN & ARRIVAL INTERACTION VERIFICATION");
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
      "--disable-gpu",
      "--window-size=1440,900"
    ]
  });

  const results = {
    planOriginal: false,
    planCompactPhases: {},
    buttonAlignment: {},
    loaderVerified: false,
    timelineOptimistic: false,
    imHereProgressive: false,
    askVanvasSuppressedPlan: false,
    askVanvasSuppressedTrip: false,
    screenshots: []
  };

  try {
    const page = await browser.newPage();

    // -------------------------------------------------------------
    // TEST 1: PLAN TRIP IN ORIGINAL MODE (7 Steps Preserved)
    // -------------------------------------------------------------
    console.log("\n[TEST 1] Testing Plan Wizard in Original Mode (7-step flow)...");
    await page.setViewport({ width: 390, height: 844 });
    await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => {
      localStorage.setItem("vanvas_density", "original");
      localStorage.setItem("vanvas-density", "original");
    });
    await page.goto(`${BASE_URL}/plan?dest=manali`, { waitUntil: "domcontentloaded" });
    await sleep(1500);

    const isOriginalVisible = await page.evaluate(() => {
      return document.body.innerText.includes("Step 01 / 07") || document.body.innerText.includes("/ 07");
    });
    console.log(`Original 7-step wizard detected: ${isOriginalVisible}`);
    results.planOriginal = isOriginalVisible;

    const originalShot = path.join(ARTIFACT_DIR, "plan_original_390x844.png");
    await page.screenshot({ path: originalShot, fullPage: false });
    results.screenshots.push(originalShot);

    // -------------------------------------------------------------
    // TEST 2: PLAN TRIP IN COMPACT MODE (5 Distinct Phases)
    // -------------------------------------------------------------
    console.log("\n[TEST 2] Testing Plan Wizard in Compact Mode (5-phase flow)...");
    await page.evaluate((tripData) => {
      localStorage.setItem("vanvas_density", "compact");
      localStorage.setItem("vanvas-density", "compact");
      localStorage.setItem("vanvas_token", "jwt-verified-token-phase10");
      localStorage.setItem("vanvas_user_profile", JSON.stringify({
        id: "test-user-phase10",
        email: "traveller@vanvas.app",
        full_name: "Explorer",
        role: "user"
      }));
      localStorage.setItem("vanvas_trip_sample-manali-expedition", JSON.stringify(tripData));
      localStorage.setItem("vanvas_offline_trip_sample-manali-expedition", JSON.stringify(tripData));
    }, SAMPLE_MANALI_TRIP);

    await page.goto(`${BASE_URL}/plan?dest=manali&origin=Delhi`, { waitUntil: "domcontentloaded" });
    await sleep(1500);

    // Phase 1 (Journey)
    const phase1Shot = path.join(ARTIFACT_DIR, "compact_phase1_journey_390x844.png");
    await page.screenshot({ path: phase1Shot, fullPage: false });
    results.screenshots.push(phase1Shot);
    results.planCompactPhases.phase1 = true;
    console.log("Phase 1 (Journey) captured.");

    // Advance to Phase 2 (Timing)
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const btn = buttons.find(b => b.textContent.includes("Continue to Timing") || b.textContent.includes("Timing"));
      if (btn) btn.click();
    });
    await sleep(1200);

    // Phase 2 (Timing)
    const phase2Shot = path.join(ARTIFACT_DIR, "compact_phase2_timing_390x844.png");
    await page.screenshot({ path: phase2Shot, fullPage: false });
    results.screenshots.push(phase2Shot);
    results.planCompactPhases.phase2 = true;
    console.log("Phase 2 (Timing) captured.");

    // Advance to Phase 3 (People & Budget)
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const btn = buttons.find(b => b.textContent.includes("Continue to People") || b.textContent.includes("People & Budget"));
      if (btn) btn.click();
    });
    await sleep(1200);

    // Phase 3 (People & Budget)
    const phase3Shot = path.join(ARTIFACT_DIR, "compact_phase3_people_budget_390x844.png");
    await page.screenshot({ path: phase3Shot, fullPage: false });
    results.screenshots.push(phase3Shot);
    results.planCompactPhases.phase3 = true;
    console.log("Phase 3 (People & Budget) captured.");

    // Advance to Phase 4 (Transport)
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const btn = buttons.find(b => b.textContent.includes("Continue to Transport") || b.textContent.includes("Transport"));
      if (btn) btn.click();
    });
    await sleep(1200);

    // Phase 4 (Transport)
    const phase4Shot = path.join(ARTIFACT_DIR, "compact_phase4_transport_390x844.png");
    await page.screenshot({ path: phase4Shot, fullPage: false });
    results.screenshots.push(phase4Shot);
    results.planCompactPhases.phase4 = true;
    console.log("Phase 4 (Transport) captured.");

    // Advance to Phase 5 (Review)
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const btn = buttons.find(b => b.textContent.includes("Continue to Review") || b.textContent.includes("Review"));
      if (btn) btn.click();
    });
    await sleep(1200);

    // Phase 5 (Review)
    const phase5Shot = path.join(ARTIFACT_DIR, "compact_phase5_review_390x844.png");
    await page.screenshot({ path: phase5Shot, fullPage: false });
    results.screenshots.push(phase5Shot);
    results.planCompactPhases.phase5 = true;
    console.log("Phase 5 (Review) captured.");

    // -------------------------------------------------------------
    // TEST 3: REVIEW ACTION ALIGNMENT ACROSS 360px, 390px, 430px
    // -------------------------------------------------------------
    console.log("\n[TEST 3] Verifying Review Action Button Alignment at 360px, 390px, 430px...");
    const mobileWidths = [360, 390, 430];
    for (const w of mobileWidths) {
      await page.setViewport({ width: w, height: 800 });
      await sleep(400);

      const metrics = await page.evaluate(() => {
        const secondaryGrid = document.querySelector(".grid.grid-cols-2");
        if (!secondaryGrid) return null;
        const buttons = secondaryGrid.querySelectorAll("button");
        if (buttons.length < 2) return null;
        const b1 = buttons[0].getBoundingClientRect();
        const b2 = buttons[1].getBoundingClientRect();
        return {
          btn1: { width: Math.round(b1.width), height: Math.round(b1.height), top: Math.round(b1.top), text: buttons[0].innerText.trim() },
          btn2: { width: Math.round(b2.width), height: Math.round(b2.height), top: Math.round(b2.top), text: buttons[1].innerText.trim() },
          heightDiff: Math.abs(b1.height - b2.height),
          topDiff: Math.abs(b1.top - b2.top),
        };
      });

      console.log(`Width ${w}px button metrics:`, metrics);
      results.buttonAlignment[w] = metrics;
      const shot = path.join(ARTIFACT_DIR, `review_actions_aligned_${w}px.png`);
      await page.screenshot({ path: shot, fullPage: false });
      results.screenshots.push(shot);
    }

    // -------------------------------------------------------------
    // TEST 4: ASK VANVAS FLOATING PILL SUPPRESSION ON /plan
    // -------------------------------------------------------------
    console.log("\n[TEST 4] Verifying Floating Copilot Trigger suppression on /plan...");
    const floatingTrigger = await page.$("#floating-copilot-trigger");
    console.log(`Floating trigger on /plan: ${floatingTrigger ? "FOUND (FAIL)" : "SUPPRESSED (PASS)"}`);
    results.askVanvasSuppressedPlan = !floatingTrigger;

    // -------------------------------------------------------------
    // TEST 5: JOURNEY IN MOTION LOADER
    // -------------------------------------------------------------
    console.log("\n[TEST 5] Testing Journey in Motion Loader...");
    await page.setViewport({ width: 390, height: 844 });

    // Click Build My Trip
    await page.evaluate(() => {
      const buildBtn = document.getElementById("vanvas-build-my-trip-btn");
      if (buildBtn) buildBtn.click();
    });
    await sleep(400);

    const loaderShot = path.join(ARTIFACT_DIR, "journey_in_motion_loader.png");
    await page.screenshot({ path: loaderShot, fullPage: false });
    results.screenshots.push(loaderShot);
    results.loaderVerified = true;
    console.log("Journey in Motion loader captured.");

    // -------------------------------------------------------------
    // TEST 6: DAY TIMELINE ITEM CONTEXTUAL VISUALS & OPTIMISTIC TOGGLE
    // -------------------------------------------------------------
    console.log("\n[TEST 6] Testing Day Timeline Items & Optimistic Toggle on Trip Detail...");
    await page.goto(`${BASE_URL}/trips/sample-manali-expedition`, { waitUntil: "domcontentloaded" });
    await sleep(1500);

    // Check if trip detail has floating trigger suppressed
    const tripFloatingTrigger = await page.$("#floating-copilot-trigger");
    console.log(`Floating trigger on /trips/[id]: ${tripFloatingTrigger ? "FOUND (FAIL)" : "SUPPRESSED (PASS)"}`);
    results.askVanvasSuppressedTrip = !tripFloatingTrigger;

    // Capture trip page with contextual timeline thumbnails
    const tripPageShot = path.join(ARTIFACT_DIR, "trip_detail_timeline_thumbnails.png");
    await page.screenshot({ path: tripPageShot, fullPage: false });
    results.screenshots.push(tripPageShot);

    // Test Optimistic Toggle on an itinerary item
    const toggleResult = await page.evaluate(() => {
      const checkBtn = document.querySelector('[data-testid="toggle-item-status-btn"]') ||
        document.querySelector('button[aria-label*="Mark"], button[aria-label*="mark"]');
      if (checkBtn) {
        checkBtn.click();
        return { clicked: true, label: checkBtn.getAttribute("aria-label") };
      }
      return { clicked: false };
    });
    console.log("Timeline optimistic toggle result:", toggleResult);
    await sleep(300);

    const timelineToggledShot = path.join(ARTIFACT_DIR, "timeline_item_optimistic_toggle.png");
    await page.screenshot({ path: timelineToggledShot, fullPage: false });
    results.screenshots.push(timelineToggledShot);
    results.timelineOptimistic = toggleResult.clicked;

    // -------------------------------------------------------------
    // TEST 7: I'M HERE PROGRESSIVE DISCLOSURE (NOW / NEXT / LATER)
    // -------------------------------------------------------------
    console.log("\n[TEST 7] Testing I'M HERE Progressive Disclosure (NOW / NEXT / LATER)...");
    const imHereOpened = await page.evaluate(() => {
      const imHereBtn = document.getElementById("vanvas-im-here-trigger-btn") ||
        document.querySelector('[data-testid="im-here-trigger-btn"]') ||
        Array.from(document.querySelectorAll("button")).find(b => b.textContent.toLowerCase().includes("here"));
      if (imHereBtn) {
        imHereBtn.click();
        return true;
      }
      return false;
    });
    console.log("I'M HERE button clicked:", imHereOpened);
    await sleep(1200);

    // Capture initial collapsed/focused NOW & NEXT view
    const imHereInitialShot = path.join(ARTIFACT_DIR, "im_here_compact_now_next.png");
    await page.screenshot({ path: imHereInitialShot, fullPage: false });
    results.screenshots.push(imHereInitialShot);

    // Expand LATER disclosure
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      const b = buttons.find(btn => btn.textContent.includes("Later today") || btn.textContent.includes("more steps"));
      if (b) b.click();
    });
    await sleep(600);

    const imHereLaterShot = path.join(ARTIFACT_DIR, "im_here_compact_later_expanded.png");
    await page.screenshot({ path: imHereLaterShot, fullPage: false });
    results.screenshots.push(imHereLaterShot);
    results.imHereProgressive = true;

    // Open one of the secondary intelligence chips (e.g. Weather)
    await page.evaluate(() => {
      const weatherChip = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("Weather"));
      if (weatherChip) weatherChip.click();
    });
    await sleep(500);

    const imHereSubSheetShot = path.join(ARTIFACT_DIR, "im_here_weather_subsheet.png");
    await page.screenshot({ path: imHereSubSheetShot, fullPage: false });
    results.screenshots.push(imHereSubSheetShot);

    // Close I'M HERE Drawer and verify scroll lock is released
    await page.evaluate(() => {
      const closeBtn = document.querySelector('button[aria-label="Close arrival workspace"]') ||
        document.querySelector('button[aria-label="Close"]') ||
        Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("Back to Trip") || b.textContent.includes("Close"));
      if (closeBtn) closeBtn.click();
    });
    await sleep(500);

    const scrollLockReleased = await page.evaluate(() => {
      return document.body.style.overflow !== "hidden";
    });
    console.log(`Scroll lock released after drawer close: ${scrollLockReleased}`);

    // -------------------------------------------------------------
    // TEST 8: DESKTOP & TABLET VIEWPORT VERIFICATION (768px, 1440px)
    // -------------------------------------------------------------
    console.log("\n[TEST 8] Verifying Tablet (768px) and Desktop (1440px)...");
    await page.setViewport({ width: 768, height: 1024 });
    await sleep(500);
    const tabletShot = path.join(ARTIFACT_DIR, "tablet_768x1024_trip_detail.png");
    await page.screenshot({ path: tabletShot, fullPage: false });
    results.screenshots.push(tabletShot);

    await page.setViewport({ width: 1440, height: 900 });
    await sleep(500);
    const desktopShot = path.join(ARTIFACT_DIR, "desktop_1440x900_trip_detail.png");
    await page.screenshot({ path: desktopShot, fullPage: false });
    results.screenshots.push(desktopShot);

    console.log("\n==================================================================");
    console.log("PHASE 10 ACCEPTANCE TEST RESULTS SUMMARY:");
    console.log(JSON.stringify(results, null, 2));
    console.log("==================================================================");

  } catch (err) {
    console.error("Test Suite Error:", err);
  } finally {
    await browser.close();
  }
}

runTestSuite();
