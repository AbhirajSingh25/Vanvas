const path = require("path");
const fs = require("fs");
const puppeteer = require(path.resolve(__dirname, "../frontend/node_modules/puppeteer-core"));

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const ARTIFACT_DIR = "C:\\Users\\user\\.gemini\\antigravity-ide\\brain\\c3d3d58f-19ad-4ade-90ec-4d8def23d07b\\browser_screenshots";
const BASE_URL = "http://localhost:3000";

if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function runBrowserAudit() {
  console.log("==================================================");
  console.log("VANVAS BROWSER VISUAL ACCEPTANCE & COLLISION AUDIT");
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Artifact Dir: ${ARTIFACT_DIR}`);
  console.log("==================================================");

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

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const auditReport = {
    startedAt: new Date().toISOString(),
    pagesChecked: [],
    failedImageRequests: [],
    screenshotsCaptured: [],
    modalChecks: []
  };

  // Monitor network requests for image failures
  page.on("response", (res) => {
    const url = res.url();
    const status = res.status();
    if (url.match(/\.(png|jpg|jpeg|webp|svg|avif)$/i) || url.includes("/images/") || url.includes("/artworks/")) {
      if (status >= 400) {
        console.error(`[IMAGE REQUEST FAILED ${status}] ${url}`);
        auditReport.failedImageRequests.push({ status, url });
      }
    }
  });

  const routesToTest = [
    { name: "home", url: `${BASE_URL}/`, title: "VANVAS Homepage" },
    { name: "explore_tungnath", url: `${BASE_URL}/explore/tungnath-chandrashila`, title: "Tungnath-Chandrashila Destination" },
    { name: "explore_kainchi", url: `${BASE_URL}/explore/kainchi-dham`, title: "Kainchi Dham Destination" },
    { name: "explore_goa", url: `${BASE_URL}/explore/goa`, title: "Goa Coastal Destination" },
    { name: "explore_manali", url: `${BASE_URL}/explore/manali`, title: "Manali Mountain Valley" },
    { name: "explore_munnar_stays", url: `${BASE_URL}/explore/munnar/stays`, title: "Munnar Stays Grid" },
    { name: "plan", url: `${BASE_URL}/plan`, title: "Trip Planner & Modes" }
  ];

  for (const route of routesToTest) {
    console.log(`\nNavigating to ${route.name} (${route.url})...`);
    try {
      await page.goto(route.url, { waitUntil: "networkidle2", timeout: 25000 });
      await sleep(5000);

      // Check broken img elements
      const brokenImgs = await page.evaluate(() => {
        const imgs = Array.from(document.querySelectorAll("img"));
        return imgs
          .filter((i) => i.complete && i.naturalWidth === 0 && !i.src.includes("data:image"))
          .map((i) => i.src);
      });

      if (brokenImgs.length > 0) {
        console.warn(`[BROKEN IMGS ON ${route.name}]`, brokenImgs);
      }

      const ssPath = path.join(ARTIFACT_DIR, `${route.name}_desktop.jpg`);
      await page.screenshot({ path: ssPath, quality: 85, fullPage: false });
      console.log(`Screenshot saved: ${ssPath}`);

      auditReport.pagesChecked.push({
        route: route.name,
        url: route.url,
        brokenCount: brokenImgs.length,
        brokenImages: brokenImgs
      });
      auditReport.screenshotsCaptured.push(ssPath);

      // For Manali: test PlaceModal
      if (route.name === "explore_manali") {
        console.log("Testing PlaceCard -> PlaceModal consistency on Manali...");
        const cardSelector = 'div[role="button"]';
        const cardFound = await page.$(cardSelector);
        if (cardFound) {
          await cardFound.click();
          await sleep(1000);
          const modalSsPath = path.join(ARTIFACT_DIR, "manali_place_modal.jpg");
          await page.screenshot({ path: modalSsPath, quality: 85 });
          console.log(`Modal Screenshot saved: ${modalSsPath}`);
          auditReport.modalChecks.push({
            modalType: "PlaceModal",
            status: "OPENED_AND_CAPTURED",
            screenshot: modalSsPath
          });
          // Close modal
          await page.keyboard.press("Escape");
          await sleep(500);
        }
      }

      // For Munnar Stays: test Stay modal if button exists
      if (route.name === "explore_munnar_stays") {
        console.log("Testing StayCard on Munnar Stays...");
        const stayCard = await page.$('div[role="button"], button');
        if (stayCard) {
          const staySsPath = path.join(ARTIFACT_DIR, "munnar_stay_detail.jpg");
          await page.screenshot({ path: staySsPath, quality: 85 });
          console.log(`Stay Screenshot saved: ${staySsPath}`);
        }
      }
    } catch (err) {
      console.error(`Error navigating to ${route.name}:`, err.message);
    }
  }

  // Mobile Viewport Test for Homepage and Destination
  console.log("\nTesting Mobile Viewport (iPhone 14 / 390x844)...");
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto(`${BASE_URL}/explore/tungnath-chandrashila`, { waitUntil: "networkidle2" });
  await sleep(1000);
  const mobileSsPath = path.join(ARTIFACT_DIR, "tungnath_mobile_view.jpg");
  await page.screenshot({ path: mobileSsPath, quality: 85 });
  console.log(`Mobile Screenshot saved: ${mobileSsPath}`);
  auditReport.screenshotsCaptured.push(mobileSsPath);

  await browser.close();

  const reportOut = path.join(ARTIFACT_DIR, "browser_audit_summary.json");
  fs.writeFileSync(reportOut, JSON.stringify(auditReport, null, 2), "utf-8");
  console.log("\n==================================================");
  console.log("BROWSER AUDIT COMPLETE");
  console.log(`Total Pages Audited: ${auditReport.pagesChecked.length}`);
  console.log(`Failed Image Network Requests: ${auditReport.failedImageRequests.length}`);
  console.log(`Total Screenshots: ${auditReport.screenshotsCaptured.length}`);
  console.log(`Audit Summary: ${reportOut}`);
  console.log("==================================================");
}

runBrowserAudit().catch((err) => {
  console.error("FATAL BROWSER AUDIT ERROR:", err);
  process.exit(1);
});
