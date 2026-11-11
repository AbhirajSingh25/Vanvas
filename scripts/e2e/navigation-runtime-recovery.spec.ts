import http from 'http';
import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3010';

const DEMO_USER = {
  id: '00000000-0000-4000-8000-000000000101',
  email: 'explorer@vanvas.ai',
  full_name: 'Aarav Sharma',
  vanvas_id: 'VNV-TEST-4829',
  role: 'user',
  preferences: { layout_density: 'original', theme: 'light' },
};

async function attachZeroLoopMonitors(page: Page) {
  const maxUpdateDepthErrors: string[] = [];
  const pageErrors: string[] = [];

  page.on('console', (msg) => {
    if (msg.text().includes('Maximum update depth exceeded')) {
      maxUpdateDepthErrors.push(msg.text());
    }
  });
  page.on('pageerror', (err) => {
    pageErrors.push(err.message);
  });

  return { maxUpdateDepthErrors, pageErrors };
}

async function seedMockAuthAndApi(page: Page) {
  await page.addInitScript(({ user }) => {
    localStorage.setItem('vanvas_token', 'test-jwt-token-vanvas-e2e');
    localStorage.setItem('vanvas_user_profile', JSON.stringify(user));
  }, { user: DEMO_USER });

  await page.route('**/api/v1/**', async (route) => {
    const url = route.request().url();
    if (url.includes('/auth/me')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(DEMO_USER),
      });
    }
    if (url.includes('/app/version')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ update_available: false, latest_version: '0.4.0' }),
      });
    }
    if (
      url.includes('/destinations') ||
      url.includes('/trips') ||
      url.includes('/crew-circles') ||
      url.includes('/circles') ||
      url.includes('/friends')
    ) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ items: [], data: [] }),
    });
  });
}

async function waitForHydration(page: Page) {
  await page.waitForLoadState('load');
  await page.waitForFunction(
    () =>
      Boolean((window as any).__VANVAS_NAV_DIAGNOSTICS__) &&
      Boolean((window as any).__VANVAS_RECOVERY_READY__)
  );
}

async function verifyHitTargetAndClick(page: Page, selector: string) {
  const locator = page.locator(selector).first();
  await expect(locator).toBeVisible();
  await locator.scrollIntoViewIfNeeded();

  const hitCheck = await locator.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const hit = document.elementFromPoint(x, y);
    const sameOrDescendant = hit === el || el.contains(hit) || (hit ? hit.contains(el) : false);
    return {
      ok: sameOrDescendant,
      hitTag: hit?.tagName,
      hitClass: hit ? String(hit.className).slice(0, 60) : null,
      bodyOverflow: document.body.style.overflow,
      activeLocks: (window as any).__VANVAS_ACTIVE_LOCKS__ || 0,
    };
  });

  expect(hitCheck.ok, `Expected ${selector} not to be intercepted by overlay (${hitCheck.hitTag}.${hitCheck.hitClass})`).toBe(true);
  expect(hitCheck.bodyOverflow).not.toBe('hidden');
  expect(hitCheck.activeLocks).toBe(0);

  await locator.click();
}

test.describe('VANVAS P0 Navigation, Pointer Integrity, Chunk Recovery & SW Transitions', () => {
  test('Mobile (390x844): All core routes, modals, hit-testing, and scroll-locks', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const monitors = await attachZeroLoopMonitors(page);
    await seedMockAuthAndApi(page);

    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await waitForHydration(page);
    await page.waitForSelector('#vanvas-mobile-nav a[href="/explore"]');

    // 1. Home -> Explore
    await verifyHitTargetAndClick(page, '#vanvas-mobile-nav a[href="/explore"]');
    await page.waitForURL('**/explore');
    await expect(page.locator('h1').first()).toBeVisible();

    // 2. Explore -> Trips
    await verifyHitTargetAndClick(page, '#vanvas-mobile-nav a[href="/trips"]');
    await page.waitForURL('**/trips');

    // 3. Trips -> Circles
    await verifyHitTargetAndClick(page, '#vanvas-mobile-nav a[href="/circles"]');
    await page.waitForURL('**/circles');
    await expect(page.locator('h1').first()).toContainText('Crew Circles');

    // 4. Circles -> Home -> Plan
    await verifyHitTargetAndClick(page, '#vanvas-mobile-nav a[href="/"]');
    await page.waitForURL(`${BASE_URL}/`);
    await verifyHitTargetAndClick(page, '[data-testid="mobile-command-center"] a[href="/plan"]');
    await page.waitForURL('**/plan');

    // 5. Home -> Friends (authenticated quick card)
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await waitForHydration(page);
    await page.waitForSelector('[data-testid="home-friends-card"]');
    await verifyHitTargetAndClick(page, '[data-testid="home-friends-card"]');
    await page.waitForURL('**/friends');

    // 6. Home -> Nearby
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await waitForHydration(page);
    await verifyHitTargetAndClick(page, '[data-testid="mobile-command-center"] a[href="/nearby"]');
    await page.waitForURL('**/nearby');

    // 7. Home -> Destination Spotlight card
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await waitForHydration(page);
    await verifyHitTargetAndClick(page, '[data-testid^="spotlight-card-"]');
    await page.waitForURL(/\/explore\/[^/]+/);

    // 8. Home -> Quick Escape
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await waitForHydration(page);
    await verifyHitTargetAndClick(page, '[data-testid="mobile-command-center"] a[href^="/one-day?planId="]');
    await page.waitForURL(/\/one-day\?planId=/);

    // 9. Chalo Launcher modal -> Plan a Trip -> releases scroll lock cleanly
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await waitForHydration(page);
    await verifyHitTargetAndClick(page, 'button[aria-label="Open Chalo Action Center"]');
    await expect(page.locator('[role="dialog"][aria-label="Chalo Action Center"]')).toBeVisible();
    await expect.poll(() => page.evaluate(() => (window as any).__VANVAS_ACTIVE_LOCKS__)).toBeGreaterThanOrEqual(1);
    await page.click('[role="dialog"][aria-label="Chalo Action Center"] button:has-text("Plan a Trip")');
    await page.waitForURL('**/plan');
    await expect.poll(() => page.evaluate(() => (window as any).__VANVAS_ACTIVE_LOCKS__ || 0)).toBe(0);

    // 10. Ask VANVAS modal opens and closes cleanly with zero stuck lock
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await waitForHydration(page);
    await verifyHitTargetAndClick(page, '#floating-ask-vanvas-btn');
    await expect(page.locator('[role="dialog"][aria-label="Ask VANVAS Travel Assistant"]')).toBeVisible();
    await expect.poll(() => page.evaluate(() => (window as any).__VANVAS_ACTIVE_LOCKS__)).toBeGreaterThanOrEqual(1);
    await page.keyboard.press('Escape');
    await expect(page.locator('[role="dialog"][aria-label="Ask VANVAS Travel Assistant"]')).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => (window as any).__VANVAS_ACTIVE_LOCKS__ || 0)).toBe(0);

    // 11. Split Budget + AddBudgetItemModal + Packing Checklist modals
    await verifyHitTargetAndClick(page, '[data-testid="tool-split-budget"]');
    await expect(page.locator('text=Split a Budget').first()).toBeVisible();
    await page.click('button:has-text("Add Row")');
    await expect(page.locator('[role="dialog"][aria-label="Add Budget Item"]')).toBeVisible();
    // First Escape closes AddBudgetItemModal, second Escape closes Split a Budget
    await page.keyboard.press('Escape');
    await expect(page.locator('[role="dialog"][aria-label="Add Budget Item"]')).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(page.locator('[role="dialog"]')).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => (window as any).__VANVAS_ACTIVE_LOCKS__ || 0)).toBe(0);

    await verifyHitTargetAndClick(page, '[data-testid="tool-packing-checklist"]');
    await expect(page.locator('text=Packing Checklist').first()).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('[role="dialog"]')).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => (window as any).__VANVAS_ACTIVE_LOCKS__ || 0)).toBe(0);

    // 12. Header density & mobile account menu -> Friends
    await verifyHitTargetAndClick(page, '[data-testid="header-density-toggle"]');
    await expect(page.locator('[role="dialog"][aria-label="Layout view options"]')).toBeVisible();
    await verifyHitTargetAndClick(page, '[data-testid="header-density-toggle"]');

    await verifyHitTargetAndClick(page, 'button[aria-label="Open User Account Menu"]');
    await expect(page.locator('[role="menu"][aria-label="Account options"]')).toBeVisible();
    await page.locator('[role="menu"] a[href="/friends"]').click();
    await page.waitForURL('**/friends');

    expect(monitors.maxUpdateDepthErrors).toEqual([]);
    expect(monitors.pageErrors).toEqual([]);
  });

  test('Desktop (1440x900): Header links, destinations, Ask VANVAS, and user menu', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const monitors = await attachZeroLoopMonitors(page);
    await seedMockAuthAndApi(page);

    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await waitForHydration(page);
    await page.waitForSelector('header nav a[href="/explore"]');

    // Explore -> Plan -> Trips -> Circles -> Friends
    await verifyHitTargetAndClick(page, 'header nav a[href="/explore"]');
    await page.waitForURL('**/explore');

    await verifyHitTargetAndClick(page, 'header nav a[href="/plan"]');
    await page.waitForURL('**/plan');

    await verifyHitTargetAndClick(page, 'header nav a[href="/trips"]');
    await page.waitForURL('**/trips');

    await verifyHitTargetAndClick(page, 'header nav a[href="/circles"]');
    await page.waitForURL('**/circles');
    await expect(page.locator('h1').first()).toContainText('Crew Circles');

    await verifyHitTargetAndClick(page, 'header nav a[href="/friends"]');
    await page.waitForURL('**/friends');

    // Back Home -> Destination Card
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await waitForHydration(page);
    await verifyHitTargetAndClick(page, 'a[href^="/explore/"]:visible');
    await page.waitForURL(/\/explore\/[^/]+/);

    // Ask VANVAS on desktop
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await waitForHydration(page);
    await verifyHitTargetAndClick(page, 'header button[title="Ask VANVAS Travel Assistant"]');
    await expect(page.locator('[role="dialog"][aria-label="Ask VANVAS Travel Assistant"]')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect.poll(() => page.evaluate(() => (window as any).__VANVAS_ACTIVE_LOCKS__ || 0)).toBe(0);

    // Desktop User Menu -> Circles
    await verifyHitTargetAndClick(page, 'header button[aria-haspopup="true"]:visible');
    await page.locator('header a[href="/circles"]:visible').last().click();
    await page.waitForURL('**/circles');

    expect(monitors.maxUpdateDepthErrors).toEqual([]);
    expect(monitors.pageErrors).toEqual([]);
  });

  test('Scenarios A, B & F: Service Worker Controller Transition, First Install & Authenticated Session Continuity', async ({ browser }) => {
    let swVersion = 'vanvas-v3';
    const upstreamUrl = new URL(BASE_URL);

    // Local reverse proxy so Chromium's ServiceWorker engine fetches real HTTP /sw.js v3 -> v4 bytes
    const proxyServer = http.createServer((req, res) => {
      if (req.url?.startsWith('/sw.js')) {
        res.writeHead(200, {
          'Content-Type': 'application/javascript; charset=utf-8',
          'Cache-Control': 'no-store, max-age=0',
        });
        res.end(`
          const CACHE_VERSION = '${swVersion}';
          self.addEventListener('install', () => self.skipWaiting());
          self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
          self.addEventListener('message', (e) => {
            if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
            if (e.data && e.data.type === 'GET_DIAGNOSTICS' && e.ports && e.ports[0]) {
              e.ports[0].postMessage({ cacheVersion: CACHE_VERSION, scriptVersion: 'test-' + CACHE_VERSION });
            }
          });
        `);
        return;
      }

      const proxyReq = http.request(
        {
          hostname: upstreamUrl.hostname,
          port: Number(upstreamUrl.port || 80),
          path: req.url,
          method: req.method,
          headers: req.headers,
        },
        (proxyRes) => {
          res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
          proxyRes.pipe(res, { end: true });
        }
      );
      req.pipe(proxyReq, { end: true });
    });

    await new Promise<void>((resolve) => proxyServer.listen(0, '127.0.0.1', () => resolve()));
    const address = proxyServer.address();
    const proxyPort = typeof address === 'object' && address ? address.port : 3099;
    const proxyOrigin = `http://127.0.0.1:${proxyPort}`;

    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    try {
      const page = await context.newPage();
      await page.addInitScript(({ user }) => {
        localStorage.setItem('vanvas_token', 'persisted-auth-jwt');
        localStorage.setItem('vanvas_user_profile', JSON.stringify(user));
      }, { user: DEMO_USER });

      await page.route('**/api/v1/**', async (route) => {
        const url = route.request().url();
        if (url.includes('/auth/me')) {
          return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(DEMO_USER) });
        }
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      });

      let loadEvents = 0;
      page.on('load', () => {
        loadEvents++;
      });

      // Scenario B: Fresh install (no prior controller) -> ZERO extra reload!
      await page.goto(`${proxyOrigin}/circles?tab=mine`, { waitUntil: 'domcontentloaded' });
      await waitForHydration(page);
      await expect.poll(
        () => page.evaluate(() => Boolean(navigator.serviceWorker.controller)),
        { timeout: 10000 }
      ).toBe(true);
      await page.waitForTimeout(800);
      expect(loadEvents).toBe(1);

      const swStateBefore = await page.evaluate(() => ({
        controlled: Boolean(navigator.serviceWorker.controller),
        token: localStorage.getItem('vanvas_token'),
      }));
      expect(swStateBefore.controlled).toBe(true);
      expect(swStateBefore.token).toBe('persisted-auth-jwt');

      // Scenario A + F: Update deployed SW to vanvas-v4 while authenticated page on /circles?tab=mine is open
      swVersion = 'vanvas-v4';
      await page.evaluate(async () => {
        const reg = await navigator.serviceWorker.getRegistration('/');
        if (reg) await reg.update();
      });

      // Wait for single automatic reload caused by controllerchange
      await expect.poll(() => loadEvents, { timeout: 20000 }).toBe(2);
      await waitForHydration(page);
      await page.waitForTimeout(800);
      expect(loadEvents).toBe(2); // Exactly 1 reload, zero loop

      // Verify URL + query params + auth session preserved after reload
      expect(page.url()).toBe(`${proxyOrigin}/circles?tab=mine`);
      const postReload = await page.evaluate(async () => {
        await new Promise((r) => setTimeout(r, 300));
        return {
          token: localStorage.getItem('vanvas_token'),
          diag: (window as any).__VANVAS_NAV_DIAGNOSTICS__,
        };
      });
      expect(postReload.token).toBe('persisted-auth-jwt');
      expect(postReload.diag?.reloadedOnControllerChange).toBe(true);
      expect(postReload.diag?.cacheVersion).toBe('vanvas-v4');

      // Navigation continues working seamlessly afterwards
      await page.click('#vanvas-mobile-nav a[href="/explore"]');
      await page.waitForURL('**/explore');
    } finally {
      await context.close();
      (proxyServer as any).closeAllConnections?.();
      await new Promise<void>((resolve) => proxyServer.close(() => resolve()));
    }
  });

  test('Scenarios C & D: Stale Next.js Chunk Auto-Recovery (Single Reload) and Halted Repeat-Failure Banner', async ({ context }) => {
    const page = await context.newPage();
    await page.setViewportSize({ width: 390, height: 844 });

    let loadCount = 0;
    page.on('load', () => {
      loadCount++;
    });

    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await waitForHydration(page);
    expect(loadCount).toBe(1);

    // Scenario C: Simulate a genuine chunk load failure once -> triggers ONE guarded reload
    await page.evaluate(() => {
      window.dispatchEvent(
        new ErrorEvent('error', {
          message: 'ChunkLoadError: Loading chunk app/explore/page failed.',
          filename: '/_next/static/chunks/stale-explore.js',
        })
      );
    });

    await expect.poll(() => loadCount, { timeout: 10000 }).toBe(2);
    await waitForHydration(page);
    expect(loadCount).toBe(2);

    // Scenario D: Repeat same failure immediately before 6s stability reset -> MUST NOT reload endlessly; must show Reload Application UI
    await page.evaluate(() => {
      window.dispatchEvent(
        new ErrorEvent('error', {
          message: 'ChunkLoadError: Loading chunk app/explore/page failed.',
          filename: '/_next/static/chunks/stale-explore.js',
        })
      );
    });

    await expect(page.locator('[data-testid="vanvas-chunk-recovery-banner"]')).toBeVisible();
    await expect(page.locator('[data-testid="chunk-recovery-reload-btn"]')).toBeVisible();
    await page.waitForTimeout(1200);
    expect(loadCount).toBe(2); // No reload loop!
  });

  test('Scenario E: Offline fallback keeps public assets usable and protects private routes', async ({ context }) => {
    const page = await context.newPage();
    await page.setViewportSize({ width: 390, height: 844 });

    // Visit /explore so the real Service Worker installs, activates, claims this page, and precaches /offline + /explore
    await page.goto(`${BASE_URL}/explore`, { waitUntil: 'domcontentloaded' });
    await waitForHydration(page);
    await expect.poll(
      () => page.evaluate(() => Boolean(navigator.serviceWorker.controller)),
      { timeout: 15000 }
    ).toBe(true);
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    await expect(page.locator('h1').first()).toBeVisible();

    // Go offline
    await context.setOffline(true);

    // Public destination page cached in vanvas-shell-* renders offline
    await page.goto(`${BASE_URL}/explore`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1').first()).toBeVisible();

    // Private route (/trips) is NOT cached in public shell and falls back cleanly to /offline
    await page.goto(`${BASE_URL}/trips`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText(/Offline/i);

    await context.setOffline(false);
  });

  test('Scenario G: iOS Standalone Mode & ?debugNavigation=1 Diagnostics Overlay', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
    });
    const page = await context.newPage();

    await page.addInitScript(() => {
      Object.defineProperty(window.navigator, 'standalone', { value: true, configurable: true });
    });

    await page.goto(`${BASE_URL}/?debugNavigation=1`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="vanvas-nav-diagnostics"]');
    await expect(page.locator('[data-testid="vanvas-nav-diagnostics"]')).toContainText('NAV DIAGNOSTICS');

    // Bottom navigation works in iOS standalone mode
    await verifyHitTargetAndClick(page, '#vanvas-mobile-nav a[href="/explore"]');
    await page.waitForURL('**/explore');

    await verifyHitTargetAndClick(page, '#vanvas-mobile-nav a[href="/circles"]');
    await page.waitForURL('**/circles');

    await context.close();
  });
});
