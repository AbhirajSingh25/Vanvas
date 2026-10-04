import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const frontendDir = path.resolve(__dirname, '..');
const publicDir = path.join(frontendDir, 'public');
const iconsDir = path.join(publicDir, 'icons');
const sourceIconPath = path.join(publicDir, 'icon.png');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Locate Chrome or Edge
const browserPaths = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
];

const executablePath = browserPaths.find((p) => fs.existsSync(p));
if (!executablePath) {
  console.error('No suitable browser found for icon rendering');
  process.exit(1);
}

const sourceIconBase64 = fs.readFileSync(sourceIconPath).toString('base64');
const dataUri = `data:image/png;base64,${sourceIconBase64}`;

async function generateIcons() {
  console.log('Launching browser to generate PWA icons from authentic VANVAS branding...');
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  const iconConfigs = [
    { name: 'icon-192.png', size: 192, maskable: false },
    { name: 'icon-512.png', size: 512, maskable: false },
    { name: 'icon-maskable-192.png', size: 192, maskable: true },
    { name: 'icon-maskable-512.png', size: 512, maskable: true },
    { name: 'apple-touch-icon.png', size: 180, maskable: false },
  ];

  for (const config of iconConfigs) {
    const { name, size, maskable } = config;
    const padding = maskable ? Math.round(size * 0.1) : 0;
    const innerSize = size - padding * 2;
    const bgColor = '#FAF4E8';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            width: ${size}px;
            height: ${size}px;
            background: ${maskable ? bgColor : 'transparent'};
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
          }
          img {
            width: ${innerSize}px;
            height: ${innerSize}px;
            object-fit: contain;
          }
        </style>
      </head>
      <body>
        <img src="${dataUri}" />
      </body>
      </html>
    `;

    await page.setViewport({ width: size, height: size, deviceScaleFactor: 1 });
    await page.setContent(html);

    const destPath = path.join(iconsDir, name);
    await page.screenshot({
      path: destPath,
      omitBackground: !maskable,
      type: 'png',
    });

    console.log(`Generated: icons/${name} (${size}x${size}${maskable ? ' maskable' : ''})`);
  }

  await browser.close();
  console.log('All PWA icons generated successfully.');
}

generateIcons().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
