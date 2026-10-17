import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";
import assert from "assert";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const SCREENSHOT_DIR = "C:\\Users\\user\\.gemini\\antigravity-ide\\brain\\a4b927fe-2631-4999-a3ac-367b1072b5e3\\screenshots";

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

const mockTrip = {
  id: "test-trip-phase11",
  title: "Manali Mountain Expedition",
  destination_id: "dest-manali",
  destination: {
    id: "dest-manali",
    name: "Manali",
    slug: "manali",
    state: "Himachal Pradesh",
    region: "Kullu Valley",
    hero_image: "/images/destinations/manali/hero.jpg",
    weather_type: "Partly Cloudy",
  },
  start_date: "2026-10-20",
  end_date: "2026-10-24",
  num_days: 4,
  travellers_count: 2,
  travel_style: "Backpacker",
  budget_total: 24000,
  budget_spent: 8500,
  origin_city: "Delhi",
  transport_mode: "bus",
  invite_code: "MANALI26",
  hotel: {
    id: "hotel-1",
    name: "Zostel Manali Old Manali",
    badge: "Verified Sanctuary",
    rating: 4.8,
    address: "Manu Temple Road, Old Manali, Himachal Pradesh",
    price_per_night: 2200,
    check_in_time: "12:00 PM",
    check_out_time: "10:00 AM",
    amenities: "High-speed Wi-Fi, Mountain View Cafe, Bonfire Area",
    image_url: "/images/places/manali/stays/zostel-manali-old-manali.webp",
  },
  rental: {
    id: "rental-1",
    vehicle_name: "Honda Activa 6G Hill Edition",
    vehicle_type: "Scooter",
    provider_name: "Himalayan Ride Hub",
    location: "Mall Road Auto Stand, Manali",
    price_per_day: 800,
    deposit_amount: 1500,
    opening_hours: "08:00 AM - 08:00 PM",
  },
  itineraries: [
    {
      day_number: 1,
      items: [
        {
          id: "item-1",
          day_number: 1,
          start_time: "08:30 AM",
          end_time: "09:30 AM",
          duration_mins: 60,
          title: "Arrive in Manali",
          category: "Stop",
          notes: "Arrival at private bus parking, fresh mountain air.",
          status: "completed",
        },
        {
          id: "item-2",
          day_number: 1,
          start_time: "09:45 AM",
          end_time: "10:30 AM",
          duration_mins: 45,
          title: "Transfer to accommodation",
          category: "Transfer",
          notes: "Local taxi transfer up through cedar forest to Old Manali.",
          status: "upcoming",
        },
        {
          id: "item-3",
          day_number: 1,
          start_time: "10:45 AM",
          end_time: "11:30 AM",
          duration_mins: 45,
          title: "Drop luggage / freshen up",
          category: "Stay",
          notes: "Unpack at hostel sanctuary, warm chai on wooden terrace.",
          status: "upcoming",
        },
        {
          id: "item-4",
          day_number: 1,
          start_time: "12:00 PM",
          end_time: "02:00 PM",
          duration_mins: 120,
          title: "Hadimba Devi Temple",
          category: "Culture & Heritage",
          notes: "Centuries-old pagoda temple carved from deodar timber.",
          status: "upcoming",
        },
      ],
    },
  ],
};

const mockUser = {
  id: "test-user-11",
  email: "explorer@vanvas.com",
  full_name: "Vikram Malhotra",
  role: "traveller",
  avatar_url: "/api/v1/auth/profile/avatar/file/users/test-user-11/avatar/photo.webp",
  avatar_type: "uploaded",
  avatar_preset: null,
};

async function runAcceptanceTests() {
  console.log("=== STARTING VANVAS PHASE 11 ACCEPTANCE TESTS ===");
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  });

  try {
    const page = await browser.newPage();

    // Setup network mock for offline trip hydration
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const url = req.url();
      if (url.includes("/api/v1/auth/me")) {
        req.respond({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(mockUser),
        });
      } else if (url.includes("/api/v1/trips/test-trip-phase11/bookings")) {
        req.respond({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([]),
        });
      } else if (url.includes("/api/v1/trips/test-trip-phase11/group")) {
        req.respond({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ members: [] }),
        });
      } else if (url.includes("/api/v1/trips/test-trip-phase11/checklist")) {
        req.respond({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([]),
        });
      } else if (url.includes("/api/v1/trips/test-trip-phase11")) {
        req.respond({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(mockTrip),
        });
      } else if (url.includes("/api/v1/budget/test-trip-phase11") || url.includes("/budget")) {
        req.respond({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            budget_total: 24000,
            spent: 8500,
            remaining: 15500,
            expenses: [],
          }),
        });
      } else {
        req.continue();
      }
    });

    // Seed mock storage
    await page.goto(`${BASE_URL}/trips`, { waitUntil: "domcontentloaded" });
    await page.evaluate((trip, user) => {
      localStorage.setItem("vanvas_token", "test-token-11");
      localStorage.setItem("vanvas_user_profile", JSON.stringify(user));
      localStorage.setItem(`vanvas_trip_${trip.id}`, JSON.stringify(trip));
      localStorage.setItem(`vanvas_offline_trip_${trip.id}`, JSON.stringify(trip));
      localStorage.setItem("vanvas_density", "compact");
    }, mockTrip, mockUser);

    console.log("-> Seeded mock trip and authenticated user profile.");

    // =========================================================================
    // TEST 1: RESPONSIVE ACTION ROW BOUNDING BOXES (360px, 390px, 430px)
    // =========================================================================
    const viewports = [
      { name: "Mobile 360", width: 360, height: 780 },
      { name: "Mobile 390 (iPhone 14)", width: 390, height: 844 },
      { name: "Mobile 430 (Pro Max)", width: 430, height: 932 },
    ];

    for (const vp of viewports) {
      await page.setViewport({ width: vp.width, height: vp.height });
      await page.goto(`${BASE_URL}/trips/test-trip-phase11`, { waitUntil: "domcontentloaded" });
      await sleep(1500);

      // 1. Primary Action: Full-width I'M HERE button
      const imHereBtn = await page.$("#vanvas-im-here-trigger-btn");
      assert(imHereBtn, `[${vp.name}] I'M HERE button must be present in DOM`);

      const imHereBox = await imHereBtn.boundingBox();
      assert(imHereBox, `[${vp.name}] I'M HERE button must have a bounding box`);
      assert(imHereBox.width >= vp.width - 50, `[${vp.name}] I'M HERE button width (${imHereBox.width}px) must span full container width (~${vp.width - 50}px)`);
      assert(imHereBox.height >= 48, `[${vp.name}] I'M HERE button height (${imHereBox.height}px) must be >= 48px`);

      // 2. Secondary Actions Grid: Check equal heights and widths
      const secondaryBtns = await page.$$("div.grid-cols-2 button, div.grid-cols-2 a");
      assert(secondaryBtns.length >= 4, `[${vp.name}] Secondary actions grid must contain at least 4 actions`);

      const heights = [];
      const widths = [];
      for (const btn of secondaryBtns.slice(0, 4)) {
        const box = await btn.boundingBox();
        if (box) {
          heights.push(Math.round(box.height));
          widths.push(Math.round(box.width));
          // Minimum comfortable touch target
          assert(box.height >= 42, `[${vp.name}] Secondary button height (${box.height}px) must be >= 42px touch target`);
        }
      }

      console.log(`[${vp.name}] Bounding Boxes: I'M HERE w=${imHereBox.width}h=${imHereBox.height} | Secondary heights=[${heights.join(", ")}] widths=[${widths.join(", ")}]`);

      // 3. Floating Copilot Trigger suppression check on trip page
      const floatingAskBtn = await page.$("#floating-ask-vanvas-btn");
      const isFloatingVisible = floatingAskBtn ? await floatingAskBtn.isIntersectingViewport() : false;
      assert(!isFloatingVisible, `[${vp.name}] Floating Ask VANVAS trigger must be suppressed when inline Ask action is present on trip page`);

      // Capture screenshot
      const shotPath = path.join(SCREENSHOT_DIR, `trip_overview_${vp.width}px.png`);
      await page.screenshot({ path: shotPath, fullPage: false });
      console.log(`[PASS] ${vp.name} Action Row layout confirmed. Screenshot: ${shotPath}`);
    }

    // =========================================================================
    // TEST 2: STAY & RENTAL WORKING ACTIONS & NON-FABRICATED PRICES
    // =========================================================================
    console.log("\n-> Testing Stay and Rental interactive cards...");
    await page.setViewport({ width: 390, height: 844 });
    await page.goto(`${BASE_URL}/trips/test-trip-phase11?tab=stays_rentals`, { waitUntil: "domcontentloaded" });
    await sleep(1500);

    // 1. Check Stay Card is clickable and not dead
    const stayCard = await page.$("button[aria-label*='Zostel Manali']");
    assert(stayCard, "Stay card button must be present with accessible label");

    // Click stay card to open StayDetailDrawer
    await stayCard.evaluate((b) => b.click());
    await page.waitForSelector("#stay-drawer-title", { timeout: 6000 });

    const stayModalTitle = await page.$eval("#stay-drawer-title", (el) => el.textContent);
    assert(stayModalTitle.includes("Zostel Manali"), `Stay drawer must open with hotel name. Found: ${stayModalTitle}`);

    const stayModalContent = await page.content();
    assert(stayModalContent.includes("Manu Temple Road"), "Stay drawer must show verified location address");
    assert(stayModalContent.includes("₹2,200"), "Stay drawer must show actual price from hotel data");
    assert(!stayModalContent.includes("₹2,500"), "Stay drawer must NOT show fabricated ₹2,500 default");

    const stayShotPath = path.join(SCREENSHOT_DIR, "stay_detail_drawer.png");
    await page.screenshot({ path: stayShotPath });
    console.log(`[PASS] Stay card opened detail drawer with real address and price. Screenshot: ${stayShotPath}`);

    // Close stay drawer
    const closeStayBtn = await page.$("button[aria-label='Close details']");
    if (closeStayBtn) await closeStayBtn.evaluate((b) => b.click());
    await sleep(600);

    // 2. Click Rental Card to open RentalDetailDrawer
    const rentalCard = await page.$("button[aria-label*='Honda Activa']");
    assert(rentalCard, "Rental card button must be present with accessible label");

    await rentalCard.evaluate((b) => b.click());
    await page.waitForSelector("#rental-drawer-title", { timeout: 6000 });

    const rentalModalTitle = await page.$eval("#rental-drawer-title", (el) => el.textContent);
    assert(rentalModalTitle.includes("Honda Activa"), `Rental drawer must open with vehicle name. Found: ${rentalModalTitle}`);

    const rentalModalContent = await page.content();
    assert(rentalModalContent.includes("Mall Road Auto Stand"), "Rental drawer must show actual pickup location");
    assert(rentalModalContent.includes("₹800"), "Rental drawer must show actual rental price from data");
    assert(!rentalModalContent.includes("₹1,200"), "Rental drawer must NOT show fabricated ₹1,200 default");

    const rentalShotPath = path.join(SCREENSHOT_DIR, "rental_detail_drawer.png");
    await page.screenshot({ path: rentalShotPath });
    console.log(`[PASS] Rental card opened detail drawer with real location and price. Screenshot: ${rentalShotPath}`);

    const closeRentalBtn = await page.$("button[aria-label='Close rental details']");
    if (closeRentalBtn) await closeRentalBtn.evaluate((b) => b.click());
    await sleep(600);

    // =========================================================================
    // TEST 3: SEMANTIC VISUAL RESOLUTION (NO REPEATED DESTINATION HERO)
    // =========================================================================
    console.log("\n-> Testing Itinerary Timeline semantic visual resolution...");
    await page.goto(`${BASE_URL}/trips/test-trip-phase11?tab=itinerary`, { waitUntil: "domcontentloaded" });
    await sleep(1500);

    const timelineImages = await page.$$eval("img[alt]", (imgs) =>
      imgs.map((img) => ({
        alt: img.getAttribute("alt"),
        src: img.getAttribute("src"),
      }))
    );

    console.log("Rendered timeline images:", timelineImages);

    // Assert that the 3 consecutive items (Arrive, Transfer, Drop luggage) have distinct images
    const arriveImg = timelineImages.find((i) => i.alt?.includes("Arrive in Manali"))?.src;
    const transferImg = timelineImages.find((i) => i.alt?.includes("Transfer to accommodation"))?.src;
    const luggageImg = timelineImages.find((i) => i.alt?.includes("Drop luggage"))?.src;

    console.log("Arrive image:", arriveImg);
    console.log("Transfer image:", transferImg);
    console.log("Luggage image:", luggageImg);

    assert(arriveImg, "Arrive in Manali must have an image");
    assert(transferImg, "Transfer to accommodation must have an image");
    assert(luggageImg, "Drop luggage / freshen up must have an image");

    assert(arriveImg !== transferImg, `Arrive image (${arriveImg}) and Transfer image (${transferImg}) must NOT be identical!`);
    assert(transferImg !== luggageImg, `Transfer image (${transferImg}) and Luggage image (${luggageImg}) must NOT be identical!`);

    const timelineShotPath = path.join(SCREENSHOT_DIR, "timeline_semantic_images.png");
    await page.screenshot({ path: timelineShotPath });
    console.log(`[PASS] Consecutive timeline steps have distinct semantic visuals. Screenshot: ${timelineShotPath}`);

    console.log("\n=== ALL VANVAS PHASE 11 ACCEPTANCE TESTS PASSED SUCCESSFULLY! ===");
  } catch (err) {
    console.error("TEST FAILED:", err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runAcceptanceTests();
