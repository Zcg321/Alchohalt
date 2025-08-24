import fg from "fast-glob";
import * as fs from "fs";
import * as path from "path";
const ROOT = process.cwd();
(async function main(){
  const files = await fg(["src/**/*.{ts,tsx}"], { cwd: ROOT, absolute: true });
  for (const abs of files){
    let code = fs.readFileSync(abs, "utf8");
    if (!/recharts/.test(code)) continue;
    let changed = false;
    if (code.includes("from 'recharts'" ) || code.includes("from \"recharts\"")){
      code = code.replace(/import[^;]+from ['"]recharts['"];?/g, 'import { LazyRecharts as R } from "@/shared/charts";');
      changed = true;
    }
    if (changed){
      fs.writeFileSync(abs, code, "utf8");
      console.log("[lazy-charts] updated", path.relative(ROOT, abs));
    }
  }
})();
