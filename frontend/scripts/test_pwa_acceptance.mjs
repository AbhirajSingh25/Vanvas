import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.resolve(__dirname, '..');

console.log('==================================================');
console.log('VANVAS PWA ACCEPTANCE & INTEGRITY AUDIT');
console.log('==================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`✓ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`✗ FAIL: ${message}`);
  }
}

// 1. Manifest Files Check
const manifestPath = path.join(frontendDir, 'public', 'manifest.webmanifest');
const manifestJsonPath = path.join(frontendDir, 'public', 'manifest.json');

assert(fs.existsSync(manifestPath), 'manifest.webmanifest exists in public directory');
assert(fs.existsSync(manifestJsonPath), 'manifest.json alias exists in public directory');

if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert(manifest.name === 'VANVAS — AI Travel Companion', 'Manifest name matches specification');
  assert(manifest.short_name === 'VANVAS', 'Manifest short_name matches specification');
  assert(manifest.start_url === '/', 'Manifest start_url is "/"');
  assert(manifest.scope === '/', 'Manifest scope is "/"');
  assert(manifest.display === 'standalone', 'Manifest display is "standalone"');
  assert(manifest.orientation === 'portrait', 'Manifest orientation is "portrait"');
  assert(manifest.theme_color === '#173B32', 'Manifest theme_color is authentic VANVAS forest green');
  assert(manifest.background_color === '#FAF4E8', 'Manifest background_color is authentic VANVAS parchment');
  assert(Array.isArray(manifest.icons) && manifest.icons.length >= 4, 'Manifest includes complete set of icons');

  // Verify icon files on disk
  for (const icon of manifest.icons) {
    const iconFilePath = path.join(frontendDir, 'public', icon.src.replace(/^\//, ''));
    assert(fs.existsSync(iconFilePath), `Icon file exists on disk: ${icon.src}`);
  }
}

// 2. Service Worker File Check
const swPath = path.join(frontendDir, 'public', 'sw.js');
assert(fs.existsSync(swPath), 'sw.js exists in public directory');

if (fs.existsSync(swPath)) {
  const swContent = fs.readFileSync(swPath, 'utf8');
  assert(swContent.includes('CACHE_STATIC') && swContent.includes('CACHE_SHELL'), 'sw.js uses versioned cache names');
  assert(swContent.includes("self.addEventListener('install'"), 'sw.js handles install event with precaching');
  assert(swContent.includes("self.addEventListener('activate'"), 'sw.js handles activate event with cache purging');
  assert(swContent.includes("self.addEventListener('fetch'"), 'sw.js handles fetch event with route strategies');
  assert(swContent.includes('/offline'), 'sw.js includes /offline fallback route');
  assert(swContent.includes('skipWaiting'), 'sw.js triggers skipWaiting to prevent stale-cache lockup');
  assert(swContent.includes('clients.claim'), 'sw.js triggers clients.claim on activation');
}

// 3. Offline Page Check
const offlinePagePath = path.join(frontendDir, 'app', 'offline', 'page.tsx');
assert(fs.existsSync(offlinePagePath), 'app/offline/page.tsx fallback page exists');
if (fs.existsSync(offlinePagePath)) {
  const offlineContent = fs.readFileSync(offlinePagePath, 'utf8');
  assert(offlineContent.includes('OFFLINE') || offlineContent.includes('Offline'), 'Offline page indicates offline state clearly');
  assert(offlineContent.includes('vanvas_offline_trip_'), 'Offline page reads cached offline trip packs');
}

// 4. Layout Metadata & Viewport Check
const layoutPath = path.join(frontendDir, 'app', 'layout.tsx');
assert(fs.existsSync(layoutPath), 'app/layout.tsx exists');
if (fs.existsSync(layoutPath)) {
  const layoutContent = fs.readFileSync(layoutPath, 'utf8');
  assert(layoutContent.includes('viewport: Viewport'), 'layout.tsx exports Viewport object');
  assert(layoutContent.includes('viewportFit: "cover"') || layoutContent.includes("viewportFit: 'cover'"), 'layout.tsx defines viewportFit cover');
  assert(layoutContent.includes('manifest: "/manifest.webmanifest"') || layoutContent.includes("manifest: '/manifest.webmanifest'"), 'layout.tsx declares PWA manifest link');
  assert(layoutContent.includes('appleWebApp:'), 'layout.tsx includes appleWebApp metadata');
  assert(layoutContent.includes('ServiceWorkerRegister'), 'layout.tsx renders ServiceWorkerRegister component');
  assert(layoutContent.includes('ConnectivityBanner'), 'layout.tsx renders ConnectivityBanner component');
  assert(layoutContent.includes('InstallPrompt'), 'layout.tsx renders InstallPrompt component');
}

// 5. Offline Trip Detail Fallback Check
const tripDetailPath = path.join(frontendDir, 'app', 'trips', '[id]', 'page.tsx');
assert(fs.existsSync(tripDetailPath), 'app/trips/[id]/page.tsx exists');
if (fs.existsSync(tripDetailPath)) {
  const tripContent = fs.readFileSync(tripDetailPath, 'utf8');
  assert(tripContent.includes('vanvas_offline_trip_'), 'trip detail page saves and retrieves offline trips');
  assert(tripContent.includes('isOfflineMode') || tripContent.includes('OFFLINE TRIP MODE'), 'trip detail page displays offline state indicator');
}

// 6. Auth Offline Resilience Check
const authContextPath = path.join(frontendDir, 'context', 'AuthContext.tsx');
assert(fs.existsSync(authContextPath), 'context/AuthContext.tsx exists');
if (fs.existsSync(authContextPath)) {
  const authContent = fs.readFileSync(authContextPath, 'utf8');
  assert(authContent.includes('vanvas_user_profile'), 'AuthContext caches user profile for offline session continuity');
  assert(authContent.includes('isNetworkError'), 'AuthContext protects session token when network is offline');
}

// 7. Ask VANVAS Offline Honesty Check
const askVanvasContextPath = path.join(frontendDir, 'context', 'AskVanvasContext.tsx');
assert(fs.existsSync(askVanvasContextPath), 'context/AskVanvasContext.tsx exists');
if (fs.existsSync(askVanvasContextPath)) {
  const askContent = fs.readFileSync(askVanvasContextPath, 'utf8');
  assert(askContent.includes('navigator.onLine'), 'AskVanvas checks online status before network dispatch');
  assert(askContent.includes('Ask VANVAS requires an active internet connection') || askContent.includes('unavailable offline'), 'AskVanvas reports honest offline status');
}

// 8. Weather Offline Honesty Check
const weatherCardPath = path.join(frontendDir, 'components', 'weather', 'VanvasWeatherCard.tsx');
assert(fs.existsSync(weatherCardPath), 'VanvasWeatherCard.tsx exists');
if (fs.existsSync(weatherCardPath)) {
  const weatherContent = fs.readFileSync(weatherCardPath, 'utf8');
  assert(weatherContent.includes('navigator.onLine'), 'Weather card detects offline status');
  assert(weatherContent.includes('Offline • Cached'), 'Weather card displays honest cached snapshot age when offline');
}

console.log('\n==================================================');
console.log(`SUMMARY: ${passedTests}/${totalTests} tests passed (${Math.round((passedTests / totalTests) * 100)}%)`);
console.log('==================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
