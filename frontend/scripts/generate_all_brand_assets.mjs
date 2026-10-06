import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const frontendDir = path.resolve(__dirname, '..');
const publicDir = path.join(frontendDir, 'public');
const iconsDir = path.join(publicDir, 'icons');
const androidResDir = path.join(frontendDir, 'android', 'app', 'src', 'main', 'res');

[publicDir, iconsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const browserPaths = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
];
const executablePath = browserPaths.find((p) => fs.existsSync(p));

if (!executablePath) {
  console.error('No suitable browser found for asset generation');
  process.exit(1);
}

// Function to generate an ICO file from an array of PNG buffers with their dimensions
function createIco(images) {
  const count = images.length;
  const headerSize = 6 + count * 16;
  let offset = headerSize;

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type 1 = ICO
  header.writeUInt16LE(count, 4); // Number of images

  const dirEntries = [];
  const imageBuffers = [];

  for (const img of images) {
    const entry = Buffer.alloc(16);
    const width = img.width >= 256 ? 0 : img.width;
    const height = img.height >= 256 ? 0 : img.height;

    entry.writeUInt8(width, 0);
    entry.writeUInt8(height, 1);
    entry.writeUInt8(0, 2); // Colors (0 = no palette)
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(img.buffer.length, 8); // Size of image data
    entry.writeUInt32LE(offset, 12); // Offset to image data

    dirEntries.push(entry);
    imageBuffers.push(img.buffer);
    offset += img.buffer.length;
  }

  return Buffer.concat([header, ...dirEntries, ...imageBuffers]);
}

// SVG templates for authentic VANVAS branding
function getEmblemSvg({ fill = '#FAF4E8', border = '#B49252', path = '#173B32', accent = '#B65E3C', trail = '#B49252' } = {}) {
  return `
    <svg viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%;">
      <!-- Outer Hexagonal Expedition Seal -->
      <polygon
        points="27,3 49,15 49,39 27,51 5,39 5,15"
        fill="${fill}"
        stroke="${border}"
        stroke-width="2"
        stroke-linejoin="round"
      />
      <!-- Inner Top Devanagari Shirorekha / Ridge Line -->
      <line x1="14" y1="15" x2="40" y2="15" stroke="${accent}" stroke-width="2.6" stroke-linecap="round" />
      <!-- Winding Mountain Pass & Valley Trail Geometry (V mark) -->
      <path
        d="M17 17L27 37L37 17"
        stroke="${path}"
        stroke-width="3.4"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <!-- Central Expedition River Path -->
      <path
        d="M27 22V43"
        stroke="${trail}"
        stroke-width="2"
        stroke-dasharray="2 3"
        stroke-linecap="round"
      />
      <!-- Dawn Horizon / Peak Sun -->
      <circle cx="27" cy="10" r="2.4" fill="${accent}" />
    </svg>
  `;
}

// Full Splash Screen SVG (with authentic typography)
function getSplashHtml({ width, height }) {
  const isLandscape = width > height;
  const emblemSize = isLandscape ? Math.min(Math.round(height * 0.28), 120) : Math.min(Math.round(width * 0.24), 130);
  const wordmarkSize = isLandscape ? Math.min(Math.round(height * 0.08), 38) : Math.min(Math.round(width * 0.08), 36);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          width: ${width}px;
          height: ${height}px;
          background: #102C26;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          color: #FAF4E8;
        }
        .container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
        }
        .star {
          color: #B49252;
          font-size: 20px;
          opacity: 0.9;
        }
        .emblem-box {
          width: ${emblemSize}px;
          height: ${emblemSize}px;
        }
        .wordmark {
          font-family: Georgia, 'Playfair Display', 'Times New Roman', serif;
          font-weight: 900;
          font-size: ${wordmarkSize}px;
          letter-spacing: 0.24em;
          color: #FAF4E8;
          text-align: center;
          margin-top: 4px;
        }
        .signature {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: Georgia, 'Playfair Display', serif;
          font-style: italic;
          font-size: 11px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #B49252;
          opacity: 0.95;
        }
        .line {
          width: 24px;
          height: 1px;
          background: #B49252;
          opacity: 0.5;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="star">✦</div>
        <div class="emblem-box">
          ${getEmblemSvg({ fill: '#FAF4E8', border: '#B49252', path: '#173B32', accent: '#B65E3C', trail: '#B49252' })}
        </div>
        <div class="wordmark">VANVAS</div>
        <div class="signature">
          <div class="line"></div>
          <div>BY THE SORTED CLUB</div>
          <div class="line"></div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Icon HTML wrapper
function getIconHtml({ size, bg = '#173B32', shape = 'square', paddingPct = 0.18 }) {
  const pad = Math.round(size * paddingPct);
  const emblemSize = size - pad * 2;
  const borderRadius = shape === 'circle' ? '50%' : shape === 'squircle' ? '22%' : '0%';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          width: ${size}px;
          height: ${size}px;
          background: ${bg === 'transparent' ? 'transparent' : bg};
          border-radius: ${borderRadius};
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .emblem-wrapper {
          width: ${emblemSize}px;
          height: ${emblemSize}px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      </style>
    </head>
    <body>
      <div class="emblem-wrapper">
        ${getEmblemSvg({ fill: '#FAF4E8', border: '#B49252', path: '#173B32', accent: '#B65E3C', trail: '#B49252' })}
      </div>
    </body>
    </html>
  `;
}

// Android Adaptive Foreground HTML (108dp canvas, centered 66dp emblem, transparent bg)
function getAdaptiveForegroundHtml({ size }) {
  const emblemSize = Math.round(size * 0.58);
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          width: ${size}px;
          height: ${size}px;
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .emblem-wrapper {
          width: ${emblemSize}px;
          height: ${emblemSize}px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      </style>
    </head>
    <body>
      <div class="emblem-wrapper">
        ${getEmblemSvg({ fill: '#FAF4E8', border: '#B49252', path: '#173B32', accent: '#B65E3C', trail: '#B49252' })}
      </div>
    </body>
    </html>
  `;
}

async function run() {
  console.log('🚀 Starting VANVAS Brand & Icon Asset Generator...');
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  // 1. Generate Favicon SVG directly
  const faviconSvgContent = `
<svg viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="54" height="54" rx="12" fill="#173B32"/>
  <polygon points="27,6 47,17 47,39 27,50 7,39 7,17" fill="#FAF4E8" stroke="#B49252" stroke-width="2" stroke-linejoin="round"/>
  <line x1="15" y1="17" x2="39" y2="17" stroke="#B65E3C" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M18 19L27 38L36 19" stroke="#173B32" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M27 24V43" stroke="#B49252" stroke-width="2" stroke-dasharray="2 3" stroke-linecap="round"/>
  <circle cx="27" cy="12" r="2.2" fill="#B65E3C"/>
</svg>`.trim();

  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), faviconSvgContent, 'utf8');
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), faviconSvgContent, 'utf8');
  console.log('✓ Created public/favicon.svg and public/icon.svg');

  // 2. Generate Favicon PNGs
  const faviconSizes = [16, 32, 48];
  const icoBuffers = [];

  for (const size of faviconSizes) {
    const html = getIconHtml({ size, bg: '#173B32', shape: 'square', paddingPct: 0.12 });
    await page.setViewport({ width: size, height: size, deviceScaleFactor: 1 });
    await page.setContent(html);
    const dest = path.join(publicDir, `favicon-${size}x${size}.png`);
    const buffer = await page.screenshot({ path: dest, omitBackground: false, type: 'png' });
    icoBuffers.push({ width: size, height: size, buffer });
    console.log(`✓ Created public/favicon-${size}x${size}.png`);
  }

  // 3. Generate favicon.ico (containing 16x16, 32x32, 48x48)
  const icoData = createIco(icoBuffers);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoData);
  console.log('✓ Created multi-resolution public/favicon.ico');

  // 4. Generate Web & PWA App Icons
  const pwaIcons = [
    { name: 'apple-touch-icon.png', dir: iconsDir, size: 180, bg: '#173B32', shape: 'square', pad: 0.14 },
    { name: 'apple-icon.png', dir: publicDir, size: 180, bg: '#173B32', shape: 'square', pad: 0.14 },
    { name: 'icon-192.png', dir: iconsDir, size: 192, bg: '#173B32', shape: 'square', pad: 0.14 },
    { name: 'icon-512.png', dir: iconsDir, size: 512, bg: '#173B32', shape: 'square', pad: 0.14 },
    { name: 'icon.png', dir: publicDir, size: 512, bg: '#173B32', shape: 'square', pad: 0.14 },
    { name: 'icon-maskable-192.png', dir: iconsDir, size: 192, bg: '#173B32', shape: 'square', pad: 0.22 },
    { name: 'icon-maskable-512.png', dir: iconsDir, size: 512, bg: '#173B32', shape: 'square', pad: 0.22 },
  ];

  for (const item of pwaIcons) {
    const html = getIconHtml({ size: item.size, bg: item.bg, shape: item.shape, paddingPct: item.pad });
    await page.setViewport({ width: item.size, height: item.size, deviceScaleFactor: 1 });
    await page.setContent(html);
    const dest = path.join(item.dir, item.name);
    await page.screenshot({ path: dest, omitBackground: false, type: 'png' });
    console.log(`✓ Created ${path.relative(frontendDir, dest)} (${item.size}x${item.size})`);
  }

  // 5. Generate Android App Launcher Icons (Legacy, Round, and Adaptive Foreground)
  const androidDensities = [
    { name: 'mipmap-mdpi', iconSize: 48, fgSize: 108 },
    { name: 'mipmap-hdpi', iconSize: 72, fgSize: 162 },
    { name: 'mipmap-xhdpi', iconSize: 96, fgSize: 216 },
    { name: 'mipmap-xxhdpi', iconSize: 144, fgSize: 324 },
    { name: 'mipmap-xxxhdpi', iconSize: 192, fgSize: 432 },
  ];

  for (const d of androidDensities) {
    const densityDir = path.join(androidResDir, d.name);
    if (!fs.existsSync(densityDir)) fs.mkdirSync(densityDir, { recursive: true });

    // ic_launcher.png (legacy square)
    const squareHtml = getIconHtml({ size: d.iconSize, bg: '#173B32', shape: 'squircle', paddingPct: 0.14 });
    await page.setViewport({ width: d.iconSize, height: d.iconSize, deviceScaleFactor: 1 });
    await page.setContent(squareHtml);
    await page.screenshot({ path: path.join(densityDir, 'ic_launcher.png'), omitBackground: false, type: 'png' });

    // ic_launcher_round.png (legacy round)
    const roundHtml = getIconHtml({ size: d.iconSize, bg: '#173B32', shape: 'circle', paddingPct: 0.16 });
    await page.setViewport({ width: d.iconSize, height: d.iconSize, deviceScaleFactor: 1 });
    await page.setContent(roundHtml);
    await page.screenshot({ path: path.join(densityDir, 'ic_launcher_round.png'), omitBackground: false, type: 'png' });

    // ic_launcher_foreground.png (Adaptive icon layer)
    const fgHtml = getAdaptiveForegroundHtml({ size: d.fgSize });
    await page.setViewport({ width: d.fgSize, height: d.fgSize, deviceScaleFactor: 1 });
    await page.setContent(fgHtml);
    await page.screenshot({ path: path.join(densityDir, 'ic_launcher_foreground.png'), omitBackground: true, type: 'png' });

    console.log(`✓ Created Android ${d.name} launcher assets`);
  }

  // 6. Generate Android Splash Screens
  const splashVariants = [
    { dir: 'drawable', name: 'splash.png', width: 480, height: 800 },
    { dir: 'drawable-port-mdpi', name: 'splash.png', width: 320, height: 480 },
    { dir: 'drawable-port-hdpi', name: 'splash.png', width: 480, height: 800 },
    { dir: 'drawable-port-xhdpi', name: 'splash.png', width: 720, height: 1280 },
    { dir: 'drawable-port-xxhdpi', name: 'splash.png', width: 1080, height: 1920 },
    { dir: 'drawable-port-xxxhdpi', name: 'splash.png', width: 1440, height: 2560 },
    { dir: 'drawable-land-mdpi', name: 'splash.png', width: 480, height: 320 },
    { dir: 'drawable-land-hdpi', name: 'splash.png', width: 800, height: 480 },
    { dir: 'drawable-land-xhdpi', name: 'splash.png', width: 1280, height: 720 },
    { dir: 'drawable-land-xxhdpi', name: 'splash.png', width: 1920, height: 1080 },
    { dir: 'drawable-land-xxxhdpi', name: 'splash.png', width: 2560, height: 1440 },
  ];

  for (const s of splashVariants) {
    const targetDir = path.join(androidResDir, s.dir);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

    const html = getSplashHtml({ width: s.width, height: s.height });
    await page.setViewport({ width: s.width, height: s.height, deviceScaleFactor: 1 });
    await page.setContent(html);
    await page.screenshot({ path: path.join(targetDir, s.name), omitBackground: false, type: 'png' });
    console.log(`✓ Created Android splash ${s.dir}/${s.name} (${s.width}x${s.height})`);
  }

  await browser.close();
  console.log('✨ All VANVAS brand, icon, and splash assets generated successfully!');
}

run().catch((err) => {
  console.error('Error generating assets:', err);
  process.exit(1);
});
