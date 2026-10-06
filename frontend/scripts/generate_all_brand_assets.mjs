import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pythonScript = path.join(__dirname, 'generate_vanvas_brand_assets.py');

console.log('Running master symbol asset generator via python...');
try {
  execSync(`python "${pythonScript}"`, { stdio: 'inherit' });
  console.log('Brand and icon assets generated successfully from master symbol.');
} catch (error) {
  console.error('Failed to generate brand assets:', error);
  process.exit(1);
}
