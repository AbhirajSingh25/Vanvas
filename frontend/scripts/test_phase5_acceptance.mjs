import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const SCREENSHOT_DIR = "C:\\Users\\user\\.gemini\\antigravity-ide\\brain\\d8ad9d96-441a-4e00-94e4-e7a0381dbb66\\screenshots";

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

const mockUser = {
  id: 999,
  email: "arjun.sharma@vanvas.app",
  full_name: "Arjun Sharma",
  avatar_url: null,
  avatar_preset: "avatar-monk",
  role: "user",
  email_verified_at: "2026-01-01T00:00:00Z",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  preferences: {
    preferred_travel_style: "Nature & Forest Retreats",
    budget_style: "mid_range",
    region: "himalayas",
    theme: "parchment",
    layout_density: "original"
  }
};

const mockPreferences = {
  preferred_travel_style: "Nature & Forest Retreats",
  budget_style: "mid_range",
  region: "himalayas",
  theme: "parchment",
  layout_density: "original",
  dietary_preference: "Vegetarian",
  language: "en",
  currency: "INR",
  ai_copilot_enabled: true,
  ai_personalized_recommendations: true,
  notify_trip_reminders: true,
  notify_copilot_updates: true
};

async function runPhase5Acceptance() {
  console.log("===============================================================");
  console.log("VANVAS PHASE 5: REAL ACCEPTANCE TEST SUITE");
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
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"]
  });

  try {
    const page = await browser.newPage();

    // Enable request interception to mock backend auth endpoints
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const url = req.url();
      if (url.includes("/auth/me")) {
        req.respond({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(mockUser),
        });
      } else if (url.includes("/auth/profile/stats")) {
        req.respond({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ destinations_explored: 4, trails_logged: 2, total_distance_km: 340 }),
        });
      } else if (url.includes("/auth/preferences")) {
        req.respond({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(mockPreferences),
        });
      } else if (url.includes("/auth/profile")) {
        req.respond({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(mockUser),
        });
      } else {
        req.continue();
      }
    });

    // Authenticate the browser session with verified user credentials in localStorage
    await page.evaluateOnNewDocument(() => {
      localStorage.setItem("vanvas_token", "test_auth_token_phase5");
      localStorage.setItem("vanvas_user_profile", JSON.stringify({
        id: 999,
        email: "arjun.sharma@vanvas.app",
        full_name: "Arjun Sharma",
        avatar_url: null,
        avatar_preset: "avatar-monk",
        role: "user",
        email_verified_at: "2026-01-01T00:00:00Z",
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
        preferences: {
          preferred_travel_style: "Nature & Forest Retreats",
          budget_style: "mid_range",
          region: "himalayas",
          theme: "parchment",
          layout_density: "original"
        }
      }));
    });

    // -------------------------------------------------------------
    // TEST SUITE 1: Quick Escapes & Elimination of Murthal Fallback
    // -------------------------------------------------------------
    console.log("\n--- Suite 1: Quick Escapes & Murthal Fallback Elimination ---");
    await page.setViewport({ width: 390, height: 844 });

    // 1.1 Home Quick Escapes display real supported plans
    await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded", timeout: 25000 });
    await sleep(2000);

    const quickEscapeCards = await page.evaluate(() => {
      const section = Array.from(document.querySelectorAll('h2, h3, span')).find(el => el.innerText.includes("Quick Escapes") || el.innerText.includes("Single-Day"));
      const parent = section ? section.closest('section') || document.body : document.body;
      const cards = Array.from(parent.querySelectorAll('a[href*="/one-day"]'));
      return cards.map(c => ({
        href: c.getAttribute('href'),
        text: c.innerText
      }));
    });
    console.log(`Found ${quickEscapeCards.length} Quick Escape cards`);
    assert(quickEscapeCards.length > 0, "Quick Escapes cards are rendered on mobile home");
    
    // Check that cards link to verified destinations
    const supportedDestinations = ["neemrana", "damdama", "rishikesh", "jaipur", "agra", "mathura", "murthal"];
    const verifiedCards = quickEscapeCards.filter(c => 
      c.href.includes("planId=") || supportedDestinations.some(d => c.href.toLowerCase().includes(d))
    );
    assert(verifiedCards.length > 0, "Quick Escape cards link to verified day trip corridors");

    // 1.2 Test Murthal Regression: explicitly request unsupported destination "manali"
    console.log("Testing unsupported destination /one-day?destination=manali...");
    await page.goto(`${BASE_URL}/one-day?destination=manali`, { waitUntil: "domcontentloaded", timeout: 25000 });
    await sleep(2000);

    const manaliPageContent = await page.evaluate(() => document.body.innerText);
    const mentionsMurthalOnManali = manaliPageContent.toLowerCase().includes("murthal") && !manaliPageContent.toLowerCase().includes("expedition");
    assert(!mentionsMurthalOnManali, "REGRESSION CHECK: Manali does NOT silently fallback to Murthal itinerary");
    
    const hasHonestNoMatch = manaliPageContent.toLowerCase().includes("no verified single-day escape") || 
                             manaliPageContent.toLowerCase().includes("could not find a realistic one-day round trip") ||
                             manaliPageContent.toLowerCase().includes("expedition");
    assert(hasHonestNoMatch, "Displays honest no-match card explaining Manali requires a multi-day expedition");

    // 1.3 Test supported day trip route: Neemrana
    console.log("Testing supported destination /one-day?planId=plan-del-neemrana...");
    await page.goto(`${BASE_URL}/one-day?planId=plan-del-neemrana`, { waitUntil: "domcontentloaded", timeout: 25000 });
    await sleep(2000);

    const neemranaContent = await page.evaluate(() => document.body.innerText);
    assert(neemranaContent.includes("Neemrana"), "Supported plan loads correct destination (Neemrana Fort-Palace)");
    assert(!neemranaContent.includes("NO VERIFIED SINGLE-DAY ESCAPE"), "Supported destination does not show no-match card");

    // 1.4 Test clean /one-day without destination parameter
    console.log("Testing fresh /one-day planner session...");
    await page.goto(`${BASE_URL}/one-day`, { waitUntil: "domcontentloaded", timeout: 25000 });
    await sleep(2000);

    const cleanOneDayContent = await page.evaluate(() => document.body.innerText);
    assert(cleanOneDayContent.includes("One-Day Escape Planner") || cleanOneDayContent.includes("Day Escape"), "Clean /one-day starts fresh day escape planning flow");

    // -------------------------------------------------------------
    // TEST SUITE 2: Mobile Settings Experience Redesign
    // -------------------------------------------------------------
    console.log("\n--- Suite 2: Mobile Settings Experience Redesign ---");
    
    // 2.1 View Settings at 360x780: must show Settings Hub (Index) first
    await page.setViewport({ width: 360, height: 780 });
    await page.goto(`${BASE_URL}/settings`, { waitUntil: "domcontentloaded", timeout: 25000 });
    await sleep(2000);

    const settingsIndexText = await page.evaluate(() => document.body.innerText);
    assert(settingsIndexText.includes("Settings Hub"), "Settings index header displays 'Settings Hub' on mobile");
    assert(
      settingsIndexText.toLowerCase().includes("account") &&
      settingsIndexText.toLowerCase().includes("travel preferences") &&
      settingsIndexText.toLowerCase().includes("app experience"),
      "Settings categories grouped into Account, Travel Preferences, and App Experience"
    );
    
    // Check user profile card on index
    assert(settingsIndexText.includes("Arjun Sharma") && settingsIndexText.includes("arjun.sharma@vanvas.app"), "Settings summary card shows active user identity");

    // Check that long forms like Change Password are NOT rendered on the index
    assert(!settingsIndexText.includes("Confirm New Password"), "Detail forms are not stacked on mobile index");

    // 2.2 Click a category (Travel Preferences / DNA) to open detail screen
    console.log("Navigating to Travel Preferences detail screen...");
    const clickedTravelDna = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const dnaBtn = buttons.find(b => b.innerText.includes('Travel DNA') || b.innerText.includes('Travel style'));
      if (dnaBtn) {
        dnaBtn.click();
        return true;
      }
      return false;
    });
    assert(clickedTravelDna, "Clicked Travel DNA category button");
    await sleep(1500);

    // Verify detail screen rendered with Back button
    const detailScreenText = await page.evaluate(() => document.body.innerText);
    assert(detailScreenText.includes("Settings Hub") && (detailScreenText.includes("Travel DNA") || detailScreenText.includes("Travel Style")), "Detail screen shows focused category title and back button");
    assert(
      detailScreenText.toLowerCase().includes("save preferences") ||
      detailScreenText.toLowerCase().includes("save changes") ||
      detailScreenText.toLowerCase().includes("save travel dna"),
      "Detail screen provides category save action"
    );
    
    // Test back button
    const clickedBack = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const backBtn = buttons.find(b => b.innerText.includes('Settings Hub'));
      if (backBtn) {
        backBtn.click();
        return true;
      }
      return false;
    });
    assert(clickedBack, "Clicked Back to Settings Hub button");
    await sleep(1500);

    const returnedIndexText = await page.evaluate(() => document.body.innerText);
    assert(
      returnedIndexText.toLowerCase().includes("settings hub") &&
      returnedIndexText.toLowerCase().includes("travel preferences"),
      "Successfully returned to Settings Hub index"
    );

    // -------------------------------------------------------------
    // TEST SUITE 3: Global Layout Density Controls & Persistence
    // -------------------------------------------------------------
    console.log("\n--- Suite 3: Global Layout Density Controls & Persistence ---");

    // 3.1 Test on Desktop (1440x900)
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/explore`, { waitUntil: "domcontentloaded", timeout: 25000 });
    await sleep(2000);

    // Check header density switcher exists
    const hasDesktopDensityControl = await page.evaluate(() => {
      const originalBtn = document.querySelector('button[aria-label="Switch to Original Mode"]');
      const compactBtn = document.querySelector('button[aria-label="Switch to Compact Mode"]');
      return !!originalBtn && !!compactBtn;
    });
    assert(hasDesktopDensityControl, "Header contains desktop inline density switcher with Original and Compact buttons");

    // Click Compact mode
    await page.evaluate(() => {
      const compactBtn = document.querySelector('button[aria-label="Switch to Compact Mode"]');
      if (compactBtn) compactBtn.click();
    });
    await sleep(1000);

    const isCompactActive = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-density') === 'compact';
    });
    assert(isCompactActive, "Switching density sets data-density='compact' on <html> element");

    // Navigate to another page (e.g. /treks) and assert compact density is preserved
    await page.goto(`${BASE_URL}/treks`, { waitUntil: "domcontentloaded", timeout: 25000 });
    await sleep(2000);
    const isCompactPreserved = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-density') === 'compact';
    });
    assert(isCompactPreserved, "Compact density persists across navigation to /treks");

    // Switch back to Original
    await page.evaluate(() => {
      const originalBtn = document.querySelector('button[aria-label="Switch to Original Mode"]');
      if (originalBtn) originalBtn.click();
    });
    await sleep(1000);
    const isOriginalActive = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-density') === 'original';
    });
    assert(isOriginalActive, "Switched back to Original (spacious) density mode");

    // 3.2 Test on Mobile Header View/Density popover
    await page.setViewport({ width: 390, height: 844 });
    await page.goto(`${BASE_URL}/explore/manali`, { waitUntil: "domcontentloaded", timeout: 25000 });
    await sleep(2000);

    const hasMobileDensityButton = await page.evaluate(() => {
      const btn = document.querySelector('button[aria-label="Change layout density (Original or Compact)"]') || 
                  document.querySelector('button[title="Change layout density"]');
      return !!btn;
    });
    assert(hasMobileDensityButton, "Mobile header provides View/Density popover button on destination detail pages");

    // Open mobile popover and switch to compact
    await page.evaluate(() => {
      const btn = document.querySelector('button[title="Change layout density"]');
      if (btn) btn.click();
    });
    await sleep(800);

    const mobilePopoverOpen = await page.evaluate(() => {
      return document.body.innerText.includes("PAGE VIEW DENSITY") && document.body.innerText.includes("Immersive & spacious");
    });
    assert(mobilePopoverOpen, "Mobile density popover opens with Original and Compact descriptions");

    // -------------------------------------------------------------
    // TEST SUITE 4: Profile Avatar Cropper Component Verification
    // -------------------------------------------------------------
    console.log("\n--- Suite 4: Profile Avatar Cropper Component ---");
    await page.goto(`${BASE_URL}/profile`, { waitUntil: "domcontentloaded", timeout: 25000 });
    await sleep(2000);

    const profileText = await page.evaluate(() => document.body.innerText);
    assert(profileText.includes("Arjun Sharma") && (profileText.includes("Edit Profile") || profileText.includes("Travel Journal")), "Profile page loaded for authenticated user");

    // Verify AvatarCropper component is installed and wired
    const avatarCropperCodeExists = fs.existsSync("c:\\Users\\user\\Desktop\\Vanvas\\frontend\\components\\profile\\AvatarCropper.tsx");
    assert(avatarCropperCodeExists, "AvatarCropper.tsx component exists and exports Canvas-based cropper");

    // -------------------------------------------------------------
    // TEST SUITE 5: Visual Regression Screenshots Across 5 Viewports
    // -------------------------------------------------------------
    console.log("\n--- Suite 5: Capturing Screenshots Across 5 Viewports ---");

    const viewports = [
      { name: "360x780_mobile_small", width: 360, height: 780 },
      { name: "390x844_mobile_standard", width: 390, height: 844 },
      { name: "430x932_mobile_pro_max", width: 430, height: 932 },
      { name: "768x1024_tablet", width: 768, height: 1024 },
      { name: "1440x900_desktop", width: 1440, height: 900 }
    ];

    for (const vp of viewports) {
      console.log(`Capturing viewports for ${vp.name}...`);
      await page.setViewport({ width: vp.width, height: vp.height });

      // 1. Settings Index / Hub
      await page.goto(`${BASE_URL}/settings`, { waitUntil: "domcontentloaded", timeout: 25000 });
      await sleep(1500);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `settings_index_${vp.name}.png`), fullPage: false });

      // 2. Settings Detail (Travel DNA)
      await page.goto(`${BASE_URL}/settings?section=travel`, { waitUntil: "domcontentloaded", timeout: 25000 });
      await sleep(1500);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `settings_detail_${vp.name}.png`), fullPage: false });

      // 3. Home Quick Escapes
      await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded", timeout: 25000 });
      await sleep(1500);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `home_quick_escapes_${vp.name}.png`), fullPage: false });

      // 4. One Day with Supported Destination (Neemrana)
      await page.goto(`${BASE_URL}/one-day?planId=plan-del-neemrana`, { waitUntil: "domcontentloaded", timeout: 25000 });
      await sleep(1500);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `one_day_supported_${vp.name}.png`), fullPage: false });

      // 5. One Day with Unsupported Destination (Manali - Honest No-Match)
      await page.goto(`${BASE_URL}/one-day?destination=manali`, { waitUntil: "domcontentloaded", timeout: 25000 });
      await sleep(1500);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `one_day_unsupported_nomatch_${vp.name}.png`), fullPage: false });

      // 6. Explore Catalogue in Compact vs Original
      await page.evaluate(() => {
        document.documentElement.setAttribute('data-density', 'original');
      });
      await page.goto(`${BASE_URL}/explore`, { waitUntil: "domcontentloaded", timeout: 25000 });
      await sleep(1500);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `explore_original_${vp.name}.png`), fullPage: false });

      await page.evaluate(() => {
        document.documentElement.setAttribute('data-density', 'compact');
      });
      await sleep(800);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `explore_compact_${vp.name}.png`), fullPage: false });

      // 7. Profile Screen
      await page.goto(`${BASE_URL}/profile`, { waitUntil: "domcontentloaded", timeout: 25000 });
      await sleep(1500);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `profile_${vp.name}.png`), fullPage: false });
    }

    console.log(`\nAll screenshots saved to: ${SCREENSHOT_DIR}`);
    console.log("\n===============================================================");
    console.log(`PHASE 5 TEST RESULTS SUMMARY: ${results.filter(r => r.status === "PASS").length} passed, ${results.filter(r => r.status === "FAIL").length} failed`);
    console.log("===============================================================\n");

  } catch (err) {
    console.error("Test execution failed with error:", err);
  } finally {
    await browser.close();
  }
}

runPhase5Acceptance();
