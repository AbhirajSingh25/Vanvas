import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const pvrContent = fs.readFileSync('lib/placeVisualResolver.ts', 'utf8');
const publicDir = path.resolve('public');

function fileMd5(relPath) {
  if (!relPath) return null;
  const clean = relPath.replace(/^\//, '').replace(/\//g, path.sep);
  const full = path.join(publicDir, clean);
  if (fs.existsSync(full)) {
    return crypto.createHash('md5').update(fs.readFileSync(full)).digest('hex');
  }
  const base = full.replace(/\.[^/.]+$/, "");
  if (fs.existsSync(base + '.jpg')) {
    return crypto.createHash('md5').update(fs.readFileSync(base + '.jpg')).digest('hex');
  }
  if (fs.existsSync(base + '.webp')) {
    return crypto.createHash('md5').update(fs.readFileSync(base + '.webp')).digest('hex');
  }
  return null;
}

// Extract all entry keys and imageUrl
const entryRegex = /"([^"]+:[^"]+)":\s*\{[\s\S]*?imageUrl:\s*["']([^"']+)["']/g;
const mappings = [];
let m;
while ((m = entryRegex.exec(pvrContent)) !== null) {
  mappings.push({ key: m[1], img: m[2] });
}

console.log(`Total exact place entries extracted: ${mappings.length}`);

const hashes = new Map();
let missing = 0;
const destCounts = {};

for (const { key, img } of mappings) {
  const dest = key.split(':')[0];
  destCounts[dest] = (destCounts[dest] || 0) + 1;
  const h = fileMd5(img);
  if (!h) {
    missing++;
    console.log(`Missing file for ${key}: ${img}`);
  } else {
    if (!hashes.has(h)) hashes.set(h, []);
    hashes.get(h).push(`${key} (${img})`);
  }
}

console.log(`Places with verified existing files on disk: ${mappings.length - missing}`);
console.log(`Unique visual hashes across all exact place artworks: ${hashes.size}`);
console.log(`Destinations covered: ${Object.keys(destCounts).length}`);
console.log(`Sample destination breakdown:`, Object.entries(destCounts).slice(0, 10));

const dups = [...hashes.entries()].filter(([h, list]) => list.length > 1);
console.log(`Duplicate visual hashes across places: ${dups.length}`);
for (const [h, list] of dups.slice(0, 5)) {
  console.log(` - Hash ${h.slice(0, 8)} shared by:`, list);
}
