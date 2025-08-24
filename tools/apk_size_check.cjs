// Checks release APK size under android/app/build/outputs/apk/release/*.apk
const fs = require("fs"), path = require("path");
const glob = require("glob");
const MAX_MB = parseInt(process.env.APK_MAX_MB ?? "30", 10);
const files = glob.sync("android/app/build/outputs/apk/release/*.apk");
if (!files.length) { console.log("No release APK found; skipping size check."); process.exit(0); }
let fail = false;
for (const f of files) {
  const bytes = fs.statSync(f).size;
  const mb = (bytes / (1024*1024)).toFixed(2);
  if (parseFloat(mb) > MAX_MB) { console.error(`APK too large: ${mb} MB > ${MAX_MB} MB :: ${f}`); fail = true; }
  else { console.log(`APK OK: ${mb} MB <= ${MAX_MB} MB :: ${f}`); }
}
process.exit(fail ? 1 : 0);
