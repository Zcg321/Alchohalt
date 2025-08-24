import path from "path";
import glob from "glob";
const globSync = glob.sync;
import fs from "fs";

function list(pattern){
  const files = globSync(pattern, { nodir:true });
  return files.map(f => ({ f, bytes: fs.statSync(f).size }))
              .sort((a,b)=>b.bytes-a.bytes)
              .slice(0,25);
}

async function readCfg(){
  const p = path.resolve(".size-limit.cjs");
  if (!fs.existsSync(p)) return null;
  const mod = await import(p).catch(() => null);
  return mod && (mod.default || mod);
}

const cfg = await readCfg();
if (!cfg) { console.error("No .size-limit.cjs found. Run: npm run size:prep"); process.exit(1); }

let grand = 0;
for (const entry of cfg) {
  console.log("Pattern:", entry.path, "Limit:", entry.limit);
  const files = list(entry.path);
  if (!files.length) { console.log("  (no matches)"); continue; }
  let subtotal = 0;
  for (const {f, bytes} of files) {
    subtotal += bytes;
    console.log(" ", (bytes/1024).toFixed(1).padStart(8), "KB", f);
  }
  console.log("Subtotal:", (subtotal/1024).toFixed(1), "KB\n");
  grand += subtotal;
}
console.log("Grand total:", (grand/1024).toFixed(1), "KB");
