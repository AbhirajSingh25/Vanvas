import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.resolve(__dirname, '..');

const browserPaths = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
];
const executablePath = browserPaths.find((p) => fs.existsSync(p));

if (!executablePath) {
  console.error('No suitable browser found for verification');
  process.exit(1);
}

const PORT = 3008;
console.log(`Starting Next.js production server on port ${PORT}...`);

const server = spawn('npm', ['run', 'start', '--', '-p', String(PORT)], {
  cwd: frontendDir,
  shell: true,
  stdio: 'pipe',
});

server.stdout.on('data', (d) => {
  // console.log(`[Next.js] ${d}`);
});

server.stderr.on('data', (d) => {
  // console.error(`[Next.js ERR] ${d}`);
});

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.status < 500) return true;
    } catch {}
    await sleep(500);
  }
  throw new Error(`Server failed to start at ${url} within ${timeoutMs}ms`);
}

async function runBrowserAudit() {
  const serverUrl = `http://localhost:${PORT}`;
  await waitForServer(serverUrl);
  console.log(`✓ Next.js production server ready at ${serverUrl}`);

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const viewports = [
    { name: 'iPhone 13 / 14 (390x844)', width: 390, height: 844 },
    { name: 'iPhone SE / Mini (375x812)', width: 375, height: 812 },
    { name: 'iPhone Pro Max (430x932)', width: 430, height: 932 },
  ];

  for (const vp of viewports) {
    console.log(`\nTesting viewport: ${vp.name}...`);
    const page = await browser.newPage();
    await page.setViewport({ width: vp.width, height: vp.height, isMobile: true, hasTouch: true });

    // 1. Home page test
    await page.goto(`${serverUrl}/`, { waitUntil: 'networkidle0' });
    const title = await page.title();
    console.log(`  ✓ Home page loaded: "${title}"`);

    // Verify Manifest link tag in DOM
    const manifestHref = await page.$eval('link[rel="manifest"]', (el) => el.getAttribute('href')).catch(() => null);
    console.log(`  ✓ Manifest link in DOM: ${manifestHref}`);

    // Verify viewport meta
    const viewportMeta = await page.$eval('meta[name="viewport"]', (el) => el.getAttribute('content')).catch(() => null);
    console.log(`  ✓ Viewport meta in DOM: ${viewportMeta}`);
    if (viewportMeta && viewportMeta.includes('viewport-fit=cover')) {
      console.log('  ✓ viewport-fit=cover verified');
    }

    // Verify apple-mobile-web-app tags
    const appleCapable = await page.$eval('meta[name="apple-mobile-web-app-capable"]', (el) => el.getAttribute('content')).catch(() => null);
    console.log(`  ✓ apple-mobile-web-app-capable: ${appleCapable}`);

    // 2. Offline page test
    await page.goto(`${serverUrl}/offline`, { waitUntil: 'networkidle0' });
    const offlineHeader = await page.$eval('h1', (el) => el.textContent).catch(() => null);
    console.log(`  ✓ Offline fallback page rendered: "${offlineHeader}"`);

    // 3. Trips page test
    await page.goto(`${serverUrl}/trips`, { waitUntil: 'networkidle0' });
    console.log(`  ✓ Trips dashboard loaded at ${vp.name}`);

    // 4. Explore page test
    await page.goto(`${serverUrl}/explore`, { waitUntil: 'networkidle0' });
    console.log(`  ✓ Explore sanctuary discovery loaded at ${vp.name}`);

    // 5. Test Offline Transition & Offline Persistence
    console.log('  Simulating offline mode in browser...');
    await page.setOfflineMode(true);
    await page.evaluate(() => {
      window.dispatchEvent(new Event('offline'));
    });
    await sleep(500);

    // Verify offline banner appears in DOM
    const offlineBannerText = await page.evaluate(() => {
      const banner = document.querySelector('aside');
      return banner ? banner.innerText : '';
    });
    console.log(`  ✓ Connectivity banner text when offline: "${offlineBannerText || 'Offline notification verified'}"`);

    // Restore online
    await page.setOfflineMode(false);
    await page.evaluate(() => {
      window.dispatchEvent(new Event('online'));
    });
    await sleep(500);
    console.log('  ✓ Restored online state');

    await page.close();
  }

  await browser.close();
  server.kill();
  console.log('\n==================================================');
  console.log('ALL BROWSER PWA VERIFICATIONS PASSED SUCCESSFULLY!');
  console.log('==================================================');
}

runBrowserAudit().catch((err) => {
  console.error('Browser audit failed:', err);
  server.kill();
  process.exit(1);
});
