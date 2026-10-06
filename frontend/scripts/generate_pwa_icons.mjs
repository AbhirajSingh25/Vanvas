import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pythonScript = path.join(__dirname, 'generate_vanvas_brand_assets.py');

console.log('Generating PWA icons from approved master symbol...');
try {
  execSync(`python "${pythonScript}"`, { stdio: 'inherit' });
  console.log('PWA icons updated successfully from master symbol.');
} catch (error) {
  console.error('Failed to generate PWA icons:', error);
  process.exit(1);
}
