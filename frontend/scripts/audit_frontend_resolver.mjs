import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Read placeVisualResolver.ts and canonicalDestinations.ts
const pvrContent = fs.readFileSync('lib/placeVisualResolver.ts', 'utf8');
const cdContent = fs.readFileSync('lib/canonicalDestinations.ts', 'utf8');
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

// Extract canonical destinations
const destMatches = [...cdContent.matchAll(/slug:\s*["']([^"']+)["']/g)].map(m => m[1]);
const uniqueDestSlugs = [...new Set(destMatches)];
console.log(`Found ${uniqueDestSlugs.length} unique canonical destination slugs in frontend.`);

// Extract all place visual mappings from placeVisualResolver.ts
const placeArtRegex = /"([^"]+)":\s*\{[^}]*image:\s*["']([^"']+)["']/g;
const placeMap = new Map();
let match;
while ((match = placeArtRegex.exec(pvrContent)) !== null) {
  placeMap.set(match[1], match[2]);
}
console.log(`Found ${placeMap.size} exact place artwork mappings in placeVisualResolver.ts.`);

// Check image existence and hash uniqueness for all mapped places
const placeHashes = new Map();
let missingPlaces = 0;
for (const [key, imgPath] of placeMap.entries()) {
  const hash = fileMd5(imgPath);
  if (!hash) {
    missingPlaces++;
    console.warn(`Missing place image: ${key} -> ${imgPath}`);
  } else {
    if (!placeHashes.has(hash)) {
      placeHashes.set(hash, []);
    }
    placeHashes.get(hash).push(`${key} (${imgPath})`);
  }
}

console.log(`Place mappings with existing files: ${placeMap.size - missingPlaces}`);
console.log(`Unique visual hashes across place mappings: ${placeHashes.size}`);

// Extract vehicles
const vehicleFiles = fs.readdirSync(path.join(publicDir, 'images', 'vehicles')).filter(f => f.match(/\.(jpg|webp|png)$/i));
console.log(`Total vehicle artwork assets in /images/vehicles: ${vehicleFiles.length}`);
const vehicleHashes = new Set(vehicleFiles.map(f => fileMd5(`/images/vehicles/${f}`)).filter(Boolean));
console.log(`Unique visual hashes across vehicle artwork: ${vehicleHashes.size}`);

// Check all stays
let totalStaysFound = 0;
const stayHashes = new Set();
for (const dest of uniqueDestSlugs) {
  const staysDir = path.join(publicDir, 'images', 'places', dest, 'stays');
  if (fs.existsSync(staysDir)) {
    const sFiles = fs.readdirSync(staysDir).filter(f => f.match(/\.(jpg|webp|png)$/i));
    totalStaysFound += sFiles.length;
    for (const f of sFiles) {
      const h = fileMd5(`/images/places/${dest}/stays/${f}`);
      if (h) stayHashes.add(h);
    }
  }
}
console.log(`Total stay artwork assets found across destinations: ${totalStaysFound}`);
console.log(`Unique visual hashes across stay artwork: ${stayHashes.size}`);
