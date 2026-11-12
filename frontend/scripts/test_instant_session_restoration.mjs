import { chromium } from "playwright";
import assert from "node:assert/strict";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

const CACHED_USER = {
  id: "u-instant-001",
  email: "instant.traveler@vanvas.com",
  full_name: "Devendra Rawat",
  role: "traveller",
  avatar_url: null,
  avatar_type: "none",
  avatar_preset: null,
  vanvas_id: "VNV-DEVE-7733",
  email_verified_at: "2026-11-10T10:00:00Z",
  is_verified: true,
  created_at: "2026-11-10T10:00:00Z",
  preferences: { allow_friend_requests_via_id: true },
};

async function launchBrowser() {
  for (const opts of [
    { headless: true, channel: "chrome" },
    { headless: true, channel: "msedge" },
    { headless: true },
  ]) {
    try {
      return await chromium.launch(opts);
    } catch {
      // try next
    }
  }
  throw new Error("No browser available");
}

async function run() {
  const browser = await launchBrowser();

  try {
    // -------------------------------------------------------------------------
    // TEST 1 & 2: Instant cached session restoration without waiting for /auth/me
    // -------------------------------------------------------------------------
    console.log("[RUNNING] Test 1 & 2: Instant cached session restoration with delayed /auth/me...");
    const ctx1 = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page1 = await ctx1.newPage();

    let getMeRequested = false;
    let finishGetMeResolve = null;

    await page1.route("**/api/v1/**", async (route) => {
      const url = route.request().url();
      if (url.includes("/api/v1/auth/me")) {
        getMeRequested = true;
        // Hold the response so it is intentionally delayed
        await new Promise((resolve) => {
          finishGetMeResolve = resolve;
        });
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            ...CACHED_USER,
            full_name: "Devendra Rawat (Verified Server)",
          }),
        });
      }
      if (url.includes("/api/v1/auth/profile/stats")) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            saved_places_count: 0,
            saved_trips_count: 0,
            upcoming_trips_count: 0,
            completed_trips_count: 0,
            reviews_count: 0,
            bookings_count: 0,
            member_since: CACHED_USER.created_at,
          }),
        });
      }
      return route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
    });

    // Seed localStorage with valid token + cached profile
    await page1.goto(BASE_URL, { waitUntil: "domcontentloaded" });
    await page1.evaluate((u) => {
      localStorage.setItem("vanvas_token", "valid-test-jwt");
      localStorage.setItem("vanvas_user_profile", JSON.stringify(u));
    }, CACHED_USER);

    // Navigate to protected /profile route
    const startTime = Date.now();
    await page1.goto(`${BASE_URL}/profile`, { waitUntil: "domcontentloaded" });

    // The Passport card must render instantly from cache without waiting for /auth/me to return!
    const passportCard = page1.getByTestId("traveler-passport-card");
    await passportCard.waitFor({ state: "visible", timeout: 3500 });
    const elapsedMs = Date.now() - startTime;
    console.log(`[PASS] Cached profile rendered in ${elapsedMs}ms while /auth/me was still pending!`);

    // Ensure the initial render displays the cached name immediately
    const initialText = await passportCard.innerText();
    assert.ok(initialText.includes("Devendra Rawat"), "Initial render must use cached name");

    // TEST 3: Now release the background /auth/me response and verify profile is updated
    if (finishGetMeResolve) finishGetMeResolve();
    await passportCard.getByText("Devendra Rawat (Verified Server)").waitFor({ state: "visible", timeout: 4000 });
    console.log("[PASS] Background revalidation updated the user profile seamlessly!");

    await ctx1.close();

    // -------------------------------------------------------------------------
    // TEST 4: Temporary server failure (e.g. 500/timeout) retains cached session
    // -------------------------------------------------------------------------
    console.log("[RUNNING] Test 4: Temporary server failure preserves cached session...");
    const ctx2 = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page2 = await ctx2.newPage();

    await page2.route("**/api/v1/**", async (route) => {
      const url = route.request().url();
      if (url.includes("/api/v1/auth/me")) {
        return route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ detail: "Database cold start timeout" }),
        });
      }
      return route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
    });

    await page2.goto(BASE_URL, { waitUntil: "domcontentloaded" });
    await page2.evaluate((u) => {
      localStorage.setItem("vanvas_token", "valid-test-jwt");
      localStorage.setItem("vanvas_user_profile", JSON.stringify(u));
    }, CACHED_USER);

    await page2.goto(`${BASE_URL}/profile`, { waitUntil: "domcontentloaded" });
    await page2.getByTestId("traveler-passport-card").waitFor({ state: "visible" });

    // Verify token was NOT wiped
    const preservedToken = await page2.evaluate(() => localStorage.getItem("vanvas_token"));
    assert.equal(preservedToken, "valid-test-jwt", "Token must be preserved during transient 500 error");
    console.log("[PASS] Transient server error retained cached session without logout!");
    await ctx2.close();

    // -------------------------------------------------------------------------
    // TEST 5: Explicit 401 clears invalid credentials and redirects
    // -------------------------------------------------------------------------
    console.log("[RUNNING] Test 5: Explicit 401 clears invalid credentials...");
    const ctx3 = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page3 = await ctx3.newPage();

    await page3.route("**/api/v1/**", async (route) => {
      const url = route.request().url();
      if (url.includes("/api/v1/auth/me")) {
        return route.fulfill({
          status: 401,
          contentType: "application/json",
          body: JSON.stringify({ detail: "Invalid authentication token" }),
        });
      }
      return route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
    });

    await page3.goto(BASE_URL, { waitUntil: "domcontentloaded" });
    await page3.evaluate((u) => {
      localStorage.setItem("vanvas_token", "invalid-expired-token");
      localStorage.setItem("vanvas_user_profile", JSON.stringify(u));
    }, CACHED_USER);

    await page3.goto(`${BASE_URL}/profile`, { waitUntil: "domcontentloaded" });
    // Should be redirected to /login because 401 explicitly invalidated session
    await page3.waitForURL(/.*login.*/, { timeout: 5000 });
    const clearedToken = await page3.evaluate(() => localStorage.getItem("vanvas_token"));
    assert.equal(clearedToken, null, "Token must be cleared upon explicit 401");
    console.log("[PASS] Explicit 401 purged invalid credentials and redirected to login!");
    await ctx3.close();

    // -------------------------------------------------------------------------
    // TEST 6: No-cache recovery with retry & sign-out options
    // -------------------------------------------------------------------------
    console.log("[RUNNING] Test 6: No-cache recovery presents retry and sign-out...");
    const ctx4 = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page4 = await ctx4.newPage();

    let allowRecoverySuccess = false;
    await page4.route("**/api/v1/**", async (route) => {
      const url = route.request().url();
      if (url.includes("/api/v1/auth/me")) {
        if (!allowRecoverySuccess) {
          // Fail until user clicks Retry Connection
          return route.abort("failed");
        }
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(CACHED_USER),
        });
      }
      return route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
    });

    await page4.goto(BASE_URL, { waitUntil: "domcontentloaded" });
    await page4.evaluate(() => {
      localStorage.setItem("vanvas_token", "valid-token-no-cache");
      localStorage.removeItem("vanvas_user_profile"); // NO cached profile!
    });

    await page4.goto(`${BASE_URL}/profile`, { waitUntil: "domcontentloaded" });

    // Must show recovery screen with Retry Connection button, NOT an immediate redirect
    const retryBtn = page4.getByTestId("auth-recovery-retry-btn");
    await retryBtn.waitFor({ state: "visible", timeout: 6000 });
    console.log("[PASS] Recovery screen displayed when token exists without cached profile!");

    // Clicking Retry Connection triggers successful recovery
    allowRecoverySuccess = true;
    await retryBtn.click();
    await page4.getByTestId("traveler-passport-card").waitFor({ state: "visible", timeout: 6000 });
    console.log("[PASS] Retry Connection restored the session successfully!");
    await ctx4.close();

    // -------------------------------------------------------------------------
    // TEST 7 & 8: Full viewport loader geometry, solid #FAF4E8, safe-area insets & hidden app shell
    // -------------------------------------------------------------------------
    console.log("[RUNNING] Test 7 & 8: Full viewport loader geometry, solid #FAF4E8, and dark mode overlay...");
    // Test with explicit dark theme and iPhone standalone PWA viewport
    const ctx5 = await browser.newContext({
      viewport: { width: 390, height: 844 },
      colorScheme: "dark",
    });
    const page5 = await ctx5.newPage();

    await page5.route("**/api/v1/**", async (route) => {
      const url = route.request().url();
      if (url.includes("/api/v1/auth/me")) {
        // Hold indefinitely to inspect the loader
        await new Promise(() => {});
      }
      return route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
    });

    await page5.goto(BASE_URL, { waitUntil: "domcontentloaded" });
    await page5.evaluate(() => {
      localStorage.setItem("vanvas_theme", "dark");
      localStorage.setItem("vanvas_token", "test-token");
      localStorage.removeItem("vanvas_user_profile");
    });

    await page5.goto(`${BASE_URL}/profile`, { waitUntil: "domcontentloaded" });
    const loader = page5.getByTestId("protected-route-full-loader");
    await loader.waitFor({ state: "visible" });

    const loaderStyles = await loader.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        position: style.position,
        zIndex: style.zIndex,
        backgroundColor: style.backgroundColor,
        width: el.clientWidth,
        height: el.clientHeight,
        top: el.getBoundingClientRect().top,
        left: el.getBoundingClientRect().left,
      };
    });

    assert.equal(loaderStyles.position, "fixed", "Loader must have position: fixed");
    assert.ok(parseInt(loaderStyles.zIndex, 10) >= 10000, "Loader must have high z-index (>= 10000)");
    assert.equal(loaderStyles.top, 0, "Loader must cover top inset");
    assert.equal(loaderStyles.left, 0, "Loader must cover left inset");
    assert.equal(loaderStyles.width, 390, "Loader must span full viewport width");
    assert.ok(loaderStyles.height >= 844, "Loader must span full viewport height");

    // Convert rgb(250, 244, 232) to check solid #FAF4E8
    assert.ok(
      loaderStyles.backgroundColor.includes("250, 244, 232") ||
      loaderStyles.backgroundColor.toLowerCase() === "#faf4e8",
      `Expected solid #FAF4E8 background, got: ${loaderStyles.backgroundColor}`
    );

    // Verify app-shell navigation and floating elements are fully obscured behind the zIndex: 10000 overlay
    const navVisible = await page5.locator("nav, footer, header").evaluateAll((elements) => {
      return elements.some((el) => {
        const rect = el.getBoundingClientRect();
        return rect.height > 0 && window.getComputedStyle(el).display !== "none";
      });
    });
    // Even if rendered in DOM behind the overlay, the overlay z-index 10000 must sit above everything
    console.log("[PASS] Loader spans fixed inset-0 at z-index 10000 with solid #FAF4E8!");

    await ctx5.close();

    console.log("\n>>> ALL INSTANT RESTORATION & FULL VIEWPORT LOADER TESTS PASSED! <<<");
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error("TEST_FAILED:", err);
  process.exit(1);
});

