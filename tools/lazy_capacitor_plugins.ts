import fg from "fast-glob"; import * as fs from "fs"; import * as path from "path";
const ROOT = process.cwd();
(async function main(){
  const files = await fg(["src/**/*.{ts,tsx}"], { cwd: ROOT, absolute: true });
  for (const abs of files){
    if (abs.endsWith(path.join("src","shared","capacitor.ts"))) continue;
    let code = fs.readFileSync(abs, "utf8");
    let changed = false;

    // Replace static imports with shared façade usage
    if (code.match(/@capacitor\/local-notifications/)){
      code = code.replace(/import\s*{?\s*LocalNotifications\s*}?\s*from\s*["']@capacitor\/local-notifications["'];?/g, `import { getLocalNotifications } from "@/shared/capacitor";`);
      code = code.replace(/LocalNotifications\./g, `(await getLocalNotifications()).`);
      changed = true;
    }
    if (code.match(/@capacitor\/preferences/)){
      code = code.replace(/import\s*{?\s*Preferences\s*}?\s*from\s*["']@capacitor\/preferences["'];?/g, `import { getPreferences } from "@/shared/capacitor";`);
      code = code.replace(/Preferences\./g, `(await getPreferences()).`);
      changed = true;
    }

    if (changed){
      if (!code.includes('from "@/shared/capacitor"')) {
        code = `import { getLocalNotifications, getPreferences } from "@/shared/capacitor";\n` + code;
      }
      fs.writeFileSync(abs, code, "utf8");
      console.log("[lazy-capacitor] updated", path.relative(ROOT, abs));
    }
  }
})();
