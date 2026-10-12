import fs from 'fs';
import path from 'path';

// Load vehicles from backend canonical dataset or DB
const dbPath = path.resolve('vanvas.db');
const publicDir = path.resolve('frontend/public');

// We can read VehicleArtwork.tsx to extract DESTINATION_VEHICLE_REGISTRY or import it
// Let's inspect how VehicleArtwork resolves them.
import sqlite3 from 'sqlite3';

const db = new sqlite3.Database(dbPath);

db.all(`
  SELECT r.id, d.slug as dest_slug, d.name as dest_name, r.provider_name, r.vehicle_name, r.vehicle_type, r.image_url
  FROM rental_options r
  JOIN destinations d ON r.destination_id = d.id
`, (err, rows) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  console.log(`Auditing ${rows.length} rental vehicles in vanvas.db...`);
  let errors = 0;

  for (const r of rows) {
    const vName = r.vehicle_name.toLowerCase();
    const vType = r.vehicle_type.toLowerCase();
    const img = (r.image_url || '').toLowerCase();
    const diskPath = path.join(publicDir, r.image_url.replace(/^\//, ''));

    // Check disk existence
    const exists = fs.existsSync(diskPath);
    if (!exists) {
      console.error(`[MISSING ON DISK] ${r.dest_slug}: ${r.vehicle_name} -> ${r.image_url}`);
      errors++;
    }

    // Check semantic category matching
    const isScooter = vType.includes('scooter') || vName.includes('activa') || vName.includes('jupiter') || vName.includes('access') || vName.includes('ather') || vName.includes('ntorq');
    const isClassicBullet = vType.includes('classic 350') || vName.includes('bullet') || vName.includes('classic 350') || vName.includes('reborn');
    const isAdventure = vType.includes('adventure') || vName.includes('himalayan') || vName.includes('adv');
    const isCar = vType.includes('car') || vName.includes('innova') || vName.includes('thar') || vName.includes('ertiga') || vName.includes('scorpio');
    const isBicycle = vType.includes('mountain bike') || vName.includes('marlin') || vName.includes('mtb');

    if (isScooter) {
      if (img.includes('bullet') || img.includes('bike') || img.includes('motorcycle') || img.includes('car')) {
        if (!img.includes('scooter')) {
          console.error(`[COLLISION: SCOOTER USING BIKE/CAR ART] ${r.dest_slug}: ${r.vehicle_name} (${r.vehicle_type}) -> ${r.image_url}`);
          errors++;
        }
      }
    }

    if (isClassicBullet) {
      if (img.includes('scooter') || img.includes('car') || img.includes('mtb')) {
        console.error(`[COLLISION: BULLET USING SCOOTER/CAR ART] ${r.dest_slug}: ${r.vehicle_name} (${r.vehicle_type}) -> ${r.image_url}`);
        errors++;
      }
    }

    if (isAdventure) {
      if (img.includes('scooter') || img.includes('car') || img.includes('mtb')) {
        console.error(`[COLLISION: ADV USING SCOOTER/CAR ART] ${r.dest_slug}: ${r.vehicle_name} (${r.vehicle_type}) -> ${r.image_url}`);
        errors++;
      }
    }

    if (isCar) {
      if (img.includes('scooter') || img.includes('bullet') || img.includes('mtb')) {
        console.error(`[COLLISION: CAR USING BIKE/SCOOTER ART] ${r.dest_slug}: ${r.vehicle_name} (${r.vehicle_type}) -> ${r.image_url}`);
        errors++;
      }
    }

    if (isBicycle) {
      if (img.includes('scooter') || img.includes('bullet') || img.includes('car')) {
        console.error(`[COLLISION: BICYCLE USING MOTOR ART] ${r.dest_slug}: ${r.vehicle_name} (${r.vehicle_type}) -> ${r.image_url}`);
        errors++;
      }
    }
  }

  console.log(`Vehicle audit finished. Total errors: ${errors}`);
  db.close();
});
