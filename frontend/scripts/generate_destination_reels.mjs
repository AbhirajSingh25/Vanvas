import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const FFMPEG = "C:\\ffmpeg-8.1.1-essentials_build\\bin\\ffmpeg.exe";
const REELS_DIR = path.resolve("public/videos/reels");

if (!fs.existsSync(REELS_DIR)) {
  fs.mkdirSync(REELS_DIR, { recursive: true });
}

const REEL_SPECS = [
  // Manali
  {
    output: "manali_hadimba_loop.mp4",
    input: "public/images/places/manali/hadimba-temple.webp",
  },
  {
    output: "manali_solang_valley.mp4",
    input: "public/images/places/manali/solang-valley.webp",
  },
  {
    output: "manali_jogini_falls.mp4",
    input: "public/images/places/manali/jogini-waterfall.webp",
  },
  // Dharamshala
  {
    output: "dharamshala_triund_trek.mp4",
    input: "public/images/places/dharamshala/triund-trek.webp",
  },
  {
    output: "dharamshala_bhagsunag_falls.mp4",
    input: "public/images/places/dharamshala/bhagsunag-waterfall.webp",
  },
  {
    output: "dharamshala_namgyal_monastery.mp4",
    input: "public/images/places/dharamshala/namgyal-monastery.webp",
  },
  // Kainchi Dham
  {
    output: "kainchi_ashram_morning.mp4",
    input: "public/images/places/kainchi-dham/neem-karoli-baba-ashram.webp",
  },
  {
    output: "kainchi_bhimtal_lake.mp4",
    input: "public/images/places/kainchi-dham/bhimtal-island-lake.webp",
  },
  {
    output: "kainchi_sattal_lakes.mp4",
    input: "public/images/places/kainchi-dham/sattal-interconnected-lakes.webp",
  },
  // Rishikesh
  {
    output: "rishikesh_beatles_ashram.mp4",
    input: "public/images/places/rishikesh/beatles-ashram.webp",
  },
  // Jaipur
  {
    output: "jaipur_amber_fort.mp4",
    input: "public/images/places/jaipur/amber-fort.webp",
  },
  // Udaipur
  {
    output: "udaipur_pichola_cruise.mp4",
    input: "public/images/places/udaipur/lake-pichola.webp",
  },
];

console.log(`Starting generation of ${REEL_SPECS.length} destination reel videos...`);

for (const spec of REEL_SPECS) {
  const outPath = path.join(REELS_DIR, spec.output);
  const inPath = path.resolve(spec.input);

  if (fs.existsSync(outPath) && fs.statSync(outPath).size > 100000) {
    console.log(`✓ Exists: ${spec.output}`);
    continue;
  }

  if (!fs.existsSync(inPath)) {
    console.warn(`! Missing input: ${spec.input}`);
    continue;
  }

  console.log(`Encoding ${spec.output} from ${spec.input}...`);
  try {
    const cmd = `"${FFMPEG}" -y -loop 1 -i "${inPath}" -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,zoompan=z='min(zoom+0.0015,1.15)':d=120:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=540x960" -c:v libx264 -t 4 -pix_fmt yuv420p -r 30 -movflags +faststart "${outPath}"`;
    execSync(cmd, { stdio: "ignore" });
    console.log(`✓ Generated: ${spec.output} (${(fs.statSync(outPath).size / 1024).toFixed(0)} KB)`);
  } catch (err) {
    console.error(`✗ Error generating ${spec.output}:`, err.message);
  }
}

console.log("Reels generation complete.");
