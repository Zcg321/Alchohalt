import * as fs from "fs"; import * as path from "path";
const ENTRY_CANDIDATES = ["src/app/AlcoholCoachApp.tsx","src/App.tsx","src/main.tsx"];
const entry = ENTRY_CANDIDATES.find(p=>fs.existsSync(p));
if (!entry) process.exit(0);
let code = fs.readFileSync(entry, "utf8");
if (!/React\.lazy\(/.test(code)) {
  if (!/from\s+["']react["']/.test(code)) code = `import React, { Suspense } from "react";\n` + code;
  else if (!/Suspense/.test(code)) code = code.replace(/from\s+["']react["']/, 'from "react"');
  const repl = (name: string, spec: string) => {
    const rx = new RegExp(`import\\s+${name}\\s+from\\s+["']${spec}["'];?`);
    if (rx.test(code)) {
      code = code.replace(rx, `const ${name} = React.lazy(() => import("${spec}"));`);
    }
  };
  repl("RewardsStats", "./features/rewards/Stats");
  repl("DrinkForm", "./features/drinks/DrinkForm");
  repl("DrinkList", "./features/drinks/DrinkList");
  repl("SettingsPanel", "./features/settings/SettingsPanel");
  if (!/Suspense fallback/.test(code)) {
    code = code.replace(/return\s*\(/, "return (<Suspense fallback={null}>").replace(/\)\s*;\s*$/, ")</Suspense>;");
  }
  fs.writeFileSync(entry, code, "utf8");
  console.log("[auto-split-routes] updated", entry);
}
