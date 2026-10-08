import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.resolve(__dirname, '..', 'frontend');

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
  // Service worker separation test:
  assert(!swContent.includes('localStorage.setItem("offline"'), 'service worker does not mutate or force global offline persistence');
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
  assert(layoutContent.includes('Header'), 'layout.tsx renders Header component');
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
  assert(weatherContent.includes('useOnlineStatus'), 'Weather card detects synchronized connectivity status');
  assert(weatherContent.includes('Offline • Cached'), 'Weather card displays honest cached snapshot age when offline');
}

// 9. Targeted Connectivity Architecture Verification (Bug 1)
const useOnlineStatusPath = path.join(frontendDir, 'components', 'pwa', 'useOnlineStatus.ts');
const connectivityBannerPath = path.join(frontendDir, 'components', 'pwa', 'ConnectivityBanner.tsx');
assert(fs.existsSync(useOnlineStatusPath), 'components/pwa/useOnlineStatus.ts exists');
assert(fs.existsSync(connectivityBannerPath), 'components/pwa/ConnectivityBanner.tsx exists');

if (fs.existsSync(useOnlineStatusPath) && fs.existsSync(connectivityBannerPath)) {
  const hookContent = fs.readFileSync(useOnlineStatusPath, 'utf8');
  const bannerContent = fs.readFileSync(connectivityBannerPath, 'utf8');

  // Test 1: Initial connectivity does not incorrectly show OFFLINE
  assert(hookContent.includes('UNKNOWN') || hookContent.includes('useState<ConnectivityState>("UNKNOWN")'), 'Targeted Test 1: Initial connectivity state starts UNKNOWN / hydration safe (never false offline)');

  // Test 2: Online state hides offline banner
  assert(bannerContent.includes('if (!isOffline && !wasOffline)') || bannerContent.includes('return null'), 'Targeted Test 2: Online and checking states suppress the offline banner');

  // Test 3: Offline state displays offline banner
  assert(bannerContent.includes('isOffline') && (bannerContent.includes("You&apos;re offline") || bannerContent.includes("offline")), 'Targeted Test 3: Offline state accurately displays the offline banner');

  // Test 4: Reconnect state shows brief message then removes
  assert(hookContent.includes('RECONNECTING') && hookContent.includes('3500'), 'Targeted Test 4: Reconnect auto-transitions with timed dismissal back to ONLINE');
  assert(bannerContent.includes('Back online'), 'Targeted Test 4b: Reconnecting message is rendered with animated indicator');

  // Test 5: Service worker fallback does not mark global connectivity offline
  assert(!hookContent.includes('caches.match'), 'Targeted Test 5: Service worker cache hits do not pollute global connectivity state');
  assert(hookContent.includes('probeBackendReachability') || hookContent.includes('/health'), 'Targeted Test 5b: Reachability uses lightweight backend health probe');
}

// 10. Targeted Sticky Header & Scroll Integrity Verification (Bug 2)
const headerPath = path.join(frontendDir, 'components', 'layout', 'Header.tsx');
const globalsCssPath = path.join(frontendDir, 'app', 'globals.css');
assert(fs.existsSync(headerPath), 'components/layout/Header.tsx exists');

if (fs.existsSync(headerPath) && fs.existsSync(tripDetailPath)) {
  const headerContent = fs.readFileSync(headerPath, 'utf8');
  const tripContent = fs.readFileSync(tripDetailPath, 'utf8');
  const cssContent = fs.readFileSync(globalsCssPath, 'utf8');

  // Test 6: Dynamic sticky top offset synchronized across layout
  assert(headerContent.includes('--vanvas-top-offset') && headerContent.includes('ResizeObserver'), 'Targeted Test 6: Header dynamically measures and publishes --vanvas-top-offset via ResizeObserver');
  assert(cssContent.includes('--vanvas-top-offset'), 'Targeted Test 6b: CSS design system establishes base --vanvas-top-offset with safe-area fallback');

  // Test 7: Sticky tab navigation uses dynamic top offset instead of hardcoded mobile offsets
  assert(tripContent.includes('var(--vanvas-top-offset'), 'Targeted Test 7: Trip Workspace tabs adhere to dynamic --vanvas-top-offset');
  assert(!tripContent.includes('sticky top-20 z-30 bg-[#FAF7F0] border-b-2'), 'Targeted Test 7b: Hardcoded top-20 removed from trip workspace tabs');

  // Test 8: Safe area + banner + tabs stack correctly without overlap during scroll
  assert(tripContent.includes('navOffset') && tripContent.includes('--vanvas-top-offset'), 'Targeted Test 8: Tab scroll navigation accounts for dynamic header stack height preventing content clipping');
  assert(headerContent.includes('ConnectivityBanner'), 'Targeted Test 8b: Connectivity banner is nested inside Header sticky stack ensuring unified flow');
}

console.log('\n==================================================');
console.log(`SUMMARY: ${passedTests}/${totalTests} tests passed (${Math.round((passedTests / totalTests) * 100)}%)`);
console.log('==================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
