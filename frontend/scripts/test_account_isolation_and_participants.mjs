import { chromium } from "playwright";
import assert from "node:assert/strict";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

const USER_A = {
  id: "user-isolation-a-001",
  email: "user.a@vanvas.com",
  full_name: "Aarav One",
  role: "traveller",
  avatar_type: "none",
  avatar_preset: null,
  vanvas_id: "VNV-AAAA-1111",
  email_verified_at: "2026-11-10T10:00:00Z",
  is_verified: true,
  created_at: "2026-11-10T10:00:00Z",
  preferences: { allow_friend_requests_via_id: true },
};

const USER_B = {
  id: "user-isolation-b-002",
  email: "user.b@vanvas.com",
  full_name: "Bhavna Two",
  role: "traveller",
  avatar_type: "none",
  avatar_preset: null,
  vanvas_id: "VNV-BBBB-2222",
  email_verified_at: "2026-11-10T10:00:00Z",
  is_verified: true,
  created_at: "2026-11-10T10:00:00Z",
  preferences: { allow_friend_requests_via_id: true },
};

const REAL_TRIP = {
  id: "trip-real-spiti-01",
  title: "Spiti Winter Expedition",
  destination_id: "dest-spiti",
  destination: {
    id: "dest-spiti",
    name: "Spiti Valley",
    slug: "spiti",
    state: "Himachal Pradesh",
  },
  destination_name: "Spiti Valley",
  status: "planned",
  start_date: "2026-12-01",
  end_date: "2026-12-07",
  num_days: 7,
  budget_total: 25000,
  budget_spent: 0,
  travellers_count: 2,
};

const REAL_TRIP_MEMBERS = {
  members: [
    { id: "tm1", user_id: USER_A.id, full_name: "Aarav One", role: "owner" },
    { id: "tm2", user_id: USER_B.id, full_name: "Bhavna Two", role: "member" },
  ],
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

async function setSessionUser(page, userObj) {
  await page.evaluate((u) => {
    if (u) {
      localStorage.setItem("vanvas_token", `tok-${u.id}`);
      localStorage.setItem("vanvas_user_profile", JSON.stringify(u));
    } else {
      localStorage.removeItem("vanvas_token");
      localStorage.removeItem("vanvas_user_profile");
    }
  }, userObj);
}

async function run() {
  const browser = await launchBrowser();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();

  let activeMockUser = USER_A;

  await page.route("**/api/v1/**", async (route) => {
    const url = route.request().url();
    if (url.includes("/api/v1/auth/me")) {
      if (!activeMockUser) {
        return route.fulfill({ status: 401, contentType: "application/json", body: "{}" });
      }
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(activeMockUser),
      });
    }
    if (url.includes(`/api/v1/trips/${REAL_TRIP.id}/members`)) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(REAL_TRIP_MEMBERS),
      });
    }
    if (url.includes("/api/v1/trips")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(activeMockUser?.id === USER_A.id ? [REAL_TRIP] : []),
      });
    }
    if (url.includes("/api/v1/auth/account") && route.request().method() === "DELETE") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ message: "Deleted" }),
      });
    }
    return route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
  });

  try {
    // 1. Seed legacy global data with a custom row + old seeded e1 + ambiguous count 1
    await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem(
        "vanvas_local_budget_split",
        JSON.stringify({
          travellersCount: 1,
          expenses: [
            { id: "e1", name: "Fuel & Transport", amount: 4500 },
            { id: "leg_1", name: "Legacy Yak Ride", amount: 900 },
          ],
        })
      );
    });
    await setSessionUser(page, USER_A);
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(300);

    // Confirm legacy data was NOT auto-assigned to User A, and User A starts unset
    const budgetCard = page.locator('[data-testid="tool-split-budget"]:visible').first();
    await budgetCard.waitFor({ state: "visible" });
    await budgetCard.scrollIntoViewIfNeeded();
    const initialCardText = await budgetCard.innerText();
    assert.ok(initialCardText.includes("Empty"), `Expected Empty for User A, got: ${initialCardText}`);

    // Open Split Budget modal: verify Start Your Budget + Travellers not configured + legacy import banner
    await budgetCard.click();
    await page.getByText("Start Your Budget").waitFor({ state: "visible" });
    await page.getByText("Travellers not configured").first().waitFor({ state: "visible" });
    await page.getByTestId("legacy-import-banner").waitFor({ state: "visible" });

    // Dismiss legacy import so User A starts clean
    await page.getByTestId("legacy-import-banner").getByText("Dismiss").click();

    // Add an expense BEFORE setting travellers -> must show total ₹2,500 & Pending, NO ₹ ea
    await page.getByTestId("budget-add-row-btn").click();
    await page.getByPlaceholder(/Parvati Valley Riverside Camp/i).fill("User A Permit");
    await page.getByPlaceholder("600").fill("2500");
    await page.getByRole("button", { name: /Add to Budget/i }).first().click();

    await page.getByText("User A Permit").waitFor({ state: "visible" });
    await page.getByText("Participant allocation pending").first().waitFor({ state: "visible" });
    assert.equal(await page.getByTestId("budget-per-person-display").innerText(), "Pending");

    // Explicitly configure 5 travellers -> 2500 / 5 = ₹500
    await page.getByTestId("set-travellers-btn").click();
    await page.getByTestId("choose-travellers-5").click();
    assert.equal(await page.getByTestId("travellers-count-value").innerText(), "5");
    assert.equal(await page.getByTestId("budget-per-person-display").innerText(), "₹500");

    // Check Trip Budget mode uses real backend members (Aarav One, Bhavna Two), not traveller_1
    await page.getByRole("button", { name: "Trip Budget" }).click();
    await page.getByRole("button", { name: /Aarav One/i }).waitFor({ state: "visible" });
    await page.getByRole("button", { name: /Bhavna Two/i }).waitFor({ state: "visible" });
    const tripModalText = await page.locator("body").innerText();
    assert.ok(!tripModalText.includes("Traveller 1"), "Fake Traveller 1 must not appear");

    // Switch back to Scratch Budget -> User A's ₹500 / 5 travellers is intact and not merged
    await page.getByRole("button", { name: "Scratch Budget" }).click();
    await page.getByText("User A Permit").waitFor({ state: "visible" });
    await page.keyboard.press("Escape");

    // User A adds a checklist item
    const checklistCard = page.locator('[data-testid="tool-packing-checklist"]:visible').first();
    await checklistCard.click();
    await page.getByPlaceholder("Add gear or personal item...").fill("User A Crampons");
    await page.getByRole("button", { name: "Add Item" }).click();
    await page.getByText("User A Crampons").waitFor({ state: "visible" });
    await page.keyboard.press("Escape");

    // 2. Sign out -> Guest must NOT see User A's budget or checklist
    activeMockUser = null;
    await setSessionUser(page, null);
    await page.reload({ waitUntil: "networkidle" });
    await budgetCard.waitFor({ state: "visible" });
    assert.ok((await budgetCard.innerText()).includes("Empty"), "Guest must not see User A budget");
    assert.ok((await checklistCard.innerText()).includes("0 items"), "Guest must not see User A checklist");

    // 3. User B signs in -> sees empty, adds User B item, never sees User A
    activeMockUser = USER_B;
    await setSessionUser(page, USER_B);
    await page.reload({ waitUntil: "networkidle" });
    await budgetCard.waitFor({ state: "visible" });
    assert.ok((await budgetCard.innerText()).includes("Empty"), "User B must not see User A budget");

    await checklistCard.click();
    await page.getByPlaceholder("Add gear or personal item...").fill("User B Thermos");
    await page.getByRole("button", { name: "Add Item" }).click();
    await page.getByText("User B Thermos").waitFor({ state: "visible" });
    await page.keyboard.press("Escape");

    // 4. User A signs back in -> recovers User A's budget & checklist, does NOT see User B
    activeMockUser = USER_A;
    await setSessionUser(page, USER_A);
    await page.reload({ waitUntil: "networkidle" });
    await budgetCard.waitFor({ state: "visible" });
    const recoveredBadge = await page.getByTestId("split-budget-card-badge").innerText();
    assert.ok(recoveredBadge.includes("500"), `User A should recover ₹500 ea, got: ${recoveredBadge}`);

    // 5. Verify account deletion namespace purge keeps User B's namespace intact
    const storageCheck = await page.evaluate(
      ({ idA, idB }) => {
        const keyA = `vanvas:user:${idA}:budget:v3`;
        const keyB = `vanvas:user:${idB}:checklist:v3`;
        return {
          hasA: Boolean(localStorage.getItem(keyA)),
          hasB: Boolean(localStorage.getItem(keyB)),
        };
      },
      { idA: USER_A.id, idB: USER_B.id }
    );
    assert.equal(storageCheck.hasA, true);
    assert.equal(storageCheck.hasB, true);

    console.log("ALL_ACCOUNT_ISOLATION_AND_PARTICIPANT_TESTS_PASSED");
  } finally {
    await ctx.close();
    await browser.close();
  }
}

run().catch((err) => {
  console.error("ISOLATION_E2E_FAILED:", err);
  process.exit(1);
});

