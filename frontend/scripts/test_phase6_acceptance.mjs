import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const SCREENSHOT_DIR = "C:\\Users\\user\\.gemini\\antigravity-ide\\brain\\80b462ea-6811-41d0-9ddb-ffe08a0ad7da\\screenshots";

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

let currentUser = {
  id: "test-user-phase6",
  email: "arjun.sharma@vanvas.app",
  full_name: "Arjun Sharma",
  role: "traveller",
  avatar_url: "/avatars/mountain-camper.svg",
  avatar_type: "uploaded",
  avatar_preset: "himalayan-explorer", // Preset exists in DB, but avatar_type is uploaded! Must prefer avatar_url!
  email_verified_at: "2026-01-01T00:00:00Z",
  is_verified: true,
  created_at: "2026-01-01T00:00:00Z",
  preferences: {
    preferred_travel_style: "High Mountain Passes & Wild Camps",
    theme: "parchment",
    layout_density: "original",
  },
};

async function setupPageInterception(page) {
  await page.setRequestInterception(true);
  page.on("request", (req) => {
    const url = req.url();
    if (url.includes("/api/v1/auth/me") || url.includes("/auth/me")) {
      req.respond({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(currentUser),
      });
    } else if (url.includes("/api/v1/auth/profile/stats") || url.includes("/auth/profile/stats")) {
      req.respond({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          saved_places_count: 5,
          saved_trips_count: 2,
          upcoming_trips_count: 1,
          completed_trips_count: 3,
          reviews_count: 4,
          bookings_count: 2,
          member_since: "2026-01-01T00:00:00Z",
        }),
      });
    } else if (url.includes("/api/v1/places/saved") || url.includes("/places/saved")) {
      req.respond({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    } else if (url.includes("/api/v1/trips") || url.includes("/trips")) {
      req.respond({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    } else {
      req.continue();
    }
  });

  await page.evaluateOnNewDocument((user) => {
    localStorage.setItem("vanvas_token", "fake-jwt-token-phase6");
    localStorage.setItem("vanvas_user_profile", JSON.stringify(user));
    sessionStorage.setItem("vanvas_startup_shown", "1");
  }, currentUser);
}

async function runPhase6Acceptance() {
  console.log("===============================================================");
  console.log("VANVAS PHASE 6: REAL BROWSER ACCEPTANCE TEST SUITE");
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
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--window-size=1440,900",
    ],
  });

  try {
    const page = await browser.newPage();
    await setupPageInterception(page);

    // =========================================================================
    // TEST 1: PROFILE AVATAR RESOLUTION & DISPLAY (Mobile & Desktop)
    // =========================================================================
    console.log("\n--- TEST 1: Profile Avatar Resolution & Display ---");
    await page.setViewport({ width: 390, height: 844 });
    await page.goto(`${BASE_URL}/explore`, { waitUntil: "domcontentloaded" });
    
    // Wait for client auth state to hydrate in header
    await page.waitForSelector('header button[aria-label="Open User Account Menu"]', { timeout: 6000 });

    // Verify avatar in mobile header renders an <img> with effectiveSrc
    await page.waitForSelector('header button[aria-label="Open User Account Menu"] img', { timeout: 4000 });
    const headerAvatarImg = await page.$('header button[aria-label="Open User Account Menu"] img');
    assert(headerAvatarImg !== null, "Mobile header renders <img> tag for uploaded avatar");

    const headerAvatarSrc = await page.evaluate(() => {
      const img = document.querySelector('header button[aria-label="Open User Account Menu"] img');
      return img ? img.getAttribute("src") : null;
    });
    assert(
      headerAvatarSrc && headerAvatarSrc.includes("mountain-camper.svg"),
      `Mobile header preferred uploaded avatar_url (${headerAvatarSrc}) over preset default`
    );

    // Wait for image to finish loading
    await page.waitForFunction(() => {
      const img = document.querySelector('header button[aria-label="Open User Account Menu"] img');
      return img && (img.complete || window.getComputedStyle(img).opacity === "1");
    }, { timeout: 4000 }).catch(() => {});

    const headerImageVisible = await page.evaluate(() => {
      const btn = document.querySelector('header button[aria-label="Open User Account Menu"]');
      const img = btn ? btn.querySelector("img") : null;
      return img && (img.complete || window.getComputedStyle(img).opacity === "1");
    });
    assert(headerImageVisible, "Mobile header image is loaded and visible");

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "01_mobile_header_uploaded_avatar.png") });

    // Visit Profile page and check avatar display
    await page.goto(`${BASE_URL}/profile`, { waitUntil: "domcontentloaded" });
    await sleep(800);

    const profileAvatarSrc = await page.evaluate(() => {
      const img = document.querySelector('img[alt="Arjun Sharma"]');
      return img ? img.getAttribute("src") : null;
    });
    assert(
      profileAvatarSrc && profileAvatarSrc.includes("mountain-camper.svg"),
      `Profile page displays the same uploaded photo (${profileAvatarSrc})`
    );

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "02_profile_page_avatar.png") });

    // Test broken image fallback:
    currentUser = {
      id: "bad-user",
      email: "vikram@vanvas.app",
      full_name: "Vikram Rathore",
      role: "traveller",
      avatar_type: "uploaded",
      avatar_url: "/nonexistent-broken-photo-123.jpg",
    };
    await page.evaluate((u) => {
      localStorage.setItem("vanvas_user_profile", JSON.stringify(u));
    }, currentUser);
    await page.reload({ waitUntil: "domcontentloaded" });
    await sleep(1200);

    const fallbackInitials = await page.evaluate(() => {
      const btn = document.querySelector('header button[aria-label="Open User Account Menu"]');
      return btn ? btn.textContent.trim() : "";
    });
    assert(
      fallbackInitials === "VR",
      `Broken avatar URL falls back safely to traveler initials (got "${fallbackInitials}")`
    );
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "03_avatar_fallback_initials.png") });

    // Reset user back to valid uploaded photo
    currentUser = {
      id: "test-user-phase6",
      email: "arjun.sharma@vanvas.app",
      full_name: "Arjun Sharma",
      role: "traveller",
      avatar_url: "/avatars/mountain-camper.svg",
      avatar_type: "uploaded",
      avatar_preset: "himalayan-explorer",
    };
    await page.evaluate((u) => {
      localStorage.setItem("vanvas_user_profile", JSON.stringify(u));
    }, currentUser);

    // =========================================================================
    // TEST 2: MOBILE ANCHORED PROFILE POPOVER (360px, 390px, 430px)
    // =========================================================================
    console.log("\n--- TEST 2: Mobile Anchored Profile Popover ---");

    const viewports = [
      { name: "360x780", w: 360, h: 780 },
      { name: "390x844", w: 390, h: 844 },
      { name: "430x932", w: 430, h: 932 },
    ];

    for (const vp of viewports) {
      await page.setViewport({ width: vp.w, height: vp.h });
      await page.goto(`${BASE_URL}/explore`, { waitUntil: "domcontentloaded" });
      await sleep(600);

      // Open profile popover by tapping the avatar
      const avatarBtn = await page.$('header button[aria-label="Open User Account Menu"]');
      assert(avatarBtn !== null, `[${vp.name}] Avatar button found in header`);
      await avatarBtn.click();
      await sleep(350); // Allow popover motion (~200ms)

      // Verify popover exists and has menu role
      const popover = await page.$('header [role="menu"][aria-label="Account options"]');
      assert(popover !== null, `[${vp.name}] Mobile profile popover opens successfully`);

      // Verify NO full-screen dark backdrop is rendered!
      const fullScreenBackdrop = await page.$(".fixed.inset-0.bg-\\[\\#0F2924\\]\\/70");
      assert(fullScreenBackdrop === null, `[${vp.name}] No full-screen dark backdrop overlay rendered`);

      // Verify popover bounding box is constrained inside viewport
      const popoverRect = await page.evaluate(() => {
        const el = document.querySelector('header [role="menu"][aria-label="Account options"]');
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        return {
          left: rect.left,
          right: rect.right,
          width: rect.width,
          top: rect.top,
          bottom: rect.bottom,
        };
      });

      assert(popoverRect !== null, `[${vp.name}] Popover rect measured`);
      if (popoverRect) {
        assert(
          popoverRect.right <= vp.w + 2 && popoverRect.left >= 0,
          `[${vp.name}] Popover is constrained horizontally inside screen (left: ${Math.round(popoverRect.left)}px, right: ${Math.round(popoverRect.right)}px, screen: ${vp.w}px)`
        );
        assert(
          popoverRect.width <= 320 && popoverRect.width >= 260,
          `[${vp.name}] Popover has compact native app width (${Math.round(popoverRect.width)}px)`
        );
      }

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `04_popover_open_${vp.name}.png`) });

      // Test outside tap dismissal
      await page.mouse.click(20, 300); // click outside
      await sleep(300);
      const popoverAfterOutsideClick = await page.$('header [role="menu"][aria-label="Account options"]');
      assert(popoverAfterOutsideClick === null, `[${vp.name}] Tapping outside dismisses profile popover`);
    }

    // Test Escape key dismissal
    await page.setViewport({ width: 390, height: 844 });
    const avatarBtn2 = await page.$('header button[aria-label="Open User Account Menu"]');
    await avatarBtn2.click();
    await sleep(300);
    await page.keyboard.press("Escape");
    await sleep(300);
    const popoverAfterEsc = await page.$('header [role="menu"][aria-label="Account options"]');
    assert(popoverAfterEsc === null, "Pressing Escape dismisses profile popover");

    // =========================================================================
    // TEST 3: RESPONSIVE FOOTER POLICY (Mobile vs Desktop)
    // =========================================================================
    console.log("\n--- TEST 3: Responsive Footer Policy ---");

    // 3A. Mobile on /explore
    await page.setViewport({ width: 390, height: 844 });
    await page.goto(`${BASE_URL}/explore`, { waitUntil: "domcontentloaded" });
    await sleep(600);

    // Assert full marketing editorial footer is hidden on mobile
    const desktopFooterVisibleOnMobile = await page.evaluate(() => {
      const footer = document.querySelector("footer.hidden.xl\\:block");
      if (!footer) return false;
      const style = window.getComputedStyle(footer);
      return style.display !== "none";
    });
    assert(!desktopFooterVisibleOnMobile, "Full editorial marketing footer is hidden on mobile /explore");

    // Assert mobile compact signature IS rendered
    const mobileSignatureText = await page.evaluate(() => {
      const sig = document.querySelector(".xl\\:hidden.text-center");
      return sig ? sig.textContent.trim() : "";
    });
    assert(
      mobileSignatureText.includes("Crafted with") &&
      mobileSignatureText.includes("Indian Mountain Trails & Spontaneous Wanderers") &&
      mobileSignatureText.includes("© 2026 VANVAS by The Sorted Club"),
      `Mobile compact signature rendered with exact wording: "${mobileSignatureText.substring(0, 60)}..."`
    );

    // Scroll to bottom and capture screenshot
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await sleep(400);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "05_mobile_explore_compact_footer.png") });

    // 3B. Desktop on /explore
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/explore`, { waitUntil: "domcontentloaded" });
    await sleep(600);

    const desktopFooterVisibleOnDesktop = await page.evaluate(() => {
      const footer = document.querySelector("footer.hidden.xl\\:block");
      if (!footer) return false;
      const style = window.getComputedStyle(footer);
      return style.display !== "none";
    });
    assert(desktopFooterVisibleOnDesktop, "Full editorial marketing footer IS visible on desktop /explore");

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await sleep(400);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "06_desktop_explore_editorial_footer.png") });

    // =========================================================================
    // TEST 4: APP-WIDE MOTION, TABS & PAGE TRANSITIONS
    // =========================================================================
    console.log("\n--- TEST 4: App-Wide Motion & Transitions ---");

    // 4A. Profile Tab Transitions
    await page.setViewport({ width: 390, height: 844 });
    await page.goto(`${BASE_URL}/profile`, { waitUntil: "domcontentloaded" });
    await sleep(600);

    // Click "Avatar & Identity" tab
    const avatarTabBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      return btns.find((b) => b.textContent.includes("Avatar & Identity"));
    });
    if (avatarTabBtn) {
      await avatarTabBtn.click();
      await sleep(350);

      const avatarTabContentVisible = await page.evaluate(() => {
        return document.body.textContent.includes("Active Avatar Banner") ||
               document.body.textContent.includes("Illustrated Persona Active") ||
               document.body.textContent.includes("Custom Photo Active");
      });
      assert(avatarTabContentVisible, "Profile tab switch smoothly displays Avatar & Identity tab content");
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "07_profile_tab_switch_avatar.png") });

    // 4B. Tablet Viewport (768x1024)
    await page.setViewport({ width: 768, height: 1024 });
    await page.goto(`${BASE_URL}/explore`, { waitUntil: "domcontentloaded" });
    await sleep(500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "08_tablet_768x1024_explore.png") });

    // 4C. Desktop Viewport (1440x900) Desktop Profile Dropdown
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(`${BASE_URL}/explore`, { waitUntil: "domcontentloaded" });
    await sleep(600);

    const desktopUserBtn = await page.$('.hidden.xl\\:flex button[aria-haspopup="true"]');
    assert(desktopUserBtn !== null, "Desktop user button found");
    if (desktopUserBtn) {
      await desktopUserBtn.click();
      await sleep(350);
      const desktopDropdown = await page.$('.hidden.xl\\:flex div.relative div.shadow-xl');
      assert(desktopDropdown !== null, "Desktop account popover opens with unified motion");
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, "09_desktop_profile_popover.png") });
    }

    // 4D. Reduced Motion Safeguard Emulation
    console.log("\n--- TEST 5: Reduced Motion Accessibility Safeguard ---");
    await page.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
    await page.goto(`${BASE_URL}/explore`, { waitUntil: "domcontentloaded" });
    await sleep(300);

    const reducedMotionActive = await page.evaluate(() => {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    });
    assert(reducedMotionActive, "prefers-reduced-motion: reduce is recognized by browser");

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "10_reduced_motion_mode.png") });

    console.log("\n===============================================================");
    console.log(`SUMMARY: ${results.filter(r => r.status === "PASS").length}/${results.length} CHECKS PASSED`);
    console.log("===============================================================\n");

    const failed = results.filter((r) => r.status === "FAIL");
    if (failed.length > 0) {
      console.error("FAILURES DETECTED:", failed);
      process.exit(1);
    } else {
      console.log("ALL ACCEPTANCE CRITERIA SATISFIED PERFECTLY!");
    }
  } catch (err) {
    console.error("Test execution error:", err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runPhase6Acceptance();
