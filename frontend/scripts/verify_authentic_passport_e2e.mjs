import { chromium } from "playwright";
import assert from "node:assert/strict";
import path from "node:path";

const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:3000";
const ARTIFACT_DIR =
  process.env.ARTIFACT_DIR ||
  "C:/Users/user/.gemini/antigravity/brain/87430a81-169c-4732-9247-44bc84466852";

const MOCK_USER = {
  id: "u-test-authentic-001",
  email: "kavya.mehta@example.com",
  full_name: "Kavya Mehta",
  role: "traveller",
  avatar_url: null,
  avatar_type: "none",
  avatar_preset: null,
  vanvas_id: "VNV-KAVY-4829",
  email_verified_at: "2026-11-10T10:05:00Z",
  is_verified: true,
  created_at: "2026-11-10T10:00:00Z",
  preferences: {
    preferred_travel_style: null,
    wake_up_preference: null,
    activity_intensity: null,
    dietary_preference: null,
    interests: null,
    accommodation_preference: null,
    transport_preference: null,
    companion_style: null,
    currency: "INR",
    language: "en",
    region: "India",
    allow_friend_requests_via_id: true,
  },
};

async function launchBrowser() {
  for (const opts of [{ headless: true, channel: "chrome" }, { headless: true, channel: "msedge" }, { headless: true }]) {
    try {
      return await chromium.launch(opts);
    } catch {
      // try next browser channel
    }
  }
  throw new Error("No Playwright browser executable available");
}

async function run() {
  const browser = await launchBrowser();

  try {
    // 1. Desktop Guest Homepage (confirm zero fabricated ₹3,500 budget text)
    const desktopCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await desktopCtx.newPage();

    await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(400);

    const desktopBody = await page.locator("body").innerText();
    assert.ok(!desktopBody.includes("3,500"), "Fake ₹3,500 amount must not appear on desktop");
    assert.ok(!desktopBody.includes("3,000"), "Fake ₹3,000 amount must not appear on desktop");

    await page.screenshot({
      path: path.join(ARTIFACT_DIR, "local_home_empty_desktop.png"),
      fullPage: false,
    });
    await desktopCtx.close();

    // 2. Mobile Guest Homepage (TravelDesk Split Budget + Checklist + Legacy Migration)
    const mobileCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const mPage = await mobileCtx.newPage();
    await mPage.goto(BASE_URL, { waitUntil: "domcontentloaded" });
    await mPage.evaluate(() => {
      localStorage.clear();
    });
    await mPage.reload({ waitUntil: "domcontentloaded" });

    const budgetCard = mPage.locator('[data-testid="tool-split-budget"]:visible').first();
    const checklistCard = mPage.locator('[data-testid="tool-packing-checklist"]:visible').first();
    await budgetCard.waitFor({ state: "visible" });

    const budgetText = await budgetCard.innerText();
    assert.ok(budgetText.includes("Empty"), `Expected Empty badge, got: ${budgetText}`);
    assert.ok(
      budgetText.includes("Start an empty budget split"),
      `Expected empty subtitle, got: ${budgetText}`
    );
    assert.ok(!budgetText.includes("3,500"), "Fake ₹3,500 amount must not appear");
    assert.ok(!budgetText.includes("3,000"), "Fake ₹3,000 amount must not appear");

    const checklistText = await checklistCard.innerText();
    assert.ok(checklistText.includes("0 items"), `Expected 0 items, got: ${checklistText}`);

    await budgetCard.scrollIntoViewIfNeeded();
    await mPage.waitForTimeout(400);
    await mPage.screenshot({
      path: path.join(ARTIFACT_DIR, "local_home_empty_mobile.png"),
      fullPage: false,
    });

    // Open Split Budget modal and verify empty state
    await budgetCard.click();
    await mPage.getByText("Start Your Budget").waitFor({ state: "visible" });
    await mPage.getByText("No budget items yet").waitFor({ state: "visible" });
    await mPage.keyboard.press("Escape");

    // Legacy localStorage migration check (isolated to unassigned namespace until confirmed)
    await mPage.evaluate(() => {
      localStorage.setItem(
        "vanvas_local_budget_split",
        JSON.stringify({
          travellersCount: 4,
          expenses: [
            { id: "e1", name: "Fuel & Transport", amount: 4500 },
            { id: "custom_raft", name: "River Rafting", amount: 1800 },
          ],
        })
      );
    });
    await mPage.reload({ waitUntil: "domcontentloaded" });
    await mPage.locator('[data-testid="tool-split-budget"]:visible').first().click();
    await mPage.getByTestId("legacy-import-banner").waitFor({ state: "visible" });
    await mPage.getByTestId("legacy-import-banner").getByText(/Import/i).click();
    await mPage.getByText("River Rafting").waitFor({ state: "visible" });
    const modalBody = await mPage.locator("body").innerText();
    assert.ok(!modalBody.includes("Fuel & Transport"), "Legacy seeded e1 row should be stripped");

    await mobileCtx.close();

    // 3. Authenticated Profile Passport (Desktop + Mobile, Reduced Motion)
    for (const [label, vp] of [
      ["desktop", { width: 1440, height: 900 }],
      ["mobile", { width: 390, height: 844 }],
    ]) {
      const ctx = await browser.newContext({ viewport: vp, reducedMotion: "reduce" });
      const p = await ctx.newPage();

      let currentPrefs = { ...MOCK_USER.preferences };
      await p.route("**/api/v1/**", async (route) => {
        const url = route.request().url();
        if (url.includes("/api/v1/auth/me")) {
          return route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ ...MOCK_USER, preferences: currentPrefs }),
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
              member_since: MOCK_USER.created_at,
            }),
          });
        }
        if (url.includes("/api/v1/auth/preferences")) {
          const body = route.request().postDataJSON();
          currentPrefs = { ...currentPrefs, ...body };
          return route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(currentPrefs),
          });
        }
        if (url.includes("/api/v1/solo/profile")) {
          return route.fulfill({ status: 404, contentType: "application/json", body: "{}" });
        }
        return route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
      });

      await p.goto(BASE_URL, { waitUntil: "domcontentloaded" });
      await p.evaluate((u) => {
        localStorage.setItem("vanvas_token", "mock-jwt-token");
        localStorage.setItem("vanvas_user_profile", JSON.stringify(u));
      }, MOCK_USER);

      await p.goto(`${BASE_URL}/profile`, { waitUntil: "domcontentloaded" });
      const passport = p.getByTestId("traveler-passport-card");
      try {
        await passport.waitFor({ state: "visible", timeout: 10000 });
      } catch (e) {
        const dbgUrl = p.url();
        const dbgText = await p.locator("body").innerText().catch(() => "");
        throw new Error(`Passport not visible at ${dbgUrl}. Body: ${dbgText.slice(0, 500)}`);
      }

      assert.equal(await passport.count(), 1, "Must render exactly ONE Traveler Passport");
      const pageText = await p.locator("body").innerText();
      assert.ok(pageText.includes("VNV-KAVY-4829"), "Real VANVAS ID should render");
      assert.ok(!pageText.includes("VNV-VANV-ASAI"), "Fake VNV-VANV-ASAI must not render");
      assert.ok(!pageText.includes("Himalayan Explorer"), "Fake fallback must not render");
      assert.ok(/verified traveler/i.test(pageText), "Verified user should show Verified Traveler");
      assert.ok(pageText.includes("Not set yet"), "Unset preferences must show Not set yet");

      // Badge overlap check
      const badgeBox = await p.getByTestId("passport-official-badge").boundingBox();
      const nameBox = await p.locator("h1", { hasText: "Kavya Mehta" }).boundingBox();
      assert.ok(badgeBox && nameBox, "Badge and name bounding boxes must exist");
      assert.ok(
        badgeBox.y + badgeBox.height <= nameBox.y + 4,
        `Official badge must sit cleanly in top header row without overlapping name (${label})`
      );

      await passport.scrollIntoViewIfNeeded();
      await p.waitForTimeout(400);
      await p.screenshot({
        path: path.join(ARTIFACT_DIR, `local_profile_passport_${label}.png`),
        fullPage: false,
      });

      // Privacy switch check
      const sw = p.getByTestId("passport-privacy-switch");
      assert.equal(await sw.getAttribute("role"), "switch");
      assert.equal(await sw.getAttribute("aria-checked"), "true");
      await sw.click();
      await p.waitForTimeout(200);
      assert.equal(await sw.getAttribute("aria-checked"), "false");

      // Regenerate ID confirmation modal check
      await p.getByTestId("passport-regenerate-btn").click();
      await p.getByText("Regenerate VANVAS ID?").waitFor({ state: "visible" });
      await p.keyboard.press("Escape");

      await ctx.close();
    }

    console.log("ALL_E2E_ASSERTIONS_PASSED");
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error("E2E_FAILED:", err);
  process.exit(1);
});
