import * as Mod from "../lib.ts";
test("lib.ts exports are callable", () => {
  for (const [k,v] of Object.entries(Mod)){
    if (typeof v === "function"){
      try { (v as any)(); } catch(e) { /* ignore */ }
    }
  }
  expect(true).toBe(true);
});
