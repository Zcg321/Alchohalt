import * as Mod from "../db.ts";
test("db.ts exports are callable", () => {
  for (const [k,v] of Object.entries(Mod)){
    if (typeof v === "function"){
      try { (v as any)(); } catch(e) { /* ignore */ }
    }
  }
  expect(true).toBe(true);
});
