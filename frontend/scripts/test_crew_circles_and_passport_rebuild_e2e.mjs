import { chromium } from "playwright";
import assert from "node:assert/strict";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

const ONE_PIXEL_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

const MOCK_USER = {
  id: "u-rebuild-001",
  email: "rebuild.user@vanvas.com",
  full_name: "Meera Chauhan",
  role: "traveller",
  avatar_url: null,
  avatar_type: "none",
  avatar_preset: null,
  vanvas_id: "VNV-MEER-9123",
  email_verified_at: "2026-11-10T10:00:00Z",
  is_verified: true,
  created_at: "2026-11-10T10:00:00Z",
  preferences: { allow_friend_requests_via_id: true },
};

const MOCK_CIRCLE = {
  id: "circle-rebuild-01",
  name: "Kinnaur Riders",
  description: "Autumn motorcycle loop",
  created_by: MOCK_USER.id,
  created_at: "2026-11-10T10:00:00Z",
  members: [
    { id: "m1", user_id: MOCK_USER.id, user_name: "Meera Chauhan", vanvas_id: "VNV-MEER-9123", role: "owner" },
    { id: "m2", user_id: "u-2", user_name: "Rohan Negi", vanvas_id: "VNV-ROHA-4411", role: "member" },
    { id: "m3", user_id: "u-3", user_name: "Ananya Verma", vanvas_id: "VNV-ANAN-7788", role: "member" },
  ],
  trips: [],
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
    // 1. PHASE 1: Passport Camera Direct Upload, Validation, Edit Profile Separation
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();

    let currentUser = { ...MOCK_USER };
    let avatarUploadCalls = 0;
    let profileUpdateCalls = 0;

    await page.route("**/api/v1/**", async (route) => {
      const url = route.request().url();
      if (url.includes("/api/v1/auth/me")) {
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(currentUser) });
      }
      if (url.includes("/api/v1/auth/profile/avatar") && route.request().method() === "POST") {
        avatarUploadCalls += 1;
        const dataUri = `data:image/png;base64,${ONE_PIXEL_PNG_BASE64}`;
        currentUser = { ...currentUser, avatar_url: dataUri, avatar_type: "uploaded", avatar_preset: null };
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ avatar_url: dataUri, avatar_type: "uploaded", message: "Updated" }),
        });
      }
      if (url.includes("/api/v1/auth/profile") && route.request().method() === "PUT") {
        profileUpdateCalls += 1;
        const body = route.request().postDataJSON();
        currentUser = { ...currentUser, full_name: body.full_name || currentUser.full_name };
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(currentUser) });
      }
      if (url.includes("/api/v1/auth/profile/stats")) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ saved_places_count: 0, saved_trips_count: 0, upcoming_trips_count: 0, completed_trips_count: 0, reviews_count: 0, bookings_count: 0, member_since: MOCK_USER.created_at }),
        });
      }
      if (url.includes("/api/v1/solo/profile")) {
        return route.fulfill({ status: 404, contentType: "application/json", body: "{}" });
      }
      return route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
    });

    await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
    await page.evaluate((u) => {
      localStorage.setItem("vanvas_token", "tok-rebuild");
      localStorage.setItem("vanvas_user_profile", JSON.stringify(u));
    }, MOCK_USER);

    await page.goto(`${BASE_URL}/profile`, { waitUntil: "networkidle" });
    await page.getByTestId("traveler-passport-card").waitFor({ state: "visible" });

    // No redundant Profile Photo button in action bar
    const actionBarText = await page.getByTestId("passport-action-bar").innerText();
    assert.ok(!actionBarText.includes("Profile Photo"), "Redundant Profile Photo button must be removed");

    // Camera button has accessible label & is keyboard accessible
    const camBtn = page.getByTestId("passport-camera-btn");
    assert.equal(await camBtn.getAttribute("aria-label"), "Upload or change profile photo");

    // Reject invalid file format
    const fileInput = page.getByTestId("passport-photo-input");
    await fileInput.setInputFiles({ name: "bad.txt", mimeType: "text/plain", buffer: Buffer.from("not an image") });
    await page.getByTestId("passport-avatar-error").waitFor({ state: "visible" });

    // Reject oversized (>5MB) image
    await fileInput.setInputFiles({ name: "huge.png", mimeType: "image/png", buffer: Buffer.alloc(5 * 1024 * 1024 + 100) });
    await page.getByTestId("passport-avatar-error").waitFor({ state: "visible" });

    // Upload valid PNG -> opens AvatarCropper -> confirm crop -> uploads & refreshes
    await fileInput.setInputFiles({ name: "valid.png", mimeType: "image/png", buffer: Buffer.from(ONE_PIXEL_PNG_BASE64, "base64") });
    const cropDialog = page.getByRole("dialog", { name: "Crop Profile Photo" });
    await cropDialog.waitFor({ state: "visible" });
    await cropDialog.getByRole("button", { name: /Apply|Save|Crop|Confirm|Use Photo/i }).last().click();
    await page.getByTestId("passport-avatar-success").waitFor({ state: "visible" });
    assert.equal(avatarUploadCalls, 1);

    // Edit Profile modal has NO photo upload control & saving display name does not call avatar upload
    await page.getByTestId("passport-action-bar").getByRole("button", { name: /Edit Profile/i }).click();
    const modalText = await page.locator("form").innerText();
    assert.ok(!modalText.includes("Auto-cropped square"), "Edit Profile modal must not contain photo upload controls");
    await page.locator("form input[type='text']").first().fill("Meera Himalayan");
    await page.getByRole("button", { name: /Save Changes/i }).click();
    await page.waitForTimeout(300);
    assert.equal(profileUpdateCalls, 1);
    assert.equal(avatarUploadCalls, 1);
    await ctx.close();

    // 2. PHASES 2-5: Crew Circles Workspace, Chat Polling/Retry & Planner Link Context (390x844 mobile)
    const mCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const mPage = await mCtx.newPage();

    let activities = [
      {
        id: "act-sys-1",
        circle_id: MOCK_CIRCLE.id,
        user_id: MOCK_USER.id,
        user_name: MOCK_USER.full_name,
        activity_type: "member_added",
        content: "Meera Chauhan added Rohan Negi to the circle",
        created_at: "2026-11-12T10:00:00Z",
      },
      {
        id: "act-chat-1",
        circle_id: MOCK_CIRCLE.id,
        user_id: "u-2",
        user_name: "Rohan Negi",
        activity_type: "chat",
        content: "Bike serviced and ready for Reckong Peo!",
        created_at: "2026-11-12T10:05:00Z",
      },
    ];
    let failNextChatPost = true;
    let pollCounter = 0;

    await mPage.route("**/api/v1/**", async (route) => {
      const url = route.request().url();
      if (url.includes("/api/v1/auth/me")) {
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_USER) });
      }
      if (url.includes(`/api/v1/crew-circles/${MOCK_CIRCLE.id}/activity`)) {
        if (route.request().method() === "POST") {
          if (failNextChatPost) {
            failNextChatPost = false;
            return route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ detail: "Temporary send error" }) });
          }
          const body = route.request().postDataJSON();
          const newMsg = {
            id: `act-chat-${Date.now()}`,
            circle_id: MOCK_CIRCLE.id,
            user_id: MOCK_USER.id,
            user_name: MOCK_USER.full_name,
            activity_type: "chat",
            content: body.content,
            created_at: new Date().toISOString(),
          };
          activities = [...activities, newMsg];
          return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(newMsg) });
        }
        pollCounter += 1;
        if (pollCounter >= 3 && !activities.some((a) => a.id === "act-chat-polled")) {
          activities = [
            ...activities,
            {
              id: "act-chat-polled",
              circle_id: MOCK_CIRCLE.id,
              user_id: "u-3",
              user_name: "Ananya Verma",
              activity_type: "chat",
              content: "Joining from Shimla bus stand!",
              created_at: new Date().toISOString(),
            },
          ];
        }
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(activities) });
      }
      if (url.includes(`/api/v1/crew-circles/${MOCK_CIRCLE.id}/suggestions`)) {
        return route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
      }
      if (url.includes(`/api/v1/crew-circles/${MOCK_CIRCLE.id}`)) {
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_CIRCLE) });
      }
      if (url.includes("/api/v1/collaborative-finance")) {
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ total_shared_expenses: 0, member_balances: [] }) });
      }
      return route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
    });

    await mPage.goto(BASE_URL, { waitUntil: "domcontentloaded" });
    await mPage.evaluate((u) => {
      localStorage.setItem("vanvas_token", "tok-rebuild");
      localStorage.setItem("vanvas_user_profile", JSON.stringify(u));
    }, MOCK_USER);

    await mPage.goto(`${BASE_URL}/circles/${MOCK_CIRCLE.id}`, { waitUntil: "networkidle" });

    // Overview has Crew Conversation preview & navigates to Chat & Activity
    await mPage.getByText("Crew Conversation").waitFor({ state: "visible" });
    await mPage.getByRole("button", { name: /Open Chat & Activity/i }).click();

    // Separate system event vs chat message
    await mPage.getByTestId("circle-system-event").waitFor({ state: "visible" });
    await mPage.getByTestId("circle-chat-message").first().waitFor({ state: "visible" });

    // Failed message -> rollback & Retry button -> retry succeeds
    await mPage.getByPlaceholder(/Share notes/i).fill("Bringing extra bungee cords");
    await mPage.getByRole("button", { name: /^Send$/i }).click();
    await mPage.getByRole("button", { name: /^Retry$/i }).waitFor({ state: "visible" });
    await mPage.getByRole("button", { name: /^Retry$/i }).click();
    await mPage.getByText("Bringing extra bungee cords").waitFor({ state: "visible" });

    // Polling receives message from another member within ~5s
    await mPage.getByText("Joining from Shimla bus stand!").waitFor({ state: "visible", timeout: 8000 });

    // Plans tab has no "+ Plan Together" duplicate plus and carries circle context to /plan
    await mPage.getByRole("button", { name: /Plans \(0\)/i }).click();
    const planBtn = mPage.getByTestId("circle-plan-together-btn");
    assert.equal((await planBtn.innerText()).trim(), "Plan Together");
    const href = await planBtn.getAttribute("href");
    assert.ok(href?.includes(`circleId=${MOCK_CIRCLE.id}`), `Expected circleId in href, got: ${href}`);
    assert.ok(href?.includes("groupSize=3"), `Expected groupSize=3 in href, got: ${href}`);

    // Navigate to /plan with circle context -> verify banner & prefilled groupSize=3
    await mPage.goto(`${BASE_URL}${href}`, { waitUntil: "networkidle" });
    const banner = mPage.getByTestId("plan-circle-context-banner");
    await banner.waitFor({ state: "visible" });
    const bannerText = await banner.innerText();
    assert.ok(bannerText.includes("Kinnaur Riders"), `Expected circle name in banner, got: ${bannerText}`);
    assert.ok(bannerText.includes("3 travellers"), `Expected 3 travellers in banner, got: ${bannerText}`);

    await mCtx.close();
    console.log("ALL_REBUILD_E2E_TESTS_PASSED");
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error("REBUILD_E2E_FAILED:", err);
  process.exit(1);
});

